// src/app/(dashboard)/hall-coordinator/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { HallCoordinatorLayout } from '@/components/dashboard/layout';

import { useTodaysSessions, useOngoingSessions } from '@/hooks/use-sessions';
import { useSessionAttendance, useMarkAttendance, useRealtimeAttendanceCount } from '@/hooks/use-attendance';
import { useAuth } from '@/hooks/use-auth';

import { 
  MapPin, 
  Clock, 
  Users, 
  CheckSquare, 
  AlertCircle,
  Camera,
  QrCode,
  Phone,
  MessageSquare,
  Activity,
  UserCheck,
  Timer,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { AwaitedReactNode, JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useState } from 'react';

export default function HallCoordinatorDashboardPage() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Data fetching hooks
  const { data: todaysSessions, isLoading: todaysLoading } = useTodaysSessions();
  const { data: ongoingSessions, isLoading: ongoingLoading } = useOngoingSessions();
  
  // Get attendance for selected session
  const { data: sessionAttendance, isLoading: attendanceLoading } = useSessionAttendance(selectedSessionId);
  const { data: attendanceCount } = useRealtimeAttendanceCount(selectedSessionId);

  // Mutations
  const markAttendance = useMarkAttendance();

  // Filter sessions for assigned halls (this would typically come from user's hall assignments)
  const assignedSessions = todaysSessions?.data?.sessions || [];
  const currentSessions = ongoingSessions?.data?.sessions || [];

  // Calculate stats
  const totalSessionsToday = assignedSessions.length;
  const completedSessions = assignedSessions.filter(s => new Date(s.endTime) < new Date()).length;
  const ongoingSessionsCount = currentSessions.length;
  const upcomingSessionsCount = assignedSessions.filter(s => new Date(s.startTime) > new Date()).length;

  // Quick attendance marking
  const handleQuickAttendance = (sessionId: string, userId: string) => {
    markAttendance.mutate({
      sessionId,
      userId,
      method: 'MANUAL'
    });
  };

  if (todaysLoading) {
    return (
      <HallCoordinatorLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </HallCoordinatorLayout>
    );
  }

  return (
    <HallCoordinatorLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hall Management Center
            </h1>
            <p className="text-muted-foreground">
              Monitor and coordinate today's sessions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="destructive">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Contact
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>

        {/* Real-time Status */}
        {ongoingSessionsCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">
                {ongoingSessionsCount} session{ongoingSessionsCount > 1 ? 's' : ''} currently ongoing
              </h3>
            </div>
            <p className="text-sm text-green-600 mt-1">
              All systems operational. Monitor attendance and assist participants as needed.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessionsToday}</div>
              <p className="text-xs text-muted-foreground">
                {completedSessions} completed, {upcomingSessionsCount} upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ongoingLoading ? <LoadingSpinner size="sm" /> : ongoingSessionsCount}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Marked</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceCount?.data?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSessionId ? 'Current session' : 'Select session to view'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Halls</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(assignedSessions.map(s => s.hall?.name).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">Under your management</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current/Ongoing Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ongoingLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : currentSessions.length > 0 ? (
                <div className="space-y-4">
                  {currentSessions.map((session: { id: string | number | bigint | ((prevState: string) => string) | null | undefined; title: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; startTime: string | number | Date; endTime: string | number | Date; hall: { name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }; _count: { attendanceRecords: any; speakers: any; }; }) => (
                    <div key={typeof session.id === 'string' || typeof session.id === 'number' || typeof session.id === 'bigint' ? session.id : String(session.id)} className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800">{session.title}</h4>
                          <div className="flex items-center text-sm text-green-600 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                            <MapPin className="h-3 w-3 ml-2 mr-1" />
                            {session.hall?.name}
                          </div>
                          <div className="flex items-center text-sm text-green-600 mt-1">
                            <Users className="h-3 w-3 mr-1" />
                            {session._count?.attendanceRecords || 0} attended • {session._count?.speakers || 0} speakers
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedSessionId(session.id != null ? String(session.id) : '')}
                            variant={selectedSessionId === session.id ? "default" : "outline"}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                          <Button size="sm" variant="outline">
                            <QrCode className="h-4 w-4 mr-1" />
                            QR Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions currently active</p>
                  <p className="text-sm mt-1">Next session starts at {
                    assignedSessions.find(s => new Date(s.startTime) > new Date()) ? 
                    format(new Date(assignedSessions.find(s => new Date(s.startTime) > new Date())!.startTime), 'HH:mm') : 
                    'N/A'
                  }</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSessionId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Real-time Count</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {attendanceCount?.data?.count || 0}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => {/* Open QR scanner */}}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan QR Code
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => {/* Open manual attendance */}}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Mark Manually
                    </Button>
                  </div>

                  {attendanceLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      <h5 className="text-sm font-medium">Recent Attendees</h5>
                      {sessionAttendance?.data?.attendanceRecords?.slice(0, 5).map((record) => (
                        <div key={record.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">{record.user?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {record.method}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an active session to manage attendance</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : assignedSessions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {assignedSessions.map((session) => {
                    const isCompleted = new Date(session.endTime) < new Date();
                    const isOngoing = new Date(session.startTime) <= new Date() && new Date(session.endTime) > new Date();
                    const isUpcoming = new Date(session.startTime) > new Date();

                    return (
                      <div key={session.id} className={`p-3 border rounded-lg ${
                        isCompleted ? 'bg-gray-50 border-gray-200' :
                        isOngoing ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{session.title}</h5>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                              <MapPin className="h-3 w-3 ml-2 mr-1" />
                              {session.hall?.name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isCompleted && (
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            )}
                            {isOngoing && (
                              <Badge variant="default" className="text-xs">
                                Ongoing
                              </Badge>
                            )}
                            {isUpcoming && (
                              <Badge variant="outline" className="text-xs">
                                Upcoming
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
                  <p>No sessions assigned for today</p>
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
                <Camera className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Faculty
              </Button>
              <Button className="w-full justify-start" variant="destructive">
                <Phone className="h-4 w-4 mr-2" />
                Emergency
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </HallCoordinatorLayout>
  );
}