// src/app/api/sessions/[id]/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";

// GET: Fetch individual session details
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = context.params?.id;
    console.log('🔍 Fetching session details for ID:', sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session from database
    const sessionResult = await query(
      `SELECT 
        cs.*,
        sm.faculty_id,
        sm.faculty_email,
        sm.place,
        sm.status,
        sm.invite_status,
        u.name as faculty_name,
        h.name as hall_name,
        e.name as event_name,
        e.location as event_location
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN events e ON cs.event_id = e.id
      WHERE cs.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionRow = sessionResult.rows[0];

    // Check permissions
    const canAccess = (
      session.user?.role === 'ORGANIZER' ||
      session.user?.role === 'EVENT_MANAGER' ||
      sessionRow.faculty_id === session.user?.id
    );

    if (!canAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Format response
    const sessionData = {
      id: sessionRow.id,
      eventId: sessionRow.event_id,
      title: sessionRow.title,
      description: sessionRow.description,
      startTime: sessionRow.start_time,
      endTime: sessionRow.end_time,
      hallId: sessionRow.hall_id,
      hallName: sessionRow.hall_name,
      facultyId: sessionRow.faculty_id,
      facultyName: sessionRow.faculty_name,
      facultyEmail: sessionRow.faculty_email,
      place: sessionRow.place,
      status: sessionRow.status,
      inviteStatus: sessionRow.invite_status,
      eventInfo: {
        id: sessionRow.event_id,
        name: sessionRow.event_name,
        location: sessionRow.event_location
      },
      // Backward compatibility fields
      roomId: sessionRow.hall_id,
      roomName: sessionRow.hall_name,
      email: sessionRow.faculty_email
    };

    return NextResponse.json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT/PATCH: Update session
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return handleUpdate(req, context.params);
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return handleUpdate(req, context.params);
}

async function handleUpdate(req: NextRequest, params: { id: string }) {
  try {
    console.log('🚀 Step 1: Starting handleUpdate');
    
    const session = await getServerSession(authOptions);
    console.log('🚀 Step 2: Session check:', { 
      session: !!session, 
      user: !!session?.user, 
      userId: session?.user?.id,
      role: session?.user?.role 
    });

    if (!session?.user?.id) {
      console.log('❌ Step 3: No valid session found');
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    console.log('🚀 Step 4: Getting request data');
    console.log('🚀 Step 4.1: Checking params object:', { params, paramsId: params?.id });
    
    const sessionId = params?.id;
    console.log('🚀 Step 5: sessionId =', sessionId);
    
    if (!sessionId) {
      console.log('❌ Step 5.1: No sessionId found in params');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    const updates = await req.json();
    console.log('🚀 Step 6: updates received =', JSON.stringify(updates, null, 2));

    console.log('🚀 Step 7: Querying database for existing session');
    
    // Check if session exists
    const existingSession = await query(
      `SELECT cs.*, sm.faculty_id, sm.status, sm.invite_status 
       FROM conference_sessions cs
       LEFT JOIN session_metadata sm ON cs.id = sm.session_id
       WHERE cs.id = $1`,
      [sessionId]
    );

    console.log('🚀 Step 8: Database query result:', {
      rowCount: existingSession.rows.length,
      firstRow: existingSession.rows[0] ? 'exists' : 'not found'
    });

    if (existingSession.rows.length === 0) {
      console.log('❌ Step 9: Session not found in database');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('🚀 Step 10: Checking permissions');
    const sessionRow = existingSession.rows[0];
    console.log('🚀 Step 11: Session row data:', {
      id: sessionRow.id,
      faculty_id: sessionRow.faculty_id,
      status: sessionRow.status
    });

    // Check permissions - Use safe navigation
    const canUpdate = (
      session.user?.role === 'ORGANIZER' ||
      session.user?.role === 'EVENT_MANAGER' ||
      sessionRow?.faculty_id === session.user?.id
    );

    console.log('🚀 Step 12: Permission check result:', {
      userRole: session.user?.role,
      facultyId: sessionRow?.faculty_id,
      userId: session.user?.id,
      canUpdate: canUpdate
    });

    if (!canUpdate) {
      console.log('❌ Step 13: Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('🚀 Step 14: Mapping field updates');

    // Map frontend field names to database field names
    const sessionUpdates: any = {};
    const metadataUpdates: any = {};

    // Map session table updates
    if (updates.title !== undefined) sessionUpdates.title = updates.title;
    if (updates.description !== undefined) sessionUpdates.description = updates.description;
    if (updates.startTime !== undefined) sessionUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) sessionUpdates.end_time = updates.endTime;
    if (updates.hallId !== undefined) sessionUpdates.hall_id = updates.hallId;
    if (updates.roomId !== undefined) sessionUpdates.hall_id = updates.roomId;

    // Map metadata table updates
    if (updates.facultyId !== undefined) metadataUpdates.faculty_id = updates.facultyId;
    if (updates.facultyEmail !== undefined) metadataUpdates.faculty_email = updates.facultyEmail;
    if (updates.email !== undefined) metadataUpdates.faculty_email = updates.email;
    if (updates.place !== undefined) metadataUpdates.place = updates.place;
    if (updates.status !== undefined) metadataUpdates.status = updates.status;
    if (updates.inviteStatus !== undefined) metadataUpdates.invite_status = updates.inviteStatus;

    console.log('🚀 Step 15: Field mapping complete:', {
      sessionUpdates: JSON.stringify(sessionUpdates),
      metadataUpdates: JSON.stringify(metadataUpdates)
    });

    console.log('🚀 Step 16: Validating time if provided');
    // Validate time if provided
    if (sessionUpdates.start_time && sessionUpdates.end_time) {
      const start = new Date(sessionUpdates.start_time);
      const end = new Date(sessionUpdates.end_time);

      if (end <= start) {
        console.log('❌ Step 17: Invalid time - end before start');
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        console.log('❌ Step 18: Invalid duration - too short');
        return NextResponse.json(
          { error: 'Session must be at least 15 minutes long' },
          { status: 400 }
        );
      }
    }

    console.log('🚀 Step 19: Starting database updates');

    // Update conference_sessions table if needed
    if (Object.keys(sessionUpdates).length > 0) {
      console.log('🚀 Step 20: Updating conference_sessions table');
      
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      Object.entries(sessionUpdates).forEach(([key, value]) => {
        updateFields.push(`${key} = ${paramCount}`);
        updateValues.push(value);
        paramCount++;
      });

      updateFields.push(`updated_at = ${paramCount}`);
      updateValues.push(new Date());
      paramCount++;
      
      updateValues.push(sessionId);

      const sessionUpdateQuery = `
        UPDATE conference_sessions 
        SET ${updateFields.join(', ')}
        WHERE id = ${paramCount}
      `;

      console.log('🚀 Step 21: Executing session update query:', sessionUpdateQuery);
      console.log('🚀 Step 22: With values:', updateValues);

      await query(sessionUpdateQuery, updateValues);
      console.log('🚀 Step 23: Session table updated successfully');
    }

    // Update session_metadata table if needed
    if (Object.keys(metadataUpdates).length > 0) {
      console.log('🚀 Step 24: Updating session_metadata table');
      
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      Object.entries(metadataUpdates).forEach(([key, value]) => {
        updateFields.push(`${key} = ${paramCount}`);
        updateValues.push(value);
        paramCount++;
      });

      updateValues.push(sessionId);

      // First try to update existing metadata
      const metadataUpdateQuery = `
        UPDATE session_metadata 
        SET ${updateFields.join(', ')}
        WHERE session_id = ${paramCount}
      `;

      console.log('🚀 Step 25: Executing metadata update query:', metadataUpdateQuery);
      console.log('🚀 Step 26: With values:', updateValues);

      const updateResult = await query(metadataUpdateQuery, updateValues);
      console.log('🚀 Step 27: Metadata update result - rows affected:', updateResult.rowCount);

      // If no metadata exists, insert new record
      if (updateResult.rowCount === 0) {
        console.log('🚀 Step 28: No existing metadata found, inserting new record');
        
        const insertFields = ['session_id', ...Object.keys(metadataUpdates)];
        const insertValues = [sessionId, ...Object.values(metadataUpdates)];
        const placeholders = insertFields.map((_, i) => `${i + 1}`).join(', ');

        const metadataInsertQuery = `
          INSERT INTO session_metadata (${insertFields.join(', ')})
          VALUES (${placeholders})
        `;

        console.log('🚀 Step 29: Executing metadata insert query:', metadataInsertQuery);
        console.log('🚀 Step 30: With values:', insertValues);

        await query(metadataInsertQuery, insertValues);
        console.log('🚀 Step 31: Metadata inserted successfully');
      }
    }

    console.log('🚀 Step 32: Fetching updated session data');

    // Fetch updated session
    const updatedSessionResult = await query(
      `SELECT 
        cs.*,
        sm.faculty_id,
        sm.faculty_email,
        sm.place,
        sm.status,
        sm.invite_status,
        u.name as faculty_name,
        h.name as hall_name
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.id = $1`,
      [sessionId]
    );

    console.log('🚀 Step 33: Updated session fetch result:', {
      rowCount: updatedSessionResult.rows.length
    });

    if (updatedSessionResult.rows.length === 0) {
      console.log('❌ Step 34: Session not found after update');
      return NextResponse.json(
        { error: 'Session not found after update' },
        { status: 404 }
      );
    }

    console.log('🚀 Step 35: Preparing response data');

    const updatedSession = updatedSessionResult.rows[0];
    const responseData = {
      id: updatedSession.id,
      eventId: updatedSession.event_id,
      title: updatedSession.title,
      description: updatedSession.description,
      startTime: updatedSession.start_time,
      endTime: updatedSession.end_time,
      hallId: updatedSession.hall_id,
      hallName: updatedSession.hall_name,
      facultyId: updatedSession.faculty_id,
      facultyName: updatedSession.faculty_name,
      facultyEmail: updatedSession.faculty_email,
      place: updatedSession.place,
      status: updatedSession.status,
      inviteStatus: updatedSession.invite_status,
      // Backward compatibility
      roomId: updatedSession.hall_id,
      roomName: updatedSession.hall_name,
      email: updatedSession.faculty_email
    };

    console.log('✅ Step 36: Session updated successfully - sending response');

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('💥 Error in handleUpdate at step:', error);
    console.error('💥 Complete error details:', error);
    console.error('💥 Error stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to update session',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'Check server logs for detailed step information'
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete session
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = context.params?.id;
    console.log('🗑️ Deleting session:', sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Delete session metadata first (foreign key constraint)
    await query('DELETE FROM session_metadata WHERE session_id = $1', [sessionId]);
    
    // Then delete the session
    await query('DELETE FROM conference_sessions WHERE id = $1', [sessionId]);

    console.log('✅ Session deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";