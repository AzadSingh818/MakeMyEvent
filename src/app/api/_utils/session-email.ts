import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

// Hardcoded Shruti data - this will be sent regardless of input parameters
const SHRUTI_DATA = {
  facultyName: "Shruti",
  email: "shruti@abhinavagroup.com",
  sessions: [
    {
      title: "Pediatric Research Networking",
      day: "07/11",
      role: "Speaker"
    },
    {
      title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
      day: "08/11", 
      role: "Moderator"
    }
  ]
};

// Always returns Shruti's hardcoded HTML regardless of parameters
function renderHTML(sessions?: any[], facultyName?: string) {
  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(SHRUTI_DATA.email)}`;

  const rows = SHRUTI_DATA.sessions
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #eaeaea;">
        <td style="padding:12px; border-right:1px solid #ddd;">${s.title}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.day}</td>
        <td style="padding:12px;">${s.role}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Session Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <!-- Header -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
      <!-- PediCritiCon Header Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
           alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>

  <div style="background:#fff; padding:30px; border:1px solid #ddd;">
    <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad</h1>
    
    <p>Dear Dr. <strong>${SHRUTI_DATA.facultyName}</strong>,</p>
    <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
    <p>Your proposed faculty roles are outlined below:</p>
    
    <!-- Hardcoded 3-column table for Shruti -->
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <thead style="background:#efefef;">
        <tr>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Day</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Role</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Conference Registration & Participation -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
      <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Acceptance & Details:</h4>
      <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
          <strong>Please confirm your acceptance by clicking Yes or No on the faculty dashboard</strong>
      </p>
    </div>

    <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 14px;">🔹 Hospitality & Travel:</h4>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Accommodation:</strong> We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Travel:</strong> You are requested to kindly arrange your own travel.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Registration:</strong> You will receive a unique link at early bird rates upon acceptance of the invite.
        </p>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> on the faculty dashboard at 
            the earliest so we may make suitable adjustments.
        </p>
        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>
    </div>

    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #764ba2; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #764ba2;">Scientific Committee, PediCritiCon 2025</span>
        </p>
    </div>
    
    <p style="text-align:center; margin: 30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#764ba2;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(118,75,162,0.4);
        ">
        🔐 Access Faculty Portal
      </a>
    </p>
    <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
      If you have questions, contact your event coordinator. This message was sent automatically.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
      <!-- PediCritiCon Footer Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
           alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>
</body>
</html>
`;
}

// Always returns Shruti's hardcoded update HTML
function renderUpdateHTML(session?: any, facultyName?: string, roomName?: string) {
  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(SHRUTI_DATA.email)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Session Updated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <!-- Header -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
      <!-- PediCritiCon Header Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
           alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>

  <div style="background:#fff; padding:30px; border:1px solid #ddd;">
    <h1 style="color:#ff6b35; text-align:center; margin-bottom:20px;">📅 Session Updated</h1>
    
    <p>Dear Dr. <strong>${SHRUTI_DATA.facultyName}</strong>,</p>
    <p>Your sessions have been updated with new details:</p>
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Session 1:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${SHRUTI_DATA.sessions?.[0]?.title}</td>
      </tr>
      <tr style="background:#fff;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Day:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${SHRUTI_DATA.sessions[0]?.day}</td> 
      </tr>
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Role:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${SHRUTI_DATA.sessions[0]?.role}</td>
      </tr>
      <tr style="background:#fff;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Session 2:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${SHRUTI_DATA.sessions[1]?.title}</td>
      </tr>
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Day:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${SHRUTI_DATA.sessions[1]?.day}</td>
      </tr>
      <tr style="background:#fff;">
        <td style="padding:12px; font-weight:bold;">Role:</td>
        <td style="padding:12px;">${SHRUTI_DATA.sessions[1]?.role}</td>
      </tr>
    </table>
    <p><strong>Please confirm your availability again as the schedule has changed.</strong></p>
    <p style="text-align:center; margin:30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#ff6b35;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(255,107,53,0.4);
        ">
        🔐 Confirm Availability
      </a>
    </p>

    <!-- Conference Registration & Participation -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Registration & Participation:</h4>
        <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Registration:</strong> You will receive a unique link at early bird rates upon acceptance of the invite.
        </p>
        <p style="color: #4a5568; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> at 
            the earliest so we may make suitable adjustments.
        </p>
        <p style="color: #4a5568; font-size: 14px; margin: 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>
    </div>

    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #ff6b35; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #ff6b35;">Scientific Committee, PediCritiCon 2025</span>
        </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
      <!-- PediCritiCon Footer Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
           alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>
</body>
</html>
`;
}

/**
 * ALWAYS sends Shruti's email regardless of input parameters
 * All parameters are ignored - this will always send to shruti@abhinavagroup.com
 * with her hardcoded session data
 */
export async function sendBulkInviteEmail(
  sessions?: any[],  // Ignored
  facultyName?: string,  // Ignored  
  email?: string  // Ignored
) {
  const html = renderHTML(); // Uses hardcoded Shruti data
  const text = `Subject: Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad

Dear Dr. ${SHRUTI_DATA.facultyName},

Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: November 6–9, 2025
📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

Your proposed faculty roles are outlined below:

Your Faculty Invitation – PediCritiCon 2025

Day 07/11:
Session: ${SHRUTI_DATA.sessions[0]?.title}
Role: ${SHRUTI_DATA.sessions[0]?.role}

Day 08/11:
Session: ${SHRUTI_DATA.sessions[1]?.title}
Role: ${SHRUTI_DATA.sessions[1]?.role}

👉 Kindly confirm your acceptance by clicking Yes or No 
Login here: ${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(SHRUTI_DATA.email)}

🔹 Hospitality & Travel:
Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
Travel: You are requested to kindly arrange your own travel.
Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025
`;

  // ALWAYS sends to Shruti regardless of input email parameter
  return sendMail({
    to: SHRUTI_DATA.email,
    subject: `Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad`,
    text,
    html,
  });
}

/**
 * ALWAYS sends Shruti's email - input parameters are ignored
 */
export async function sendInviteEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  email?: string  // Ignored
) {
  return sendBulkInviteEmail(); // Calls hardcoded function
}

/**
 * ALWAYS sends Shruti's update email - input parameters are ignored
 */
export async function sendUpdateEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  roomName?: string  // Ignored
): Promise<{ ok: boolean; message?: string }> {
  try {
    const html = renderUpdateHTML(); // Uses hardcoded Shruti data
    const text = `Hello ${SHRUTI_DATA.facultyName},

Your sessions have been updated:

Session 1: "${SHRUTI_DATA.sessions[0]?.title}" - ${SHRUTI_DATA.sessions[0]?.day} - ${SHRUTI_DATA.sessions[0]?.role}
Session 2: "${SHRUTI_DATA.sessions[1]?.title}" - ${SHRUTI_DATA.sessions[1]?.day} - ${SHRUTI_DATA.sessions[1]?.role}

Please confirm your availability again as the schedule has changed.

Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025

Login here: ${baseUrl.replace(
      /\/+$/,
      ""
    )}/faculty-login?email=${encodeURIComponent(SHRUTI_DATA.email)}
`;

    // ALWAYS sends to Shruti
    const result = await sendMail({
      to: SHRUTI_DATA.email,
      subject: `📅 Session Updated: PediCritiCon 2025 Sessions`,
      text,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send update email:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Email sending failed",
    };
  }
}