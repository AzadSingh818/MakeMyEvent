import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getSessions,
  addSession,
  getSessionById,
  type Session as StoreSession,
} from "../_store";
import { ROOMS } from "../rooms/route";
import { FACULTIES } from "../faculties/route";
import { sendInviteEmail } from "../_utils/session-email";

// Helper function to check for scheduling conflicts
async function checkSessionConflicts(
  sessionData: {
    facultyId: string;
    roomId: string;
    startTime: string;
    endTime: string;
  },
  excludeSessionId?: string
) {
  const allSessions = await getSessions();
  const conflicts = [];

  const newStart = new Date(sessionData.startTime);
  const newEnd = new Date(sessionData.endTime);

  for (const existingSession of allSessions) {
    // Skip the session we're updating
    if (excludeSessionId && existingSession.id === excludeSessionId) {
      continue;
    }

    const existingStart = new Date(existingSession.startTime);
    const existingEnd = new Date(existingSession.endTime);

    // Check for time overlap
    const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;

    if (hasTimeOverlap) {
      // Faculty conflict
      if (existingSession.facultyId === sessionData.facultyId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.roomId,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          type: "faculty",
          message: `Faculty is already scheduled for "${existingSession.title}" during this time`,
          sessionTitle: existingSession.title,
        });
      }

      // Room conflict
      if (existingSession.roomId === sessionData.roomId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.roomId,
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

// GET: list all sessions enriched for listing pages (Organizer/Overview/Faculty)
export async function GET() {
  try {
    const sessions = await getSessions();

    const enriched = sessions.map((s) => {
      const faculty = FACULTIES.find((f) => f.id === s.facultyId);
      const room = ROOMS.find((r) => r.id === s.roomId);
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      const durationMin = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / 60000)
      );
      return {
        ...s,
        facultyName: faculty?.name || "Unknown Faculty",
        roomName: room?.name || s.roomId,
        duration: durationMin > 0 ? `${durationMin} minutes` : "",
        formattedStartTime: isNaN(start.getTime())
          ? undefined
          : start.toLocaleString(),
        formattedEndTime: isNaN(end.getTime())
          ? undefined
          : end.toLocaleString(),
      };
    });

    return NextResponse.json(
      { success: true, data: { sessions: enriched }, count: enriched.length },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
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

// POST: create a session via multipart/form-data and send invite email
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

    // Required fields
    const title = formData.get("title")?.toString() || "";
    const facultyId = formData.get("facultyId")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const place = formData.get("place")?.toString() || "";
    const roomId = formData.get("roomId")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const startTime = formData.get("startTime")?.toString() || "";
    const endTime = formData.get("endTime")?.toString() || "";
    const status =
      (formData.get("status")?.toString() as "Draft" | "Confirmed") || "Draft";
    const inviteStatus =
      (formData.get("inviteStatus")?.toString() as
        | "Pending"
        | "Accepted"
        | "Declined") || "Pending";
    const travelStatus = formData.get("travelStatus")?.toString() || "Pending";

    // Check if this is a conflict-only request
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

    // Validate time logic
    const finalEndTime =
      endTime ||
      new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    const start = new Date(startTime);
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

    // Check for conflicts
    const conflicts = await checkSessionConflicts({
      facultyId,
      roomId,
      startTime,
      endTime: finalEndTime,
    });

    // If this is just a conflict check, return conflicts
    if (conflictOnly) {
      return NextResponse.json({
        success: true,
        conflicts,
        hasConflicts: conflicts.length > 0,
      });
    }

    // If there are conflicts and not overwriting, return conflict error
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

    const newSession: StoreSession = {
      id: randomUUID(),
      title,
      facultyId,
      email,
      place,
      roomId,
      description,
      startTime,
      endTime: finalEndTime,
      status,
      inviteStatus,
      travelStatus,
    };

    await addSession(newSession);

    const verify = await getSessionById(newSession.id);
    if (!verify) {
      return NextResponse.json(
        { success: false, error: "Failed to save session" },
        { status: 500 }
      );
    }

    const faculty = FACULTIES.find((f) => f.id === facultyId);
    const room = ROOMS.find((r) => r.id === roomId);

    // Attempt email but do not fail creation if it breaks
    try {
      const result = await sendInviteEmail(
        newSession,
        faculty?.name || "Faculty Member",
        email
      );
      if (!result.ok) {
        return NextResponse.json(
          {
            success: true,
            emailStatus: "failed",
            data: {
              ...newSession,
              facultyName: faculty?.name,
              roomName: room?.name,
            },
          },
          { status: 201 }
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        {
          success: true,
          emailStatus: "error",
          warning: e?.message || "Email failed",
          data: {
            ...newSession,
            facultyName: faculty?.name,
            roomName: room?.name,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailStatus: "sent",
        data: {
          ...newSession,
          facultyName: faculty?.name,
          roomName: room?.name,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating session:", err);
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
