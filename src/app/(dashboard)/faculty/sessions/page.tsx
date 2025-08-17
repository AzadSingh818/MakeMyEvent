"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Activity,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react";
import { FacultyLayout } from "@/components/dashboard/layout";
import { useAuth } from "@/hooks/use-auth";

export default function FacultyAllSessionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Respond state
  const [respondSubmitting, setRespondSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<
    "NotInterested" | "SuggestedTopic" | "TimeConflict"
  >("NotInterested");
  const [suggestedTopic, setSuggestedTopic] = useState("");
  const [suggestedStart, setSuggestedStart] = useState("");
  const [suggestedEnd, setSuggestedEnd] = useState("");
  const [optionalQuery, setOptionalQuery] = useState("");

  const fetchAll = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/faculty/sessions?email=${encodeURIComponent(user.email)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load sessions");
      const j = await res.json();
      setSessions(j.data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user?.email]);

  const openDecline = (id: string) => {
    setDeclineTargetId(id);
    setDeclineReason("NotInterested");
    setSuggestedTopic("");
    setSuggestedStart("");
    setSuggestedEnd("");
    setOptionalQuery("");
    setDeclineOpen(true);
  };

  const acceptInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      const res = await fetch(`/api/sessions/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, inviteStatus: "Accepted" }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, inviteStatus: "Accepted" } : s))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setRespondSubmitting(false);
    }
  };

  const submitDecline = async () => {
    if (!declineTargetId) return;
    try {
      setRespondSubmitting(true);
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
      if (!res.ok) throw new Error("Failed to decline");

      setSessions((prev) =>
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
      setDeclineOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setRespondSubmitting(false);
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/faculty/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">All Sessions</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="py-10 text-center text-slate-400">
              Loading...
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="py-10 text-center text-slate-400">
              No sessions yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <Card
                key={session.id}
                className={`border transition-colors ${
                  session.inviteStatus === "Pending"
                    ? "border-amber-400/30 bg-amber-900/20 hover:bg-amber-900/30"
                    : session.inviteStatus === "Accepted"
                    ? "border-emerald-400/30 bg-emerald-900/20 hover:bg-emerald-900/30"
                    : session.inviteStatus === "Declined"
                    ? "border-rose-400/30 bg-rose-900/20 hover:bg-rose-900/30"
                    : "border-slate-700/60 bg-slate-900/30 hover:bg-slate-900/40"
                }`}
              >
                <CardContent className="p-4">
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
                          {session.formattedTime ||
                            `${session.formattedStartTime || ""}${
                              session.formattedEndTime
                                ? ` - ${session.formattedEndTime}`
                                : ""
                            }`}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {session.place} - {session.roomName}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {session.daysUntil > 0
                            ? `${session.daysUntil} days to go`
                            : session.daysUntil === 0
                            ? "Today"
                            : "Past session"}
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          {session.sessionStatus || session.status}
                        </div>
                      </div>

                      {session.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      {session.inviteStatus === "Pending" && (
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-amber-300 font-medium">
                            Response required - Check your portal for actions
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                      {session.inviteStatus === "Accepted" && (
                        <Badge variant="outline" className="text-xs">
                          Confirmed
                        </Badge>
                      )}
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          disabled={
                            respondSubmitting ||
                            session.inviteStatus === "Accepted"
                          }
                          onClick={() => acceptInvite(session.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            respondSubmitting ||
                            session.inviteStatus === "Declined"
                          }
                          onClick={() => openDecline(session.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Decline Invitation</h3>
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
