// Example of how to update your navigation component
// Add this to your main dashboard navigation

import { Shield, Settings, BarChart3 } from 'lucide-react';

// Add admin navigation items based on user role
const getNavigationItems = (userRole: string) => {
  const baseItems = [
    // Your existing navigation items
    { title: 'Dashboard', href: '/dashboard', icon: Home },
    { title: 'Events', href: '/events', icon: Calendar },
    { title: 'Sessions', href: '/sessions', icon: Clock },
    // ... other items
  ];

  // Add admin items for authorized users
  if (['ORGANIZER', 'EVENT_MANAGER'].includes(userRole)) {
    baseItems.push(
      {
        title: 'Admin',
        icon: Shield,
        children: [
          {
            title: 'Role Management',
            href: '/admin/roles',
            icon: Users,
            description: 'Manage user roles and permissions'
          },
          {
            title: 'System Settings', 
            href: '/admin/settings',
            icon: Settings,
            description: 'Configure system settings'
          },
          {
            title: 'Analytics',
            href: '/admin/analytics', 
            icon: BarChart3,
            description: 'View system analytics'
          }
        ]
      }
    );
  }

  return baseItems;
};