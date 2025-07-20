// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define User Role enum (copied locally to avoid imports)
enum UserRole {
  ORGANIZER = 'ORGANIZER',
  EVENT_MANAGER = 'EVENT_MANAGER',
  FACULTY = 'FACULTY',
  DELEGATE = 'DELEGATE',
  HALL_COORDINATOR = 'HALL_COORDINATOR',
  SPONSOR = 'SPONSOR',
  VOLUNTEER = 'VOLUNTEER',
  VENDOR = 'VENDOR'
}

// Define route access permissions
const routePermissions: Record<string, string[]> = {
  '/organizer': ['ORGANIZER'],
  '/event-manager': ['EVENT_MANAGER', 'ORGANIZER'],
  '/faculty': ['FACULTY', 'ORGANIZER', 'EVENT_MANAGER'],
  '/delegate': ['DELEGATE', 'ORGANIZER', 'EVENT_MANAGER'],
  '/hall-coordinator': ['HALL_COORDINATOR', 'ORGANIZER', 'EVENT_MANAGER'],
  '/sponsor': ['SPONSOR', 'ORGANIZER'],
  '/volunteer': ['VOLUNTEER', 'ORGANIZER', 'EVENT_MANAGER'],
  '/vendor': ['VENDOR', 'ORGANIZER', 'EVENT_MANAGER'],
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
function hasRoleAccess(userRole: string, pathname: string): boolean {
  // Find the most specific route match
  const routeKeys = Object.keys(routePermissions).sort((a, b) => b.length - a.length)
  const matchedRoute = routeKeys.find(route => pathname.startsWith(route))
  
  if (!matchedRoute) {
    return true
  }
  
  const allowedRoles = routePermissions[matchedRoute]
  return Array.isArray(allowedRoles) && allowedRoles.includes(userRole)
}

// Get default redirect URL based on user role
function getDefaultRedirectUrl(userRole: string): string {
  const roleRoutes: Record<string, string> = {
    'ORGANIZER': '/organizer',
    'EVENT_MANAGER': '/event-manager',
    'FACULTY': '/faculty',
    'DELEGATE': '/delegate',
    'HALL_COORDINATOR': '/hall-coordinator',
    'SPONSOR': '/sponsor',
    'VOLUNTEER': '/volunteer',
    'VENDOR': '/vendor'
  }
  
  return roleRoutes[userRole] || '/delegate'
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    console.log('🔄 Middleware processing:', pathname, token ? 'authenticated' : 'not authenticated')
    
    // Skip middleware for static files
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('/favicon.ico') ||
      pathname.includes('/images/') ||
      pathname.includes('/icons/') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js')
    ) {
      return NextResponse.next()
    }
    
    // Handle public routes
    if (isPublicRoute(pathname)) {
      if (token && (pathname === '/login' || pathname === '/register')) {
        const redirectUrl = getDefaultRedirectUrl(token.role)
        console.log('🔀 Redirecting authenticated user to:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      return NextResponse.next()
    }
    
    // Check role access for protected routes
    if (token && !hasRoleAccess(token.role, pathname)) {
      const redirectUrl = getDefaultRedirectUrl(token.role)
      console.log('🚫 Access denied, redirecting to:', redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        if (isPublicRoute(pathname)) {
          return true
        }
        
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}

// Remove edge runtime specification