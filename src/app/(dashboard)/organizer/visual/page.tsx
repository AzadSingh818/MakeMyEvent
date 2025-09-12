"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Clock,
  MapPin,
  User,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  ExternalLink,
  Building,
  Phone,
  Globe,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock3,
  X,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Types
interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;  // This is the key field we need to display
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  eventId?: string;
  travel?: boolean | string;
  accommodation?: boolean | string;
  createdAt: string;
  updatedAt: string;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
  eventId: string;
  eventName: string;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  description?: string;
}

interface Room {
  id: string;
  name: string;
}

interface EmailLog {
  id: string;
  sessionId: string;
  recipientEmail: string;
  emailType: "invitation" | "reminder" | "confirmation" | "cancellation";
  status: "sent" | "failed" | "pending";
  sentAt?: string;
  error?: string;
  metadata?: any;
}

// Utility function to parse time consistently
const parseTimeString = (timeStr: string) => {
  if (!timeStr) return { hours: 0, minutes: 0, date: new Date() };

  try {
    if (timeStr.includes("T") && !timeStr.includes("Z") && timeStr.length <= 19) {
      const [datePart, timePart] = timeStr.split("T");
      const [hoursStr, minutesStr = "0"] = (timePart || "").split(":");
      const hours = parseInt(hoursStr ?? "0", 10);
      const minutes = parseInt(minutesStr ?? "0", 10);

      if (!datePart) {
        return { hours, minutes, date: new Date() };
      }
      const dateParts = datePart.split("-");
      const year = parseInt(dateParts[0] ?? "0", 10);
      const month = parseInt(dateParts[1] ?? "0", 10) - 1;
      const day = parseInt(dateParts[2] ?? "0", 10);
      const date = new Date(year, month, day);

      return { hours, minutes, date };
    } else {
      const date = new Date(timeStr);
      if (isValid(date)) {
        return {
          hours: date.getHours(),
          minutes: date.getMinutes(),
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        };
      }
    }
  } catch (error) {
    console.warn("Error parsing time:", timeStr, error);
  }

  return { hours: 0, minutes: 0, date: new Date() };
};

