// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";

// Extend global type to include otpStore and verifyAttempts
declare global {
  // OTP data structure
  interface OtpData {
    otp: string;
    expireAt: number;
  }
  // Attempt data structure
  interface AttemptData {
    count: number;
    resetAt: number;
  }
  // Extend NodeJS.Global
  // eslint-disable-next-line no-var
  var otpStore: Map<string, OtpData>;
  // eslint-disable-next-line no-var
  var verifyAttempts: Map<string, AttemptData>;
}

// Use same global storage
global.otpStore = global.otpStore || new Map();

// Rate limiting storage
global.verifyAttempts = global.verifyAttempts || new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  console.log("🔄 Verify OTP API called");

  try {
    const body = await request.json();
    console.log("📝 Verify request body received");

    const { email, emailOtp } = body;

    // Validate inputs
    if (!email || !emailOtp) {
      return NextResponse.json(
        { message: "Email and email OTP code are required" },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(emailOtp)) {
      return NextResponse.json(
        { message: "OTP code must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // Rate limiting - using email only for the key
    const rateLimitKey = `${email.toLowerCase()}`;
    const now = Date.now();
    const attempts = global.verifyAttempts.get(rateLimitKey);

    if (attempts && attempts.count >= MAX_ATTEMPTS && attempts.resetAt > now) {
      const remainingMinutes = Math.ceil((attempts.resetAt - now) / 1000 / 60);
      return NextResponse.json(
        {
          message: `Too many verification attempts. Please try again in ${remainingMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Get key for stored OTP
    const emailKey = `email:${email.toLowerCase()}`;

    console.log("🔍 Looking for OTP with key:", { emailKey });
    console.log("🗄️ Current storage keys:", Array.from(global.otpStore.keys()));
    console.log("🗄️ Storage size:", global.otpStore.size);

    // Get stored OTP
    const emailOtpData = global.otpStore.get(emailKey);

    // Increment attempt counter
    const newAttempts = attempts ? attempts.count + 1 : 1;
    global.verifyAttempts.set(rateLimitKey, {
      count: newAttempts,
      resetAt: now + ATTEMPT_WINDOW,
    });

    console.log("🔍 Found OTP:", {
      emailFound: !!emailOtpData,
      attempts: newAttempts,
    });

    // Check if OTP exists
    if (!emailOtpData) {
      console.log("❌ OTP not found in storage");
      return NextResponse.json(
        {
          message:
            "Verification code not found or has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (emailOtpData.expireAt < now) {
      console.log("❌ OTP expired");
      global.otpStore.delete(emailKey);
      return NextResponse.json(
        {
          message: "Verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Verify OTP
    const emailValid = emailOtpData.otp === emailOtp;

    console.log("🔍 OTP validation result:", {
      emailValid,
      providedEmailOtp: emailOtp,
      storedEmailOtp: emailOtpData.otp,
    });

    if (!emailValid) {
      console.log("❌ Validation failed: Email verification code is invalid");
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Success - clean up OTP and rate limiting
    global.otpStore.delete(emailKey);
    global.verifyAttempts.delete(rateLimitKey);

    console.log("✅ OTP verified successfully");

    return NextResponse.json({
      message: "Verification code verified successfully",
      verified: true,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Failed to verify OTP code", error: errorMessage },
      { status: 500 }
    );
  }
}