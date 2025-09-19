import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

interface AcceptedFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AcceptedFacultyModal: React.FC<AcceptedFacultyModalProps> = ({ isOpen, onClose }) => {
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
      console.log('Accepted Modal opened, resetting state...');
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
      console.log('Accepted Modal - Event selected:', selectedEventId);
      fetchSessions(selectedEventId);
      setFacultyList([]);
      setSelectedSessionId('');
    }
  }, [selectedEventId, initialLoad]);

  useEffect(() => {
    if (selectedSessionId && selectedEventId) {
      console.log('Accepted Modal - Session/All selected:', selectedSessionId);
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
      console.log('Accepted Modal - Fetching events...');
      
      const response = await fetch('/api/approvals?type=events');
      console.log('Accepted Modal - Events API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Accepted Modal - Events API result:', result);
      
      if (result.success) {
        setEvents(result.data);
        console.log('Accepted Modal - Events set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Accepted Modal - Error fetching events:', error);
      setError(`Failed to load events: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSessions = async (eventId: string) => {
    try {
      console.log('Accepted Modal - Fetching sessions for event:', eventId);
      const response = await fetch(`/api/approvals?type=sessions&eventId=${eventId}`);
      console.log('Accepted Modal - Sessions API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Accepted Modal - Sessions API result:', result);
      
      if (result.success) {
        setSessions(result.data);
        console.log('Accepted Modal - Sessions set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Accepted Modal - Error fetching sessions:', error);
      setError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchFacultyByEvent = async (eventId: string) => {
    setLoading(true);
    try {
      console.log('Accepted Modal - Fetching accepted faculty for all sessions in event:', eventId);
      const response = await fetch(`/api/approvals?type=faculty&eventId=${eventId}&status=ACCEPTED`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Accepted Modal - Faculty by Event API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Accepted Modal - Faculty list (all sessions) set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Accepted Modal - Error fetching faculty by event:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyBySession = async (sessionId: string) => {
    setLoading(true);
    try {
      console.log('Accepted Modal - Fetching accepted faculty for session:', sessionId);
      const response = await fetch(`/api/approvals?type=faculty&sessionId=${sessionId}&status=ACCEPTED`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Accepted Modal - Faculty by Session API result:', result);
      
      if (result.success) {
        setFacultyList(result.data);
        console.log('Accepted Modal - Faculty list (single session) set successfully:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Accepted Modal - Error fetching faculty by session:', error);
      setError(`Failed to load faculty: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    console.log('Event changed to:', eventId);
    setSelectedEventId(eventId);
  };

  const handleSessionChange = (sessionId: string) => {
    console.log('Session changed to:', sessionId);
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
      'Invite Date': faculty.invitationDate ? new Date(faculty.invitationDate).toLocaleDateString() : 'N/A',
      'Status': 'ACCEPTED',
      'Accepted Date': faculty.responseDate ? new Date(faculty.responseDate).toLocaleDateString() : 'N/A'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    const sheetName = selectedSessionId === 'all' ? 'Accepted Faculty (All Sessions)' : 'Accepted Faculty';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const eventName = events.find(e => e.id === selectedEventId)?.name || 'Event';
    const fileName = selectedSessionId === 'all' 
      ? `${eventName}_Accepted_Faculty_All_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`
      : `${eventName}_Accepted_Faculty_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h2 className="text-2xl font-bold">Accepted Faculty</h2>
                    <p className="text-green-100">View faculty who have accepted invitations</p>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading && initialLoad}
                  >
                    <option value="">Choose an event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} ({event.acceptedCount} accepted)
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
                      console.log('Accepted Modal - Session selected:', e.target.value);
                      handleSessionChange(e.target.value);
                    }}
                    disabled={!selectedEventId || sessions.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Choose a session ({sessions.length} available)</option>
                    {selectedEventId && sessions.length > 0 && (
                      <option value="all" className="font-semibold text-green-700">
                        🔄 All Sessions ({sessions.reduce((acc, session) => acc + session.acceptedCount, 0)} total accepted)
                      </option>
                    )}
                    {sessions.map(session => {
                      console.log('Accepted Modal - Rendering session option:', session);
                      return (
                        <option key={session.id} value={session.id}>
                          {session.title} ({session.acceptedCount} accepted)
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
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">
                    {initialLoad ? 'Loading events...' : 'Loading accepted faculty...'}
                  </span>
                </div>
              ) : !selectedEventId ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                    Choose a specific session or select "All Sessions" to view all accepted faculty for this event
                  </p>
                </div>
              ) : facultyList.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Accepted Faculty Found
                  </h3>
                  <p className="text-gray-500">
                    {selectedSessionId === 'all' 
                      ? 'No faculty have accepted invitations for any sessions in this event yet.'
                      : 'No faculty have accepted invitations for this session yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {facultyList.length} Accepted Faculty 
                          {selectedSessionId === 'all' ? ' (All Sessions)' : ''}
                        </span>
                      </div>
                      {selectedSessionId === 'all' && (
                        <div className="text-sm text-green-600">
                          Showing faculty from {sessions.length} sessions
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {facultyList.map((faculty) => (
                      <div key={faculty.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{faculty.name}</h3>
                            <p className="text-sm text-gray-600">{faculty.email}</p>
                            <p className="text-sm text-gray-500">{faculty.institution}</p>
                            <p className="text-sm text-gray-500">{faculty.designation}</p>
                            {selectedSessionId === 'all' && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-700">
                                  📍 {faculty.sessionTitle}
                                </p>
                                <p className="text-xs text-green-600">
                                  Session ID: {faculty.sessionId}
                                </p>
                              </div>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Accepted
                          </Badge>
                        </div>
                        {faculty.responseDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Accepted on: {new Date(faculty.responseDate).toLocaleDateString()}
                          </p>
                        )}
                        {faculty.responseMessage && (
                          <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            "{faculty.responseMessage}"
                          </p>
                        )}
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
      )}
    </>
  );
};

export default AcceptedFacultyModal;