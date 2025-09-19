// lib/auth/config.ts - Updated with OTP provider
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/database/connection";
import bcrypt from "bcryptjs";

// Define User Role enum
export enum UserRole {
  ORGANIZER = "ORGANIZER",
  EVENT_MANAGER = "EVENT_MANAGER", 
  FACULTY = "FACULTY",
  DELEGATE = "DELEGATE",
  HALL_COORDINATOR = "HALL_COORDINATOR",
  SPONSOR = "SPONSOR",
  VOLUNTEER = "VOLUNTEER",
  VENDOR = "VENDOR",
}

// User interface
export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: UserRole;
  institution?: string | null;
  password?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Database functions for users
export const UserService = {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query("SELECT * FROM users WHERE email = $1", [
        email.toLowerCase(),
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  async findById(id: string): Promise<User | null> {
    try {
      const result = await query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by id:", error);
      return null;
    }
  },

  async create(userData: Partial<User>): Promise<User | null> {
    try {
      const result = await query(
        `INSERT INTO users (email, name, image, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          userData.email?.toLowerCase(),
          userData.name,
          userData.image,
          userData.role || UserRole.FACULTY,
          userData.emailVerified || new Date(),
        ]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  },

  async findOrCreateByEmail(email: string, name?: string): Promise<User | null> {
    try {
      // First try to find existing user
      let user = await this.findByEmail(email);
      
      if (!user) {
        // Create new faculty user if doesn't exist
        user = await this.create({
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          role: UserRole.FACULTY,
          emailVerified: new Date(),
        });
      }
      
      return user;
    } catch (error) {
      console.error("Error finding or creating user:", error);
      return null;
    }
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Email & Password Authentication
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
        },
        password: {
          label: "Password", 
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          const user = await UserService.findByEmail(credentials.email);

          if (!user || !user.password) {
            console.log("❌ User not found or no password set");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ User authenticated successfully:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("❌ Error in credentials authorize:", error);
          return null;
        }
      },
    }),

    // NEW: OTP Authentication Provider
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        otp: {
          label: "OTP",
          type: "text",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          console.log("❌ Missing email or OTP");
          return null;
        }

        try {
          console.log("🔐 Attempting OTP authentication for:", credentials.email);

          // Verify OTP using the same logic as verify-otp API
          const emailKey = `email:${credentials.email.toLowerCase()}`;
          const emailOtpData = global.otpStore.get(emailKey);

          if (!emailOtpData) {
            console.log("❌ OTP not found in storage");
            return null;
          }

          if (emailOtpData.expireAt < Date.now()) {
            console.log("❌ OTP expired");
            global.otpStore.delete(emailKey);
            return null;
          }

          if (emailOtpData.otp !== credentials.otp) {
            console.log("❌ Invalid OTP");
            return null;
          }

          // OTP is valid, clean up
          global.otpStore.delete(emailKey);
          console.log("✅ OTP verified successfully");

          // Find or create user
          const user = await UserService.findOrCreateByEmail(
            credentials.email,
            credentials.email.split('@')[0]
          );

          if (!user) {
            console.log("❌ Failed to find or create user");
            return null;
          }

          console.log("✅ User authenticated via OTP:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };

        } catch (error) {
          console.error("❌ Error in OTP authorize:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          const dbUser = await UserService.findOrCreateByEmail(
            token.email!,
            token.name || undefined
          );
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        } catch (error) {
          console.error("❌ Error handling Google login:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  events: {
    async signIn({ user, account }) {
      console.log("👤 User signed in:", user.email, "via", account?.provider);
    },

    async signOut({ session }) {
      console.log("👋 User signed out:", session?.user?.email);
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// Type extensions for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: UserRole;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: UserRole;
  }
}