// lib/email/providers.ts (Simplified - Gmail sender only)
export interface EmailProviderInfo {
  name: string;
  domains: string[];
  color: string;
  supported: boolean;
}

export const EMAIL_PROVIDERS: Record<string, EmailProviderInfo> = {
  gmail: {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    color: 'bg-red-100 text-red-800',
    supported: true
  },
  yahoo: {
    name: 'Yahoo Mail', 
    domains: ['yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com', 'rocketmail.com'],
    color: 'bg-purple-100 text-purple-800',
    supported: true
  },
  rediff: {
    name: 'Rediffmail',
    domains: ['rediffmail.com', 'rediff.com'],
    color: 'bg-blue-100 text-blue-800',
    supported: true
  },
  hotmail: {
    name: 'Hotmail/Outlook',
    domains: ['hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'live.com', 'outlook.com', 'msn.com'],
    color: 'bg-blue-100 text-blue-900',
    supported: true
  }
};

export function getProviderByEmail(email: string): EmailProviderInfo | null {
  const emailParts = email.toLowerCase().split('@');
  
  // Ensure we have exactly 2 parts (username@domain)
  if (emailParts.length !== 2 || !emailParts[1]) {
    return null;
  }
  
  const domain = emailParts[1];
  
  for (const provider of Object.values(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return provider;
    }
  }
  
  return null;
}

export function isValidEmailProvider(email: string): boolean {
  return getProviderByEmail(email) !== null;
}

// Single Gmail transporter for all emails
export const createEmailTransporter = () => {
  const nodemailer = require("nodemailer");
  
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.GMAIL_SMTP_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};