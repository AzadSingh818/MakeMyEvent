"use client";

import React, { useEffect, useState } from "react";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  RefreshCw,
  Users,
  Clock,
  MapPin,
  Mail,
  CheckCircle,
  AlertTriangle,
  Building2,
  FileText,
  Plus,
  Download,
  Eye,
  Settings,
  Timer,
} from "lucide-react";

type InviteStatus = "Pending" | "Accepted" | "Declined";

type SessionRow = {
  id: string;
  title: string;
  facultyName: string;
  email: string;
  place: string;
  roomName?: string;
  roomId?: string;
  description?: string;
  startTime?: string; // Updated from 'time' to 'startTime'
  endTime?: string; // NEW: End time field
  status: "Draft" | "Confirmed";
  inviteStatus: InviteStatus;
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict"; // Added TimeConflict
  suggestedTopic?: string;
  suggestedTimeStart?: string; // NEW: Faculty suggested start time
  suggestedTimeEnd?: string; // NEW: Faculty suggested end time
  optionalQuery?: string; // NEW: Optional faculty message
  facultyId?: string;
  duration?: string; // Calculated duration for display
  formattedStartTime?: string;
  formattedEndTime?: string;
};

type RoomLite = { id: string; name: string };
type Faculty = { id: string; name: string };

type DraftSession = {
  place: string;
  roomId?: string;
  startTime?: string; // Changed from 'time'
  endTime?: string; // NEW: End time field
  status: "Draft" | "Confirmed";
  description?: string;
};

