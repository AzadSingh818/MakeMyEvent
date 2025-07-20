// src/app/api/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';
import { createApiHandler, getPagination, getSorting, getSearchFilter } from '@/lib/api/middleware';

// Validation schemas
const CreateRegistrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  registrationData: z.object({
    participantType: z.enum(['DELEGATE', 'SPEAKER', 'SPONSOR', 'VOLUNTEER']).default('DELEGATE'),
    institution: z.string().optional(),
    designation: z.string().optional(),
    experience: z.number().optional(),
    specialization: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    sessionPreferences: z.array(z.string()).optional(),
    accommodationRequired: z.boolean().default(false),
    transportRequired: z.boolean().default(false),
    certificateRequired: z.boolean().default(true),
    additionalRequirements: z.string().optional(),
    consentForPhotography: z.boolean().default(false),
    consentForMarketing: z.boolean().default(false),
  }),
  paymentInfo: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().default('INR'),
    paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'BANK_TRANSFER', 'CHEQUE', 'FREE']).optional(),
    transactionId: z.string().optional(),
    paymentDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
});

const UpdateRegistrationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLIST']).optional(),
  registrationData: z.object({
    participantType: z.enum(['DELEGATE', 'SPEAKER', 'SPONSOR', 'VOLUNTEER']).optional(),
    institution: z.string().optional(),
    designation: z.string().optional(),
    experience: z.number().optional(),
    specialization: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    sessionPreferences: z.array(z.string()).optional(),
    accommodationRequired: z.boolean().optional(),
    transportRequired: z.boolean().optional(),
    certificateRequired: z.boolean().optional(),
    additionalRequirements: z.string().optional(),
    consentForPhotography: z.boolean().optional(),
    consentForMarketing: z.boolean().optional(),
  }).optional(),
  paymentInfo: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'BANK_TRANSFER', 'CHEQUE', 'FREE']).optional(),
    transactionId: z.string().optional(),
    paymentDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
  reviewNotes: z.string().optional(),
});

// GET /api/registrations - Get all registrations with filters
export const GET = createApiHandler({
  requireAuth: true,
  allowedRoles: ['ORGANIZER', 'EVENT_MANAGER', 'DELEGATE']
})(async (request: NextRequest, context: any, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');
    const participantType = searchParams.get('participantType');
    const { page, limit, skip } = getPagination(searchParams);
    const { sortBy, sortOrder } = getSorting(searchParams, [
      'createdAt', 'updatedAt', 'registrationData', 'status'
    ]);

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (user.role === 'DELEGATE') {
      where.userId = user.id; // Users can only see their own registrations
    } else if (eventId) {
      where.eventId = eventId;
      
      // Verify event access for organizers/managers
      if (!['ORGANIZER', 'EVENT_MANAGER'].includes(user.role)) {
        const userEvent = await prisma.userEvent.findFirst({
          where: {
            userId: user.id,
            eventId: eventId,
            permissions: { has: 'READ' }
          }
        });

        if (!userEvent) {
          return NextResponse.json(
            { error: 'Access denied to event registrations' },
            { status: 403 }
          );
        }
      }
    }

    if (status) {
      where.status = status;
    }

    if (participantType) {
      where.registrationData = {
        path: ['participantType'],
        equals: participantType
      };
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }
        },
        {
          registrationData: {
            path: ['institution'],
            string_contains: search
          }
        }
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              profileImage: true
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              location: true
            }
          },
          reviewedByUser: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.registration.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Registrations GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
});

// POST /api/registrations - Create new registration
export const POST = createApiHandler({
  requireAuth: true
})(async (request: NextRequest, context: any, user: any) => {
  try {
    const body = await request.json();
    const validatedData = CreateRegistrationSchema.parse(body);

    // Check if event exists and is open for registration
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        registrationDeadline: true,
        maxParticipants: true,
        _count: { select: { registrations: true } }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event is not open for registration' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Check if user already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        userId: user.id,
        eventId: validatedData.eventId
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 409 }
      );
    }

    // Check capacity
    let status = 'PENDING';
    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      status = 'WAITLIST';
    }

    // Generate registration number
    const registrationNumber = `REG-${event.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const registration = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId: validatedData.eventId,
        registrationNumber,
        status,
        registrationData: validatedData.registrationData,
        paymentInfo: validatedData.paymentInfo || {},
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        event: {
          select: { id: true, name: true, startDate: true, endDate: true }
        }
      }
    });

    // Log email for confirmation
    await prisma.emailLog.create({
      data: {
        recipient: user.email,
        subject: `Registration Confirmation - ${event.name}`,
        content: `Your registration for ${event.name} has been submitted successfully. Registration Number: ${registrationNumber}`,
        type: 'REGISTRATION_CONFIRMATION',
        status: 'PENDING',
        metadata: {
          registrationId: registration.id,
          registrationNumber
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: registration,
      message: `Registration ${status === 'WAITLIST' ? 'added to waitlist' : 'submitted'} successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Registrations POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
});

