// src/global.d.ts - Add these lines to your existing file
declare module "*.css" {
    const content: { [className: string]: string };
    export default content;
}

// Add these OTP store declarations:
declare global {
  var otpStore: Map<string, { otp: string; expireAt: number; provider?: string }>;
  var verifyAttempts: Map<string, { count: number; resetAt: number }>;
}
