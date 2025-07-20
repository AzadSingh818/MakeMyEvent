// src/app/api/faculty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const FacultyInviteSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  facultyList: z.array(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    institution: z.string().optional(),
    specialization: z.string().optional(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER'),
    sessionId: z.string().optional(),
    invitationMessage: z.string().optional(),
  }))
});

const UpdateFacultySchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  institution: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().optional(),
  qualifications: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
});

// GET /api/faculty - Get all faculty with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const institution = searchParams.get('institution');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
    };

    if (eventId) {
      where.userEvents = {
        some: {
          eventId: eventId,
          permissions: { has: 'READ' }
        }
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (institution) {
      where.institution = { contains: institution, mode: 'insensitive' };
    }

    const [faculty, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          designation: true,
          institution: true,
          specialization: true,
          bio: true,
          profileImage: true,
          experience: true,
          qualifications: true,
          achievements: true,
          socialLinks: true,
          dietaryRequirements: true,
          emergencyContact: true,
          createdAt: true,
          updatedAt: true,
          userEvents: {
            where: eventId ? { eventId } : undefined,
            include: {
              event: {
                select: { id: true, name: true, startDate: true, endDate: true }
              }
            }
          },
          sessionSpeakers: {
            include: {
              session: {
                select: { 
                  id: true, 
                  title: true, 
                  startTime: true, 
                  endTime: true,
                  hall: { select: { name: true } }
                }
              }
            }
          },
          travelDetails: {
            where: eventId ? { eventId } : undefined
          },
          accommodations: {
            where: eventId ? { eventId } : undefined
          },
          presentations: {
            where: eventId ? { 
              session: { eventId } 
            } : undefined,
            select: {
              id: true,
              title: true,
              filePath: true,
              uploadedAt: true,
              session: { select: { title: true } }
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        faculty,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Faculty GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

// POST /api/faculty - Send faculty invitations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite faculty' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = FacultyInviteSchema.parse(body);

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
        { error: 'No permission to invite faculty for this event' },
        { status: 403 }
      );
    }

    const results = [];
    const errors = [];

    for (const faculty of validatedData.facultyList) {
      try {
        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { email: faculty.email }
        });

        if (!user) {
          // Create new user account
          user = await prisma.user.create({
            data: {
              name: faculty.name,
              email: faculty.email,
              phone: faculty.phone,
              role: 'FACULTY',
              designation: faculty.designation,
              institution: faculty.institution,
              specialization: faculty.specialization,
              // Generate temporary password - user will reset on first login
              password: 'temp_password_' + Math.random().toString(36).slice(-8),
              emailVerified: null, // Will be verified when they accept invitation
            }
          });
        }

        // Create event association
        const existingAssociation = await prisma.userEvent.findFirst({
          where: {
            userId: user.id,
            eventId: validatedData.eventId
          }
        });

        if (!existingAssociation) {
          await prisma.userEvent.create({
            data: {
              userId: user.id,
              eventId: validatedData.eventId,
              role: faculty.role,
              permissions: ['READ'],
              invitedBy: session.user.id,
              invitedAt: new Date(),
              status: 'PENDING'
            }
          });
        }

        // Create session speaker association if sessionId provided
        if (faculty.sessionId) {
          const existingSpeaker = await prisma.sessionSpeaker.findFirst({
            where: {
              userId: user.id,
              sessionId: faculty.sessionId
            }
          });

          if (!existingSpeaker) {
            await prisma.sessionSpeaker.create({
              data: {
                userId: user.id,
                sessionId: faculty.sessionId,
                role: faculty.role
              }
            });
          }
        }

        // Generate invitation token
        const invitationToken = Buffer.from(
          JSON.stringify({
            userId: user.id,
            eventId: validatedData.eventId,
            email: faculty.email,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          })
        ).toString('base64');

        // Log email for sending (actual email sending would be handled by email service)
        await prisma.emailLog.create({
          data: {
            recipient: faculty.email,
            subject: `Invitation to ${userEvent.event?.name || 'Conference'}`,
            content: faculty.invitationMessage || `You are invited to participate as ${faculty.role} in our conference.`,
            type: 'FACULTY_INVITATION',
            status: 'PENDING',
            metadata: {
              eventId: validatedData.eventId,
              facultyRole: faculty.role,
              invitationToken
            }
          }
        });

        results.push({
          email: faculty.email,
          name: faculty.name,
          status: 'invited',
          userId: user.id,
          invitationToken
        });

      } catch (facultyError) {
        console.error(`Error inviting ${faculty.email}:`, facultyError);
        errors.push({
          email: faculty.email,
          error: 'Failed to send invitation'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        invited: results,
        errors: errors,
        summary: {
          total: validatedData.facultyList.length,
          successful: results.length,
          failed: errors.length
        }
      },
      message: `${results.length} faculty invitations sent successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Faculty POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send faculty invitations' },
      { status: 500 }
    );
  }
}

// PUT /api/faculty - Bulk update faculty
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { facultyIds, updates, eventId } = body;

    if (!Array.isArray(facultyIds) || facultyIds.length === 0) {
      return NextResponse.json(
        { error: 'Faculty IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateFacultySchema.parse(updates);

    // Check permissions
    if (session.user.role === 'FACULTY') {
      // Faculty can only update their own profile
      if (facultyIds.length !== 1 || facultyIds[0] !== session.user.id) {
        return NextResponse.json(
          { error: 'Can only update your own profile' },
          { status: 403 }
        );
      }
    } else if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updatedFaculty = await prisma.user.updateMany({
      where: { 
        id: { in: facultyIds },
        role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
      },
      data: {
        ...validatedUpdates,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedFaculty.count },
      message: `${updatedFaculty.count} faculty profiles updated successfully`
    });

  } catch (error) {
    console.error('Faculty PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update faculty' },
      { status: 500 }
    );
  }
}