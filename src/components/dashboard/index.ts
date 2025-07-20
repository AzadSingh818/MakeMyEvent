// Dashboard Components Export Index
// Central file for importing all dashboard components

// Stats Components
export { 
  StatsCard, 
  StatsCardSkeleton, 
  StatsGrid 
} from './stats-card'

export { 
  DashboardStats,
  EventStats,
  FacultyStats,
  SessionStats
} from './dashboard-stats'

// Navigation Components
export { 
  NavigationSidebar, 
  MobileSidebar 
} from './sidebar'

// Header Components
export { 
  DashboardHeader, 
  HeaderStats 
} from './header'

// Layout Components
export { 
  DashboardLayout,
  OrganizerLayout,
  FacultyLayout,
  HallCoordinatorLayout,
  EventManagerLayout,
  DashboardPage,
  DashboardSection
} from './layout'

// Usage Example:
// import { 
//   OrganizerLayout, 
//   DashboardPage, 
//   DashboardStats 
// } from '@/components/dashboard'