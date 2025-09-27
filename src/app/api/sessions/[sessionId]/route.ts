import { NextRequest, NextResponse } from "next/server";
import {
  getSessionById,
  updateSessionMetadata,
  deleteSession,
  getFaculties,
  getRooms,
  updateSessionById,
  deleteSessionById,
} from "@/lib/database/session-queries";
import {
  updateSessionWithEvent,
  deleteSessionWithEvent,
} from "@/lib/database/event-session-integration";
import { sendUpdateEmail } from "../../_utils/session-email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Enhanced datetime parser (same as main route)
function parseLocalDateTime(dateTimeStr?: string): string | null {
  if (!dateTimeStr) return null;

  try {
    // Handle full ISO format (2025-11-17T09:00:00)
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
      return dateTimeStr;
    }

    // Handle partial ISO format (2025-11-17T09:00)
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return dateTimeStr + ":00";
    }

    // Handle datetime-local input format
    if (dateTimeStr.length === 16 && dateTimeStr.includes("T")) {
      return dateTimeStr + ":00";
    }

    // Try to parse as Date object and convert back to ISO
    const testDate = new Date(dateTimeStr);
    if (!isNaN(testDate.getTime())) {
      return testDate.toISOString().substring(0, 19);
    }

    return null;
  } catch {
    return null;
  }
}

// GET: Get specific session
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    console.log("🔍 Fetching session:", sessionId);

    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error("❌ Error fetching session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "",
      },
      { status: 500 }
    );
  }
}

// PATCH: Update specific session (enhanced version)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.sessionId;
    const body = await req.json();

    console.log("🔄 Updating session:", sessionId, body);

    // Get current session
    const currentSession = await getSessionById(sessionId);
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Prepare update data with enhanced field mapping
    const updateData: any = {};

    // Handle basic fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description.trim();
    if (body.place !== undefined) updateData.place = body.place.trim();
    if (body.roomId !== undefined) updateData.hallId = body.roomId;
    if (body.facultyId !== undefined) updateData.facultyId = body.facultyId;
    if (body.email !== undefined) updateData.facultyEmail = body.email.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.inviteStatus !== undefined)
      updateData.inviteStatus = body.inviteStatus;

    // Handle date/time updates with validation
    if (body.startTime !== undefined) {
      if (body.startTime) {
        const parsedStart = parseLocalDateTime(body.startTime);
        if (!parsedStart) {
          return NextResponse.json(
            { success: false, error: "Invalid start time format" },
            { status: 400 }
          );
        }
        updateData.startTime = parsedStart;
      } else {
        updateData.startTime = null;
      }
    }

    if (body.endTime !== undefined) {
      if (body.endTime) {
        const parsedEnd = parseLocalDateTime(body.endTime);
        if (!parsedEnd) {
          return NextResponse.json(
            { success: false, error: "Invalid end time format" },
            { status: 400 }
          );
        }
        updateData.endTime = parsedEnd;
      } else {
        updateData.endTime = null;
      }
    }

    // Validate time logic
    const finalStartTime = updateData.startTime || currentSession.startTime;
    const finalEndTime = updateData.endTime || currentSession.endTime;

    if (finalStartTime && finalEndTime) {
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
    }

    // Update session using enhanced function
    let updatedSession;

    if (session?.user) {
      // Use event-session integration if user info available
      await updateSessionWithEvent(
        sessionId,
        updateData,
        session.user.id,
        session.user.role
      );
      updatedSession = await getSessionById(sessionId);
    } else {
      // Use direct update function
      updatedSession = await updateSessionById(sessionId, updateData);
    }

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: "Failed to update session" },
        { status: 500 }
      );
    }

    // Send update email if significant changes were made
    if (body.startTime || body.endTime || body.place || body.roomId) {
      try {
        const faculties = await getFaculties();
        const rooms = await getRooms();
        const faculty = faculties.find(
          (f) => f.id === updatedSession.facultyId
        );
        const room = rooms.find((r) => r.id === updatedSession.hallId);

        if (updatedSession.facultyEmail && faculty) {
          const sessionForEmail = {
            id: updatedSession.id,
            title: updatedSession.title,
            facultyId: updatedSession.facultyId || "",
            email: updatedSession.facultyEmail,
            place: updatedSession.place || "",
            roomId: updatedSession.hallId || "",
            roomName: room?.name || updatedSession.hallId || "",
            description: updatedSession.description || "",
            startTime: updatedSession.startTime,
            endTime: updatedSession.endTime,
            status: updatedSession.status as "Draft" | "Confirmed",
            inviteStatus: updatedSession.inviteStatus as
              | "Pending"
              | "Accepted"
              | "Declined",
          };

          await sendUpdateEmail(
            sessionForEmail,
            faculty.name,
            room?.name || updatedSession.hallId || "Unknown Room"
          );
        }
      } catch (emailError) {
        console.warn("⚠️ Failed to send update email:", emailError);
      }
    }

    // Get enriched data for response
    const faculties = await getFaculties();
    const rooms = await getRooms();
    const faculty = faculties.find((f) => f.id === updatedSession.facultyId);
    const room = rooms.find((r) => r.id === updatedSession.hallId);

    const enrichedSession = {
      ...updatedSession,
      facultyName: faculty?.name || "Unknown Faculty",
      roomName: room?.name || "Unknown Room",
      roomId: updatedSession.hallId,
      email: updatedSession.facultyEmail || "",
    };

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      data: enrichedSession,
    });
  } catch (error: any) {
    console.error("❌ Error updating session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete specific session (enhanced version)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.sessionId;

    console.log("🗑️ Deleting session:", sessionId);

    // Check if session exists
    const existingSession = await getSessionById(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    console.log(`📋 Deleting session: ${existingSession.title}`);

    let success = false;

    // Delete using appropriate method
    if (session?.user) {
      // Use event-session integration if user info available
      success = await deleteSessionWithEvent(
        sessionId,
        session.user.id,
        session.user.role
      );
    } else {
      // Use direct deletion function
      success = await deleteSessionById(sessionId);
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete session" },
        { status: 500 }
      );
    }

    console.log(`✅ Session ${sessionId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
      deletedSessionId: sessionId,
    });
  } catch (error: any) {
    console.error("❌ Error deleting session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
