import { NextRequest, NextResponse } from "next/server";
import { getSessionById, updateSession } from "../../../_store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");
  const reason = url.searchParams.get("reason");

  console.log("🔍 Response handler called:", {
    sessionId,
    token: token?.substring(0, 8) + "...",
    action,
    reason,
    url: req.url,
  });

  if (!token || (action !== "accept" && action !== "decline")) {
    console.error("❌ Invalid parameters:", { token: !!token, action });
    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Invalid Request</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 24px; color: #222; text-align: center;">
    <h2>❌ Invalid Request</h2>
    <p>The response link appears to be invalid or incomplete.</p>
    <p>Please check your email and try clicking the link again.</p>
  </body>
</html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    console.log("🔍 Looking for session with ID:", sessionId);
    const session = await getSessionById(sessionId);

    if (!session) {
      console.error("❌ Session not found:", sessionId);
      const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Session Not Found</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 24px; color: #222; text-align: center;">
    <h2>❌ Session Not Found</h2>
    <p>The session you're trying to respond to could not be found.</p>
    <p>This might happen if:</p>
    <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
      <li>The session has been cancelled or removed</li>
      <li>The response link has expired</li>
      <li>There was an error in the email link</li>
    </ul>
    <p>Please contact the organizing committee for assistance.</p>
  </body>
</html>`;
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    console.log(
      "✅ Session found:",
      session.title,
      "Token match:",
      session.inviteToken === token
    );

    if (session.inviteToken !== token) {
      console.error("❌ Invalid token:", {
        provided: token.substring(0, 8) + "...",
        expected: session.inviteToken.substring(0, 8) + "...",
      });
      const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Invalid Token</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 24px; color: #222; text-align: center;">
    <h2>❌ Invalid Response Token</h2>
    <p>The response token is invalid or has expired.</p>
    <p>Please use the latest email invitation to respond.</p>
  </body>
</html>`;
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    let updatedData: any = {};

    if (action === "accept") {
      updatedData = {
        inviteStatus: "Accepted" as const,
        rejectionReason: undefined,
        suggestedTopic: undefined,
        suggestedTimeStart: undefined,
        suggestedTimeEnd: undefined,
        optionalQuery: undefined,
      };
      console.log("✅ Processing accept response");
    } else {
      updatedData = {
        inviteStatus: "Declined" as const,
      };

      if (reason === "not_interested") {
        updatedData.rejectionReason = "NotInterested" as const;
        updatedData.suggestedTopic = undefined;
        updatedData.suggestedTimeStart = undefined;
        updatedData.suggestedTimeEnd = undefined;
        updatedData.optionalQuery = undefined;
      }
      console.log("❌ Processing decline response:", { reason });
    }

    await updateSession(sessionId, updatedData);
    console.log("💾 Session updated successfully");

    // Get updated session for display
    const updatedSession = await getSessionById(sessionId);

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Response Recorded</title>
    <style>
      body { 
        font-family: system-ui, sans-serif; 
        padding: 24px; 
        color: #222; 
        max-width: 600px; 
        margin: 0 auto; 
        background: #f9fafb;
      }
      .container {
        background: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .success { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
        color: white; 
        padding: 20px; 
        border-radius: 12px; 
        text-align: center; 
        margin-bottom: 24px;
      }
      .declined { 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
        color: white; 
        padding: 20px; 
        border-radius: 12px; 
        text-align: center; 
        margin-bottom: 24px;
      }
      .session-details { 
        background: #f8fafc; 
        padding: 20px; 
        border-radius: 10px; 
        margin: 20px 0; 
        border: 2px solid #e2e8f0;
      }
      .detail-row {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-label {
        font-weight: 600;
        color: #64748b;
        width: 120px;
        flex-shrink: 0;
      }
      .detail-value {
        color: #1e293b;
        flex: 1;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="${
        updatedSession?.inviteStatus === "Accepted" ? "success" : "declined"
      }">
        <h2>${
          updatedSession?.inviteStatus === "Accepted"
            ? "✅ Response Accepted!"
            : "❌ Response Recorded"
        }</h2>
        <p>Your response has been successfully recorded and the organizers have been notified.</p>
      </div>
      
      <div class="session-details">
        <h3 style="margin: 0 0 16px 0; color: #1e293b;">📋 Session Details</h3>
        <div class="detail-row">
          <div class="detail-label">Topic:</div>
          <div class="detail-value">${
            updatedSession?.title || "Not specified"
          }</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Status:</div>
          <div class="detail-value" style="font-weight: 600; color: ${
            updatedSession?.inviteStatus === "Accepted" ? "#059669" : "#dc2626"
          };">
            ${updatedSession?.inviteStatus || "Unknown"}
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Start Time:</div>
          <div class="detail-value">${
            updatedSession?.startTime
              ? new Date(updatedSession.startTime).toLocaleString("en-US", {
                  timeZone: "Asia/Kolkata",
                })
              : "Not set"
          }</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">End Time:</div>
          <div class="detail-value">${
            updatedSession?.endTime
              ? new Date(updatedSession.endTime).toLocaleString("en-US", {
                  timeZone: "Asia/Kolkata",
                })
              : "Not set"
          }</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Location:</div>
          <div class="detail-value">${
            updatedSession?.place || "Not specified"
          }</div>
        </div>
        ${
          updatedSession?.rejectionReason === "NotInterested"
            ? `<div class="detail-row">
               <div class="detail-label">Reason:</div>
               <div class="detail-value" style="color: #dc2626;">Not interested in this topic</div>
             </div>`
            : ""
        }
      </div>
      
      <div style="text-align: center; color: #64748b; margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Thank you for your response!</p>
        <p style="margin: 0; font-size: 14px;">
          The organizing committee has been notified. You can safely close this window.
        </p>
      </div>
    </div>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error in response handler:", error);
    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Error</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 24px; color: #222; text-align: center;">
    <h2>❌ An Error Occurred</h2>
    <p>There was an error processing your response.</p>
    <p>Please try again or contact the organizing committee.</p>
    <p style="font-size: 12px; color: #666; margin-top: 24px;">
      Error details: ${error instanceof Error ? error.message : "Unknown error"}
    </p>
  </body>
</html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export const dynamic = "force-dynamic";
