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

    const finalEndTime =
      endTime ||
      new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

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
            // warning: result.message || "Email not sent",
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
