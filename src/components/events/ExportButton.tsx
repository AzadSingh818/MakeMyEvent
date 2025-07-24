// src/components/events/ExportButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Loader2,
  ChevronDown
} from 'lucide-react';

interface ExportButtonProps {
  eventId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ExportButton({ 
  eventId, 
  variant = 'outline',
  size = 'md',
  className = '',
  children
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle PDF Export
  const handlePDFExport = async () => {
    try {
      setIsExporting(true);
      setExportType('pdf');
      setShowDropdown(false);
      
      console.log('📄 Starting PDF export...');

      let url = '/api/events/export/pdf';
      if (eventId) {
        url += `?eventId=${eventId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `events-export-${new Date().toISOString().split('T')[0]}.pdf`;

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ PDF export completed:', filename);
      alert(`PDF exported successfully: ${filename}`);

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to export PDF');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = async () => {
    try {
      setIsExporting(true);
      setExportType('excel');
      setShowDropdown(false);
      
      console.log('📊 Starting Excel export...');

      let url = '/api/events/export/excel';
      if (eventId) {
        url += `?eventId=${eventId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Excel export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `events-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ Excel export completed:', filename);
      alert(`Excel exported successfully: ${filename}`);

    } catch (error) {
      console.error('❌ Excel export failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to export Excel');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // If children are provided, render as custom layout
  if (children) {
    return (
      <div className="relative">
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={isExporting}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {children}
          {!isExporting && <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <button
              onClick={handlePDFExport}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
              {isExporting && exportType === 'pdf' && (
                <Loader2 className="h-3 w-3 ml-auto animate-spin" />
              )}
            </button>
            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
              {isExporting && exportType === 'excel' && (
                <Loader2 className="h-3 w-3 ml-auto animate-spin" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default button layout
  return (
    <div className="relative">
      <Button 
        variant={variant} 
        size={size}
        className={className}
        disabled={isExporting}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export
            <ChevronDown className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <button
            onClick={handlePDFExport}
            disabled={isExporting}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Export as PDF</span>
              <span className="text-xs text-gray-500">
                Formatted document
              </span>
            </div>
            {isExporting && exportType === 'pdf' && (
              <Loader2 className="h-3 w-3 ml-auto animate-spin" />
            )}
          </button>
          
          <hr className="border-gray-100" />
          
          <button
            onClick={handleExcelExport}
            disabled={isExporting}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Export as Excel</span>
              <span className="text-xs text-gray-500">
                Spreadsheet data
              </span>
            </div>
            {isExporting && exportType === 'excel' && (
              <Loader2 className="h-3 w-3 ml-auto animate-spin" />
            )}
          </button>
        </div>
      )}
      
      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

export default ExportButton;