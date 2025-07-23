// src/app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const UpdateSessionSchema = z.object({
  title: z.string().min(3, 'Session title must be at least 3 characters').optional(),
  description: z.string().optional(),
  startTime: z.string().transform((str) => new Date(str)).optional(),
  endTime: z.string().transform((str) => new Date(str)).optional(),
  hallId: z.string().optional(),
  sessionType: z.enum(['KEYNOTE', 'PRESENTATION', 'PANEL', 'WORKSHOP', 'POSTER', 'BREAK']).optional(),
  maxParticipants: z.number().positive().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isBreak: z.boolean().optional(),
});

const SpeakerActionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER')
});

// GET /api/sessions/[id] - Get single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;

    // Get session with complete related data
    const sessionQuery = `
      SELECT 
        cs.*,
        e.name as event_name, e.start_date as event_start_date, e.end_date as event_end_date,
        e.status as event_status, e.description as event_description,
        h.name as hall_name, h.capacity as hall_capacity, h.equipment as hall_equipment,
        h.location as hall_location,
        u.name as created_by_name
      FROM conference_sessions cs
      LEFT JOIN events e ON cs.event_id = e.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN users u ON cs.created_by = u.id
      WHERE cs.id = $1
    `;

    const sessionResult = await query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionResult.rows[0];

    // Check access permissions
    const userEventResult = await query(`
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
    `, [session.user.id, sessionData.event_id]);

    const hasAccess = userEventResult.rows.length > 0 || 
                     session.user.role === 'ORGANIZER' ||
                     sessionData.event_status === 'PUBLISHED';

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      );
    }

    // Get speakers with user details
    const speakersQuery = `
      SELECT 
        ss.id as speaker_id, ss.role as speaker_role, ss.created_at as assigned_at,
        u.id, u.name, u.email, u.phone, u.institution, u.image, u.bio,
        u.designation, u.linkedin, u.twitter
      FROM session_speakers ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.session_id = $1
      ORDER BY ss.created_at
    `;

    const speakersResult = await query(speakersQuery, [sessionId]);

    // Get presentations
    const presentationsQuery = `
      SELECT 
        p.id, p.title, p.description, p.file_path, p.file_type, p.file_size,
        p.uploaded_at, p.is_approved, p.approval_notes,
        u.name as user_name, u.email as user_email
      FROM presentations p
      JOIN users u ON p.user_id = u.id
      WHERE p.session_id = $1
      ORDER BY p.uploaded_at
    `;

    const presentationsResult = await query(presentationsQuery, [sessionId]);

    // Get attendance records
    const attendanceQuery = `
      SELECT 
        ar.id, ar.user_id, ar.timestamp, ar.method, ar.location,
        u.name as user_name, u.email as user_email
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.session_id = $1
      ORDER BY ar.timestamp
    `;

    const attendanceResult = await query(attendanceQuery, [sessionId]);

    // Get session conflicts (if any)
    const conflictsQuery = `
      SELECT id, title, start_time, end_time, hall_id
      FROM conference_sessions
      WHERE hall_id = $1 AND id != $2 AND (
        (start_time < $4 AND end_time > $3) OR
        (start_time >= $3 AND start_time < $4)
      )
    `;

    let conflicts = [];
    if (sessionData.hall_id) {
      const conflictsResult = await query(conflictsQuery, [
        sessionData.hall_id,
        sessionId,
        sessionData.start_time,
        sessionData.end_time
      ]);
      conflicts = conflictsResult.rows;
    }

    // Format response data
    const responseData = {
      id: sessionData.id,
      title: sessionData.title,
      description: sessionData.description,
      startTime: sessionData.start_time,
      endTime: sessionData.end_time,
      sessionType: sessionData.session_type,
      maxParticipants: sessionData.max_participants,
      requirements: sessionData.requirements ? JSON.parse(sessionData.requirements) : [],
      tags: sessionData.tags ? JSON.parse(sessionData.tags) : [],
      isBreak: sessionData.is_break,
      createdAt: sessionData.created_at,
      updatedAt: sessionData.updated_at,
      createdBy: {
        name: sessionData.created_by_name
      },
      event: {
        id: sessionData.event_id,
        name: sessionData.event_name,
        startDate: sessionData.event_start_date,
        endDate: sessionData.event_end_date,
        status: sessionData.event_status,
        description: sessionData.event_description
      },
      hall: sessionData.hall_id ? {
        id: sessionData.hall_id,
        name: sessionData.hall_name,
        capacity: sessionData.hall_capacity,
        location: sessionData.hall_location,
        equipment: sessionData.hall_equipment ? JSON.parse(sessionData.hall_equipment) : []
      } : null,
      speakers: speakersResult.rows.map(row => ({
        id: row.speaker_id,
        assignedAt: row.assigned_at,
        role: row.speaker_role,
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          institution: row.institution,
          designation: row.designation,
          bio: row.bio,
          profileImage: row.image,
          socialLinks: {
            linkedin: row.linkedin,
            twitter: row.twitter
          }
        }
      })),
      presentations: presentationsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: row.file_size,
        uploadedAt: row.uploaded_at,
        isApproved: row.is_approved,
        approvalNotes: row.approval_notes,
        user: {
          name: row.user_name,
          email: row.user_email
        }
      })),
      attendanceRecords: attendanceResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        timestamp: row.timestamp,
        method: row.method,
        location: row.location,
        user: {
          name: row.user_name,
          email: row.user_email
        }
      })),
      conflicts: conflicts.map(row => ({
        id: row.id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        hallId: row.hall_id
      })),
      _count: {
        speakers: speakersResult.rows.length,
        presentations: presentationsResult.rows.length,
        attendanceRecords: attendanceResult.rows.length,
        conflicts: conflicts.length
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Session GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update single session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const body = await request.json();
    const validatedData = UpdateSessionSchema.parse(body);

    // Check if session exists and get current data
    const currentSessionQuery = `
      SELECT cs.*, e.id as event_id
      FROM conference_sessions cs
      JOIN events e ON cs.event_id = e.id
      WHERE cs.id = $1
    `;

    const currentSessionResult = await query(currentSessionQuery, [sessionId]);

    if (currentSessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const currentSession = currentSessionResult.rows[0];

    // Check permissions
    const userEventResult = await query(`
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2 AND permissions @> '["WRITE"]'
    `, [session.user.id, currentSession.event_id]);

    const hasPermission = userEventResult.rows.length > 0 || session.user.role === 'ORGANIZER';

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this session' },
        { status: 403 }
      );
    }

    // Validate session times if being updated
    const startTime = validatedData.startTime || currentSession.start_time;
    const endTime = validatedData.endTime || currentSession.end_time;

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for schedule conflicts if hall or time is being updated
    const hallId = validatedData.hallId !== undefined ? validatedData.hallId : currentSession.hall_id;
    
    if (hallId && (validatedData.startTime || validatedData.endTime || validatedData.hallId !== undefined)) {
      const conflictQuery = `
        SELECT id, title, start_time, end_time
        FROM conference_sessions
        WHERE hall_id = $1 AND id != $2 AND (
          (start_time < $3 AND end_time > $4) OR
          (start_time >= $4 AND start_time < $3)
        )
      `;

      const conflictResult = await query(conflictQuery, [
        hallId,
        sessionId,
        endTime,
        startTime
      ]);

      if (conflictResult.rows.length > 0) {
        return NextResponse.json({
          error: 'Hall is already booked during this time',
          conflicts: conflictResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            startTime: row.start_time,
            endTime: row.end_time
          }))
        }, { status: 409 });
      }
    }

    // Check if session has already started
    if (validatedData.startTime || validatedData.endTime) {
      const now = new Date();
      const sessionStartTime = new Date(currentSession.start_time);
      
      if (sessionStartTime <= now) {
        return NextResponse.json({
          error: 'Cannot modify time for sessions that have already started'
        }, { status: 400 });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        let dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        // Handle special field mappings
        if (key === 'sessionType') dbField = 'session_type';
        if (key === 'maxParticipants') dbField = 'max_participants';
        if (key === 'isBreak') dbField = 'is_break';
        if (key === 'startTime') dbField = 'start_time';
        if (key === 'endTime') dbField = 'end_time';
        if (key === 'hallId') dbField = 'hall_id';

        updateFields.push(`${dbField} = $${paramCount}`);
        
        // Handle JSON fields
        if (key === 'requirements' || key === 'tags') {
          updateParams.push(Array.isArray(value) ? JSON.stringify(value) : value);
        } else {
          updateParams.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        data: currentSession,
        message: 'No fields to update'
      });
    }

    // Add updated_at and session ID
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());
    
    paramCount++;
    updateParams.push(sessionId);

    const updateQuery = `
      UPDATE conference_sessions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await query(updateQuery, updateParams);
    const updatedSession = updateResult.rows[0];

    // Get complete updated session data
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

    const responseData = {
      id: completeSession.id,
      title: completeSession.title,
      description: completeSession.description,
      startTime: completeSession.start_time,
      endTime: completeSession.end_time,
      sessionType: completeSession.session_type,
      maxParticipants: completeSession.max_participants,
      requirements: completeSession.requirements ? JSON.parse(completeSession.requirements) : [],
      tags: completeSession.tags ? JSON.parse(completeSession.tags) : [],
      isBreak: completeSession.is_break,
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
      } : null
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('Session PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete single session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;

    // Check if session exists and get event info
    const sessionQuery = `
      SELECT cs.*, e.id as event_id
      FROM conference_sessions cs
      JOIN events e ON cs.event_id = e.id
      WHERE cs.id = $1
    `;

    const sessionResult = await query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionResult.rows[0];

    // Check permissions
    const userEventResult = await query(`
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2 AND permissions @> '["DELETE"]'
    `, [session.user.id, sessionData.event_id]);

    const hasPermission = userEventResult.rows.length > 0 || session.user.role === 'ORGANIZER';

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this session' },
        { status: 403 }
      );
    }

    // Check if session has already started
    const now = new Date();
    const sessionStartTime = new Date(sessionData.start_time);
    
    if (sessionStartTime <= now) {
      return NextResponse.json({
        error: 'Cannot delete sessions that have already started'
      }, { status: 400 });
    }

    // Delete related records first (cascade delete)
    await query('DELETE FROM session_speakers WHERE session_id = $1', [sessionId]);
    await query('DELETE FROM presentations WHERE session_id = $1', [sessionId]);
    await query('DELETE FROM attendance_records WHERE session_id = $1', [sessionId]);

    // Delete the session
    const deleteResult = await query('DELETE FROM conference_sessions WHERE id = $1', [sessionId]);

    return NextResponse.json({
      success: true,
      data: { 
        deletedSession: {
          id: sessionData.id,
          title: sessionData.title
        }
      },
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Session DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Speaker management and partial updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const body = await request.json();
    const { action, ...data } = body;

    // Check if session exists and permissions
    const sessionQuery = `
      SELECT cs.*, e.id as event_id
      FROM conference_sessions cs
      JOIN events e ON cs.event_id = e.id
      WHERE cs.id = $1
    `;

    const sessionResult = await query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionResult.rows[0];

    // Check permissions
    const userEventResult = await query(`
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2 AND permissions @> '["WRITE"]'
    `, [session.user.id, sessionData.event_id]);

    const hasPermission = userEventResult.rows.length > 0 || session.user.role === 'ORGANIZER';

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'add_speaker': {
        const validatedData = SpeakerActionSchema.parse(data);
        
        // Check if user exists
        const userResult = await query('SELECT id, name FROM users WHERE id = $1', [validatedData.userId]);
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already a speaker
        const existingResult = await query(
          'SELECT id FROM session_speakers WHERE session_id = $1 AND user_id = $2',
          [sessionId, validatedData.userId]
        );

        if (existingResult.rows.length > 0) {
          return NextResponse.json({
            error: 'User is already a speaker for this session'
          }, { status: 400 });
        }

        // Add speaker
        const speakerId = `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await query(`
          INSERT INTO session_speakers (id, session_id, user_id, role, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [speakerId, sessionId, validatedData.userId, validatedData.role]);

        return NextResponse.json({
          success: true,
          message: 'Speaker added successfully'
        });
      }

      case 'remove_speaker': {
        const { userId } = data;
        
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const deleteResult = await query(
          'DELETE FROM session_speakers WHERE session_id = $1 AND user_id = $2',
          [sessionId, userId]
        );

        if (deleteResult.rowCount === 0) {
          return NextResponse.json({
            error: 'Speaker not found for this session'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: 'Speaker removed successfully'
        });
      }

      case 'update_speaker_role': {
        const { userId, role } = data;
        
        if (!userId || !role) {
          return NextResponse.json({ 
            error: 'User ID and role are required' 
          }, { status: 400 });
        }

        const updateResult = await query(`
          UPDATE session_speakers 
          SET role = $1, updated_at = NOW()
          WHERE session_id = $2 AND user_id = $3
        `, [role, sessionId, userId]);

        if (updateResult.rowCount === 0) {
          return NextResponse.json({
            error: 'Speaker not found for this session'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: 'Speaker role updated successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Session PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}