// src/app/api/faculty/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';

// ✅ EXPORT ONLY - Export faculty data to CSV/Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only organizers and event managers can export
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to export faculty data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const format = searchParams.get('format') || 'csv'; // csv or excel
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const institution = searchParams.get('institution');

    console.log('📊 Faculty export request:', { eventId, format, search, role, status, institution });

    // ✅ Build WHERE conditions for export (same pattern as main API)
    const whereConditions = [];
    const queryParams = [];
    let paramCount = 0;

    whereConditions.push(`u.role = 'FACULTY'`);

    // Event filter
    if (eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount}
      )`);
      queryParams.push(eventId);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        u.name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        u.institution ILIKE $${paramCount} OR 
        u.specialization ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Institution filter
    if (institution) {
      paramCount++;
      whereConditions.push(`u.institution ILIKE $${paramCount}`);
      queryParams.push(`%${institution}%`);
    }

    // Role filter (event role)
    if (role && eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount - (eventId ? 1 : 0)}
        AND ue.role = $${paramCount}
      )`);
      queryParams.push(role);
    }

    // Status filter (event status)
    if (status && eventId) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_events ue 
        WHERE ue.user_id = u.id 
        AND ue.event_id = $${paramCount - (eventId ? 1 : 0) - (role ? 1 : 0)}
        AND ue.status = $${paramCount}
      )`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ✅ Comprehensive faculty query for export
    const facultyQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.designation,
        u.institution,
        u.specialization,
        u.bio,
        u.experience,
        u.dietary_requirements,
        u.created_at,
        u.updated_at,
        -- Event specific data (if eventId provided)
        ${eventId ? `
        ue.role as event_role,
        ue.status as event_status,
        ue.invited_at,
        e.name as event_name,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        ` : ''}
        -- Session count
        (SELECT COUNT(*) FROM session_speakers ss 
         JOIN conference_sessions cs ON cs.id = ss.session_id 
         ${eventId ? `WHERE cs.event_id = '${eventId}' AND` : 'WHERE'} ss.user_id = u.id
        ) as session_count,
        -- Latest session
        (SELECT cs.title FROM session_speakers ss 
         JOIN conference_sessions cs ON cs.id = ss.session_id 
         ${eventId ? `WHERE cs.event_id = '${eventId}' AND` : 'WHERE'} ss.user_id = u.id 
         ORDER BY cs.start_time DESC LIMIT 1
        ) as latest_session
      FROM users u
      ${eventId ? `
      LEFT JOIN user_events ue ON ue.user_id = u.id AND ue.event_id = '${eventId}'
      LEFT JOIN events e ON e.id = ue.event_id
      ` : ''}
      ${whereClause}
      ORDER BY u.name ASC
    `;

    console.log('📝 Export query:', facultyQuery);
    console.log('📝 Query params:', queryParams);

    const result = await query(facultyQuery, queryParams);
    const facultyData = result.rows;

    console.log(`✅ Found ${facultyData.length} faculty members for export`);

    if (facultyData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No faculty data found for export',
        data: []
      });
    }

    // ✅ Format data for export
    const exportData = facultyData.map(faculty => {
      const baseData = {
        'Name': faculty.name || '',
        'Email': faculty.email || '',
        'Phone': faculty.phone || '',
        'Designation': faculty.designation || '',
        'Institution': faculty.institution || '',
        'Specialization': faculty.specialization || '',
        'Experience (Years)': faculty.experience || '',
        'Sessions Count': faculty.session_count || 0,
        'Latest Session': faculty.latest_session || '',
        'Dietary Requirements': faculty.dietary_requirements || '',
        'Joined Date': faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : '',
      };

      // Add event-specific data if eventId provided
      if (eventId) {
        return {
          ...baseData,
          'Event Name': faculty.event_name || '',
          'Event Role': faculty.event_role || '',
          'Event Status': faculty.event_status || '',
          'Invited Date': faculty.invited_at ? new Date(faculty.invited_at).toLocaleDateString() : '',
          'Event Start': faculty.event_start_date ? new Date(faculty.event_start_date).toLocaleDateString() : '',
          'Event End': faculty.event_end_date ? new Date(faculty.event_end_date).toLocaleDateString() : '',
        };
      }

      return baseData;
    });

    // ✅ Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const eventName = eventId ? (facultyData[0]?.event_name || 'Event') : 'All-Events';
    const filename = `faculty-${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;

    if (format === 'excel') {
      // Return JSON data for client-side Excel generation
      return NextResponse.json({
        success: true,
        data: exportData,
        filename: `${filename}.xlsx`,
        format: 'excel',
        count: exportData.length
      });
    } else {
      // ✅ Generate CSV content
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle CSV special characters
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // ✅ Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'X-Export-Count': exportData.length.toString(),
          'X-Export-Timestamp': new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('❌ Faculty export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export faculty data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}