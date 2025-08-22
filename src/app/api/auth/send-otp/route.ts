import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { setOTP } from "../../../../lib/otp-store";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const otp = generateOtp();
    setOTP(email, otp);

    const html = `<p>Your OTP code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`;
    const text = `Your OTP code is ${otp}. It expires in 5 minutes.`;

    const result = await sendMail({
      to: email,
      subject: "Your Scientific Portal Login OTP",
      text,
      html,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
