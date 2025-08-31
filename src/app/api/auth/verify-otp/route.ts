import { NextRequest, NextResponse } from 'next/server';

// Use same global storage
global.otpStore = global.otpStore || new Map();

// Rate limiting storage
global.verifyAttempts = global.verifyAttempts || new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  console.log('🔄 Verify OTP API called');
  
  try {
    const body = await request.json();
    console.log('📝 Verify request body received');
    
    const { email, phone, emailOtp, phoneOtp } = body;

    // Validate inputs
    if (!email || !phone || !emailOtp || !phoneOtp) {
      return NextResponse.json(
        { message: 'Email, phone, and both OTP codes are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(emailOtp) || !/^\d{6}$/.test(phoneOtp)) {
      return NextResponse.json(
        { message: 'OTP codes must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = `${email.toLowerCase()}:${phone}`;
    const now = Date.now();
    const attempts = global.verifyAttempts.get(rateLimitKey);

    if (attempts && attempts.count >= MAX_ATTEMPTS && attempts.resetAt > now) {
      const remainingMinutes = Math.ceil((attempts.resetAt - now) / 1000 / 60);
      return NextResponse.json(
        { message: `Too many verification attempts. Please try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      );
    }

    // Get keys for stored OTPs
    const emailKey = `email:${email.toLowerCase()}`;
    const phoneKey = `phone:${phone}`;

    console.log('🔍 Looking for OTPs with keys:', { emailKey, phoneKey });
    console.log('🗄️ Current storage keys:', Array.from(global.otpStore.keys()));
    console.log('🗄️ Storage size:', global.otpStore.size);

    // Get stored OTPs
    const emailOtpData = global.otpStore.get(emailKey);
    const phoneOtpData = global.otpStore.get(phoneKey);

    // Increment attempt counter
    const newAttempts = attempts ? attempts.count + 1 : 1;
    global.verifyAttempts.set(rateLimitKey, {
      count: newAttempts,
      resetAt: now + ATTEMPT_WINDOW
    });

    console.log('🔍 Found OTPs:', {
      emailFound: !!emailOtpData,
      phoneFound: !!phoneOtpData,
      attempts: newAttempts
    });

    // Check if OTPs exist
    if (!emailOtpData || !phoneOtpData) {
      console.log('❌ OTPs not found in storage');
      return NextResponse.json(
        { message: 'Verification codes not found or have expired. Please request new codes.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (emailOtpData.expireAt < now || phoneOtpData.expireAt < now) {
      console.log('❌ OTPs expired');
      global.otpStore.delete(emailKey);
      global.otpStore.delete(phoneKey);
      return NextResponse.json(
        { message: 'Verification codes have expired. Please request new codes.' },
        { status: 400 }
      );
    }

    // Verify OTPs
    const emailValid = emailOtpData.otp === emailOtp;
    const phoneValid = phoneOtpData.otp === phoneOtp;

    console.log('🔍 OTP validation result:', {
      emailValid,
      phoneValid,
      providedEmailOtp: emailOtp,
      providedPhoneOtp: phoneOtp,
      storedEmailOtp: emailOtpData.otp,
      storedPhoneOtp: phoneOtpData.otp
    });

    if (!emailValid || !phoneValid) {
      let message = 'Invalid verification code';
      if (!emailValid && !phoneValid) {
        message = 'Both verification codes are invalid';
      } else if (!emailValid) {
        message = 'Email verification code is invalid';
      } else {
        message = 'Phone verification code is invalid';
      }

      console.log('❌ Validation failed:', message);
      return NextResponse.json({ message }, { status: 400 });
    }

    // Success - clean up OTPs and rate limiting
    global.otpStore.delete(emailKey);
    global.otpStore.delete(phoneKey);
    global.verifyAttempts.delete(rateLimitKey);

    console.log('✅ OTPs verified successfully');

    return NextResponse.json({ 
      message: 'Verification codes verified successfully',
      verified: true,
      email: email.toLowerCase(),
      phone: phone
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return NextResponse.json(
      { message: 'Failed to verify OTP codes', error: error.message },
      { status: 500 }
    );
  }
}
