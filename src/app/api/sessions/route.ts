// src/app/api/sessions/route.ts - FIXED DatabaseSession property access
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

// Helper function to parse datetime strings with complete null safety
function parseLocalDateTime(dateTimeStr?: string): string | null {
  if (!dateTimeStr) return null;

  try {
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
      return dateTimeStr;
    }

    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return dateTimeStr + ":00";
    }

    return null;
  } catch (error) {
    console.error("Error parsing datetime:", error);
    return null;
  }
}

// ✅ FIXED: Helper function with correct property access
async function checkSessionConflicts(
  sessionData: {
    facultyId: string;
    roomId: string;
    startTime: string;
    endTime: string;
  },
  excludeSessionId?: string
) {
  try {
    const allSessions = await getAllSessions();
    const conflicts = [];

    const newStart = new Date(sessionData.startTime);
    const newEnd = new Date(sessionData.endTime);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      console.warn("Invalid date format in conflict check");
      return [];
    }

    for (const existingSession of allSessions) {
      if (excludeSessionId && existingSession.id === excludeSessionId) {
        continue;
      }

      if (!existingSession.startTime || !existingSession.endTime) {
        continue;
      }

      const existingStart = new Date(existingSession.startTime);
      const existingEnd = new Date(existingSession.endTime);

      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) {
        continue;
      }

      const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;

      if (hasTimeOverlap) {
        if (existingSession.facultyId === sessionData.facultyId) {
          conflicts.push({
            id: existingSession.id,
            title: existingSession.title || "Untitled Session",
            facultyId: existingSession.facultyId,
            // roomId: existingSession.hallId || existingSession.roomId, // ✅ FIXED: Use hallId with fallback
            startTime: existingSession.startTime,
            endTime: existingSession.endTime,
            type: "faculty",
            message: `Faculty is already scheduled for "${
              existingSession.title || "Untitled Session"
            }" during this time`,
            sessionTitle: existingSession.title || "Untitled Session",
          });
        }

        // ✅ FIXED: Use hallId property instead of roomId
        if (existingSession.hallId === sessionData.roomId) {
          conflicts.push({
            id: existingSession.id,
            title: existingSession.title || "Untitled Session",
            facultyId: existingSession.facultyId,
            roomId: existingSession.hallId, // ✅ FIXED: Use hallId
            startTime: existingSession.startTime,
            endTime: existingSession.endTime,
            type: "room",
            message: `Room is already booked for "${
              existingSession.title || "Untitled Session"
            }" during this time`,
            sessionTitle: existingSession.title || "Untitled Session",
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return [];
  }
}

// GET: list all sessions enriched for listing pages
export async function GET() {
  try {
    const sessions = await getAllSessions();
    const faculties = await getFaculties();
    const rooms = await getRooms();

    const enriched = sessions.map((s) => {
      const faculty = faculties.find((f) => f.id === s.facultyId);
      // ✅ FIXED: Use hallId property instead of roomId
      const room = rooms.find((r) => r.id === s.hallId);

      let durationMin = 0;
      try {
        if (s.startTime && s.endTime) {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            durationMin = Math.max(
              0,
              Math.round((end.getTime() - start.getTime()) / 60000)
            );
          }
        }
      } catch (error) {
        console.warn("Error calculating duration for session:", s.id, error);
      }

      return {
        ...s,
        facultyName: s.facultyName || faculty?.name || "Unknown Faculty",
        roomName: s.roomName || room?.name || s.hallId || "Unknown Room",
        roomId: s.hallId, // ✅ FIXED: Map hallId to roomId for frontend compatibility
        email: s.facultyEmail || faculty?.email || "",
        duration: durationMin > 0 ? `${durationMin} minutes` : "",
        formattedStartTime: s.startTime || "",
        formattedEndTime: s.endTime || "",
        eventName: s.eventName || "Unknown Event",
        invitationStatus: s.inviteStatus || "Pending",
        canTrack: !!(s.facultyEmail && s.inviteStatus),
      };
    });

    console.log("API Response first session:", enriched[0]);
    console.log(
      "🔍 Sessions data before sending:",
      enriched.map((s) => ({
        title: s.title,
        eventName: s.eventName,
        originalEventName: s.eventName,
      }))
    );

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

// POST: create a session with enhanced error handling and IST support
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

    // Extract fields with both naming conventions and null safety
    const title = formData.get("title")?.toString()?.trim() || "";
    const facultyId = formData.get("facultyId")?.toString()?.trim() || "";
    const email = formData.get("email")?.toString()?.trim() || "";
    const place = formData.get("place")?.toString()?.trim() || "";
    const roomId = formData.get("roomId")?.toString()?.trim() || "";
    const description = formData.get("description")?.toString()?.trim() || "";

    const startTime =
      formData.get("startTime")?.toString()?.trim() ||
      formData.get("suggested_time_start")?.toString()?.trim() ||
      "";
    const endTime =
      formData.get("endTime")?.toString()?.trim() ||
      formData.get("suggested_time_end")?.toString()?.trim() ||
      "";

    const eventId =
      formData.get("eventId")?.toString()?.trim() || "default-conference-2025";
    const status =
      (formData.get("status")?.toString()?.trim() as "Draft" | "Confirmed") ||
      "Draft";

    const inviteStatus =
      formData.get("inviteStatus")?.toString()?.trim() ||
      formData.get("invite_status")?.toString()?.trim() ||
      "Pending";

    const travel =
      formData.get("travel")?.toString()?.trim() ||
      formData.get("travelStatus")?.toString()?.trim() ||
      "";
    const accommodation =
      formData.get("accommodation")?.toString()?.trim() || "";

    const travelRequired = travel === "yes" || travel === "true";
    const accommodationRequired =
      accommodation === "yes" || accommodation === "true";

    console.log("📋 Creating session with enhanced error handling:", {
      title,
      facultyId,
      email,
      place,
      roomId,
      startTime,
      endTime,
      eventId,
      status,
      inviteStatus,
      travel: travelRequired,
      accommodation: accommodationRequired,
    });

    // Enhanced validation with detailed error messages
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!facultyId) missingFields.push("facultyId");
    if (!email) missingFields.push("email");
    if (!place) missingFields.push("place");
    if (!roomId) missingFields.push("roomId");
    if (!description) missingFields.push("description");

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          receivedFields: Object.fromEntries(formData.entries()),
          missingFields,
        },
        { status: 400 }
      );
    }

    // Enhanced time parsing with fallback for date-based sessions
    let finalStartTime: string;
    let finalEndTime: string;

    try {
      if (!startTime || !endTime) {
        console.log(
          "⚠️ No times provided, generating default times for date-based session"
        );

        const baseDate = new Date();
        const startDate = new Date(baseDate);
        startDate.setHours(9, 0, 0, 0);
        const endDate = new Date(baseDate);
        endDate.setHours(17, 0, 0, 0);

        finalStartTime = startDate.toISOString().substring(0, 19);
        finalEndTime = endDate.toISOString().substring(0, 19);

        console.log("✅ Generated default times:", {
          finalStart: finalStartTime,
          finalEnd: finalEndTime,
        });
      } else {
        const parsedStartTime = parseLocalDateTime(startTime);
        const parsedEndTime = parseLocalDateTime(endTime);

        if (!parsedStartTime) {
          throw new Error("Invalid start time format");
        }

        finalStartTime = parsedStartTime;

        if (!parsedEndTime) {
          const startDate = new Date(parsedStartTime);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          finalEndTime = endDate.toISOString().substring(0, 19);
        } else {
          finalEndTime = parsedEndTime;
        }
      }

      // Validate times
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

      console.log("✅ Time validation passed (IST times):", {
        finalStart: finalStartTime,
        finalEnd: finalEndTime,
        durationMinutes,
      });
    } catch (timeError) {
      console.error("❌ Time parsing error:", timeError);
      return NextResponse.json(
        {
          success: false,
          error: `Time parsing failed: ${timeError}`,
          providedTimes: { startTime, endTime },
        },
        { status: 400 }
      );
    }

    // Skip conflict checking for date-based sessions
    const conflictOnly = formData.get("conflictOnly")?.toString() === "true";

    if (conflictOnly) {
      return NextResponse.json({
        success: true,
        conflicts: [],
        hasConflicts: false,
        message: "Date-based sessions don't check for time conflicts",
      });
    }

    // Generate session ID
    const sessionId = randomUUID();

    // ✅ FIXED: Create session with proper field mapping (hallId instead of roomId)
    const sessionData = {
      sessionId,
      eventId,
      title,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      hallId: roomId, // ✅ FIXED: Use hallId property name for database
      facultyId,
      facultyEmail: email,
      place,
      status,
      inviteStatus: inviteStatus as "Pending" | "Accepted" | "Declined",
      travel: travelRequired,
      accommodation: accommodationRequired,
    };

    console.log("✅ Creating session with proper field mapping:", sessionData);

    const createdSessionId = await createSessionWithEvent(sessionData);

    // Verify session was created
    const verify = await getSessionById(createdSessionId);
    if (!verify) {
      return NextResponse.json(
        { success: false, error: "Failed to save session to database" },
        { status: 500 }
      );
    }

    console.log(
      "✅ Session verified with dynamic invitation tracking:",
      verify.inviteStatus
    );

    // Get faculty and room info for response
    const faculties = await getFaculties();
    const rooms = await getRooms();
    const faculty = faculties.find((f) => f.id === facultyId);
    const room = rooms.find((r) => r.id === roomId);

    // Prepare enhanced session data for response
    const sessionForResponse = {
      id: createdSessionId,
      title,
      facultyId,
      email,
      place,
      roomId, // Keep roomId for frontend compatibility
      roomName: room?.name || roomId,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      status,
      inviteStatus: inviteStatus as "Pending",
      eventId,
      invitationSent: true,
      canTrackResponse: true,
      responseUrl: `/api/faculty/respond?sessionId=${createdSessionId}&facultyEmail=${email}`,
      travel: travelRequired,
      accommodation: accommodationRequired,
    };

    // Send invitation email with response tracking
    try {
      const result = await sendInviteEmail(
        sessionForResponse,
        faculty?.name || "Faculty Member",
        email
      );

      if (!result.ok) {
        console.warn(
          "⚠️ Email failed but session created with dynamic tracking:",
          result.message
        );
        return NextResponse.json(
          {
            success: true,
            emailStatus: "failed",
            warning:
              "Session created with invitation tracking, but email could not be sent",
            data: {
              ...sessionForResponse,
              facultyName: faculty?.name,
              roomName: room?.name,
              invitationTracking: "enabled",
            },
          },
          { status: 201 }
        );
      }

      console.log(
        "✅ Session created successfully with dynamic invitation system"
      );
      return NextResponse.json(
        {
          success: true,
          emailStatus: "sent",
          message: "Session created with dynamic faculty invitation tracking",
          data: {
            ...sessionForResponse,
            facultyName: faculty?.name,
            roomName: room?.name,
            invitationTracking: "enabled",
            emailSent: true,
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
            "Session created with invitation tracking, but email failed: " +
            (emailError?.message || "Unknown error"),
          data: {
            ...sessionForResponse,
            facultyName: faculty?.name,
            roomName: room?.name,
            invitationTracking: "enabled",
          },
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("❌ Error creating session with dynamic invitations:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err?.message || "",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";



// // src/app/api/sessions/route.ts - ENHANCED: Complete date handling
// import { NextRequest, NextResponse } from "next/server";
// import { randomUUID } from "crypto";
// import {
//   getAllSessions,
//   getFaculties,
//   getRooms,
//   getSessionById,
// } from "@/lib/database/session-queries";
// import { createSessionWithEvent } from "@/lib/database/event-session-integration";

// // ✅ ENHANCED: Complete datetime parser with comprehensive logging [web:134][web:138]
// function parseLocalDateTime(dateTimeStr?: string): string | null {
//   if (!dateTimeStr) {
//     console.log("❌ No datetime string provided to parseLocalDateTime");
//     return null;
//   }

//   console.log(
//     `🔍 parseLocalDateTime processing: "${dateTimeStr}" (type: ${typeof dateTimeStr})`
//   );

//   try {
//     // Handle full ISO format (2025-11-17T09:00:00)
//     if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
//       console.log("✅ Matched full ISO datetime format");
//       return dateTimeStr;
//     }

//     // Handle partial ISO format (2025-11-17T09:00)
//     if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
//       const result = dateTimeStr + ":00";
//       console.log(`✅ Matched partial ISO format, added seconds: ${result}`);
//       return result;
//     }

//     // Handle date-only format (2025-11-17)
//     if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
//       const result = dateTimeStr + "T09:00:00";
//       console.log(`✅ Matched date-only format, added default time: ${result}`);
//       return result;
//     }

//     // Try to parse as Date object and convert back to ISO
//     const testDate = new Date(dateTimeStr);
//     if (!isNaN(testDate.getTime())) {
//       const isoString = testDate.toISOString().substring(0, 19);
//       console.log(
//         `✅ Parsed via Date constructor: ${dateTimeStr} -> ${isoString}`
//       );

//       // Validate the parsed date is reasonable
//       const year = testDate.getFullYear();
//       if (year >= 1900 && year <= 2100) {
//         return isoString;
//       } else {
//         console.warn(`⚠️ Parsed date has unreasonable year: ${year}`);
//       }
//     }

//     console.warn(`❌ Could not parse datetime: ${dateTimeStr}`);
//     return null;
//   } catch (error) {
//     console.error("❌ Error in parseLocalDateTime:", error);
//     return null;
//   }
// }

// // ✅ ENHANCED: Session conflict checker with proper field mapping
// async function checkSessionConflicts(
//   sessionData: {
//     facultyId: string;
//     roomId: string;
//     startTime: string;
//     endTime: string;
//   },
//   excludeSessionId?: string
// ) {
//   try {
//     const allSessions = await getAllSessions();
//     const conflicts = [];

//     const newStart = new Date(sessionData.startTime);
//     const newEnd = new Date(sessionData.endTime);

//     if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
//       console.warn("❌ Invalid date format in conflict check");
//       return [];
//     }

//     console.log(
//       `🔍 Checking conflicts for session: ${sessionData.startTime} - ${sessionData.endTime}`
//     );

//     for (const existingSession of allSessions) {
//       if (excludeSessionId && existingSession.id === excludeSessionId) {
//         continue;
//       }

//       if (!existingSession.startTime || !existingSession.endTime) {
//         continue;
//       }

//       const existingStart = new Date(existingSession.startTime);
//       const existingEnd = new Date(existingSession.endTime);

//       if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) {
//         continue;
//       }

//       const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;

//       if (hasTimeOverlap) {
//         if (existingSession.facultyId === sessionData.facultyId) {
//           conflicts.push({
//             id: existingSession.id,
//             title: existingSession.title || "Untitled Session",
//             facultyId: existingSession.facultyId,
//             startTime: existingSession.startTime,
//             endTime: existingSession.endTime,
//             type: "faculty",
//             message: `Faculty conflict with "${
//               existingSession.title || "Untitled Session"
//             }"`,
//             sessionTitle: existingSession.title || "Untitled Session",
//           });
//         }

//         if (existingSession.hallId === sessionData.roomId) {
//           conflicts.push({
//             id: existingSession.id,
//             title: existingSession.title || "Untitled Session",
//             facultyId: existingSession.facultyId,
//             roomId: existingSession.hallId,
//             startTime: existingSession.startTime,
//             endTime: existingSession.endTime,
//             type: "room",
//             message: `Room conflict with "${
//               existingSession.title || "Untitled Session"
//             }"`,
//             sessionTitle: existingSession.title || "Untitled Session",
//           });
//         }
//       }
//     }

//     console.log(`🔍 Found ${conflicts.length} conflicts`);
//     return conflicts;
//   } catch (error) {
//     console.error("❌ Error checking conflicts:", error);
//     return [];
//   }
// }

// // GET: Enhanced session listing with proper date formatting [web:137]
// export async function GET() {
//   try {
//     console.log("🔍 Fetching all sessions...");

//     const sessions = await getAllSessions();
//     const faculties = await getFaculties();
//     const rooms = await getRooms();

//     console.log(`📊 Retrieved ${sessions.length} sessions from database`);

//     const enriched = sessions.map((s) => {
//       const faculty = faculties.find((f) => f.id === s.facultyId);
//       const room = rooms.find((r) => r.id === s.hallId);

//       let durationMin = 0;
//       try {
//         if (s.startTime && s.endTime) {
//           const start = new Date(s.startTime);
//           const end = new Date(s.endTime);
//           if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
//             durationMin = Math.max(
//               0,
//               Math.round((end.getTime() - start.getTime()) / 60000)
//             );
//           }
//         }
//       } catch (error) {
//         console.warn(
//           `⚠️ Error calculating duration for session ${s.id}:`,
//           error
//         );
//       }

//       // ✅ ENHANCED: Date formatting for display
//       let formattedStartTime = "";
//       let formattedEndTime = "";

//       try {
//         if (s.startTime) {
//           const startDate = new Date(s.startTime);
//           if (!isNaN(startDate.getTime())) {
//             formattedStartTime =
//               startDate.toLocaleDateString("en-GB", {
//                 year: "numeric",
//                 month: "2-digit",
//                 day: "2-digit",
//               }) +
//               " " +
//               startDate.toLocaleTimeString("en-GB", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               });
//           }
//         }

//         if (s.endTime) {
//           const endDate = new Date(s.endTime);
//           if (!isNaN(endDate.getTime())) {
//             formattedEndTime =
//               endDate.toLocaleDateString("en-GB", {
//                 year: "numeric",
//                 month: "2-digit",
//                 day: "2-digit",
//               }) +
//               " " +
//               endDate.toLocaleTimeString("en-GB", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               });
//           }
//         }
//       } catch (error) {
//         console.warn(`⚠️ Error formatting dates for session ${s.id}:`, error);
//       }

//       return {
//         ...s,
//         facultyName: s.facultyName || faculty?.name || "Unknown Faculty",
//         roomName: s.roomName || room?.name || s.hallId || "Unknown Room",
//         roomId: s.hallId,
//         email: s.facultyEmail || faculty?.email || "",
//         duration: durationMin > 0 ? `${durationMin} minutes` : "",
//         formattedStartTime: formattedStartTime || s.startTime || "",
//         formattedEndTime: formattedEndTime || s.endTime || "",
//         eventName: s.eventName || "Unknown Event",
//         invitationStatus: s.inviteStatus || "Pending",
//         canTrack: !!(s.facultyEmail && s.inviteStatus),
//         // ✅ Include raw dates for debugging
//         rawStartTime: s.startTime,
//         rawEndTime: s.endTime,
//       };
//     });

//     // ✅ DEBUG: Log first session with dates
//     if (enriched.length > 0) {
//       console.log("📅 First session date info:", {
//         title: enriched[0]?.title,
//         rawStartTime: enriched[0]?.rawStartTime,
//         rawEndTime: enriched[0]?.rawEndTime,
//         formattedStartTime: enriched[0]?.formattedStartTime,
//         formattedEndTime: enriched[0]?.formattedEndTime,
//       });
//     }

//     return NextResponse.json(
//       { success: true, data: { sessions: enriched }, count: enriched.length },
//       { headers: { "Content-Type": "application/json" } }
//     );
//   } catch (e: any) {
//     console.error("❌ Error fetching sessions:", e);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Internal server error",
//         details: e?.message || "",
//       },
//       { status: 500 }
//     );
//   }
// }

// // ✅ ENHANCED: POST handler with complete date processing [web:89][web:129]
// export async function POST(req: NextRequest) {
//   try {
//     console.log("\n🚀 Starting session creation...");

//     const contentType = req.headers.get("content-type") || "";

//     if (!contentType.includes("multipart/form-data")) {
//       console.error("❌ Invalid content type:", contentType);
//       return NextResponse.json(
//         { success: false, error: "Content type must be multipart/form-data" },
//         { status: 400 }
//       );
//     }

//     const formData = await req.formData();
//     console.log("📦 FormData received, extracting fields...");

//     // ✅ ENHANCED: Extract fields with comprehensive logging
//     const title = formData.get("title")?.toString()?.trim() || "";
//     const facultyId = formData.get("facultyId")?.toString()?.trim() || "";
//     const email = formData.get("email")?.toString()?.trim() || "";
//     const place = formData.get("place")?.toString()?.trim() || "";
//     const roomId = formData.get("roomId")?.toString()?.trim() || "";
//     const description = formData.get("description")?.toString()?.trim() || "";

//     // ✅ CRITICAL: Enhanced date/time extraction with multiple field name support
//     const startTime =
//       formData.get("startTime")?.toString()?.trim() ||
//       formData.get("suggested_time_start")?.toString()?.trim() ||
//       "";
//     const endTime =
//       formData.get("endTime")?.toString()?.trim() ||
//       formData.get("suggested_time_end")?.toString()?.trim() ||
//       "";

//     const eventId =
//       formData.get("eventId")?.toString()?.trim() || "default-conference-2025";
//     const status =
//       (formData.get("status")?.toString()?.trim() as "Draft" | "Confirmed") ||
//       "Draft";
//     const inviteStatus =
//       formData.get("inviteStatus")?.toString()?.trim() ||
//       formData.get("invite_status")?.toString()?.trim() ||
//       "Pending";

//     const travel =
//       formData.get("travel")?.toString()?.trim() ||
//       formData.get("travelStatus")?.toString()?.trim() ||
//       "";
//     const accommodation =
//       formData.get("accommodation")?.toString()?.trim() || "";

//     const travelRequired = travel === "yes" || travel === "true";
//     const accommodationRequired =
//       accommodation === "yes" || accommodation === "true";

//     console.log("📋 Extracted session data:");
//     console.log({
//       title,
//       facultyId,
//       email,
//       place,
//       roomId,
//       eventId,
//       status,
//       inviteStatus,
//       startTime,
//       endTime,
//       travel: travelRequired,
//       accommodation: accommodationRequired,
//     });

//     // ✅ ENHANCED: Validation with detailed error reporting
//     const missingFields = [];
//     if (!title) missingFields.push("title");
//     if (!facultyId) missingFields.push("facultyId");
//     if (!email) missingFields.push("email");
//     if (!place) missingFields.push("place");
//     if (!roomId) missingFields.push("roomId");

//     if (missingFields.length > 0) {
//       console.error("❌ Missing required fields:", missingFields);
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Missing required fields: ${missingFields.join(", ")}`,
//           receivedFields: Object.fromEntries(formData.entries()),
//           missingFields,
//         },
//         { status: 400 }
//       );
//     }

//     // ✅ CRITICAL: Enhanced date/time processing with comprehensive validation
//     let finalStartTime: string;
//     let finalEndTime: string;

//     console.log("📅 Processing date/time information...");
//     console.log(
//       `   Received startTime: "${startTime}" (length: ${startTime.length})`
//     );
//     console.log(
//       `   Received endTime: "${endTime}" (length: ${endTime.length})`
//     );

//     try {
//       if (!startTime || !endTime) {
//         console.log(
//           "⚠️ No times provided, this should not happen with Excel upload!"
//         );
//         console.log("🔄 Generating fallback times for current date...");

//         const baseDate = new Date();
//         const startDate = new Date(baseDate);
//         startDate.setHours(9, 0, 0, 0);
//         const endDate = new Date(baseDate);
//         endDate.setHours(17, 0, 0, 0);

//         finalStartTime = startDate.toISOString().substring(0, 19);
//         finalEndTime = endDate.toISOString().substring(0, 19);

//         console.log("✅ Generated fallback times:", {
//           finalStartTime,
//           finalEndTime,
//         });
//       } else {
//         console.log("✅ Processing provided date/time values...");

//         const parsedStartTime = parseLocalDateTime(startTime);
//         const parsedEndTime = parseLocalDateTime(endTime);

//         console.log("📅 Parsing results:");
//         console.log(`   Start: "${startTime}" -> "${parsedStartTime}"`);
//         console.log(`   End: "${endTime}" -> "${parsedEndTime}"`);

//         if (!parsedStartTime) {
//           console.error(`❌ Failed to parse start time: "${startTime}"`);
//           throw new Error(`Invalid start time format: ${startTime}`);
//         }

//         finalStartTime = parsedStartTime;

//         if (!parsedEndTime) {
//           console.log("⚠️ End time parsing failed, generating from start time");
//           const startDate = new Date(parsedStartTime);
//           const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours
//           finalEndTime = endDate.toISOString().substring(0, 19);
//           console.log(`📅 Generated end time: ${finalEndTime}`);
//         } else {
//           finalEndTime = parsedEndTime;
//         }
//       }

//       // ✅ ENHANCED: Comprehensive date validation
//       console.log("🔍 Validating processed date/times...");

//       const start = new Date(finalStartTime);
//       const end = new Date(finalEndTime);

//       console.log("📅 Date validation details:");
//       console.log(`   Start Date object: ${start.toISOString()}`);
//       console.log(`   End Date object: ${end.toISOString()}`);
//       console.log(`   Start valid: ${!isNaN(start.getTime())}`);
//       console.log(`   End valid: ${!isNaN(end.getTime())}`);
//       console.log(`   Start readable: ${start.toLocaleString()}`);
//       console.log(`   End readable: ${end.toLocaleString()}`);

//       if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//         throw new Error(
//           `Invalid date objects created. Start: ${finalStartTime}, End: ${finalEndTime}`
//         );
//       }

//       if (end <= start) {
//         console.error("❌ End time is not after start time");
//         return NextResponse.json(
//           { success: false, error: "End time must be after start time" },
//           { status: 400 }
//         );
//       }

//       const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
//       if (durationMinutes < 15) {
//         console.error(`❌ Session too short: ${durationMinutes} minutes`);
//         return NextResponse.json(
//           { success: false, error: "Session must be at least 15 minutes long" },
//           { status: 400 }
//         );
//       }

//       console.log("✅ Date/time validation passed:");
//       console.log(`   Final start time: ${finalStartTime}`);
//       console.log(`   Final end time: ${finalEndTime}`);
//       console.log(`   Duration: ${durationMinutes} minutes`);
//       console.log(
//         `   Readable duration: ${
//           Math.round((durationMinutes / 60) * 10) / 10
//         } hours`
//       );
//     } catch (timeError) {
//       console.error("❌ Date/time processing error:", timeError);
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Time parsing failed: ${timeError}`,
//           providedTimes: { startTime, endTime },
//           processingStep: "date-validation",
//         },
//         { status: 400 }
//       );
//     }

//     // ✅ Skip conflict checking if requested
//     const conflictOnly = formData.get("conflictOnly")?.toString() === "true";
//     if (conflictOnly) {
//       return NextResponse.json({
//         success: true,
//         conflicts: [],
//         hasConflicts: false,
//         message: "Conflict check skipped for bulk creation",
//       });
//     }

//     // ✅ Generate session ID and prepare data for database
//     const sessionId = randomUUID();

//     console.log("💾 Preparing session data for database storage...");

//     const sessionData = {
//       sessionId,
//       eventId,
//       title,
//       description,
//       startTime: finalStartTime,
//       endTime: finalEndTime,
//       hallId: roomId, // Using hallId as per database schema
//       facultyId,
//       facultyEmail: email,
//       place,
//       status,
//       inviteStatus: inviteStatus as "Pending" | "Accepted" | "Declined",
//       travel: travelRequired,
//       accommodation: accommodationRequired,
//     };

//     console.log("📊 Final session data for database:");
//     console.log(JSON.stringify(sessionData, null, 2));

//     // ✅ ENHANCED: Create session with comprehensive error handling
//     console.log("💾 Creating session in database...");

//     let createdSessionId: string;
//     try {
//       createdSessionId = await createSessionWithEvent(sessionData);
//       console.log(`✅ Session created with ID: ${createdSessionId}`);
//     } catch (dbError) {
//       console.error("❌ Database creation error:", dbError);
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Failed to create session in database",
//           details: dbError instanceof Error ? dbError.message : String(dbError),
//         },
//         { status: 500 }
//       );
//     }

//     // ✅ ENHANCED: Verify and log what was actually stored
//     console.log("🔍 Verifying database storage...");

//     const verify = await getSessionById(createdSessionId);
//     if (!verify) {
//       console.error("❌ Session verification failed - not found in database");
//       return NextResponse.json(
//         { success: false, error: "Session created but verification failed" },
//         { status: 500 }
//       );
//     }

//     console.log("✅ Database verification successful:");
//     console.log({
//       id: verify.id,
//       title: verify.title,
//       storedStartTime: verify.startTime,
//       storedEndTime: verify.endTime,
//       startTimeType: typeof verify.startTime,
//       endTimeType: typeof verify.endTime,
//       startReadable: verify.startTime
//         ? new Date(verify.startTime).toLocaleString()
//         : "N/A",
//       endReadable: verify.endTime
//         ? new Date(verify.endTime).toLocaleString()
//         : "N/A",
//     });

//     // ✅ Get additional info for response
//     const faculties = await getFaculties();
//     const rooms = await getRooms();
//     const faculty = faculties.find((f) => f.id === facultyId);
//     const room = rooms.find((r) => r.id === roomId);

//     // ✅ ENHANCED: Prepare comprehensive response
//     const sessionForResponse = {
//       id: createdSessionId,
//       title,
//       facultyId,
//       facultyName: faculty?.name || "Faculty Member",
//       email,
//       place,
//       roomId,
//       roomName: room?.name || roomId,
//       description,
//       startTime: finalStartTime,
//       endTime: finalEndTime,
//       status,
//       inviteStatus: inviteStatus as "Pending",
//       eventId,
//       travel: travelRequired,
//       accommodation: accommodationRequired,
//       // ✅ Include verification info
//       verified: true,
//       stored: true,
//       // ✅ Include readable dates
//       startTimeReadable: new Date(finalStartTime).toLocaleString(),
//       endTimeReadable: new Date(finalEndTime).toLocaleString(),
//       // ✅ Include raw database values for debugging
//       dbStartTime: verify.startTime,
//       dbEndTime: verify.endTime,
//     };

//     console.log("🎉 Session creation completed successfully!");
//     console.log(`   Session ID: ${createdSessionId}`);
//     console.log(`   Title: ${title}`);
//     console.log(`   Faculty: ${faculty?.name || facultyId}`);
//     console.log(
//       `   Dates: ${new Date(finalStartTime).toLocaleDateString()} - ${new Date(
//         finalEndTime
//       ).toLocaleDateString()}`
//     );

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Session created and stored successfully with proper dates",
//         data: sessionForResponse,
//         debug: {
//           receivedStartTime: startTime,
//           receivedEndTime: endTime,
//           parsedStartTime: finalStartTime,
//           parsedEndTime: finalEndTime,
//           storedStartTime: verify.startTime,
//           storedEndTime: verify.endTime,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (err: any) {
//     console.error("❌ Unexpected error in session creation:", err);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Internal server error",
//         details: err?.message || "",
//         stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// export const dynamic = "force-dynamic";
