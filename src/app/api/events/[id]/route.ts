// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';

const UpdateEventSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  location: z.string().min(1).optional(),
  venue: z.string().optional(),
  maxParticipants: z.number().positive().optional(),
  registrationDeadline: z.string().transform((str) => new Date(str)).optional(),
  eventType: z.enum(['CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SYMPOSIUM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  tags: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
});

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check if user has access to this event
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        permissions: { has: 'READ' }
      }
    });

    // If not directly associated, check if it's a published event
    if (!userEvent) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { status: true }
      });

      if (!event || event.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, phone: true }
        },
        sessions: {
          include: {
            speakers: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true }
                }
              }
            },
            hall: {
              select: { id: true, name: true, capacity: true }
            },
            presentations: {
              select: { id: true, title: true, filePath: true, uploadedAt: true }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          where: { status: 'APPROVED' }
        },
        userEvents: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        halls: {
          select: { id: true, name: true, capacity: true, equipment: true }
        },
        _count: {
          select: {
            sessions: true,
            registrations: true,
            userEvents: true,
            abstracts: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Event GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update single event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check permissions
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        permissions: { has: 'WRITE' }
      }
    });

    if (!userEvent) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateEventSchema.parse(body);

    // Validate dates if both are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.startDate >= validatedData.endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...validatedData,
        updatedAt: new Date()
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

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Event PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete single event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Check permissions
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        permissions: { has: 'DELETE' }
      }
    });

    if (!userEvent) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this event' },
        { status: 403 }
      );
    }

    // Check if event has active sessions
    const activeSessions = await prisma.session.count({
      where: {
        eventId: eventId,
        startTime: { gt: new Date() }
      }
    });

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with upcoming sessions' },
        { status: 400 }
      );
    }

    // Soft delete - update status instead of actual deletion
    const deletedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      select: { id: true, name: true, status: true }
    });

    return NextResponse.json({
      success: true,
      data: deletedEvent,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Event DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] - Partial update (for status changes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();
    const { action, ...data } = body;

    // Check permissions
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        permissions: { has: 'WRITE' }
      }
    });

    if (!userEvent) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let updateData: any = { updatedAt: new Date() };

    switch (action) {
      case 'PUBLISH':
        updateData.status = 'PUBLISHED';
        break;
      case 'UNPUBLISH':
        updateData.status = 'DRAFT';
        break;
      case 'START':
        updateData.status = 'ONGOING';
        break;
      case 'COMPLETE':
        updateData.status = 'COMPLETED';
        break;
      case 'CANCEL':
        updateData.status = 'CANCELLED';
        break;
      default:
        // Regular partial update
        const validatedData = UpdateEventSchema.parse(data);
        updateData = { ...updateData, ...validatedData };
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: `Event ${action?.toLowerCase() || 'updated'} successfully`
    });

  } catch (error) {
    console.error('Event PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}