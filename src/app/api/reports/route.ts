// // src/app/api/reports/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// import { authConfig } from '@/lib/auth/config';
// import { z } from 'zod';

// // Validation schemas
// const ReportQuerySchema = z.object({
//   eventId: z.string().optional(),
//   type: z.enum(['analytics', 'attendance', 'sessions', 'faculty', 'certificates']).optional(),
//   format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
//   startDate: z.string().optional(),
//   endDate: z.string().optional(),
//   halls: z.string().optional(), // comma-separated hall IDs
//   roles: z.string().optional(), // comma-separated roles
//   includeCharts: z.boolean().default(true),
//   includeRawData: z.boolean().default(false)
// });

// const ExportRequestSchema = z.object({
//   reportType: z.enum(['executive_summary', 'detailed_analytics', 'attendance_report', 'faculty_performance']),
//   format: z.enum(['pdf', 'excel', 'csv', 'png']),
//   eventId: z.string().optional(),
//   dateRange: z.object({
//     start: z.string(),
//     end: z.string()
//   }).optional(),
//   sections: z.array(z.string()).optional(),
//   filters: z.record(z.any()).optional(),
//   emailSettings: z.object({
//     recipients: z.array(z.string().email()),
//     subject: z.string(),
//     message: z.string(),
//     scheduleType: z.enum(['immediate', 'daily', 'weekly', 'monthly'])
//   }).optional()
// });

// // GET - Fetch analytics data
// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const queryData = Object.fromEntries(searchParams.entries());
    
//     // Ensure boolean-like strings are passed as strings for schema parsing
//     if (typeof queryData.includeCharts === 'boolean') {
//       queryData.includeCharts = queryData.includeCharts ? 'true' : 'false';
//     }
//     if (typeof queryData.includeRawData === 'boolean') {
//       queryData.includeRawData = queryData.includeRawData ? 'true' : 'false';
//     }
    
//     const validatedQuery = ReportQuerySchema.parse(queryData);
    
//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     // Build date filters
//     const dateFilters: any = {};
//     if (validatedQuery.startDate) {
//       dateFilters.gte = new Date(validatedQuery.startDate);
//     }
//     if (validatedQuery.endDate) {
//       dateFilters.lte = new Date(validatedQuery.endDate);
//     }

//     // Role-based access control
//     const whereClause: any = {};
//     if (validatedQuery.eventId) {
//       whereClause.eventId = validatedQuery.eventId;
//     }

//     if (user.role === 'Hall_Coordinator') {
//       // Hall coordinators can only see their events
//       const coordinatorEvents = await prisma.event.findMany({
//         where: { coordinatorId: user.id },
//         select: { id: true }
//       });
//       whereClause.eventId = {
//         in: coordinatorEvents.map((e: { id: any; }) => e.id)
//       };
//     } else if (!['Organizer', 'Event_Manager'].includes(user.role)) {
//       return NextResponse.json(
//         { error: 'Insufficient permissions' },
//         { status: 403 }
//       );
//     }

//     // Fetch analytics data based on type
//     switch (validatedQuery.type) {
//       case 'analytics':
//         return await getAnalyticsData(whereClause, dateFilters, validatedQuery);
      
//       case 'attendance':
//         return await getAttendanceData(whereClause, dateFilters, validatedQuery);
      
//       case 'sessions':
//         return await getSessionsData(whereClause, dateFilters, validatedQuery);
      
//       case 'faculty':
//         return await getFacultyData(whereClause, dateFilters, validatedQuery);
      
//       case 'certificates':
//         return await getCertificatesData(whereClause, dateFilters, validatedQuery);
      
//       default:
//         return await getOverallAnalytics(whereClause, dateFilters, validatedQuery);
//     }

//   } catch (error) {
//     console.error('Error fetching reports:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid query parameters', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // POST - Generate export/report
// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const validatedData = ExportRequestSchema.parse(body);

//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user || !['Organizer', 'Event_Manager'].includes(user.role)) {
//       return NextResponse.json(
//         { error: 'Insufficient permissions' },
//         { status: 403 }
//       );
//     }

//     // Create export job
//     const exportJob = await prisma.exportJob.create({
//       data: {
//         userId: user.id,
//         reportType: validatedData.reportType,
//         format: validatedData.format,
//         eventId: validatedData.eventId,
//         parameters: {
//           dateRange: validatedData.dateRange,
//           sections: validatedData.sections,
//           filters: validatedData.filters
//         },
//         status: 'Pending',
//         createdAt: new Date()
//       }
//     });

//     // Process export asynchronously
//     processExportJob(exportJob.id, validatedData);

