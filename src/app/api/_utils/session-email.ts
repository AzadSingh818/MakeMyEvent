import { sendMail } from "@/lib/mailer";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

// Hardcoded data for Shruti and Vidyashankar
const FACULTY_DATA = {
"muigoku42@gmail.com": {
    facultyName: "MUI Goku",
    email: "muigoku42@gmail.com",
    sessions: [
      {
        title: "Advanced Pediatric Critical Care Management",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "arunlal0905@yahoo.com": {
    facultyName: "Arun Lal",
    email: "arunlal0905@yahoo.com",
    sessions: [
      {
        title: "Advanced Pediatric Critical Care Management",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "azadsingh818@outlook.com": {
    facultyName: "Azad Singh",
    email: "azadsingh818@outlook.com",
    sessions: [
      {
        title: "Advanced Pediatric Critical Care Management",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
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
        <td style="padding:12px; border-right:1px solid #ddd;">${s.date}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.role}</td>
        <td style="padding:12px;">${s.description}</td>
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
    <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">PediCritiCon 2025, Hyderabad</h1>
    
    <p>Dear Dr. <strong>${facultyData.facultyName}</strong>,</p>
    <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
    <p>Your proposed faculty role${
      facultyData.sessions.length > 1 ? "s are" : " is"
    } outlined below:</p>
    
    <!-- 4-column table with description -->
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <thead style="background:#efefef;">
        <tr>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Date</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Role</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Description</th>
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
          <strong>Please confirm your acceptance by clicking Accept or Decline on the faculty dashboard</strong>
      </p>
    </div>

    <!-- Access Faculty Dashboard Button -->
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
        🔐 Access Faculty Dashboard
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
    .map(
      (s, index) => `Date ${s.date}:
Session: ${s.title}
Role: ${s.role}
Description: ${s.description}`
    )
    .join("\n\n");

  return `Subject: PediCritiCon 2025 - Faculty Invitation

Dear Dr. ${facultyData.facultyName},

Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: November 6–9, 2025
📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

Your proposed faculty role${
    facultyData.sessions.length > 1 ? "s are" : " is"
  } outlined below:

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
 * Send personalized emails to Shruti and Vidyashankar
 */
export async function sendBulkInviteEmail(
  sessions?: any[], // Ignored
  facultyName?: string, // Ignored
  email?: string // Ignored
) {
  const results = [];

  // Send personalized email to each faculty member (only Shruti and Vidyashankar)
  for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
    try {
      const html = renderFacultyHTML(facultyEmail);
      const text = generateFacultyTextEmail(facultyEmail);

      const result = await sendMail({
        to: facultyData.email,
        subject: `PediCritiCon 2025 - Faculty Invitation`,
        text,
        html,
      });

      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: result.ok,
        message: result.message || "Email sent successfully",
      });

      console.log(
        `Email sent to ${facultyData.facultyName} (${facultyData.email}): ${
          result.ok ? "Success" : "Failed"
        }`
      );
    } catch (error) {
      console.error(
        `Failed to send email to ${facultyData.facultyName}:`,
        error
      );
      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Return summary of all sends
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log(
    `Email Summary: ${successCount} successful, ${failureCount} failed out of ${results.length} total`
  );

  return {
    ok: failureCount === 0,
    message: `Sent ${successCount}/${results.length} emails successfully`,
    results: results,
  };
}

/**
 * Send personalized emails to Shruti and Vidyashankar
 * Input parameters are ignored
 */
export async function sendInviteEmail(
  session?: any, // Ignored
  facultyName?: string, // Ignored
  email?: string // Ignored
) {
  return sendBulkInviteEmail(); // Calls the bulk function that sends to both
}

/**
 * Send update emails to Shruti and Vidyashankar
 * Input parameters are ignored
 */
export async function sendUpdateEmail(
  session?: any, // Ignored
  facultyName?: string, // Ignored
  roomName?: string // Ignored
): Promise<{ ok: boolean; message?: string }> {
  try {
    const results = [];

    // Send update email to each faculty member
    for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
      try {
        const sessionsText = facultyData.sessions
          .map(
            (s) => `Session: "${s.title}" - ${s.date} - ${s.role}
Description: ${s.description}`
          )
          .join("\n\n");

        const text = `Hello ${facultyData.facultyName},

Your session${facultyData.sessions.length > 1 ? "s have" : " has"} been updated:

${sessionsText}

Please confirm your availability again as the schedule has changed.

Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025

Login here: ${baseUrl.replace(
          /\/+$/,
          ""
        )}/faculty-login?email=${encodeURIComponent(facultyData.email)}
`;

        const result = await sendMail({
          to: facultyData.email,
          subject: `📅 Session Updated: PediCritiCon 2025`,
          text,
          html: renderFacultyHTML(facultyEmail), // Use their personalized HTML
        });

        results.push({
          email: facultyData.email,
          success: result.ok,
        });
      } catch (error) {
        console.error(
          `Failed to send update email to ${facultyData.facultyName}:`,
          error
        );
        results.push({
          email: facultyData.email,
          success: false,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      ok: failureCount === 0,
      message: `Update emails: ${successCount}/${results.length} sent successfully`,
    };
  } catch (error) {
    console.error("Failed to send update emails:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}



// import { sendMail } from "@/lib/mailer";

// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// const FACULTY_DATA = {
//   "anand07amar@gmail.com": {
//     facultyName: "Dr. Anand",
//     email: "anand07amar@gmail.com",
//     sessions: [
//       {
//         title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
//         date: "8th Nov",
//         role: "Panelist",
//         description: "Dr. Mahesh Mohite (Moderator) \nCo Panelists \nDr. Madhu Otiv \nDr. VSV Prasad \nDr. John Adabie Appiah \nDr. Mritunjay Pao"
//       }
//     ]
//   },
//    "drgsudhakar@hotmail.com": {
//     facultyName: "Dr. G Sudhakar",
//     email: "drgsudhakar@hotmail.com",
//     sessions: [
//       {
//         title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
//         date: "8th Nov",
//         role: "Panelist",
//         description: "Dr. Mahesh Mohite (Moderator) \nCo Panelists \nDr. Madhu Otiv \nDr. VSV Prasad \nDr. John Adabie Appiah \nDr. Mritunjay Pao"
//       }
//     ]
//   },
//   "drkhalilkhan18@gmail.com": {
//     facultyName: "Dr. Khaleel Khan",
//     email: "drkhalilkhan18@gmail.com",
//     sessions: [
//       {
//         title: "From Bed to Bed: Pediatric Transport 101",
//         date: "9th Nov",
//         role: "Speaker",
//         description: "---"
//       },
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "prashant.bachina@gmail.com": {
//     facultyName: "Dr. Prashant Bachina",
//     email: "prashant.bachina@gmail.com",
//     sessions: [
//       {
//         title: "Liver Transplant: Mastering Post-Op Complications",
//         date: "7th Nov",
//         role: "Panelist",
//         description: "Moderator\nDr Ravi T \n\nCo Panelists\nDr Akashdeep\nDr Ravi Babu K \nDr Sonal Gajbhiya"
//       }
//     ]
//   },
//   "raj2031979@gmail.com": {
//     facultyName: "Dr. Ramaling Loni",
//     email: "raj2031979@gmail.com",
//     sessions: [
//       {
//         title: "Acute Flaccid Paralysis in the PICU: GBS, Myelitis, or Something Else?",
//         date: "7th Nov",
//         role: "Panelist",
//         description: "Dr. Rohit Vohra (Moderator)\nCo Panelists\nDr. Jesal Sheth\nDr. Mukesh Jain\nDr. Mihir Sarkar"
//       }
//     ]
//   },
//   "drravi2k5@yahoo.co.in": {
//     facultyName: "Dr. Ravi T",
//     email: "drravi2k5@yahoo.co.in",
//     sessions: [
//       {
//         title: "Liver Transplant: Mastering Post-Op Complications",
//         date: "7th Nov",
//         role: "Moderator",
//         description: "Panelists\nDr. Ravi Babu K\nDr. Akashdeep, \nDr. Prashant Bachina\nDr. Sonal Gajbhiya"
//       }
//     ]
//   },
//   "rohitbhowmick.bhowmick@gmail.com": {
//     facultyName: "Dr. Rohit Bhowmick",
//     email: "rohitbhowmick.bhowmick@gmail.com",
//     sessions: [
//       {
//         title: "Management of Complications related to blood based dialysis in PICU",
//         date: "7th Nov",
//         role: "Panelist",
//         description: "Dr. Sateesh Poonarneni (Moderator) \nCo Panelists\nDr. Parag Dakate\nDr. Raghad Abdwani, \nDr. Sumant Patil, \nDr. Saumen Meur"
//       },
//       {
//         title: "CRRT and SLED",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "porwalsanketh@gmail.com": {
//     facultyName: "Dr. Sanket R",
//     email: "porwalsanketh@gmail.com",
//     sessions: [
//       {
//         title: "HSCT: Navigating HSCT Challenges",
//         date: "7th Nov",
//         role: "Panelists",
//         description: "Dr Indira Jayakumar(Moderator)\nCo Panelists\nDr Raj Lakshmi, \nDr Reshma A ,\nDr Abdul Rauf"
//       },
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "somu_rgk@yahoo.co.in": {
//     facultyName: "Dr. Somnath Gorain",
//     email: "somu_rgk@yahoo.co.in",
//     sessions: [
//       {
//         title: "Saving Lives, Saving Costs: Can We Do Both?",
//         date: "9th Nov",
//         role: "Panelist",
//         description: "Dr Nirmal Choraria (Moderator)\nCo Panelists\nDr Manju Kedarnath\nDr Kshama Daphtary\nDr Akash Bang"
//       }
//     ]
//   },
//   "sureshangurana@gmail.com": {
//     facultyName: "Dr. Suresh Kumar Angurana",
//     email: "sureshangurana@gmail.com",
//     sessions: [
//       {
//         title: "The Gut-Brain Axis in Pediatric ICU: A \nMicrobiome Perspective",
//         date: "9th Nov",
//         role: "Speaker",
//         description: "---"
//       }
//     ]
//   },
//   "surjeetthappa@gmail.com": {
//     facultyName: "Dr. Surjit Kumar Thappa",
//     email: "surjeetthappa@gmail.com",
//     sessions: [
//       {
//         title: "GAME ON – "Crash or Stabilise?"",
//         date: "7th Nov",
//         role: "Quizmaster",
//         description: "Fellow Quizmaster:\nDr Chidambaram"
//       },
//       {
//         title: "PCCN workshop",
//         date: "6th NOV",
//         role: "WORKSHOP",
//         description: "---"
//       }
//     ]
//   },
//   "drswathiraoped@gmail.com": {
//     facultyName: "Dr. Swathi Rao",
//     email: "drswathiraoped@gmail.com",
//     sessions: [
//       {
//         title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics",
//         date: "8th Nov",
//         role: "Panelist",
//         description: "Dr. Dhiren Gupta (Moderator)\nCo panelists\nDr. Mehak Bansal\nDr. Neil C\nDr. Namita Ravikumar"
//       },
//       {
//         title: "Non-Invasive Respiratory Support",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "doctortanzila@gmail.com": {
//     facultyName: "Dr. Tanzila Sharique",
//     email: "doctortanzila@gmail.com",
//     sessions: [
//       {
//         title: "Mottled Skin: Shock or Cold Room?",
//         date: "9th Nov",
//         role: "Speaker",
//         description: "---"
//       },
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "milind.jambagi@gmail.com": {
//     facultyName: "Dr Milind Jambagi",
//     email: "milind.jambagi@gmail.com",
//     sessions: [
//       {
//         title: "PICU Brain Buzzer",
//         date: "7th Nov",
//         role: "QuizMaster",
//         description: "Co Quiz masters: \nDr Maninder Dhaliwal, \nDr Karthik Narayan\nDr Farhan Shaikh"
//       },
//       {
//         title: "POCUS \n(Basic)",
//         date: "6th Nov",
//         role: "Workshop",
//         description: "---"
//       }
//     ]
//   },
//   "drsunildsharma@gmail.com": {
//     facultyName: "Dr Sunil Dutt Sharma",
//     email: "drsunildsharma@gmail.com",
//     sessions: [
//       {
//         title: "BP Crisis in Children: Think Fast, Act Slow",
//         date: "9th Nov",
//         role: "Speaker",
//         description: "---"
//       }
//     ]
//   },
//   "rgundeti@gmail.com": {
//     facultyName: "Dr G Ramesh",
//     email: "rgundeti@gmail.com",
//     sessions: [
//       {
//         title: "Buying Smart: Equipping Your PICU for Function, Not Fashion",
//         date: "9th Nov",
//         role: "Panelist",
//         description: "Moderator \nDr VSV Prasad \n\nCo Panelists\nDr Anand Buthada\nDr Rafiq Ahmed \nDr Nirmal Choraria\nDr Preetam"
//       }
//     ]
//   },
//   "niteshupadhyay22@gmail.com": {
//     facultyName: "Dr. Nitish Upadhaya",
//     email: "niteshupadhyay22@gmail.com",
//     sessions: [
//       {
//         title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
//         date: "9th Nov",
//         role: "Panelist",
//         description: "Dr. Lalitha AV (Moderator)\nCo Panelists \nDr. Suresh Kumar Panugati \nDr. Amit Vij \nDr. Atsushi Kawaguchi"
//       }
//     ]
//   },
//   "jbhaasha@gmail.com": {
//     facultyName: "DR JILANI BASHA",
//     email: "jbhaasha@gmail.com",
//     sessions: [
//       {
//         title: "POCUS (Basic)",
//         date: "6th Nov",
//         role: "Local coordinator",
//         description: "---"
//       }
//     ]
//   },
//   "nrao_aslp@yahoo.com": {
//     facultyName: "Dr Sridevi N.",
//     email: "nrao_aslp@yahoo.com",
//     sessions: [
//       {
//         title: "Non-Invasive Respiratory Support",
//         date: "6th Nov",
//         role: "Local coordinator",
//         description: "---"
//       }
//     ]
//   },
//   "mohangulla35@gmail.com": {
//     facultyName: "Dr Krishna Mohan Gulla",
//     email: "mohangulla35@gmail.com",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "National coordinator",
//         description: "---"
//       }
//     ]
//   },
//   "mjshree@hotmail.com": {
//     facultyName: "Dr. Jayashree Muralidharan",
//     email: "mjshree@hotmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "National coordinator",
//         description: "---"
//       }
//     ]
//   },
//   "kalyancriticare@gmail.com": {
//     facultyName: "Dr S kalyan Kunchapudi",
//     email: "kalyancriticare@gmail.com",
//     sessions: [
//       {
//         title: "Advanced Ventilation",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "jakkasrinu@yahoo.com": {
//     facultyName: "Srinivas Jakka",
//     email: "jakkasrinu@yahoo.com",
//     sessions: [
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "avinashreddy805@gmail.com": {
//     facultyName: "Dr Avinash Reddy",
//     email: "avinashreddy805@gmail.com",
//     sessions: [
//       {
//         title: "CRRT and SLED",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "lsumanpgi@gmail.com": {
//     facultyName: "DR. SUMAN L",
//     email: "lsumanpgi@gmail.com",
//     sessions: [
//       {
//         title: "CRRT and SLED",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "prmuthiah@gmail.com": {
//     facultyName: "Dr Muthiah Periyakaruppan",
//     email: "prmuthiah@gmail.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "National Coordinator",
//         description: "---"
//       }
//     ]
//   },
//   "kvsandeepreddy@gmail.com": {
//     facultyName: "Dr Venkat Sandeep Reddy",
//     email: "kvsandeepreddy@gmail.com",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "drsuchitrajoty@gmail.com": {
//     facultyName: "Dr Suchithra D (Hyd)",
//     email: "drsuchitrajoty@gmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "drsskrishna@yahoo.co.in": {
//     facultyName: "Dr Srikrishna",
//     email: "drsskrishna@yahoo.co.in",
//     sessions: [
//       {
//         title: "Transport",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "kanumala.udaykumar@gmail.com": {
//     facultyName: "DR UDAY",
//     email: "kanumala.udaykumar@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "drsujeeth.27@gmail.com": {
//     facultyName: "Dr Modi Sujeeth Kumar",
//     email: "drsujeeth.27@gmail.com",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Local Cordinator",
//         description: "---"
//       }
//     ]
//   },
//   "raghupaaa@gmail.com": {
//     facultyName: "Dr Raghupathy R",
//     email: "raghupaaa@gmail.com",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "prp2610@gmail.com": {
//     facultyName: "Dr Raghu Praneeth",
//     email: "prp2610@gmail.com",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "sneharaj_t@yahoo.co.in": {
//     facultyName: "Dr Sneha T",
//     email: "sneharaj_t@yahoo.co.in",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "nnbrishti@gmail.com": {
//     facultyName: "Dr Nandhini Sinha Roy",
//     email: "nnbrishti@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "manivachagan2001@yahoo.co.in;": {
//     facultyName: "Dr Manivachagan",
//     email: "manivachagan2001@yahoo.co.in;",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "raman.sharma1826@gmail.com": {
//     facultyName: "Dr Raman Sharma",
//     email: "raman.sharma1826@gmail.com",
//     sessions: [
//       {
//         title: "Transport",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drfebnarahiman@gmail.com": {
//     facultyName: "Dr Febna Rehman",
//     email: "drfebnarahiman@gmail.com",
//     sessions: [
//       {
//         title: "Transport",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dr.shashwatm@gmail.com": {
//     facultyName: "Dr Shashwath",
//     email: "dr.shashwatm@gmail.com",
//     sessions: [
//       {
//         title: "Transport",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "ravimooli59@gmail.com": {
//     facultyName: "Dr Ravi Moole",
//     email: "ravimooli59@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "Vasu.winny@gmail.com": {
//     facultyName: "Dr Vasudha",
//     email: "Vasu.winny@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dkrishnac7@gmail.com": {
//     facultyName: "Dr Krishna Chaitanya",
//     email: "dkrishnac7@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drnarayananp@gmail.com": {
//     facultyName: "Dr Narayanan P",
//     email: "drnarayananp@gmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "sudhach83@rediffmail.com": {
//     facultyName: "Dr Sudha Chandelia",
//     email: "sudhach83@rediffmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "rajakumarps@gmail.com": {
//     facultyName: "Dr Rajakumar",
//     email: "rajakumarps@gmail.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "joshigurudutt@yahoo.com": {
//     facultyName: "Dr Gurudutt",
//     email: "joshigurudutt@yahoo.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drsbkn@gmail.com": {
//     facultyName: "Dr Bharath Kumar Chennai",
//     email: "drsbkn@gmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "gudurukumar00@gmail.com": {
//     facultyName: "Dr Vijayakumar",
//     email: "gudurukumar00@gmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       },
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "19.vira@gmail.com": {
//     facultyName: "Dr Raghavan (NICU)",
//     email: "19.vira@gmail.com",
//     sessions: [
//       {
//         title: "CLINICAL RESEARCH",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "sureshkumarpnd@gmail.com": {
//     facultyName: "Dr Suresh Panda",
//     email: "sureshkumarpnd@gmail.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "venkatreddymadireddy@gmail.com": {
//     facultyName: "DR Venkat Ramana reddy",
//     email: "venkatreddymadireddy@gmail.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "jamuna.nursing@aiimskalyani.edu.in": {
//     facultyName: "Ms. Jamuna (AIIMS Kalyani)",
//     email: "jamuna.nursing@aiimskalyani.edu.in",
//     sessions: [
//       {
//         title: "Transport",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "mbbssampath@gmail.com": {
//     facultyName: "Dr. Muni Sampath",
//     email: "mbbssampath@gmail.com",
//     sessions: [
//       {
//         title: "POCUS \n(Basic)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drfaisalnahdi@gmail.com": {
//     facultyName: "Dr. Faisal",
//     email: "drfaisalnahdi@gmail.com",
//     sessions: [
//       {
//         title: "POCUS \n(Basic)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "mathew.reena@gmail.com;": {
//     facultyName: "Dr. Reena Mathew",
//     email: "mathew.reena@gmail.com;",
//     sessions: [
//       {
//         title: "POCUS \n(Basic)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "vikram.hirekerur@yahoo.com": {
//     facultyName: "Dr. Vikram Hirekerpur",
//     email: "vikram.hirekerur@yahoo.com",
//     sessions: [
//       {
//         title: "POCUS (Advanced)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "ramunivinay@gmail.com": {
//     facultyName: "Dr. Viany Ramuni",
//     email: "ramunivinay@gmail.com",
//     sessions: [
//       {
//         title: "POCUS (Advanced)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "rajasekhar.gogireddy@gmail.com": {
//     facultyName: "Dr. Rajsekhar Reddy",
//     email: "rajasekhar.gogireddy@gmail.com",
//     sessions: [
//       {
//         title: "POCUS (Advanced)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "abhik118815@gmail.com": {
//     facultyName: "Dr. Abhinav KV",
//     email: "abhik118815@gmail.com",
//     sessions: [
//       {
//         title: "POCUS (Advanced)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "arvindkumarm.paed@gmail.com": {
//     facultyName: "Dr. Aravind Kumar M",
//     email: "arvindkumarm.paed@gmail.com",
//     sessions: [
//       {
//         title: "POCUS (Advanced)",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drnaveen23@outlook.com": {
//     facultyName: "Dr. Naveen Reddy",
//     email: "drnaveen23@outlook.com",
//     sessions: [
//       {
//         title: "PICU Liberation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "satyajeetsahu2013@gmail.com": {
//     facultyName: "Dr. Satyajit Sahu",
//     email: "satyajeetsahu2013@gmail.com",
//     sessions: [
//       {
//         title: "PICU Liberation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dr.muthu87@gmail.com": {
//     facultyName: "Dr. Muthu Chidambaram (is Dr Chidambaram are also same?)",
//     email: "dr.muthu87@gmail.com",
//     sessions: [
//       {
//         title: "Non-Invasive Respiratory Support",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "mary.julina@cmcvellore.ac.in": {
//     facultyName: "Mary Julina (CMC)",
//     email: "mary.julina@cmcvellore.ac.in",
//     sessions: [
//       {
//         title: "Non-Invasive Respiratory Support",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "shivanipgimer1988@gmail.com": {
//     facultyName: "Ms Shivani (PGI)",
//     email: "shivanipgimer1988@gmail.com",
//     sessions: [
//       {
//         title: "Advanced Ventilation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "brevanth99@gmail.com": {
//     facultyName: "Dr. Revanth Baineni",
//     email: "brevanth99@gmail.com",
//     sessions: [
//       {
//         title: "Advanced Ventilation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "yashu198@yahoo.co.in": {
//     facultyName: "Dr. Yeshwanth Reddy",
//     email: "yashu198@yahoo.co.in",
//     sessions: [
//       {
//         title: "Advanced Ventilation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drsatarc@gmail.com": {
//     facultyName: "Dr. Satyabrata Roy Chaudhry",
//     email: "drsatarc@gmail.com",
//     sessions: [
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "sindupavithra92@gmail.com": {
//     facultyName: "Ms. Sindhu Pavitra (Mehta)",
//     email: "sindupavithra92@gmail.com",
//     sessions: [
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dr.nag007gmc@gmail.com": {
//     facultyName: "Dr. Nagarjuna",
//     email: "dr.nag007gmc@gmail.com",
//     sessions: [
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "mounishb63@gmail.com": {
//     facultyName: "Dr. Mohneesh",
//     email: "mounishb63@gmail.com",
//     sessions: [
//       {
//         title: "Bronchoscopy",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "ale285samagna@gmail.com": {
//     facultyName: "Dr. Alekhya",
//     email: "ale285samagna@gmail.com",
//     sessions: [
//       {
//         title: "CRRT and SLED",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "satarupamukherjee2003@gmail.com": {
//     facultyName: "Dr. Satarupa Mukherjee",
//     email: "satarupamukherjee2003@gmail.com",
//     sessions: [
//       {
//         title: "Simulation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "nursemanagermh@rainbowhospitals.in": {
//     facultyName: "Ms. Deepika (Rainbow)",
//     email: "nursemanagermh@rainbowhospitals.in",
//     sessions: [
//       {
//         title: "Simulation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "rgeetha48@yahoo.com": {
//     facultyName: "Dr. Geethanjali",
//     email: "rgeetha48@yahoo.com",
//     sessions: [
//       {
//         title: "Simulation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "vjamalpuri@gmail.com": {
//     facultyName: "Dr. Vijayanand",
//     email: "vjamalpuri@gmail.com",
//     sessions: [
//       {
//         title: "Simulation",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "riyanshetty@gmail.com": {
//     facultyName: "Dr. Riyan Shetty",
//     email: "riyanshetty@gmail.com",
//     sessions: [
//       {
//         title: "ECMO",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "nandhinianand5@gmail.com": {
//     facultyName: "Ms. Nandhini (NH)",
//     email: "nandhinianand5@gmail.com",
//     sessions: [
//       {
//         title: "ECMO",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "phani.bhargavi24@gmail.com": {
//     facultyName: "Dr. Bharghavi ( Ped Cardio)",
//     email: "phani.bhargavi24@gmail.com",
//     sessions: [
//       {
//         title: "ECMO",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dutta_monideepa@yahoo.co.in": {
//     facultyName: "Dr. Moindeep Dutta",
//     email: "dutta_monideepa@yahoo.co.in",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "shwethamn0909@gmail.com": {
//     facultyName: "Dr. Shwetha Nathani",
//     email: "shwethamn0909@gmail.com",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "dr.sathyanarayana.16@gmail.com": {
//     facultyName: "Dr. Sathyanarayana",
//     email: "dr.sathyanarayana.16@gmail.com",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "immanuel.navin@gmail.com": {
//     facultyName: "Immanuel Navin Kumar",
//     email: "immanuel.navin@gmail.com",
//     sessions: [
//       {
//         title: "Cardiac Critical Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "bsunkoj@hotmail.com": {
//     facultyName: "Dr. Sunkoj Bhaskar",
//     email: "bsunkoj@hotmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "Sreedeepks@gmail.com": {
//     facultyName: "Dr Sreedeep KS",
//     email: "Sreedeepks@gmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "drpavan4u@gmail.com": {
//     facultyName: "Dr Pavan",
//     email: "drpavan4u@gmail.com",
//     sessions: [
//       {
//         title: "CRRT and SLED",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "shilpa.t22@gmail.com": {
//     facultyName: "Dr Shilpa",
//     email: "shilpa.t22@gmail.com",
//     sessions: [
//       {
//         title: "Acute Critical Care for Practicing Paediatricians",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "kiransmiles4u@gmail.com": {
//     facultyName: "Dr Kiran Kartheek",
//     email: "kiransmiles4u@gmail.com",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "jkeziadavid@gmail.com": {
//     facultyName: "Dr Kezia",
//     email: "jkeziadavid@gmail.com",
//     sessions: [
//       {
//         title: "BPICC",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "snehalgdesai@gmail.com": {
//     facultyName: "Dr Snehal Desai",
//     email: "snehalgdesai@gmail.com",
//     sessions: [
//       {
//         title: "Nursing Respiratory Care",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "shamnayaz41@gmail.com": {
//     facultyName: "Ms Shamshaad",
//     email: "shamnayaz41@gmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "jenniferjeintha@gmail.com": {
//     facultyName: "Ms Jennifer",
//     email: "jenniferjeintha@gmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "bdharani700@gmail.com": {
//     facultyName: "Ms Dharani",
//     email: "bdharani700@gmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   },
//   "reddylakshmivenkatesh86@gmail.com": {
//     facultyName: "Ms Lakshmi Reddy",
//     email: "reddylakshmivenkatesh86@gmail.com",
//     sessions: [
//       {
//         title: "Nursing WS 2",
//         date: "6th Nov",
//         role: "Workshop Faculty",
//         description: "---"
//       }
//     ]
//   }
// };
//   // "praj@abhinavagroup.com": {
//   //   facultyName: "Prajwal P",
//   //   email: "praj@abhinavagroup.com",
//   //   sessions: [
//   //     {
//   //       title: "Talk on test data of scientific commitments",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "MCC",
//   //       date: "8/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "dr.amitvij2@gmail.com": {
//   //   facultyName: "Amit Vij",
//   //   email: "dr.amitvij2@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "bananip@hotmail.com": {
//   //   facultyName: "Banani Poddar",
//   //   email: "bananip@hotmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database (agenda - National pediatric critical database myths and reality)",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Interpreting Critical Labs in Suspected Metabolic Disease",
//   //       date: "8/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "deepankarbansal@outlook.com": {
//   //   facultyName: "Deepankar Bansal",
//   //   email: "deepankarbansal@outlook.com",
//   //   sessions: [
//   //     {
//   //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "PICU Liberation",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "jollymyla@gmail.com": {
//   //   facultyName: "Jolly Chandran",
//   //   email: "jollymyla@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Innovators of Tomorrow: Pediatric Critical Care DM/DrNB Thesis Awards",
//   //       date: "7/11",
//   //       role: "Chairperson\n\nCo-Chairperson: Dr Rachana",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
//   //       date: "9/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "BPICC",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "ksachane@yahoo.com": {
//   //   facultyName: "Kapil Sachane",
//   //   email: "ksachane@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "Pediatric Mechanical Circulatory Assistance from Innovation to Impact-Tiny Hearts, Big Support.",
//   //       date: "8/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "ECMO",
//   //       date: "6/11",
//   //       role: "Local Cordinator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "manjinderk75@gmail.com": {
//   //   facultyName: "Ms Manjinder Kaur",
//   //   email: "manjinderk75@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Plenary - PediCritiCon Keynotes",
//   //       date: "7/11",
//   //       role: "Plenary",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "CRRT and SLED",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "mehakbansal@yahoo.com": {
//   //   facultyName: "Mehak Bansal",
//   //   email: "mehakbansal@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "PediCritiCon Imaging Honors: Clinico-Radiology Case Awards",
//   //       date: "7/11",
//   //       role: "Chairperson",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics.",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "POCUS (Basic)",
//   //       date: "6/11",
//   //       role: "National Coordinator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "neerajverma1957@yahoo.com": {
//   //   facultyName: "Neeraj Verma",
//   //   email: "neerajverma1957@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "Burnout in PICU: Caring for the Caring Team",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "dr.prashantmitharwal@gmail.com": {
//   //   facultyName: "Prashant Mitharwal",
//   //   email: "dr.prashantmitharwal@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Keeping the Calm: Practical Challenges in Sedating the ECMO Child",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "poonipa@yahoo.com": {
//   //   facultyName: "Puneet Pooni",
//   //   email: "poonipa@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "Between Guidelines and Ground Reality: Talking to Families in Indian PICUs",
//   //       date: "8/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "krramesh_iway@yahoo.co.in": {
//   //   facultyName: "Ramesh Kumar",
//   //   email: "krramesh_iway@yahoo.co.in",
//   //   sessions: [
//   //     {
//   //       title: "cEEG: Essential Surveillance or Expensive Overkill?",
//   //       date: "8/11",
//   //       role: "Debater - FOR OR AGAINST",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Advanced Ventilation",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drpandian81@gmail.com": {
//   //   facultyName: "Sarvanan Pandian",
//   //   email: "drpandian81@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Post-Transplant Panic: ICU Nightmares After Pediatric Liver Transplant",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "satheeshponnar@gmail.com": {
//   //   facultyName: "Satheesh Ponnarneni",
//   //   email: "satheeshponnar@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Management of Complications related to blood based dialysis in PICU",
//   //       date: "7/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "CRRT and SLED",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "kandathsathish@gmail.com": {
//   //   facultyName: "K.Sathish Kumar",
//   //   email: "kandathsathish@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Beyond Survival: Navigating Long-Stay Challenges in the PICU",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "narayanankarthik86@gmail.com": {
//   //   facultyName: "Karthik Narayanan",
//   //   email: "narayanankarthik86@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Quiz",
//   //       date: "7/11",
//   //       role: "Quiz Master",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "POCUS (Advanced)",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "bpkaruns@gmail.com": {
//   //   facultyName: "Karunakar BP",
//   //   email: "bpkaruns@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Interpreting Critical Labs in Suspected Metabolic Diseases",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "reshma1987@gmail.com": {
//   //   facultyName: "Reshma A",
//   //   email: "reshma1987@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "HSCT: Navigating HSCT Challenges",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "PCCN workshop",
//   //       date: "6 NOV",
//   //       role: "Workshop",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "saumenmeur@yahoo.co.uk": {
//   //   facultyName: "Saumen Meur",
//   //   email: "saumenmeur@yahoo.co.uk",
//   //   sessions: [
//   //     {
//   //       title: "Management of Complications related to blood based dialysis in PICU",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "POCUS (Basic)",
//   //       date: "6/11",
//   //       role: "Worskshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "ssenthilsmc@yahoo.co.in": {
//   //   facultyName: "Senthil Kumar",
//   //   email: "ssenthilsmc@yahoo.co.in",
//   //   sessions: [
//   //     {
//   //       title: "Top 5 ICU Red Flags You Should Never Miss",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drshalugupta@yahoo.co.in": {
//   //   facultyName: "Shalu Gupta",
//   //   email: "drshalugupta@yahoo.co.in",
//   //   sessions: [
//   //     {
//   //       title: "Interpreting Critical Labs in Suspected Metabolic Disease",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
//   //       date: "9/11",
//   //       role: "Panellist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "BPICC",
//   //       date: "6/11",
//   //       role: "Worskshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drshiv2014@gmail.com": {
//   //   facultyName: "Shivkumar",
//   //   email: "drshiv2014@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Stamp of Quality or Just a Stamp? Impact of PICU Accreditation",
//   //       date: "9/11",
//   //       role: "Debater - Just a Stamp",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "POCUS (Basic)",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "shrishu@yahoo.com": {
//   //   facultyName: "Shrishu Kamath",
//   //   email: "shrishu@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Difficult Airway: Plan-B and Beyond",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "shubhadeepnrsdoc@gmail.com": {
//   //   facultyName: "Shubhadeep Das",
//   //   email: "shubhadeepnrsdoc@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Infections in the Cardiac ICU: When Bugs Break Hearts",
//   //       date: "7/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Cardiac Critical Care",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "siva.anjin@gmail.com": {
//   //   facultyName: "Siva Vyasam",
//   //   email: "siva.anjin@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Super-Refractory Status Epilepticus: How Far Should We Go?",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Simulation",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drsonal287@gmail.com": {
//   //   facultyName: "Sonal Gajbhiya",
//   //   email: "drsonal287@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Liver Transplant: Mastering Post-Op Complications",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "POCUS (Advanced)",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drsudani@gmail.com": {
//   //   facultyName: "Soonu Udani",
//   //   email: "drsudani@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Hemophagocytic Lymphohistiocytosis (HLH) and Macrophage Activation Syndrome: ICU Diagnosis and Management",
//   //       date: "7/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "From Collapse to Comeback: Pediatric Cardiac Arrest through the Lens of Multidisciplinary Care",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "sudeepkecy2011@gmail.com": {
//   //   facultyName: "Sudeep KC",
//   //   email: "sudeepkecy2011@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "PCCN workshop",
//   //       date: "6/11",
//   //       role: "Work shop",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "sumantsp22@gmail.com": {
//   //   facultyName: "Sumant Patil",
//   //   email: "sumantsp22@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Management of Complications related to blood based dialysis in PICU",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "sunit.singhi@gmail.com": {
//   //   facultyName: "Sunit Singhi",
//   //   email: "sunit.singhi@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Pediatric respiratory critical care research and promoting the development of a research network in India- identifying key gaps",
//   //       date: "7/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Building Leaders in Pediatric Critical Care: A Roadmap for India's Future",
//   //       date: "8/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drschandrasekar@yahoo.com": {
//   //   facultyName: "Supraja Chandrasekhar",
//   //   email: "drschandrasekar@yahoo.com",
//   //   sessions: [
//   //     {
//   //       title: "RRT Timing: Act Fast or Wait Smart?",
//   //       date: "8/11",
//   //       role: "Debater - FOR Wait Smart",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Simulation",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drskpanuganti@gmail.com": {
//   //   facultyName: "Dr Suresh Kumar Panugati",
//   //   email: "drskpanuganti@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
//   //       date: "9/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "sureshangurana@gmail.com": {
//   //   facultyName: "Suresh Kumar Angurana",
//   //   email: "sureshangurana@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "The Gut-Brain Axis in Pediatric ICU: A Microbiome Perspective",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drumaali22@gmail.com": {
//   //   facultyName: "Uma Ali",
//   //   email: "drumaali22@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Managing Sodium disurbances during CRRT",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
//   //       date: "9/11",
//   //       role: "Panellist",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "vasanthbabblu@gmail.com": {
//   //   facultyName: "Vasanth",
//   //   email: "vasanthbabblu@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Antibiotics on the Clock: Timing, Dosing, and De-escalation in the ICU.",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drvraghunathan@gmail.com": {
//   //   facultyName: "Veena Raghunathan",
//   //   email: "drvraghunathan@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Coming Off CRRT: Protocol Precision or Clinical Wisdom?",
//   //       date: "9/11",
//   //       role: "Debater - FOR PROTOCOL PRECISION",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Nursing Respiratory Care",
//   //       date: "6/11",
//   //       role: "Workshop Faculty",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "vijaiwilliams@gmail.com": {
//   //   facultyName: "Vijai Williams",
//   //   email: "vijaiwilliams@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Start Slow or Start Smart? Should Golden Hour DKA Management Be Aggressively Standardized?",
//   //       date: "8/11",
//   //       role: "Debater - FOR Start Smart",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "dr.vikas.78@gmail.com": {
//   //   facultyName: "Vikas Bansal",
//   //   email: "dr.vikas.78@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "The New Gold Standard in Ventilation? In Mechanical Power We Trust… or Not?",
//   //       date: "8/11",
//   //       role: "Debater - WE TRUST",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drvikastaneja@yahoo.co.in": {
//   //   facultyName: "Vikas Taneja",
//   //   email: "drvikastaneja@yahoo.co.in",
//   //   sessions: [
//   //     {
//   //       title: "The New Gold Standard in Ventilation? In Mechanical Power We Trust… or Not?",
//   //       date: "8/11",
//   //       role: "Debater - NOT TRUST",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "vinpreethadi@gmail.com": {
//   //   facultyName: "Vinay Joshi",
//   //   email: "vinpreethadi@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Silent Hypoxia: Recognizing & Managing Pulmonary Hypertensive Crisis",
//   //       date: "7/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "patkivinayak@gmail.com": {
//   //   facultyName: "Vinayak Patki",
//   //   email: "patkivinayak@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
//   //       date: "8/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "ratageri@rediffmail.com": {
//   //   facultyName: "Vinod Ratageri",
//   //   email: "ratageri@rediffmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Belly Under Siege: Clinical Clues and ICU Strategies for ACS",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "vbuche@gmail.com": {
//   //   facultyName: "Vishram Buche",
//   //   email: "vbuche@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "The Arterial Truth: Using Trends to Guide Real-Time Decisions",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drvsvprasad@gmail.com": {
//   //   facultyName: "VSV Prasad",
//   //   email: "drvsvprasad@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
//   //       date: "8/11",
//   //       role: "Panelist",
//   //       description: "---"
//   //     },
//   //     {
//   //       title: "Buying Smart: Equipping Your PICU for Function, Not Fashion",
//   //       date: "9/11",
//   //       role: "Moderator",
//   //       description: "---"
//   //     }
//   //   ]
//   // },
//   // "drgirishc@gmail.com": {
//   //   facultyName: "Girish H C",
//   //   email: "drgirishc@gmail.com",
//   //   sessions: [
//   //     {
//   //       title: "Accidental Drug Overdose or Wrong Drug in the PICU: First Response and Reporting",
//   //       date: "9/11",
//   //       role: "Speaker",
//   //       description: "---"
//   //     }
//   //   ]
//   // }
// };
// // Generate HTML for a specific faculty member
// function renderFacultyHTML(facultyEmail: string) {
//   const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];

//   if (!facultyData) {
//     console.error(`No data found for faculty: ${facultyEmail}`);
//     return "";
//   }

//   const loginUrl = `${baseUrl.replace(
//     /\/+$/,
//     ""
//   )}/faculty-login?email=${encodeURIComponent(facultyData.email)}`;

//   const rows = facultyData.sessions
//     .map(
//       (s) => `
//       <tr style="border-bottom: 1px solid #eaeaea;">
//         <td style="padding:12px; border-right:1px solid #ddd;">${s.title}</td>
//         <td style="padding:12px; border-right:1px solid #ddd;">${s.date}</td>
//         <td style="padding:12px; border-right:1px solid #ddd;">${s.role}</td>
//         <td style="padding:12px;">${s.description}</td>
//       </tr>`
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8" />
// <meta name="viewport" content="width=device-width, initial-scale=1"/>
// <title>Session Invitation</title>
// </head>
// <body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
//   <!-- Header -->
//   <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
//       <!-- PediCritiCon Header Image -->
//       <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
//            alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
//            style="width: 100%; height: auto; display: block; max-width: 600px;" />
//   </div>

//   <div style="background:#fff; padding:30px; border:1px solid #ddd;">
//     <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">PediCritiCon 2025, Hyderabad</h1>
    
//     <p>Dear Dr. <strong>${facultyData.facultyName}</strong>,</p>
//     <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
//     <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
//     <p>Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:</p>
    
//     <!-- 4-column table with description -->
//     <table style="width:100%; border-collapse: collapse; margin:20px 0;">
//       <thead style="background:#efefef;">
//         <tr>
//           <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
//           <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Date</th>
//           <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Role</th>
//           <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Description</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${rows}
//       </tbody>
//     </table>

//     <!-- Conference Registration & Participation -->
//     <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
//       <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Acceptance & Details:</h4>
//       <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
//           <strong>Please confirm your acceptance by clicking Accept or Decline on the faculty dashboard</strong>
//       </p>
//     </div>

//     <!-- Access Faculty Dashboard Button -->
//     <p style="text-align:center; margin: 30px 0;">
//       <a href="${loginUrl}" target="_blank" style="
//         background:#764ba2;
//         color:#fff;
//         padding:15px 25px;
//         border-radius:25px;
//         text-decoration:none;
//         font-weight:bold;
//         font-size:16px;
//         box-shadow:0 4px 15px rgba(118,75,162,0.4);
//         ">
//         🔐 Access Faculty Dashboard
//       </a>
//     </p>

//     <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin: 25px 0;">
//         <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 14px;">🔹 Hospitality & Travel:</h4>
//         <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
//             <strong>Accommodation:</strong> We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
//         </p>
//         <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
//             <strong>Travel:</strong> You are requested to kindly arrange your own travel.
//         </p>
//         <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
//             <strong>Registration:</strong> You will receive a unique link at early bird rates upon acceptance of the invite.
//         </p>
//     </div>

//     <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 25px 0;">
//         <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
//             Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
//             If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> on the faculty dashboard at 
//             the earliest so we may make suitable adjustments.
//         </p>
//         <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
//             We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
//             a memorable success.
//         </p>
//     </div>

//     <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #764ba2; border-radius: 4px;">
//         <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
//             Warm regards,<br>
//             <span style="color: #764ba2;">Scientific Committee, PediCritiCon 2025</span>
//         </p>
//     </div>
    
//     <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
//       If you have questions, contact your event coordinator. This message was sent automatically.
//     </p>
//   </div>

//   <!-- Footer -->
//   <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
//       <!-- PediCritiCon Footer Image -->
//       <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
//            alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
//            style="width: 100%; height: auto; display: block; max-width: 600px;" />
//   </div>
// </body>
// </html>
// `;
// }

// // Generate plain text email for a specific faculty member
// function generateFacultyTextEmail(facultyEmail: string) {
//   const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];

//   if (!facultyData) {
//     return "";
//   }

//   const sessionsText = facultyData.sessions
//     .map((s, index) => `Date ${s.date}:
// Session: ${s.title}
// Role: ${s.role}
// Description: ${s.description}`)
//     .join("\n\n");

//   return `Subject: PediCritiCon 2025 - Faculty Invitation

// Dear Dr. ${facultyData.facultyName},

// Greetings from the Scientific Committee, PediCritiCon 2025!

// It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

// 📅 Dates: November 6–9, 2025
// 📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

// Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:

// Your Faculty Invitation – PediCritiCon 2025

// ${sessionsText}

// 👉 Kindly confirm your acceptance by clicking Yes or No 
// Login here: ${baseUrl.replace(
//     /\/+$/,
//     ""
//   )}/faculty-login?email=${encodeURIComponent(facultyData.email)}

// 🔹 Hospitality & Travel:
// Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
// Travel: You are requested to kindly arrange your own travel.
// Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

// Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

// We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

// Warm regards,
// Scientific Committee, PediCritiCon 2025
// `;
// }

// /**
//  * Send personalized emails to Shruti and Vidyashankar
//  */
// export async function sendBulkInviteEmail(
//   sessions?: any[],  // Ignored
//   facultyName?: string,  // Ignored  
//   email?: string  // Ignored
// ) {
//   const results = [];

//   // Send personalized email to each faculty member (only Shruti and Vidyashankar)
//   for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
//     try {
//       const html = renderFacultyHTML(facultyEmail);
//       const text = generateFacultyTextEmail(facultyEmail);

//       const result = await sendMail({
//         to: facultyData.email,
//         subject: `PediCritiCon 2025 - Faculty Invitation`,
//         text,
//         html,
//       });

//       results.push({
//         email: facultyData.email,
//         name: facultyData.facultyName,
//         success: result.ok,
//         message: result.message || "Email sent successfully"
//       });

//       console.log(`Email sent to ${facultyData.facultyName} (${facultyData.email}): ${result.ok ? 'Success' : 'Failed'}`);

//     } catch (error) {
//       console.error(`Failed to send email to ${facultyData.facultyName}:`, error);
//       results.push({
//         email: facultyData.email,
//         name: facultyData.facultyName,
//         success: false,
//         message: error instanceof Error ? error.message : "Unknown error"
//       });
//     }
//   }

//   // Return summary of all sends
//   const successCount = results.filter(r => r.success).length;
//   const failureCount = results.filter(r => !r.success).length;

//   console.log(`Email Summary: ${successCount} successful, ${failureCount} failed out of ${results.length} total`);

//   return {
//     ok: failureCount === 0,
//     message: `Sent ${successCount}/${results.length} emails successfully`,
//     results: results
//   };
// }

// /**
//  * Send personalized emails to Shruti and Vidyashankar
//  * Input parameters are ignored
//  */
// export async function sendInviteEmail(
//   session?: any,  // Ignored
//   facultyName?: string,  // Ignored
//   email?: string  // Ignored
// ) {
//   return sendBulkInviteEmail(); // Calls the bulk function that sends to both
// }

// /**
//  * Send update emails to Shruti and Vidyashankar
//  * Input parameters are ignored
//  */
// export async function sendUpdateEmail(
//   session?: any,  // Ignored
//   facultyName?: string,  // Ignored
//   roomName?: string  // Ignored
// ): Promise<{ ok: boolean; message?: string }> {
//   try {
//     const results = [];

//     // Send update email to each faculty member
//     for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
//       try {
//         const sessionsText = facultyData.sessions
//           .map(s => `Session: "${s.title}" - ${s.date} - ${s.role}
// Description: ${s.description}`)
//           .join('\n\n');

//         const text = `Hello ${facultyData.facultyName},

// Your session${facultyData.sessions.length > 1 ? 's have' : ' has'} been updated:

// ${sessionsText}

// Please confirm your availability again as the schedule has changed.

// Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

// Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

// We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

// Warm regards,
// Scientific Committee, PediCritiCon 2025

// Login here: ${baseUrl.replace(
//           /\/+$/,
//           ""
//         )}/faculty-login?email=${encodeURIComponent(facultyData.email)}
// `;

//         const result = await sendMail({
//           to: facultyData.email,
//           subject: `📅 Session Updated: PediCritiCon 2025`,
//           text,
//           html: renderFacultyHTML(facultyEmail), // Use their personalized HTML
//         });

//         results.push({
//           email: facultyData.email,
//           success: result.ok
//         });

//       } catch (error) {
//         console.error(`Failed to send update email to ${facultyData.facultyName}:`, error);
//         results.push({
//           email: facultyData.email,
//           success: false
//         });
//       }
//     }

//     const successCount = results.filter(r => r.success).length;
//     const failureCount = results.filter(r => !r.success).length;

//     return {
//       ok: failureCount === 0,
//       message: `Update emails: ${successCount}/${results.length} sent successfully`
//     };

//   } catch (error) {
//     console.error("Failed to send update emails:", error);
//     return {
//       ok: false,
//       message: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }
