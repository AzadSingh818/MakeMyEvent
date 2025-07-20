// src/app/(dashboard)/delegate/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { DelegateLayout } from '@/components/dashboard/layout';

import { useEvents } from '@/hooks/use-events';
import { useMyRegistrations, useRegistrationEligibility, useCreateRegistration } from '@/hooks/use-registrations';
import { useMyAttendance } from '@/hooks/use-attendance';
import { useTodaysSessions } from '@/hooks/use-sessions';
import { useAuth } from '@/hooks/use-auth';

import { 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  BookOpen,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  QrCode,
  Users,
  Ticket,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function DelegateDashboardPage() {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Data fetching hooks
  const { data: events, isLoading: eventsLoading } = useEvents({ 
    status: 'PUBLISHED',
    limit: 10,
    sortBy: 'startDate',
    sortOrder: 'asc'
  });
  
  const { data: myRegistrations, isLoading: registrationsLoading } = useMyRegistrations();
  const { data: myAttendance, isLoading: attendanceLoading } = useMyAttendance();
  const { data: todaysSessions, isLoading: todaysLoading } = useTodaysSessions();
  
  // Get eligibility for selected event
  const { data: eligibility } = useRegistrationEligibility(selectedEventId);

  // Mutations
  const createRegistration = useCreateRegistration();

  // Calculate stats
  const registeredEvents = myRegistrations?.data?.registrations || [];
  const approvedRegistrations = registeredEvents.filter(r => r.status === 'APPROVED');
  const pendingRegistrations = registeredEvents.filter(r => r.status === 'PENDING');
  const attendanceRate = myAttendance?.data?.attendanceRate || 0;
  const attendedSessions = myAttendance?.data?.attendedSessions || 0;
  const totalSessions = myAttendance?.data?.totalSessions || 0;

  // Available events to register for
  const availableEvents = events?.data?.events?.filter(event => 
    !registeredEvents.some(reg => reg.eventId === event.id && reg.status !== 'CANCELLED')
  ) || [];

  // Today's sessions for registered events
  const myTodaysSessions = todaysSessions?.data?.sessions?.filter(session =>
    approvedRegistrations.some(reg => reg.eventId === session.eventId)
  ) || [];

  // Handle event registration
  const handleRegister = (eventId: string) => {
    createRegistration.mutate({
      eventId,
      registrationData: {
        participantType: 'DELEGATE',
        certificateRequired: true,
        consentForPhotography: true,
        consentForMarketing: false
      }
    });
  };

  if (eventsLoading) {
    return (
      <DelegateLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </DelegateLayout>
    );
  }

  return (
    <DelegateLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user?.name || 'Delegate'}!
            </h1>
            <p className="text-muted-foreground">
              Discover conferences and manage your learning journey
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Events
            </Button>
            <Button variant="outline">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </Button>
          </div>
        </div>

        {/* Pending Registrations Alert */}
        {pendingRegistrations.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {pendingRegistrations.length} registration{pendingRegistrations.length > 1 ? 's' : ''} pending approval.
              You'll be notified once they are reviewed.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrationsLoading ? <LoadingSpinner size="sm" /> : approvedRegistrations.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingRegistrations.length} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysLoading ? <LoadingSpinner size="sm" /> : myTodaysSessions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {myTodaysSessions.filter(s => new Date(s.startTime) > new Date()).length} upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceLoading ? <LoadingSpinner size="sm" /> : `${attendanceRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {attendedSessions} of {totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Events</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableEvents.length}</div>
              <p className="text-xs text-muted-foreground">Open for registration</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : myTodaysSessions.length > 0 ? (
                <div className="space-y-4">
                  {myTodaysSessions.map((session) => {
                    const isCompleted = new Date(session.endTime) < new Date();
                    const isOngoing = new Date(session.startTime) <= new Date() && new Date(session.endTime) > new Date();
                    const isUpcoming = new Date(session.startTime) > new Date();

                    return (
                      <div key={session.id} className={`p-3 border rounded-lg ${
                        isCompleted ? 'bg-gray-50' :
                        isOngoing ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{session.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                              <MapPin className="h-3 w-3 ml-2 mr-1" />
                              {session.hall?.name}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs mr-2">
                                {session.sessionType}
                              </Badge>
                              <Users className="h-3 w-3 mr-1" />
                              {session._count?.speakers || 0} speakers
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            {isOngoing && (
                              <Badge variant="default" className="text-xs">
                                Live Now
                              </Badge>
                            )}
                            {isUpcoming && (
                              <Badge variant="outline" className="text-xs">
                                Upcoming
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions scheduled for today</p>
                  <p className="text-sm mt-1">Check your registered events for upcoming sessions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                My Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : registeredEvents.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {registeredEvents.map((registration) => (
                    <div key={registration.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium truncate">{registration.event?.name}</h5>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(registration.event?.startDate || ''), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <Badge 
                          variant={
                            registration.status === 'APPROVED' ? 'success' :
                            registration.status === 'PENDING' ? 'default' :
                            registration.status === 'REJECTED' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {registration.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {registration.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                          {registration.status}
                        </Badge>
                      </div>
                      {registration.status === 'APPROVED' && (
                        <div className="flex items-center mt-2 space-x-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            <QrCode className="h-3 w-3 mr-1" />
                            QR Code
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Ticket
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No registrations yet</p>
                  <Button className="mt-2" size="sm">Register for Event</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Available Events
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
              ) : availableEvents.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {availableEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{event.name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(event.startDate), 'MMM dd, yyyy')}
                            <MapPin className="h-3 w-3 ml-2 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              {event.eventType}
                            </Badge>
                            <Users className="h-3 w-3 mr-1" />
                            {event._count?.registrations || 0} registered
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleRegister(event.id)}
                          disabled={createRegistration.isPending}
                        >
                          {createRegistration.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Register
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No events available for registration</p>
                  <p className="text-sm mt-1">Check back later for new events</p>
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
                <BookOpen className="h-4 w-4 mr-2" />
                Browse All Events
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                My Schedule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Award className="h-4 w-4 mr-2" />
                My Certificates
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                QR Codes
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DelegateLayout>
  );
}