const badge = (s: InviteStatus) => {
  const base =
    "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1";
  if (s === "Accepted")
    return (
      <span
        className={`${base} bg-green-900/30 text-green-300 border border-green-700`}
      >
        <CheckCircle className="h-3 w-3" />
        Accepted
      </span>
    );
  if (s === "Declined")
    return (
      <span
        className={`${base} bg-red-900/30 text-red-300 border border-red-700`}
      >
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  return (
    <span
      className={`${base} bg-yellow-900/30 text-yellow-300 border border-yellow-700`}
    >
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
};

const statusBadge = (s: "Draft" | "Confirmed") => {
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "Confirmed")
    return (
      <span
        className={`${base} bg-blue-900/30 text-blue-300 border border-blue-700`}
      >
        Confirmed
      </span>
    );
  return (
    <span
      className={`${base} bg-gray-700 text-gray-300 border border-gray-600`}
    >
      Draft
    </span>
  );
};

const toInputDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

// Helper function to calculate duration
const calculateDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  if (minutes > 0) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${minutes} min`;
  }
  return "";
};

const AllSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Draft" | "Confirmed"
  >("all");
  const [inviteFilter, setInviteFilter] = useState<"all" | InviteStatus>("all");

  // Edit state
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, DraftSession>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [sRes, rRes, fRes] = await Promise.all([
        fetch("/api/sessions", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" }),
        fetch("/api/faculties", { cache: "no-store" }),
      ]);

      if (!sRes.ok || !rRes.ok || !fRes.ok)
        throw new Error("Failed to fetch data");

      const sData = await sRes.json();
      const rData: RoomLite[] = await rRes.json();
      const fData: Faculty[] = await fRes.json();

      console.log("Raw sessions data:", sData);

      // Enhanced mapping with proper startTime/endTime handling
      const sessionsList =
        sData.data?.sessions || sData.sessions || sData || [];
      const mapped: SessionRow[] = sessionsList.map((s: any) => {
        const roomId = s.roomId ?? rData.find((r) => r.name === s.roomName)?.id;
        const duration = calculateDuration(s.startTime, s.endTime);

        console.log("Processing session:", s.title, {
          startTime: s.startTime,
          endTime: s.endTime,
          duration,
        });

        return {
          ...s,
          roomId,
          duration,
          // Ensure backward compatibility with old 'time' field
          startTime: s.startTime || s.time,
          formattedStartTime: s.startTime
            ? new Date(s.startTime).toLocaleString()
            : undefined,
          formattedEndTime: s.endTime
            ? new Date(s.endTime).toLocaleString()
            : undefined,
        };
      });

      console.log("Mapped sessions:", mapped);
      setSessions(mapped);
      setRooms(rData);
      setFaculties(fData);
    } catch (e) {
      console.error("Failed to load sessions/rooms/faculties:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(false), 5000);
    return () => clearInterval(id);
  }, []);

  // Filtered sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.place.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    const matchesInvite =
      inviteFilter === "all" || session.inviteStatus === inviteFilter;

    return matchesSearch && matchesStatus && matchesInvite;
  });

  // Edit handlers
  const onEdit = (id: string) => {
    const row = sessions.find((s) => s.id === id);
    if (!row) return;
    setEditing((e) => ({ ...e, [id]: true }));
    setDraft((d) => ({
      ...d,
      [id]: {
        place: row.place ?? "",
        roomId: row.roomId,
        startTime: toInputDateTime(row.startTime),
        endTime: toInputDateTime(row.endTime),
        status: row.status,
        description: row.description ?? "",
      },
    }));
  };

  const onCancel = (id: string) => {
    setEditing((e) => ({ ...e, [id]: false }));
    setDraft((d) => {
      const nd = { ...d };
      delete nd[id];
      return nd;
    });
  };

  const onChangeDraft = (
    id: string,
    field: keyof DraftSession,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      [id]: {
        place: d[id]?.place ?? "",
        roomId: d[id]?.roomId,
        startTime: d[id]?.startTime,
        endTime: d[id]?.endTime,
        status: d[id]?.status ?? "Draft",
        description: d[id]?.description ?? "",
        [field]: value,
      },
    }));
  };

  const onSave = async (id: string) => {
    const body = draft[id];
    if (!body) return;

    let isoStartTime: string | null = null;
    let isoEndTime: string | null = null;

    if (body.startTime && body.startTime.length === 16) {
      isoStartTime = new Date(body.startTime).toISOString();
    }
    if (body.endTime && body.endTime.length === 16) {
      isoEndTime = new Date(body.endTime).toISOString();
    }

    // Validate time logic
    if (isoStartTime && isoEndTime) {
      const start = new Date(isoStartTime);
      const end = new Date(isoEndTime);
      if (end <= start) {
        alert("End time must be after start time");
        return;
      }
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        alert("Session must be at least 15 minutes long");
        return;
      }
    }

    const payload = {
      ...body,
      startTime: isoStartTime,
      endTime: isoEndTime,
      // Keep backward compatibility
      time: isoStartTime,
    };

    console.log("Saving session with payload:", payload);
    setSaving((s) => ({ ...s, [id]: true }));

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update session");
        return;
      }

      const result = await res.json();
      console.log("Session update result:", result);

      await load(false);
      onCancel(id);
    } catch (e) {
      console.error("Session update error:", e);
      alert("Failed to update session");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeleting((d) => ({ ...d, [id]: true }));

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete session.");
        return;
      }
      await load(false);
    } catch (e) {
      console.error(e);
      alert("Failed to delete session.");
    } finally {
      setDeleting((d) => ({ ...d, [id]: false }));
    }
  };

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Session Management
                  </h1>
                  <p className="text-gray-300 text-lg mt-1">
                    Enhanced overview with bulk session support and real-time
                    updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => load(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-900/30">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {sessions.length}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total Sessions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          sessions.filter((s) => s.inviteStatus === "Accepted")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Accepted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-900/30">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          sessions.filter((s) => s.inviteStatus === "Pending")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-900/30">
                      <Settings className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          sessions.filter((s) => s.status === "Confirmed")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Confirmed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NEW: Time Conflicts Card */}
              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-900/30">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          sessions.filter(
                            (s) => s.rejectionReason === "TimeConflict"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-400">
                        Time Conflicts
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions, faculty, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
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
                      onChange={(e) => setInviteFilter(e.target.value as any)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="all">All Invites</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <div className="text-sm text-gray-400">
                    Showing {filteredSessions.length} of {sessions.length}{" "}
                    sessions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Table with Start/End Time Support */}
          <Card className="border-gray-700 bg-gray-900/50 backdrop-blur shadow-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Session Title
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Faculty
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Place
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Room
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Schedule
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          Duration
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                        Status
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                        Invite Status
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[250px]">
                        Faculty Response
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="text-center py-12 text-gray-400"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Loading sessions...
                          </div>
                        </td>
                      </tr>
                    ) : filteredSessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="text-center py-12 text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Calendar className="h-12 w-12 text-gray-600" />
                            <div>
                              <div className="text-lg font-medium">
                                No sessions found
                              </div>
                              <div className="text-sm">
                                Try adjusting your search or filters
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((s, index) => {
                        const isEditing = editing[s.id];
                        const d = draft[s.id];
                        const isSaving = saving[s.id];
                        const isDeleting = deleting[s.id];

                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-gray-800/50 transition-colors ${
                              isEditing
                                ? "bg-blue-900/10 border border-blue-800/30"
                                : ""
                            } ${
                              index % 2 === 0
                                ? "bg-gray-900/20"
                                : "bg-gray-900/40"
                            }`}
                          >
                            {/* Title */}
                            <td className="p-4">
                              <div className="font-medium text-white">
                                {s.title}
                              </div>
                              {s.description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {s.description}
                                </div>
                              )}
                            </td>

                            {/* Faculty */}
                            <td className="p-4">
                              <div className="text-gray-200">
                                {s.facultyName}
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4">
                              <div className="text-gray-300 text-xs">
                                {s.email}
                              </div>
                            </td>

                            {/* Place */}
                            <td className="p-4">
                              {isEditing ? (
                                <input
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.place || ""}
                                  onChange={(e) =>
                                    onChangeDraft(s.id, "place", e.target.value)
                                  }
                                />
                              ) : (
                                <div className="text-gray-200">{s.place}</div>
                              )}
                            </td>

                            {/* Room */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.roomId || s.roomId || ""}
                                  onChange={(e) =>
                                    onChangeDraft(
                                      s.id,
                                      "roomId",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Select Room</option>
                                  {rooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-gray-200">
                                  {s.roomName || "-"}
                                </div>
                              )}
                            </td>

                            {/* Enhanced Schedule Column with Start/End Time */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-gray-400 block">
                                      Start Time
                                    </label>
                                    <input
                                      type="datetime-local"
                                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none"
                                      value={d?.startTime || ""}
                                      onChange={(e) =>
                                        onChangeDraft(
                                          s.id,
                                          "startTime",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-400 block">
                                      End Time
                                    </label>
                                    <input
                                      type="datetime-local"
                                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none"
                                      value={d?.endTime || ""}
                                      onChange={(e) =>
                                        onChangeDraft(
                                          s.id,
                                          "endTime",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ) : s.startTime || s.endTime ? (
                                <div className="text-xs space-y-1">
                                  {s.startTime && (
                                    <div className="text-green-300">
                                      <span className="text-gray-400">
                                        Start:
                                      </span>{" "}
                                      {s.formattedStartTime ||
                                        new Date(s.startTime).toLocaleString()}
                                    </div>
                                  )}
                                  {s.endTime && (
                                    <div className="text-red-300">
                                      <span className="text-gray-400">
                                        End:
                                      </span>{" "}
                                      {s.formattedEndTime ||
                                        new Date(s.endTime).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">
                                  Not scheduled
                                </div>
                              )}
                            </td>

                            {/* Duration */}
                            <td className="p-4">
                              <div className="text-gray-200 text-xs font-medium">
                                {s.duration ||
                                  calculateDuration(s.startTime, s.endTime) ||
                                  "-"}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.status || s.status}
                                  onChange={(e) =>
                                    onChangeDraft(
                                      s.id,
                                      "status",
                                      e.target.value as "Draft" | "Confirmed"
                                    )
                                  }
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Confirmed">Confirmed</option>
                                </select>
                              ) : (
                                statusBadge(s.status)
                              )}
                            </td>

                            {/* Invite Status */}
                            <td className="p-4">{badge(s.inviteStatus)}</td>

                            {/* Enhanced Faculty Response Column */}
                            <td className="p-4">
                              <div className="text-gray-300 text-xs space-y-2">
                                {s.inviteStatus === "Declined" &&
                                s.rejectionReason === "SuggestedTopic" &&
                                s.suggestedTopic ? (
                                  <div className="bg-orange-900/20 border border-orange-700 rounded px-2 py-1">
                                    <div className="font-medium text-orange-300">
                                      Topic Suggestion:
                                    </div>
                                    <div className="text-orange-200">
                                      {s.suggestedTopic}
                                    </div>
                                  </div>
                                ) : s.inviteStatus === "Declined" &&
                                  s.rejectionReason === "TimeConflict" ? (
                                  <div className="bg-blue-900/20 border border-blue-700 rounded px-2 py-1">
                                    <div className="font-medium text-blue-300">
                                      Time Conflict:
                                    </div>
                                    {s.suggestedTimeStart &&
                                    s.suggestedTimeEnd ? (
                                      <div className="text-blue-200 space-y-1">
                                        <div className="text-xs">
                                          <span className="text-green-300">
                                            Suggested Start:
                                          </span>
                                          <br />
                                          {new Date(
                                            s.suggestedTimeStart
                                          ).toLocaleString()}
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-red-300">
                                            Suggested End:
                                          </span>
                                          <br />
                                          {new Date(
                                            s.suggestedTimeEnd
                                          ).toLocaleString()}
                                        </div>
                                        {s.optionalQuery && (
                                          <div className="text-xs border-t border-blue-800 pt-1 mt-1">
                                            <span className="text-blue-300">
                                              Comment:
                                            </span>
                                            <br />
                                            {s.optionalQuery}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-blue-200">
                                        Faculty prefers different time
                                      </div>
                                    )}
                                  </div>
                                ) : s.inviteStatus === "Declined" &&
                                  s.rejectionReason === "NotInterested" ? (
                                  <div className="bg-red-900/20 border border-red-700 rounded px-2 py-1">
                                    <div className="text-red-300">
                                      Not interested
                                    </div>
                                  </div>
                                ) : s.inviteStatus === "Accepted" ? (
                                  <div className="bg-green-900/20 border border-green-700 rounded px-2 py-1">
                                    <div className="text-green-300">
                                      Confirmed attendance
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">
                                    Awaiting response
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => onSave(s.id)}
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                                  >
                                    {isSaving ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onCancel(s.id)}
                                    disabled={isSaving}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800 h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(s.id)}
                                    className="border-blue-600 text-blue-400 hover:bg-blue-900/20 h-8 px-2"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(s.id)}
                                    disabled={isDeleting}
                                    className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-2"
                                  >
                                    {isDeleting ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Stats */}
          {filteredSessions.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh
              every 5 seconds
            </div>
          )}
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default AllSessions;
