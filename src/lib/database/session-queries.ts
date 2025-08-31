// src/lib/database/session-queries.ts
import { query } from './connection';

// Define types based on your frontend requirements
export interface Session {
  id: string;
  title: string;
  facultyId: string;
  email: string;
  place: string;
  roomId: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  travelStatus?: string;
  facultyName?: string;
  roomName?: string;
  duration?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
  equipment?: any;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  institution?: string;
}

// Default event ID - we'll create one if it doesn't exist
const DEFAULT_EVENT_ID = 'default-conference-2025';

/**
 * Ensure default event exists
 */
export async function ensureDefaultEvent(): Promise<string> {
  try {
    // Check if default event exists
    const result = await query(
      'SELECT id FROM events WHERE id = $1',
      [DEFAULT_EVENT_ID]
    );

    if (result.rows.length > 0) {
      return DEFAULT_EVENT_ID;
    }

    // Create default event (removed 'venue' column since it doesn't exist)
    await query(`
      INSERT INTO events (id, name, description, start_date, end_date, location, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      DEFAULT_EVENT_ID,
      'Scientific Conference 2025',
      'Default conference for session management',
      new Date('2025-08-25'),
      new Date('2025-08-31'),
      'Conference Center',
      'ACTIVE'
    ]);

    console.log('✅ Default event created:', DEFAULT_EVENT_ID);
    return DEFAULT_EVENT_ID;
  } catch (error) {
    console.error('❌ Error ensuring default event:', error);
    throw error;
  }
}

/**
 * Create tables for session management if they don't exist
 */
export async function ensureSessionTables(): Promise<void> {
  try {
    // Create session_metadata table to store additional session data
    await query(`
      CREATE TABLE IF NOT EXISTS session_metadata (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES conference_sessions(id) ON DELETE CASCADE,
        faculty_id VARCHAR(255) NOT NULL,
        faculty_email VARCHAR(255) NOT NULL,
        place VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'Draft',
        invite_status VARCHAR(20) DEFAULT 'Pending',
        rejection_reason VARCHAR(50),
        suggested_topic TEXT,
        suggested_time_start TIMESTAMP,
        suggested_time_end TIMESTAMP,
        optional_query TEXT,
        travel_status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Session tables ensured');
  } catch (error) {
    console.error('❌ Error creating session tables:', error);
    throw error;
  }
}

/**
 * Get all sessions with enriched data
 */
export async function getSessions(): Promise<Session[]> {
  try {
    await ensureDefaultEvent();
    await ensureSessionTables();

    const result = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as startTime,
        cs.end_time as endTime,
        cs.hall_id as roomId,
        sm.faculty_id as facultyId,
        sm.faculty_email as email,
        sm.place,
        sm.status,
        sm.invite_status as inviteStatus,
        sm.rejection_reason as rejectionReason,
        sm.suggested_topic as suggestedTopic,
        sm.suggested_time_start as suggestedTimeStart,
        sm.suggested_time_end as suggestedTimeEnd,
        sm.optional_query as optionalQuery,
        sm.travel_status as travelStatus,
        u.name as facultyName,
        h.name as roomName
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.event_id = $1
      ORDER BY cs.start_time ASC
    `, [DEFAULT_EVENT_ID]);

    return result.rows.map(mapDatabaseRowToSession);
  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    throw error;
  }
}

/**
 * Get session by ID
 */
export async function getSessionById(id: string): Promise<Session | undefined> {
  try {
    const result = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as startTime,
        cs.end_time as endTime,
        cs.hall_id as roomId,
        sm.faculty_id as facultyId,
        sm.faculty_email as email,
        sm.place,
        sm.status,
        sm.invite_status as inviteStatus,
        sm.rejection_reason as rejectionReason,
        sm.suggested_topic as suggestedTopic,
        sm.suggested_time_start as suggestedTimeStart,
        sm.suggested_time_end as suggestedTimeEnd,
        sm.optional_query as optionalQuery,
        sm.travel_status as travelStatus,
        u.name as facultyName,
        h.name as roomName
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.id = $1
    `, [id]);

    if (result.rows.length === 0) return undefined;
    return mapDatabaseRowToSession(result.rows[0]);
  } catch (error) {
    console.error('❌ Error getting session by ID:', error);
    throw error;
  }
}

/**
 * Add new session
 */
export async function addSession(session: Session): Promise<void> {
  try {
    const eventId = await ensureDefaultEvent();
    await ensureSessionTables();

    // Start transaction
    await query('BEGIN');

    try {
      // Insert into conference_sessions
      await query(`
        INSERT INTO conference_sessions (id, event_id, title, description, start_time, end_time, hall_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        session.id,
        eventId,
        session.title,
        session.description || '',
        session.startTime,
        session.endTime,
        session.roomId
      ]);

      // Insert into session_metadata
      await query(`
        INSERT INTO session_metadata (id, session_id, faculty_id, faculty_email, place, status, invite_status, travel_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        `meta_${session.id}`,
        session.id,
        session.facultyId,
        session.email,
        session.place,
        session.status,
        session.inviteStatus,
        session.travelStatus || 'Pending'
      ]);

      await query('COMMIT');
      console.log('✅ Session added successfully:', session.id);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Error adding session:', error);
    throw error;
  }
}

/**
 * Update session
 */
export async function updateSession(id: string, updates: Partial<Session>): Promise<void> {
  try {
    await query('BEGIN');

    try {
      // Update conference_sessions if needed
      if (updates.title || updates.description || updates.startTime || updates.endTime || updates.roomId) {
        const setParts = [];
        const values = [];
        let paramIndex = 1;

        if (updates.title) {
          setParts.push(`title = $${paramIndex++}`);
          values.push(updates.title);
        }
        if (updates.description) {
          setParts.push(`description = $${paramIndex++}`);
          values.push(updates.description);
        }
        if (updates.startTime) {
          setParts.push(`start_time = $${paramIndex++}`);
          values.push(updates.startTime);
        }
        if (updates.endTime) {
          setParts.push(`end_time = $${paramIndex++}`);
          values.push(updates.endTime);
        }
        if (updates.roomId) {
          setParts.push(`hall_id = $${paramIndex++}`);
          values.push(updates.roomId);
        }

        if (setParts.length > 0) {
          setParts.push(`updated_at = NOW()`);
          values.push(id);
          
          await query(`
            UPDATE conference_sessions 
            SET ${setParts.join(', ')}
            WHERE id = $${paramIndex}
          `, values);
        }
      }

      // Update session_metadata
      const metaSetParts = [];
      const metaValues = [];
      let metaParamIndex = 1;

      const metaFields = [
        'facultyId', 'email', 'place', 'status', 'inviteStatus', 
        'rejectionReason', 'suggestedTopic', 'suggestedTimeStart', 
        'suggestedTimeEnd', 'optionalQuery', 'travelStatus'
      ];

      const metaMapping = {
        facultyId: 'faculty_id',
        email: 'faculty_email',
        place: 'place',
        status: 'status',
        inviteStatus: 'invite_status',
        rejectionReason: 'rejection_reason',
        suggestedTopic: 'suggested_topic',
        suggestedTimeStart: 'suggested_time_start',
        suggestedTimeEnd: 'suggested_time_end',
        optionalQuery: 'optional_query',
        travelStatus: 'travel_status'
      };

      for (const field of metaFields) {
        if (updates[field as keyof Session] !== undefined) {
          metaSetParts.push(`${metaMapping[field as keyof typeof metaMapping]} = $${metaParamIndex++}`);
          metaValues.push(updates[field as keyof Session]);
        }
      }

      if (metaSetParts.length > 0) {
        metaSetParts.push(`updated_at = NOW()`);
        metaValues.push(id);
        
        await query(`
          UPDATE session_metadata 
          SET ${metaSetParts.join(', ')}
          WHERE session_id = $${metaParamIndex}
        `, metaValues);
      }

      await query('COMMIT');
      console.log('✅ Session updated successfully:', id);
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
 * Delete session
 */
export async function deleteSession(id: string): Promise<void> {
  try {
    await query('BEGIN');

    try {
      // Delete from session_metadata first (foreign key constraint)
      await query('DELETE FROM session_metadata WHERE session_id = $1', [id]);
      
      // Delete from conference_sessions
      await query('DELETE FROM conference_sessions WHERE id = $1', [id]);

      await query('COMMIT');
      console.log('✅ Session deleted successfully:', id);
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
 * Get sessions by faculty email
 */
export async function getSessionsByEmail(email: string): Promise<Session[]> {
  try {
    const result = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as startTime,
        cs.end_time as endTime,
        cs.hall_id as roomId,
        sm.faculty_id as facultyId,
        sm.faculty_email as email,
        sm.place,
        sm.status,
        sm.invite_status as inviteStatus,
        sm.rejection_reason as rejectionReason,
        sm.suggested_topic as suggestedTopic,
        sm.suggested_time_start as suggestedTimeStart,
        sm.suggested_time_end as suggestedTimeEnd,
        sm.optional_query as optionalQuery,
        sm.travel_status as travelStatus,
        u.name as facultyName,
        h.name as roomName
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE LOWER(sm.faculty_email) = LOWER($1)
      ORDER BY cs.start_time ASC
    `, [email]);

    return result.rows.map(mapDatabaseRowToSession);
  } catch (error) {
    console.error('❌ Error getting sessions by email:', error);
    throw error;
  }
}

/**
 * Get all rooms
 */
export async function getRooms(): Promise<Room[]> {
  try {
    const eventId = await ensureDefaultEvent();
    
    // First, ensure we have some default rooms
    await query(`
      INSERT INTO halls (id, event_id, name, capacity, created_at)
      VALUES 
        ('A101', $1, 'Auditorium 101', 200, NOW()),
        ('B202', $1, 'Building B - Room 202', 50, NOW()),
        ('C303', $1, 'Conference Room 303', 30, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [eventId]);

    const result = await query(`
      SELECT id, name, capacity, equipment
      FROM halls 
      WHERE event_id = $1
      ORDER BY name
    `, [eventId]);

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting rooms:', error);
    throw error;
  }
}

/**
 * Get all faculties
 */
export async function getFaculties(): Promise<Faculty[]> {
  try {
    // First, ensure we have some default faculty (added password field)
    await query(`
      INSERT INTO users (id, name, email, role, password, created_at)
      VALUES 
        ('faculty_1', 'Dr. Ramesh Sharma', 'ramesh.sharma@university.edu', 'FACULTY', 'temp_password_123', NOW()),
        ('faculty_2', 'Prof. Anita Gupta', 'anita.gupta@university.edu', 'FACULTY', 'temp_password_123', NOW()),
        ('faculty_3', 'Dr. Sunil Verma', 'sunil.verma@university.edu', 'FACULTY', 'temp_password_123', NOW())
      ON CONFLICT (email) DO NOTHING
    `);

    const result = await query(`
      SELECT id, name, email, institution
      FROM users 
      WHERE role = 'FACULTY'
      ORDER BY name
    `);

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting faculties:', error);
    throw error;
  }
}

/**
 * Map database row to Session object
 */
function mapDatabaseRowToSession(row: any): Session {
  const start = row.starttime ? new Date(row.starttime) : null;
  const end = row.endtime ? new Date(row.endtime) : null;
  
  let duration = "";
  if (start && end) {
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (minutes > 0) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      duration = hours > 0 ? `${hours}h ${mins}m` : `${minutes} min`;
    }
  }

  return {
    id: row.id,
    title: row.title || '',
    facultyId: row.facultyid || '',
    email: row.email || '',
    place: row.place || '',
    roomId: row.roomid || '',
    description: row.description,
    startTime: row.starttime,
    endTime: row.endtime,
    status: row.status || 'Draft',
    inviteStatus: row.invitestatus || 'Pending',
    rejectionReason: row.rejectionreason,
    suggestedTopic: row.suggestedtopic,
    suggestedTimeStart: row.suggestedtimestart,
    suggestedTimeEnd: row.suggestedtimeend,
    optionalQuery: row.optionalquery,
    travelStatus: row.travelstatus,
    facultyName: row.facultyname,
    roomName: row.roomname,
    duration,
    formattedStartTime: start ? start.toLocaleString() : undefined,
    formattedEndTime: end ? end.toLocaleString() : undefined,
  };
}