//     // Send email if configured
//     if (validatedData.emailSettings) {
//       await scheduleEmailReport(exportJob.id, validatedData.emailSettings);
//     }

//     return NextResponse.json({
//       message: 'Export job created successfully',
//       jobId: exportJob.id,
//       estimatedCompletion: getEstimatedCompletion(validatedData.reportType, validatedData.format)
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error creating export:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid request data', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Helper function: Get overall analytics
// async function getOverallAnalytics(whereClause: any, dateFilters: any, query: any) {
//   const [events, sessions, registrations, attendance, certificates] = await Promise.all([
//     // Events data
//     prisma.event.findMany({
//       where: whereClause,
//       include: {
//         _count: {
//           select: {
//             sessions: true,
//             registrations: true
//           }
//         }
//       }
//     }),

//     // Sessions data
//     prisma.session.findMany({
//       where: {
//         ...whereClause,
//         ...(dateFilters && Object.keys(dateFilters).length > 0 ? { date: dateFilters } : {})
//       },
//       include: {
//         _count: {
//           select: {
//             attendance: true
//           }
//         },
//         faculty: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     }),

//     // Registrations data
//     prisma.registration.findMany({
//       where: {
//         ...whereClause,
//         ...(dateFilters && Object.keys(dateFilters).length > 0 ? { createdAt: dateFilters } : {})
//       },
//       include: {
//         user: {
//           select: {
//             role: true
//           }
//         }
//       }
//     }),

//     // Attendance data
//     prisma.attendance.findMany({
//       where: {
//         session: whereClause,
//         ...(dateFilters && Object.keys(dateFilters).length > 0 ? { checkInTime: dateFilters } : {})
//       },
//       include: {
//         session: {
//           select: {
//             name: true,
//             hall: true,
//             capacity: true
//           }
//         }
//       }
//     }),

//     // Certificates data
//     prisma.certificate.findMany({
//       where: {
//         ...whereClause,
//         ...(dateFilters && Object.keys(dateFilters).length > 0 ? { createdAt: dateFilters } : {})
//       }
//     })
//   ]);

//   // Calculate metrics
//   const totalEvents = events.length;
//   const totalSessions = sessions.length;
//   const totalRegistrations = registrations.length;
//   const totalAttendance = attendance.length;
//   const totalCertificates = certificates.length;

//   // Role distribution
//   const roleDistribution = registrations.reduce((acc: { [x: string]: any; }, reg: { user: { role: any; }; }) => {
//     const role = reg.user.role;
//     acc[role] = (acc[role] || 0) + 1;
//     return acc;
//   }, {} as Record<string, number>);

//   // Attendance rate
//   const totalCapacity = sessions.reduce((sum: any, session: { capacity: any; }) => sum + (session.capacity || 0), 0);
//   const attendanceRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

//   // Time-based trends
//   const dailyStats = attendance.reduce((acc: { [x: string]: { attendance: number; sessions: Set<any> }; }, att: { checkInTime: { toISOString: () => string; }; sessionId: any; }) => {
//     const date = att.checkInTime?.toISOString().split('T')[0] || 'unknown';
//     if (!acc[date]) acc[date] = { attendance: 0, sessions: new Set() };
//     acc[date].attendance++;
//     acc[date].sessions.add(att.sessionId);
//     return acc;
//   }, {} as Record<string, { attendance: number; sessions: Set<any> }>);

//   const trends = Object.entries(dailyStats).map(([date, data]) => {
//     const d = data as { attendance: number; sessions: Set<any> };
//     return {
//       date,
//       attendance: d.attendance,
//       sessions: d.sessions.size
//     };
//   });

//   return NextResponse.json({
//     summary: {
//       totalEvents,
//       totalSessions,
//       totalRegistrations,
//       totalAttendance,
//       totalCertificates,
//       attendanceRate: Math.round(attendanceRate * 10) / 10
//     },
//     roleDistribution,
//     trends,
//     topSessions: sessions
//       .sort((a: { _count: { attendance: number; }; }, b: { _count: { attendance: number; }; }) => b._count.attendance - a._count.attendance)
//       .slice(0, 10)
//       .map((session: { id: any; name: any; faculty: { name: any; }; hall: any; _count: { attendance: number; }; capacity: number; }) => ({
//         id: session.id,
//         name: session.name,
//         faculty: session.faculty?.name,
//         hall: session.hall,
//         attendance: session._count.attendance,
//         capacity: session.capacity,
//         attendanceRate: session.capacity ? (session._count.attendance / session.capacity) * 100 : 0
//       })),
//     generatedAt: new Date().toISOString()
//   });
// }

