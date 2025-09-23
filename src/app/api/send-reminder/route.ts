import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body: ReminderRequest = await request.json();
    
    const { 
      facultyId, 
      facultyEmail, 
      facultyName, 
      sessionTitle, 
      eventName, 
      invitationDate,
      daysPending,
      eventId 
    } = body;

    console.log('=== REMINDER EMAIL DEBUG ===');
    console.log('Request body:', body);
    console.log('Faculty Email:', facultyEmail);
    console.log('Faculty Name:', facultyName);

    // Validate required fields
    if (!facultyEmail || !facultyName) {
      console.error('❌ Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: facultyEmail, facultyName' 
      }, { status: 400 });
    }

    // Faculty dashboard link
    const dashboardLink = `${baseUrl.replace(/\/+$/, '')}/faculty-login?email=${encodeURIComponent(facultyEmail)}`;
    console.log('Dashboard Link:', dashboardLink);

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
            
            <p>This is a gentle reminder for you to respond with Accept/Reject to the sessions scheduled for you.</p>
            
            <p>Kindly access your faculty dashboard and respond to all the session invites.</p>

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
    `.trim();

    console.log('📧 Attempting to send email to:', facultyEmail);
    console.log('Email subject: 🔔 Reminder - PediCritiCon 2025');

    // Try sending the email with error handling
    let result;
    try {
      result = await sendMail({
        to: facultyEmail,
        subject: `🔔 Reminder - PediCritiCon 2025`,
        text: textContent,
        html: htmlContent,
      });

      console.log('📧 SendMail Result:', result);

    } catch (emailError) {
      console.error('❌ SendMail Error:', emailError);
      
      // Return specific error details
      return NextResponse.json({ 
        success: false, 
        error: 'Email sending failed',
        details: emailError instanceof Error ? emailError.message : String(emailError),
        debug: {
          to: facultyEmail,
          subject: '🔔 Reminder - PediCritiCon 2025',
          textLength: textContent.length,
          htmlLength: htmlContent.length
        }
      }, { status: 500 });
    }

    // Check result and respond accordingly
    if (result && result.ok) {
      console.log(`✅ Reminder email sent successfully to ${facultyEmail}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Reminder email sent successfully',
        recipient: facultyEmail,
        result: result
      });
    } else {
      console.error('❌ SendMail returned error:', result);
      
      return NextResponse.json({ 
        success: false, 
        error: result?.message || 'Failed to send email - unknown error',
        details: result,
        debug: {
          resultOk: result?.ok,
          resultMessage: result?.message,
          to: facultyEmail
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR in send-reminder API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      success: false, 
      error: 'Critical server error',
      details: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: 'Method not allowed. Use POST.' 
  }, { status: 405 });
}
