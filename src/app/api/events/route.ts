// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const CreateEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  location: z.string().min(1, 'Location is required'),
  venue: z.string().optional(),
  maxParticipants: z.number().positive().optional(),
  registrationDeadline: z.string().transform((str) => new Date(str)).optional(),
  eventType: z.enum(['CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SYMPOSIUM']).default('CONFERENCE'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  tags: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
});

const UpdateEventSchema = CreateEventSchema.partial();

// GET /api/events - Get all events with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // Role-based filtering
    if (session.user.role === 'ORGANIZER') {
      where.createdBy = session.user.id;
    } else if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      where.status = 'PUBLISHED'; // Only published events for other roles
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true }
          },
          sessions: {
            select: { id: true, title: true, startTime: true, endTime: true }
          },
          registrations: {
            select: { id: true, status: true }
          },
          _count: {
            select: {
              sessions: true,
              registrations: true,
              userEvents: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Events GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateEventSchema.parse(body);

    // Validate dates
    if (validatedData.startDate >= validatedData.endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            sessions: true,
            registrations: true,
            userEvents: true
          }
        }
      }
    });

    // Create organizer relationship
    await prisma.userEvent.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        role: 'ORGANIZER',
        permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE']
      }
    });

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Events POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT /api/events - Bulk update events
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds, updates } = body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateEventSchema.parse(updates);

    // Check permissions for each event
    const userEvents = await prisma.userEvent.findMany({
      where: {
        userId: session.user.id,
        eventId: { in: eventIds },
        permissions: { has: 'WRITE' }
      }
    });

    const allowedEventIds = userEvents.map(ue => ue.eventId);
    
    if (allowedEventIds.length !== eventIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some events' },
        { status: 403 }
      );
    }

    const updatedEvents = await prisma.event.updateMany({
      where: { id: { in: allowedEventIds } },
      data: validatedUpdates
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedEvents.count },
      message: `${updatedEvents.count} events updated successfully`
    });

  } catch (error) {
    console.error('Events PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update events' },
      { status: 500 }
    );
  }
}

// DELETE /api/events - Bulk delete events
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds } = body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions for each event
    const userEvents = await prisma.userEvent.findMany({
      where: {
        userId: session.user.id,
        eventId: { in: eventIds },
        permissions: { has: 'DELETE' }
      }
    });

    const allowedEventIds = userEvents.map(ue => ue.eventId);
    
    if (allowedEventIds.length !== eventIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some events' },
        { status: 403 }
      );
    }

    // Soft delete - update status instead of actual deletion
    const deletedEvents = await prisma.event.updateMany({
      where: { id: { in: allowedEventIds } },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: deletedEvents.count },
      message: `${deletedEvents.count} events deleted successfully`
    });

  } catch (error) {
    console.error('Events DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete events' },
      { status: 500 }
    );
  }
}