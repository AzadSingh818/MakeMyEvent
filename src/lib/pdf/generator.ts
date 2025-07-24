// src/lib/pdf/generator.ts
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Safe date formatting for PDF
export const formatPDFDate = (dateString: string | null | undefined, formatStr: string = 'PPP'): string => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format date range
export const formatPDFDateRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatPDFDate(startDate, 'MMM dd, yyyy');
  const end = formatPDFDate(endDate, 'MMM dd, yyyy');
  
  if (start === 'TBD' && end === 'TBD') return 'Dates TBD';
  if (start === end) return start;
  return `${start} - ${end}`;
};

// Format time range
export const formatPDFTimeRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatPDFDate(startDate, 'HH:mm');
  const end = formatPDFDate(endDate, 'HH:mm');
  
  if (start === 'TBD' && end === 'TBD') return 'Time TBD';
  if (start === end) return start;
  return `${start} - ${end}`;
};

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED': return { bg: '#dcfce7', text: '#166534' };
    case 'DRAFT': return { bg: '#fef3c7', text: '#92400e' };
    case 'ACTIVE': return { bg: '#dbeafe', text: '#1e40af' };
    case 'COMPLETED': return { bg: '#f3f4f6', text: '#374151' };
    case 'CANCELLED': return { bg: '#fee2e2', text: '#dc2626' };
    default: return { bg: '#f3f4f6', text: '#374151' };
  }
};

// Event status display
export const getStatusDisplay = (status: string): string => {
  return status?.toUpperCase() || 'DRAFT';
};

// Priority mapping for events
export const getEventPriority = (event: any): 'high' | 'medium' | 'low' => {
  if (event.status === 'ACTIVE') return 'high';
  if (event.status === 'PUBLISHED') return 'medium';
  return 'low';
};

// Generate filename for PDF
export const generatePDFFilename = (prefix: string, eventName?: string): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  
  if (eventName) {
    const cleanEventName = eventName
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${prefix}-${cleanEventName}-${timestamp}.pdf`;
  }
  
  return `${prefix}-${timestamp}.pdf`;
};

// Calculate event statistics
export const calculateEventStats = (events: any[]) => {
  const stats = {
    totalEvents: events.length,
    publishedEvents: 0,
    draftEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    totalSessions: 0,
    totalRegistrations: 0,
    totalFaculty: 0,
    upcomingEvents: 0,
    pastEvents: 0,
  };

  const now = new Date();

  events.forEach(event => {
    // Status counts
    switch (event.status?.toUpperCase()) {
      case 'PUBLISHED':
        stats.publishedEvents++;
        break;
      case 'DRAFT':
        stats.draftEvents++;
        break;
      case 'ACTIVE':
        stats.activeEvents++;
        break;
      case 'COMPLETED':
        stats.completedEvents++;
        break;
      case 'CANCELLED':
        stats.cancelledEvents++;
        break;
    }

    // Time-based counts
    if (event.startDate) {
      const startDate = new Date(event.startDate);
      if (startDate > now) {
        stats.upcomingEvents++;
      } else if (event.endDate && new Date(event.endDate) < now) {
        stats.pastEvents++;
      }
    }

    // Aggregate counts
    stats.totalSessions += event.totalSessions || 0;
    stats.totalRegistrations += event.totalRegistrations || 0;
    stats.totalFaculty += event.totalFaculty || 0;
  });

  return stats;
};

// Truncate text for PDF
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Format event description for PDF
export const formatEventDescription = (description: string | null | undefined, maxLength: number = 200): string => {
  if (!description) return 'No description provided';
  return truncateText(description, maxLength);
};

// Generate PDF from React component
import { Readable } from 'stream';

export const generatePDFBuffer = async (component: React.ReactElement): Promise<Buffer> => {
  try {
    const pdfStream = pdf(component);
    // Use toBuffer() which returns a Promise<Buffer>
    const buffer = await pdfStream.toBuffer();
    return buffer as unknown as Buffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Event type display mapping
export const getEventTypeDisplay = (eventType: string | null | undefined): string => {
  if (!eventType) return 'Conference';
  
  const typeMap: { [key: string]: string } = {
    'CONFERENCE': 'Conference',
    'WORKSHOP': 'Workshop',
    'SEMINAR': 'Seminar',
    'SYMPOSIUM': 'Symposium',
    'MEETING': 'Meeting',
    'WEBINAR': 'Webinar',
  };
  
  return typeMap[eventType.toUpperCase()] || eventType;
};

// Location formatting
export const formatLocation = (location: string | null | undefined): string => {
  if (!location) return 'Location TBD';
  return location.trim();
};

// Create event summary for PDF
export const createEventSummary = (event: any) => {
  return {
    name: event.name || 'Untitled Event',
    description: formatEventDescription(event.description),
    dateRange: formatPDFDateRange(event.startDate, event.endDate),
    timeRange: formatPDFTimeRange(event.startDate, event.endDate),
    location: formatLocation(event.location),
    status: getStatusDisplay(event.status),
    statusColor: getStatusColor(event.status),
    eventType: getEventTypeDisplay(event.eventType),
    creator: event.creator?.name || 'Unknown',
    creatorEmail: event.creator?.email || '',
    totalSessions: event.totalSessions || 0,
    totalRegistrations: event.totalRegistrations || 0,
    totalFaculty: event.totalFaculty || 0,
    createdAt: formatPDFDate(event.createdAt, 'MMM dd, yyyy'),
    updatedAt: formatPDFDate(event.updatedAt, 'MMM dd, yyyy'),
  };
};

// PDF metadata generator
export const generatePDFMetadata = (title: string, creator: string) => {
  return {
    title,
    creator,
    subject: 'Conference Management System Report',
    keywords: 'conference, events, management, report',
    producer: 'Conference Management System',
    creationDate: new Date(),
    modificationDate: new Date(),
  };
};

// Validate event data before PDF generation
export const validateEventData = (events: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(events)) {
    errors.push('Events data must be an array');
    return { valid: false, errors };
  }
  
  if (events.length === 0) {
    errors.push('No events provided for PDF generation');
    return { valid: false, errors };
  }
  
  events.forEach((event, index) => {
    if (!event.id) {
      errors.push(`Event at index ${index} is missing ID`);
    }
    if (!event.name) {
      errors.push(`Event at index ${index} is missing name`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get PDF page orientation based on content
export const getPDFOrientation = (contentType: 'summary' | 'detailed' | 'list'): 'portrait' | 'landscape' => {
  switch (contentType) {
    case 'detailed':
      return 'landscape'; // Better for detailed tables
    case 'list':
      return 'portrait';  // Good for event lists
    case 'summary':
    default:
      return 'portrait';  // Default orientation
  }
};

// Helper to determine if content should break to new page
export const shouldPageBreak = (index: number, itemsPerPage: number): boolean => {
  return index > 0 && index % itemsPerPage === 0;
};