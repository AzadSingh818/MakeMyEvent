"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight, Shield, Phone } from "lucide-react";

export default function FacultyLoginPage() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) setEmail(decodeURIComponent(emailParam));
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/faculty", email });
    } catch (e) {
      alert("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      alert("OTP sent to your email");
      setOtpSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      alert("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      alert("Login successful!");
      window.location.href = "/faculty";
    } catch (err) {
      alert(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setOtpSent(false);
    setOtp("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otpSent) {
      verifyOtp();
    } else {
      sendOtp();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-white">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-b from-indigo-600 to-purple-600 flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Faculty Portal Login</h1>
          <p className="mt-2 text-gray-300">Secure access to your dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className={`w-full rounded-xl p-3 pr-10 bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={otpSent}
              />
              <Mail className="absolute right-3 top-1/2 -mt-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {otpSent && (
            <>
              <div>
                <label htmlFor="otp" className="block mb-1 font-medium">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="w-full rounded-xl p-3 pr-10 bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={resetFlow}
                  className="mt-2 text-sm text-indigo-400 hover:underline"
                >
                  Change Email
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={!email || loading}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-3 font-semibold shadow-lg transition ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
            }`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : otpSent ? (
              "Verify OTP"
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center text-gray-400">
          <span className="mx-4">OR</span>
        </div>

        <button
          onClick={() => {
            setGoogleLoading(true);
            signIn("google", { callbackUrl: "/faculty", email }).catch(() => {
              alert("Google sign-in failed.");
              setGoogleLoading(false);
            });
          }}
          disabled={!email || googleLoading}
          className={`w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 font-semibold shadow-lg text-white transition ${
            googleLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-[1.02]"
          }`}
        >
          {googleLoading && <span>Loading...</span>}
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Google Icon Path */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M21.805 10.023h-9.54v3.935h5.59c-.238 1.428-1.488 4.191-5.59 4.191-3.372 0-6.122-2.774-6.122-6.19s2.75-6.19 6.123-6.19c1.91 0 3.19.818 3.931 1.52l2.68-2.6c-1.572-1.466-3.636-2.365-6.612-2.365-5.438 0-9.851 4.507-9.851 10.055s4.412 10.055 9.85 10.055c5.69 0 9.458-3.984 9.458-9.6 0-.646-.07-1.022-.163-1.27z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
