import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Clock,
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Search,
  Filter,
  CalendarDays,
  SortAsc,
  SortDesc,
  Calendar,
} from "lucide-react";
import * as XLSX from "xlsx";

interface ApprovalFaculty {
  id: string;
  name: string;
  email: string;
  institution: string;
  designation: string;
  specialization: string;
  phone: string;
  sessionId: string;
  sessionTitle: string;
  eventId: string;
  eventName: string;
  responseStatus: "ACCEPTED" | "DECLINED" | "PENDING" | "TENTATIVE";
  responseDate: string | null;
  responseMessage: string | null;
  rejectionReason: string | null;
  invitationDate: string;
  sessionCreatedDate: string; // ✅ NEW: Session creation date
  daysPending?: number;
}

interface EventWithStats {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

interface SessionWithStats {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hallName: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

interface PendingFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortField =
  | "name"
  | "email"
  | "institution"
  | "invitationDate"
  | "sessionCreatedDate"
  | "daysPending"
  | "sessionTitle";
type SortDirection = "asc" | "desc";

const PendingFacultyModal: React.FC<PendingFacultyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
  const [filteredFacultyList, setFilteredFacultyList] = useState<
    ApprovalFaculty[]
  >([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(
    new Set()
  );

  // ✅ UPDATED: Filter and Sort States with session creation date
  const [searchTerm, setSearchTerm] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [overdueDaysFilter, setOverdueDaysFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("sessionCreatedDate"); // ✅ UPDATED: Default sort by session creation
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<
    "sessionCreated" | "invitationSent"
  >("sessionCreated"); // ✅ NEW: Date filter type

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, resetting state...");
      setSelectedEventId("");
      setSelectedSessionId("");
      setSessions([]);
      setFacultyList([]);
      setFilteredFacultyList([]);
      setError(null);
      setInitialLoad(true);
      setSendingReminders(new Set());
      // Reset filters
      setSearchTerm("");
      setEmailFilter("");
      setInstitutionFilter("");
      setDateFromFilter("");
      setDateToFilter("");
      setOverdueDaysFilter("");
      setSortField("sessionCreatedDate");
      setSortDirection("desc");
      setShowAdvancedFilters(false);
      setDateFilterType("sessionCreated");
      fetchEvents();
    }
  }, [isOpen]);

  // When event is selected, fetch sessions only (not faculty)
  useEffect(() => {
    if (selectedEventId && !initialLoad) {
      console.log("Event selected:", selectedEventId);
      fetchSessions(selectedEventId);
      setFacultyList([]);
      setFilteredFacultyList([]);
      setSelectedSessionId("");
    }
  }, [selectedEventId, initialLoad]);

  // When session is selected OR "all" is selected, fetch faculty
  useEffect(() => {
    if (selectedSessionId && selectedEventId) {
      console.log("Session/All selected:", selectedSessionId);
      if (selectedSessionId === "all") {
        fetchFacultyByEvent(selectedEventId);
      } else {
        fetchFacultyBySession(selectedSessionId);
      }
    }
  }, [selectedSessionId]);

  // ✅ UPDATED: Apply filters and sorting with session creation date
  useEffect(() => {
    applyFiltersAndSorting();
  }, [
    facultyList,
    searchTerm,
    emailFilter,
    institutionFilter,
    dateFromFilter,
    dateToFilter,
    overdueDaysFilter,
    sortField,
    sortDirection,
    dateFilterType,
  ]);

  // ✅ UPDATED: Filter and Sort Logic with session creation date
  const applyFiltersAndSorting = () => {
    let filtered = [...facultyList];

    // Text search (name, email, session title)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (faculty) =>
          faculty.name.toLowerCase().includes(searchLower) ||
          faculty.email.toLowerCase().includes(searchLower) ||
          faculty.sessionTitle.toLowerCase().includes(searchLower) ||
          faculty.institution.toLowerCase().includes(searchLower) ||
          faculty.designation.toLowerCase().includes(searchLower) ||
          faculty.specialization.toLowerCase().includes(searchLower)
      );
    }

    // Email filter
    if (emailFilter.trim()) {
      const emailLower = emailFilter.toLowerCase().trim();
      filtered = filtered.filter((faculty) =>
        faculty.email.toLowerCase().includes(emailLower)
      );
    }

    // Institution filter
    if (institutionFilter.trim()) {
      const institutionLower = institutionFilter.toLowerCase().trim();
      filtered = filtered.filter((faculty) =>
        faculty.institution.toLowerCase().includes(institutionLower)
      );
    }

