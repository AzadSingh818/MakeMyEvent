// src/app/api/auth/faculty-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "../../_store";
import { FACULTIES } from "../../faculties/route";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get all sessions and enrich them
    const baseSessions = await getSessions();
    const enrichedSessions = baseSessions.map((session) => {
      const faculty = FACULTIES.find((f) => f.id === session.facultyId);
      return {
        ...session,
        facultyName: faculty?.name || "Unknown Faculty",
      };
    });

    // Find faculty session by email
    const facultySession = enrichedSessions.find(
      (session) => session.email.toLowerCase() === email.toLowerCase()
    );

    if (!facultySession) {
      console.log(`❌ Faculty not found for email: ${email}`);
      return NextResponse.json(
        { message: "Faculty not found. Please check your email address." },
        { status: 401 }
      );
    }

    // For demo purposes - in production, implement proper password validation
    // You could store hashed passwords and validate them here
    console.log(`✅ Faculty found: ${facultySession.facultyName}`);

    const userData = {
      id: facultySession.facultyId,
      email: facultySession.email,
      name: facultySession.facultyName,
      role: "faculty",
    };

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Faculty login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
