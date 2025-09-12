import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app";

// Unified data types
export interface EmailTemplateData {
  facultyName: string;
  email: string;
  eventName: string;
  eventDates: string;
  eventLocation: string;
  eventVenue: string;
  sessions?: Session[];
  emailType: 'invitation' | 'session_update' | 'bulk_sessions';
  customMessage?: string;
  isUpdate?: boolean;
}

export interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  eventId?: string;
  travel?: string;
  accommodation?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
  eventId: string;
  eventName: string;
}

// Faculty data fetching functions
async function fetchFacultyFromDatabase(): Promise<Faculty[]> {
  try {
    const response = await fetch(`${baseUrl}/api/faculties`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    
    if (response.ok) {
      const faculties = await response.json();
      console.log(`✅ Loaded ${faculties.length} faculties from database`);
      return faculties;
    }
    
    console.warn("Failed to fetch faculties from database");
    return [];
  } catch (error) {
    console.error("Error fetching faculties from database:", error);
    return [];
  }
}

function getFacultyFromLocalStorage(): Faculty[] {
  try {
    if (typeof window === "undefined") return [];
    
    const savedFacultyData = localStorage.getItem("eventFacultyData");
    if (!savedFacultyData) return [];
    
    const eventFacultyData = JSON.parse(savedFacultyData);
    const localFaculties = eventFacultyData.flatMap(
      (eventData: any) =>
        eventData.facultyList?.map((faculty: any) => ({
          ...faculty,
          eventId: eventData.eventId,
          eventName: eventData.eventName,
        })) || []
    );
    
    console.log(`✅ Loaded ${localFaculties.length} faculties from localStorage`);
    return localFaculties;
  } catch (error) {
    console.error("Error loading faculties from localStorage:", error);
    return [];
  }
}

async function getAllFacultyData(): Promise<Faculty[]> {
  console.log("🔄 Loading all faculty data...");
  
  const [dbFaculties, localFaculties] = await Promise.all([
    fetchFacultyFromDatabase(),
    getFacultyFromLocalStorage()
  ]);
  
  // Merge faculties, avoiding duplicates based on email
  const allFaculties = [...dbFaculties];
  
  localFaculties.forEach((localFaculty) => {
    if (!allFaculties.find((f) => f.email === localFaculty.email)) {
      allFaculties.push(localFaculty);
    }
  });
  
  console.log(`✅ Total faculties loaded: ${allFaculties.length}`);
  return allFaculties;
}

// Enhanced function to resolve faculty name
async function resolveFacultyName(session: Session): Promise<string> {
  // First check if facultyName is already available in the session
  if (session.facultyName && session.facultyName.trim() !== "") {
    console.log(`✅ Faculty name found in session: ${session.facultyName}`);
    return session.facultyName;
  }
  
  // If not, try to resolve using facultyId
  if (session.facultyId) {
    console.log(`🔍 Resolving faculty name for ID: ${session.facultyId}`);
    
    const allFaculties = await getAllFacultyData();
    const faculty = allFaculties.find(f => f.id === session.facultyId);
    
    if (faculty?.name) {
      console.log(`✅ Faculty name resolved: ${faculty.name}`);
      return faculty.name;
    }
    
    console.warn(`⚠️ Faculty not found for ID: ${session.facultyId}`);
  }
  
  // Fallback: try to find by email
  if (session.email) {
    console.log(`🔍 Trying to resolve faculty by email: ${session.email}`);
    
    const allFaculties = await getAllFacultyData();
    const faculty = allFaculties.find(f => f.email === session.email);
    
    if (faculty?.name) {
      console.log(`✅ Faculty name resolved by email: ${faculty.name}`);
      return faculty.name;
    }
  }
  
  // Final fallback - extract name from email or use generic
  const emailName = session.email?.split('@')[0]?.replace(/[._]/g, ' ');
  const fallbackName = emailName || "Valued Faculty";
  
  console.warn(`⚠️ Using fallback name: ${fallbackName}`);
  return fallbackName;
}

// Utility functions
function formatDate(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function safe(val?: string) {
  return val || "-";
}

/**
 * UNIFIED EMAIL TEMPLATE RENDERER
 * Single template that handles all email scenarios
 */
function renderUnifiedEmailTemplate(data: EmailTemplateData): string {
  const loginUrl = `${baseUrl}/faculty/login?email=${encodeURIComponent(data.email)}`;
  
  // Determine email title based on type
  const getEmailTitle = () => {
    switch (data.emailType) {
      case 'session_update':
        return 'Session Updated';
      case 'bulk_sessions':
        return 'Session Invitations';
      default:
        return 'Faculty Invitation';
    }
  };

  // Generate sessions table if sessions exist
  const renderSessionsTable = () => {
    if (!data.sessions || data.sessions.length === 0) return '';

    const headers = data.emailType === 'session_update' 
      ? ['Detail', 'Information']
      : ['Session Title', 'Start Time', 'End Time', 'Location', 'Description'];

    if (data.emailType === 'session_update' && data.sessions.length === 1) {
      const session = data.sessions[0];
      return `
        <table style="width:100%; border-collapse: collapse; border: 2px solid #ff6b35; margin:20px 0;">
          <tr style="background:#fff8f0;">
            <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title:</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;">${safe(session?.title)}</td>
          </tr>
          <tr style="background:#fff;">
            <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Start Time:</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;">${formatDate(session?.startTime)}</td>
          </tr>
          <tr style="background:#fff8f0;">
            <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">End Time:</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;">${formatDate(session?.endTime)}</td>
          </tr>
          <tr style="background:#fff;">
            <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Location:</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;">${safe(session?.place)} - ${safe(session?.roomName || session?.roomId)}</td>
          </tr>
          <tr style="background:#fff8f0;">
            <td style="padding:12px; font-weight:bold; border-right:1px solid #ddd;">Description:</td>
            <td style="padding:12px;">${safe(session?.description)}</td>
          </tr>
        </table>`;
    } else {
      const rows = data.sessions.map(s => `
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding:12px; border-right:1px solid #ddd;">${safe(s.title)}</td>
          <td style="padding:12px; border-right:1px solid #ddd;">${formatDate(s.startTime)}</td>
          <td style="padding:12px; border-right:1px solid #ddd;">${formatDate(s.endTime)}</td>
          <td style="padding:12px; border-right:1px solid #ddd;">${safe(s.place)} - ${safe(s.roomName || s.roomId)}</td>
          <td style="padding:12px;">${safe(s.description)}</td>
        </tr>`
      ).join("");

      return `
        <table style="width:100%; border-collapse: collapse; border: 2px solid #3182ce; margin:20px 0;">
          <thead style="background:#3182ce; color: white;">
            <tr>
              ${headers.map(header => `<th style="text-align:center; padding:12px; border-right:1px solid white; font-weight: bold;">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;
    }
  };

  // Generate appropriate greeting message
  const getGreetingMessage = () => {
    if (data.emailType === 'session_update') {
      return `<p>Your session has been updated with new details:</p>`;
    } else {
      return `
        <p><strong>Greetings from the Scientific Committee, PediCritiCon 2025!</strong></p>
        <p>It gives us immense pleasure to invite you as a distinguished faculty member to <strong>PediCritiCon 2025</strong> – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
      `;
    }
  };

  // Generate CTA button
  const getCTAButton = () => {
    const buttonColor = data.emailType === 'session_update' ? '#ff6b35' : '#22c55e';
    const buttonText = data.emailType === 'session_update' 
      ? '🔐 Confirm Availability Now'
      : '🔐 Access Faculty Portal & Respond';

    return `
      <p style="text-align:center; margin: 30px 0;">
        ${data.emailType !== 'session_update' ? '<strong>👉 Kindly confirm your acceptance by accessing your Faculty Portal:</strong><br><br>' : ''}
        <a href="${loginUrl}" target="_blank" style="
          background:${buttonColor};
          color:#fff;
          padding:15px 30px;
          border-radius:25px;
          text-decoration:none;
          font-weight:bold;
          font-size:16px;
          box-shadow:0 4px 15px rgba(34, 197, 94, 0.3);
          display: inline-block;
          ">
          ${buttonText}
        </a>
      </p>`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${getEmailTitle()} - PediCritiCon 2025</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <!-- Header -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
      <!-- PediCritiCon Header Image -->
      <img src="${baseUrl}/images/pedicriticon-header.png" 
           alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>

  <div style="background:#fff; padding:30px; border:1px solid #ddd;">
    <h2 style="color:${data.emailType === 'session_update' ? '#ff6b35' : '#2d3748'}; text-align:center; margin-bottom:20px; font-size:18px;">
      ${data.emailType === 'session_update' ? '📅 Session Updated' : 'Subject: Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad'}
    </h2>
    
    <p><strong>Dear Dr. ${safe(data.facultyName)},</strong></p>
    
    ${getGreetingMessage()}
    
    ${data.emailType !== 'session_update' ? `
      <div style="background: #e8f4fd; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0; color: #2d3748;"><strong>📅 Dates:</strong> ${data.eventDates}</p>
        <p style="margin: 5px 0; color: #2d3748;"><strong>📍 Venue:</strong> ${data.eventLocation}</p>
      </div>
      
      <p><strong>Your proposed faculty role is outlined below:</strong></p>
      <h3 style="color: #3182ce; font-size: 16px; margin-bottom: 10px;">Your Faculty Invitation – PediCritiCon 2025</h3>
    ` : ''}

    ${data.emailType === 'session_update' ? `
      <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <p style="color: #dc2626; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
              <strong>⚠️ IMPORTANT: Please confirm your availability again as the schedule has changed.</strong>
          </p>
      </div>
    ` : ''}

    ${renderSessionsTable()}

    ${data.customMessage ? `
      <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <p style="color: #1e40af; font-size: 14px; line-height: 1.6;">${data.customMessage}</p>
      </div>
    ` : ''}

    ${getCTAButton()}

    ${data.emailType !== 'session_update' ? `
      <!-- Hospitality & Travel Section -->
      <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 14px;">🔹 Hospitality & Travel:</h4>
          <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
              <strong>Accommodation:</strong> We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
          </p>
          <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
              <strong>Travel:</strong> You are requested to kindly arrange your own travel.
          </p>
          <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
              <strong>Registration:</strong> Please complete your conference registration at the base rate.
          </p>
      </div>
    ` : ''}

    <!-- Conference Registration & Participation -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Registration & Participation:</h4>
        <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Registration:</strong> Please complete your conference registration at the base rate.
        </p>
        <p style="color: #4a5568; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> ${data.emailType === 'session_update' ? 'at the earliest' : 'on the faculty portal at the earliest'} so we may make suitable adjustments.
        </p>
        <p style="color: #4a5568; font-size: 14px; margin: 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>
    </div>

    <!-- Closing Message -->
    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid ${data.emailType === 'session_update' ? '#ff6b35' : '#3182ce'}; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: ${data.emailType === 'session_update' ? '#ff6b35' : '#3182ce'};">Scientific Committee, PediCritiCon 2025</span>
        </p>
    </div>

    <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
      If you have questions, contact your event coordinator. This message was sent automatically.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
      <!-- PediCritiCon Footer Image -->
      <img src="${baseUrl}/images/pedicriticon-footer.png" 
           alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>
</body>
</html>
`;
}

/**
 * UNIFIED EMAIL SENDER WITH FACULTY NAME RESOLUTION
 * Single function to send all types of emails
 */
export async function sendUnifiedEmail(data: EmailTemplateData) {
  if (!data.facultyName || !data.email) {
    return { ok: false, message: "Faculty name and email required" };
  }

  const html = renderUnifiedEmailTemplate(data);
  
  // Generate text version
  const textContent = generateTextVersion(data);
  
  // Generate subject based on email type
  const subject = getEmailSubject(data);

  console.log(`📧 Sending ${data.emailType} email to Dr. ${data.facultyName} (${data.email})`);

  return sendMail({
    to: data.email,
    subject,
    text: textContent,
    html,
  });
}

function generateTextVersion(data: EmailTemplateData): string {
  const sessionText = data.sessions?.map(s => `
Date: ${formatDate(s.startTime).split(',')[0]}
Session: ${safe(s.title)}
Role: Speaker`).join('\n\n') || '';

  return `Subject: ${getEmailSubject(data)}

Dear Dr. ${data.facultyName},

${data.emailType === 'session_update' 
  ? 'Your session has been updated with new details:'
  : `Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: ${data.eventDates}
📍 Venue: ${data.eventLocation}

Your proposed faculty role is outlined below:`}

Your Faculty Invitation – PediCritiCon 2025
${sessionText}

${data.emailType === 'session_update' 
  ? 'IMPORTANT: Please confirm your availability again as the schedule has changed.'
  : '👉 Kindly confirm your acceptance by accessing your Faculty Portal'}

Login here: ${baseUrl}/faculty/login?email=${encodeURIComponent(data.email)}

${data.emailType !== 'session_update' ? `🔹 Hospitality & Travel:
Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
Travel: You are requested to kindly arrange your own travel.` : ''}

Registration: Please complete your conference registration at the base rate.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025`;
}

function getEmailSubject(data: EmailTemplateData): string {
  switch (data.emailType) {
    case 'session_update':
      return `📅 Session Updated - PediCritiCon 2025`;
    case 'bulk_sessions':
      return `Session Invitations - PediCritiCon 2025, Hyderabad`;
    default:
      return `Invitation to Join as Faculty – PediCritiCon 2025, Hyderabad`;
  }
}

// UPDATED legacy wrapper functions with faculty name resolution
export async function sendBulkInviteEmail(
  sessions: Session[],
  facultyName?: string,
  email?: string
) {
  // If facultyName not provided, resolve it from the first session
  if (!facultyName && sessions.length > 0 && sessions[0]) {
    console.log("🔍 Faculty name not provided, resolving from session data...");
    facultyName = await resolveFacultyName(sessions[0]);
  }
  
  // Use email from first session if not provided
  const targetEmail = email || sessions[0]?.email;
  
  if (!facultyName || !targetEmail) {
    console.error("❌ Missing required data for bulk invite email");
    return { ok: false, message: "Faculty name and email are required" };
  }

  console.log(`📧 Sending bulk invite to Dr. ${facultyName} (${targetEmail})`);

  return sendUnifiedEmail({
    facultyName,
    email: targetEmail,
    eventName: 'PediCritiCon 2025',
    eventDates: 'November 6–9, 2025',
    eventLocation: 'Hyderabad International Convention Centre (HICC), Hyderabad, India',
    eventVenue: 'HICC Hyderabad',
    sessions,
    emailType: 'bulk_sessions',
  });
}

export async function sendInviteEmail(
  session: Session,
  facultyName?: string,
  email?: string
) {
  // Resolve faculty name if not provided
  const resolvedFacultyName = facultyName || await resolveFacultyName(session);
  const targetEmail = email || session.email;

  console.log(`📧 Sending single invite to Dr. ${resolvedFacultyName} (${targetEmail})`);

  return sendBulkInviteEmail([session], resolvedFacultyName, targetEmail);
}

export async function sendUpdateEmail(
  session: Session,
  facultyName?: string,
  roomName?: string
): Promise<{ ok: boolean; message?: string }> {
  if (!session || !session.email) {
    return { ok: false, message: "Invalid session or email for update email" };
  }

  // Resolve faculty name if not provided
  const resolvedFacultyName = facultyName || await resolveFacultyName(session);
  
  // Update session with room name if provided
  if (roomName) {
    session.roomName = roomName;
  }

  console.log(`📧 Sending update email to Dr. ${resolvedFacultyName} (${session.email})`);

  return sendUnifiedEmail({
    facultyName: resolvedFacultyName,
    email: session.email,
    eventName: 'PediCritiCon 2025',
    eventDates: 'November 6–9, 2025',
    eventLocation: 'Hyderabad International Convention Centre (HICC), Hyderabad, India',
    eventVenue: 'HICC Hyderabad',
    sessions: [session],
    emailType: 'session_update',
  });
}

// New utility function to send email with automatic faculty resolution
export async function sendSessionEmail(
  session: Session,
  emailType: 'invitation' | 'session_update' = 'invitation',
  customMessage?: string
) {
  const facultyName = await resolveFacultyName(session);
  
  return sendUnifiedEmail({
    facultyName,
    email: session.email,
    eventName: 'PediCritiCon 2025',
    eventDates: 'November 6–9, 2025',
    eventLocation: 'Hyderabad International Convention Centre (HICC), Hyderabad, India',
    eventVenue: 'HICC Hyderabad',
    sessions: [session],
    emailType,
    customMessage,
  });
}