// app/(auth)/faculty-login/page.tsx (Fixed TypeScript issues)
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Email provider detection with proper typing
interface EmailProvider {
  name: string;
  domains: string[];
  color: string;
  key: string;
}

const EMAIL_PROVIDERS: Record<string, Omit<EmailProvider, 'key'>> = {
  gmail: { 
    name: 'Gmail', 
    domains: ['gmail.com', 'googlemail.com'], 
    color: 'bg-red-100 text-red-800' 
  },
  yahoo: { 
    name: 'Yahoo Mail', 
    domains: ['yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com', 'rocketmail.com'], 
    color: 'bg-purple-100 text-purple-800' 
  },
  rediff: { 
    name: 'Rediffmail', 
    domains: ['rediffmail.com', 'rediff.com'], 
    color: 'bg-blue-100 text-blue-800' 
  }
};

function getEmailProvider(email: string): EmailProvider | null {
  // Validate email format first
  if (!email || !email.includes('@')) {
    return null;
  }

  const emailParts = email.toLowerCase().split('@');
  
  // Ensure we have exactly 2 parts and domain exists
  if (emailParts.length !== 2 || !emailParts[1] || emailParts[1].trim() === '') {
    return null;
  }
  
  const domain = emailParts[1].trim();
  
  for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return { key, ...provider };
    }
  }
  
  return null;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface EventContext {
  eventId?: string | null;
  invitationId?: string | null;
  ref?: string | null;
}

interface InvitationDetails {
  eventTitle: string;
  eventDates: string;
  location: string;
  venue: string;
}

export default function FacultyLoginPage() {
  const [email, setEmail] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [emailProvider, setEmailProvider] = useState<EmailProvider | null>(null);
  const [error, setError] = useState<string>("");

  // Event invitation context
  const [eventContext, setEventContext] = useState<EventContext | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const eventIdParam = params.get("eventId");
      const invitationIdParam = params.get("invitationId");
      const refParam = params.get("ref");

      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }

      // If this is from an event invitation, set context
      if (refParam === "event-invitation" && eventIdParam) {
        setEventContext({
          eventId: eventIdParam,
          invitationId: invitationIdParam,
          ref: refParam,
        });

        setInvitationDetails({
          eventTitle: "Academic Excellence Conference 2025",
          eventDates: "March 15-17, 2025",
          location: "University Campus",
          venue: "Main Auditorium",
        });
      }
    }
  }, []);

  // Update email provider detection when email changes
  useEffect(() => {
    if (email && isValidEmail(email)) {
      const provider = getEmailProvider(email);
      setEmailProvider(provider);
      setError(""); // Clear any previous errors
    } else {
      setEmailProvider(null);
    }
  }, [email]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      let callbackUrl = "/faculty";
      if (eventContext) {
        const params = new URLSearchParams();
        if (eventContext.eventId) params.set("eventId", eventContext.eventId);
        if (eventContext.invitationId) params.set("invitationId", eventContext.invitationId);
        if (eventContext.ref) params.set("ref", eventContext.ref);
        
        callbackUrl = `/faculty?${params.toString()}`;
      }

      await signIn("google", { callbackUrl, email });
    } catch (e) {
      setError("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendOtp = async () => {
    // Comprehensive validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!emailProvider) {
      setError("Email provider not supported. Please use Gmail, Yahoo, or Rediffmail.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      console.log(`📧 OTP sent via ${result.recipientProvider || result.provider}:`, email);
      setOtpSent(true);
      setError("");
    } catch (err: unknown) {
      console.error("Send OTP error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Verification code must contain only numbers");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting OTP sign-in with NextAuth...");
      
      // Use NextAuth signIn with OTP provider
      const result = await signIn("otp", {
        email: email.toLowerCase().trim(),
        otp: otp,
        redirect: false,
      });

      if (result?.error) {
        console.error("❌ NextAuth OTP sign-in error:", result.error);
        throw new Error("Invalid verification code or expired. Please try again.");
      }

      if (result?.ok) {
        console.log("✅ OTP authentication successful via NextAuth");

        // Redirect with event context if present
        if (eventContext) {
          const params = new URLSearchParams();
          if (eventContext.eventId) params.set("eventId", eventContext.eventId);
          if (eventContext.invitationId) params.set("invitationId", eventContext.invitationId);
          if (eventContext.ref) params.set("ref", eventContext.ref);
          
          window.location.href = `/faculty?${params.toString()}`;
        } else {
          window.location.href = "/faculty";
        }
      } else {
        throw new Error("Authentication failed. Please try again.");
      }

    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      const errorMessage = err instanceof Error ? err.message : "OTP verification failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
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

          {/* Event invitation context */}
          {invitationDetails && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Event Invitation</span>
              </div>
              <h3 className="font-semibold text-blue-100 text-sm">
                {invitationDetails.eventTitle}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {invitationDetails.eventDates}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {invitationDetails.location}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Faculty Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your faculty email"
                disabled={otpSent}
                required
                autoComplete="email"
              />
            </div>
            
            {/* Email Provider Detection */}
            {emailProvider && (
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${emailProvider.color}`}>
                  {emailProvider.name} Supported
                </span>
              </div>
            )}
            
            {email && isValidEmail(email) && !emailProvider && (
              <div className="mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 text-xs">
                  Provider not supported. Use Gmail, Yahoo, or Rediffmail.
                </span>
              </div>
            )}

            {email && !isValidEmail(email) && email.includes('@') && (
              <div className="mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-300 text-xs">
                  Please enter a valid email address.
                </span>
              </div>
            )}
          </div>

          {otpSent && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-center tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 text-center">
                Code sent to {email} via {emailProvider?.name || 'Gmail SMTP'}
              </p>
              <button
                type="button"
                onClick={resetFlow}
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition block mx-auto"
              >
                Use different email
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!emailProvider && !otpSent)}
            className={`w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-3 font-semibold shadow-lg text-white transition ${
              loading || (!emailProvider && !otpSent)
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02] transform"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {otpSent ? "Verify Code" : "Send Code"}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center text-gray-400">
          <div className="h-px bg-gray-600 flex-1"></div>
          <span className="mx-4 text-sm">OR</span>
          <div className="h-px bg-gray-600 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={!email || !isValidEmail(email) || googleLoading}
          className={`w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 font-semibold shadow-lg text-white transition ${
            googleLoading || !email || !isValidEmail(email)
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-[1.02] transform"
          }`}
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M21.805 10.023h-9.54v3.935h5.59c-.238 1.428-1.488 4.191-5.59 4.191-3.372 0-6.122-2.774-6.122-6.19s2.75-6.19 6.123-6.19c1.91 0 3.19.818 3.931 1.52l2.68-2.6c-1.572-1.466-3.636-2.365-6.612-2.365-5.438 0-9.851 4.507-9.851 10.055s4.412 10.055 9.85 10.055c5.69 0 9.458-3.984 9.458-9.6 0-.646-.07-1.022-.163-1.27z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Provider Support Information */}
        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Supported Email Providers</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs font-bold">G</span>
              </div>
              <span className="text-xs text-gray-400">Gmail</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xs font-bold">Y</span>
              </div>
              <span className="text-xs text-gray-400">Yahoo</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">R</span>
              </div>
              <span className="text-xs text-gray-400">Rediff</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            All emails are sent securely via Gmail SMTP
          </p>
        </div>

        {invitationDetails && (
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>🔐 Secure login • Your invitation is waiting inside</p>
          </div>
        )}
      </div>
    </main>
  );
}