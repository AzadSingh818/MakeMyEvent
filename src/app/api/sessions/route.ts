import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getAllSessions,
  getFaculties,
  getRooms,
  getSessionById,
} from "@/lib/database/session-queries";
import { createSessionWithEvent } from "@/lib/database/event-session-integration";
import { sendInviteEmail } from "../_utils/session-email";

// Helper function to parse datetime-local strings consistently (like original)
function parseLocalDateTime(dateTimeStr: string) {
  if (!dateTimeStr) return null;

  try {
    // Keep the original behavior: if it's datetime-local format, use as-is
    if (
      dateTimeStr.includes("T") &&
      !dateTimeStr.includes("Z") &&
      dateTimeStr.length <= 19
    ) {
      // This is datetime-local format - keep exactly as entered
      return dateTimeStr.endsWith(":00") ? dateTimeStr : dateTimeStr + ":00";
    } else {
      // For ISO strings, keep the original conversion behavior
      return new Date(dateTimeStr).toISOString();
    }
  } catch (error) {
    console.error("Error parsing datetime:", error);
    return null;
  }
}

// Helper function to check for scheduling conflicts (same as original)
async function checkSessionConflicts(
  sessionData: {
    facultyId: string;
    roomId: string;
    startTime: string;
    endTime: string;
  },
  excludeSessionId?: string
) {
  const allSessions = await getAllSessions();
  const conflicts = [];

  const newStart = new Date(sessionData.startTime);
  const newEnd = new Date(sessionData.endTime);

  for (const existingSession of allSessions) {
    if (excludeSessionId && existingSession.id === excludeSessionId) {
      continue;
    }

    const existingStart = new Date(existingSession.startTime);
    const existingEnd = new Date(existingSession.endTime);

    const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;

    if (hasTimeOverlap) {
      // Faculty conflict
      if (existingSession.facultyId === sessionData.facultyId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.hallId,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          type: "faculty",
          message: `Faculty is already scheduled for "${existingSession.title}" during this time`,
          sessionTitle: existingSession.title,
        });
      }

      // Room conflict
      if (existingSession.hallId === sessionData.roomId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.hallId,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          type: "room",
          message: `Room is already booked for "${existingSession.title}" during this time`,
          sessionTitle: existingSession.title,
        });
      }
    }
  }

  return conflicts;
}

// GET: list all sessions enriched for listing pages
export async function GET() {
  try {
    const sessions = await getAllSessions();
    const faculties = await getFaculties();
    const rooms = await getRooms();

    const enriched = sessions.map((s) => {
      const faculty = faculties.find((f) => f.id === s.facultyId);
      const room = rooms.find((r) => r.id === s.hallId);

      // Keep original duration calculation behavior
      let durationMin = 0;
      try {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        durationMin = Math.max(
          0,
          Math.round((end.getTime() - start.getTime()) / 60000)
        );
      } catch (error) {
        // Handle invalid dates gracefully
      }

      return {
        ...s,
        facultyName: s.facultyName || faculty?.name || "Unknown Faculty",
        roomName: s.roomName || room?.name || s.hallId || "Unknown Room",
        roomId: s.hallId, // Map hallId to roomId for frontend compatibility
        email: s.facultyEmail || faculty?.email || "",
        duration: durationMin > 0 ? `${durationMin} minutes` : "",
        formattedStartTime: s.startTime,
        formattedEndTime: s.endTime,
      };
    });

    return NextResponse.json(
      { success: true, data: { sessions: enriched }, count: enriched.length },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("❌ Error fetching sessions:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: e?.message || "",
      },
      { status: 500 }
    );
  }
}