// // Helper function: Get attendance data
// async function getAttendanceData(whereClause: any, dateFilters: any, query: any) {
//   const attendance = await prisma.attendance.findMany({
//     where: {
//       session: whereClause,
//       ...(dateFilters && Object.keys(dateFilters).length > 0 ? { checkInTime: dateFilters } : {})
//     },
//     include: {
//       session: {
//         select: {
//           id: true,
//           name: true,
//           hall: true,
//           capacity: true,
//           date: true,
//           startTime: true
//         }
//       },
//       user: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true
//         }
//       }
//     }
//   });

//   // Group by session
//   const sessionAttendance = attendance.reduce((acc: { [x: string]: { session: any; attendees: any[]; qrScans: number; manualCheckins: number; lateArrivals: number; }; }, att: { sessionId: any; session: { startTime: number; }; user: any; checkInTime: number; method: string; }) => {
//     const sessionId = att.sessionId;
//     if (!acc[sessionId]) {
//       acc[sessionId] = {
//         session: att.session,
//         attendees: [],
//         qrScans: 0,
//         manualCheckins: 0,
//         lateArrivals: 0
//       };
//     }
    
//     acc[sessionId].attendees.push({
//       user: att.user,
//       checkInTime: att.checkInTime,
//       method: att.method,
//       isLate: att.checkInTime ? att.checkInTime > att.session.startTime : false
//     });

//     if (att.method === 'QR') acc[sessionId].qrScans++;
//     else acc[sessionId].manualCheckins++;
    
//     if (att.checkInTime && att.checkInTime > att.session.startTime) {
//       acc[sessionId].lateArrivals++;
//     }

//     return acc;
//   }, {} as { [x: string]: { session: any; attendees: any[]; qrScans: number; manualCheckins: number; lateArrivals: number; }; });

//   return NextResponse.json({
//     sessionAttendance: Object.values(sessionAttendance),
//     summary: {
//       totalSessions: Object.keys(sessionAttendance).length,
//       totalAttendees: attendance.length,
//       avgAttendanceRate: Object.values(sessionAttendance).reduce((sum: number, s: any) => 
//         sum + (s.attendees.length / (s.session.capacity || 1)), 0
//       ) / Object.keys(sessionAttendance).length * 100,
//       qrScansTotal: Object.values(sessionAttendance).reduce((sum: number, s: any) => sum + s.qrScans, 0),
//       manualCheckinsTotal: Object.values(sessionAttendance).reduce((sum: number, s: any) => sum + s.manualCheckins, 0)
//     },
//     generatedAt: new Date().toISOString()
//   });
// }

// // Helper function: Get sessions data
// async function getSessionsData(whereClause: any, dateFilters: any, query: any) {
//   const sessions = await prisma.session.findMany({
//     where: {
//       ...whereClause,
//       ...(dateFilters && Object.keys(dateFilters).length > 0 ? { date: dateFilters } : {})
//     },
//     include: {
//       faculty: {
//         select: {
//           id: true,
//           name: true,
//           email: true
//         }
//       },
//       _count: {
//         select: {
//           attendance: true,
//           feedback: true
//         }
//       },
//       feedback: {
//         select: {
//           rating: true,
//           comment: true,
//           createdAt: true
//         }
//       }
//     }
//   });

//   // Calculate session metrics
//   const sessionsWithMetrics = sessions.map((session: { feedback: any[]; capacity: number; _count: { attendance: number; feedback: number; }; id: any; name: any; faculty: { name: any; }; hall: any; date: any; startTime: any; endTime: any; }) => {
//     const feedbackRatings = session.feedback.map(f => f.rating).filter(r => r !== null);
//     const avgRating = feedbackRatings.length > 0 
//       ? feedbackRatings.reduce((sum, rating) => sum + rating, 0) / feedbackRatings.length 
//       : 0;

//     const attendanceRate = session.capacity 
//       ? (session._count.attendance / session.capacity) * 100 
//       : 0;

//     return {
//       id: session.id,
//       name: session.name,
//       faculty: session.faculty?.name,
//       hall: session.hall,
//       date: session.date,
//       startTime: session.startTime,
//       endTime: session.endTime,
//       capacity: session.capacity,
//       attended: session._count.attendance,
//       attendanceRate: Math.round(attendanceRate * 10) / 10,
//       avgRating: Math.round(avgRating * 10) / 10,
//       totalFeedback: session._count.feedback,
//       feedbackRate: session._count.attendance > 0 
//         ? (session._count.feedback / session._count.attendance) * 100 
//         : 0
//     };
//   });

