// src/app/api/events/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZhnjvh4jQ.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZhnjvh4jQ.woff2',
      fontWeight: 700,
    }
  ]
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  logo: {
    width: 60,
    height: 60,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  eventCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fef3c7',
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 600,
    color: '#92400e',
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
    color: '#6b7280',
  },
  detailText: {
    fontSize: 11,
    color: '#4b5563',
  },
  description: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 10,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    right: 30,
    color: '#6b7280',
  },
});

// Safe date formatting
const formatSafeDate = (dateString: string | null | undefined, formatStr: string = 'PPP'): string => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Get status color
const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED': return { bg: '#dcfce7', text: '#166534' };
    case 'DRAFT': return { bg: '#fef3c7', text: '#92400e' };
    case 'ACTIVE': return { bg: '#dbeafe', text: '#1e40af' };
    case 'COMPLETED': return { bg: '#f3f4f6', text: '#374151' };
    case 'CANCELLED': return { bg: '#fee2e2', text: '#dc2626' };
    default: return { bg: '#f3f4f6', text: '#374151' };
  }
};

// PDF Document Component
const EventsPDFDocument = ({ events, stats, userInfo }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Conference Events Report</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), 'PPP')} by {userInfo.name}
          </Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.publishedEvents}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.draftEvents}</Text>
          <Text style={styles.statLabel}>Draft</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.activeEvents}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Events List */}
      {events.map((event: any, index: number) => {
        const statusColors = getStatusColor(event.status);
        
        return (
          <View key={event.id} style={styles.eventCard} break={index > 0 && index % 3 === 0}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventName}>{event.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {event.status}
                </Text>
              </View>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>
                  {formatSafeDate(event.startDate, 'MMM dd, yyyy')} - {formatSafeDate(event.endDate, 'MMM dd, yyyy')}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🕒</Text>
                <Text style={styles.detailText}>
                  {formatSafeDate(event.startDate, 'HH:mm')} - {formatSafeDate(event.endDate, 'HH:mm')}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{event.location || 'Location TBD'}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>👤</Text>
                <Text style={styles.detailText}>Created by {event.creator?.name || 'Unknown'}</Text>
              </View>
            </View>

            {event.description && (
              <Text style={styles.description}>
                {event.description.length > 200 
                  ? `${event.description.substring(0, 200)}...` 
                  : event.description}
              </Text>
            )}
          </View>
        );
      })}

      {/* Footer */}
      <Text style={styles.footer}>
        Conference Management System - Generated by {userInfo.name} ({userInfo.email})
      </Text>
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
        `${pageNumber} / ${totalPages}`
      } fixed />
    </Page>
  </Document>
);

// GET /api/events/export/pdf - Generate PDF
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId'); // Single event or all events
    const format = searchParams.get('format') || 'pdf';

    console.log('📄 PDF Export started by:', session.user.email, 'for:', eventId || 'all events');

    // Build query based on parameters
    let whereClause = '';
    const queryParams = [];
    
    if (eventId) {
      whereClause = 'WHERE e.id = $1';
      queryParams.push(eventId);
    }

    // Get events data
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
        u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      `,
      queryParams
    );

    const events = eventsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      status: row.status,
      createdAt: row.created_at,
      creator: {
        name: row.creator_name,
        email: row.creator_email
      }
    }));

    if (events.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    // Calculate stats
    const stats = {
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === 'PUBLISHED').length,
      draftEvents: events.filter(e => e.status === 'DRAFT').length,
      activeEvents: events.filter(e => e.status === 'ACTIVE').length,
      completedEvents: events.filter(e => e.status === 'COMPLETED').length,
    };

    const userInfo = {
      name: session.user.name || 'Unknown User',
      email: session.user.email || 'unknown@example.com',
      role: session.user.role || 'USER'
    };

    console.log('📊 Stats calculated:', stats);

    // Generate PDF
    const pdfDoc = <EventsPDFDocument events={events} stats={stats} userInfo={userInfo} />;
    const pdfBuffer = await pdf(pdfDoc).toBuffer();

    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = eventId 
      ? `event-${events[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.pdf`
      : `conference-events-report-${timestamp}.pdf`;

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('❌ PDF Export Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/events/export/pdf - Generate PDF with custom data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds, includeStats = true, customTitle } = body;

    console.log('📄 Custom PDF Export started:', { eventIds, includeStats, customTitle });

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
        u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id IN (${placeholders})
      ORDER BY e.created_at DESC
      `,
      eventIds
    );

    const events = eventsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      status: row.status,
      createdAt: row.created_at,
      creator: {
        name: row.creator_name,
        email: row.creator_email
      }
    }));

    if (events.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    // Calculate stats
    const stats = {
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === 'PUBLISHED').length,
      draftEvents: events.filter(e => e.status === 'DRAFT').length,
      activeEvents: events.filter(e => e.status === 'ACTIVE').length,
    };

    const userInfo = {
      name: session.user.name || 'Unknown User',
      email: session.user.email || 'unknown@example.com',
      role: session.user.role || 'USER'
    };

    // Generate PDF
    const pdfDoc = <EventsPDFDocument events={events} stats={stats} userInfo={userInfo} />;
    const pdfBuffer = await pdf(pdfDoc).toBuffer();

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = customTitle 
      ? `${customTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.pdf`
      : `selected-events-${timestamp}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Custom PDF Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom PDF' },
      { status: 500 }
    );
  }
}