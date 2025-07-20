// src/app/(dashboard)/faculty/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { FacultyLayout } from '@/components/dashboard/layout';

import { useMyFacultyProfile, useUploadCV } from '@/hooks/use-faculty';
import { useUserSessions } from '@/hooks/use-sessions';
import { useMyAttendance } from '@/hooks/use-attendance';
import { useMyRegistrations } from '@/hooks/use-registrations';
import { useAuth, useDashboardStats, useNotifications } from '@/hooks/use-auth';

import { Calendar, Clock, MapPin, Upload, FileText, Users, Award, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data fetching hooks
  const { data: profile, isLoading: profileLoading } = useMyFacultyProfile();
  const { data: sessions, isLoading: sessionsLoading } = useUserSessions(user?.id);
  const { data: attendance, isLoading: attendanceLoading } = useMyAttendance();
  const { data: registrations, isLoading: registrationsLoading } = useMyRegistrations();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: notifications } = useNotifications();

  // Mutations
  const uploadCV = useUploadCV();

  // Handle CV upload
  const handleCVUpload = () => {
    if (selectedFile && user?.id) {
      uploadCV.mutate({ facultyId: user.id, file: selectedFile });
      setSelectedFile(null);
    }
  };

  // Get upcoming sessions
  const upcomingSessions = sessions?.data?.sessions?.filter(
    session => new Date(session.session.startTime) > new Date()
  ).slice(0, 3) || [];

  // Get recent events
  const recentEvents = registrations?.data?.registrations?.slice(0, 3) || [];

  // Profile completion percentage
  const getProfileCompleteness = () => {
    if (!profile?.data) return 0;
    const fields = [
      'phone', 'designation', 'institution', 'specialization', 
      'bio', 'experience', 'cv'
    ];
    const completed = fields.filter(field => profile.data[field as keyof typeof profile.data]).length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileCompleteness = getProfileCompleteness();

  if (profileLoading) {
    return (
      <FacultyLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Faculty'}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your academic activities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {notifications?.data?.filter((n: any) => !n.read).length > 0 && (
              <Badge variant="destructive">
                {notifications.data.filter((n: any) => !n.read).length} new
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Completeness Alert */}
        {profileCompleteness < 80 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your profile is {profileCompleteness}% complete. 
              <Button variant="link" className="p-0 h-auto ml-1">
                Complete your profile
              </Button> to get more opportunities.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionsLoading ? <LoadingSpinner size="sm" /> : upcomingSessions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Next session in {upcomingSessions[0] ? 
                  format(new Date(upcomingSessions[0].session.startTime), 'dd MMM') : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Registered</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrationsLoading ? <LoadingSpinner size="sm" /> : recentEvents.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {recentEvents.filter(r => r.status === 'APPROVED').length} approved
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
                {attendanceLoading ? <LoadingSpinner size="sm" /> : 
                  `${attendance?.data?.attendanceRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {attendance?.data?.attendedSessions || 0} of {attendance?.data?.totalSessions || 0} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileCompleteness}%</div>
              <p className="text-xs text-muted-foreground">Profile completion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((sessionSpeaker) => (
                    <div key={sessionSpeaker.sessionId} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{sessionSpeaker.session.title}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(sessionSpeaker.session.startTime), 'MMM dd, yyyy • HH:mm')}
                          {sessionSpeaker.session.hall && (
                            <>
                              <MapPin className="h-3 w-3 ml-2 mr-1" />
                              {sessionSpeaker.session.hall.name}
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={sessionSpeaker.role === 'SPEAKER' ? 'default' : 'secondary'}>
                        {sessionSpeaker.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {profile?.data?.profileImage ? (
                    <img src={profile.data.profileImage} alt="Profile" className="w-12 h-12 rounded-full" />
                  ) : (
                    <Users className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{profile?.data?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {profile?.data?.designation} • {profile?.data?.institution}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Profile Completeness</span>
                  <span className="text-sm font-medium">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${profileCompleteness}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CV Status</span>
                  {profile?.data?.cv ? (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>

                {!profile?.data?.cv && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <Button 
                      onClick={handleCVUpload}
                      disabled={!selectedFile || uploadCV.isPending}
                      size="sm" 
                      className="w-full"
                    >
                      {uploadCV.isPending ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload CV
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((registration) => (
                    <div key={registration.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{registration.event?.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(registration.event?.startDate || ''), 'MMM dd, yyyy')}
                          <MapPin className="h-3 w-3 ml-2 mr-1" />
                          {registration.event?.location}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          registration.status === 'APPROVED' ? 'success' :
                          registration.status === 'PENDING' ? 'default' :
                          registration.status === 'REJECTED' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {registration.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No event registrations</p>
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
                <FileText className="h-4 w-4 mr-2" />
                Upload Presentation
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Award className="h-4 w-4 mr-2" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
}