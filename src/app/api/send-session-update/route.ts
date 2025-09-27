import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

interface SessionUpdateRequest {
  sessionId: string;
  facultyEmail: string;
  facultyName: string;
  sessionTitle: string;
  eventName: string;
  place: string;
  roomName: string;
  startTime: string;
  endTime: string;
  status: string;
  description?: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

export async function POST(request: NextRequest) {
  try {
    const body: SessionUpdateRequest = await request.json();

    const {
      sessionId,
      facultyEmail,
      facultyName,
      sessionTitle,
      eventName,
      place,
      roomName,
      startTime,
      endTime,
      status,
      description,
      changes,
    } = body;

    console.log("=== SESSION UPDATE EMAIL DEBUG ===");
    console.log("Request body:", body);
    console.log("Faculty Email:", facultyEmail);
    console.log("Faculty Name:", facultyName);
    console.log("Changes:", changes);

    // Validate required fields
    if (!facultyEmail || !facultyName || !sessionTitle) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: facultyEmail, facultyName, sessionTitle",
        },
        { status: 400 }
      );
    }

    // Faculty dashboard link
    const dashboardLink = `${baseUrl.replace(
      /\/+$/,
      ""
    )}/faculty-login?email=${encodeURIComponent(facultyEmail)}`;
    console.log("Dashboard Link:", dashboardLink);

    // Format changes for display
    const changesHtml = changes
      .map((change) => {
        let displayField = change.field;
        let displayOldValue = change.oldValue;
        let displayNewValue = change.newValue;

        // Format field names
        switch (change.field) {
          case "startTime":
            displayField = "Start Time";
            displayOldValue = change.oldValue
              ? new Date(change.oldValue).toLocaleString()
              : "Not set";
            displayNewValue = change.newValue
              ? new Date(change.newValue).toLocaleString()
              : "Not set";
            break;
          case "endTime":
            displayField = "End Time";
            displayOldValue = change.oldValue
              ? new Date(change.oldValue).toLocaleString()
              : "Not set";
            displayNewValue = change.newValue
              ? new Date(change.newValue).toLocaleString()
              : "Not set";
            break;
          case "roomId":
            displayField = "Room";
            break;
          case "place":
            displayField = "Location";
            break;
          case "status":
            displayField = "Status";
            break;
          case "description":
            displayField = "Description";
            break;
          default:
            displayField =
              change.field.charAt(0).toUpperCase() + change.field.slice(1);
        }

        return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">${displayField}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #d32f2f;">${
            displayOldValue || "-"
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #388e3c;">${
            displayNewValue || "-"
          }</td>
        </tr>
      `;
      })
      .join("");

    // Format times for display
    const formattedStartTime = startTime
      ? new Date(startTime).toLocaleString()
      : "Not scheduled";
    const formattedEndTime = endTime
      ? new Date(endTime).toLocaleString()
      : "Not scheduled";

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Updated - ${eventName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 700px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .content { 
              background: #fff; 
              padding: 30px; 
              border: 1px solid #ddd;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #764ba2;
            }
            .session-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .changes-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .changes-table th {
              background-color: #764ba2;
              color: white;
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            .cta-button { 
              display: inline-block; 
              background: #764ba2; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 25px; 
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
            }
            .alert {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header">
              <h1 style="color:#764ba2; margin: 0;">📝 Session Updated</h1>
              <p style="margin: 5px 0 0 0; font-size: 18px; color: #666;">${eventName}</p>
            </div>
            
            <p>Dear <strong>${facultyName}</strong>,</p>
            
            <p>We hope this message finds you well. We're writing to inform you that your session details have been updated.</p>

            <div class="session-info">
              <h3 style="color: #764ba2; margin-top: 0;">📋 Session Information</h3>
              <p><strong>Session Title:</strong> ${sessionTitle}</p>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Location:</strong> ${place}</p>
              <p><strong>Room:</strong> ${roomName}</p>
              <p><strong>Start Time:</strong> ${formattedStartTime}</p>
              <p><strong>End Time:</strong> ${formattedEndTime}</p>
              <p><strong>Status:</strong> <span style="background: ${
                status === "Confirmed" ? "#4caf50" : "#ff9800"
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></p>
              ${
                description
                  ? `<p><strong>Description:</strong> ${description}</p>`
                  : ""
              }
            </div>

            ${
              changes.length > 0
                ? `
              <div class="alert">
                <h3 style="color: #1976d2; margin-top: 0;">🔄 What Changed</h3>
                <table class="changes-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Previous Value</th>
                      <th>Updated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${changesHtml}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            <p><strong>What do you need to do?</strong></p>
            <p>Please review the updated session details and confirm your availability. If you have any concerns or conflicts with the new schedule, please reach out to us as soon as possible.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardLink}" class="cta-button">
                📅 View Faculty Dashboard
              </a>
            </div>

            <p><strong>Need Help?</strong><br>
            If you have any questions about these changes or need assistance, please don't hesitate to contact our event coordination team.</p>

            <p>Thank you for your continued participation in ${eventName}.</p>

            <p>Best regards,<br>
            <strong>Event Coordination Team</strong><br>
            ${eventName}</p>
          </div>
        </body>
      </html>
    `;

    // Simple text version
    const changesText = changes
      .map((change) => {
        const field =
          change.field.charAt(0).toUpperCase() + change.field.slice(1);
        return `- ${field}: "${change.oldValue || "Not set"}" → "${
          change.newValue || "Not set"
        }"`;
      })
      .join("\n");

    const textContent = `
Dear ${facultyName},

Your session details have been updated for ${eventName}.

SESSION INFORMATION:
- Title: ${sessionTitle}
- Event: ${eventName}
- Location: ${place}
- Room: ${roomName}
- Start Time: ${formattedStartTime}
- End Time: ${formattedEndTime}
- Status: ${status}
${description ? `- Description: ${description}` : ""}

${
  changes.length > 0
    ? `
WHAT CHANGED:
${changesText}
`
    : ""
}

Please review the updated details and confirm your availability.

Faculty Dashboard: ${dashboardLink}

Thank you for your participation.

Best regards,
Event Coordination Team
${eventName}
    `.trim();

    console.log("📧 Attempting to send session update email to:", facultyEmail);

    // Try sending the email
    let result;
    try {
      result = await sendMail({
        to: facultyEmail,
        subject: `📝 Session Updated: ${sessionTitle} - ${eventName}`,
        text: textContent,
        html: htmlContent,
      });

      console.log("📧 SendMail Result:", result);
    } catch (emailError) {
      console.error("❌ SendMail Error:", emailError);

      return NextResponse.json(
        {
          success: false,
          error: "Email sending failed",
          details:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
        },
        { status: 500 }
      );
    }

    if (result && result.ok) {
      console.log(
        `✅ Session update email sent successfully to ${facultyEmail}`
      );
      return NextResponse.json({
        success: true,
        message: "Session update email sent successfully",
        recipient: facultyEmail,
      });
    } else {
      console.error("❌ SendMail returned error:", result);

      return NextResponse.json(
        {
          success: false,
          error: result?.message || "Failed to send email - unknown error",
          details: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ CRITICAL ERROR in session-update API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Critical server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  );
}
