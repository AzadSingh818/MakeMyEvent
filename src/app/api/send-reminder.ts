import { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '@/lib/mailer';

interface ReminderRequest {
  facultyId: string;
  facultyEmail: string;
  facultyName: string;
  sessionTitle: string;
  eventName: string;
  invitationDate: string;
  daysPending?: number;
  eventId: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      facultyId, 
      facultyEmail, 
      facultyName, 
      sessionTitle, 
      eventName, 
      invitationDate,
      daysPending,
      eventId 
    }: ReminderRequest = req.body;

    console.log('Sending reminder email to:', facultyEmail);

    // Validate required fields
    if (!facultyEmail || !facultyName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: facultyEmail, facultyName' 
      });
    }

    // Faculty dashboard link
    const dashboardLink = `${baseUrl.replace(/\/+$/, '')}/faculty-login?email=${encodeURIComponent(facultyEmail)}`;

    // Simple HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PediCritiCon 2025 - Reminder</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .content { 
              background: #fff; 
              padding: 30px; 
              border: 1px solid #ddd;
              border-radius: 10px;
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
            }
          </style>
        </head>
        <body>
          <div class="content">
            <h2 style="color:#764ba2; text-align:center;">🔔 Reminder</h2>
            
            <p>Greetings from <strong>PediCritiCon 2025</strong>!</p>
            
            <p>This is a reminder mail. Please give your response.</p>
            
            <p>Kindly access the faculty dashboard and give the response.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardLink}" class="cta-button">
                Access Faculty Dashboard
              </a>
            </div>

            <p>Thank you for your time.</p>

            <p>Best regards,<br>
            <strong>PediCritiCon 2025 Team</strong></p>
          </div>
        </body>
      </html>
    `;

    // Simple text version
    const textContent = `
Greetings from PediCritiCon 2025!

This is a reminder mail. Please give your response.

Kindly access the faculty dashboard and give the response.

Faculty Dashboard Link: ${dashboardLink}

Thank you for your time.

Best regards,
PediCritiCon 2025 Team
    `;

    console.log('Attempting to send email...');

    const result = await sendMail({
      to: facultyEmail,
      subject: `🔔 Reminder - PediCritiCon 2025`,
      text: textContent.trim(),
      html: htmlContent,
    });

    console.log('Email send result:', result);

    if (result.ok) {
      console.log(`✅ Reminder email sent successfully to ${facultyEmail}`);
      res.status(200).json({ 
        success: true, 
        message: 'Reminder email sent successfully',
        recipient: facultyEmail 
      });
    } else {
      throw new Error(result.message || 'Failed to send email');
    }

  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send reminder email',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
