"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Edit3,
  Save,
  X,
  Trash2,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Session Type
export interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;
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
  formattedStartTime?: string;
  formattedEndTime?: string;
  duration?: string;
}

type RoomLite = { id: string; name: string };
type Faculty = { id: string; name: string };

type DraftSession = {
  title?: string;
  place: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  status: "Draft" | "Confirmed";
  description?: string;
};

interface TimeSlot {
  hour: number;
  label: string;
  sessions: Session[];
}

interface DayColumn {
  date: Date;
  dayName: string;
  dateNumber: string;
  isToday: boolean;
  timeSlots: TimeSlot[];
}

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  date: string;
  timeSlot?: string;
  rooms: RoomLite[];
  onSessionUpdate: (sessionId: string, updates: Partial<Session>) => void;
  onSessionDelete: (sessionId: string) => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  date,
  timeSlot,
  rooms,
  onSessionUpdate,
  onSessionDelete,
}) => {
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, DraftSession>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Draft":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getInviteStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Declined":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "Pending":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const toInputDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const onEdit = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setEditing((e) => ({ ...e, [sessionId]: true }));
    setDraft((d) => ({
      ...d,
      [sessionId]: {
        title: session.title ?? "",
        place: session.place ?? "",
        roomId: session.roomId,
        startTime: toInputDateTime(session.startTime),
        endTime: toInputDateTime(session.endTime),
        status: session.status,
        description: session.description ?? "",
      },
    }));
  };

  const onCancel = (sessionId: string) => {
    setEditing((e) => ({ ...e, [sessionId]: false }));
    setDraft((d) => {
      const nd = { ...d };
      delete nd[sessionId];
      return nd;
    });
  };

  const onChangeDraft = (
    sessionId: string,
    field: keyof DraftSession,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      [sessionId]: {
        title: d[sessionId]?.title ?? "",
        place: d[sessionId]?.place ?? "",
        roomId: d[sessionId]?.roomId,
        startTime: d[sessionId]?.startTime,
        endTime: d[sessionId]?.endTime,
        status: d[sessionId]?.status ?? "Draft",
        description: d[sessionId]?.description ?? "",
        [field]: value,
      },
    }));
  };

  const onSave = async (sessionId: string) => {
    const body = draft[sessionId];
    if (!body) return;

    let isoStartTime: string | null = null;
    let isoEndTime: string | null = null;

    if (body.startTime && body.startTime.length === 16) {
      isoStartTime = new Date(body.startTime).toISOString();
    }
    if (body.endTime && body.endTime.length === 16) {
      isoEndTime = new Date(body.endTime).toISOString();
    }

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
      time: isoStartTime,
    };

    setSaving((s) => ({ ...s, [sessionId]: true }));

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
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
      onSessionUpdate(sessionId, result);
      onCancel(sessionId);
    } catch (e) {
      console.error("Session update error:", e);
      alert("Failed to update session");
    } finally {
      setSaving((s) => ({ ...s, [sessionId]: false }));
    }
  };

  const onDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeleting((d) => ({ ...d, [sessionId]: true }));

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete session.");
        return;
      }
      onSessionDelete(sessionId);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to delete session.");
    } finally {
      setDeleting((d) => ({ ...d, [sessionId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Sessions for {date}
              </h2>
              {timeSlot && (
                <p className="text-blue-400 mt-1 font-medium">{timeSlot}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>

        <div className="p-6 space-y-4">
          {sessions.map((session) => {
            const isEditing = editing[session.id];
            const d = draft[session.id];
            const isSaving = saving[session.id];
            const isDeleting = deleting[session.id];

            return (
              <div
                key={session.id}
                className={`border border-gray-700 rounded-lg p-5 transition-all duration-200 ${
                  isEditing
                    ? "border-blue-500 bg-blue-900/10"
                    : "hover:border-gray-600 hover:bg-gray-800/50"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={d?.title || ""}
                      onChange={(e) =>
                        onChangeDraft(session.id, "title", e.target.value)
                      }
                      className="text-lg font-semibold text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 w-full mr-4"
                      placeholder="Session Title"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-white">
                      {session.title || "Untitled Session"}
                    </h3>
                  )}
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getInviteStatusColor(
                        session.inviteStatus
                      )}`}
                    >
                      {session.inviteStatus}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Place/Location
                        </label>
                        <input
                          type="text"
                          value={d?.place || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "place", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Room
                        </label>
                        <select
                          value={d?.roomId || session.roomId || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "roomId", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select Room</option>
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Time
                        </label>
                        <input
                          type="datetime-local"
                          value={d?.startTime || ""}
                          onChange={(e) =>
                            onChangeDraft(
                              session.id,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Time
                        </label>
                        <input
                          type="datetime-local"
                          value={d?.endTime || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "endTime", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={d?.status || session.status}
                        onChange={(e) =>
                          onChangeDraft(
                            session.id,
                            "status",
                            e.target.value as "Draft" | "Confirmed"
                          )
                        }
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Confirmed">Confirmed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={d?.description || ""}
                        onChange={(e) =>
                          onChangeDraft(
                            session.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => onSave(session.id)}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onCancel(session.id)}
                        disabled={isSaving}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onDelete(session.id)}
                        disabled={isDeleting}
                        className="border-red-600 text-red-400 hover:bg-red-900/20 ml-auto"
                      >
                        {isDeleting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>{session.facultyName || "Faculty TBD"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span>
                          {session.place} - {session.roomName || session.roomId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>
                          {session.startTime &&
                            format(new Date(session.startTime), "HH:mm")}{" "}
                          -{" "}
                          {session.endTime &&
                            format(new Date(session.endTime), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                        <span>{session.duration || "Duration TBD"}</span>
                      </div>
                    </div>

                    {session.description && (
                      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {session.description}
                        </p>
                      </div>
                    )}

                    {session.inviteStatus === "Declined" &&
                      session.rejectionReason && (
                        <div className="mb-4">
                          {session.rejectionReason === "SuggestedTopic" &&
                            session.suggestedTopic && (
                              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3">
                                <div className="font-medium text-orange-300 mb-1">
                                  Topic Suggestion:
                                </div>
                                <div className="text-orange-200">
                                  {session.suggestedTopic}
                                </div>
                              </div>
                            )}
                          {session.rejectionReason === "TimeConflict" && (
                            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                              <div className="font-medium text-blue-300 mb-2">
                                Time Conflict:
                              </div>
                              {session.suggestedTimeStart &&
                                session.suggestedTimeEnd && (
                                  <div className="text-blue-200 space-y-1">
                                    <div className="text-sm">
                                      <span className="text-green-300">
                                        Suggested Start:
                                      </span>{" "}
                                      {new Date(
                                        session.suggestedTimeStart
                                      ).toLocaleString()}
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-red-300">
                                        Suggested End:
                                      </span>{" "}
                                      {new Date(
                                        session.suggestedTimeEnd
                                      ).toLocaleString()}
                                    </div>
                                    {session.optionalQuery && (
                                      <div className="text-sm border-t border-blue-800 pt-2 mt-2">
                                        <span className="text-blue-300">
                                          Comment:
                                        </span>{" "}
                                        {session.optionalQuery}
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(session.id)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date | undefined;
  defaultHour?: number | undefined;
  rooms: RoomLite[];
  faculties: Faculty[];
  onCreate: () => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultHour,
  rooms,
  faculties,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("");
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [status, setStatus] = useState<"Draft" | "Confirmed">("Draft");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && defaultDate && defaultHour !== undefined) {
      const startDate = new Date(defaultDate);
      startDate.setHours(defaultHour, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(defaultHour + 1, 0, 0, 0);

      const formatDateTime = (date: Date) => {
        const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return d.toISOString().slice(0, 16);
      };

      setStartDateTime(formatDateTime(startDate));
      setEndDateTime(formatDateTime(endDate));
    }
  }, [isOpen, defaultDate, defaultHour]);

  const resetForm = () => {
    setTitle("");
    setFacultyId("");
    setEmail("");
    setPlace("");
    setRoomId("");
    setDescription("");
    setStartDateTime("");
    setEndDateTime("");
    setStatus("Draft");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startTime = new Date(startDateTime);
      const endTime = new Date(endDateTime);

      if (endTime <= startTime) {
        alert("End time must be after start time");
        return;
      }

      const durationMinutes =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        alert("Session must be at least 15 minutes long");
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("facultyId", facultyId);
      formData.append("email", email);
      formData.append("place", place);
      formData.append("roomId", roomId);
      formData.append("description", description);
      formData.append("startTime", startTime.toISOString());
      formData.append("endTime", endTime.toISOString());
      formData.append("status", status);
      formData.append("inviteStatus", "Pending");
      formData.append("travelStatus", "Pending");

      const response = await fetch("/api/sessions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create session");
        return;
      }

      const result = await response.json();
      console.log("Session created successfully:", result);

      resetForm();
      onCreate();
      onClose();
      alert("Session created successfully!");
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Create New Session
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 mt-1">
            Fill in the details to create a new session
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter session title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Faculty *
                </label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Faculty Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="faculty@university.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Place/Location *
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Main Campus, Building A"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "Draft" | "Confirmed")
                }
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Session description, objectives, and key topics..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Session
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SessionsCalendarView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState<Date | undefined>(
    undefined
  );
  const [newSessionHour, setNewSessionHour] = useState<number | undefined>(
    undefined
  );

  const POLL_INTERVAL = 3000;

  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [sessionsRes, roomsRes, facultiesRes] = await Promise.all([
        fetch("/api/sessions", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" }),
        fetch("/api/faculties", { cache: "no-store" }),
      ]);

      if (!sessionsRes.ok || !roomsRes.ok || !facultiesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const sessionsData = await sessionsRes.json();
      const roomsData = await roomsRes.json();
      const facultiesData = await facultiesRes.json();

      const sessionsList =
        sessionsData?.data?.sessions ||
        sessionsData?.sessions ||
        sessionsData ||
        [];
      const roomsList = roomsData || [];
      const facultiesList = facultiesData || [];

      if (Array.isArray(sessionsList)) {
        const enhancedSessions = sessionsList.map((session: any) => ({
          ...session,
          roomName: roomsList.find((r: RoomLite) => r.id === session.roomId)
            ?.name,
        }));

        setSessions(enhancedSessions);
        setRooms(roomsList);
        setFaculties(facultiesList);
        setLastUpdateTime(new Date().toLocaleTimeString());
      } else {
        setError(sessionsData?.error || "Failed to fetch sessions");
      }
    } catch (err) {
      setError("Error fetching sessions");
      console.error("Error:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleNewSessionClick = () => {
    setNewSessionDate(new Date());
    setNewSessionHour(9);
    setShowCreateModal(true);
  };

  const handleEmptySlotClick = (date: Date, hour: number) => {
    setNewSessionDate(date);
    setNewSessionHour(hour);
    setShowCreateModal(true);
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: format(new Date().setHours(hour, 0, 0, 0), "HH:mm"),
        displayLabel: format(new Date().setHours(hour, 0, 0, 0), "h a"),
      });
    }
    return slots;
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      days.push({
        date,
        dayName: format(date, "EEE"),
        dateNumber: format(date, "d"),
        fullDate: format(date, "MMM d, yyyy"),
        isToday: isSameDay(date, new Date()),
      });
    }
    return days;
  }, [currentWeek]);

  const getSessionsForSlot = (date: Date, hour: number) => {
    return sessions.filter((session) => {
      if (!session.startTime || !session.endTime) return false;

      const sessionDate = new Date(session.startTime);
      const sessionStart = sessionDate.getHours();
      const sessionEnd = new Date(session.endTime).getHours();

      return (
        isSameDay(sessionDate, date) &&
        hour >= sessionStart &&
        hour < sessionEnd
      );
    });
  };

  const getSessionStyle = (session: Session) => {
    if (!session.startTime || !session.endTime) return {};

    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    const startPosition = (startHour * 60 + startMinute) / 60;
    const duration =
      (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;

    return {
      top: `${startPosition * 60}px`,
      height: `${Math.max(duration * 60 - 4, 30)}px`,
    };
  };

  const getSessionColor = (session: Session) => {
    if (session.inviteStatus === "Accepted") {
      return "bg-green-600/90 border-l-green-400 text-white shadow-lg shadow-green-600/20";
    } else if (
      session.inviteStatus === "Declined" &&
      (session.rejectionReason === "SuggestedTopic" ||
        session.rejectionReason === "TimeConflict")
    ) {
      return "bg-yellow-600/90 border-l-yellow-400 text-white shadow-lg shadow-yellow-600/20";
    } else if (session.inviteStatus === "Declined") {
      return "bg-red-600/90 border-l-red-400 text-white shadow-lg shadow-red-600/20";
    } else if (session.inviteStatus === "Pending") {
      return "bg-blue-600/90 border-l-blue-400 text-white shadow-lg shadow-blue-600/20";
    } else {
      return "bg-gray-600/90 border-l-gray-400 text-white shadow-lg shadow-gray-600/20";
    }
  };

  const handleSlotClick = (
    date: Date,
    hour: number,
    sessionsInSlot: Session[]
  ) => {
    if (sessionsInSlot.length === 0) {
      handleEmptySlotClick(date, hour);
      return;
    }

    setSelectedSessions(sessionsInSlot);
    setSelectedDate(format(date, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${format(new Date().setHours(hour), "h a")} - ${format(
        new Date().setHours(hour + 1),
        "h a"
      )}`
    );
    setIsModalOpen(true);
  };

  const handleSessionClick = (session: Session) => {
    const sessionDate = new Date(session.startTime);
    setSelectedSessions([session]);
    setSelectedDate(format(sessionDate, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${format(new Date(session.startTime), "h:mm a")} - ${format(
        new Date(session.endTime),
        "h:mm a"
      )}`
    );
    setIsModalOpen(true);
  };

  const handleSessionUpdate = (
    sessionId: string,
    updates: Partial<Session>
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
    fetchSessions(false);
  };

  const handleSessionDelete = (sessionId: string) => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== sessionId)
    );
    fetchSessions(false);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek(
      direction === "next" ? addDays(currentWeek, 7) : subDays(currentWeek, 7)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchSessions(true)}
            className="mt-2 text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Sessions Calendar
              </h1>
              <p className="text-gray-400">
                Real-time schedule overview • Last updated: {lastUpdateTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Updates
            </div>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => fetchSessions(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNewSessionClick}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("prev")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-white">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
              {format(
                endOfWeek(currentWeek, { weekStartsOn: 1 }),
                "MMM d, yyyy"
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("next")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="flex overflow-hidden">
        <div className="bg-gray-900 border-r border-gray-800 w-20 flex-shrink-0">
          <div className="h-16 border-b border-gray-800"></div>
          {timeSlots.map((slot) => (
            <div
              key={slot.hour}
              className="h-15 border-b border-gray-800/50 flex items-start justify-center pt-1"
              style={{ height: "60px" }}
            >
              <span className="text-xs text-gray-400 font-medium">
                {slot.displayLabel}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-full">
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className="flex-1 border-r border-gray-800 min-w-0"
              >
                <div
                  className={`h-16 border-b border-gray-800 flex flex-col items-center justify-center ${
                    day.isToday
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-gray-900"
                  }`}
                >
                  <div className="text-xs font-medium text-gray-400 uppercase">
                    {day.dayName}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      day.isToday ? "text-blue-400" : "text-white"
                    }`}
                  >
                    {day.dateNumber}
                  </div>
                </div>

                <div className="relative">
                  {timeSlots.map((slot) => {
                    const sessionsInSlot = getSessionsForSlot(
                      day.date,
                      slot.hour
                    );
                    return (
                      <div
                        key={slot.hour}
                        className="h-15 border-b border-gray-800/30 relative hover:bg-gray-800/20 cursor-pointer transition-colors"
                        style={{ height: "60px" }}
                        onClick={() =>
                          handleSlotClick(day.date, slot.hour, sessionsInSlot)
                        }
                      >
                        <div className="absolute inset-0" />
                      </div>
                    );
                  })}

                  {sessions
                    .filter((session) => {
                      if (!session.startTime) return false;
                      return isSameDay(new Date(session.startTime), day.date);
                    })
                    .map((session) => {
                      const style = getSessionStyle(session);
                      const colorClass = getSessionColor(session);

                      return (
                        <div
                          key={session.id}
                          className={`absolute left-2 right-2 rounded-lg border-l-4 p-3 text-xs hover:scale-[1.02] transition-all cursor-pointer ${colorClass}`}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                        >
                          <div className="font-semibold truncate mb-1">
                            {session.title}
                          </div>
                          <div className="text-xs opacity-90 truncate mb-1">
                            {session.facultyName}
                          </div>

                          <div className="absolute top-1 right-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                session.inviteStatus === "Accepted"
                                  ? "bg-green-300"
                                  : session.inviteStatus === "Declined" &&
                                    (session.rejectionReason ===
                                      "SuggestedTopic" ||
                                      session.rejectionReason ===
                                        "TimeConflict")
                                  ? "bg-yellow-300"
                                  : session.inviteStatus === "Declined"
                                  ? "bg-red-300"
                                  : "bg-blue-300"
                              }`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SessionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessions={selectedSessions}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        rooms={rooms}
        onSessionUpdate={handleSessionUpdate}
        onSessionDelete={handleSessionDelete}
      />

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultDate={newSessionDate}
        defaultHour={newSessionHour}
        rooms={rooms}
        faculties={faculties}
        onCreate={() => {
          fetchSessions(true);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default SessionsCalendarView;