// POST: create a session via multipart/form-data (keeping original behavior)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported content type. Use multipart/form-data",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    // Required fields (same as original)
    const title = formData.get("title")?.toString() || "";
    const facultyId = formData.get("facultyId")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const place = formData.get("place")?.toString() || "";
    const roomId = formData.get("roomId")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const startTime = formData.get("startTime")?.toString() || "";
    const endTime = formData.get("endTime")?.toString() || "";
    const eventId =
      formData.get("eventId")?.toString() || "default-conference-2025";
    const status =
      (formData.get("status")?.toString() as "Draft" | "Confirmed") || "Draft";
    const inviteStatus =
      (formData.get("inviteStatus")?.toString() as
        | "Pending"
        | "Accepted"
        | "Declined") || "Pending";
    // ✅ NEW: Extract travel and accommodation
    const travel = formData.get("travel")?.toString();
    const accommodation = formData.get("accommodation")?.toString();

    // Convert to boolean values
    const travelRequired = travel === "yes";
    const accommodationRequired = accommodation === "yes";
    console.log("📋 Creating session with data:", {
      title,
      facultyId,
      email,
      place,
      roomId,
      startTime,
      endTime,
      eventId,
      status,
      travel: travelRequired,           // ✅ Add this
      accommodation: accommodationRequired, // ✅ Add this
    });

    // Check if this is a conflict-only request (same as original)
    const conflictOnly = formData.get("conflictOnly")?.toString() === "true";
    const overwriteConflicts =
      formData.get("overwriteConflicts")?.toString() === "true";

    if (
      !title ||
      !facultyId ||
      !email ||
      !place ||
      !roomId ||
      !description ||
      !startTime
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // FIXED: Keep original datetime handling behavior
    let finalStartTime: string;
    let finalEndTime: string;

    try {
      // Parse using original behavior - keep datetime-local as-is
      const parsedStartTime = parseLocalDateTime(startTime);
      const parsedEndTime = endTime ? parseLocalDateTime(endTime) : null;

      if (!parsedStartTime) {
        throw new Error("Invalid start time format");
      }

      finalStartTime = parsedStartTime;

      if (!parsedEndTime) {
        // Default to 1 hour after start time (same as original)
        const startDate = new Date(finalStartTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        finalEndTime = endDate.toISOString();
      } else {
        finalEndTime = parsedEndTime;
      }

      // Validate time logic (same as original)
      const start = new Date(finalStartTime);
      const end = new Date(finalEndTime);

      if (end <= start) {
        return NextResponse.json(
          { success: false, error: "End time must be after start time" },
          { status: 400 }
        );
      }

      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        return NextResponse.json(
          { success: false, error: "Session must be at least 15 minutes long" },
          { status: 400 }
        );
      }

      console.log("🕒 Time handling (preserving original behavior):", {
        originalStart: startTime,
        originalEnd: endTime,
        finalStart: finalStartTime,
        finalEnd: finalEndTime,
        duration: `${durationMinutes} minutes`,
      });
    } catch (timeError) {
      console.error("❌ Time parsing error:", timeError);
      return NextResponse.json(
        { success: false, error: "Invalid time format" },
        { status: 400 }
      );
    }

    // Check for conflicts (same as original)
    const conflicts = await checkSessionConflicts({
      facultyId,
      roomId,
      startTime: finalStartTime,
      endTime: finalEndTime,
    });

    if (conflictOnly) {
      return NextResponse.json({
        success: true,
        conflicts,
        hasConflicts: conflicts.length > 0,
      });
    }

    if (conflicts.length > 0 && !overwriteConflicts) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduling conflicts detected",
          conflicts,
          hasConflicts: true,
        },
        { status: 409 }
      );
    }

    // Generate session ID (same as original)
    const sessionId = randomUUID();

    // Create session using event-session integration
    const sessionData = {
      sessionId,
      eventId,
      title,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      hallId: roomId,
      facultyId,
      facultyEmail: email,
      place,
      status,
      inviteStatus,
      travel: travelRequired,           // ✅ Add this
      accommodation: accommodationRequired, // ✅ Add this
    };

    console.log("🚀 Creating session with event integration:", sessionData);

    const createdSessionId = await createSessionWithEvent(sessionData);

    // Verify session was created
    const verify = await getSessionById(createdSessionId);
    if (!verify) {
      return NextResponse.json(
        { success: false, error: "Failed to save session to database" },
        { status: 500 }
      );
    }

    console.log("✅ Session verified in database:", verify);

    // Get faculty and room info for email (same as original)
    const faculties = await getFaculties();
    const rooms = await getRooms();
    const faculty = faculties.find((f) => f.id === facultyId);
    const room = rooms.find((r) => r.id === roomId);

    // Prepare session data for email
    const sessionForEmail = {
      id: createdSessionId,
      title,
      facultyId,
      email,
      place,
      roomId,
      roomName: room?.name || roomId,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      status,
      inviteStatus,
      eventId,
    };

    // Attempt email but do not fail creation if it breaks (same as original)
    try {
      const result = await sendInviteEmail(
        sessionForEmail,
        faculty?.name || "Faculty Member",
        email
      );

      if (!result.ok) {
        console.warn("⚠️ Email failed but session created:", result.message);
        return NextResponse.json(
          {
            success: true,
            emailStatus: "failed",
            warning: "Session created but email could not be sent",
            data: {
              ...sessionForEmail,
              facultyName: faculty?.name,
              roomName: room?.name,
            },
          },
          { status: 201 }
        );
      }

      console.log("✅ Session created and email sent successfully");
      return NextResponse.json(
        {
          success: true,
          emailStatus: "sent",
          message: "Session created and invitation email sent successfully",
          data: {
            ...sessionForEmail,
            facultyName: faculty?.name,
            roomName: room?.name,
          },
        },
        { status: 201 }
      );
    } catch (emailError: any) {
      console.error("❌ Email sending error:", emailError);
      return NextResponse.json(
        {
          success: true,
          emailStatus: "error",
          warning:
            "Session created but email failed: " +
            (emailError?.message || "Unknown error"),
          data: {
            ...sessionForEmail,
            facultyName: faculty?.name,
            roomName: room?.name,
          },
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("❌ Error creating session:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err?.message || "",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
