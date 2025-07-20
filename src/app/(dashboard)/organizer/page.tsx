// src/app/(dashboard)/organizer/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { OrganizerLayout } from '@/components/dashboard/layout';

import { 
  useEvents, 
  useEventStats,
  useFacultyStats, 
  useRegistrationStats,
  useSessionStats,
  useAttendanceStats,
  useDashboardStats,
  useNotifications,
  useAuth
} from '@/hooks';

import { 
  Calendar, 
  Users, 
  Clock, 
  Award, 
  BarChart3,
  Plus,
  UserPlus,
  FileText,
  Settings,
  Bell,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();

  // Data fetching hooks
  const { data: events, isLoading: eventsLoading } = useEvents({ 
    limit: 10, 
    sortBy: 'updatedAt', 
    sortOrder: 'desc' 
  });
  
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: notifications } = useNotifications();
  
  // Get stats for first event (or could be made dynamic)
  const firstEventId = events?.data?.events?.[0]?.id;
  const { data: eventStats } = useEventStats(firstEventId);
  const { data: facultyStats } = useFacultyStats(firstEventId);
  const { data: registrationStats } = useRegistrationStats(firstEventId);
  const { data: sessionStats } = useSessionStats(firstEventId || '');
  const { data: attendanceStats } = useAttendanceStats(firstEventId);

  // Calculate summary stats
  const totalEvents = events?.data?.events?.length || 0;
  const activeEvents = events?.data?.events?.filter(e => e.status === 'ONGOING').length || 0;
  const publishedEvents = events?.data?.events?.filter(e => e.status === 'PUBLISHED').length || 0;
  const draftEvents = events?.data?.events?.filter(e => e.status === 'DRAFT').length || 0;

  // Recent activity from events
  const recentEvents = events?.data?.events?.slice(0, 5) || [];
  
  // Unread notifications
  const unreadNotifications = notifications?.data?.filter((n: any) => !n.read) || [];

  if (eventsLoading) {
    return (
      <OrganizerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Organizer'}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your conferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadNotifications.length > 0 && (
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                {unreadNotifications.length} new
              </Button>
            )}
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {activeEvents} active, {publishedEvents} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {facultyStats?.data?.totalFaculty || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {facultyStats?.data?.activeFaculty || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionStats?.data?.totalSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionStats?.data?.upcomingSessions || 0} upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrationStats?.data?.totalRegistrations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {registrationStats?.data?.pendingApprovals || 0} pending approval
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(event.startDate), 'MMM dd, yyyy')}
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          Updated {format(new Date(event.updatedAt), 'MMM dd')}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {event._count?.registrations || 0} registered • {event._count?.sessions || 0} sessions
                        </div>
                      </div>
                      <Badge 
                        variant={
                          event.status === 'PUBLISHED' ? 'success' :
                          event.status === 'ONGOING' ? 'default' :
                          event.status === 'COMPLETED' ? 'secondary' :
                          'outline'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No events created yet</p>
                  <Button className="mt-2" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Registration Rate</span>
                  <span className="text-sm font-medium">
                    {registrationStats?.data?.registrationRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${registrationStats?.data?.registrationRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Faculty Activation</span>
                  <span className="text-sm font-medium">
                    {facultyStats?.data?.activationRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${facultyStats?.data?.activationRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Session Completion</span>
                  <span className="text-sm font-medium">
                    {sessionStats?.data?.completionRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${sessionStats?.data?.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {registrationStats?.data?.approvedRegistrations || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {sessionStats?.data?.todaysSessions || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {registrationStats?.data?.pendingApprovals > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-orange-800">Registrations</h5>
                    <p className="text-xs text-orange-600">
                      {registrationStats.data.pendingApprovals} pending approval
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              )}

              {facultyStats?.data?.pendingInvitations > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">Invitations</h5>
                    <p className="text-xs text-blue-600">
                      {facultyStats.data.pendingInvitations} pending responses
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow Up
                  </Button>
                </div>
              )}

              {draftEvents > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-yellow-800">Draft Events</h5>
                    <p className="text-xs text-yellow-600">
                      {draftEvents} ready to publish
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Publish
                  </Button>
                </div>
              )}

              {/* All caught up state */}
              {(!registrationStats?.data?.pendingApprovals || registrationStats.data.pendingApprovals === 0) &&
               (!facultyStats?.data?.pendingInvitations || facultyStats.data.pendingInvitations === 0) &&
               draftEvents === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All caught up!</p>
                  <p className="text-xs mt-1">No pending tasks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Faculty
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Sessions
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Certificates
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Event Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </OrganizerLayout>
  );
}