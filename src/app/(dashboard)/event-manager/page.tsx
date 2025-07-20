// src/app/(dashboard)/event-manager/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';

import { useEvents } from '@/hooks/use-events';
import { useSessions, useTodaysSessions, useOngoingSessions } from '@/hooks/use-sessions';
import { usePendingRegistrations, useRegistrationStats } from '@/hooks/use-registrations';
import { useFacultyStats } from '@/hooks/use-faculty';
import { useAuth, useDashboardStats } from '@/hooks/use-auth';

import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  UserPlus,
  Settings,
  FileText,
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

export default function EventManagerDashboardPage() {
  const { user } = useAuth();

  // Data fetching hooks
  const { data: events, isLoading: eventsLoading } = useEvents({ 
    limit: 5, 
    sortBy: 'startDate', 
    sortOrder: 'asc' 
  });
  
  const { data: todaysSessions, isLoading: todaysLoading } = useTodaysSessions();
  const { data: ongoingSessions, isLoading: ongoingLoading } = useOngoingSessions();
  const { data: pendingRegistrations, isLoading: pendingLoading } = usePendingRegistrations();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  
  // Get stats for first event (or could be made dynamic)
  const firstEventId = events?.data?.events?.[0]?.id;
  const { data: registrationStats } = useRegistrationStats(firstEventId);
  const { data: facultyStats } = useFacultyStats(firstEventId);

  // Quick stats calculations
  const totalEvents = events?.data?.events?.length || 0;
  const activeEvents = events?.data?.events?.filter(e => e.status === 'ONGOING').length || 0;
  const upcomingEvents = events?.data?.events?.filter(e => 
    e.status === 'PUBLISHED' && new Date(e.startDate) > new Date()
  ).length || 0;
  
  const todaysSessionsCount = todaysSessions?.data?.sessions?.length || 0;
  const ongoingSessionsCount = ongoingSessions?.data?.sessions?.length || 0;
  const pendingCount = pendingRegistrations?.data?.registrations?.length || 0;

  if (eventsLoading) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Event Management Hub
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage your conference operations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Faculty
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {activeEvents} active, {upcomingEvents} upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysLoading ? <LoadingSpinner size="sm" /> : todaysSessionsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {ongoingLoading ? '...' : `${ongoingSessionsCount} currently ongoing`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingLoading ? <LoadingSpinner size="sm" /> : pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">Registrations to review</p>
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (events?.data?.events?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {events?.data?.events?.map((event) => (
                    <div key={event.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(event.startDate), 'MMM dd, yyyy')}
                          <MapPin className="h-3 w-3 ml-2 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {event._count?.sessions || 0} sessions • {event._count?.registrations || 0} registered
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
                  <Button className="mt-2" size="sm">Create First Event</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (todaysSessions?.data?.sessions?.length ?? 0) > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {todaysSessions?.data?.sessions?.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium truncate">{session.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {session.sessionType}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                        {session.hall && (
                          <>
                            <MapPin className="h-3 w-3 ml-2 mr-1" />
                            {session.hall.name}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions today</p>
                </div>
              )}
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
              {pendingCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-orange-800">Registration Approvals</h5>
                    <p className="text-xs text-orange-600">{pendingCount} pending reviews</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              )}

              {facultyStats?.data?.pendingInvitations > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">Faculty Invitations</h5>
                    <p className="text-xs text-blue-600">{facultyStats.data.pendingInvitations} pending responses</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow Up
                  </Button>
                </div>
              )}

              {pendingCount === 0 && (facultyStats?.data?.pendingInvitations || 0) === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistics
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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {registrationStats?.data?.approvedRegistrations || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {facultyStats?.data?.activeFaculty || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Faculty</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Invite Faculty
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Registrations
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </EventManagerLayout>
  );
}