    // ✅ UPDATED: Date range filter - can filter by session creation or invitation date
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter((faculty) => {
        const compareDate =
          dateFilterType === "sessionCreated"
            ? new Date(faculty.sessionCreatedDate)
            : new Date(faculty.invitationDate);
        return compareDate >= fromDate;
      });
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((faculty) => {
        const compareDate =
          dateFilterType === "sessionCreated"
            ? new Date(faculty.sessionCreatedDate)
            : new Date(faculty.invitationDate);
        return compareDate <= toDate;
      });
    }

    // Overdue days filter (still based on invitation date for pending calculation)
    if (overdueDaysFilter) {
      const minOverdueDays = parseInt(overdueDaysFilter);
      if (!isNaN(minOverdueDays)) {
        filtered = filtered.filter(
          (faculty) =>
            faculty.daysPending && faculty.daysPending >= minOverdueDays
        );
      }
    }

    // ✅ UPDATED: Sort the filtered results with session creation date
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "institution":
          aValue = a.institution.toLowerCase();
          bValue = b.institution.toLowerCase();
          break;
        case "invitationDate":
          aValue = new Date(a.invitationDate);
          bValue = new Date(b.invitationDate);
          break;
        case "sessionCreatedDate": // ✅ NEW: Sort by session creation date
          aValue = new Date(a.sessionCreatedDate);
          bValue = new Date(b.sessionCreatedDate);
          break;
        case "daysPending":
          aValue = a.daysPending || 0;
          bValue = b.daysPending || 0;
          break;
        case "sessionTitle":
          aValue = a.sessionTitle.toLowerCase();
          bValue = b.sessionTitle.toLowerCase();
          break;
        default:
          aValue = new Date(a.sessionCreatedDate);
          bValue = new Date(b.sessionCreatedDate);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFacultyList(filtered);
  };

  // ✅ Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ✅ UPDATED: Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setEmailFilter("");
    setInstitutionFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setOverdueDaysFilter("");
    setSortField("sessionCreatedDate");
    setSortDirection("desc");
    setDateFilterType("sessionCreated");
  };

  // ✅ Get unique institutions for filter dropdown
  const getUniqueInstitutions = () => {
    const institutions = [...new Set(facultyList.map((f) => f.institution))];
    return institutions.sort();
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching events...");

      const response = await fetch("/api/approvals?type=events");
      console.log("Events API response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Events API result:", result);

      if (result.success) {
        setEvents(result.data);
        console.log("Events set successfully:", result.data.length);
      } else {
        throw new Error(result.error || "Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(
        `Failed to load events: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSessions = async (eventId: string) => {
    try {
      console.log("Fetching sessions for event:", eventId);
      const response = await fetch(
        `/api/approvals?type=sessions&eventId=${eventId}`
      );
      console.log("Sessions API response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Sessions API result:", result);

      if (result.success) {
        setSessions(result.data);
        console.log("Sessions set successfully:", result.data.length);
      } else {
        throw new Error(result.error || "Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError(
        `Failed to load sessions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const fetchFacultyByEvent = async (eventId: string) => {
    setLoading(true);
    try {
      console.log(
        "Fetching pending faculty for all sessions in event:",
        eventId
      );
      const response = await fetch(
        `/api/approvals?type=faculty&eventId=${eventId}&status=PENDING`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Faculty by Event API result:", result);

      if (result.success) {
        setFacultyList(result.data);
        console.log(
          "Faculty list (all sessions) set successfully:",
          result.data.length
        );
      } else {
        throw new Error(result.error || "Failed to fetch faculty");
      }
    } catch (error) {
      console.error("Error fetching faculty by event:", error);
      setError(
        `Failed to load faculty: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyBySession = async (sessionId: string) => {
    setLoading(true);
    try {
      console.log("Fetching pending faculty for session:", sessionId);
      const response = await fetch(
        `/api/approvals?type=faculty&sessionId=${sessionId}&status=PENDING`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Faculty API result:", result);

      if (result.success) {
        setFacultyList(result.data);
        console.log("Faculty list set successfully:", result.data.length);
      } else {
        throw new Error(result.error || "Failed to fetch faculty");
      }
    } catch (error) {
      console.error("Error fetching faculty by session:", error);
      setError(
        `Failed to load faculty: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    console.log("Event changed to:", eventId);
    setSelectedEventId(eventId);
    setSelectedSessionId("");
    setSessions([]);
    setFacultyList([]);
    setFilteredFacultyList([]);
    setError(null);
    // Clear filters when changing event
    clearAllFilters();
  };

  const handleSessionChange = (sessionId: string) => {
    console.log("Session changed to:", sessionId);
    setSelectedSessionId(sessionId);
    // Clear filters when changing session
    clearAllFilters();
  };

  const handleSendReminder = async (faculty: ApprovalFaculty) => {
    // Prevent duplicate sends
    if (sendingReminders.has(faculty.id)) {
      console.log("Already sending reminder to:", faculty.email);
      return;
    }

    console.log("Starting to send reminder to faculty:", faculty.email);
    setSendingReminders((prev) => new Set(prev).add(faculty.id));

    try {
      console.log("Preparing request data for:", faculty.email);

      const requestData = {
        facultyId: faculty.id,
        facultyEmail: faculty.email,
        facultyName: faculty.name,
        sessionTitle: faculty.sessionTitle,
        eventName: faculty.eventName,
        invitationDate: faculty.invitationDate,
        daysPending: faculty.daysPending,
        eventId: faculty.eventId,
      };

      console.log("Request data:", requestData);

      const response = await fetch("/api/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log(
        "Response received - Status:",
        response.status,
        "OK:",
        response.ok
      );

      // Check if response is ok first
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
          console.error("Response error text:", errorText);
        } catch (textError) {
          console.error("Could not read error text:", textError);
          errorText = `HTTP ${response.status} error`;
        }
        throw new Error(
          `HTTP ${response.status}: ${errorText || "Unknown server error"}`
        );
      }

      // Try to parse JSON only if response is ok
      let result;
      try {
        const responseText = await response.text();
        console.log("Raw response text:", responseText);

        if (responseText) {
          result = JSON.parse(responseText);
          console.log("Parsed result:", result);
        } else {
          throw new Error("Empty response from server");
        }
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error("Invalid JSON response from server");
      }

      if (result && result.success) {
        // Show success message
        alert(`✅ Reminder email sent successfully to ${faculty.email}`);
        console.log("✅ Email sent successfully:", result);
      } else {
        throw new Error(
          result?.error ||
            result?.message ||
            "Failed to send reminder - unknown error"
        );
      }
    } catch (error) {
      console.error("❌ Error sending reminder:", error);

      // Show more specific error message
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(
        `❌ Failed to send reminder to ${faculty.email}\n\nError: ${errorMessage}`
      );
    } finally {
      console.log("Cleaning up sending state for:", faculty.email);
      setSendingReminders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(faculty.id);
        return newSet;
      });
    }
  };

  const handleContact = (facultyPhone: string, facultyEmail: string) => {
    const mailtoLink = `mailto:${facultyEmail}?subject=Faculty Session Invitation Follow-up`;
    window.open(mailtoLink);
  };

  const handleExport = () => {
    if (filteredFacultyList.length === 0) {
      alert("No data to export");
      return;
    }

    // ✅ UPDATED: Export with session creation date
    const excelData = filteredFacultyList.map((faculty) => ({
      Name: faculty.name,
      Email: faculty.email,
      Institution: faculty.institution,
      Designation: faculty.designation,
      Specialization: faculty.specialization,
      Phone: faculty.phone || "N/A",
      Event: faculty.eventName,
      Session: faculty.sessionTitle,
      "Session Created Date": faculty.sessionCreatedDate
        ? new Date(faculty.sessionCreatedDate).toLocaleDateString()
        : "N/A",
      "Invitation Sent Date": faculty.invitationDate
        ? new Date(faculty.invitationDate).toLocaleDateString()
        : "N/A",
      "Days Pending": faculty.daysPending || 0,
      Status: "PENDING",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 20 },
      { wch: 30 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
    ];
    ws["!cols"] = colWidths;

    const sheetName =
      selectedSessionId === "all"
        ? "Pending Faculty (All Sessions)"
        : "Pending Faculty";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const eventName =
      events.find((e) => e.id === selectedEventId)?.name || "Event";
    const fileName =
      selectedSessionId === "all"
        ? `${eventName}_Pending_Faculty_All_Sessions_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        : `${eventName}_Pending_Faculty_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Pending Faculty</h2>
                <p className="text-yellow-100">
                  Faculty who haven't responded to session invitations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchEvents();
                  }}
                  className="text-red-600 hover:text-red-800 underline text-sm mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-gray-50 border-b">
          {/* Event and Session Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Event Selection */}
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  disabled={loading && initialLoad}
                >
                  <option value="">Choose an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({event.pendingCount} pending)
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Selection */}
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Session *
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSessionChange(e.target.value)}
                  disabled={!selectedEventId || sessions.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100"
                >
                  <option value="">
                    Choose a session ({sessions.length} available)
                  </option>
                  {selectedEventId && sessions.length > 0 && (
                    <option
                      value="all"
                      className="font-semibold text-yellow-700"
                    >
                      🔄 All Sessions (
                      {sessions.reduce(
                        (acc, session) => acc + session.pendingCount,
                        0
                      )}{" "}
                      total pending)
                    </option>
                  )}
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} ({session.pendingCount} pending)
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <button
                  onClick={handleExport}
                  disabled={filteredFacultyList.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={
                    filteredFacultyList.length === 0
                      ? "No data available to export"
                      : "Export filtered results to Excel"
                  }
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* ✅ UPDATED: Advanced Filters Section with Session Creation Date */}
          {facultyList.length > 0 && (
            <div className="p-6">
              {/* Filter Toggle Button */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>
                    {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                  </span>
                </button>

                {/* Results Summary */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Showing {filteredFacultyList.length} of {facultyList.length}{" "}
                    faculty
                  </span>
                  {(searchTerm ||
                    emailFilter ||
                    institutionFilter ||
                    dateFromFilter ||
                    dateToFilter ||
                    overdueDaysFilter) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                  {/* Search and Quick Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* General Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search (Name, Email, Session, etc.)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search anywhere..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Email Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter email to filter..."
                          value={emailFilter}
                          onChange={(e) => setEmailFilter(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Institution Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Institution
                      </label>
                      <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Institutions</option>
                        {getUniqueInstitutions().map((institution) => (
                          <option key={institution} value={institution}>
                            {institution}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ✅ UPDATED: Date and Days Filters with Date Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Date Filter Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Filter Type
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={dateFilterType}
                          onChange={(e) =>
                            setDateFilterType(
                              e.target.value as
                                | "sessionCreated"
                                | "invitationSent"
                            )
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="sessionCreated">
                            Session Created
                          </option>
                          <option value="invitationSent">
                            Invitation Sent
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Date From */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {dateFilterType === "sessionCreated"
                          ? "Session Created From"
                          : "Invitation Date From"}
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {dateFilterType === "sessionCreated"
                          ? "Session Created To"
                          : "Invitation Date To"}
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Overdue Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Days Overdue
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          placeholder="e.g. 7"
                          value={overdueDaysFilter}
                          onChange={(e) => setOverdueDaysFilter(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* ✅ UPDATED: Sort Options with Session Creation Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={sortField}
                          onChange={(e) =>
                            setSortField(e.target.value as SortField)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="sessionCreatedDate">
                            Session Created
                          </option>
                          <option value="invitationDate">
                            Invitation Date
                          </option>
                          <option value="daysPending">Days Pending</option>
                          <option value="name">Name</option>
                          <option value="email">Email</option>
                          <option value="institution">Institution</option>
                          <option value="sessionTitle">Session</option>
                        </select>
                        <button
                          onClick={() =>
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc"
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          title={
                            sortDirection === "asc"
                              ? "Sort Ascending"
                              : "Sort Descending"
                          }
                        >
                          {sortDirection === "asc" ? (
                            <SortAsc className="w-4 h-4" />
                          ) : (
                            <SortDesc className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ UPDATED: Quick Filter Buttons with Session Creation Date */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700 py-2">
                      Quick Filters:
                    </span>
                    <button
                      onClick={() => setOverdueDaysFilter("7")}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                    >
                      7+ Days Overdue
                    </button>
                    <button
                      onClick={() => setOverdueDaysFilter("14")}
                      className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm hover:bg-red-300 transition-colors"
                    >
                      14+ Days Overdue
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date(
                          today.getTime() - 7 * 24 * 60 * 60 * 1000
                        );
                        setDateFromFilter(
                          weekAgo.toISOString().split("T")[0] || ""
                        );
                        setDateToFilter(
                          today.toISOString().split("T")[0] || ""
                        );
                        setDateFilterType("sessionCreated");
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                    >
                      Sessions Created Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const monthAgo = new Date(
                          today.getTime() - 30 * 24 * 60 * 60 * 1000
                        );
                        setDateFromFilter(
                          monthAgo.toISOString().split("T")[0] || ""
                        );
                        setDateToFilter(
                          today.toISOString().split("T")[0] || ""
                        );
                        setDateFilterType("sessionCreated");
                      }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                    >
                      Sessions Created Last 30 Days
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(95vh - 320px)" }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <span className="ml-3 text-gray-600">
                {initialLoad
                  ? "Loading events..."
                  : "Loading pending faculty..."}
              </span>
            </div>
          ) : !selectedEventId ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select an Event
              </h3>
              <p className="text-gray-500">
                Please select an event to view sessions and faculty
              </p>
            </div>
          ) : !selectedSessionId ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Session or All Sessions
              </h3>
              <p className="text-gray-500">
                Choose a specific session or select "All Sessions" to view all
                pending faculty for this event
              </p>
            </div>
          ) : filteredFacultyList.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {facultyList.length === 0
                  ? "No Pending Faculty Found"
                  : "No Faculty Match Your Filters"}
              </h3>
              <p className="text-gray-500">
                {facultyList.length === 0
                  ? selectedSessionId === "all"
                    ? "No faculty have pending invitations for any sessions in this event."
                    : "No faculty have pending invitations for this session."
                  : "Try adjusting your filter criteria to see more results."}
              </p>
              {facultyList.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* ✅ UPDATED: Results Summary with Sort Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {filteredFacultyList.length} Pending Faculty
                      {selectedSessionId === "all" ? " (All Sessions)" : ""}
                      {filteredFacultyList.length < facultyList.length && (
                        <span className="text-sm text-yellow-600 ml-2">
                          (filtered from {facultyList.length} total)
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedSessionId === "all" && (
                    <div className="text-sm text-yellow-600">
                      Showing faculty from {sessions.length} sessions
                    </div>
                  )}
                </div>

                {/* Sort indicator */}
                <div className="mt-2 text-sm text-yellow-700 flex items-center space-x-4">
                  <span>
                    Sorted by{" "}
                    {sortField === "sessionCreatedDate"
                      ? "session creation date"
                      : sortField.replace(/([A-Z])/g, " $1").toLowerCase()}
                    ({sortDirection === "asc" ? "ascending" : "descending"})
                  </span>
                  {dateFromFilter || dateToFilter ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Date filter:{" "}
                      {dateFilterType === "sessionCreated"
                        ? "Session Created"
                        : "Invitation Sent"}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Faculty List */}
              <div className="grid gap-4">
                {filteredFacultyList.map((faculty) => (
                  <div
                    key={faculty.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {faculty.name}
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
                            PENDING
                          </span>
                          {faculty.daysPending && faculty.daysPending > 7 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              {faculty.daysPending} days overdue
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>Email:</strong> {faculty.email}
                            </p>
                            <p>
                              <strong>Institution:</strong>{" "}
                              {faculty.institution}
                            </p>
                            <p>
                              <strong>Designation:</strong>{" "}
                              {faculty.designation}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Session:</strong> {faculty.sessionTitle}
                            </p>
                            <p>
                              <strong>Specialization:</strong>{" "}
                              {faculty.specialization}
                            </p>
                            {faculty.phone && (
                              <p>
                                <strong>Phone:</strong> {faculty.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedSessionId === "all" && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-700">
                              📍 {faculty.sessionTitle}
                            </p>
                            <p className="text-xs text-yellow-600">
                              Session ID: {faculty.sessionId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          {/* ✅ UPDATED: Show both session creation and invitation dates */}
                          <p className="text-gray-600">
                            <strong>Session Created:</strong>{" "}
                            {new Date(
                              faculty.sessionCreatedDate
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-gray-600">
                            <strong>Invitation Sent:</strong>{" "}
                            {new Date(
                              faculty.invitationDate
                            ).toLocaleDateString()}
                          </p>
                          {faculty.daysPending && (
                            <p
                              className={`${
                                faculty.daysPending > 7
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              <strong>Days Pending:</strong>{" "}
                              {faculty.daysPending} days
                            </p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSendReminder(faculty)}
                              disabled={sendingReminders.has(faculty.id)}
                              className={`flex items-center space-x-1 px-3 py-1 text-white text-xs rounded transition-colors ${
                                sendingReminders.has(faculty.id)
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {sendingReminders.has(faculty.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3 h-3" />
                                  <span>Send Reminder</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleContact(faculty.phone, faculty.email)
                              }
                              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Contact</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingFacultyModal;
