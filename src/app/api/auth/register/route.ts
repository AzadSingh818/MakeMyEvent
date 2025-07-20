import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/connection'
import { hashPassword } from '@/lib/auth/config'
import { UserRole } from '@prisma/client'
import * as z from 'zod'

// Registration validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.nativeEnum(UserRole),
  institution: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase()
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          message: 'A user with this email already exists',
          field: 'email'
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user in database - FIXED: institution field properly included
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone,
        role: validatedData.role,
        institution: validatedData.institution || null, // ✅ Fixed: Properly handle institution
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        institution: true, // ✅ Fixed: Include in select
        createdAt: true
      }
    })

    // Log successful registration
    console.log('New user registered:', {
      id: user.id,
      email: user.email,
      role: user.role,
      institution: user.institution
    })

    // Send welcome email (implement later)
    // await sendWelcomeEmail(user.email, user.name, user.role)

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path[0],
        message: err.message
      }))

      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: fieldErrors
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error instanceof Error && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          return NextResponse.json(
            {
              message: 'A user with this email already exists',
              field: 'email'
            },
            { status: 400 }
          )
        case 'P2000':
          return NextResponse.json(
            {
              message: 'The provided value is too long for the database field',
              field: 'unknown'
            },
            { status: 400 }
          )
        default:
          console.error('Database error:', error)
      }
    }

    return NextResponse.json(
      {
        message: 'Internal server error occurred. Please try again.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}