// PUT /api/registrations - Bulk update registrations
export const PUT = createApiHandler({
  requireAuth: true,
  allowedRoles: ['ORGANIZER', 'EVENT_MANAGER']
})(async (request: NextRequest, context: any, user: any) => {
  try {
    const body = await request.json();
    const { registrationIds, updates } = body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateRegistrationSchema.parse(updates);

    // Verify permissions for each registration
    const registrations = await prisma.registration.findMany({
      where: { id: { in: registrationIds } },
      include: {
        event: {
          include: {
            userEvents: {
              where: {
                userId: user.id,
                permissions: { has: 'WRITE' }
              }
            }
          }
        }
      }
    });

    const allowedRegistrationIds = registrations
      .filter(r => r.event.userEvents.length > 0 || r.event.createdBy === user.id)
      .map(r => r.id);
    
    if (allowedRegistrationIds.length !== registrationIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some registrations' },
        { status: 403 }
      );
    }

    // Update registrations
    const updateData: any = { updatedAt: new Date() };
    
    if (validatedUpdates.status) {
      updateData.status = validatedUpdates.status;
      updateData.reviewedBy = user.id;
      updateData.reviewedAt = new Date();
    }

    if (validatedUpdates.registrationData) {
      updateData.registrationData = validatedUpdates.registrationData;
    }

    if (validatedUpdates.paymentInfo) {
      updateData.paymentInfo = validatedUpdates.paymentInfo;
    }

    if (validatedUpdates.reviewNotes) {
      updateData.reviewNotes = validatedUpdates.reviewNotes;
    }

    const updatedRegistrations = await prisma.registration.updateMany({
      where: { id: { in: allowedRegistrationIds } },
      data: updateData
    });

    // Send status update emails
    if (validatedUpdates.status) {
      const registrationsToEmail = await prisma.registration.findMany({
        where: { id: { in: allowedRegistrationIds } },
        include: {
          user: { select: { email: true, name: true } },
          event: { select: { name: true } }
        }
      });

      for (const reg of registrationsToEmail) {
        await prisma.emailLog.create({
          data: {
            recipient: reg.user.email,
            subject: `Registration Status Update - ${reg.event.name}`,
            content: `Your registration status has been updated to: ${validatedUpdates.status}`,
            type: 'REGISTRATION_STATUS_UPDATE',
            status: 'PENDING',
            metadata: {
              registrationId: reg.id,
              newStatus: validatedUpdates.status
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedRegistrations.count },
      message: `${updatedRegistrations.count} registrations updated successfully`
    });

  } catch (error) {
    console.error('Registrations PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update registrations' },
      { status: 500 }
    );
  }
});

// DELETE /api/registrations - Cancel registrations
export const DELETE = createApiHandler({
  requireAuth: true
})(async (request: NextRequest, context: any, user: any) => {
  try {
    const body = await request.json();
    const { registrationIds, reason } = body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const registrations = await prisma.registration.findMany({
      where: { id: { in: registrationIds } },
      include: {
        event: { select: { createdBy: true, startDate: true } },
        user: { select: { id: true } }
      }
    });

    const allowedRegistrationIds = registrations.filter(r => {
      // Users can cancel their own registrations
      if (r.user.id === user.id) return true;
      // Organizers can cancel any registration for their events
      if (['ORGANIZER', 'EVENT_MANAGER'].includes(user.role) && r.event.createdBy === user.id) return true;
      return false;
    }).map(r => r.id);

    if (allowedRegistrationIds.length !== registrationIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel some registrations' },
        { status: 403 }
      );
    }

    // Check if event has already started
    const startedEvents = registrations.filter(r => r.event.startDate <= new Date());
    if (startedEvents.length > 0 && user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Cannot cancel registration for events that have already started' },
        { status: 400 }
      );
    }

    // Update status to CANCELLED instead of actual deletion
    const cancelledRegistrations = await prisma.registration.updateMany({
      where: { id: { in: allowedRegistrationIds } },
      data: {
        status: 'CANCELLED',
        reviewNotes: reason || 'Registration cancelled',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: { cancelledCount: cancelledRegistrations.count },
      message: `${cancelledRegistrations.count} registrations cancelled successfully`
    });

  } catch (error) {
    console.error('Registrations DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel registrations' },
      { status: 500 }
    );
  }
});