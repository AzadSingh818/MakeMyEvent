// 'use client';

// import React, { useState, useEffect } from 'react';
// import { CheckCircle, XCircle, Clock, Users, TrendingUp, Calendar, MapPin } from 'lucide-react';

// // Import your modal components (create these files in src/app/modals/)
// // import AcceptedFacultyModal from '@/app/modals/AcceptedFacultyModal';
// // import RejectedFacultyModal from '@/app/modals/RejectedFacultyModal';
// // import PendingFacultyModal from '@/app/modals/PendingFacultyModal';

// interface ApprovalStats {
//   ACCEPTED: number;
//   DECLINED: number;
//   PENDING: number;
//   TENTATIVE: number;
//   total: number;
// }

// interface Event {
//   id: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   location: string;
//   status: string;
//   totalInvitations: number;
//   acceptedCount: number;
//   declinedCount: number;
//   pendingCount: number;
// }

// const ApprovalsPage: React.FC = () => {
//   const [selectedEvent, setSelectedEvent] = useState<string>('');
//   const [events, setEvents] = useState<Event[]>([]);
//   const [stats, setStats] = useState<ApprovalStats>({
//     ACCEPTED: 0,
//     DECLINED: 0,
//     PENDING: 0,
//     TENTATIVE: 0,
//     total: 0
//   });
//   const [loading, setLoading] = useState(false);

//   // Modal states
//   const [showAcceptedModal, setShowAcceptedModal] = useState(false);
//   const [showRejectedModal, setShowRejectedModal] = useState(false);
//   const [showPendingModal, setShowPendingModal] = useState(false);

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   useEffect(() => {
//     if (selectedEvent) {
//       fetchStats(selectedEvent);
//     }
//   }, [selectedEvent]);

//   const fetchEvents = async () => {
//     try {
//       const response = await fetch('/api/approvals?type=events');
//       const result = await response.json();
//       if (result.success) {
//         setEvents(result.data);
//         // Auto-select first event if available
//         if (result.data.length > 0) {
//           setSelectedEvent(result.data[0].id);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching events:', error);
//     }
//   };

//   const fetchStats = async (eventId: string) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/approvals?type=stats&eventId=${eventId}`);
//       const result = await response.json();
//       if (result.success) {
//         setStats(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculatePercentage = (count: number, total: number) => {
//     return total > 0 ? Math.round((count / total) * 100) : 0;
//   };

//   const selectedEventData = events.find(e => e.id === selectedEvent);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Faculty Approvals</h1>
//               <p className="text-gray-600 mt-1">Monitor and manage faculty session invitations</p>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2 text-sm text-gray-500">
//                 <Users className="w-4 h-4" />
//                 <span>Total Invitations: {stats.total}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Event Selection */}
//         <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Choose Event
//               </label>
//               <select
//                 value={selectedEvent}
//                 onChange={(e) => setSelectedEvent(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="">Select an event</option>
//                 {events.map(event => (
//                   <option key={event.id} value={event.id}>
//                     {event.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             {selectedEventData && (
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <h3 className="font-medium text-gray-900 mb-2">{selectedEventData.name}</h3>
//                 <div className="space-y-1 text-sm text-gray-600">
//                   <div className="flex items-center space-x-2">
//                     <Calendar className="w-4 h-4" />
//                     <span>{new Date(selectedEventData.startDate).toLocaleDateString()} - {new Date(selectedEventData.endDate).toLocaleDateString()}</span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <MapPin className="w-4 h-4" />
//                     <span>{selectedEventData.location}</span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Users className="w-4 h-4" />
//                     <span>{selectedEventData.totalInvitations} total invitations</span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Stats Cards */}
//         {selectedEvent && (
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             {/* Accepted Card */}
//             <div 
//               className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
//               onClick={() => setShowAcceptedModal(true)}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Accepted</p>
//                   <p className="text-3xl font-bold text-green-600">{stats.ACCEPTED}</p>
//                   <p className="text-sm text-gray-500">
//                     {calculatePercentage(stats.ACCEPTED, stats.total)}% of total
//                   </p>
//                 </div>
//                 <CheckCircle className="w-8 h-8 text-green-500" />
//               </div>
//               <div className="mt-4">
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div 
//                     className="bg-green-500 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${calculatePercentage(stats.ACCEPTED, stats.total)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             {/* Rejected Card */}
//             <div 
//               className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
//               onClick={() => setShowRejectedModal(true)}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Rejected</p>
//                   <p className="text-3xl font-bold text-red-600">{stats.DECLINED}</p>
//                   <p className="text-sm text-gray-500">
//                     {calculatePercentage(stats.DECLINED, stats.total)}% of total
//                   </p>
//                 </div>
//                 <XCircle className="w-8 h-8 text-red-500" />
//               </div>
//               <div className="mt-4">
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div 
//                     className="bg-red-500 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${calculatePercentage(stats.DECLINED, stats.total)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             {/* Pending Card */}
//             <div 
//               className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
//               onClick={() => setShowPendingModal(true)}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Pending</p>
//                   <p className="text-3xl font-bold text-yellow-600">{stats.PENDING}</p>
//                   <p className="text-sm text-gray-500">
//                     {calculatePercentage(stats.PENDING, stats.total)}% of total
//                   </p>
//                 </div>
//                 <Clock className="w-8 h-8 text-yellow-500" />
//               </div>
//               <div className="mt-4">
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div 
//                     className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${calculatePercentage(stats.PENDING, stats.total)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             {/* Response Rate Card */}
//             <div className="bg-white rounded-lg shadow-sm border p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Response Rate</p>
//                   <p className="text-3xl font-bold text-blue-600">
//                     {calculatePercentage(stats.ACCEPTED + stats.DECLINED, stats.total)}%
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     {stats.ACCEPTED + stats.DECLINED} of {stats.total} responded
//                   </p>
//                 </div>
//                 <TrendingUp className="w-8 h-8 text-blue-500" />
//               </div>
//               <div className="mt-4">
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div 
//                     className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${calculatePercentage(stats.ACCEPTED + stats.DECLINED, stats.total)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* No Event Selected */}
//         {!selectedEvent && (
//           <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
//             <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Select an Event
//             </h3>
//             <p className="text-gray-500">
//               Choose an event from the dropdown above to view faculty approval statistics and details.
//             </p>
//           </div>
//         )}

//         {/* Loading State */}
//         {loading && selectedEvent && (
//           <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-500">Loading approval data...</p>
//           </div>
//         )}
//       </div>

//       {/* Modals - Uncomment these when you create the modal files */}
//       {/*
//       <AcceptedFacultyModal 
//         isOpen={showAcceptedModal} 
//         onClose={() => setShowAcceptedModal(false)} 
//       />
//       <RejectedFacultyModal 
//         isOpen={showRejectedModal} 
//         onClose={() => setShowRejectedModal(false)} 
//       />
//       <PendingFacultyModal 
//         isOpen={showPendingModal} 
//         onClose={() => setShowPendingModal(false)} 
//       />
//       */}
//     </div>
//   );
// };

// export default ApprovalsPage;