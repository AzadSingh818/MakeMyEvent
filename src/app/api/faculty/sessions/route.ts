import { NextRequest, NextResponse } from "next/server";
import { getSessionsByEmail } from "../../_store";
import { ROOMS } from "../../rooms/route";
import { FACULTIES } from "../../faculties/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching sessions for faculty email: ${email}`);

    // Get sessions for this faculty
    const sessions = await getSessionsByEmail(email);

    console.log(`📊 Found ${sessions.length} sessions for ${email}`);

    // Enrich sessions with additional data
    const enrichedSessions = sessions.map((session) => {
      const room = ROOMS.find((r) => r.id === session.roomId);
      const faculty = FACULTIES.find((f) => f.id === session.facultyId);

      // Calculate time-related information
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const now = new Date();

      // Calculate days until session
      const daysUntil = Math.ceil(
        (startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate duration
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );
      const duration =
        durationMinutes > 0
          ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : "";

      // Format times
      const formattedStartTime = startTime.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      const formattedEndTime = endTime.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

      return {
        ...session,
        roomName: room?.name || session.roomId || "Unknown Room",
        facultyName: faculty?.name || "Unknown Faculty",
        duration,
        formattedTime,
        formattedStartTime,
        formattedEndTime,
        daysUntil,
        sessionStatus: session.status,
        isPast: daysUntil < 0,
        isToday: daysUntil === 0,
        isUpcoming: daysUntil > 0,
      };
    });

    // Calculate stats
    const stats = {
      total: enrichedSessions.length,
      pending: enrichedSessions.filter((s) => s.inviteStatus === "Pending")
        .length,
      accepted: enrichedSessions.filter((s) => s.inviteStatus === "Accepted")
        .length,
      declined: enrichedSessions.filter((s) => s.inviteStatus === "Declined")
        .length,
      upcoming: enrichedSessions.filter((s) => s.isUpcoming).length,
      today: enrichedSessions.filter((s) => s.isToday).length,
      draft: enrichedSessions.filter((s) => s.status === "Draft").length,
      confirmed: enrichedSessions.filter((s) => s.status === "Confirmed")
        .length,
    };

    // Sort sessions by start time
    enrichedSessions.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        sessions: enrichedSessions,
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching faculty sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
