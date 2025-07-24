// src/app/api/events/export/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// Safe date formatting for Excel
const formatExcelDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    return '';
  }
};

const formatExcelDateOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

// GET /api/events/export/excel - Generate Excel file
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    console.log('📊 Excel Export started by:', session.user.email, 'for:', eventId || 'all events');

    // Build query based on parameters
    let whereClause = '';
    const queryParams = [];
    
    if (eventId) {
      whereClause = 'WHERE e.id = $1';
      queryParams.push(eventId);
    }

    // Get events data with more details for Excel
    const eventsResult = await query(
      `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.status,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.name as creator_name,
        u.email as creator_email,
        u.role as creator_role,
        -- Count related data
        (SELECT COUNT(*) FROM conference_sessions cs WHERE cs.event_id = e.id) as total_sessions,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as total_registrations,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'APPROVED') as approved_registrations,
        (SELECT COUNT(*) FROM user_events ue WHERE ue.event_id = e.id AND ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')) as total_faculty
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      `,
      queryParams
    );

    if (eventsResult.rows.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    // Prepare data for Excel
    const events = eventsResult.rows.map(row => ({
      'Event ID': row.id,
      'Event Name': row.name || '',
      'Description': row.description || '',
      'Start Date': formatExcelDateOnly(row.start_date),
      'End Date': formatExcelDateOnly(row.end_date),
      'Start DateTime': formatExcelDate(row.start_date),
      'End DateTime': formatExcelDate(row.end_date),
      'Location': row.location || '',
      'Status': row.status || '',
      'Creator Name': row.creator_name || '',
      'Creator Email': row.creator_email || '',
      'Creator Role': row.creator_role || '',
      'Total Sessions': row.total_sessions || 0,
      'Total Registrations': row.total_registrations || 0,
      'Approved Registrations': row.approved_registrations || 0,
      'Total Faculty': row.total_faculty || 0,
      'Created At': formatExcelDate(row.created_at),
      'Updated At': formatExcelDate(row.updated_at),
    }));

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Main Events Sheet
    const eventsWorksheet = XLSX.utils.json_to_sheet(events);
    
    // Set column widths
    const eventsColWidths = [
      { wch: 20 }, // Event ID
      { wch: 30 }, // Event Name
      { wch: 50 }, // Description
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 20 }, // Start DateTime
      { wch: 20 }, // End DateTime
      { wch: 25 }, // Location
      { wch: 12 }, // Status
      { wch: 20 }, // Creator Name
      { wch: 25 }, // Creator Email
      { wch: 15 }, // Creator Role
      { wch: 12 }, // Total Sessions
      { wch: 15 }, // Total Registrations
      { wch: 18 }, // Approved Registrations
      { wch: 12 }, // Total Faculty
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
    ];
    eventsWorksheet['!cols'] = eventsColWidths;

    XLSX.utils.book_append_sheet(workbook, eventsWorksheet, 'Events');

    // Summary Sheet
    if (!eventId) { // Only for all events export
      const summary = [
        { Metric: 'Total Events', Value: events.length },
        { Metric: 'Published Events', Value: events.filter(e => e.Status === 'PUBLISHED').length },
        { Metric: 'Draft Events', Value: events.filter(e => e.Status === 'DRAFT').length },
        { Metric: 'Active Events', Value: events.filter(e => e.Status === 'ACTIVE').length },
        { Metric: 'Completed Events', Value: events.filter(e => e.Status === 'COMPLETED').length },
        { Metric: 'Cancelled Events', Value: events.filter(e => e.Status === 'CANCELLED').length },
        { Metric: 'Total Sessions', Value: events.reduce((sum, e) => sum + (e['Total Sessions'] || 0), 0) },
        { Metric: 'Total Registrations', Value: events.reduce((sum, e) => sum + (e['Total Registrations'] || 0), 0) },
        { Metric: 'Approved Registrations', Value: events.reduce((sum, e) => sum + (e['Approved Registrations'] || 0), 0) },
        { Metric: 'Total Faculty', Value: events.reduce((sum, e) => sum + (e['Total Faculty'] || 0), 0) },
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
      summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    }

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      cellStyles: true,
      compression: true
    });

    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = eventId 
      ? `event-${events[0]['Event Name'].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.xlsx`
      : `conference-events-report-${timestamp}.xlsx`;

    console.log('✅ Excel generated successfully:', filename);

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('❌ Excel Export Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/events/export/excel - Generate Excel with custom data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds, customTitle } = body;

    console.log('📊 Custom Excel Export started:', { eventIds, customTitle });

    // Get specific events
    const placeholders = eventIds.map((_: any, index: number) => `$${index + 1}`).join(',');
    const eventsResult = await query(
      `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.status,
        e.created_at,
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM conference_sessions cs WHERE cs.event_id = e.id) as total_sessions,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as total_registrations,
        (SELECT COUNT(*) FROM user_events ue WHERE ue.event_id = e.id AND ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')) as total_faculty
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id IN (${placeholders})
      ORDER BY e.created_at DESC
      `,
      eventIds
    );

    if (eventsResult.rows.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    // Prepare data for Excel
    const events = eventsResult.rows.map(row => ({
      'Event ID': row.id,
      'Event Name': row.name || '',
      'Description': row.description || '',
      'Start Date': formatExcelDateOnly(row.start_date),
      'End Date': formatExcelDateOnly(row.end_date),
      'Location': row.location || '',
      'Status': row.status || '',
      'Creator': row.creator_name || '',
      'Total Sessions': row.total_sessions || 0,
      'Total Registrations': row.total_registrations || 0,
      'Total Faculty': row.total_faculty || 0,
      'Created At': formatExcelDate(row.created_at),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(events);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 12 }, { wch: 12 },
      { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Events');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = customTitle 
      ? `${customTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.xlsx`
      : `selected-events-${timestamp}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Custom Excel Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom Excel file' },
      { status: 500 }
    );
  }
}