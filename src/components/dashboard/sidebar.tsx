"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import FacultyDocumentsModal from "@/app/modals/FacultyDocumentsModal";
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  UserCheck,
  MapPin,
  Bell,
  Award,
  Upload,
  Clock,
  MessageSquare,
  Monitor,
  Plane,
  Hotel,
  QrCode,
  Download,
  Eye,
  UserPlus,
  CalendarPlus,
  Building,
  Briefcase,
  ShoppingBag,
  Edit2,
} from "lucide-react";

interface NavigationItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  action?: string;
}

interface SidebarProps {
  userRole:
    | "ORGANIZER"
    | "EVENT_MANAGER"
    | "FACULTY"
    | "DELEGATE"
    | "HALL_COORDINATOR"
    | "SPONSOR"
    | "VOLUNTEER"
    | "VENDOR";
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  className?: string;
}

const getNavigationItems = (
  role: SidebarProps["userRole"]
): NavigationItem[] => {
  const commonItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/event-manager",
      icon: Home,
    },
  ];

  const roleSpecificItems: Record<SidebarProps["userRole"], NavigationItem[]> =
    {
      ORGANIZER: [
        {
          label: "Events",
          href: "/organizer/events",
          icon: Calendar,
          children: [
            { label: "All Events", href: "/organizer/events", icon: Calendar },
          ],
        },
        {
          label: "Faculty Management",
          href: "/organizer/faculty",
          icon: Users,
          badge: "12",
          children: [
            { label: "All Faculty", href: "/organizer/faculty", icon: Users },
            {
              label: "Documents",
              href: "/organizer/faculty/documents",
              icon: FileText,
            },
          ],
        },
        {
          label: "Sessions",
          href: "/organizer/sessions",
          icon: Monitor,
          children: [
            {
              label: "All Sessions",
              href: "/organizer/sessions",
              icon: Monitor,
            },
            {
              label: "Schedule Builder",
              href: "/organizer/sessions/schedule",
              icon: Calendar,
            },
          ],
        },
        {
          label: "Attendance",
          href: "/organizer/attendance",
          icon: QrCode,
          children: [
            {
              label: "Overview",
              href: "/organizer/attendance",
              icon: BarChart3,
            },
            {
              label: "Reports",
              href: "/organizer/attendance/reports",
              icon: Download,
            },
          ],
        },
        {
          label: "Hospitality",
          href: "/organizer/hospitality",
          icon: Hotel,
          children: [
            {
              label: "Travel",
              href: "/organizer/hospitality/travel",
              icon: Plane,
            },
            {
              label: "Accommodation",
              href: "/organizer/hospitality/hotels",
              icon: Hotel,
            },
            {
              label: "Mementos",
              href: "/organizer/hospitality/mementos",
              icon: Award,
            },
          ],
        },
        {
          label: "Communication",
          href: "/organizer/communication",
          icon: MessageSquare, 
          children: [
            {
              label: "Email",
              href: "/organizer/communication/email",
              icon: Bell,
            },
            {
              label: "WhatsApp",
              href: "/organizer/communication/whatsapp",
              icon: MessageSquare,
            },
            {
              label: "Templates",
              href: "/organizer/communication/templates",
              icon: FileText,
            },
          ],
        },
        {
          label: "Certificates",
          href: "/organizer/certificates",
          icon: Award,
          children: [
            {
              label: "Generate",
              href: "/organizer/certificates/generate",
              icon: Award,
            },
            {
              label: "Templates",
              href: "/organizer/certificates/templates",
              icon: FileText,
            },
            {
              label: "Download",
              href: "/organizer/certificates/download",
              icon: Download,
            },
          ],
        },
        {
          label: "Reports",
          href: "/organizer/reports",
          icon: BarChart3,
          children: [
            {
              label: "Analytics",
              href: "/organizer/reports/analytics",
              icon: BarChart3,
            },
            {
              label: "Export Data",
              href: "/organizer/reports/export",
              icon: Download,
            },
          ],
        },
      ],
      EVENT_MANAGER: [
        {
          label: "Events",
          href: "/event-manager/events",
          icon: Calendar,
          children: [
            {
              label: "All Events",
              href: "/event-manager/events",
              icon: Calendar,
            },
            {
              label: "Create Event",
              href: "/event-manager/events/create",
              icon: CalendarPlus,
            },
            {
              label: "Event Analytics",
              href: "/event-manager/events/analytics",
              icon: BarChart3,
            },
          ],
        },
        {
          label: "Faculty",
          href: "/event-manager/faculty",
          icon: Users,
          badge: "8",
          children: [
            {
              label: "All Faculty",
              href: "/event-manager/faculty",
              icon: Users,
            },
            {
              label: "Invite Faculty",
              href: "/event-manager/faculty/invite",
              icon: UserPlus,
            },
            {
              label: "Faculty Sessions",
              href: "/event-manager/faculty/sessions",
              icon: Monitor,
            },
          ],
        },
        {
          label: "Sessions",
          href: "/event-manager/sessions",
          icon: Monitor,
          children: [
            {
              label: "All Sessions",
              href: "/event-manager/sessions",
              icon: Monitor,
            },
            {
              label: "Schedule",
              href: "/event-manager/sessions/schedule",
              icon: Calendar,
            },
            {
              label: "Assignments",
              href: "/event-manager/sessions/assignments",
              icon: Users,
            },
          ],
        },
        {
          label: "Approvals",
          href: "/event-manager/approvals",
          icon: UserCheck,
          badge: "23",
          children: [
            {
              label: "Pending Requests",
              href: "/event-manager/approvals",
              icon: Clock,
            },
            {
              label: "Approved",
              href: "/event-manager/approvals/approved",
              icon: UserCheck,
            },
            {
              label: "Rejected",
              href: "/event-manager/approvals/rejected",
              icon: Eye,
            },
          ],
        },
        {
          label: "Venues",
          href: "/event-manager/venues",
          icon: MapPin,
          children: [
            {
              label: "All Venues",
              href: "/event-manager/venues",
              icon: MapPin,
            },
            {
              label: "Hall Management",
              href: "/event-manager/venues/halls",
              icon: Building,
            },
            { 
              label: "Equipment",
              href: "/event-manager/venues/equipment",
              icon: Settings,
            },
          ],
        },
        {
          label: "Certificates",
          href: "/event-manager/certificates",
          icon: Award,
          children: [
            {
              label: "Generate",
              href: "/event-manager/certificates/generate",
              icon: Award,
            },
            {
              label: "Templates",
              href: "/event-manager/certificates/templates",
              icon: FileText,
            },
            {
              label: "Download",
              href: "/event-manager/certificates/download",
              icon: Download,
            },
          ],
        },
        {
          label: "Reports",
          href: "/event-manager/reports",
          icon: BarChart3,
          children: [
            {
              label: "Event Reports",
              href: "/event-manager/reports",
              icon: BarChart3,
            },
            {
              label: "Analytics",
              href: "/event-manager/reports/analytics",
              icon: BarChart3,
            },
            {
              label: "Export Data",
              href: "/event-manager/reports/export",
              icon: Download,
            },
          ],
        },
      ],
      FACULTY: [
        {
          label: "My Profile",
          href: "/faculty/profile",
          icon: Users,
        },
        {
          label: "My Sessions",
          href: "/faculty/sessions",
          icon: Monitor,
          badge: "0",
        },
        {
          label: "View/Edit Documents",
          icon: FileText,
          action: "openDocumentsModal",
        },
        {
          label: "Travel & Stay",
          href: "/faculty/travel",
          icon: Plane,
          children: [
            { label: "Travel Details", href: "/faculty/travel", icon: Plane },
            {
              label: "Accommodation",
              href: "/faculty/travel/accommodation",
              icon: Hotel,
            },
          ],
        },
        // {
        // label: 'Schedule',
        // href: '/faculty/schedule',
        // icon: Calendar
        // },
        {
          label: "Certificates",
          href: "/faculty/certificates",
          icon: Award,
        },
      ],
      DELEGATE: [
        {
          label: "My Registration",
          href: "/delegate/registration",
          icon: UserCheck,
        },
        {
          label: "Event Schedule",
          href: "/delegate/schedule",
          icon: Calendar,
        },
        {
          label: "Sessions",
          href: "/delegate/sessions",
          icon: Monitor,
        },
        {
          label: "Attendance",
          href: "/delegate/attendance",
          icon: QrCode,
        },
        {
          label: "Certificates",
          href: "/delegate/certificates",
          icon: Award,
        },
        {
          label: "Feedback",
          href: "/delegate/feedback",
          icon: MessageSquare,
        },
      ],
      HALL_COORDINATOR: [
        {
          label: "My Halls",
          href: "/hall-coordinator/halls",
          icon: MapPin,
          badge: "2",
        },
        {
          label: "Today's Sessions",
          href: "/hall-coordinator/sessions",
          icon: Clock,
          badge: "6",
        },
        {
          label: "Attendance",
          href: "/hall-coordinator/attendance",
          icon: QrCode,
          children: [
            {
              label: "Mark Attendance",
              href: "/hall-coordinator/attendance/mark",
              icon: QrCode,
            },
            {
              label: "View Records",
              href: "/hall-coordinator/attendance/records",
              icon: Eye,
            },
          ],
        },
        {
          label: "Faculty Contact",
          href: "/hall-coordinator/faculty",
          icon: Users,
        },
        {
          label: "Issues",
          href: "/hall-coordinator/issues",
          icon: MessageSquare,
          badge: "1",
        },
        {
          label: "Live Updates",
          href: "/hall-coordinator/updates",
          icon: Bell,
        },
      ],
      SPONSOR: [
        {
          label: "Sponsorship Details",
          href: "/sponsor/details",
          icon: Building,
        },
        {
          label: "Events",
          href: "/sponsor/events",
          icon: Calendar,
        },
        {
          label: "Visibility",
          href: "/sponsor/visibility",
          icon: Eye,
        },
        {
          label: "Materials",
          href: "/sponsor/materials",
          icon: FileText,
        },
        {
          label: "Reports",
          href: "/sponsor/reports",
          icon: BarChart3,
        },
      ],
      VOLUNTEER: [
        {
          label: "My Tasks",
          href: "/volunteer/tasks",
          icon: Briefcase,
          badge: "5",
        },
        {
          label: "Schedule",
          href: "/volunteer/schedule",
          icon: Calendar,
        },
        {
          label: "Check-in",
          href: "/volunteer/checkin",
          icon: UserCheck,
        },
        {
          label: "Communication",
          href: "/volunteer/communication",
          icon: MessageSquare,
        },
        {
          label: "Resources",
          href: "/volunteer/resources",
          icon: FileText,
        },
      ],
      VENDOR: [
        {
          label: "Services",
          href: "/vendor/services",
          icon: ShoppingBag,
        },
        {
          label: "Bookings",
          href: "/vendor/bookings",
          icon: Calendar,
          badge: "12",
        },
        {
          label: "Deliveries",
          href: "/vendor/deliveries",
          icon: Briefcase,
        },
        {
          label: "Payments",
          href: "/vendor/payments",
          icon: BarChart3,
        },
        {
          label: "Support",
          href: "/vendor/support",
          icon: HelpCircle,
        },
      ],
    };

  return [...commonItems, ...roleSpecificItems[role]];
};

