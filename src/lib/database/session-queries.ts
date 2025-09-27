import { query } from "./connection";

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
  eventId: string;
  eventName: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
  location?: string;
}

export interface DatabaseSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventId: string;
  hallId?: string;
  facultyId?: string;
  facultyName?: string;
  facultyEmail?: string;
  place?: string;
  status?: string;
  inviteStatus?: string;
  rejectionReason?: string;
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  travel?: boolean;
  accommodation?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roomName?: string;
  eventName?: string;
}

/**
 * Get all faculties from localStorage and database
 */
export async function getFaculties(): Promise<Faculty[]> {
  try {
    // Get faculties from localStorage (uploaded faculty lists)
    let localStorageFaculties: Faculty[] = [];

    if (typeof window !== "undefined") {
      const savedFacultyData = localStorage.getItem("eventFacultyData");
      if (savedFacultyData) {
        const eventFacultyData = JSON.parse(savedFacultyData);
        localStorageFaculties = eventFacultyData.flatMap(
          (eventData: any) =>
            eventData.facultyList?.map((faculty: any) => ({
              ...faculty,
              eventId: eventData.eventId,
              eventName: eventData.eventName,
            })) || []
        );
      }
    }

    // Get faculties from database
    const dbResult = await query(`
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.institution as department,
        u.institution,
        '' as expertise,
        '' as phone,
        COALESCE(ue.event_id, 'unknown') as "eventId",
        COALESCE(e.name, 'Unknown Event') as "eventName"
      FROM users u
      LEFT JOIN user_events ue ON u.id = ue.user_id
      LEFT JOIN events e ON ue.event_id = e.id
      WHERE u.role = 'FACULTY'
      ORDER BY u.name
    `);

    const dbFaculties: Faculty[] = dbResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      department: row.department,
      institution: row.institution,
      expertise: row.expertise,
      phone: row.phone,
      eventId: row.eventId,
      eventName: row.eventName,
    }));

    // Combine both sources, prioritizing localStorage data
    const allFaculties = [...localStorageFaculties, ...dbFaculties];

    // Remove duplicates based on email
    const uniqueFaculties = allFaculties.reduce((acc, faculty) => {
      const existing = acc.find((f) => f.email === faculty.email);
      if (!existing) {
        acc.push(faculty);
      }
      return acc;
    }, [] as Faculty[]);

    console.log(`✅ Retrieved ${uniqueFaculties.length} unique faculties`);
    return uniqueFaculties;
  } catch (error) {
    console.error("❌ Error fetching faculties:", error);
    return [];
  }
}

/**
 * Get all rooms from database
 */
export async function getRooms(): Promise<Room[]> {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        capacity,
        location
      FROM halls
      ORDER BY name
    `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      location: row.location,
    }));
  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    return [];
  }
}

/**
 * Get all sessions with enriched data - FIXED: Proper faculty name joining
 */
export async function getAllSessions(): Promise<DatabaseSession[]> {
  try {
    console.log("🔍 Fetching all sessions with event names...");

    const result = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        cs.event_id as "eventId",
        cs.hall_id as "hallId",
        sm.faculty_id as "facultyId",
        COALESCE(u.name, SPLIT_PART(sm.faculty_email, '@', 1), 'Unknown Faculty') as "facultyName",
        sm.faculty_email as "facultyEmail",
        sm.place,
        sm.status,
        sm.invite_status as "inviteStatus",
        sm.rejection_reason as "rejectionReason",
        sm.suggested_topic as "suggestedTopic",
        sm.suggested_time_start as "suggestedTimeStart",
        sm.suggested_time_end as "suggestedTimeEnd",
        sm.optional_query as "optionalQuery",
        sm.travel as "travel",
        sm.accommodation as "accommodation",
        cs.created_at as "createdAt",
        cs.updated_at as "updatedAt",
        -- Fix room name fetching (both rooms and halls tables)
        COALESCE(r.name, h.name, 'Unknown Room') as "roomName",
        -- Fix event name fetching with debugging
        COALESCE(e.name, 'Event Not Found') as "eventName"
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN rooms r ON cs.hall_id = r.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN events e ON cs.event_id = e.id
      ORDER BY cs.start_time DESC
    `);

    console.log(`📊 Found ${result.rows.length} sessions`);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      eventId: row.eventId,
      hallId: row.hallId,
      facultyId: row.facultyId,
      facultyName: row.facultyName,
      facultyEmail: row.facultyEmail,
      place: row.place,
      status: row.status || "Draft",
      inviteStatus: row.inviteStatus || "Pending",
      rejectionReason: row.rejectionReason,
      suggestedTopic: row.suggestedTopic,
      suggestedTimeStart: row.suggestedTimeStart,
      suggestedTimeEnd: row.suggestedTimeEnd,
      optionalQuery: row.optionalQuery,
      travel: row.travel,
      accommodation: row.accommodation,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      roomName: row.roomName,
      eventName: row.eventName,
    }));
  } catch (error) {
    console.error("❌ Error fetching sessions:", error);
    return [];
  }
}

