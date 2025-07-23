// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
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
    role: z.enum(['FACULTY'])
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
    const sortBy = searchParams.get('sortBy') || 'start_time'; // ✅ Fixed: Correct column name
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    let queryParams: any[] = [];
    let paramCount = 0;

    // Event access check
    if (eventId) {
      paramCount++;
      whereClause += ` AND cs.event_id = $${paramCount}`;
      queryParams.push(eventId);
      
      // Check if user has access to this event
      const userEventResult = await query(`
        SELECT id FROM user_events 
        WHERE user_id = $1 AND event_id = $2
      `, [session.user.id, eventId]);

      if (userEventResult.rows.length === 0 && session.user.role !== 'ORGANIZER') {
        // Check if event is published for non-associated users
        const eventResult = await query(
          'SELECT status FROM events WHERE id = $1',
          [eventId]
        );

        if (eventResult.rows.length === 0 || eventResult.rows[0].status !== 'PUBLISHED') {
          return NextResponse.json(
            { error: 'Access denied to event sessions' },
            { status: 403 }
          );
        }
      }
    }

    // Hall filter
    if (hallId) {
      paramCount++;
      whereClause += ` AND cs.hall_id = $${paramCount}`;
      queryParams.push(hallId);
    }

    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      paramCount++;
      whereClause += ` AND cs.start_time >= $${paramCount}`; // ✅ Fixed: Correct column name
      queryParams.push(startOfDay);
      
      paramCount++;
      whereClause += ` AND cs.start_time <= $${paramCount}`; // ✅ Fixed: Correct column name
      queryParams.push(endOfDay);
    }

    // Session type filter
    if (sessionType) {
      paramCount++;
      whereClause += ` AND cs.session_type = $${paramCount}`;
      queryParams.push(sessionType);
    }

    // Speaker filter
    if (speakerId) {
      paramCount++;
      whereClause += ` AND EXISTS (
        SELECT 1 FROM session_speakers ss 
        WHERE ss.session_id = cs.id AND ss.user_id = $${paramCount}
      )`;
      queryParams.push(speakerId);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (
        cs.title ILIKE $${paramCount} OR 
        cs.description ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    // ✅ Fixed: Main query with correct column names
    const sessionsQuery = `
      SELECT 
        cs.*,
        e.name as event_name, 
        e.start_date as event_start_date, 
        e.end_date as event_end_date,
        h.name as hall_name, 
        h.capacity as hall_capacity, 
        h.equipment as hall_equipment,
        (SELECT COUNT(*) FROM session_speakers ss WHERE ss.session_id = cs.id) as speakers_count,
        (SELECT COUNT(*) FROM presentations p WHERE p.session_id = cs.id) as presentations_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = cs.id) as attendance_count
      FROM conference_sessions cs
      LEFT JOIN events e ON cs.event_id = e.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      ${whereClause}
      ORDER BY cs.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, skip);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conference_sessions cs
      ${whereClause}
    `;

    const [sessionsResult, countResult] = await Promise.all([
      query(sessionsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2))
    ]);

    // Get speakers for all sessions in one query
    const sessionIds = sessionsResult.rows.map(row => row.id);
    let speakers: any[] = [];
    if (sessionIds.length > 0) {
      const speakersQuery = `
        SELECT 
          ss.session_id, ss.role as speaker_role,
          u.id, u.name, u.email, u.phone, u.institution, u.image
        FROM session_speakers ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.session_id = ANY($1)
        ORDER BY ss.session_id, ss.created_at
      `;
      
      const speakersResult = await query(speakersQuery, [sessionIds]);
      speakers = speakersResult.rows;
    }

    // Get presentations for all sessions
    let presentations: any[] = [];
    if (sessionIds.length > 0) {
      const presentationsQuery = `
        SELECT 
          p.session_id, p.id, p.title, p.file_path, p.uploaded_at,
          u.name as user_name
        FROM presentations p
        JOIN users u ON p.user_id = u.id
        WHERE p.session_id = ANY($1)
        ORDER BY p.session_id, p.uploaded_at
      `;
      
      const presentationsResult = await query(presentationsQuery, [sessionIds]);
      presentations = presentationsResult.rows;
    }

    // Get attendance records for all sessions
    let attendanceRecords: any[] = [];
    if (sessionIds.length > 0) {
      const attendanceQuery = `
        SELECT session_id, id, user_id, timestamp, method
        FROM attendance_records
        WHERE session_id = ANY($1)
        ORDER BY session_id, timestamp
      `;
      
      const attendanceResult = await query(attendanceQuery, [sessionIds]);
      attendanceRecords = attendanceResult.rows;
    }

    // Format response data
    const sessions = sessionsResult.rows.map(row => {
      const sessionSpeakers = speakers.filter(s => s.session_id === row.id).map(s => ({
        user: {
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          institution: s.institution,
          profileImage: s.image
        },
        role: s.speaker_role
      }));

      const sessionPresentations = presentations.filter(p => p.session_id === row.id).map(p => ({
        id: p.id,
        title: p.title,
        filePath: p.file_path,
        uploadedAt: p.uploaded_at,
        user: { name: p.user_name }
      }));

      const sessionAttendance = attendanceRecords.filter(a => a.session_id === row.id).map(a => ({
        id: a.id,
        userId: a.user_id,
        timestamp: a.timestamp,
        method: a.method
      }));

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        startTime: row.start_time, // ✅ Fixed: Correct column name
        endTime: row.end_time,     // ✅ Fixed: Correct column name
        sessionType: row.session_type,
        maxParticipants: row.max_participants,
        requirements: row.requirements ? JSON.parse(row.requirements) : [],
        tags: row.tags ? JSON.parse(row.tags) : [],
        isBreak: row.is_break,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        event: {
          id: row.event_id,
          name: row.event_name,
          startDate: row.event_start_date, // ✅ Fixed: Correct column name
          endDate: row.event_end_date      // ✅ Fixed: Correct column name
        },
        hall: row.hall_id ? {
          id: row.hall_id,
          name: row.hall_name,
          capacity: row.hall_capacity,
          equipment: row.hall_equipment ? JSON.parse(row.hall_equipment) : null
        } : null,
        speakers: sessionSpeakers,
        presentations: sessionPresentations,
        attendanceRecords: sessionAttendance,
        _count: {
          speakers: parseInt(row.speakers_count || '0'),
          presentations: parseInt(row.presentations_count || '0'),
          attendanceRecords: parseInt(row.attendance_count || '0')
        }
      };
    });

    const total = parseInt(countResult.rows[0].total);

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
    const userEventResult = await query(`
      SELECT id FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `, [session.user.id, validatedData.eventId]);

    if (userEventResult.rows.length === 0) {
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

    // ✅ Fixed: Check for schedule conflicts with correct column names
    if (validatedData.hallId) {
      const conflictQuery = `
        SELECT id, title, start_time, end_time
        FROM conference_sessions
        WHERE hall_id = $1 AND (
          (start_time < $2 AND start_time >= $3) OR
          (end_time > $3 AND end_time <= $2) OR
          (start_time <= $3 AND end_time >= $2)
        )
      `;

      const conflictResult = await query(conflictQuery, [
        validatedData.hallId,
        validatedData.endTime,
        validatedData.startTime
      ]);

      if (conflictResult.rows.length > 0) {
        return NextResponse.json({
          error: 'Hall is already booked during this time',
          conflicts: conflictResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            startTime: row.start_time, // ✅ Fixed: Correct column name
            endTime: row.end_time      // ✅ Fixed: Correct column name
          }))
        }, { status: 409 });
      }
    }

    // Generate session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session
    const { speakers, ...sessionData } = validatedData;
    
    // ✅ Fixed: Insert session with correct column names
    const insertSessionQuery = `
      INSERT INTO conference_sessions (
        id, event_id, title, description, start_time, end_time, hall_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *
    `;

    const sessionResult = await query(insertSessionQuery, [
      sessionId,
      sessionData.eventId,
      sessionData.title,
      sessionData.description || null,
      sessionData.startTime,
      sessionData.endTime,
      sessionData.hallId || null
    ]);

    const newSession = sessionResult.rows[0];

    // Add speakers if provided
    if (speakers && speakers.length > 0) {
      const speakersValues = speakers.map((speaker, index) => {
        const speakerId = `ss_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`;
        return `('${speakerId}', '${sessionId}', '${speaker.userId}', '${speaker.role}', NOW())`;
      }).join(',');

      await query(`
        INSERT INTO session_speakers (id, session_id, user_id, role, created_at)
        VALUES ${speakersValues}
      `);
    }

    // ✅ Fixed: Get complete session data with correct column names
    const completeSessionQuery = `
      SELECT 
        cs.*,
        e.name as event_name,
        h.name as hall_name, h.capacity as hall_capacity
      FROM conference_sessions cs
      LEFT JOIN events e ON cs.event_id = e.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.id = $1
    `;

    const completeResult = await query(completeSessionQuery, [sessionId]);
    const completeSession = completeResult.rows[0];

    // Get speakers with user details
    const speakersWithDetailsQuery = `
      SELECT 
        ss.role as speaker_role,
        u.id, u.name, u.email, u.phone, u.institution
      FROM session_speakers ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.session_id = $1
    `;

    const speakersResult = await query(speakersWithDetailsQuery, [sessionId]);

    const responseData = {
      id: completeSession.id,
      title: completeSession.title,
      description: completeSession.description,
      startTime: completeSession.start_time, // ✅ Fixed: Correct column name
      endTime: completeSession.end_time,     // ✅ Fixed: Correct column name
      createdAt: completeSession.created_at,
      updatedAt: completeSession.updated_at,
      event: {
        id: completeSession.event_id,
        name: completeSession.event_name
      },
      hall: completeSession.hall_id ? {
        id: completeSession.hall_id,
        name: completeSession.hall_name,
        capacity: completeSession.hall_capacity
      } : null,
      speakers: speakersResult.rows.map(row => ({
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          institution: row.institution
        },
        role: row.speaker_role
      }))
    };

    return NextResponse.json({
      success: true,
      data: responseData,
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