// src/app/(dashboard)/faculty/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { FacultyLayout } from '@/components/dashboard/layout';
import { useRouter } from 'next/navigation';

import { useMyFacultyProfile, useUploadCV } from '@/hooks/use-faculty';
import { useUserSessions, useTodaysSessions, useUpcomingSessions } from '@/hooks/use-sessions';
import { useMyAttendance } from '@/hooks/use-attendance';
import { useMyRegistrations } from '@/hooks/use-registrations';
import { useAuth, useDashboardStats, useNotifications } from '@/hooks/use-auth';

import { 
  Calendar, 
  Clock,  
  Users, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Upload,
  FileText,
  MapPin,
  Activity,
  ExternalLink,
  ArrowRight,
  Plus,
  Mail,
  MessageSquare,
  Award,
  Download,
  QrCode,
  Hotel,
  Plane,
  Bell,
  Eye,
  Target,
  Zap,
  Globe,
  Star,
  Shield,
  User,
  Presentation,
  Coffee,
  Car,
  Wifi,
  Building,
  Phone,
  Edit,
  Send,
  BookOpen,
  Briefcase,
  UserCheck,
  X,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useRef } from 'react';

import {
  TravelInfoModal,
  UploadPresentationModal,
  AccommodationModal,
  CertificateModal,
  FeedbackModal,
  ContactModal
} from '@/src/app/modals/FacultyModals';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 🆕 Presentation upload states
  const [presentationFiles, setPresentationFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  // Faculty-specific data fetching
  const { data: profile, isLoading: profileLoading } = useMyFacultyProfile();
  const { data: mySessions, isLoading: sessionsLoading } = useUserSessions(user?.id);
  const { data: todaysSessions, isLoading: todaysLoading } = useTodaysSessions();
  const { data: upcomingSessions, isLoading: upcomingLoading } = useUpcomingSessions();
  const { data: myAttendance, isLoading: attendanceLoading } = useMyAttendance();
  const { data: myRegistrations, isLoading: registrationsLoading } = useMyRegistrations();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();

  // Mutations
  const uploadCV = useUploadCV();

  // Navigation functions
  const handleViewProfile = () => router.push('/faculty/profile');
  const handlePresentations = () => router.push('/faculty/presentations');
  const handleSchedule = () => router.push('/faculty/schedule');
  const handleCertificates = () => router.push('/faculty/certificates');
  const handleSessionClick = (sessionId: string) => router.push(`/faculty/sessions/${sessionId}`);

  // Handle CV upload
  const handleCVUpload = () => {
    if (selectedFile && user?.id) {
      uploadCV.mutate({ facultyId: user.id, file: selectedFile });
      setSelectedFile(null);
    }
  };

  // 🆕 Handle presentation file selection
  const handlePresentationFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // File type validation
      const allowedTypes = [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only PPT, PPTX, PDF, DOC, DOCX allowed.`);
        return;
      }

      // File size validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum size is 50MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setUploadErrors(errors);
    } else {
      setUploadErrors([]);
    }

    setPresentationFiles(validFiles);
  };

  // 🆕 Handle presentation upload
  const handlePresentationUpload = async () => {
    if (presentationFiles.length === 0 || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess([]);
    setUploadErrors([]);

    try {
      const uploadPromises = presentationFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('facultyId', user.id);
        formData.append('title', file.name.split('.')[0]); // Use filename as title
        formData.append('sessionId', ''); // Optional: associate with session

        const response = await fetch('/api/faculty/presentations/upload', {
          method: 'POST',
          body: formData,
        });

        // Update progress
        setUploadProgress(((index + 1) / presentationFiles.length) * 100);

        if (response.ok) {
          const result = await response.json();
          return { success: true, fileName: file.name, data: result };
        } else {
          const error = await response.json();
          return { success: false, fileName: file.name, error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const successFiles = results.filter(r => r.success).map(r => r.fileName);
      const errorFiles = results.filter(r => !r.success).map(r => `${r.fileName}: ${r.error}`);

      setUploadSuccess(successFiles);
      setUploadErrors(errorFiles);

      if (successFiles.length > 0) {
        // Clear selected files on success
        setPresentationFiles([]);
        if (presentationInputRef.current) {
          presentationInputRef.current.value = '';
        }
        
        // Refresh profile data to show updated presentations
        // You might want to call a refetch function here
      }

    } catch (error) {
      setUploadErrors(['Upload failed. Please try again.']);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 🆕 Remove selected file
  const removeSelectedFile = (index: number) => {
    setPresentationFiles(files => files.filter((_, i) => i !== index));
  };

  // 🆕 Clear all messages
  const clearMessages = () => {
    setUploadSuccess([]);
    setUploadErrors([]);
  };

  // Calculate faculty-specific statistics
  const mySessionsCount = mySessions?.data?.sessions?.length || 0;
  const todaysSessionsCount = todaysSessions?.data?.sessions?.filter(s => 
    s.speakers?.some(speaker => speaker.userId === user?.id)
  ).length || 0;
  const upcomingSessionsCount = upcomingSessions?.data?.sessions?.filter(s => 
    s.speakers?.some(speaker => speaker.userId === user?.id)
  ).length || 0;
  
  const registeredEvents = myRegistrations?.data?.registrations?.length || 0;
  const attendanceRate = myAttendance?.data?.attendanceRate || 0;
  const totalPresentations = profile?.data?.presentations?.length || 0;
  const unreadNotifications = notifications?.data?.notifications?.filter(n => !n.readAt).length || 0;

  // Profile completion percentage
  const profileFields = [
    profile?.data?.bio,
    profile?.data?.institution,
    profile?.data?.expertise,
    profile?.data?.cv,
    profile?.data?.photo
  ];
  const completedFields = profileFields.filter(field => field).length;
  const profileCompletionRate = Math.round((completedFields / profileFields.length) * 100);

  const userName = profile?.data?.user?.name || user?.name || 'Faculty'
  const userEmail = profile?.data?.user?.email || user?.email || 'faculty@example.com'

  // Get upcoming sessions for faculty
  const myUpcomingSessions = upcomingSessions?.data?.sessions?.filter(session => 
    session.speakers?.some(speaker => speaker.userId === user?.id)
  ) || [];

  // Get today's sessions for faculty
  const myTodaysSessions = todaysSessions?.data?.sessions?.filter(session => 
    session.speakers?.some(speaker => speaker.userId === user?.id)
  ) || [];

  if (profileLoading || sessionsLoading) {
    return (
      <FacultyLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {userName}
            </h1>
            <p className="text-muted-foreground">
              Your academic conference participation hub
            </p>
            {profile?.data?.institution && (
              <p className="text-sm text-blue-600 font-medium">
                {profile.data.institution}
              </p>
            )}
          </div>
        </div>

        {/* Profile Completion Alert */}
        {profileCompletionRate < 80 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your profile is {profileCompletionRate}% complete. 
              <Button variant="link" className="p-0 ml-1 h-auto" onClick={handleViewProfile}>
                Complete your profile
              </Button> to enhance your conference experience.
            </AlertDescription>
          </Alert>
        )}

        {/* Notifications Alert */}
        {unreadNotifications > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {unreadNotifications} new notifications from organizers.
              <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => router.push('/faculty/notifications')}>
                View all
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 🆕 Upload Success/Error Messages */}
        {(uploadSuccess.length > 0 || uploadErrors.length > 0) && (
          <div className="space-y-2">
            {uploadSuccess.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      Successfully uploaded: {uploadSuccess.join(', ')}
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearMessages}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {uploadErrors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      Upload errors: {uploadErrors.join(', ')}
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearMessages}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Faculty Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* My Sessions */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Sessions</CardTitle>
              <Presentation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mySessionsCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">Today: {todaysSessionsCount}</span>
                  <span className="text-blue-600">Upcoming: {upcomingSessionsCount}</span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                Active speaker
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewProfile}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileCompletionRate}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    profileCompletionRate >= 80 ? 'bg-green-500' : 
                    profileCompletionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${profileCompletionRate}%` }}
                ></div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedFields}/5 sections completed
              </div>
            </CardContent>
          </Card>

          {/* Documents & Presentations */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handlePresentations}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPresentations}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Upload className="h-3 w-3 mr-1" />
                Presentations uploaded
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-green-500" />
                {profile?.data?.cv ? 'CV uploaded' : 'CV pending'}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/faculty/attendance')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Target className="h-3 w-3 mr-1" />
                Conference participation
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                {registeredEvents} events registered
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* My Sessions & Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  My Speaking Schedule
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSchedule}>
                    <Calendar className="h-3 w-3 mr-1" />
                    Full Schedule
                  </Button>
                </div>
              </div>
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
              ) : myUpcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {myUpcomingSessions.slice(0, 4).map((session) => {
                    const myRole = session.speakers?.find(s => s.userId === user?.id)?.role;
                    return (
                      <div 
                        key={session.id} 
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSessionClick(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{session.title}</h4>
                            <Badge 
                              variant={
                                myRole === 'SPEAKER' ? 'default' :
                                myRole === 'MODERATOR' ? 'secondary' :
                                myRole === 'CHAIRPERSON' ? 'destructive' :
                                'outline'
                              }
                              className="ml-2"
                            >
                              {myRole}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(session.startTime), 'MMM dd, yyyy')}
                            <Clock className="h-3 w-3 ml-3 mr-1" />
                            {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.hall?.name || 'Venue TBA'}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {session.sessionType}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No upcoming sessions</h3>
                  <p className="text-sm mb-4">Your speaking schedule will appear here</p>
                  <Button variant="outline" onClick={() => router.push('/faculty/contact')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Organizers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions for Faculty */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Faculty Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 🆕 Updated Upload Presentations Section */}
              <div className="space-y-3">
                <input
                  ref={presentationInputRef}
                  type="file"
                  accept=".ppt,.pptx,.pdf,.doc,.docx"
                  multiple
                  onChange={handlePresentationFileSelect}
                  className="hidden"
                  id="presentation-upload"
                />
                <label htmlFor="presentation-upload">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Presentations
                    </span>
                  </Button>
                </label>

                {/* Selected files display */}
                {presentationFiles.length > 0 && (
                  <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-blue-800">Selected Files ({presentationFiles.length})</h5>
                      <Button size="sm" variant="outline" onClick={() => setPresentationFiles([])}>
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {presentationFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeSelectedFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handlePresentationUpload}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <LoadingSpinner className="h-3 w-3 mr-2" />
                          Uploading... {Math.round(uploadProgress)}%
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* CV Upload block - unchanged */}
              {profile?.data?.cv ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-green-800">CV Uploaded</h5>
                    <p className="text-xs text-green-600">Your CV is on file</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border rounded-lg bg-red-50 border-red-200">
                  <div>
                    <h5 className="font-medium text-red-800">CV Required</h5>
                    <p className="text-xs text-red-600">Please upload your updated CV</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload">
                    <Button size="sm" variant="outline" asChild>
                      <span>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </span>
                    </Button>
                  </label>
                  {selectedFile && (
                    <Button 
                      size="sm" 
                      onClick={handleCVUpload}
                      disabled={uploadCV.isLoading}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Submit
                    </Button>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
              >
                <Plane className="h-4 w-4 mr-2" />
                Travel Information
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
              >
                <Hotel className="h-4 w-4 mr-2" />
                Accommodation Details
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleCertificates}
              >
                <Award className="h-4 w-4 mr-2" />
                Download Certificates
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
}