//   return NextResponse.json({
//     sessions: sessionsWithMetrics,
//     summary: {
//       totalSessions: sessions.length,
//       avgAttendanceRate: sessionsWithMetrics.reduce((sum: any, s: { attendanceRate: any; }) => sum + s.attendanceRate, 0) / sessions.length,
//       avgRating: sessionsWithMetrics.reduce((sum: any, s: { avgRating: any; }) => sum + s.avgRating, 0) / sessions.length,
//       totalFeedback: sessionsWithMetrics.reduce((sum: any, s: { totalFeedback: any; }) => sum + s.totalFeedback, 0)
//     },
//     topRatedSessions: sessionsWithMetrics
//       .sort((a: { avgRating: number; }, b: { avgRating: number; }) => b.avgRating - a.avgRating)
//       .slice(0, 10),
//     mostAttendedSessions: sessionsWithMetrics
//       .sort((a: { attendanceRate: number; }, b: { attendanceRate: number; }) => b.attendanceRate - a.attendanceRate)
//       .slice(0, 10),
//     generatedAt: new Date().toISOString()
//   });
// }

// // Helper function: Get faculty data
// async function getFacultyData(whereClause: any, dateFilters: any, query: any) {
//   const faculty = await prisma.user.findMany({
//     where: {
//       role: 'Faculty',
//       sessions: {
//         some: whereClause
//       }
//     },
//     include: {
//       sessions: {
//         where: whereClause,
//         include: {
//           _count: {
//             select: {
//               attendance: true,
//               feedback: true
//             }
//           },
//           feedback: {
//             select: {
//               rating: true
//             }
//           }
//         }
//       },
//       _count: {
//         select: {
//           certificates: true
//         }
//       }
//     }
//   });

//   const facultyMetrics = faculty.map((f: { sessions: any; id: any; name: any; email: any; _count: { certificates: any; }; }) => {
//     const sessions = f.sessions;
//     const totalSessions = sessions.length;
//     const totalAttendance = sessions.reduce((sum: any, s: { _count: { attendance: any; }; }) => sum + s._count.attendance, 0);
//     const totalCapacity = sessions.reduce((sum: any, s: { capacity: any; }) => sum + (s.capacity || 0), 0);
//     const avgAttendanceRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

//     const allRatings = sessions.flatMap((s: { feedback: any[]; }) => s.feedback.map(f => f.rating)).filter((r: null) => r !== null);
//     const avgRating = allRatings.length > 0 
//       ? allRatings.reduce((sum: any, rating: any) => sum + rating, 0) / allRatings.length 
//       : 0;

//     const totalFeedback = sessions.reduce((sum: any, s: { _count: { feedback: any; }; }) => sum + s._count.feedback, 0);

//     return {
//       id: f.id,
//       name: f.name,
//       email: f.email,
//       totalSessions,
//       totalAttendance,
//       avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
//       avgRating: Math.round(avgRating * 10) / 10,
//       totalFeedback,
//       certificatesIssued: f._count.certificates,
//       engagementScore: Math.round(((avgRating / 5) * 50 + (avgAttendanceRate / 100) * 50) * 10) / 10
//     };
//   });

//   return NextResponse.json({
//     faculty: facultyMetrics,
//     summary: {
//       totalFaculty: faculty.length,
//       avgRating: facultyMetrics.reduce((sum: any, f: { avgRating: any; }) => sum + f.avgRating, 0) / faculty.length,
//       avgAttendanceRate: facultyMetrics.reduce((sum: any, f: { avgAttendanceRate: any; }) => sum + f.avgAttendanceRate, 0) / faculty.length,
//       totalSessions: facultyMetrics.reduce((sum: any, f: { totalSessions: any; }) => sum + f.totalSessions, 0),
//       totalCertificates: facultyMetrics.reduce((sum: any, f: { certificatesIssued: any; }) => sum + f.certificatesIssued, 0)
//     },
//     topRatedFaculty: facultyMetrics
//       .sort((a: { avgRating: number; }, b: { avgRating: number; }) => b.avgRating - a.avgRating)
//       .slice(0, 10),
//     mostEngagedFaculty: facultyMetrics
//       .sort((a: { engagementScore: number; }, b: { engagementScore: number; }) => b.engagementScore - a.engagementScore)
//       .slice(0, 10),
//     generatedAt: new Date().toISOString()
//   });
// }

// // Helper function: Get certificates data
// async function getCertificatesData(whereClause: any, dateFilters: any, query: any) {
//   const certificates = await prisma.certificate.findMany({
//     where: {
//       ...whereClause,
//       ...(dateFilters && Object.keys(dateFilters).length > 0 ? { createdAt: dateFilters } : {})
//     },
//     include: {
//       event: {
//         select: {
//           name: true,
//           date: true
//         }
//       },
//       recipient: {
//         select: {
//           name: true,
//           role: true
//         }
//       }
//     }
//   });

