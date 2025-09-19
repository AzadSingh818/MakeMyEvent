// src/app/api/auth/send-otp/route.ts - CORRECTED VERSION
import { NextRequest, NextResponse } from "next/server";

// Global storage for OTPs (use Redis in production)
declare global {
  // eslint-disable-next-line no-var
  var otpStore: Map<string, { otp: string; expireAt: number; provider?: string }>;
}
global.otpStore = global.otpStore || new Map();

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter - FIXED METHOD NAME
const createEmailTransporter = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require("nodemailer");

  // FIXED: Changed createTransporter to createTransport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for 587/25
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

export async function POST(request: NextRequest) {
  console.log("🔄 Send OTP API called");

  try {
    const body = await request.json();
    console.log("📝 Request body:", body);

    // Only require email
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const emailOtp = generateOTP();
    const expireAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store email OTP in global memory
    global.otpStore.set(`email:${email.toLowerCase()}`, {
      otp: emailOtp,
      expireAt,
      provider: "gmail", // Add provider field to match global type
    });

    console.log("🔐 Generated Email OTP:", {
      email: email.toLowerCase(),
      emailOtp,
      storageSize: global.otpStore.size,
    });

    // Send Email OTP
    try {
      const transporter = createEmailTransporter();

      const result = await transporter.sendMail({
        from: `"Conference Registration" <${
          process.env.FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: email,
        subject: "Faculty Login - Email Verification Code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px;">🛡️</span>
                </div>
                <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 700;">Faculty Portal Login</h1>
                <p style="color: #6b7280; margin: 8px 0 0; font-size: 14px;">Secure access verification</p>
              </div>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #374151; margin: 0 0 16px; font-size: 16px;">Your verification code is:</p>
                <div style="background: white; border: 2px dashed #9ca3af; border-radius: 8px; padding: 16px; display: inline-block;">
                  <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px;">${emailOtp}</span>
                </div>
                <p style="color: #6b7280; margin: 16px 0 0; font-size: 14px;">Code expires in 5 minutes</p>
              </div>
              
              <div style="background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                  🔐 Never share this code with anyone. Faculty portal staff will never ask for your verification code.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                  © ${new Date().getFullYear()} Conference Management System
                </p>
                <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
                  Sent to: ${email} • This is an automated message, please do not reply.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      console.log("✅ Email sent successfully to:", email);
      console.log("📧 Message ID:", result.messageId);

      return NextResponse.json({
        message: "Verification code sent successfully",
        sent: { email: true },
        messageId: result.messageId,
        ...(process.env.NODE_ENV === "development" && {
          debug: { emailOtp },
        }),
      });

    } catch (emailError: any) {
      console.error("❌ Email sending error:", emailError?.message || emailError);
      
      // Provide helpful error messages
      let errorMessage = "Failed to send verification code.";
      if (emailError.code === 'EAUTH') {
        errorMessage += " Please check your Gmail App Password configuration.";
      } else if (emailError.message?.includes('Username and Password not accepted')) {
        errorMessage += " Gmail authentication failed. Please verify your credentials.";
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: String(emailError?.message || emailError)
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("❌ Send OTP error:", error?.message || error);
    return NextResponse.json(
      {
        message: "Failed to send verification code",
        error: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}