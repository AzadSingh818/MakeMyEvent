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
import TravelInfoModal from "@/app/modals/TravelInfoModal";
import AccommodationInfoModal from "@/app/modals/AccommodationInfoModal";

import {
  Calendar, 
  Clock,
  Upload,
  FileText,
  MapPin,
  Activity,
  ExternalLink,
  ArrowRight,
  Mail,
  MessageSquare,
  Award,
  Hotel,
  Plane,
  Bed,
  Bell,
  Target,
  Zap,
  Shield,
  Presentation,
  Phone,
  Send,
  UserCheck,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  Star,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock4,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

import { useMyFacultyProfile } from "@/hooks/use-faculty";
import {
  useUserSessions,
  useTodaysSessions,
  useUpcomingSessions,
} from "@/hooks/use-sessions";
import { useMyAttendance } from "@/hooks/use-attendance";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useAuth, useNotifications } from "@/hooks/use-auth";
import { useFacultyEvents } from "@/hooks/use-faculty-events";

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

  // Modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);

  // Travel and Accommodation Modals
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
    useState(false);

  // Faculty Sessions State (existing)
  const [facultySessions, setFacultySessions] = useState<any[]>([]);
  const [loadingFacultySessions, setLoadingFacultySessions] = useState(true);
  const [sessionsStats, setSessionsStats] = useState<any>({});

  // Button handlers
  const handleTravelModalOpen = () => setIsTravelModalOpen(true);
  const handleAccommodationModalOpen = () => setIsAccommodationModalOpen(true);

  // DATA FETCHING (existing)
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useMyFacultyProfile();
  const { data: mySessions, isLoading: userSessionsLoading } = useUserSessions(
    user?.id
  );
  const { data: todaysSessions } = useTodaysSessions();
  const { data: upcomingSessions } = useUpcomingSessions();
  const { data: myAttendance } = useMyAttendance();
  const { data: myRegistrations } = useMyRegistrations();
  const { data: notifications } = useNotifications();

  // NEW: Faculty Events Hook
  const {
    events: facultyEvents,
    loading: loadingFacultyEvents,
    refetch: refetchFacultyEvents,
    respondToEvent,
  } = useFacultyEvents(user?.email);

  // Existing Sessions Management (keep original)
  const fetchFacultySessions = async () => {
    if (!user?.email) return;
    setLoadingFacultySessions(true);
    try {
      const response = await fetch(
        `/api/faculty/sessions?email=${encodeURIComponent(user.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setFacultySessions(data.data.sessions);
        setSessionsStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching faculty sessions:", error);
    } finally {
      setLoadingFacultySessions(false);
    }
  };

  // Fetch sessions on component mount and periodically
  useEffect(() => {
    fetchFacultySessions();
    const interval = setInterval(fetchFacultySessions, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // NAVIGATION
  const handleViewProfile = () => router.push("/faculty/profile");
  const handlePresentations = () => router.push("/faculty/presentations");
  const handleSchedule = () => router.push("/faculty/schedule");
  const handleCertificates = () => router.push("/faculty/certificates");
  const handleSessionClick = (sessionId: string) =>
    router.push(`/faculty/sessions/${sessionId}`);

  // PRESENTATION HANDLERS (existing - keep as is)
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

  const clearPresentationMessages = () => {
    setUploadSuccess([]);
    setUploadErrors([]);
  };

  // CV HANDLERS (existing - keep as is)
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

  // STATS (updated to include events)
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
  const hasCV = !!(profile?.data as any)?.cv;
  const totalDocuments = totalPresentations + (hasCV ? 1 : 0);

  const unreadNotifications =
    notifications?.data?.notifications?.filter((n: any) => !n.readAt).length ||
    0;

  const profileInstitution = (profile?.data as any)?.institution || "";
  const profileBio = (profile?.data as any)?.bio || "";
  const profileExpertise = (profile?.data as any)?.expertise || "";
  const profileCV = (profile?.data as any)?.cv || null;
  const profilePhoto = (profile?.data as any)?.photo || null;
  const profileUserName =
    (profile?.data as any)?.user?.name || user?.name || "Faculty";
  const profileUserEmail =
    (profile?.data as any)?.user?.email || user?.email || "faculty@example.com";

  const profileFields = [
    profileBio,
    profileInstitution,
    profileExpertise,
    profileCV,
    profilePhoto,
  ];
  const completedFields = profileFields.filter((field) => field).length;
  const profileCompletionRate = Math.round(
    (completedFields / profileFields.length) * 100
  );

  const userName = profileUserName;
  const userEmail = profileUserEmail;

  // RESPOND STATE AND HANDLERS (updated for both sessions and events)
  const [respondSubmitting, setRespondSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineTargetType, setDeclineTargetType] = useState<
    "session" | "event"
  >("session");
  const [declineReason, setDeclineReason] = useState<
    "NotInterested" | "SuggestedTopic" | "TimeConflict"
  >("NotInterested");
  const [suggestedTopic, setSuggestedTopic] = useState("");
  const [suggestedStart, setSuggestedStart] = useState("");
  const [suggestedEnd, setSuggestedEnd] = useState("");
  const [optionalQuery, setOptionalQuery] = useState("");

  const openDecline = (id: string, type: "session" | "event" = "session") => {
    setDeclineTargetId(id);
    setDeclineTargetType(type);
    setDeclineReason("NotInterested");
    setSuggestedTopic("");
    setSuggestedStart("");
    setSuggestedEnd("");
    setOptionalQuery("");
    setDeclineOpen(true);
  };

  // Accept handlers
  const acceptSessionInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      const res = await fetch(`/api/sessions/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, inviteStatus: "Accepted" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to accept.");
      }
      setFacultySessions((prev: any[]) =>
        prev.map((s) => (s.id === id ? { ...s, inviteStatus: "Accepted" } : s))
      );
      fetchFacultySessions();
    } catch (e) {
      console.error(e);
    } finally {
      setRespondSubmitting(false);
    }
  };

  const acceptEventInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      await respondToEvent(id, "ACCEPTED");
    } catch (e) {
      console.error("Error accepting event:", e);
    } finally {
      setRespondSubmitting(false);
    }
  };

  // Submit decline handler (unified)
  const submitDecline = async () => {
    if (!declineTargetId) return;
    try {
      setRespondSubmitting(true);

      if (declineTargetType === "session") {
        // Handle session decline (existing logic)
        const payload: any = {
          id: declineTargetId,
          inviteStatus: "Declined",
          rejectionReason: declineReason,
        };
        if (declineReason === "SuggestedTopic")
          payload.suggestedTopic = suggestedTopic.trim();
        if (declineReason === "TimeConflict") {
          if (suggestedStart)
            payload.suggestedTimeStart = new Date(suggestedStart).toISOString();
          if (suggestedEnd)
            payload.suggestedTimeEnd = new Date(suggestedEnd).toISOString();
        }
        if (optionalQuery.trim()) payload.optionalQuery = optionalQuery.trim();

        const res = await fetch(`/api/sessions/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to decline.");
        }

        setFacultySessions((prev: any[]) =>
          prev.map((s) =>
            s.id === declineTargetId
              ? {
                  ...s,
                  inviteStatus: "Declined",
                  rejectionReason: payload.rejectionReason,
                  suggestedTopic: payload.suggestedTopic,
                  suggestedTimeStart: payload.suggestedTimeStart,
                  suggestedTimeEnd: payload.suggestedTimeEnd,
                  optionalQuery: payload.optionalQuery,
                }
              : s
          )
        );
        fetchFacultySessions();
      } else {
        // Handle event decline
        const additionalData: any = { rejectionReason: declineReason };
        if (declineReason === "SuggestedTopic" && suggestedTopic.trim()) {
          additionalData.suggestedTopic = suggestedTopic.trim();
        }
        if (declineReason === "TimeConflict") {
          if (suggestedStart)
            additionalData.suggestedTimeStart = new Date(
              suggestedStart
            ).toISOString();
          if (suggestedEnd)
            additionalData.suggestedTimeEnd = new Date(
              suggestedEnd
            ).toISOString();
        }
        if (optionalQuery.trim())
          additionalData.optionalQuery = optionalQuery.trim();

        await respondToEvent(declineTargetId, "DECLINED", additionalData);
      }

      setDeclineOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setRespondSubmitting(false);
    }
  };

  // COMBINED SESSIONS AND EVENTS CARD
  const SessionsAndEventsCard = () => (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            My Sessions & Event Invitations
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchFacultySessions();
                refetchFacultyEvents();
              }}
              disabled={loadingFacultySessions || loadingFacultyEvents}
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${
                  loadingFacultySessions || loadingFacultyEvents
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleSchedule}>
              <Calendar className="h-3 w-3 mr-1" />
              Full Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Combined Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Sessions Stats */}
          <div className="text-center p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
            <div className="text-xl font-bold text-indigo-300">
              {sessionsStats.total || 0}
            </div>
            <div className="text-xs text-indigo-200">Total Sessions</div>
          </div>
          <div className="text-center p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="text-xl font-bold text-purple-300">
              {facultyEvents.length}
            </div>
            <div className="text-xs text-purple-200">Event Invitations</div>
          </div>
          <div className="text-center p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
            <div className="text-xl font-bold text-emerald-300">
              {(sessionsStats.accepted || 0) +
                facultyEvents.filter((e) => e.status === "ACCEPTED").length}
            </div>
            <div className="text-xs text-emerald-200">Total Accepted</div>
          </div>
          <div className="text-center p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
            <div className="text-xl font-bold text-amber-300">
              {(sessionsStats.pending || 0) +
                facultyEvents.filter((e) => e.status === "PENDING").length}
            </div>
            <div className="text-xs text-amber-200">Total Pending</div>
          </div>
        </div>

        {loadingFacultySessions || loadingFacultyEvents ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sessions Section */}
            {facultySessions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                  <Presentation className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-semibold text-slate-200">
                    Conference Sessions
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {facultySessions.length}
                  </Badge>
                </div>
                {facultySessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      session.inviteStatus === "Pending"
                        ? "border-amber-400/30 bg-amber-900/20 hover:bg-amber-900/30"
                        : session.inviteStatus === "Accepted"
                        ? "border-emerald-400/30 bg-emerald-900/20 hover:bg-emerald-900/30"
                        : session.inviteStatus === "Declined"
                        ? "border-rose-400/30 bg-rose-900/20 hover:bg-rose-900/30"
                        : "border-slate-700/60 bg-slate-900/30 hover:bg-slate-900/40"
                    }`}
                    onClick={() =>
                      router.push(`/faculty/sessions/${session.id}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-100 truncate">
                            {session.title}
                          </h4>
                          <Badge
                            variant={
                              session.inviteStatus === "Accepted"
                                ? "default"
                                : session.inviteStatus === "Pending"
                                ? "secondary"
                                : session.inviteStatus === "Declined"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {session.inviteStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {session.formattedTime}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.place} - {session.roomName}
                          </div>
                        </div>
                        {session.inviteStatus === "Pending" && (
                          <div className="flex items-center gap-2 mt-3">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span className="text-sm text-amber-300 font-medium">
                              Response required
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {session.inviteStatus === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptSessionInvite(session.id);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDecline(session.id, "session");
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Events Section */}
            {facultyEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                  <CalendarDays className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-slate-200">
                    Event Invitations
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {facultyEvents.length}
                  </Badge>
                </div>
                {facultyEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      event.status === "PENDING"
                        ? "border-amber-400/30 bg-amber-900/20"
                        : event.status === "ACCEPTED"
                        ? "border-emerald-400/30 bg-emerald-900/20"
                        : event.status === "DECLINED"
                        ? "border-rose-400/30 bg-rose-900/20"
                        : "border-slate-700/60 bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-100 truncate">
                            {event.title}
                          </h4>
                          <Badge
                            variant={
                              event.status === "ACCEPTED"
                                ? "default"
                                : event.status === "PENDING"
                                ? "secondary"
                                : event.status === "DECLINED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(event.startDate), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location} - {event.venue}
                          </div>
                          <div className="flex items-center">
                            <Clock4 className="h-3 w-3 mr-1" />
                            {event.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {event.sessionCount} sessions
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {event.description}
                          </p>
                        )}
                        {event.status === "PENDING" && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span className="text-sm text-amber-300 font-medium">
                              Response required
                            </span>
                          </div>
                        )}
                        {event.status === "DECLINED" &&
                          event.rejectionReason === "SuggestedTopic" &&
                          event.suggestedTopic && (
                            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded">
                              <div className="text-sm text-blue-200">
                                <strong>Your suggestion:</strong>{" "}
                                {event.suggestedTopic}
                              </div>
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {event.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptEventInvite(event.id);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDecline(event.id, "event");
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        {event.status === "ACCEPTED" && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-900/20 text-emerald-300"
                          >
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All Links */}
            {(facultySessions.length > 3 || facultyEvents.length > 3) && (
              <div className="flex gap-4 pt-4 border-t border-slate-800">
                {facultySessions.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/sessions")}
                    className="flex-1"
                  >
                    View All Sessions ({facultySessions.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {facultyEvents.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/events")}
                    className="flex-1"
                  >
                    View All Events ({facultyEvents.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Empty State */}
            {facultySessions.length === 0 && facultyEvents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2 text-slate-200">
                  No sessions or events yet
                </h3>
                <p className="text-sm mb-4">
                  Session and event invitations will appear here when organizers
                  assign you
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
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Rest of your existing handlers and component code...
  if (profileLoading || userSessionsLoading) {
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
    <FacultyLayout
      userName={userName}
      userEmail={userEmail}
      headerStats={[
        {
          label: "Sessions",
          value: sessionsStats.total || 0,
          color: "bg-blue-500",
        },
        {
          label: "Events",
          value: facultyEvents.length,
          color: "bg-purple-500",
        },
        {
          label: "Presentations",
          value: totalPresentations,
          color: "bg-green-500",
        },
        { label: "CV", value: hasCV ? "Yes" : "No", color: "bg-green-500" },
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
            {profileInstitution && (
              <p className="text-sm text-blue-600 font-medium">
                {profileInstitution}
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

        {/* Updated Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Sessions Card */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/faculty/sessions")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Sessions</CardTitle>
              <Presentation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionsStats.total || 0}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">
                    Accepted: {sessionsStats.accepted || 0}
                  </span>
                  <span className="text-yellow-600">
                    Pending: {sessionsStats.pending || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                {sessionsStats.upcoming || 0} upcoming
              </div>
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/faculty/events")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Event Invitations
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facultyEvents.length}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">
                    Accepted:{" "}
                    {
                      facultyEvents.filter((e) => e.status === "ACCEPTED")
                        .length
                    }
                  </span>
                  <span className="text-yellow-600">
                    Pending:{" "}
                    {facultyEvents.filter((e) => e.status === "PENDING").length}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock4 className="h-3 w-3 mr-1 text-blue-500" />
                Multi-day events
              </div>
            </CardContent>
          </Card>

          {/* Keep existing Accommodation & Travel and Documents cards as they are */}
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
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Bed className="h-3 w-3 mr-1 text-purple-600" />
                Accommodation:{" "}
                {(profile?.data as any)?.accommodations &&
                (profile?.data as any).accommodations.length > 0 ? (
                  <span className="ml-1 text-green-600 font-medium">
                    Provided
                  </span>
                ) : (
                  <span className="ml-1 text-red-500 font-medium">
                    Not Provided
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Plane className="h-3 w-3 mr-1 text-blue-600" />
                Travel Details:{" "}
                {(profile?.data as any)?.travelDetails &&
                (profile?.data as any).travelDetails.length > 0 ? (
                  <span className="ml-1 text-green-600 font-medium">
                    Provided
                  </span>
                ) : (
                  <span className="ml-1 text-red-500 font-medium">
                    Not Provided
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

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
                {(profile?.data as any)?.presentations?.length > 0
                  ? "Presentation uploaded"
                  : "Presentation pending"}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-green-500" />
                {profileCV ? "CV uploaded" : "CV pending"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Replace Sessions card with combined card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SessionsAndEventsCard />

          {/* Keep existing Faculty Tools Card exactly as it is */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Faculty Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Keep all existing upload functionality */}
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

              {/* CV Upload Section */}
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

                {/* Success and Error Messages */}
                {uploadSuccess.length > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            Successfully uploaded:
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearPresentationMessages}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {uploadSuccess.map((fileName, index) => (
                          <div key={index} className="text-sm">
                            • {fileName}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {uploadErrors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Upload errors:</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearPresentationMessages}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {uploadErrors.map((error, index) => (
                          <div key={index} className="text-sm">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

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

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleTravelModalOpen}
              >
                <Plane className="h-4 w-4 mr-2" />
                Travel Information
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleAccommodationModalOpen}
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

      {/* Modals */}
      <FeedbackModal
        open={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
      <ContactSupportModal
        open={isContactSupportOpen}
        onClose={() => setIsContactSupportOpen(false)}
      />
      <TravelInfoModal
        open={isTravelModalOpen}
        onClose={() => setIsTravelModalOpen(false)}
        mode="self-arranged"
      />
      <AccommodationInfoModal
        open={isAccommodationModalOpen}
        onClose={() => setIsAccommodationModalOpen(false)}
      />

      {/* Updated Decline Modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Decline {declineTargetType === "session" ? "Session" : "Event"}{" "}
                Invitation
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeclineOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-700">
                  Choose a reason
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant={
                      declineReason === "NotInterested" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("NotInterested")}
                  >
                    Not Interested
                  </Button>
                  <Button
                    variant={
                      declineReason === "SuggestedTopic" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("SuggestedTopic")}
                  >
                    Suggest a Topic
                  </Button>
                  <Button
                    variant={
                      declineReason === "TimeConflict" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("TimeConflict")}
                  >
                    Time Conflict
                  </Button>
                </div>
              </div>

              {declineReason === "SuggestedTopic" && (
                <div>
                  <div className="text-xs font-medium text-gray-700">
                    Suggested Topic
                  </div>
                  <input
                    className="mt-1 w-full rounded border p-2"
                    value={suggestedTopic}
                    onChange={(e) => setSuggestedTopic(e.target.value)}
                    placeholder="e.g., Emerging Trends in GenAI"
                  />
                </div>
              )}

              {declineReason === "TimeConflict" && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-gray-700">
                      Suggested Start
                    </div>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={suggestedStart}
                      onChange={(e) => setSuggestedStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">
                      Suggested End
                    </div>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={suggestedEnd}
                      onChange={(e) => setSuggestedEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-gray-700">
                  Optional message
                </div>
                <textarea
                  className="mt-1 w-full rounded border p-2"
                  value={optionalQuery}
                  onChange={(e) => setOptionalQuery(e.target.value)}
                  placeholder="Add an optional note for the organizer"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeclineOpen(false)}
                disabled={respondSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={submitDecline} disabled={respondSubmitting}>
                Submit Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </FacultyLayout>
  );
}
