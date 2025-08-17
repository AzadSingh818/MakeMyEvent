import { sendMail } from "@/lib/mailer";
import type { InviteStatus } from "../_store";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export type Session = {
  id: string;
  title: string;
  facultyId: string;
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: InviteStatus;
};

function formatDate(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}
function safe(val?: string) {
  return val || "-";
}

function renderHTML(sessions: Session[], facultyName: string) {
  const loginUrl = `${baseUrl.replace(/\/+$/, "")}/faculty-login`;
  const rows = sessions
    .map(
      (s) => `
      <tr>
        <td>${safe(s.title)}</td>
        <td>${formatDate(s.startTime)}</td>
        <td>${formatDate(s.endTime)}</td>
        <td>${safe(s.place)} - ${safe(s.roomName || s.roomId)}</td>
        <td>${safe(s.description)}</td>
      </tr>`
    )
    .join("");

  return `
<html>
  <body>
    <h2>🎓 Speaking Invitations</h2>
    <p>Hello ${safe(facultyName)},</p>
    <p>You have been invited to speak at the following ${
      sessions.length > 1 ? "sessions" : "session"
    }:</p>
    <table border="1" cellpadding="4" cellspacing="0">${rows}</table>
    <p>
      <a href="${loginUrl}">🔐 Login to Faculty Portal</a>
    </p>
  </body>
</html>`;
}

/**
 * Send multiple session invitations in one email
 */
export async function sendBulkInviteEmail(
  sessions: Session[],
  facultyName: string,
  email: string
) {
  if (!sessions?.length || !facultyName || !email) {
    return { ok: false, message: "Invalid arguments" };
  }

  const html = renderHTML(sessions, facultyName);
  const text = `Hello ${facultyName},

You have been invited to speak at ${sessions.length} session(s):

${sessions
  .map(
    (s) => `- ${safe(s.title)}
  Start: ${formatDate(s.startTime)}
  End: ${formatDate(s.endTime)}
  Location: ${safe(s.place)}`
  )
  .join("\n\n")}

Login here: ${baseUrl.replace(/\/+$/, "")}/faculty-login
`;

  return sendMail({
    to: email,
    subject: `🎓 ${sessions.length} Session Invitation${
      sessions.length > 1 ? "s" : ""
    } - Please Login`,
    text,
    html,
  });
}

/**
 * Wrapper for sending a single session invite
 */
export async function sendInviteEmail(
  session: Session,
  facultyName: string,
  email: string
) {
  return sendBulkInviteEmail([session], facultyName, email);
}