/**
 * Get session by ID
 */
export async function getSessionById(
  sessionId: string
): Promise<DatabaseSession | null> {
  try {
    const result = await query(
      `
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        cs.event_id as "eventId",
        cs.hall_id as "hallId",
        sm.faculty_id as "facultyId",
        COALESCE(u.name, SPLIT_PART(sm.faculty_email, '@', 1), 'Unknown Faculty') as "facultyName",
        sm.faculty_email as "facultyEmail",
        sm.place,
        sm.status,
        sm.invite_status as "inviteStatus",
        sm.rejection_reason as "rejectionReason",
        sm.suggested_topic as "suggestedTopic",
        sm.suggested_time_start as "suggestedTimeStart",
        sm.suggested_time_end as "suggestedTimeEnd",
        sm.optional_query as "optionalQuery",
        sm.travel as "travel",
        sm.accommodation as "accommodation",
        cs.created_at as "createdAt",
        cs.updated_at as "updatedAt",
        h.name as "roomName",
        e.name as "eventName"
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN users u ON sm.faculty_id = u.id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN events e ON cs.event_id = e.id
      WHERE cs.id = $1
    `,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      eventId: row.eventId,
      hallId: row.hallId,
      facultyId: row.facultyId,
      facultyName: row.facultyName,
      facultyEmail: row.facultyEmail,
      place: row.place,
      status: row.status || "Draft",
      inviteStatus: row.inviteStatus || "Pending",
      rejectionReason: row.rejectionReason,
      suggestedTopic: row.suggestedTopic,
      suggestedTimeStart: row.suggestedTimeStart,
      suggestedTimeEnd: row.suggestedTimeEnd,
      optionalQuery: row.optionalQuery,
      travel: row.travel,
      accommodation: row.accommodation,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      roomName: row.roomName,
      eventName: row.eventName,
    };
  } catch (error) {
    console.error("❌ Error fetching session by ID:", error);
    return null;
  }
}

/**
 * ✅ NEW: Update session by ID - Complete implementation
 */
