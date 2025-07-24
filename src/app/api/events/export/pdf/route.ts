// src/app/api/events/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';

// Permission check function
async function checkExportPermission(userId: string, eventId?: string) {
  try {
    console.log('🔍 Checking export permissions for user:', userId, 'eventId:', eventId);
    
    // If no specific event, check if user has any event management role
    if (!eventId) {
      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return { hasPermission: false, reason: 'User not found' };
      }
      
      // Allow ORGANIZER and EVENT_MANAGER to export all events
      const userRole = userResult.rows[0].role;
      if (['ORGANIZER', 'EVENT_MANAGER'].includes(userRole)) {
        return { hasPermission: true, role: userRole };
      }
      
      return { hasPermission: false, reason: 'Insufficient permissions for bulk export' };
    }
    
    // For specific event, check user-event relationship
    const permissionResult = await query(`
      SELECT 
        ue.role as event_role,
        ue.permissions,
        u.role as user_role,
        e.created_by
      FROM user_events ue
      JOIN users u ON u.id = ue.user_id
      JOIN events e ON e.id = ue.event_id
      WHERE ue.user_id = $1 AND ue.event_id = $2
    `, [userId, eventId]);
    
    if (permissionResult.rows.length === 0) {
      return { hasPermission: false, reason: 'No access to this event' };
    }
    
    const { event_role, user_role, created_by } = permissionResult.rows[0];
    
    // Check if user has export permissions
    const canExport = (
      user_role === 'ORGANIZER' ||
      user_role === 'EVENT_MANAGER' ||
      event_role === 'ORGANIZER' ||
      event_role === 'EVENT_MANAGER' ||
      created_by === userId
    );
    
    return { 
      hasPermission: canExport, 
      role: user_role,
      eventRole: event_role,
      isCreator: created_by === userId
    };
    
  } catch (error) {
    console.error('❌ Permission check error:', error);
    return { hasPermission: false, reason: 'Permission check failed' };
  }
}

