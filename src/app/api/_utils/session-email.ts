import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

// Hardcoded data for all 7 faculty members from PDF
const FACULTY_DATA = {
  "anand07amar@gmail.com": {
    facultyName: "Dr Anand",
    email: "anand07amar@gmail.com",
    sessions: [
      {
        title: "demo",
        day: "06/11",
        role: "Speaker"
      }
    ]
  },
  // "praj@abhinavagroup.com": {
  //   facultyName: "Prajwal",
  //   email: "praj@abhinavagroup.com",
  //   sessions: [
  //     {
  //       title: "Critical Care of Cellular Therapies in Transplant & Oncology (CAR-T, Immunotherapies)",
  //       day: "07/11",
  //       role: "Speaker"
  //     }
  //   ]
  // },
  // "priya.ks@abhinavagroup.com": {
  //   facultyName: "Priya", 
  //   email: "priya.ks@abhinavagroup.com",
  //   sessions: [
  //     {
  //       title: "Crack the Cardiac Code: Applied Physiology Made Simple",
  //       day: "08/11",
  //       role: "Speaker"
  //     }
  //   ]
  // },
  // "shruti@abhinavagroup.com": {
  //   facultyName: "Shruti",
  //   email: "shruti@abhinavagroup.com", 
  //   sessions: [
  //     {
  //       title: "Pediatric Research Networking",
  //       day: "09/11",
  //       role: "Speaker"
  //     },
  //     {
  //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
  //       day: "09/11",
  //       role: "Moderator"
  //     }
  //   ]
  // },
  // "v@abhinavagroup.com": {
  //   facultyName: "Vidyashankar",
  //   email: "v@abhinavagroup.com",
  //   sessions: [
  //     {
  //       title: "Oncologic Emergencies: Expert Strategies", 
  //       day: "09/11",
  //       role: "Speaker"
  //     }
  //   ]
  // },
  // "drskpanuganti@gmail.com": {
  //   facultyName: "Dr Suresh Kumar Panuganti",
  //   email: "drskpanuganti@gmail.com",
  //   sessions: [
  //     {
  //       title: "Pediatric Research Networking",
  //       day: "09/11", 
  //       role: "Speaker"
  //     }
  //   ]
  // },
  // "farhanshaikh74@gmail.com": {
  //   facultyName: "Dr Farhan Shaikh",
  //   email: "farhanshaikh74@gmail.com",
  //   sessions: [
  //     {
  //       title: "Pediatric Research Networking",
  //       day: "09/11",
  //       role: "Speaker"
  //     },
  //     {
  //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
  //       day: "09/11", 
  //       role: "Moderator"
  //     }
  //   ]
  // },
  // "dayalanjul@gmail.com": {
  //   facultyName: "Dr Anjul Dayal",
  //   email: "dayalanjul@gmail.com",
  //   sessions: [
  //     {
  //       title: "Critical Care of Cellular Therapies in Transplant & Oncology (CAR-T, Immunotherapies)",
  //       day: "09/11",
  //       role: "Speaker"
  //     }
  //   ]
  // }
};

// Generate HTML for a specific faculty member
function renderFacultyHTML(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];
  
  if (!facultyData) {
    console.error(`No data found for faculty: ${facultyEmail}`);
    return "";
  }

  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}`;

  const rows = facultyData.sessions
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
    
    <p>Dear Dr. <strong>${facultyData.facultyName}</strong>,</p>
    <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
    <p>Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:</p>
    
    <!-- 3-column table -->
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

// Generate plain text email for a specific faculty member
function generateFacultyTextEmail(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];
  
  if (!facultyData) {
    return "";
  }

  const sessionsText = facultyData.sessions
    .map((s, index) => `Day ${s.day}:
Session: ${s.title}
Role: ${s.role}`)
    .join("\n\n");

  return `Subject: Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad

Dear Dr. ${facultyData.facultyName},

Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: November 6–9, 2025
📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:

Your Faculty Invitation – PediCritiCon 2025

${sessionsText}

👉 Kindly confirm your acceptance by clicking Yes or No 
Login here: ${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}

🔹 Hospitality & Travel:
Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
Travel: You are requested to kindly arrange your own travel.
Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025
`;
}

/**
 * TEMPORARILY DISABLED - Send personalized emails to ALL 7 faculty members
 * This function ignores all input parameters and sends to all 7 people
 */
export async function sendBulkInviteEmail(
  sessions?: any[],  // Ignored
  facultyName?: string,  // Ignored  
  email?: string  // Ignored
) {
  // TEMPORARILY DISABLED - Return without sending emails
  console.log('Bulk email sending temporarily disabled');
  return {
    ok: true,
    message: 'Email sending disabled - sessions created without emails',
    results: []
  };
}

/**
 * TEMPORARILY DISABLED - Send personalized emails to ALL 7 faculty members
 * Input parameters are ignored
 */
export async function sendInviteEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  email?: string  // Ignored
) {
  // TEMPORARILY DISABLED - Return without sending emails
  console.log('Email sending temporarily disabled');
  return {
    ok: true,
    message: 'Email sending disabled - sessions created without emails'
  };
}

/**
 * TEMPORARILY DISABLED - Send update emails to ALL 7 faculty members
 * Input parameters are ignored
 */
export async function sendUpdateEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  roomName?: string  // Ignored
): Promise<{ ok: boolean; message?: string }> {
  // TEMPORARILY DISABLED - Return without sending emails
  console.log('Update email sending temporarily disabled');
  return {
    ok: true,
    message: 'Update email sending disabled - sessions updated without emails'
  };
}