export async function updateSessionById(
  sessionId: string,
  updateData: Partial<DatabaseSession>
): Promise<DatabaseSession | null> {
  try {
    console.log("🔄 Updating session:", sessionId, updateData);

    // Start transaction
    await query("BEGIN");

    try {
      // Update conference_sessions table
      const sessionUpdateFields: string[] = [];
      const sessionUpdateValues: any[] = [];
      let sessionParamIndex = 1;

      if (updateData.title !== undefined) {
        sessionUpdateFields.push(`title = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.title);
      }

      if (updateData.description !== undefined) {
        sessionUpdateFields.push(`description = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.description);
      }

      if (updateData.startTime !== undefined) {
        sessionUpdateFields.push(`start_time = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.startTime);
      }

      if (updateData.endTime !== undefined) {
        sessionUpdateFields.push(`end_time = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.endTime);
      }

      if (updateData.hallId !== undefined) {
        sessionUpdateFields.push(`hall_id = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.hallId);
      }

      if (updateData.eventId !== undefined) {
        sessionUpdateFields.push(`event_id = $${sessionParamIndex++}`);
        sessionUpdateValues.push(updateData.eventId);
      }

      // Update conference_sessions if there are fields to update
      if (sessionUpdateFields.length > 0) {
        sessionUpdateFields.push("updated_at = NOW()");
        sessionUpdateValues.push(sessionId);

        const sessionUpdateQuery = `
          UPDATE conference_sessions 
          SET ${sessionUpdateFields.join(", ")} 
          WHERE id = $${sessionParamIndex}
        `;

        console.log("📊 Session update query:", sessionUpdateQuery);
        console.log("📊 Session update values:", sessionUpdateValues);

        await query(sessionUpdateQuery, sessionUpdateValues);
      }

      // Update session_metadata table
      const metadataUpdateFields: string[] = [];
      const metadataUpdateValues: any[] = [];
      let metadataParamIndex = 1;

      if (updateData.facultyId !== undefined) {
        metadataUpdateFields.push(`faculty_id = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.facultyId);
      }

      if (updateData.facultyEmail !== undefined) {
        metadataUpdateFields.push(`faculty_email = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.facultyEmail);
      }

      if (updateData.place !== undefined) {
        metadataUpdateFields.push(`place = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.place);
      }

      if (updateData.status !== undefined) {
        metadataUpdateFields.push(`status = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.status);
      }

      if (updateData.inviteStatus !== undefined) {
        metadataUpdateFields.push(`invite_status = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.inviteStatus);
      }

      if (updateData.rejectionReason !== undefined) {
        metadataUpdateFields.push(
          `rejection_reason = $${metadataParamIndex++}`
        );
        metadataUpdateValues.push(updateData.rejectionReason);
      }

      if (updateData.suggestedTopic !== undefined) {
        metadataUpdateFields.push(`suggested_topic = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.suggestedTopic);
      }

      if (updateData.suggestedTimeStart !== undefined) {
        metadataUpdateFields.push(
          `suggested_time_start = $${metadataParamIndex++}`
        );
        metadataUpdateValues.push(updateData.suggestedTimeStart);
      }

      if (updateData.suggestedTimeEnd !== undefined) {
        metadataUpdateFields.push(
          `suggested_time_end = $${metadataParamIndex++}`
        );
        metadataUpdateValues.push(updateData.suggestedTimeEnd);
      }

      if (updateData.optionalQuery !== undefined) {
        metadataUpdateFields.push(`optional_query = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.optionalQuery);
      }

      if (updateData.travel !== undefined) {
        metadataUpdateFields.push(`travel = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.travel);
      }

      if (updateData.accommodation !== undefined) {
        metadataUpdateFields.push(`accommodation = $${metadataParamIndex++}`);
        metadataUpdateValues.push(updateData.accommodation);
      }

      // Update session_metadata if there are fields to update
      if (metadataUpdateFields.length > 0) {
        metadataUpdateFields.push("updated_at = NOW()");
        metadataUpdateValues.push(sessionId);

        const metadataUpdateQuery = `
          UPDATE session_metadata 
          SET ${metadataUpdateFields.join(", ")} 
          WHERE session_id = $${metadataParamIndex}
        `;

        console.log("📊 Metadata update query:", metadataUpdateQuery);
        console.log("📊 Metadata update values:", metadataUpdateValues);

        await query(metadataUpdateQuery, metadataUpdateValues);
      }

      await query("COMMIT");
      console.log("✅ Session updated successfully");

      // Return updated session
      return await getSessionById(sessionId);
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error updating session:", error);
    return null;
  }
}

/**
 * ✅ NEW: Delete session by ID - Complete implementation
 */
export async function deleteSessionById(sessionId: string): Promise<boolean> {
  try {
    console.log("🗑️ Deleting session:", sessionId);

    // Start transaction
    await query("BEGIN");

    try {
      // Delete metadata first (due to foreign key constraint)
      await query("DELETE FROM session_metadata WHERE session_id = $1", [
        sessionId,
      ]);

      // Delete session
      const result = await query(
        "DELETE FROM conference_sessions WHERE id = $1",
        [sessionId]
      );

      await query("COMMIT");
      console.log("✅ Session deleted successfully");

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error deleting session:", error);
    return false;
  }
}

/**
 * Update session metadata - FIXED: Handle null rowCount
 */
export async function updateSessionMetadata(
  sessionId: string,
  updates: Partial<DatabaseSession>
): Promise<boolean> {
  try {
    console.log("🔄 Updating session metadata:", sessionId, updates);

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }

    if (updates.inviteStatus !== undefined) {
      updateFields.push(`invite_status = $${paramIndex++}`);
      updateValues.push(updates.inviteStatus);
    }

    if (updates.rejectionReason !== undefined) {
      updateFields.push(`rejection_reason = $${paramIndex++}`);
      updateValues.push(updates.rejectionReason);
    }

    if (updates.suggestedTopic !== undefined) {
      updateFields.push(`suggested_topic = $${paramIndex++}`);
      updateValues.push(updates.suggestedTopic);
    }

    if (updates.suggestedTimeStart !== undefined) {
      updateFields.push(`suggested_time_start = $${paramIndex++}`);
      updateValues.push(updates.suggestedTimeStart);
    }

    if (updates.suggestedTimeEnd !== undefined) {
      updateFields.push(`suggested_time_end = $${paramIndex++}`);
      updateValues.push(updates.suggestedTimeEnd);
    }

    if (updates.optionalQuery !== undefined) {
      updateFields.push(`optional_query = $${paramIndex++}`);
      updateValues.push(updates.optionalQuery);
    }

    if (updateFields.length === 0) {
      console.log("⚠️ No fields to update");
      return true;
    }

    // Add session_id and updated_at
    updateValues.push(sessionId);
    updateFields.push("updated_at = NOW()");

    const updateQuery = `
      UPDATE session_metadata 
      SET ${updateFields.join(", ")} 
      WHERE session_id = $${paramIndex}
    `;

    const result = await query(updateQuery, updateValues);
    console.log("✅ Session metadata updated successfully");

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("❌ Error updating session metadata:", error);
    return false;
  }
}

/**
 * Delete session - FIXED: Handle null rowCount
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    console.log("🗑️ Deleting session:", sessionId);

    // Start transaction
    await query("BEGIN");

    try {
      // Delete metadata first
      await query("DELETE FROM session_metadata WHERE session_id = $1", [
        sessionId,
      ]);

      // Delete session
      const result = await query(
        "DELETE FROM conference_sessions WHERE id = $1",
        [sessionId]
      );

      await query("COMMIT");
      console.log("✅ Session deleted successfully");

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error deleting session:", error);
    return false;
  }
}