export function NavigationSidebar({
  userRole,
  userAvatar,
  className,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const [isCertificatesModalOpen, setIsCertificatesModalOpen] = useState(false);

  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const { data: session } = useSession();
  const facultyId = session?.user?.id;

  const navigationItems = getNavigationItems(userRole);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  // Hardened: ignore falsy/invalid hrefs
  const isItemActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Active if parent path is active or any child with a valid href is active
  const isParentActive = (item: NavigationItem) => {
    if (isItemActive(item.href)) return true;
    if (item.children?.length) {
      return item.children.some(
        (child) => child.href && isItemActive(child.href)
      );
    }
    return false;
  };

  // Click behavior:
  // - If item has children and sidebar is not collapsed:
  // - Toggle expand if chevron area or if no valid href
  // - If has valid href and user clicks row, navigate
  // - If collapsed, clicking row navigates if href exists; otherwise toggle
  const handleNavClick = (item: NavigationItem, e: React.MouseEvent) => {
    const hasChildren = !!item.children?.length;
    const hasHref = !!item.href;

    // Handle explicit actions first
  if (item.action === "openDocumentsModal") {
    e.preventDefault();
    setIsDocsModalOpen(true);
    return;
  }

    if (item.label === "Certificates") {
      e.preventDefault();
      setIsCertificatesModalOpen(true);
      return;
    }

    if (hasChildren && !isCollapsed && !hasHref) {
      e.preventDefault();
      toggleExpanded(item.label);
      return;
    }

    if (hasChildren && !isCollapsed && hasHref) {
      // Choose: navigate on click; expansion controlled by chevron click
      e.preventDefault();
      router.push(item.href!);
      return;
    }

    // Collapsed or leaf items
    if (hasHref) {
      e.preventDefault();
      router.push(item.href!);
      return;
    }

    // No href fallback: just toggle
    if (hasChildren) {
      e.preventDefault();
      toggleExpanded(item.label);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Conference</h2>
              <p className="text-xs text-muted-foreground">Management</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navigationItems.map((item) => {
          const active = isParentActive(item);
          return (
            <div key={item.label}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  isCollapsed && "justify-center"
                )}
                onClick={(e) => handleNavClick(item, e)}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />

                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>

                    {item.badge && (
                      <span className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {item.children && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedItems.includes(item.label) && "rotate-90"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(item.label);
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </div>

              {item.children &&
                !isCollapsed &&
                expandedItems.includes(item.label) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childActive = isItemActive(child.href);
                      return (
                        <div
                          key={child.label}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                            childActive
                              ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                          onClick={() => {
                            if (child.href) router.push(child.href);
                          }}
                          role="button"
                          aria-current={childActive ? "page" : undefined}
                        >
                          <child.icon className="h-3 w-3" />
                          <span>{child.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          );
        })}
      </nav>
      <Dialog
        open={isCertificatesModalOpen}
        onOpenChange={setIsCertificatesModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certificates</DialogTitle>
            <DialogDescription>No certificates issued</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setIsCertificatesModalOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {facultyId && (
        <FacultyDocumentsModal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
          facultyId={facultyId}
        />
      )}
    </div>
  );
}

interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export function MobileSidebar({
  isOpen,
  onCloseAction,
  ...props
}: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCloseAction}
      />
      <div className="fixed left-0 top-0 h-full">
        <NavigationSidebar {...props} />
      </div>
    </div>
  );
}
