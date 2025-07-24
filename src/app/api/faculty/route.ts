// src/app/api/faculty/route.ts - FIXED: Raw SQL Version
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection'; // ✅ FIXED: Use raw SQL query instead of prisma
import { z } from 'zod';

// ✅ FIXED: Validation schemas with proper roles
const FacultyInviteSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  facultyList: z.array(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    institution: z.string().optional(),
    specialization: z.string().optional(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER'), // ✅ Event roles for user_events table
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

// ✅ FIXED: Safe JSON parsing helper
function safeJSONParse(jsonString: any, fallback: any = null): any {
  if (!jsonString) return fallback;
  if (typeof jsonString !== 'string') return fallback;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn(`Invalid JSON data: ${jsonString}`, error);
    return fallback;
  }
}

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
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // ✅ FIXED: Build WHERE conditions for raw SQL
    const whereConditions = [];
    const queryParams = [];
    let paramCount = 0;

    // ✅ FIXED: Only FACULTY role exists in users table
    whereConditions.push(`u.role = 'FACULTY'`);

    // Event filter - faculty associated with specific event
    if (eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount}
      )`);
      queryParams.push(eventId);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        u.name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        u.institution ILIKE $${paramCount} OR 
        u.specialization ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Institution filter
    if (institution) {
      paramCount++;
      whereConditions.push(`u.institution ILIKE $${paramCount}`);
      queryParams.push(`%${institution}%`);
    }

    // Role filter - for event roles in user_events table
    if (role && eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount - (eventId ? 1 : 0)}
        AND ue.role = $${paramCount}
      )`);
      queryParams.push(role);
    }

    // Status filter - for event status in user_events table
    if (status && eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount - (eventId ? 1 : 0) - (role ? 1 : 0)}
        AND ue.status = $${paramCount}
      )`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ✅ FIXED: Column mapping for sorting
    const sortColumnMap = {
      name: 'u.name',
      email: 'u.email',
      created_at: 'u.created_at',
      createdAt: 'u.created_at',
      updated_at: 'u.updated_at'
    };

    const validSortBy = sortColumnMap[sortBy] || 'u.created_at';

    // ✅ FIXED: Main query for faculty with raw SQL
    const facultyQuery = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.designation, 
        u.institution, u.specialization, u.bio, u.image as profile_image,
        u.experience, u.qualifications, u.achievements, u.social_links,
        u.dietary_requirements, u.emergency_contact, u.created_at, u.updated_at
      FROM users u
      ${whereClause}
      ORDER BY ${validSortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const [facultyResult, countResult] = await Promise.all([
      query(facultyQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const faculty = facultyResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // ✅ FIXED: Get additional data for each faculty member using separate queries
    for (const member of faculty) {
      // Get user events for this faculty
      if (eventId) {
        const eventsResult = await query(`
          SELECT ue.*, e.id as event_id, e.name as event_name, e.start_date, e.end_date
          FROM user_events ue
          JOIN events e ON e.id = ue.event_id
          WHERE ue.user_id = $1 AND ue.event_id = $2
        `, [member.id, eventId]);
        member.userEvents = eventsResult.rows;
      }

      // Get session speakers
      const speakersResult = await query(`
        SELECT ss.*, cs.id as session_id, cs.title as session_title, 
               cs.start_time, cs.end_time, h.name as hall_name
        FROM session_speakers ss
        JOIN conference_sessions cs ON cs.id = ss.session_id
        LEFT JOIN halls h ON h.id = cs.hall_id
        WHERE ss.user_id = $1
      `, [member.id]);
      member.sessionSpeakers = speakersResult.rows;

      // Get travel details if eventId specified
      if (eventId) {
        const travelResult = await query(`
          SELECT * FROM travel_details 
          WHERE user_id = $1 AND event_id = $2
        `, [member.id, eventId]);
        member.travelDetails = travelResult.rows;

        // Get accommodations
        const accommodationResult = await query(`
          SELECT * FROM accommodations 
          WHERE user_id = $1 AND event_id = $2
        `, [member.id, eventId]);
        member.accommodations = accommodationResult.rows;

        // Get presentations
        const presentationsResult = await query(`
          SELECT p.id, p.title, p.file_path, p.uploaded_at, cs.title as session_title
          FROM presentations p
          JOIN conference_sessions cs ON cs.id = p.session_id
          WHERE p.user_id = $1 AND cs.event_id = $2
        `, [member.id, eventId]);
        member.presentations = presentationsResult.rows;
      }

      // ✅ FIXED: Parse JSON fields safely
      member.qualifications = safeJSONParse(member.qualifications, []);
      member.achievements = safeJSONParse(member.achievements, []);
      member.social_links = safeJSONParse(member.social_links, {});
      member.emergency_contact = safeJSONParse(member.emergency_contact, {});
    }

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

    // ✅ FIXED: Verify event access with raw SQL
    const eventCheckResult = await query(`
      SELECT e.id, e.name 
      FROM events e
      WHERE e.id = $1
    `, [validatedData.eventId]);

    if (eventCheckResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventCheckResult.rows[0];
    const results = [];
    const errors = [];

    for (const faculty of validatedData.facultyList) {
      try {
        // ✅ FIXED: Check if user already exists
        const existingUserResult = await query(
          'SELECT * FROM users WHERE email = $1',
          [faculty.email]
        );

        let user;
        if (existingUserResult.rows.length === 0) {
          // ✅ FIXED: Create new user account with FACULTY role
          const createUserResult = await query(`
            INSERT INTO users (
              name, email, phone, role, designation, institution, 
              specialization, password, email_verified, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *
          `, [
            faculty.name,
            faculty.email,
            faculty.phone,
            'FACULTY', // ✅ FIXED: Users table role is always FACULTY
            faculty.designation,
            faculty.institution,
            faculty.specialization,
            'temp_password_' + Math.random().toString(36).slice(-8),
            null
          ]);
          user = createUserResult.rows[0];
        } else {
          user = existingUserResult.rows[0];
        }

        // ✅ FIXED: Check existing event association
        const existingAssociationResult = await query(`
          SELECT * FROM user_events 
          WHERE user_id = $1 AND event_id = $2
        `, [user.id, validatedData.eventId]);

        if (existingAssociationResult.rows.length === 0) {
          // ✅ FIXED: Create event association with event role
          await query(`
            INSERT INTO user_events (
              user_id, event_id, role, permissions, invited_by, 
              invited_at, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW())
          `, [
            user.id,
            validatedData.eventId,
            faculty.role, // ✅ FIXED: This goes to user_events.role (SPEAKER/MODERATOR/CHAIRPERSON)
            JSON.stringify(['READ']),
            session.user.id,
            'PENDING'
          ]);
        }

        // ✅ FIXED: Create session speaker association if sessionId provided
        if (faculty.sessionId) {
          const existingSpeakerResult = await query(`
            SELECT * FROM session_speakers 
            WHERE user_id = $1 AND session_id = $2
          `, [user.id, faculty.sessionId]);

          if (existingSpeakerResult.rows.length === 0) {
            await query(`
              INSERT INTO session_speakers (user_id, session_id, role, created_at)
              VALUES ($1, $2, $3, NOW())
            `, [user.id, faculty.sessionId, faculty.role]);
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

        // ✅ FIXED: Log email for sending with raw SQL
        await query(`
          INSERT INTO email_logs (
            recipient, subject, content, type, status, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          faculty.email,
          `Invitation to ${event.name || 'Conference'}`,
          faculty.invitationMessage || `You are invited to participate as ${faculty.role} in our conference.`,
          'FACULTY_INVITATION',
          'PENDING',
          JSON.stringify({
            eventId: validatedData.eventId,
            facultyRole: faculty.role,
            invitationToken
          })
        ]);

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

    // ✅ FIXED: Build update query with raw SQL
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(validatedUpdates)) {
      if (value !== undefined) {
        paramCount++;
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (typeof value === 'object' && value !== null) {
          updateFields.push(`${dbField} = $${paramCount}::jsonb`);
          queryParams.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          queryParams.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at field
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    queryParams.push(new Date());

    // Add WHERE conditions - ✅ FIXED: Only FACULTY role exists
    const placeholders = facultyIds.map((_, index) => `$${paramCount + 1 + index}`).join(', ');
    queryParams.push(...facultyIds);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id IN (${placeholders}) 
      AND role = 'FACULTY'
    `;

    const result = await query(updateQuery, queryParams);

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.rowCount },
      message: `${result.rowCount} faculty profiles updated successfully`
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