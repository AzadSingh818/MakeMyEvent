import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/database/connection'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email & Password Authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'john@example.com' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase()
          }
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      }
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.DELEGATE // Default role for Google signups
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the user role and other data to the token
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      // Handle first-time Google login
      if (account?.provider === 'google' && user) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user with Google data
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image,
                role: UserRole.DELEGATE,
                emailVerified: new Date()
              }
            })
            token.role = newUser.role
            token.id = newUser.id
          } else {
            token.role = existingUser.role
            token.id = existingUser.id
          }
        } catch (error) {
          console.error('Error handling Google login:', error)
        }
      }

      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Redirect to appropriate dashboard based on role
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email)
    },
    
    async signOut({ session }) {
      console.log('User signed out:', session?.user?.email)
    },

    async createUser({ user }) {
      console.log('New user created:', user.email)
      
      // Send welcome email (implement later)
      // await sendWelcomeEmail(user.email, user.name)
    }
  },

  debug: process.env.NODE_ENV === 'development',
}

// Helper function to get user role-based redirect URL
export function getRoleBasedRedirectUrl(role: UserRole): string {
  const roleRoutes = {
    ORGANIZER: '/organizer',
    EVENT_MANAGER: '/event-manager', 
    FACULTY: '/faculty',
    DELEGATE: '/delegate',
    HALL_COORDINATOR: '/hall-coordinator',
    SPONSOR: '/sponsor',
    VOLUNTEER: '/volunteer',
    VENDOR: '/vendor'
  }

  return roleRoutes[role] || '/delegate'
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Type extensions for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      email: string
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    id: string
  }
}