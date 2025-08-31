// src/app/api/sessions/route.ts - FIXED: Event Manager can see all sessions
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { createSessionWithEvent } from '@/lib/database/event-session-integration';

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
    const sessionType = searchParams.get('sessionType');
    const speakerId = searchParams.get('speakerId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'start_time';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching sessions with filters:', {
      eventId,
      hallId,
      date,
      sessionType,
      userRole: session.user.role
    });

    // Build WHERE conditions
    let whereConditions = ['1=1']; // Base condition
    let queryParams: any[] = [];
    let paramCount = 1;

    // ✅ FIXED: Event Manager permission logic
    if (session.user.role === 'EVENT_MANAGER') {
      // Event Managers can see ALL sessions from ALL events
      if (eventId) {
        // If specific event requested, filter by that event
        whereConditions.push(`cs.event_id = $${paramCount}`);
        queryParams.push(eventId);
        paramCount++;
      }
      // No additional restrictions for Event Managers - they see everything
    } else if (session.user.role === 'ORGANIZER') {
      // Organizers see sessions from events they have access to
      if (eventId) {
        // If specific event requested, check access to that event
        whereConditions.push(`cs.event_id = $${paramCount}`);
        queryParams.push(eventId);
        paramCount++;
        
        // Check access to this specific event
        whereConditions.push(`(
          e.created_by = $${paramCount} OR 
          EXISTS (
            SELECT 1 FROM user_events ue 
            WHERE ue.user_id = $${paramCount} 
            AND ue.event_id = cs.event_id
          )
        )`);
        queryParams.push(session.user.id);
        paramCount++;
      } else {
        // Show sessions from all events they have access to
        whereConditions.push(`(
          e.created_by = $${paramCount} OR 
          EXISTS (
            SELECT 1 FROM user_events ue 
            WHERE ue.user_id = $${paramCount} 
            AND ue.event_id = cs.event_id
          )
        )`);
        queryParams.push(session.user.id);
        paramCount++;
      }
    } else {
      // For other users, only show sessions from events they have access to
      if (eventId) {
        whereConditions.push(`cs.event_id = $${paramCount}`);
        queryParams.push(eventId);
        paramCount++;
        
        // Check access to this specific event
        whereConditions.push(`(
          e.created_by = $${paramCount} OR 
          EXISTS (
            SELECT 1 FROM user_events ue 
            WHERE ue.user_id = $${paramCount} 
            AND ue.event_id = cs.event_id
          )
        )`);
        queryParams.push(session.user.id);
        paramCount++;
      } else {
        // Only show sessions from events user has access to
        whereConditions.push(`(
          e.created_by = $${paramCount} OR 
          EXISTS (
            SELECT 1 FROM user_events ue 
            WHERE ue.user_id = $${paramCount} 
            AND ue.event_id = cs.event_id
          )
        )`);
        queryParams.push(session.user.id);
        paramCount++;
      }
    }

    // Add other filters
    if (hallId) {
      whereConditions.push(`cs.hall_id = $${paramCount}`);
      queryParams.push(hallId);
      paramCount++;
    }

    if (date) {
      whereConditions.push(`DATE(cs.start_time) = $${paramCount}`);
      queryParams.push(date);
      paramCount++;
    }

    if (speakerId) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM session_speakers ss 
        WHERE ss.session_id = cs.id 
        AND ss.user_id = $${paramCount}
      )`);
      queryParams.push(speakerId);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(
        cs.title ILIKE $${paramCount} OR 
        cs.description ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conference_sessions cs
      JOIN events e ON cs.event_id = e.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get sessions with creator information
    const sessionsQuery = `
      SELECT 
        cs.id,
        cs.event_id,
        cs.title,
        cs.description,
        cs.start_time,
        cs.end_time,
        cs.hall_id,
        cs.max_participants,
        cs.is_break,
        cs.requirements,
        cs.tags,
        cs.created_by,
        cs.created_at,
        cs.updated_at,
        e.name as event_name,
        e.start_date as event_start,
        e.end_date as event_end,
        h.name as hall_name,
        h.capacity as hall_capacity,
        h.location as hall_location,
        creator.name as creator_name,
        creator.role as creator_role,
        (SELECT COUNT(*) FROM session_speakers ss WHERE ss.session_id = cs.id) as speaker_count,
        (SELECT COUNT(*) FROM presentations p WHERE p.session_id = cs.id) as presentation_count
      FROM conference_sessions cs
      JOIN events e ON cs.event_id = e.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN users creator ON cs.created_by = creator.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY cs.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const sessionsResult = await query(sessionsQuery, queryParams);

    // Get speakers for sessions
    const sessionIds = sessionsResult.rows.map(row => row.id);
    let speakers: any[] = [];

    if (sessionIds.length > 0) {
      const speakersResult = await query(`
        SELECT 
          ss.session_id,
          ss.role,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.institution
        FROM session_speakers ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.session_id = ANY($1)
      `, [sessionIds]);
      
      speakers = speakersResult.rows;
    }

    // Process results
    const processedSessions = sessionsResult.rows.map(session => ({
      id: session.id,
      eventId: session.event_id,
      title: session.title,
      description: session.description,
      startTime: session.start_time,
      endTime: session.end_time,
      sessionType: session.is_break ? 'BREAK' : 'PRESENTATION',
      hallId: session.hall_id,
      maxParticipants: session.max_participants,
      isBreak: session.is_break,
      requirements: (session.requirements && typeof session.requirements === 'string' && session.requirements.trim() !== '' && session.requirements !== 'null') 
        ? (() => {
            try { return JSON.parse(session.requirements); } 
            catch (e) { return []; }
          })() 
        : [],
      tags: (session.tags && typeof session.tags === 'string' && session.tags.trim() !== '' && session.tags !== 'null') 
        ? (() => {
            try { return JSON.parse(session.tags); } 
            catch (e) { return []; }
          })() 
        : [],
      createdBy: session.created_by,
      createdByName: session.creator_name,
      createdByRole: session.creator_role,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      event: {
        id: session.event_id,
        name: session.event_name,
        startDate: session.event_start,
        endDate: session.event_end
      },
      hall: session.hall_name ? {
        id: session.hall_id,
        name: session.hall_name,
        capacity: session.hall_capacity,
        location: session.hall_location
      } : null,
      speakers: speakers
        .filter(speaker => speaker.session_id === session.id)
        .map(speaker => ({
          user: {
            id: speaker.user_id,
            name: speaker.user_name,
            email: speaker.user_email,
            institution: speaker.institution
          },
          role: speaker.role
        })),
      _count: {
        speakers: parseInt(session.speaker_count),
        presentations: parseInt(session.presentation_count),
        attendanceRecords: 0
      }
    }));

    console.log('✅ Sessions fetched successfully:', {
      total: total,
      returned: processedSessions.length,
      page,
      userRole: session.user.role
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: processedSessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Sessions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST handler remains unchanged - already working
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create sessions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('📝 Creating session - Content Type:', request.headers.get('content-type'));

    // FIXED: Handle FormData from your frontend
    const formData = await request.formData();

    // Extract fields from FormData
    const eventId = formData.get('eventId')?.toString();
    const title = formData.get('title')?.toString();
    const facultyId = formData.get('facultyId')?.toString();
    const email = formData.get('email')?.toString();
    const place = formData.get('place')?.toString();
    const roomId = formData.get('roomId')?.toString();
    const description = formData.get('description')?.toString();
    const startTime = formData.get('startTime')?.toString();
    const endTime = formData.get('endTime')?.toString();
    const status = (formData.get('status')?.toString() as 'Draft' | 'Confirmed') || 'Draft';
    const inviteStatus = (formData.get('inviteStatus')?.toString() as 'Pending' | 'Accepted' | 'Declined') || 'Pending';

    console.log('📋 Form data received:', {
      eventId,
      title,
      facultyId,
      email,
      place,
      roomId,
      startTime,
      endTime,
      status,
      inviteStatus
    });

    // Validate required fields
    if (!title || !facultyId || !email || !place || !roomId || !description || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, facultyId, email, place, roomId, description, startTime' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Set default eventId if not provided
    const finalEventId = eventId || 'default-conference-2025';
    
    // Set default endTime if not provided (1 hour after start)
    const finalEndTime = endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    // Create session data
    const sessionData = {
      sessionId,
      eventId: finalEventId,
      title,
      description: description || '',
      startTime,
      endTime: finalEndTime,
      hallId: roomId,
      facultyId,
      facultyEmail: email,
      place,
      status,
      inviteStatus
    };

    console.log('🚀 Creating session with data:', sessionData);

    // Use the event-session integration function
    const createdSessionId = await createSessionWithEvent(sessionData);

    console.log('✅ Session created successfully:', createdSessionId);

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      data: {
        id: createdSessionId,
        title,
        startTime,
        endTime: finalEndTime,
        eventId: finalEventId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}