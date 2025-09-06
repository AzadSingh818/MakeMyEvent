import { query } from "@/lib/database/connection";

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
  status: "Draft" | "Confirmed";
  inviteStatus?: "Pending" | "Accepted" | "Declined";
  travel?: boolean;        // ✅ Add this
  accommodation?: boolean; // ✅ Add this
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

/**
 * Create a new session linked to a specific event - FIXED: Local datetime storage
 */
export async function createSessionWithEvent(
  sessionData: EventSessionData
): Promise<string> {
  try {
    console.log("🔄 Creating session with event integration:", sessionData);

    // Start transaction
    await query("BEGIN");

    try {
      // 1. Verify event exists and is active
      const eventCheck = await query(
        "SELECT id, name, status FROM events WHERE id = $1",
        [sessionData.eventId]
      );

      if (eventCheck.rows.length === 0) {
        throw new Error(`Event with ID ${sessionData.eventId} not found`);
      }

      const event = eventCheck.rows[0];
      console.log("✅ Event verified:", event.name);

      // 2. Check for time conflicts in the same hall (using local time comparison)
      if (sessionData.hallId) {
        const conflictCheck = await query(
          `SELECT id, title FROM conference_sessions 
           WHERE event_id = $1 AND hall_id = $2 
           AND (
             (start_time <= $3::timestamp AND end_time > $3::timestamp) OR
             (start_time < $4::timestamp AND end_time >= $4::timestamp) OR
             (start_time >= $3::timestamp AND end_time <= $4::timestamp)
           )`,
          [
            sessionData.eventId,
            sessionData.hallId,
            sessionData.startTime,
            sessionData.endTime,
          ]
        );

        if (conflictCheck.rows.length > 0) {
          throw new Error(
            `Time conflict detected with session: ${conflictCheck.rows[0].title}`
          );
        }
      }

      // 3. Create session in conference_sessions table - FIXED: Store as local timestamp
      const sessionResult = await query(
        `INSERT INTO conference_sessions (
          id, event_id, title, description, start_time, end_time, hall_id, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5::timestamp, $6::timestamp, $7, $8, NOW(), NOW())
        RETURNING id`,
        [
          sessionData.sessionId,
          sessionData.eventId,
          sessionData.title,
          sessionData.description || null,
          sessionData.startTime, // Store as local timestamp
          sessionData.endTime, // Store as local timestamp
          sessionData.hallId || null,
          sessionData.facultyId || "system",
        ]
      );

      console.log(
        "✅ Session created in conference_sessions table:",
        sessionResult.rows[0].id
      );

      // 4. Create session metadata if additional data exists
      if (
        sessionData.facultyId ||
        sessionData.facultyEmail ||
        sessionData.place ||
        sessionData.status ||
        sessionData.travel !== undefined ||
        sessionData.accommodation !== undefined
      ) {
        // Ensure session_metadata table exists with proper timestamp columns
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
            travel BOOLEAN DEFAULT FALSE,           -- ✅ Add this
            accommodation BOOLEAN DEFAULT FALSE,    -- ✅ Add this
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(
          `INSERT INTO session_metadata (
            session_id, faculty_id, faculty_email, place, status, invite_status, travel, accommodation, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            sessionData.sessionId,
            sessionData.facultyId || null,
            sessionData.facultyEmail || null,
            sessionData.place || null,
            sessionData.status || "Draft",
            sessionData.inviteStatus || "Pending",
            sessionData.travel || false,        // ✅ Add this
            sessionData.accommodation || false, // ✅ Add this
          ]
        );

        console.log("✅ Session metadata created");
      }

      // 5. Handle faculty user creation/association
      if (sessionData.facultyId && sessionData.facultyEmail) {
        console.log(
          "🔍 Processing faculty user:",
          sessionData.facultyId,
          sessionData.facultyEmail
        );

        // Check if user exists by email first
        const existingUserResult = await query(
          "SELECT id FROM users WHERE email = $1",
          [sessionData.facultyEmail]
        );

        let userIdToUse = sessionData.facultyId;

        if (existingUserResult.rows.length === 0) {
          // Create new faculty user
          try {
            const userName = sessionData.facultyEmail.split("@")[0];
            await query(
              `INSERT INTO users (id, email, name, role, password, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO UPDATE SET
                 email = EXCLUDED.email,
                 name = EXCLUDED.name,
                 updated_at = CURRENT_TIMESTAMP`,
              [
                sessionData.facultyId,
                sessionData.facultyEmail,
                userName,
                "FACULTY",
                "$2b$12$defaultPasswordHash",
              ]
            );
            console.log(
              "✅ Created/updated faculty user with ID:",
              sessionData.facultyId
            );
          } catch (userError: any) {
            console.warn("⚠️ User creation skipped:", userError.message);
          }
        } else {
          userIdToUse = existingUserResult.rows[0].id;
          console.log("ℹ️ Using existing user ID:", userIdToUse);
        }

        // Create user_events association if it doesn't exist
        try {
          await query(
            `INSERT INTO user_events (id, user_id, event_id, role, permissions, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, event_id) DO NOTHING`,
            [userIdToUse, sessionData.eventId, "SPEAKER", "VIEW_ONLY"]
          );
          console.log("✅ Created/verified user_events association");
        } catch (eventError: any) {
          console.warn(
            "⚠️ User_events association skipped:",
            eventError.message
          );
        }
      }

      await query("COMMIT");
      console.log(
        "✅ Session created successfully with local timestamps:",
        sessionData.sessionId
      );

      return sessionResult.rows[0].id;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error creating session with event:", error);
    throw error;
  }
}

/**
 * Update session with event validation - FIXED: Handle local timestamps
 */
export async function updateSessionWithEvent(
  sessionId: string,
  updates: Partial<EventSessionData>,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    console.log(
      "🔄 Updating session:",
      sessionId,
      "by user:",
      userId,
      "role:",
      userRole
    );

    // Start transaction
    await query("BEGIN");

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
        throw new Error("Session not found");
      }

      const session = sessionCheck.rows[0];

      // 2. Check permissions
      const canEdit =
        userRole === "ORGANIZER" ||
        userRole === "EVENT_MANAGER" ||
        session.event_creator === userId ||
        (userRole === "FACULTY" && session.faculty_id === userId);

      if (!canEdit) {
        throw new Error("Insufficient permissions to edit this session");
      }

      // 3. Update conference_sessions table with local timestamps
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
        sessionUpdates.push(`start_time = $${paramIndex++}::timestamp`);
        sessionParams.push(updates.startTime);
      }
      if (updates.endTime) {
        sessionUpdates.push(`end_time = $${paramIndex++}::timestamp`);
        sessionParams.push(updates.endTime);
      }
      if (updates.hallId !== undefined) {
        sessionUpdates.push(`hall_id = $${paramIndex++}`);
        sessionParams.push(updates.hallId);
      }

      if (sessionUpdates.length > 0) {
        sessionUpdates.push("updated_at = NOW()");
        sessionParams.push(sessionId);
        await query(
          `UPDATE conference_sessions SET ${sessionUpdates.join(
            ", "
          )} WHERE id = $${paramIndex}`,
          sessionParams
        );
      }

      // 4. Update session_metadata table
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
        metadataUpdates.push("updated_at = NOW()");
        metadataParams.push(sessionId);

        // Check if metadata record exists
        const metadataExists = await query(
          "SELECT session_id FROM session_metadata WHERE session_id = $1",
          [sessionId]
        );

        if (metadataExists.rows.length > 0) {
          // Update existing record
          await query(
            `UPDATE session_metadata SET ${metadataUpdates.join(
              ", "
            )} WHERE session_id = $${paramIndex}`,
            metadataParams
          );
        } else {
          // Create new metadata record
          const fieldNames = metadataUpdates
            .slice(0, -1)
            .map((update) => update.split(" = ")[0]);
          const placeholders = metadataParams
            .slice(0, -1)
            .map((_, i) => `$${i + 2}`);

          await query(
            `INSERT INTO session_metadata (session_id, ${fieldNames.join(
              ", "
            )}) VALUES ($1, ${placeholders.join(", ")})`,
            [sessionId, ...metadataParams.slice(0, -1)]
          );
        }
      }

      await query("COMMIT");
      console.log(
        "✅ Session updated successfully with local timestamps:",
        sessionId
      );
      return true;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error updating session:", error);
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
    console.log(
      "🗑️ Deleting session:",
      sessionId,
      "by user:",
      userId,
      "role:",
      userRole
    );

    // Start transaction
    await query("BEGIN");

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
        throw new Error("Session not found");
      }

      const session = sessionCheck.rows[0];

      // 2. Check permissions
      const canDelete =
        userRole === "ORGANIZER" ||
        userRole === "EVENT_MANAGER" ||
        session.event_creator === userId;

      if (!canDelete) {
        throw new Error("Insufficient permissions to delete this session");
      }

      // 3. Delete session metadata first (foreign key constraint)
      await query("DELETE FROM session_metadata WHERE session_id = $1", [
        sessionId,
      ]);

      // 4. Delete the session
      await query("DELETE FROM conference_sessions WHERE id = $1", [sessionId]);

      await query("COMMIT");
      console.log("✅ Session deleted successfully:", sessionId);
      return true;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error deleting session:", error);
    throw error;
  }
}
