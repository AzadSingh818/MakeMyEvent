import { NextRequest, NextResponse } from "next/server";
import {
  getSessions,
  updateSession,
  deleteSession,
  getSessionById,
} from "../../_store";
import { ROOMS } from "../../rooms/route";
import { FACULTIES } from "../../faculties/route";
import { sendUpdateEmail } from "../../_utils/session-email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionById(params.id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();

    console.log("Updating session:", params.id, "with updates:", updates);

    // Get the current session before updating
    const currentSession = await getSessionById(params.id);
    if (!currentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Validate time logic if both times are provided
    if (updates.startTime && updates.endTime) {
      const start = new Date(updates.startTime);
      const end = new Date(updates.endTime);

      if (end <= start) {
        return NextResponse.json(
          {
            error: "End time must be after start time",
          },
          { status: 400 }
        );
      }

      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        return NextResponse.json(
          {
            error: "Session must be at least 15 minutes long",
          },
          { status: 400 }
        );
      }
    }

    // Check if calendar-related fields have changed
    const calendarFields = ["startTime", "endTime", "place", "roomId"];
    const changedCalendar = calendarFields.some(
      (field) =>
        updates[field] !== undefined &&
        updates[field] !== currentSession[field as keyof typeof currentSession]
    );

    // Handle backward compatibility for 'time' field
    if (updates.time && !updates.startTime) {
      updates.startTime = updates.time;
      changedCalendar || updates.startTime !== currentSession.startTime;
    }

    // If calendar changed, reset faculty response status
    if (changedCalendar) {
      updates.inviteStatus = "Pending";
      updates.rejectionReason = undefined;
      updates.suggestedTopic = undefined;
      updates.suggestedTimeStart = undefined;
      updates.suggestedTimeEnd = undefined;
      updates.optionalQuery = undefined;
    }

    // Update the session
    await updateSession(params.id, updates);
    const updatedSession = await getSessionById(params.id);

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Failed to retrieve updated session" },
        { status: 500 }
      );
    }

    console.log(
      "Session updated successfully:",
      updatedSession.title,
      "Calendar changed:",
      changedCalendar
    );

    // Send update email to faculty if calendar changed
    if (changedCalendar) {
      try {
        const faculty = FACULTIES.find(
          (f) => f.id === updatedSession.facultyId
        );
        const room = ROOMS.find((r) => r.id === updatedSession.roomId);

        console.log("Sending update email to:", updatedSession.email);

        const result = await sendUpdateEmail(
          updatedSession,
          faculty?.name || "Faculty Member",
          room?.name || updatedSession.roomId || "Unknown Room"
        );

        if (!result.ok) {
          console.warn(
            "Update email not sent via SMTP. Logged instead:",
            result.message
          );
        } else {
          console.log(
            `✅ Update email sent successfully to ${updatedSession.email}`
          );
        }
      } catch (emailError) {
        console.error("Failed to send update email:", emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message:
        "Session updated successfully" +
        (changedCalendar ? " and notification email sent" : ""),
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSession(params.id);
    console.log("Session deleted:", params.id);
    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";