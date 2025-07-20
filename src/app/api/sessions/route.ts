// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const CreateSessionSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
  hallId: z.string().optional(),
  sessionType: z.enum(['KEYNOTE', 'PRESENTATION', 'PANEL', 'WORKSHOP', 'POSTER', 'BREAK']).default('PRESENTATION'),
  maxParticipants: z.number().positive().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isBreak: z.boolean().default(false),
  speakers: z.array(z.object({
    userId: z.string(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON'])
  })).optional(),
});

const UpdateSessionSchema = CreateSessionSchema.partial().omit({ eventId: true });

// GET /api/sessions - Get all sessions with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const hallId = searchParams.get('hallId');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sessionType = searchParams.get('sessionType');
    const speakerId = searchParams.get('speakerId');
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
      
      // Check if user has access to this event
      const userEvent = await prisma.userEvent.findFirst({
        where: {
          userId: session.user.id,
          eventId: eventId,
          permissions: { has: 'READ' }
        }
      });

      if (!userEvent && session.user.role !== 'ORGANIZER') {
        // Check if event is published for non-associated users
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { status: true }
        });

        if (!event || event.status !== 'PUBLISHED') {
          return NextResponse.json(
            { error: 'Access denied to event sessions' },
            { status: 403 }
          );
        }
      }
    }

    if (hallId) {
      where.hallId = hallId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (sessionType) {
      where.sessionType = sessionType;
    }

    if (speakerId) {
      where.speakers = {
        some: {
          userId: speakerId
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          event: {
            select: { id: true, name: true, startDate: true, endDate: true }
          },
          hall: {
            select: { id: true, name: true, capacity: true, equipment: true }
          },
          speakers: {
            include: {
              user: {
                select: { 
                  id: true, 
                  name: true, 
                  email: true, 
                  designation: true, 
                  institution: true,
                  profileImage: true 
                }
              }
            }
          },
          presentations: {
            select: { 
              id: true, 
              title: true, 
              filePath: true, 
              uploadedAt: true,
              user: { select: { name: true } }
            }
          },
          attendanceRecords: {
            select: { id: true, userId: true, timestamp: true, method: true }
          },
          _count: {
            select: {
              speakers: true,
              presentations: true,
              attendanceRecords: true
            }
          }
        }
      }),
      prisma.session.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Sessions GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateSessionSchema.parse(body);

    // Verify event access
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        userId: session.user.id,
        eventId: validatedData.eventId,
        permissions: { has: 'WRITE' }
      }
    });

    if (!userEvent) {
      return NextResponse.json(
        { error: 'No permission to create sessions for this event' },
        { status: 403 }
      );
    }

    // Validate session times
    if (validatedData.startTime >= validatedData.endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for schedule conflicts
    if (validatedData.hallId) {
      const conflictingSessions = await prisma.session.findMany({
        where: {
          hallId: validatedData.hallId,
          OR: [
            {
              startTime: {
                lt: validatedData.endTime,
                gte: validatedData.startTime
              }
            },
            {
              endTime: {
                gt: validatedData.startTime,
                lte: validatedData.endTime
              }
            },
            {
              startTime: { lte: validatedData.startTime },
              endTime: { gte: validatedData.endTime }
            }
          ]
        },
        select: { id: true, title: true, startTime: true, endTime: true }
      });

      if (conflictingSessions.length > 0) {
        return NextResponse.json({
          error: 'Hall is already booked during this time',
          conflicts: conflictingSessions
        }, { status: 409 });
      }
    }

    // Create session
    const { speakers, ...sessionData } = validatedData;
    
    const newSession = await prisma.session.create({
      data: {
        ...sessionData,
        createdBy: session.user.id,
      },
      include: {
        event: {
          select: { id: true, name: true }
        },
        hall: {
          select: { id: true, name: true, capacity: true }
        }
      }
    });

    // Add speakers if provided
    if (speakers && speakers.length > 0) {
      await prisma.sessionSpeaker.createMany({
        data: speakers.map(speaker => ({
          sessionId: newSession.id,
          userId: speaker.userId,
          role: speaker.role
        }))
      });
    }

    // Fetch complete session with speakers
    const completeSession = await prisma.session.findUnique({
      where: { id: newSession.id },
      include: {
        event: {
          select: { id: true, name: true }
        },
        hall: {
          select: { id: true, name: true, capacity: true }
        },
        speakers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, designation: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeSession,
      message: 'Session created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Sessions POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions - Bulk update sessions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds, updates } = body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateSessionSchema.parse(updates);

    // Check permissions for each session
    const sessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
      include: {
        event: {
          include: {
            userEvents: {
              where: {
                userId: session.user.id,
                permissions: { has: 'WRITE' }
              }
            }
          }
        }
      }
    });

    const allowedSessionIds = sessions
      .filter(s => s.event.userEvents.length > 0)
      .map(s => s.id);
    
    if (allowedSessionIds.length !== sessionIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some sessions' },
        { status: 403 }
      );
    }

    const updatedSessions = await prisma.session.updateMany({
      where: { id: { in: allowedSessionIds } },
      data: {
        ...validatedUpdates,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedSessions.count },
      message: `${updatedSessions.count} sessions updated successfully`
    });

  } catch (error) {
    console.error('Sessions PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update sessions' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions - Bulk delete sessions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds } = body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions for each session
    const sessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
      include: {
        event: {
          include: {
            userEvents: {
              where: {
                userId: session.user.id,
                permissions: { has: 'DELETE' }
              }
            }
          }
        }
      }
    });

    const allowedSessionIds = sessions
      .filter(s => s.event.userEvents.length > 0)
      .map(s => s.id);
    
    if (allowedSessionIds.length !== sessionIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some sessions' },
        { status: 403 }
      );
    }

    // Check if any sessions have already started
    const currentTime = new Date();
    const startedSessions = sessions.filter(s => s.startTime <= currentTime);
    
    if (startedSessions.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete sessions that have already started',
        startedSessions: startedSessions.map(s => ({ id: s.id, title: s.title }))
      }, { status: 400 });
    }

    // Delete related records first
    await prisma.sessionSpeaker.deleteMany({
      where: { sessionId: { in: allowedSessionIds } }
    });

    await prisma.presentation.deleteMany({
      where: { sessionId: { in: allowedSessionIds } }
    });

    await prisma.attendanceRecord.deleteMany({
      where: { sessionId: { in: allowedSessionIds } }
    });

    // Delete sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { id: { in: allowedSessionIds } }
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: deletedSessions.count },
      message: `${deletedSessions.count} sessions deleted successfully`
    });

  } catch (error) {
    console.error('Sessions DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 }
    );
  }
}