// Enhanced Session Details Modal
interface SessionDetailsModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  facultyData: Faculty[];
  rooms: Room[];
  events: Event[];
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose,
  facultyData,
  rooms,
  events,
}) => {
  if (!isOpen || !session) return null;

  // Get faculty details - prioritize facultyName from session, fallback to lookup
  const faculty = facultyData.find(f => f.id === session.facultyId);
  const displayFacultyName = session.facultyName || faculty?.name || "Faculty Not Found";
  
  const room = rooms.find(r => r.id === session.roomId);
  const event = events.find(e => e.id === session.eventId);
  const startTime = parseTimeString(session.startTime);
  const endTime = parseTimeString(session.endTime);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Session Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Title and Status */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {session.title}
              </h3>
              <div className="flex gap-2">
                <Badge className={`${getStatusColor(session.inviteStatus)}`}>
                  {session.inviteStatus}
                </Badge>
                <Badge variant="outline" className="border-gray-300 text-gray-700">
                  {session.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Session Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Faculty Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Faculty Details</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {displayFacultyName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {session.email}
                  </div>
                  {faculty?.department && (
                    <div>
                      <span className="font-medium">Department:</span>{" "}
                      {faculty.department}
                    </div>
                  )}
                  {faculty?.institution && (
                    <div>
                      <span className="font-medium">Institution:</span>{" "}
                      {faculty.institution}
                    </div>
                  )}
                  {faculty?.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {faculty.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Schedule</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {format(startTime.date, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {startTime.hours.toString().padStart(2, "0")}:
                    {startTime.minutes.toString().padStart(2, "0")} -{" "}
                    {endTime.hours.toString().padStart(2, "0")}:
                    {endTime.minutes.toString().padStart(2, "0")}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>{" "}
                    {Math.abs(
                      endTime.hours * 60 +
                        endTime.minutes -
                        (startTime.hours * 60 + startTime.minutes)
                    )}{" "}
                    minutes
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Location Information */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Location</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Place:</span>{" "}
                    {session.place}
                  </div>
                  <div>
                    <span className="font-medium">Room:</span>{" "}
                    {room?.name || session.roomName || "TBD"}
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Event</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Event:</span>{" "}
                    {event?.name || faculty?.eventName || "Not Available"}
                  </div>
                  {event?.location && (
                    <div>
                      <span className="font-medium">Event Location:</span>{" "}
                      {event.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Travel & Accommodation */}
              {(session.travel || session.accommodation) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Logistics</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {session.travel && (
                      <div>
                        <span className="font-medium">Travel:</span>{" "}
                        <Badge
                          variant="outline"
                          className={
                            (session.travel === "yes" || session.travel === true)
                              ? "border-green-500 text-green-700"
                              : "border-red-500 text-red-700"
                          }
                        >
                          {(session.travel === "yes" || session.travel === true) ? "Provided" : "Not Provided"}
                        </Badge>
                      </div>
                    )}
                    {session.accommodation && (
                      <div>
                        <span className="font-medium">Accommodation:</span>{" "}
                        <Badge
                          variant="outline"
                          className={
                            (session.accommodation === "yes" || session.accommodation === true)
                              ? "border-green-500 text-green-700"
                              : "border-red-500 text-red-700"
                          }
                        >
                          {(session.accommodation === "yes" || session.accommodation === true) ? "Provided" : "Not Provided"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {session.description}
              </p>
            </div>
          )}

          {/* Rejection Details */}
          {session.inviteStatus === "Declined" && session.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Rejection Details</h4>
              {session.rejectionReason === "SuggestedTopic" && session.suggestedTopic && (
                <div>
                  <span className="font-medium text-red-700">Suggested Topic:</span>
                  <p className="text-red-700 mt-1">{session.suggestedTopic}</p>
                </div>
              )}
              {session.rejectionReason === "TimeConflict" && (
                <div>
                  <span className="font-medium text-red-700">Time Conflict:</span>
                  {session.suggestedTimeStart && session.suggestedTimeEnd && (
                    <div className="mt-1 text-red-700">
                      <div>Suggested Start: {new Date(session.suggestedTimeStart).toLocaleString()}</div>
                      <div>Suggested End: {new Date(session.suggestedTimeEnd).toLocaleString()}</div>
                    </div>
                  )}
                  {session.optionalQuery && (
                    <p className="mt-2 text-red-700">Comment: {session.optionalQuery}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <div>Created: {format(parseISO(session.createdAt), "PPp")}</div>
            <div>Last Updated: {format(parseISO(session.updatedAt), "PPp")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const SessionEmailsView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteFilter, setInviteFilter] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsRes, facultyRes, eventsRes, roomsRes] = await Promise.all([
        fetch("/api/sessions", { cache: "no-store" }),
        fetch("/api/faculties", { cache: "no-store" }),
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" })
      ]);

      if (!sessionsRes.ok || !facultyRes.ok || !eventsRes.ok || !roomsRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [sessionsData, facultyDataRes, eventsData, roomsData] = await Promise.all([
        sessionsRes.json(),
        facultyRes.json(),
        eventsRes.json(),
        roomsRes.json()
      ]);

      // Parse sessions data
      const sessionsList = sessionsData?.data?.sessions || sessionsData?.sessions || sessionsData || [];
      
      // Parse events data
      let eventsList = [];
      if (eventsData.success && eventsData.data?.events) {
        eventsList = eventsData.data.events;
      } else if (eventsData.events) {
        eventsList = eventsData.events;
      } else if (Array.isArray(eventsData)) {
        eventsList = eventsData;
      }

      setSessions(sessionsList);
      setFacultyData(facultyDataRes || []);
      setEvents(eventsList);
      setRooms(roomsData || []);
      setLastUpdateTime(new Date().toLocaleTimeString());

      console.log(`✅ Email system loaded: ${sessionsList.length} sessions, ${facultyDataRes.length} faculty members`);

    } catch (err) {
      console.error("❌ Error loading data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const searchMatch = 
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        session.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.place.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === "all" || session.status === statusFilter;
      const inviteMatch = inviteFilter === "all" || session.inviteStatus === inviteFilter;

      return searchMatch && statusMatch && inviteMatch;
    });
  }, [sessions, searchTerm, statusFilter, inviteFilter]);

  // Handle session click
  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <div className="text-xl text-gray-300 mb-2">Loading Sessions & Faculty Data</div>
          <div className="text-gray-400">Fetching email system data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-300 mb-2">Error Loading Data</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Mail className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Session Email Management
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  Faculty communications & email tracking • Last updated: {lastUpdateTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-900/30">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{sessions.length}</div>
                  <div className="text-sm text-gray-400">Total Sessions</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {sessions.filter(s => s.inviteStatus === "Accepted").length}
                  </div>
                  <div className="text-sm text-gray-400">Accepted</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {sessions.filter(s => s.inviteStatus === "Pending").length}
                  </div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{facultyData.length}</div>
                  <div className="text-sm text-gray-400">Faculty Members</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions, faculty, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <select
                  value={inviteFilter}
                  onChange={(e) => setInviteFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Invites</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div className="text-sm text-gray-400">
                Showing {filteredSessions.length} of {sessions.length} sessions
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Session Details
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Faculty Information
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Schedule
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[100px]">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                    Invite Status
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Mail className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <div className="text-xl font-semibold text-gray-300 mb-2">
                        No Sessions Found
                      </div>
                      <div className="text-gray-400">
                        {searchTerm || statusFilter !== "all" || inviteFilter !== "all"
                          ? "No sessions match your current filters."
                          : "No sessions available for email management."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session, index) => {
                    // Get faculty name - prioritize session.facultyName, fallback to lookup
                    const faculty = facultyData.find(f => f.id === session.facultyId);
                    const displayFacultyName = session.facultyName || faculty?.name || "Faculty Not Found";
                    
                    const startTime = parseTimeString(session.startTime);
                    const endTime = parseTimeString(session.endTime);

                    return (
                      <tr
                        key={session.id}
                        className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${
                          index % 2 === 0 ? "bg-gray-900/20" : "bg-gray-900/40"
                        }`}
                        onClick={() => handleSessionClick(session)}
                      >
                        {/* Session Details */}
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-white mb-1">
                              {session.title}
                            </div>
                            {session.description && (
                              <div className="text-xs text-gray-400 line-clamp-2">
                                {session.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {session.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>

                        {/* Faculty Information */}
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-blue-300 mb-1">
                              {displayFacultyName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {session.email}
                            </div>
                            {faculty?.institution && (
                              <div className="text-xs text-gray-500 mt-1">
                                {faculty.institution}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-4">
                          <div>
                            <div className="text-gray-200 text-sm">
                              {session.place}
                            </div>
                            <div className="text-xs text-gray-400">
                              Room: {session.roomName || rooms.find(r => r.id === session.roomId)?.name || "TBD"}
                            </div>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="p-4">
                          {session.startTime && session.endTime ? (
                            <div className="text-xs space-y-1">
                              <div className="text-green-300">
                                <span className="text-gray-400">Start:</span>{" "}
                                {startTime.hours.toString().padStart(2, "0")}:
                                {startTime.minutes.toString().padStart(2, "0")}
                              </div>
                              <div className="text-red-300">
                                <span className="text-gray-400">End:</span>{" "}
                                {endTime.hours.toString().padStart(2, "0")}:
                                {endTime.minutes.toString().padStart(2, "0")}
                              </div>
                              <div className="text-purple-300">
                                {Math.abs(
                                  endTime.hours * 60 + endTime.minutes -
                                  (startTime.hours * 60 + startTime.minutes)
                                )}m
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">
                              Not scheduled
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              session.status === "Confirmed"
                                ? "border-blue-500 text-blue-300 bg-blue-900/20"
                                : "border-gray-600 text-gray-300 bg-gray-800/20"
                            }
                          >
                            {session.status}
                          </Badge>
                        </td>

                        {/* Invite Status */}
                        <td className="p-4">
                          <Badge className={`${getStatusBadgeClass(session.inviteStatus)}`}>
                            {session.inviteStatus}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(session);
                              }}
                              className="border-blue-600 text-blue-400 hover:bg-blue-900/20 h-8 px-3"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add email sending logic here
                                console.log("Send email to:", displayFacultyName, session.email);
                              }}
                              className="border-green-600 text-green-400 hover:bg-green-900/20 h-8 px-3"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        {filteredSessions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Showing {filteredSessions.length} of {sessions.length} sessions • 
            Faculty data loaded: {facultyData.length} members • 
            Last updated: {lastUpdateTime}
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setSelectedSession(null);
        }}
        facultyData={facultyData}
        rooms={rooms}
        events={events}
      />
    </div>
  );
};

export default SessionEmailsView;