'use client'

import { useState } from 'react'
import { NavigationSidebar, MobileSidebar } from './sidebar'
import { DashboardHeader, HeaderStats } from './header'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY' | 'DELEGATE' | 'HALL_COORDINATOR' | 'SPONSOR' | 'VOLUNTEER' | 'VENDOR'
  userName?: string
  userEmail?: string
  userAvatar?: string
  showHeaderStats?: boolean
  headerStats?: Array<{
    label: string
    value: string | number
    color?: string
  }>
  className?: string
} 

export function DashboardLayout({
  children,
  userRole,
  userName = "John Doe",
  userEmail = "john@example.com",
  userAvatar,
  showHeaderStats = false,
  headerStats = [],
  className
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Default header stats based on role
  const getDefaultHeaderStats = () => {
    switch (userRole) {
      case 'ORGANIZER':
        return [
          { label: 'Active Events', value: '3', color: 'bg-blue-500' },
          { label: 'Total Faculty', value: '145', color: 'bg-green-500' },
          { label: 'Sessions Today', value: '8', color: 'bg-purple-500' },
          { label: 'Pending Approvals', value: '12', color: 'bg-orange-500' }
        ]
      case 'EVENT_MANAGER':
        return [
          { label: 'Today\'s Sessions', value: '8', color: 'bg-blue-500' },
          { label: 'Pending Tasks', value: '5', color: 'bg-red-500' },
          { label: 'Faculty Confirmed', value: '23', color: 'bg-green-500' }
        ]
      case 'HALL_COORDINATOR':
        return [
          { label: 'My Halls', value: '2', color: 'bg-blue-500' },
          { label: 'Active Sessions', value: '3', color: 'bg-green-500' },
          { label: 'Attendance Marked', value: '145', color: 'bg-purple-500' }
        ]
      case 'FACULTY':
        return [
          { label: 'My Sessions', value: '3', color: 'bg-blue-500' },
          { label: 'Presentations', value: '2', color: 'bg-green-500' },
          { label: 'Next Session', value: '2h 30m', color: 'bg-orange-500' }
        ]
      case 'DELEGATE':
        return [
          { label: 'Registered Events', value: '2', color: 'bg-blue-500' },
          { label: 'Sessions Attended', value: '7', color: 'bg-green-500' },
          { label: 'Certificates', value: '1', color: 'bg-purple-500' },
          { label: 'Next Event', value: '1 day', color: 'bg-orange-500' }
        ]
      case 'SPONSOR':
        return [
          { label: 'Active Sponsorships', value: '2', color: 'bg-blue-500' },
          { label: 'Total Investment', value: '$5,000', color: 'bg-green-500' },
          { label: 'Events Sponsored', value: '3', color: 'bg-purple-500' },
          { label: 'ROI', value: '15%', color: 'bg-orange-500' }
        ]
      case 'VOLUNTEER':
        return [
          { label: 'Active Tasks', value: '3', color: 'bg-blue-500' },
          { label: 'Hours Completed', value: '24', color: 'bg-green-500' },
          { label: 'Upcoming Shifts', value: '2', color: 'bg-purple-500' },
          { label: 'Rating', value: '4.8', color: 'bg-orange-500' }
        ]
      case 'VENDOR':
        return [
          { label: 'Active Bookings', value: '5', color: 'bg-blue-500' },
          { label: 'Total Revenue', value: '$12,500', color: 'bg-green-500' },
          { label: 'Pending Deliveries', value: '3', color: 'bg-purple-500' },
          { label: 'Services Listed', value: '8', color: 'bg-orange-500' }
        ]
      default:
        return []
    }
  }

  const statsToShow = headerStats.length > 0 ? headerStats : getDefaultHeaderStats()

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900 flex", className)}>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <NavigationSidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <DashboardHeader
          userName={userName}
          userRole={userRole}
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Header Stats (Optional) */}
        {showHeaderStats && statsToShow.length > 0 && (
          <HeaderStats stats={statsToShow} />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Specialized layout for different roles
export function OrganizerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="ORGANIZER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function FacultyLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="FACULTY" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function HallCoordinatorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="HALL_COORDINATOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function EventManagerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="EVENT_MANAGER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function DelegateLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="DELEGATE" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function SponsorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="SPONSOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function VolunteerLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="VOLUNTEER" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

export function VendorLayout({ children, ...props }: Omit<DashboardLayoutProps, 'userRole'>) {
  return (
    <DashboardLayout userRole="VENDOR" showHeaderStats={true} {...props}>
      {children}
    </DashboardLayout>
  )
}

// Page wrapper with consistent padding and spacing
interface DashboardPageProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function DashboardPage({ 
  children, 
  title, 
  description, 
  actions, 
  className 
}: DashboardPageProps) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

// Content sections for consistent spacing
export function DashboardSection({ 
  children, 
  title, 
  description,
  className 
}: {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}