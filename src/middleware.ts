import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'

// Define route access permissions
const routePermissions: Record<string, UserRole[]> = {
  '/organizer': ['ORGANIZER'],
  '/event-manager': ['EVENT_MANAGER', 'ORGANIZER'],
  '/faculty': ['FACULTY', 'ORGANIZER', 'EVENT_MANAGER'],
  '/delegate': ['DELEGATE', 'ORGANIZER', 'EVENT_MANAGER'],
  '/hall-coordinator': ['HALL_COORDINATOR', 'ORGANIZER', 'EVENT_MANAGER'],
  '/sponsor': ['SPONSOR', 'ORGANIZER'],
  '/volunteer': ['VOLUNTEER', 'ORGANIZER', 'EVENT_MANAGER'],
  '/vendor': ['VENDOR', 'ORGANIZER', 'EVENT_MANAGER'],
  
  // API routes
  '/api/events': ['ORGANIZER', 'EVENT_MANAGER'],
  '/api/faculty': ['ORGANIZER', 'EVENT_MANAGER', 'FACULTY'],
  '/api/sessions': ['ORGANIZER', 'EVENT_MANAGER', 'FACULTY', 'HALL_COORDINATOR'],
  '/api/registrations': ['ORGANIZER', 'EVENT_MANAGER'],
  '/api/attendance': ['ORGANIZER', 'EVENT_MANAGER', 'HALL_COORDINATOR', 'FACULTY'],
}

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/qr-login',
  '/api/auth',
  '/about',
  '/contact',
  '/privacy',
  '/terms'
]

// Function to check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

// Function to check role access
function hasRoleAccess(userRole: UserRole, pathname: string): boolean {
  // Find the most specific route match
  const routeKeys = Object.keys(routePermissions).sort((a, b) => b.length - a.length)
  const matchedRoute = routeKeys.find(route => pathname.startsWith(route))
  
  if (!matchedRoute) {
    // If no specific route found, allow access (for general pages)
    return true
  }
  
  const allowedRoles = routePermissions[matchedRoute]
  return Array.isArray(allowedRoles) && allowedRoles.includes(userRole)
}

// Get default redirect URL based on user role
function getDefaultRedirectUrl(userRole: UserRole): string {
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
  
  return roleRoutes[userRole] || '/delegate'
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // Skip middleware for static files and API auth routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('/favicon.ico') ||
      pathname.includes('/images/') ||
      pathname.includes('/icons/')
    ) {
      return NextResponse.next()
    }
    
    // Handle public routes
    if (isPublicRoute(pathname)) {
      // If user is logged in and trying to access login/register, redirect to dashboard
      if (token && (pathname === '/login' || pathname === '/register')) {
        const redirectUrl = getDefaultRedirectUrl(token.role as UserRole)
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      return NextResponse.next()
    }
    
    // Check if user has permission for this route
    if (token && !hasRoleAccess(token.role as UserRole, pathname)) {
      // Redirect to appropriate dashboard if no access
      const redirectUrl = getDefaultRedirectUrl(token.role as UserRole)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (isPublicRoute(pathname)) {
          return true
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

// Additional middleware utilities
export function createAuthHeader(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export function extractUserFromToken(token: any): {
  id: string
  email: string
  role: UserRole
  name?: string
} | null {
  if (!token) return null
  
  return {
    id: token.id,
    email: token.email,
    role: token.role,
    name: token.name
  }
}