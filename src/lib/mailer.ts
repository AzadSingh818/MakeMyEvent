import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: any[];
}

export async function sendMail(options: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Scientific Portal" <${
        process.env.SMTP_FROM || process.env.SMTP_USER
      }>`,
      ...options,
    });

    console.log("✅ Message sent: %s", info.messageId);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface NotificationEmailData {
  facultyName: string;
  email: string;
  sessionsCount: number;
  isNewUser: boolean;
  tempPassword?: string;
}

function renderPortalNotificationEmailHTML(data: NotificationEmailData) {
  const loginUrl = `${baseUrl}/auth/login`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Invitations - Scientific Portal</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f4f6;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f2f4f6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            
            <tr>
              <td style="padding:32px 24px;">
                <div style="text-align:center;margin-bottom:24px;">
                  <div style="background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);width:80px;height:80px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:36px;">🎓</span>
                  </div>
                  <h1 style="margin:0 0 8px 0;font-size:28px;line-height:36px;color:#111827;font-weight:700;">New Session Invitations</h1>
                  <p style="margin:0;font-size:16px;color:#6b7280;">Scientific Portal System</p>
                </div>
                
                <div style="text-align:center;margin-bottom:32px;">
                  <p style="margin:0 0 16px 0;font-size:18px;line-height:28px;color:#374151;">Hello <strong style="color:#1f2937;">${
                    data.facultyName
                  }</strong>,</p>
                  <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#374151;">
                    You have been invited to speak at <strong style="color:#3b82f6;font-size:20px;">${
                      data.sessionsCount
                    }</strong> session${
    data.sessionsCount > 1 ? "s" : ""
  } in our upcoming conference.
                  </p>
                </div>

                ${
                  data.isNewUser
                    ? `
                <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;color:white;">
                  <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;">🔐 Your Portal Access Created</h2>
                  <p style="margin:0 0 16px 0;font-size:14px;opacity:90%;">We've created your faculty portal account with these credentials:</p>
                  
                  <div style="background:rgba(255,255,255,0.2);border-radius:12px;padding:20px;margin:16px 0;text-align:left;">
                    <div style="margin-bottom:12px;">
                      <div style="font-size:12px;opacity:80%;margin-bottom:4px;">EMAIL ADDRESS:</div>
                      <div style="font-size:16px;font-weight:700;font-family:monospace;background:rgba(255,255,255,0.2);padding:8px 12px;border-radius:6px;">${data.email}</div>
                    </div>
                    <div>
                      <div style="font-size:12px;opacity:80%;margin-bottom:4px;">TEMPORARY PASSWORD:</div>
                      <div style="font-size:18px;font-weight:700;font-family:monospace;background:rgba(255,255,255,0.3);padding:10px 12px;border-radius:6px;letter-spacing:1px;">${data.tempPassword}</div>
                    </div>
                  </div>
                  
                  <div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:12px;margin-top:16px;">
                    <p style="margin:0;font-size:12px;opacity:90%;">⚠️ <strong>Important:</strong> You'll be prompted to change this password on first login for security.</p>
                  </div>
                </div>
                `
                    : `
                <div style="background:linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;color:white;">
                  <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;">🔐 Portal Access Required</h2>
                  <p style="margin:0;font-size:14px;opacity:90%;">Please log in to your faculty portal to view session details and submit your responses.</p>
                </div>
                `
                }

                <div style="background:linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);border:2px solid #3b82f6;border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;">
                  <div style="font-size:48px;font-weight:800;color:#1e40af;margin-bottom:8px;">${
                    data.sessionsCount
                  }</div>
                  <div style="font-size:18px;color:#1e40af;font-weight:600;margin-bottom:4px;">Session Invitation${
                    data.sessionsCount > 1 ? "s" : ""
                  }</div>
                  <div style="font-size:14px;color:#3b82f6;">Awaiting your response in the portal</div>
                </div>

                <!-- MAIN CALL TO ACTION - PORTAL ACCESS ONLY -->
                <div style="text-align:center;margin-bottom:32px;">
                  <h3 style="margin:0 0 16px 0;font-size:20px;color:#111827;font-weight:600;">📋 How to Respond</h3>
                  <p style="margin:0 0 24px 0;font-size:15px;line-height:22px;color:#6b7280;">
                    <strong>Please do not reply to this email.</strong><br/>
                    Log in to your faculty portal to view session details and submit your responses.
                  </p>
                  
                  <div style="margin:24px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);color:#ffffff;text-decoration:none;font-size:18px;font-weight:700;padding:16px 32px;border-radius:12px;box-shadow:0 4px 12px rgba(59,130,246,0.4);">
                      🔐 Access Faculty Portal
                    </a>
                  </div>
                  
                  <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">
                    Click the button above to log in and manage your session invitations
                  </p>
                </div>

                <!-- WHAT YOU CAN DO IN PORTAL -->
                <div style="background:#f8fafc;border-radius:12px;padding:20px;">
                  <h4 style="margin:0 0 16px 0;font-size:16px;color:#1e293b;font-weight:600;">✨ In Your Faculty Portal Dashboard:</h4>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;color:#64748b;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="color:#10b981;">📅</span>
                      <span>View complete session details</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="color:#f59e0b;">⏰</span>
                      <span>Check schedules & room locations</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="color:#3b82f6;">✅</span>
                      <span>Accept or decline invitations</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="color:#8b5cf6;">💬</span>
                      <span>Suggest alternative topics/times</span>
                    </div>
                  </div>
                </div>

                <!-- IMPORTANT NOTICE -->
                <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-top:24px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:20px;">⚠️</span>
                    <h4 style="margin:0;font-size:14px;color:#92400e;font-weight:600;">Important Notice</h4>
                  </div>
                  <p style="margin:0;font-size:13px;color:#92400e;line-height:18px;">
                    Session responses can <strong>only</strong> be submitted through the faculty portal. 
                    Please do not reply to this email as responses will not be processed.
                  </p>
                </div>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <div style="text-align:center;">
                  <p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#64748b;">
                    📧 Session notification for <strong>${
                      data.facultyName
                    }</strong>
                  </p>
                  <p style="margin:0;font-size:11px;color:#9ca3af;">
                    Scientific Portal System • Portal access required for responses
                  </p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPortalNotificationEmail(data: NotificationEmailData) {
  console.log(
    `📧 Sending portal notification to: ${data.email} for ${data.sessionsCount} sessions`
  );

  const subject = data.isNewUser
    ? `🎓 Portal Access Created - ${data.sessionsCount} Session Invitation${
        data.sessionsCount > 1 ? "s" : ""
      }`
    : `🎓 ${data.sessionsCount} New Session Invitation${
        data.sessionsCount > 1 ? "s" : ""
      } - Portal Access Required`;

  const loginUrl = `${baseUrl}/auth/login`;

  const text = `Hello ${data.facultyName},

You have been invited to speak at ${data.sessionsCount} session${
    data.sessionsCount > 1 ? "s" : ""
  } in our upcoming conference.

${
  data.isNewUser
    ? `PORTAL ACCESS CREATED:
We've created your faculty portal account with these credentials:

Email: ${data.email}
Temporary Password: ${data.tempPassword}

⚠️ IMPORTANT: You'll be prompted to change this password on first login.

`
    : ""
}IMPORTANT: Please do not reply to this email.

To view session details and submit your responses, please log in to your faculty portal:
${loginUrl}

In your portal dashboard, you can:
- View complete session details and schedules
- Accept or decline invitations
- Suggest alternative topics or times
- View room locations and other logistics

Session responses can ONLY be submitted through the faculty portal. Email replies will not be processed.

Best regards,
Scientific Portal System`;

  const html = renderPortalNotificationEmailHTML(data);

  return sendMail({
    to: data.email,
    subject,
    text,
    html,
  });
}
