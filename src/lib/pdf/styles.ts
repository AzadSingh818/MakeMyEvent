// src/lib/pdf/styles.ts
import { StyleSheet } from '@react-pdf/renderer';

// PDF Color Palette
export const colors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
};

// Main PDF Styles
export const pdfStyles = StyleSheet.create({
  // Page Styles
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.4,
  },
  
  // Layout Styles
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  
  section: {
    marginBottom: 20,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.gray[900],
  },
  
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 5,
  },
  
  // Typography Styles
  h1: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.gray[900],
    marginBottom: 10,
  },
  
  h2: {
    fontSize: 20,
    fontWeight: 600,
    color: colors.gray[800],
    marginBottom: 8,
  },
  
  h3: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.gray[800],
    marginBottom: 6,
  },
  
  h4: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.gray[700],
    marginBottom: 4,
  },
  
  body: {
    fontSize: 11,
    color: colors.gray[700],
    lineHeight: 1.4,
  },
  
  bodyLarge: {
    fontSize: 12,
    color: colors.gray[700],
    lineHeight: 1.5,
  },
  
  caption: {
    fontSize: 10,
    color: colors.gray[500],
    lineHeight: 1.3,
  },
  
  // Card Styles
  card: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.gray[900],
    flex: 1,
  },
  
  cardBody: {
    flexDirection: 'column',
  },
  
  // Badge Styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  
  badgeDraft: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  
  badgePublished: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  
  badgeActive: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  
  badgeCompleted: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  
  badgeCancelled: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  
  // Detail Styles
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  detailIcon: {
    width: 10,
    height: 10,
    marginRight: 6,
    color: colors.gray[500],
  },
  
  detailText: {
    fontSize: 10,
    color: colors.gray[600],
  },
  
  detailLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.gray[700],
    marginRight: 5,
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    padding: 15,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
  },
  
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
  },
  
  statLabel: {
    fontSize: 9,
    color: colors.gray[600],
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 10,
  },
  
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    right: 30,
    color: colors.gray[500],
  },
  
  // Table Styles
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  
  tableHeader: {
    backgroundColor: colors.gray[100],
  },
  
  tableCell: {
    margin: 'auto',
    padding: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.gray[800],
  },
  
  tableCellBody: {
    fontSize: 9,
    color: colors.gray[700],
  },
  
  // List Styles
  list: {
    marginBottom: 10,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  
  listBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[500],
    marginRight: 8,
    marginTop: 4,
  },
  
  listText: {
    fontSize: 10,
    color: colors.gray[700],
    flex: 1,
  },
  
  // Utility Styles
  bold: {
    fontWeight: 600,
  },
  
  italic: {
    fontStyle: 'italic',
  },
  
  underline: {
    textDecoration: 'underline',
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  textLeft: {
    textAlign: 'left',
  },
  
  mb5: {
    marginBottom: 5,
  },
  
  mb10: {
    marginBottom: 10,
  },
  
  mb15: {
    marginBottom: 15,
  },
  
  mb20: {
    marginBottom: 20,
  },
  
  mt5: {
    marginTop: 5,
  },
  
  mt10: {
    marginTop: 10,
  },
  
  mt15: {
    marginTop: 15,
  },
  
  mt20: {
    marginTop: 20,
  },
  
  // Spacing Utilities
  gap5: {
    gap: 5,
  },
  
  gap10: {
    gap: 10,
  },
  
  gap15: {
    gap: 15,
  },
  
  flex1: {
    flex: 1,
  },
  
  flexShrink0: {
    flexShrink: 0,
  },
});

// Status Badge Style Helper
export const getStatusBadgeStyle = (status: string) => {
  const baseStyle = [pdfStyles.badge];
  const textStyle = [pdfStyles.badgeText];
  
  switch (status?.toUpperCase()) {
    case 'PUBLISHED':
      return {
        badge: [...baseStyle, pdfStyles.badgePublished],
        text: [...textStyle, { color: '#166534' }]
      };
    case 'DRAFT':
      return {
        badge: [...baseStyle, pdfStyles.badgeDraft],
        text: [...textStyle, { color: '#92400e' }]
      };
    case 'ACTIVE':
      return {
        badge: [...baseStyle, pdfStyles.badgeActive],
        text: [...textStyle, { color: '#1e40af' }]
      };
    case 'COMPLETED':
      return {
        badge: [...baseStyle, pdfStyles.badgeCompleted],
        text: [...textStyle, { color: colors.gray[700] }]
      };
    case 'CANCELLED':
      return {
        badge: [...baseStyle, pdfStyles.badgeCancelled],
        text: [...textStyle, { color: '#dc2626' }]
      };
    default:
      return {
        badge: [...baseStyle, pdfStyles.badgeCompleted],
        text: [...textStyle, { color: colors.gray[700] }]
      };
  }
};