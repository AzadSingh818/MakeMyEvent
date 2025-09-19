import React, { useState, useEffect } from 'react';
import { X, Download, XCircle, Users, AlertTriangle } from 'lucide-react';
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

interface RejectedFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RejectedFacultyModal: React.FC<RejectedFacultyModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [facultyList, setFacultyList] = useState<ApprovalFaculty[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('Rejected Modal opened, resetting state...');
      setSelectedEventId('');
      setSelectedSessionId('');
      setSessions([]);
      setFacultyList([]);
      setError(null);
      setInitialLoad(true);
      fetchEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEventId && !initialLoad) {
      console.log('Rejected Modal - Event selected:', selectedEventId);
      fetchSessions(selectedEventId);
      setFacultyList([]);
      setSelectedSessionId('');
    }
  }, [selectedEventId, initialLoad]);

  useEffect(() => {
    if (selectedSessionId && selectedEventId) {
      console.log('Rejected Modal - Session/All selected:', selectedSessionId);
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
      console.log('Rejected Modal - Fetching events...');
      
      const response = await fetch('/api/approvals?type=events');
      console.log('Rejected Modal - Events API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Rejected Modal - Events API result:', result);
      
      if (result.success) {
        setEvents(result.data);
        console.log('Rejected Modal - Events set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Rejected Modal - Error fetching events:', error);
      setError(`Failed to load events: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSessions = async (eventId: string) => {
    try {
      console.log('Rejected Modal - Fetching sessions for event:', eventId);
      const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
      console.log('Rejected Modal - Sessions API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Rejected Modal - Sessions API result:', result);
      
      if (result.success) {
        setSessions(result.data);
        console.log('Rejected Modal - Sessions set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Rejected Modal - Error fetching sessions:', error);
      setError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchFacultyByEvent = async (eventId: string) => {
    setLoading(true);
    try {
      console.log('Rejected Modal - Fetching rejected faculty for all sessions in event:', eventId);
      const response = await fetch(`/api/approvals?type=faculty&eventId=${eventId}&status=DECLINED`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Rejected Modal - Faculty by Event API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Rejected Modal - Faculty list (all sessions) set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Rejected Modal - Error fetching faculty by event:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyBySession = async (sessionId: string) => {
    setLoading(true);
    try {
      console.log('Rejected Modal - Fetching rejected faculty for session:', sessionId);
      const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=DECLINED`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Rejected Modal - Faculty API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Rejected Modal - Faculty list set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Rejected Modal - Error fetching faculty by session:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    console.log('Rejected Modal - Event changed to:', eventId);
    setSelectedEventId(eventId);
    setSelectedSessionId('');
    setSessions([]);
    setFacultyList([]);
    setError(null);
  };

  const handleSessionChange = (sessionId: string) => {
    console.log('Rejected Modal - Session changed to:', sessionId);
    setSelectedSessionId(sessionId);
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
      'Sent Date': faculty.invitationDate ? new Date(faculty.invitationDate).toLocaleDateString() : 'N/A',
      'Status': 'DECLINED',
      'Rejected Date': faculty.responseDate ? new Date(faculty.responseDate).toLocaleDateString() : 'N/A',
      'Reason': faculty.responseMessage || faculty.rejectionReason || 'No reason provided'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
    ];
    ws['!cols'] = colWidths;

    const sheetName = selectedSessionId === 'all' ? 'Rejected Faculty (All Sessions)' : 'Rejected Faculty';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const eventName = events.find(e => e.id === selectedEventId)?.name || 'Event';
    const fileName = selectedSessionId === 'all' 
      ? `${eventName}_Rejected_Faculty_All_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`
      : `${eventName}_Rejected_Faculty_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <XCircle className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Rejected Faculty</h2>
                <p className="text-red-100">Faculty who have declined session invitations</p>
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

        {/* Filters - FIXED LAYOUT */}
        <div className="bg-gray-50 border-b p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Event Selection - Takes 5 columns */}
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={loading && initialLoad}
              >
                <option value="">Choose an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.declinedCount} declined)
                  </option>
                ))}
              </select>
              {events.length === 0 && !loading && !error && (
                <p className="text-xs text-gray-500 mt-1">No events available</p>
              )}
            </div>

            {/* Session Selection - Takes 5 columns */}
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session *
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  console.log('Rejected Modal - Session selected:', e.target.value);
                  handleSessionChange(e.target.value);
                }}
                disabled={!selectedEventId || sessions.length === 0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
              >
                <option value="">Choose a session ({sessions.length} available)</option>
                {selectedEventId && sessions.length > 0 && (
                  <option value="all" className="font-semibold text-red-700">
                    🔄 All Sessions ({sessions.reduce((acc, session) => acc + session.declinedCount, 0)} total declined)
                  </option>
                )}
                {sessions.map(session => {
                  console.log('Rejected Modal - Rendering session option:', session);
                  return (
                    <option key={session.id} value={session.id}>
                      {session.title} ({session.declinedCount} declined)
                    </option>
                  );
                })}
              </select>
              {selectedEventId && sessions.length === 0 && !loading && (
                <p className="text-xs text-red-500 mt-1">No sessions available for this event</p>
              )}
            </div>

            {/* Export Button - Takes 2 columns - ALWAYS VISIBLE */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                &nbsp; {/* Spacer to align with other labels */}
              </label>
              <button
                onClick={handleExport}
                disabled={facultyList.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-3 text-gray-600">
                {initialLoad ? 'Loading events...' : 'Loading rejected faculty...'}
              </span>
            </div>
          ) : !selectedEventId ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                Choose a specific session or select "All Sessions" to view all rejected faculty for this event
              </p>
            </div>
          ) : facultyList.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Rejected Faculty Found
              </h3>
              <p className="text-gray-500">
                {selectedSessionId === 'all' 
                  ? 'No faculty have declined invitations for any sessions in this event.'
                  : 'No faculty have declined invitations for this session.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      {facultyList.length} Rejected Faculty 
                      {selectedSessionId === 'all' ? ' (All Sessions)' : ''}
                    </span>
                  </div>
                  {selectedSessionId === 'all' && (
                    <div className="text-sm text-red-600">
                      Showing faculty from {sessions.length} sessions
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {facultyList.map(faculty => (
                  <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{faculty.name}</h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                            DECLINED
                          </span>
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
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-sm font-medium text-red-700">
                              📍 {faculty.sessionTitle}
                            </p>
                            <p className="text-xs text-red-600">
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
                          {faculty.responseDate && (
                            <p className="text-gray-600">
                              <strong>Declined On:</strong> {new Date(faculty.responseDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {(faculty.responseMessage || faculty.rejectionReason) && (
                          <div>
                            <p className="text-red-700">
                              <strong>Rejection Reason:</strong>
                            </p>
                            <div className="text-red-600 italic bg-red-50 p-2 rounded border border-red-200 mt-1">
                              "{faculty.responseMessage || faculty.rejectionReason}"
                            </div>
                          </div>
                        )}
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

export default RejectedFacultyModal;