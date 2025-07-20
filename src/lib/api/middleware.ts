// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';

// Types for middleware
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface MiddlewareConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  requireEventAccess?: boolean;
  requirePermissions?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit middleware
export function createRateLimit(windowMs: number = 15 * 60 * 1000, max: number = 100) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= max) {
      return false;
    }

    record.count++;
    return true;
  };
}

// Authentication middleware
export async function requireAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        status: 401
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'Account is disabled',
        status: 403
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (user: any): { success: boolean; error?: string; status?: number } => {
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        status: 403
      };
    }

    return { success: true };
  };
}

// Event access middleware
export async function requireEventAccess(
  userId: string,
  eventId: string,
  requiredPermissions: string[] = ['READ']
): Promise<{
  success: boolean;
  userEvent?: any;
  error?: string;
  status?: number;
}> {
  try {
    if (!eventId) {
      return {
        success: false,
        error: 'Event ID is required',
        status: 400
      };
    }

    // Check if user has access to the event
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId,
        eventId,
      },
      include: {
        event: {
          select: { id: true, name: true, status: true, createdBy: true }
        }
      }
    });

    if (!userEvent) {
      // Check if it's a public event for certain roles
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { status: true, createdBy: true }
      });

      if (!event) {
        return {
          success: false,
          error: 'Event not found',
          status: 404
        };
      }

      // Event creator always has access
      if (event.createdBy === userId) {
        return { success: true };
      }

      // Public access for published events (read-only)
      if (event.status === 'PUBLISHED' && requiredPermissions.every(p => p === 'READ')) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Access denied to this event',
        status: 403
      };
    }

    // Check permissions
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userEvent.permissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        status: 403
      };
    }

    return {
      success: true,
      userEvent
    };
  } catch (error) {
    console.error('Event access middleware error:', error);
    return {
      success: false,
      error: 'Failed to verify event access',
      status: 500
    };
  }
}

// Validation middleware
export function validateSchema<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    details?: any;
    status?: number;
  }> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors,
          status: 400
        };
      }

      return {
        success: false,
        error: 'Invalid request data',
        status: 400
      };
    }
  };
}

// Combined middleware function
export async function withMiddleware(
  request: NextRequest,
  config: MiddlewareConfig = {}
) {
  const {
    requireAuth: needsAuth = true,
    allowedRoles = [],
    requireEventAccess: needsEventAccess = false,
    requirePermissions = ['READ'],
    rateLimit: rateLimitConfig
  } = config;

  // Rate limiting
  if (rateLimitConfig) {
    const identifier = request.ip || 'anonymous';
    const isAllowed = createRateLimit(
      rateLimitConfig.windowMs,
      rateLimitConfig.max
    )(identifier);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  // Authentication
  let user;
  if (needsAuth) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 500 }
      );
    }
    user = authResult.user;
  }

  // Role authorization
  if (allowedRoles.length > 0 && user) {
    const roleResult = requireRole(allowedRoles)(user);
    if (!roleResult.success) {
      return NextResponse.json(
        { error: roleResult.error },
        { status: roleResult.status || 403 }
      );
    }
  }

  // Event access
  if (needsEventAccess && user) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || 
                   (await request.clone().json().catch(() => ({})))?.eventId;

    if (eventId) {
      const eventAccessResult = await requireEventAccess(
        user.id,
        eventId,
        requirePermissions
      );

      if (!eventAccessResult.success) {
        return NextResponse.json(
          { error: eventAccessResult.error },
          { status: eventAccessResult.status || 403 }
        );
      }
    }
  }

  return { user };
}

// Error handling middleware
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.errors
      },
      { status: 400 }
    );
  }

  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'A record with this data already exists' },
      { status: 409 }
    );
  }

  if (error.code === 'P2025') {
    return NextResponse.json(
      { error: 'Record not found' },
      { status: 404 }
    );
  }

  if (error.code === 'P2003') {
    return NextResponse.json(
      { error: 'Related record not found' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Success response helper
export function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  );
}

// Error response helper
export function errorResponse(error: string, status: number = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error,
      details
    },
    { status }
  );
}

// Pagination helper
export function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 items
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Sorting helper
export function getSorting(searchParams: URLSearchParams, allowedFields: string[] = []) {
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Validate sortBy field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return { sortBy: 'createdAt', sortOrder };
  }

  return { sortBy, sortOrder };
}

// Search helper
export function getSearchFilter(searchParams: URLSearchParams, searchFields: string[]) {
  const search = searchParams.get('search');
  
  if (!search || searchFields.length === 0) {
    return {};
  }

  return {
    OR: searchFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const
      }
    }))
  };
}

// Middleware wrapper for API routes
export function createApiHandler(config: MiddlewareConfig = {}) {
  return function (
    handler: (request: NextRequest, context: any, user?: any) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context: any) {
      try {
        const middlewareResult = await withMiddleware(request, config);
        
        if (middlewareResult instanceof NextResponse) {
          return middlewareResult;
        }

        return await handler(request, context, middlewareResult.user);
      } catch (error) {
        return handleApiError(error);
      }
    };
  };
}