// Fetch event data for PDF
async function fetchEventData(eventId?: string) {
  try {
    console.log('📊 Fetching event data for PDF generation...');
    
    if (eventId) {
      // Single event data
      console.log('🎯 Fetching data for event:', eventId);
      
      // Event details
      const eventResult = await query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date,
          e.end_date,
          e.location,
          e.status,
          e.created_at,
          e.updated_at,
          (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as participant_count
        FROM events e
        WHERE e.id = $1
      `, [eventId]);
      
      if (eventResult.rows.length === 0) {
        throw new Error('Event not found');
      }
      
      const event = eventResult.rows[0];
      
      // Sessions
      const sessionsResult = await query(`
        SELECT 
          cs.id,
          cs.title,
          cs.description,
          cs.start_time,
          cs.end_time,
          h.name as hall_name
        FROM conference_sessions cs
        LEFT JOIN halls h ON h.id = cs.hall_id
        WHERE cs.event_id = $1
        ORDER BY cs.start_time
      `, [eventId]);
      
      // Registrations
      const registrationsResult = await query(`
        SELECT 
          r.id,
          r.status,
          r.created_at as createdAt,
          u.name,
          u.email,
          u.institution
        FROM registrations r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_id = $1
        ORDER BY r.created_at DESC
      `, [eventId]);
      
      // Faculty
      const facultyResult = await query(`
        SELECT 
          ue.id,
          ue.role,
          u.name,
          u.email,
          u.institution
        FROM user_events ue
        JOIN users u ON u.id = ue.user_id
        WHERE ue.event_id = $1 
        AND ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')
        ORDER BY u.name
      `, [eventId]);
      
      // Halls
      const hallsResult = await query(`
        SELECT id, name, capacity, equipment
        FROM halls
        WHERE event_id = $1
        ORDER BY name
      `, [eventId]);
      
      console.log('✅ Single event data fetched successfully');
      
      return {
        event,
        sessions: sessionsResult.rows,
        registrations: registrationsResult.rows,
        faculty: facultyResult.rows,
        halls: hallsResult.rows
      };
      
    } else {
      // All events data
      console.log('📋 Fetching all events data...');
      
      const eventsResult = await query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date as startDate,
          e.end_date as endDate,
          e.location,
          e.status,
          e.created_at as createdAt,
          (SELECT COUNT(*) FROM conference_sessions WHERE event_id = e.id) as sessionCount,
          (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registrationCount
        FROM events e
        ORDER BY e.start_date DESC
      `);
      
      console.log('✅ All events data fetched successfully');
      
      return {
        events: eventsResult.rows,
        sessions: [],
        registrations: [],
        faculty: [],
        halls: []
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching event data:', error);
    throw new Error(`Failed to fetch event data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple PDF generation function
async function generateSimplePDF(data: any, options: any = {}) {
  try {
    console.log('📄 Generating simple PDF...');
    
    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    
    // Helper function to format date
    const formatDate = (date: any) => {
      if (!date) return 'Not specified';
      
      try {
        // Handle different date formats
        let dateObj;
        
        if (date instanceof Date) {
          dateObj = date;
        } else if (typeof date === 'string') {
          dateObj = new Date(date);
        } else if (typeof date === 'number') {
          dateObj = new Date(date);
        } else {
          return 'Not specified';
        }
        
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          return 'Invalid date';
        }
        
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
      } catch (error) {
        console.error('Date formatting error:', error, 'for date:', date);
        return 'Invalid date';
      }
    };
    
    // Helper function to format date and time
    const formatDateTime = (date: any) => {
      if (!date) return 'Not specified';
      
      try {
        let dateObj;
        
        if (date instanceof Date) {
          dateObj = date;
        } else if (typeof date === 'string') {
          dateObj = new Date(date);
        } else if (typeof date === 'number') {
          dateObj = new Date(date);
        } else {
          return 'Not specified';
        }
        
        if (isNaN(dateObj.getTime())) {
          return 'Invalid date';
        }
        
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('DateTime formatting error:', error, 'for date:', date);
        return 'Invalid date';
      }
    };
    
    // Helper function to format status
    const formatStatus = (status: string) => {
      if (!status) return 'Unknown';
      return status.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // PDF Content
    let yPosition = 20;
    const lineHeight = 8;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(40, 44, 52);
    pdf.text('Event Export Report', 20, yPosition);
    yPosition += lineHeight * 2;
    
    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += lineHeight * 2;
    
    // Event Details
    if (data.event) {
      // Debug log to check actual data
      console.log('🐛 Event data for PDF:', {
        name: data.event.name,
        start_date: data.event.start_date,
        end_date: data.event.end_date,
        created_at: data.event.created_at,
        location: data.event.location,
        status: data.event.status
      });
      
      pdf.setFontSize(16);
      pdf.setTextColor(40, 44, 52);
      pdf.text('Event Details', 20, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      const eventInfo = [
        ['Name:', data.event.name || 'Untitled Event'],
        ['Description:', data.event.description || 'No description'],
        ['Start Date:', formatDateTime(data.event.start_date)],
        ['End Date:', formatDateTime(data.event.end_date)],
        ['Location:', data.event.location || 'TBD'],
        ['Status:', formatStatus(data.event.status)],
        ['Created:', formatDate(data.event.created_at)],
        ['Participants:', (data.event.participant_count || 0).toString()]
      ];
      
      eventInfo.forEach(([label, value]) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont(undefined, 'bold');
        pdf.text(label, 20, yPosition);
        pdf.setFont(undefined, 'normal');
        
        // Handle long text
        const maxWidth = 160;
        const splitText = pdf.splitTextToSize(value, maxWidth);
        pdf.text(splitText, 60, yPosition);
        
        yPosition += lineHeight * Math.max(1, splitText.length);
      });
      
      yPosition += lineHeight;
    }
    
    // Sessions
    if (data.sessions && data.sessions.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(40, 44, 52);
      pdf.text(`Sessions (${data.sessions.length})`, 20, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      data.sessions.slice(0, 20).forEach((session: any, index: number) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`${index + 1}. ${session.title || 'Untitled Session'}`, 20, yPosition);
        yPosition += lineHeight;
        
        if (session.start_time) {
          pdf.text(`   Time: ${formatDateTime(session.start_time)}`, 20, yPosition);
          yPosition += lineHeight;
        }
        
        if (session.hall_name) {
          pdf.text(`   Hall: ${session.hall_name}`, 20, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight * 0.5;
      });
      
      if (data.sessions.length > 20) {
        pdf.text(`... and ${data.sessions.length - 20} more sessions`, 20, yPosition);
        yPosition += lineHeight;
      }
      
      yPosition += lineHeight;
    }
    
    // Faculty
    if (data.faculty && data.faculty.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(40, 44, 52);
      pdf.text(`Faculty (${data.faculty.length})`, 20, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      data.faculty.slice(0, 15).forEach((faculty: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`${index + 1}. ${faculty.name || 'Unknown'} - ${formatStatus(faculty.role)}`, 20, yPosition);
        yPosition += lineHeight;
        
        if (faculty.institution) {
          pdf.text(`   ${faculty.institution}`, 20, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight * 0.5;
      });
      
      if (data.faculty.length > 15) {
        pdf.text(`... and ${data.faculty.length - 15} more faculty members`, 20, yPosition);
        yPosition += lineHeight;
      }
      
      yPosition += lineHeight;
    }
    
    // Statistics
    if (data.registrations || data.halls || data.sessions) {
      pdf.setFontSize(14);
      pdf.setTextColor(40, 44, 52);
      pdf.text('Statistics', 20, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      const stats = [
        ['Total Sessions:', (data.sessions?.length || 0).toString()],
        ['Total Registrations:', (data.registrations?.length || 0).toString()],
        ['Total Faculty:', (data.faculty?.length || 0).toString()],
        ['Total Halls:', (data.halls?.length || 0).toString()]
      ];
      
      stats.forEach(([label, value]) => {
        pdf.text(`${label} ${value}`, 20, yPosition);
        yPosition += lineHeight;
      });
    }
    
    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Conference Management System', 20, pageHeight - 10);
      pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - 40, pageHeight - 10);
    }
    
    console.log('✅ Simple PDF generated successfully');
    return pdf;
    
  } catch (error) {
    console.error('❌ Simple PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// GET handler - Generate PDF
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 PDF Export API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const title = searchParams.get('title') || 'Event Export';
    const subtitle = searchParams.get('subtitle') || 'Conference Management System Report';
    
    console.log('📋 Export parameters:', { eventId, title, subtitle });
    
    // Check permissions
    const permissionCheck = await checkExportPermission(session.user.id, eventId || undefined);
    if (!permissionCheck.hasPermission) {
      console.log('❌ Export permission denied:', permissionCheck.reason);
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('✅ Export permission granted');
    
    // Fetch data
    const data = await fetchEventData(eventId || undefined);
    
    // Generate PDF using simple method
    const pdf = await generateSimplePDF(data, { title, subtitle });
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    console.log('✅ PDF generated successfully');
    
    // Set response headers
    const filename = eventId 
      ? `event-${data.event?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.pdf`
      : `events-export-${new Date().toISOString().slice(0, 10)}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ PDF Export API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST handler - Generate PDF with custom data
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PDF Export API (POST) called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { eventId, data, options = {} } = body;
    
    console.log('📋 POST Export parameters:', { eventId, hasData: !!data, options });
    
    // Check permissions
    const permissionCheck = await checkExportPermission(session.user.id, eventId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Use provided data or fetch from database
    const exportData = data || await fetchEventData(eventId);
    
    // Generate PDF
    const pdf = await generateSimplePDF(exportData, options);
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    const filename = options.filename || 
      `event-export-${new Date().toISOString().slice(0, 10)}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ PDF Export POST Error:', error);
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}