// src/app/api/faculty/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const UpdateFacultySchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  institution: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().min(0).optional(),
  qualifications: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
  }).optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  profileImage: z.string().optional(),
});

const InvitationResponseSchema = z.object({
  response: z.enum(['ACCEPT', 'DECLINE']),
  reason: z.string().optional(),
  additionalInfo: z.object({
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    bio: z.string().optional(),
  }).optional(),
});

// GET /api/faculty/[id] - Get single faculty profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Check permissions
    const canViewFullProfile = 
      session.user.role === 'ORGANIZER' ||
      session.user.role === 'EVENT_MANAGER' ||
      session.user.id === facultyId;

    if (!canViewFullProfile) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this profile' },
        { status: 403 }
      );
    }

    // Build include clause based on permissions
    const includeClause: any = {
      userEvents: {
        where: eventId ? { eventId } : undefined,
        include: {
          event: {
            select: { 
              id: true, 
              name: true, 
              startDate: true, 
              endDate: true,
              status: true
            }
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
              eventId: true,
              hall: { select: { name: true } }
            }
          }
        }
      },
    };

    // Add sensitive data only for authorized users
    if (canViewFullProfile) {
      includeClause.travelDetails = {
        where: eventId ? { eventId } : undefined
      };
      includeClause.accommodations = {
        where: eventId ? { eventId } : undefined
      };
      includeClause.presentations = {
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
      };
      includeClause.certificates = {
        where: eventId ? { eventId } : undefined,
        select: {
          id: true,
          type: true,
          filePath: true,
          generatedAt: true
        }
      };
    }

    const faculty = await prisma.user.findUnique({
      where: { 
        id: facultyId,
        role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
      },
      include: includeClause
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Remove sensitive fields for non-authorized users
    if (!canViewFullProfile) {
      const { phone, email, emergencyContact, dietaryRequirements, ...publicProfile } = faculty;
      return NextResponse.json({
        success: true,
        data: publicProfile
      });
    }

    return NextResponse.json({
      success: true,
      data: faculty
    });

  } catch (error) {
    console.error('Faculty GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty profile' },
      { status: 500 }
    );
  }
}

// PUT /api/faculty/[id] - Update faculty profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const body = await request.json();

    // Check permissions
    const canUpdate = 
      session.user.role === 'ORGANIZER' ||
      session.user.role === 'EVENT_MANAGER' ||
      session.user.id === facultyId;

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this profile' },
        { status: 403 }
      );
    }

    // Validate faculty exists
    const existingFaculty = await prisma.user.findUnique({
      where: { 
        id: facultyId,
        role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
      }
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Validate and parse updates
    const validatedUpdates = UpdateFacultySchema.parse(body);

    // Process social links (handle empty strings)
    if (validatedUpdates.socialLinks) {
      const processedLinks: any = {};
      Object.entries(validatedUpdates.socialLinks).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          processedLinks[key] = value;
        }
      });
      validatedUpdates.socialLinks = processedLinks;
    }

    // Update faculty profile
    const updatedFaculty = await prisma.user.update({
      where: { id: facultyId },
      data: {
        ...validatedUpdates,
        updatedAt: new Date()
      },
      include: {
        userEvents: {
          include: {
            event: {
              select: { 
                id: true, 
                name: true, 
                startDate: true, 
                endDate: true 
              }
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedFaculty,
      message: 'Faculty profile updated successfully'
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
      { error: 'Failed to update faculty profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/faculty/[id] - Remove faculty from system
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const removeFromSystem = searchParams.get('removeFromSystem') === 'true';

    // Check permissions - only organizers can remove faculty
    if (session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Only organizers can remove faculty' },
        { status: 403 }
      );
    }

    // Validate faculty exists
    const existingFaculty = await prisma.user.findUnique({
      where: { 
        id: facultyId,
        role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
      }
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    if (removeFromSystem) {
      // Complete removal from system (use with caution)
      await prisma.user.delete({
        where: { id: facultyId }
      });

      return NextResponse.json({
        success: true,
        message: 'Faculty member removed from system completely'
      });
    } else if (eventId) {
      // Remove from specific event only
      await prisma.userEvent.deleteMany({
        where: {
          userId: facultyId,
          eventId: eventId
        }
      });

      // Also remove from session speakers for this event
      await prisma.sessionSpeaker.deleteMany({
        where: {
          userId: facultyId,
          session: { eventId: eventId }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Faculty member removed from event'
      });
    } else {
      return NextResponse.json(
        { error: 'Either eventId or removeFromSystem parameter is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Faculty DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove faculty member' },
      { status: 500 }
    );
  }
}

// PATCH /api/faculty/[id] - Handle invitation responses
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facultyId = params.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'respond-invitation') {
      return await handleInvitationResponse(facultyId, body);
    } else if (action === 'resend-invitation') {
      return await handleResendInvitation(facultyId, body);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Faculty PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function: Handle invitation response
async function handleInvitationResponse(facultyId: string, body: any) {
  const validatedData = InvitationResponseSchema.parse(body);
  const { response, reason, additionalInfo } = validatedData;

  // Update user event status
  const updatedUserEvent = await prisma.userEvent.updateMany({
    where: { 
      userId: facultyId,
      status: 'PENDING'
    },
    data: {
      status: response === 'ACCEPT' ? 'ACTIVE' : 'DECLINED',
      responseAt: new Date(),
      responseReason: reason
    }
  });

  // If accepted, update profile with additional info
  if (response === 'ACCEPT' && additionalInfo) {
    await prisma.user.update({
      where: { id: facultyId },
      data: {
        bio: additionalInfo.bio || undefined,
        dietaryRequirements: additionalInfo.dietaryRequirements || undefined,
        emergencyContact: additionalInfo.emergencyContact || undefined,
        emailVerified: new Date() // Mark email as verified
      }
    });
  }

  return NextResponse.json({
    success: true,
    data: { response, facultyId },
    message: response === 'ACCEPT' 
      ? 'Invitation accepted successfully!' 
      : 'Invitation declined'
  });
}

// Helper function: Resend invitation
async function handleResendInvitation(facultyId: string, body: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, customMessage } = body;

  // Get faculty and event details
  const faculty = await prisma.user.findUnique({
    where: { id: facultyId }
  });

  const userEvent = await prisma.userEvent.findFirst({
    where: {
      userId: facultyId,
      eventId: eventId
    },
    include: {
      event: { select: { name: true } }
    }
  });

  if (!faculty || !userEvent) {
    return NextResponse.json(
      { error: 'Faculty or event association not found' },
      { status: 404 }
    );
  }

  // Generate new invitation token
  const invitationToken = Buffer.from(
    JSON.stringify({
      userId: facultyId,
      eventId: eventId,
      email: faculty.email,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })
  ).toString('base64');

  // Log email for resending
  await prisma.emailLog.create({
    data: {
      recipient: faculty.email,
      subject: `Reminder: Invitation to ${userEvent.event?.name}`,
      content: customMessage || `This is a reminder about your invitation to participate in our conference.`,
      type: 'FACULTY_INVITATION_REMINDER',
      status: 'PENDING',
      metadata: {
        eventId: eventId,
        facultyId: facultyId,
        invitationToken
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Invitation resent successfully',
    data: { facultyId, eventId, invitationToken }
  });
}