//   const statusDistribution = certificates.reduce((acc: { [x: string]: any; }, cert: { status: string | number; }) => {
//     acc[cert.status] = (acc[cert.status] || 0) + 1;
//     return acc;
//   }, {} as Record<string, number>);

//   const roleDistribution = certificates.reduce((acc: { [x: string]: any; }, cert: { role: string | number; }) => {
//     acc[cert.role] = (acc[cert.role] || 0) + 1;
//     return acc;
//   }, {} as Record<string, number>);

//   return NextResponse.json({
//     certificates: certificates.map((cert: { id: any; recipientName: any; role: any; event: { name: any; }; status: any; createdAt: any; templateId: any; }) => ({
//       id: cert.id,
//       recipientName: cert.recipientName,
//       role: cert.role,
//       eventName: cert.event.name,
//       status: cert.status,
//       issuedDate: cert.createdAt,
//       templateId: cert.templateId
//     })),
//     summary: {
//       totalCertificates: certificates.length,
//       statusDistribution,
//       roleDistribution,
//       issuanceRate: statusDistribution.Generated || 0,
//       deliveryRate: statusDistribution.Sent || 0
//     },
//     generatedAt: new Date().toISOString()
//   });
// }

// // Helper functions for export processing
// async function processExportJob(jobId: string, exportData: any) {
//   // This would be implemented with a background job queue
//   // For now, we simulate the process
//   setTimeout(async () => {
//     try {
//       await prisma.exportJob.update({
//         where: { id: jobId },
//         data: { 
//           status: 'Processing',
//           progress: 50,
//           updatedAt: new Date()
//         }
//       });

//       // Simulate processing time
//       setTimeout(async () => {
//         await prisma.exportJob.update({
//           where: { id: jobId },
//           data: { 
//             status: 'Completed',
//             progress: 100,
//             downloadUrl: `/downloads/export-${jobId}.${exportData.format}`,
//             fileSize: getEstimatedFileSize(exportData.reportType, exportData.format),
//             updatedAt: new Date()
//           }
//         });
//       }, 5000);

//     } catch (error) {
//       await prisma.exportJob.update({
//         where: { id: jobId },
//         data: { 
//           status: 'Failed',
//           error: error instanceof Error ? error.message : 'Unknown error',
//           updatedAt: new Date()
//         }
//       });
//     }
//   }, 1000);
// }

// async function scheduleEmailReport(jobId: string, emailSettings: any) {
//   // Implementation would integrate with email service
//   console.log(`Scheduling email report for job ${jobId}:`, emailSettings);
// }

// function getEstimatedCompletion(reportType: string, format: string): string {
//   const times = {
//     executive_summary: { pdf: '30s', excel: '45s', csv: '15s', png: '1m' },
//     detailed_analytics: { pdf: '2m', excel: '3m', csv: '30s', png: '2.5m' },
//     attendance_report: { pdf: '45s', excel: '1m', csv: '20s', png: '1.5m' },
//     faculty_performance: { pdf: '1m', excel: '1.5m', csv: '25s', png: '2m' }
//   };
  
//   return times[reportType as keyof typeof times]?.[format as keyof typeof times.executive_summary] || '1m';
// }

// function getEstimatedFileSize(reportType: string, format: string): string {
//   const sizes = {
//     executive_summary: { pdf: '2.4 MB', excel: '1.8 MB', csv: '0.5 MB', png: '3.2 MB' },
//     detailed_analytics: { pdf: '7.8 MB', excel: '5.4 MB', csv: '2.1 MB', png: '12.5 MB' },
//     attendance_report: { pdf: '1.9 MB', excel: '1.3 MB', csv: '0.8 MB', png: '2.8 MB' },
//     faculty_performance: { pdf: '3.6 MB', excel: '2.7 MB', csv: '1.2 MB', png: '5.1 MB' }
//   };
  
//   return sizes[reportType as keyof typeof sizes]?.[format as keyof typeof sizes.executive_summary] || '2.0 MB';
// }

// function getAnalyticsData(whereClause: any, dateFilters: any, validatedQuery: { includeCharts: boolean; includeRawData: boolean; format: "json" | "csv" | "excel" | "pdf"; eventId?: string | undefined; type?: "analytics" | "attendance" | "sessions" | "faculty" | "certificates" | undefined; startDate?: string | undefined; endDate?: string | undefined; halls?: string | undefined; roles?: string | undefined; }) {
//   throw new Error('Function not implemented.');
// }
