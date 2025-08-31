// src/lib/database/event-session-integration.ts - COMPLETE FIXED: Schema Alignment
import { query } from '@/lib/database/connection';

// =========================
// TYPES & INTERFACES
// =========================

export interface EventSessionData {
  sessionId: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  hallId?: string;
  facultyId?: string;
  facultyEmail?: string;
  place?: string;
  status: 'Draft' | 'Confirmed';
  inviteStatus?: 'Pending' | 'Accepted' | 'Declined';
}

export interface SessionWithEventInfo {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  hallId?: string;
  hallName?: string;
  facultyId?: string;
  facultyName?: string;
  facultyEmail?: string;
  place?: string;
  inviteStatus?: string;
  eventInfo: {
    id: string;
    name: string;
    location: string;
    status: string;
  };
}

export interface EventSummary {
  id: string;
  name: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  sessionCount: number;
  createdBy: string;
  createdByName: string;
}

// =========================
// DATABASE OPERATIONS
// =========================

/**
 * Create a new session linked to a specific event
 */
export async function createSessionWithEvent(sessionData: EventSessionData): Promise<string> {
  try {
    console.log('🔄 Creating session with event integration:', sessionData);

    // Start transaction
    await query('BEGIN');

    try {
      // 1. Verify event exists and is active
      const eventCheck = await query(
        'SELECT id, name, status FROM events WHERE id = $1',
        [sessionData.eventId]
      );

      if (eventCheck.rows.length === 0) {
        throw new Error(`Event with ID ${sessionData.eventId} not found`);
      }

      const event = eventCheck.rows[0];
      console.log('✅ Event verified:', event.name);

      // 2. Check for time conflicts in the same hall
      if (sessionData.hallId) {
        const conflictCheck = await query(
          `SELECT id, title FROM conference_sessions 
           WHERE event_id = $1 AND hall_id = $2 
           AND (
             (start_time <= $3 AND end_time > $3) OR
             (start_time < $4 AND end_time >= $4) OR
             (start_time >= $3 AND end_time <= $4)
           )`,
          [sessionData.eventId, sessionData.hallId, sessionData.startTime, sessionData.endTime]
        );

        if (conflictCheck.rows.length > 0) {
          throw new Error(`Time conflict detected with session: ${conflictCheck.rows[0].title}`);
        }
      }

      // 3. Create session in conference_sessions table
      const sessionResult = await query(
        `INSERT INTO conference_sessions (
          id, event_id, title, description, start_time, end_time, hall_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          sessionData.sessionId,
          sessionData.eventId,
          sessionData.title,
          sessionData.description || null,
          sessionData.startTime,
          sessionData.endTime,
          sessionData.hallId || null
        ]
      );

      // 4. FIXED: Create session metadata if additional data exists
      if (sessionData.facultyId || sessionData.facultyEmail || sessionData.place || sessionData.status) {
        // FIXED: Check if session_metadata table exists with proper constraint
        await query(`
          CREATE TABLE IF NOT EXISTS session_metadata (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL UNIQUE,
            faculty_id VARCHAR(255),
            faculty_email VARCHAR(255),
            place VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Draft',
            invite_status VARCHAR(50) DEFAULT 'Pending',
            rejection_reason VARCHAR(255),
            suggested_topic VARCHAR(255),
            suggested_time_start TIMESTAMP,
            suggested_time_end TIMESTAMP,
            optional_query TEXT,
            travel_status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // FIXED: Use simple INSERT for new sessions
        await query(
          `INSERT INTO session_metadata (
            session_id, faculty_id, faculty_email, place, status, invite_status
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sessionData.sessionId,
            sessionData.facultyId || null,
            sessionData.facultyEmail || null,
            sessionData.place || null,
            sessionData.status || 'Draft',
            sessionData.inviteStatus || 'Pending'
          ]
        );
      }

      /// 5. Create user_events entry if faculty is specified
if (sessionData.facultyId && sessionData.facultyEmail) {
  console.log('🔍 Processing faculty user:', sessionData.facultyId, sessionData.facultyEmail);

  // First, try to find existing user by email
  const existingUserResult = await query(
    'SELECT id FROM users WHERE email = $1',
    [sessionData.facultyEmail]
  );

  let userIdToUse = sessionData.facultyId;

  if (existingUserResult.rows.length === 0) {
    // No user exists with this email - create new user
    try {
      await query(
        `INSERT INTO users (id, email, name, role, password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          sessionData.facultyId,
          sessionData.facultyEmail,
          sessionData.facultyEmail.split('@')[0],
          'FACULTY',
          '$2b$12$defaultPasswordHash'
        ]
      );
      console.log('✅ Created new faculty user with ID:', sessionData.facultyId);
    } catch (userError: any) {
      console.error('❌ Failed to create user:', userError.message);
      // Skip user_events creation if user creation fails
      return sessionResult.rows[0].id;
    }
  } else {
    // User exists with this email - use existing user ID
    userIdToUse = existingUserResult.rows[0].id;
    console.log('ℹ️ Using existing user ID:', userIdToUse);
  }

  // Verify user actually exists before creating user_events
  const userVerification = await query(
    'SELECT id FROM users WHERE id = $1',
    [userIdToUse]
  );

  if (userVerification.rows.length > 0) {
    // Create user_events association only if user exists
    const userEventCheck = await query(
      'SELECT id FROM user_events WHERE user_id = $1 AND event_id = $2',
      [userIdToUse, sessionData.eventId]
    );

    if (userEventCheck.rows.length === 0) {
      try {
        await query(
          `INSERT INTO user_events (id, user_id, event_id, role, permissions, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            userIdToUse,
            sessionData.eventId,
            'SPEAKER',
            'VIEW_ONLY'
          ]
        );
        console.log('✅ Created user_events association');
      } catch (eventError: any) {
        console.warn('⚠️ Failed to create user_events:', eventError.message);
      }
    }
  } else {
    console.warn('⚠️ Skipping user_events creation - user does not exist');
  }
}

      await query('COMMIT');
      console.log('✅ Session created successfully:', sessionData.sessionId);
      
      return sessionResult.rows[0].id;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error creating session with event:', error);
    throw error;
  }
}

/**
 * Get sessions for a specific event with detailed information
 */
export async function getSessionsByEvent(
  eventId: string, 
  userId?: string,
  userRole?: string
): Promise<SessionWithEventInfo[]> {
  try {
    console.log('🔍 Fetching sessions for event:', eventId, 'user:', userId, 'role:', userRole);

    // Build permission-based query
    let whereClause = 'WHERE cs.event_id = $1';
    let queryParams: any[] = [eventId];

    // If user is faculty, only show their sessions
    if (userRole === 'FACULTY' && userId) {
      whereClause += ' AND sm.faculty_id = $2';
      queryParams.push(userId);
    }

    const sessionsResult = await query(
      `SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        h.id as hall_id,
        h.name as hall_name,
        sm.faculty_id,
        u.name as faculty_name,
        sm.faculty_email,
        sm.place,
        sm.status,
        sm.invite_status,
        e.id as event_id,
        e.name as event_name,
        e.location as event_location,
        e.status as event_status
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN events e ON cs.event_id = e.id
      ${whereClause}
      ORDER BY cs.start_time ASC`,
      queryParams
    );

    const sessions: SessionWithEventInfo[] = sessionsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status || 'Draft',
      hallId: row.hall_id,
      hallName: row.hall_name,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      facultyEmail: row.faculty_email,
      place: row.place,
      inviteStatus: row.invite_status,
      eventInfo: {
        id: row.event_id,
        name: row.event_name,
        location: row.event_location,
        status: row.event_status
      }
    }));

    console.log(`✅ Found ${sessions.length} sessions for event`);
    return sessions;
    
  } catch (error) {
    console.error('❌ Error fetching sessions by event:', error);
    throw error;
  }
}

/**
 * FIXED: Get all events accessible to a user with session counts
 * Removed references to non-existent columns
 */
export async function getAccessibleEvents(
  userId: string,
  userRole: string
): Promise<EventSummary[]> {
  try {
    console.log('🔍 Fetching accessible events for user:', userId, 'role:', userRole);

    let query_text: string;
    let queryParams: any[];

    if (['ORGANIZER', 'EVENT_MANAGER'].includes(userRole)) {
      // Admin roles can see all events - FIXED: Only use existing columns
      query_text = `
        SELECT 
          e.id,
          e.name,
          e.location,
          e.status,
          e.start_date as "startDate",
          e.end_date as "endDate",
          e.created_by as "createdBy",
          COALESCE(u.name, 'Unknown') as "createdByName",
          COUNT(cs.id) as session_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN conference_sessions cs ON e.id = cs.event_id
        GROUP BY e.id, e.name, e.location, e.status, e.start_date, e.end_date, e.created_by, u.name
        ORDER BY e.start_date DESC
      `;
      queryParams = [];
    } else {
      // Regular users only see events they have access to - FIXED: Only use existing columns
      query_text = `
        SELECT DISTINCT
          e.id,
          e.name,
          e.location,
          e.status,
          e.start_date as "startDate",
          e.end_date as "endDate",
          e.created_by as "createdBy",
          COALESCE(u.name, 'Unknown') as "createdByName",
          COUNT(cs.id) as session_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN conference_sessions cs ON e.id = cs.event_id
        WHERE e.id IN (
          SELECT event_id FROM user_events WHERE user_id = $1
        ) OR e.created_by = $1
        GROUP BY e.id, e.name, e.location, e.status, e.start_date, e.end_date, e.created_by, u.name
        ORDER BY e.start_date DESC
      `;
      queryParams = [userId];
    }

    const eventsResult = await query(query_text, queryParams);

    const events: EventSummary[] = eventsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      sessionCount: parseInt(row.session_count || '0'),
      createdBy: row.createdBy,
      createdByName: row.createdByName || 'Unknown'
    }));

    console.log(`✅ Found ${events.length} accessible events for user`);
    return events;
    
  } catch (error) {
    console.error('❌ Error fetching accessible events:', error);
    throw error;
  }
}

/**
 * Update session with event validation
 */
export async function updateSessionWithEvent(
  sessionId: string,
  updates: Partial<EventSessionData>,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    console.log('🔄 Updating session:', sessionId, 'by user:', userId, 'role:', userRole);

    // Start transaction
    await query('BEGIN');

    try {
      // 1. Verify session exists and check permissions
      const sessionCheck = await query(
        `SELECT cs.*, sm.faculty_id, e.created_by as event_creator
         FROM conference_sessions cs
         LEFT JOIN session_metadata sm ON cs.id = sm.session_id
         LEFT JOIN events e ON cs.event_id = e.id
         WHERE cs.id = $1`,
        [sessionId]
      );

      if (sessionCheck.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessionCheck.rows[0];

      // 2. Check permissions
      const canEdit = (
        userRole === 'ORGANIZER' ||
        userRole === 'EVENT_MANAGER' ||
        session.event_creator === userId ||
        (userRole === 'FACULTY' && session.faculty_id === userId)
      );

      if (!canEdit) {
        throw new Error('Insufficient permissions to edit this session');
      }

      // 3. Check for time conflicts if time is being updated
      if (updates.startTime || updates.endTime) {
        const startTime = updates.startTime || session.start_time;
        const endTime = updates.endTime || session.end_time;
        const hallId = updates.hallId || session.hall_id;

        if (hallId) {
          const conflictCheck = await query(
            `SELECT id, title FROM conference_sessions 
             WHERE event_id = $1 AND hall_id = $2 AND id != $3
             AND (
               (start_time <= $4 AND end_time > $4) OR
               (start_time < $5 AND end_time >= $5) OR
               (start_time >= $4 AND end_time <= $5)
             )`,
            [session.event_id, hallId, sessionId, startTime, endTime]
          );

          if (conflictCheck.rows.length > 0) {
            throw new Error(`Time conflict detected with session: ${conflictCheck.rows[0].title}`);
          }
        }
      }

      // 4. Update conference_sessions table
      const sessionUpdates: string[] = [];
      const sessionParams: any[] = [];
      let paramIndex = 1;

      if (updates.title) {
        sessionUpdates.push(`title = $${paramIndex++}`);
        sessionParams.push(updates.title);
      }
      if (updates.description !== undefined) {
        sessionUpdates.push(`description = $${paramIndex++}`);
        sessionParams.push(updates.description);
      }
      if (updates.startTime) {
        sessionUpdates.push(`start_time = $${paramIndex++}`);
        sessionParams.push(updates.startTime);
      }
      if (updates.endTime) {
        sessionUpdates.push(`end_time = $${paramIndex++}`);
        sessionParams.push(updates.endTime);
      }
      if (updates.hallId !== undefined) {
        sessionUpdates.push(`hall_id = $${paramIndex++}`);
        sessionParams.push(updates.hallId);
      }

      if (sessionUpdates.length > 0) {
        sessionParams.push(sessionId);
        await query(
          `UPDATE conference_sessions SET ${sessionUpdates.join(', ')} WHERE id = $${paramIndex}`,
          sessionParams
        );
      }

      // 5. Update session_metadata table
      const metadataUpdates: string[] = [];
      const metadataParams: any[] = [];
      paramIndex = 1;

      if (updates.facultyId !== undefined) {
        metadataUpdates.push(`faculty_id = $${paramIndex++}`);
        metadataParams.push(updates.facultyId);
      }
      if (updates.facultyEmail !== undefined) {
        metadataUpdates.push(`faculty_email = $${paramIndex++}`);
        metadataParams.push(updates.facultyEmail);
      }
      if (updates.place !== undefined) {
        metadataUpdates.push(`place = $${paramIndex++}`);
        metadataParams.push(updates.place);
      }
      if (updates.status !== undefined) {
        metadataUpdates.push(`status = $${paramIndex++}`);
        metadataParams.push(updates.status);
      }
      if (updates.inviteStatus !== undefined) {
        metadataUpdates.push(`invite_status = $${paramIndex++}`);
        metadataParams.push(updates.inviteStatus);
      }

      if (metadataUpdates.length > 0) {
        metadataParams.push(sessionId);
        
        // Check if metadata record exists
        const metadataExists = await query(
          'SELECT session_id FROM session_metadata WHERE session_id = $1',
          [sessionId]
        );

        if (metadataExists.rows.length > 0) {
          // Update existing record - FIXED: Proper parameterization
          await query(
            `UPDATE session_metadata SET ${metadataUpdates.join(', ')} WHERE session_id = $${paramIndex}`,
            metadataParams
          );
        } else {
          // Create new metadata record - FIXED: Proper field mapping
          const fieldNames = metadataUpdates.map((update) => update.split(' = ')[0]);
          const placeholders = metadataParams.slice(0, -1).map((_, i) => `$${i + 2}`);
          
          await query(
            `INSERT INTO session_metadata (session_id, ${fieldNames.join(', ')}) VALUES ($1, ${placeholders.join(', ')})`,
            [sessionId, ...metadataParams.slice(0, -1)]
          );
        }
      }

      await query('COMMIT');
      console.log('✅ Session updated successfully:', sessionId);
      return true;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error updating session:', error);
    throw error;
  }
}

/**
 * Delete session with event validation
 */
export async function deleteSessionWithEvent(
  sessionId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    console.log('🗑️ Deleting session:', sessionId, 'by user:', userId, 'role:', userRole);

    // Start transaction
    await query('BEGIN');

    try {
      // 1. Verify session exists and check permissions
      const sessionCheck = await query(
        `SELECT cs.*, e.created_by as event_creator
         FROM conference_sessions cs
         LEFT JOIN events e ON cs.event_id = e.id
         WHERE cs.id = $1`,
        [sessionId]
      );

      if (sessionCheck.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessionCheck.rows[0];

      // 2. Check permissions
      const canDelete = (
        userRole === 'ORGANIZER' ||
        userRole === 'EVENT_MANAGER' ||
        session.event_creator === userId
      );

      if (!canDelete) {
        throw new Error('Insufficient permissions to delete this session');
      }

      // 3. Delete session metadata first (foreign key constraint)
      await query('DELETE FROM session_metadata WHERE session_id = $1', [sessionId]);

      // 4. Delete the session
      await query('DELETE FROM conference_sessions WHERE id = $1', [sessionId]);

      await query('COMMIT');
      console.log('✅ Session deleted successfully:', sessionId);
      return true;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error deleting session:', error);
    throw error;
  }
}

/**
 * Get session statistics for an event
 */
export async function getEventSessionStats(eventId: string): Promise<{
  totalSessions: number;
  confirmedSessions: number;
  draftSessions: number;
  acceptedInvites: number;
  pendingInvites: number;
  declinedInvites: number;
}> {
  try {
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN sm.status = 'Confirmed' THEN 1 END) as confirmed_sessions,
        COUNT(CASE WHEN sm.status = 'Draft' OR sm.status IS NULL THEN 1 END) as draft_sessions,
        COUNT(CASE WHEN sm.invite_status = 'Accepted' THEN 1 END) as accepted_invites,
        COUNT(CASE WHEN sm.invite_status = 'Pending' OR sm.invite_status IS NULL THEN 1 END) as pending_invites,
        COUNT(CASE WHEN sm.invite_status = 'Declined' THEN 1 END) as declined_invites
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      WHERE cs.event_id = $1`,
      [eventId]
    );

    const stats = statsResult.rows[0];
    return {
      totalSessions: parseInt(stats.total_sessions || '0'),
      confirmedSessions: parseInt(stats.confirmed_sessions || '0'),
      draftSessions: parseInt(stats.draft_sessions || '0'),
      acceptedInvites: parseInt(stats.accepted_invites || '0'),
      pendingInvites: parseInt(stats.pending_invites || '0'),
      declinedInvites: parseInt(stats.declined_invites || '0')
    };
    
  } catch (error) {
    console.error('❌ Error fetching event session stats:', error);
    throw error;
  }
}

/**
 * FIXED: Get upcoming sessions for a user across all events
 * Removed references to non-existent columns
 */
export async function getUpcomingSessionsForUser(
  userId: string,
  userRole: string,
  limit = 10
): Promise<SessionWithEventInfo[]> {
  try {
    let whereClause = 'WHERE cs.start_time > NOW()';
    let queryParams: any[] = [];

    // Filter based on user role
    if (userRole === 'FACULTY') {
      whereClause += ' AND sm.faculty_id = $1';
      queryParams.push(userId);
    } else if (userRole === 'ORGANIZER') {
      whereClause += ' AND e.created_by = $1';
      queryParams.push(userId);
    }
    // EVENT_MANAGER can see all sessions, so no additional filter

    queryParams.push(limit);
    const limitIndex = queryParams.length;

    const sessionsResult = await query(
      `SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        h.id as hall_id,
        h.name as hall_name,
        sm.faculty_id,
        u.name as faculty_name,
        sm.faculty_email,
        sm.place,
        sm.status,
        sm.invite_status,
        e.id as event_id,
        e.name as event_name,
        e.location as event_location,
        e.status as event_status
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN events e ON cs.event_id = e.id
      ${whereClause}
      ORDER BY cs.start_time ASC
      LIMIT $${limitIndex}`,
      queryParams
    );

    const sessions: SessionWithEventInfo[] = sessionsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status || 'Draft',
      hallId: row.hall_id,
      hallName: row.hall_name,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      facultyEmail: row.faculty_email,
      place: row.place,
      inviteStatus: row.invite_status,
      eventInfo: {
        id: row.event_id,
        name: row.event_name,
        location: row.event_location,
        status: row.event_status
      }
    }));

    return sessions;
    
  } catch (error) {
    console.error('❌ Error fetching upcoming sessions for user:', error);
    throw error;
  }
}

/**
 * Bulk update session invitations status
 */
export async function bulkUpdateSessionInvitations(
  sessionIds: string[],
  inviteStatus: 'Accepted' | 'Declined' | 'Pending',
  facultyId: string,
  rejectionReason?: string
): Promise<number> {
  try {
    console.log('🔄 Bulk updating session invitations:', sessionIds.length, 'sessions');

    let updatedCount = 0;
    
    for (const sessionId of sessionIds) {
      // Verify faculty has permission for this session
      const sessionCheck = await query(
        'SELECT sm.faculty_id FROM session_metadata sm WHERE sm.session_id = $1 AND sm.faculty_id = $2',
        [sessionId, facultyId]
      );

      if (sessionCheck.rows.length > 0) {
        const updateFields = ['invite_status = $2'];
        const updateParams = [sessionId, inviteStatus];
        let paramIndex = 3;

        if (rejectionReason && inviteStatus === 'Declined') {
          updateFields.push(`rejection_reason = $${paramIndex++}`);
          updateParams.push(rejectionReason);
        }

        await query(
          `UPDATE session_metadata 
           SET ${updateFields.join(', ')}, updated_at = NOW() 
           WHERE session_id = $1`,
          updateParams
        );
        
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} session invitations`);
    return updatedCount;
    
  } catch (error) {
    console.error('❌ Error bulk updating session invitations:', error);
    throw error;
  }
}