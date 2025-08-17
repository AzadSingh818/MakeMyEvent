import { NextRequest, NextResponse } from "next/server";
import { FACULTIES } from "../../faculties/route";
import { ROOMS } from "../../rooms/route";
import { sendBulkInviteEmail } from "../../_utils/session-email";
import { getSessions } from "../../_store"; // Add this import

export async function POST(req: NextRequest) {
  try {
    let requestBody;

    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Invalid JSON format";
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: errorMessage,
        },
        { status: 400 }
      );
    }

    const { facultyId, email, sessions } = requestBody;

    console.log("📧 Bulk invite request:", {
      facultyId,
      email,
      sessionsCount: sessions?.length,
      hasAllFields: !!(facultyId && email && sessions),
    });

    // Log the sessions data received
    console.log(
      "📧 Sessions data received:",
      JSON.stringify(sessions, null, 2)
    );

    // Validate required fields
    if (!facultyId || !email || !sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields for bulk invitation",
          required: {
            facultyId: "Faculty ID is required",
            email: "Email is required",
            sessions: "Sessions array is required",
          },
          received: {
            facultyId: !!facultyId,
            email: !!email,
            sessions: !!sessions,
            sessionsCount: sessions?.length || 0,
          },
        },
        { status: 400 }
      );
    }

    // Validate sessions array
    if (sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one session is required",
        },
        { status: 400 }
      );
    }

    // Get faculty info
    const faculty = FACULTIES.find((f) => f.id === facultyId);
    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          error: `Faculty not found with ID: ${facultyId}`,
        },
        { status: 404 }
      );
    }

    // **IMPORTANT FIX**: Get fresh sessions from store instead of using passed data
    console.log("🔄 Fetching fresh sessions from store...");
    const allStoredSessions = await getSessions();
    console.log("📊 Total sessions in store:", allStoredSessions.length);

    // Match the session IDs to get fresh data
    const sessionIds = sessions.map((s) => s.id).filter(Boolean);
    console.log("🔍 Looking for session IDs:", sessionIds);

    const freshSessions = allStoredSessions.filter(
      (storedSession) =>
        sessionIds.includes(storedSession.id) &&
        storedSession.facultyId === facultyId
    );

    console.log("✅ Found fresh sessions:", freshSessions.length);
    console.log(
      "📧 Fresh session data:",
      JSON.stringify(freshSessions, null, 2)
    );

    // If no fresh sessions found, log error but still try with original data
    if (freshSessions.length === 0) {
      console.warn("⚠️ No fresh sessions found in store, using original data");
      console.warn(
        "📊 Available session IDs in store:",
        allStoredSessions.map((s) => s.id)
      );
      console.warn("📊 Requested session IDs:", sessionIds);
    }

    // Use fresh sessions if found, otherwise fall back to original data
    const sessionsToEmail = freshSessions.length > 0 ? freshSessions : sessions;

    // Enrich sessions with room names
    const enrichedSessions = sessionsToEmail.map((session, index) => {
      const room = ROOMS.find((r) => r.id === session.roomId);
      console.log(
        `🏠 Session ${index + 1} - Room ID: ${session.roomId}, Room Name: ${
          room?.name || "Not found"
        }`
      );

      return {
        ...session,
        roomName: room?.name || session.roomId || `Room ${index + 1}`,
      };
    });

    console.log(
      "📧 Final enriched sessions for email:",
      JSON.stringify(enrichedSessions, null, 2)
    );
    console.log(
      "📧 Sending bulk email to:",
      email,
      "for faculty:",
      faculty.name
    );

    // Send bulk invitation email
    try {
      const result = await sendBulkInviteEmail(
        enrichedSessions,
        faculty.name,
        email
      );

      if (!result.ok) {
        // console.warn("⚠️ Bulk email not sent via SMTP:", result.message);
        return NextResponse.json({
          success: true,
          warning: true,
          message: `Sessions created for ${faculty.name}. Email could not be sent at this time.`,
          facultyName: faculty.name,
          sessionsCount: sessionsToEmail.length,
          emailStatus: "failed",
          // emailError: result.message,
        });
      } else {
        console.log(`✅ Bulk invitation email sent successfully to ${email}`);
        return NextResponse.json({
          success: true,
          message: `Bulk invitation sent to ${faculty.name} with ${sessionsToEmail.length} sessions`,
          facultyName: faculty.name,
          sessionsCount: sessionsToEmail.length,
          emailStatus: "sent",
        });
      }
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      const emailErrorMessage =
        emailError instanceof Error
          ? emailError.message
          : "Unknown email error";
      return NextResponse.json({
        success: true,
        warning: true,
        message: `Sessions created for ${faculty.name}. Email sending failed but sessions are saved.`,
        facultyName: faculty.name,
        sessionsCount: sessionsToEmail.length,
        emailStatus: "error",
        emailError: emailErrorMessage,
      });
    }
  } catch (error) {
    console.error("❌ Error in bulk invite API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while processing bulk invitation",
        details:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Please try again later",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
