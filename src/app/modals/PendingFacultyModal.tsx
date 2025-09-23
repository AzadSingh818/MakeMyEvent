import React, { useState, useEffect } from 'react';
import { X, Download, Clock, Mail, Phone, Users, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  responseStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE';
  responseDate: string | null;
  responseMessage: string | null;
  rejectionReason: string | null;
  invitationDate: string;
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

const PendingFacultyModal: React.FC<PendingFacultyModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting state...');
      setSelectedEventId('');
      setSelectedSessionId('');
      setSessions([]);
      setFacultyList([]);
      setError(null);
      setInitialLoad(true);
      setSendingReminders(new Set());
      fetchEvents();
    }
  }, [isOpen]);

  // When event is selected, fetch sessions only (not faculty)
  useEffect(() => {
    if (selectedEventId && !initialLoad) {
      console.log('Event selected:', selectedEventId);
      fetchSessions(selectedEventId);
      setFacultyList([]);
      setSelectedSessionId('');
    }
  }, [selectedEventId, initialLoad]);

  // When session is selected OR "all" is selected, fetch faculty
  useEffect(() => {
    if (selectedSessionId && selectedEventId) {
      console.log('Session/All selected:', selectedSessionId);
      if (selectedSessionId === 'all') {
        fetchFacultyByEvent(selectedEventId);
      } else {
        fetchFacultyBySession(selectedSessionId);
      }
    }
  }, [selectedSessionId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching events...');
      
      const response = await fetch('/api/approvals?type=events');
      console.log('Events API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Events API result:', result);
      
      if (result.success) {
        setEvents(result.data);
        console.log('Events set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(`Failed to load events: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSessions = async (eventId: string) => {
    try {
      console.log('Fetching sessions for event:', eventId);
      const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
      console.log('Sessions API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Sessions API result:', result);
      
      if (result.success) {
        setSessions(result.data);
        console.log('Sessions set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchFacultyByEvent = async (eventId: string) => {
    setLoading(true);
    try {
      console.log('Fetching pending faculty for all sessions in event:', eventId);
      const response = await fetch(`/api/approvals?type=faculty&eventId=${eventId}&status=PENDING`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Faculty by Event API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Faculty list (all sessions) set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty by event:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyBySession = async (sessionId: string) => {
    setLoading(true);
    try {
      console.log('Fetching pending faculty for session:', sessionId);
      const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=PENDING`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Faculty API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Faculty list set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty by session:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    console.log('Event changed to:', eventId);
    setSelectedEventId(eventId);
    setSelectedSessionId('');
    setSessions([]);
    setFacultyList([]);
    setError(null);
  };

  const handleSessionChange = (sessionId: string) => {
    console.log('Session changed to:', sessionId);
    setSelectedSessionId(sessionId);
  };

  const handleSendReminder = async (faculty: ApprovalFaculty) => {
    // Prevent duplicate sends
    if (sendingReminders.has(faculty.id)) {
      console.log('Already sending reminder to:', faculty.email);
      return;
    }

    console.log('Starting to send reminder to faculty:', faculty.email);
    setSendingReminders(prev => new Set(prev).add(faculty.id));

    try {
      console.log('Preparing request data for:', faculty.email);

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

      console.log('Request data:', requestData);

      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response received - Status:', response.status, 'OK:', response.ok);

      // Check if response is ok first
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('Response error text:', errorText);
        } catch (textError) {
          console.error('Could not read error text:', textError);
          errorText = `HTTP ${response.status} error`;
        }
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown server error'}`);
      }

      // Try to parse JSON only if response is ok
      let result;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (responseText) {
          result = JSON.parse(responseText);
          console.log('Parsed result:', result);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

      if (result && result.success) {
        // Show success message
        alert(`✅ Reminder email sent successfully to ${faculty.email}`);
        console.log('✅ Email sent successfully:', result);
      } else {
        throw new Error(result?.error || result?.message || 'Failed to send reminder - unknown error');
      }

    } catch (error) {
      console.error('❌ Error sending reminder:', error);
      
      // Show more specific error message
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`❌ Failed to send reminder to ${faculty.email}\n\nError: ${errorMessage}`);
    } finally {
      console.log('Cleaning up sending state for:', faculty.email);
      setSendingReminders(prev => {
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
    if (facultyList.length === 0) {
      alert('No data to export');
      return;
    }

    const excelData = facultyList.map(faculty => ({
      'Name': faculty.name,
      'Email': faculty.email,
      'Event': faculty.eventName,
      'Session': faculty.sessionTitle,
      'Invitation Sent Date': faculty.invitationDate ? new Date(faculty.invitationDate).toLocaleDateString() : 'N/A',
      'Days Pending': faculty.daysPending || 0,
      'Status': 'PENDING'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    const sheetName = selectedSessionId === 'all' ? 'Pending Faculty (All Sessions)' : 'Pending Faculty';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const eventName = events.find(e => e.id === selectedEventId)?.name || 'Event';
    const fileName = selectedSessionId === 'all' 
      ? `${eventName}_Pending_Faculty_All_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`
      : `${eventName}_Pending_Faculty_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Pending Faculty</h2>
                <p className="text-yellow-100">Faculty who haven't responded to session invitations</p>
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

        {/* Filters */}
        <div className="bg-gray-50 border-b p-6">
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
                {events.map(event => (
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
                <option value="">Choose a session ({sessions.length} available)</option>
                {selectedEventId && sessions.length > 0 && (
                  <option value="all" className="font-semibold text-yellow-700">
                    🔄 All Sessions ({sessions.reduce((acc, session) => acc + session.pendingCount, 0)} total pending)
                  </option>
                )}
                {sessions.map(session => (
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
                disabled={facultyList.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={facultyList.length === 0 ? "No data available to export" : "Export to Excel"}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <span className="ml-3 text-gray-600">
                {initialLoad ? 'Loading events...' : 'Loading pending faculty...'}
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
                Choose a specific session or select "All Sessions" to view all pending faculty for this event
              </p>
            </div>
          ) : facultyList.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Faculty Found
              </h3>
              <p className="text-gray-500">
                {selectedSessionId === 'all' 
                  ? 'No faculty have pending invitations for any sessions in this event.'
                  : 'No faculty have pending invitations for this session.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {facultyList.length} Pending Faculty 
                      {selectedSessionId === 'all' ? ' (All Sessions)' : ''}
                    </span>
                  </div>
                  {selectedSessionId === 'all' && (
                    <div className="text-sm text-yellow-600">
                      Showing faculty from {sessions.length} sessions
                    </div>
                  )}
                </div>
              </div>

              {/* Faculty List */}
              <div className="grid gap-4">
                {facultyList.map(faculty => (
                  <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{faculty.name}</h4>
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
                            <p><strong>Email:</strong> {faculty.email}</p>
                            <p><strong>Institution:</strong> {faculty.institution}</p>
                            <p><strong>Designation:</strong> {faculty.designation}</p>
                          </div>
                          <div>
                            <p><strong>Session:</strong> {faculty.sessionTitle}</p>
                            <p><strong>Specialization:</strong> {faculty.specialization}</p>
                            {faculty.phone && <p><strong>Phone:</strong> {faculty.phone}</p>}
                          </div>
                        </div>
                        {selectedSessionId === 'all' && (
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
                          <p className="text-gray-600">
                            <strong>Invitation Sent:</strong> {new Date(faculty.invitationDate).toLocaleDateString()}
                          </p>
                          {faculty.daysPending && (
                            <p className={`${faculty.daysPending > 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                              <strong>Days Pending:</strong> {faculty.daysPending} days
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
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
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
                              onClick={() => handleContact(faculty.phone, faculty.email)}
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



// import React, { useState, useEffect } from 'react';
// import { X, Download, Clock, Mail, Phone, Users, AlertTriangle } from 'lucide-react';
// import * as XLSX from 'xlsx';

// interface ApprovalFaculty {
//   id: string;
//   name: string;
//   email: string;
//   institution: string;
//   designation: string;
//   specialization: string;
//   phone: string;
//   sessionId: string;
//   sessionTitle: string;
//   eventId: string;
//   eventName: string;
//   responseStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE';
//   responseDate: string | null;
//   responseMessage: string | null;
//   rejectionReason: string | null;
//   invitationDate: string;
//   daysPending?: number;
// }

// interface EventWithStats {
//   id: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   location: string;
//   totalInvitations: number;
//   acceptedCount: number;
//   declinedCount: number;
//   pendingCount: number;
//   tentativeCount: number;
// }

// interface SessionWithStats {
//   id: string;
//   title: string;
//   startTime: string;
//   endTime: string;
//   hallName: string;
//   totalInvitations: number;
//   acceptedCount: number;
//   declinedCount: number;
//   pendingCount: number;
//   tentativeCount: number;
// }

// interface PendingFacultyModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PendingFacultyModal: React.FC<PendingFacultyModalProps> = ({ isOpen, onClose }) => {
//   const [events, setEvents] = useState<EventWithStats[]>([]);
//   const [sessions, setSessions] = useState<SessionWithStats[]>([]);
//   const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
//   const [selectedEventId, setSelectedEventId] = useState<string>('');
//   const [selectedSessionId, setSelectedSessionId] = useState<string>('');
//   const [loading, setLoading] = useState(false);
//   const [initialLoad, setInitialLoad] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Reset all state when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       console.log('Modal opened, resetting state...');
//       setSelectedEventId('');
//       setSelectedSessionId('');
//       setSessions([]);
//       setFacultyList([]);
//       setError(null);
//       setInitialLoad(true);
//       fetchEvents();
//     }
//   }, [isOpen]);

//   // When event is selected, fetch sessions only (not faculty)
//   useEffect(() => {
//     if (selectedEventId && !initialLoad) {
//       console.log('Event selected:', selectedEventId);
//       fetchSessions(selectedEventId);
//       setFacultyList([]);
//       setSelectedSessionId('');
//     }
//   }, [selectedEventId, initialLoad]);

//   // When session is selected OR "all" is selected, fetch faculty
//   useEffect(() => {
//     if (selectedSessionId && selectedEventId) {
//       console.log('Session/All selected:', selectedSessionId);
//       if (selectedSessionId === 'all') {
//         fetchFacultyByEvent(selectedEventId);
//       } else {
//         fetchFacultyBySession(selectedSessionId);
//       }
//     }
//   }, [selectedSessionId]);

//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       console.log('Fetching events...');
      
//       const response = await fetch('/api/approvals?type=events');
//       console.log('Events API response status:', response.status);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
//       console.log('Events API result:', result);
      
//       if (result.success) {
//         setEvents(result.data);
//         console.log('Events set successfully:', result.data.length);
//       } else {
//         throw new Error(result.error || 'Failed to fetch events');
//       }
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       setError(`Failed to load events: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setLoading(false);
//       setInitialLoad(false);
//     }
//   };

//   const fetchSessions = async (eventId: string) => {
//     try {
//       console.log('Fetching sessions for event:', eventId);
//       const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
//       console.log('Sessions API response status:', response.status);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
//       console.log('Sessions API result:', result);
      
//       if (result.success) {
//         setSessions(result.data);
//         console.log('Sessions set successfully:', result.data.length);
//       } else {
//         throw new Error(result.error || 'Failed to fetch sessions');
//       }
//     } catch (error) {
//       console.error('Error fetching sessions:', error);
//       setError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   const fetchFacultyByEvent = async (eventId: string) => {
//     setLoading(true);
//     try {
//       console.log('Fetching pending faculty for all sessions in event:', eventId);
//       const response = await fetch(`/api/approvals?type=faculty&eventId=${eventId}&status=PENDING`);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
//       console.log('Faculty by Event API result:', result);
      
//       if (result.success) {
//         setFacultyList(result.data);
//         console.log('Faculty list (all sessions) set successfully:', result.data.length);
//       } else {
//         throw new Error(result.error || 'Failed to fetch faculty');
//       }
//     } catch (error) {
//       console.error('Error fetching faculty by event:', error);
//       setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFacultyBySession = async (sessionId: string) => {
//     setLoading(true);
//     try {
//       console.log('Fetching pending faculty for session:', sessionId);
//       const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=PENDING`);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
//       console.log('Faculty API result:', result);
      
//       if (result.success) {
//         setFacultyList(result.data);
//         console.log('Faculty list set successfully:', result.data.length);
//       } else {
//         throw new Error(result.error || 'Failed to fetch faculty');
//       }
//     } catch (error) {
//       console.error('Error fetching faculty by session:', error);
//       setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEventChange = (eventId: string) => {
//     console.log('Event changed to:', eventId);
//     setSelectedEventId(eventId);
//     setSelectedSessionId('');
//     setSessions([]);
//     setFacultyList([]);
//     setError(null);
//   };

//   const handleSessionChange = (sessionId: string) => {
//     console.log('Session changed to:', sessionId);
//     setSelectedSessionId(sessionId);
//   };

//   const handleSendReminder = async (facultyId: string, facultyEmail: string) => {
//     console.log('Sending reminder to:', facultyEmail);
//     alert(`Reminder would be sent to ${facultyEmail}`);
//   };

//   const handleContact = (facultyPhone: string, facultyEmail: string) => {
//     const mailtoLink = `mailto:${facultyEmail}?subject=Faculty Session Invitation Follow-up`;
//     window.open(mailtoLink);
//   };

//   const handleExport = () => {
//     if (facultyList.length === 0) {
//       alert('No data to export');
//       return;
//     }

//     const excelData = facultyList.map(faculty => ({
//       'Name': faculty.name,
//       'Email': faculty.email,
//       'Event': faculty.eventName,
//       'Session': faculty.sessionTitle,
//       'Invitation Sent Date': faculty.invitationDate ? new Date(faculty.invitationDate).toLocaleDateString() : 'N/A',
//       'Status': 'PENDING'
//     }));

//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(excelData);

//     const colWidths = [
//       { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 12 }
//     ];
//     ws['!cols'] = colWidths;

//     const sheetName = selectedSessionId === 'all' ? 'Pending Faculty (All Sessions)' : 'Pending Faculty';
//     XLSX.utils.book_append_sheet(wb, ws, sheetName);

//     const eventName = events.find(e => e.id === selectedEventId)?.name || 'Event';
//     const fileName = selectedSessionId === 'all' 
//       ? `${eventName}_Pending_Faculty_All_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`
//       : `${eventName}_Pending_Faculty_${new Date().toISOString().split('T')[0]}.xlsx`;

//     XLSX.writeFile(wb, fileName);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <Clock className="w-6 h-6" />
//               <div>
//                 <h2 className="text-2xl font-bold">Pending Faculty</h2>
//                 <p className="text-yellow-100">Faculty who haven't responded to session invitations</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-50 border-l-4 border-red-400 p-4">
//             <div className="flex">
//               <div className="ml-3">
//                 <p className="text-sm text-red-700">{error}</p>
//                 <button 
//                   onClick={() => {
//                     setError(null);
//                     fetchEvents();
//                   }}
//                   className="text-red-600 hover:text-red-800 underline text-sm mt-1"
//                 >
//                   Try again
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Filters - FIXED LAYOUT */}
//         <div className="bg-gray-50 border-b p-6">
//           {/* Changed to 3-column grid to always show export button */}
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//             {/* Event Selection - Takes 5 columns */}
//             <div className="lg:col-span-5">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Event *
//               </label>
//               <select
//                 value={selectedEventId}
//                 onChange={(e) => handleEventChange(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                 disabled={loading && initialLoad}
//               >
//                 <option value="">Choose an event</option>
//                 {events.map(event => (
//                   <option key={event.id} value={event.id}>
//                     {event.name} ({event.pendingCount} pending)
//                   </option>
//                 ))}
//               </select>
//               {events.length === 0 && !loading && !error && (
//                 <p className="text-xs text-gray-500 mt-1">No events available</p>
//               )}
//             </div>

//             {/* Session Selection - Takes 5 columns */}
//             <div className="lg:col-span-5">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Session *
//               </label>
//               <select
//                 value={selectedSessionId}
//                 onChange={(e) => {
//                   console.log('Session selected:', e.target.value);
//                   handleSessionChange(e.target.value);
//                 }}
//                 disabled={!selectedEventId || sessions.length === 0}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100"
//               >
//                 <option value="">Choose a session ({sessions.length} available)</option>
//                 {selectedEventId && sessions.length > 0 && (
//                   <option value="all" className="font-semibold text-yellow-700">
//                     🔄 All Sessions ({sessions.reduce((acc, session) => acc + session.pendingCount, 0)} total pending)
//                   </option>
//                 )}
//                 {sessions.map(session => {
//                   console.log('Rendering session option:', session);
//                   return (
//                     <option key={session.id} value={session.id}>
//                       {session.title} ({session.pendingCount} pending)
//                     </option>
//                   );
//                 })}
//               </select>
//               {selectedEventId && sessions.length === 0 && !loading && (
//                 <p className="text-xs text-red-500 mt-1">No sessions available for this event</p>
//               )}
//             </div>

//             {/* Export Button - Takes 2 columns - ALWAYS VISIBLE */}
//             <div className="lg:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 &nbsp; {/* Spacer to align with other labels */}
//               </label>
//               <button
//                 onClick={handleExport}
//                 disabled={facultyList.length === 0}
//                 className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 title={facultyList.length === 0 ? "No data available to export" : "Export to Excel"}
//               >
//                 <Download className="w-4 h-4" />
//                 <span>Export</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto max-h-[60vh]">
//           {loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
//               <span className="ml-3 text-gray-600">
//                 {initialLoad ? 'Loading events...' : 'Loading pending faculty...'}
//               </span>
//             </div>
//           ) : !selectedEventId ? (
//             <div className="text-center py-12">
//               <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 Select an Event
//               </h3>
//               <p className="text-gray-500">
//                 Please select an event to view sessions and faculty
//               </p>
//             </div>
//           ) : !selectedSessionId ? (
//             <div className="text-center py-12">
//               <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 Select a Session or All Sessions
//               </h3>
//               <p className="text-gray-500">
//                 Choose a specific session or select "All Sessions" to view all pending faculty for this event
//               </p>
//             </div>
//           ) : facultyList.length === 0 ? (
//             <div className="text-center py-12">
//               <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 No Pending Faculty Found
//               </h3>
//               <p className="text-gray-500">
//                 {selectedSessionId === 'all' 
//                   ? 'No faculty have pending invitations for any sessions in this event.'
//                   : 'No faculty have pending invitations for this session.'
//                 }
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {/* Results Summary */}
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <Clock className="w-5 h-5 text-yellow-600" />
//                     <span className="font-medium text-yellow-800">
//                       {facultyList.length} Pending Faculty 
//                       {selectedSessionId === 'all' ? ' (All Sessions)' : ''}
//                     </span>
//                   </div>
//                   {selectedSessionId === 'all' && (
//                     <div className="text-sm text-yellow-600">
//                       Showing faculty from {sessions.length} sessions
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Faculty List */}
//               <div className="grid gap-4">
//                 {facultyList.map(faculty => (
//                   <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//                     <div className="flex justify-between items-start mb-3">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-3 mb-2">
//                           <h4 className="text-lg font-semibold text-gray-900">{faculty.name}</h4>
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
//                             PENDING
//                           </span>
//                           {faculty.daysPending && faculty.daysPending > 7 && (
//                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
//                               {faculty.daysPending} days overdue
//                             </span>
//                           )}
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
//                           <div>
//                             <p><strong>Email:</strong> {faculty.email}</p>
//                             <p><strong>Institution:</strong> {faculty.institution}</p>
//                             <p><strong>Designation:</strong> {faculty.designation}</p>
//                           </div>
//                           <div>
//                             <p><strong>Session:</strong> {faculty.sessionTitle}</p>
//                             <p><strong>Specialization:</strong> {faculty.specialization}</p>
//                             {faculty.phone && <p><strong>Phone:</strong> {faculty.phone}</p>}
//                           </div>
//                         </div>
//                         {selectedSessionId === 'all' && (
//                           <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
//                             <p className="text-sm font-medium text-yellow-700">
//                               📍 {faculty.sessionTitle}
//                             </p>
//                             <p className="text-xs text-yellow-600">
//                               Session ID: {faculty.sessionId}
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="border-t pt-3 mt-3">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                         <div>
//                           <p className="text-gray-600">
//                             <strong>Invitation Sent:</strong> {new Date(faculty.invitationDate).toLocaleDateString()}
//                           </p>
//                           {faculty.daysPending && (
//                             <p className={`${faculty.daysPending > 7 ? 'text-red-600' : 'text-yellow-600'}`}>
//                               <strong>Days Pending:</strong> {faculty.daysPending} days
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <div className="flex items-center space-x-2">
//                             <button
//                               onClick={() => handleSendReminder(faculty.id, faculty.email)}
//                               className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
//                             >
//                               <Mail className="w-3 h-3" />
//                               <span>Send Reminder</span>
//                             </button>
//                             <button
//                               onClick={() => handleContact(faculty.phone, faculty.email)}
//                               className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
//                             >
//                               <Phone className="w-3 h-3" />
//                               <span>Contact</span>
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
//               <div className="flex items-center space-x-2">
//                 <AlertTriangle className="w-5 h-5 text-red-600" />
//                 <span className="font-medium text-red-800">Error</span>
//               </div>
//               <p className="text-red-700 mt-1">{error}</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PendingFacultyModal;
