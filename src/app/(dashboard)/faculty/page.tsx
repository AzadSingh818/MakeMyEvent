// src/app/(dashboard)/faculty/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/loading";
import { FacultyLayout } from "@/components/dashboard/layout";
import { useRouter } from "next/navigation";
import FeedbackModal from "@/app/modals/Feedback";
import ContactSupportModal from "@/app/modals/contact-support";

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
  Bed,
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
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useRef } from "react";

import { useMyFacultyProfile } from "@/hooks/use-faculty";
import {
  useUserSessions,
  useTodaysSessions,
  useUpcomingSessions,
} from "@/hooks/use-sessions";
import { useMyAttendance } from "@/hooks/use-attendance";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useAuth, useNotifications } from "@/hooks/use-auth";

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // PRESENTATION UPLOAD (MULTI)
  const [presentationFiles, setPresentationFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  // CV UPLOAD (SINGLE)
  const [cvFile, setCVFile] = useState<File | null>(null);
  const [cvIsUploading, setCvIsUploading] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [cvUploadSuccess, setCvUploadSuccess] = useState<string | null>(null);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  //modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);

  // DATA FETCHING
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useMyFacultyProfile();
  const { data: mySessions, isLoading: sessionsLoading } = useUserSessions(
    user?.id
  );
  const { data: todaysSessions } = useTodaysSessions();
  const { data: upcomingSessions } = useUpcomingSessions();
  const { data: myAttendance } = useMyAttendance();
  const { data: myRegistrations } = useMyRegistrations();
  const { data: notifications } = useNotifications();

  // NAVIGATION
  const handleViewProfile = () => router.push("/faculty/profile");
  const handlePresentations = () => router.push("/faculty/presentations");
  const handleSchedule = () => router.push("/faculty/schedule");
  const handleCertificates = () => router.push("/faculty/certificates");
  const handleSessionClick = (sessionId: string) =>
    router.push(`/faculty/sessions/${sessionId}`);

  // PRESENTATION HANDLERS
  const handlePresentationFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];
    const allowedTypes = [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Invalid file type. Only PPT, PPTX, PDF, DOC, DOCX allowed.`
        );
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum size is 50MB.`);
        return;
      }
      validFiles.push(file);
    });
    if (errors.length > 0) setUploadErrors(errors);
    else setUploadErrors([]);
    setPresentationFiles(validFiles);
  };

  const handlePresentationUpload = async () => {
    if (presentationFiles.length === 0 || !user?.id) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess([]);
    setUploadErrors([]);
    try {
      const uploadPromises = presentationFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("facultyId", user.id);
        formData.append("title", file.name.split(".")[0] || file.name);
        formData.append("sessionId", "");
        const response = await fetch("/api/faculty/presentations/upload", {
          method: "POST",
          body: formData,
        });
        setUploadProgress(((index + 1) / presentationFiles.length) * 100);
        if (response.ok) {
          return { success: true, fileName: file.name };
        } else {
          const error = await response.json();
          return { success: false, fileName: file.name, error: error.message };
        }
      });
      const results = await Promise.all(uploadPromises);
      const successFiles = results
        .filter((r) => r.success)
        .map((r) => r.fileName);
      const errorFiles = results
        .filter((r) => !r.success)
        .map((r) => `${r.fileName}: ${r.error}`);
      setUploadSuccess(successFiles);
      setUploadErrors(errorFiles);
      if (successFiles.length > 0) {
        setPresentationFiles([]);
        if (presentationInputRef.current)
          presentationInputRef.current.value = "";
        // Optional: refetch faculty profile
      }
    } catch {
      setUploadErrors(["Upload failed. Please try again."]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removePresentationFile = (index: number) => {
    setPresentationFiles((files) => files.filter((_, i) => i !== index));
  };

  // For presentation alerts (success/error)
  const clearPresentationMessages = () => {
    setUploadSuccess([]);
    setUploadErrors([]);
  };

  // CV HANDLERS
  const handleCVFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCVFile(null);
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setCvUploadError("Invalid file type. Only PDF, DOC, DOCX allowed.");
      setCVFile(null);
      if (cvInputRef.current) cvInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvUploadError("File too large. Max 10MB.");
      setCVFile(null);
      if (cvInputRef.current) cvInputRef.current.value = "";
      return;
    }
    setCVFile(file);
    setCvUploadError(null);
  };

  const handleCVUpload = async () => {
    if (!cvFile || !user?.id) return;
    setCvIsUploading(true);
    setCvProgress(0);
    setCvUploadError(null);
    setCvUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", cvFile);
      formData.append("facultyId", user.id);
      const response = await fetch("/api/faculty/cv/upload", {
        method: "POST",
        body: formData,
      });
      setCvProgress(100);
      if (response.ok) {
        const result = await response.json();
        setCvUploadSuccess(result.data.fileName);
        setCVFile(null);
        if (cvInputRef.current) cvInputRef.current.value = "";
        // The critical line:
        refetchProfile && refetchProfile();
      } else {
        const error = await response.json();
        setCvUploadError(error.error || error.message || "Upload failed!");
        setCVFile(null);
        if (cvInputRef.current) cvInputRef.current.value = "";
      }
    } catch {
      setCvUploadError("Upload failed. Please try again.");
      setCVFile(null);
      if (cvInputRef.current) cvInputRef.current.value = "";
    } finally {
      setCvIsUploading(false);
      setCvProgress(0);
    }
  };

  const clearCVMessages = () => {
    setCvUploadSuccess(null);
    setCvUploadError(null);
  };

  // STATS
  const mySessionsCount = mySessions?.data?.sessions?.length || 0;
  const todaysSessionsCount =
    todaysSessions?.data?.sessions?.filter((s) =>
      s.speakers?.some((speaker) => speaker.userId === user?.id)
    ).length || 0;
  const upcomingSessionsCount =
    upcomingSessions?.data?.sessions?.filter((s) =>
      s.speakers?.some((speaker) => speaker.userId === user?.id)
    ).length || 0;
  const registeredEvents = myRegistrations?.data?.registrations?.length || 0;
  const attendanceRate = myAttendance?.data?.attendanceRate || 0;
  const totalPresentations = profile?.data?.presentations?.length || 0;

  const hasCV = !!profile?.data?.cv;
  const totalDocuments = totalPresentations + (hasCV ? 1 : 0);

  const unreadNotifications =
    notifications?.data?.notifications?.filter((n) => !n.readAt).length || 0;
  const profileFields = [
    profile?.data?.bio,
    profile?.data?.institution,
    profile?.data?.expertise,
    profile?.data?.cv,
    profile?.data?.photo,
  ];
  const completedFields = profileFields.filter((field) => field).length;
  const profileCompletionRate = Math.round(
    (completedFields / profileFields.length) * 100
  );
  const userName = profile?.data?.user?.name || user?.name || "Faculty";
  const userEmail =
    profile?.data?.user?.email || user?.email || "faculty@example.com";
  const myUpcomingSessions =
    upcomingSessions?.data?.sessions?.filter((session) =>
      session.speakers?.some((speaker) => speaker.userId === user?.id)
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
    <FacultyLayout userName={userName} userEmail={userEmail} headerStats={[
    { label: "My Sessions", value: mySessionsCount, color: "bg-blue-500" },
    { label: "Presentations", value: totalPresentations, color: "bg-green-500" },
    { label: "CV", value: hasCV ? "Yes" : "No", color: hasCV ? "bg-green-500" : "bg-red-500" },
  ]}
>
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

        {/* Notifications Alert */}
        {unreadNotifications > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {unreadNotifications} new notifications from organizers.
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => router.push("/faculty/notifications")}
              >
                View all
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Presentation Upload Errors/Success */}
        {(uploadSuccess.length > 0 || uploadErrors.length > 0) && (
          <div className="space-y-2">
            {uploadSuccess.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>Successfully uploaded: {uploadSuccess.join(", ")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearPresentationMessages}
                    >
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
                    <div>Upload errors: {uploadErrors.join(", ")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearPresentationMessages}
                    >
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
          {/* My Sessions Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Sessions</CardTitle>
              <Presentation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mySessionsCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">
                    Today: {todaysSessionsCount}
                  </span>
                  <span className="text-blue-600">
                    Upcoming: {upcomingSessionsCount}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                Active speaker
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewProfile}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Accommodation & Travel Status
              </CardTitle>
              <Hotel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* Accommodation Status */}
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Bed className="h-3 w-3 mr-1 text-purple-600" />
                Accommodation:{" "}
                {profile?.data?.accommodations &&
                profile.data.accommodations.length > 0 ? (
                  <span className="ml-1 text-green-600 font-medium">
                    Provided
                  </span>
                ) : (
                  <span className="ml-1 text-red-500 font-medium">
                    Not Provided
                  </span>
                )}
              </div>

              {/* Travel Status */}
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Plane className="h-3 w-3 mr-1 text-blue-600" />
                Travel Details:{" "}
                {profile?.data?.travelDetails &&
                profile.data.travelDetails.length > 0 ? (
                  <span className="ml-1 text-green-600 font-medium">
                    Provided
                  </span>
                ) : (
                  <span className="ml-1 text-red-500 font-medium">
                    Not Provided
                  </span>
                )}
              </div>
              {/* You can add more info or a "Complete/Incomplete" badge as you wish */}
            </CardContent>
          </Card>

          {/* Documents & Presentations */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handlePresentations}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Upload className="h-3 w-3 mr-1 text-green-500" />
                {profile?.data?.presentations?.length > 0
                  ? "Presentation uploaded"
                  : "Presentation pending"}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-green-500" />
                {profile?.data?.cv ? "CV uploaded" : "CV pending"}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/faculty/attendance")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceRate.toFixed(0)}%
              </div>
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
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : myUpcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {myUpcomingSessions.slice(0, 4).map((session) => {
                    const myRole = session.speakers?.find(
                      (s) => s.userId === user?.id
                    )?.role;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSessionClick(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">
                              {session.title}
                            </h4>
                            <Badge
                              variant={
                                myRole === "SPEAKER"
                                  ? "default"
                                  : myRole === "MODERATOR"
                                  ? "secondary"
                                  : myRole === "CHAIRPERSON"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="ml-2"
                            >
                              {myRole}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(
                              new Date(session.startTime),
                              "MMM dd, yyyy"
                            )}
                            <Clock className="h-3 w-3 ml-3 mr-1" />
                            {format(
                              new Date(session.startTime),
                              "HH:mm"
                            )} - {format(new Date(session.endTime), "HH:mm")}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.hall?.name || "Venue TBA"}
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
                  <p className="text-sm mb-4">
                    Your speaking schedule will appear here
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/contact")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Organizers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Faculty Tools Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Faculty Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Presentations Upload */}
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
                {presentationFiles.length > 0 && (
                  <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-blue-800">
                        Selected Files ({presentationFiles.length})
                      </h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPresentationFiles([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {presentationFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm bg-white p-2 rounded"
                        >
                          <span className="truncate">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePresentationFile(index)}
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

              {/* --- CV Upload Section styled like presentations --- */}
              <div className="space-y-3">
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVFileSelect}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CV
                    </span>
                  </Button>
                </label>

                {/* Show selected CV in a blue card, like presentation files */}
                {cvFile && (
                  <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-blue-800">Selected CV</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCVFile(null);
                          if (cvInputRef.current) cvInputRef.current.value = "";
                          setCvUploadError(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-white p-2 rounded">
                      <span className="truncate">{cvFile.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {(cvFile.size / 1024 / 1024).toFixed(2)}MB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCVFile(null);
                            if (cvInputRef.current)
                              cvInputRef.current.value = "";
                            setCvUploadError(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCVUpload}
                      disabled={cvIsUploading}
                      className="w-full"
                    >
                      {cvIsUploading ? (
                        <>
                          <LoadingSpinner className="h-3 w-3 mr-2" />
                          Uploading... {cvProgress}%
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-2" />
                          Upload CV
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Success and Error messages */}
                {cvUploadSuccess && (
                  <Alert className="border-green-200 bg-green-50 mt-2">
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>CV uploaded: {cvUploadSuccess}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCVMessages}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {cvUploadError && (
                  <Alert className="border-red-200 bg-red-50 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>{cvUploadError}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCVMessages}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button className="w-full justify-start" variant="outline">
                <Plane className="h-4 w-4 mr-2" />
                Travel Information
              </Button>

              <Button className="w-full justify-start" variant="outline">
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
                onClick={() => setIsFeedbackOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setIsContactSupportOpen(true)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <FeedbackModal
        open={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
      <ContactSupportModal
        open={isContactSupportOpen}
        onClose={() => setIsContactSupportOpen(false)}
      />
    </FacultyLayout>
  );
}
