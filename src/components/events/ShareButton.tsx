// src/components/events/ShareButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  FileText, 
  Link, 
  Mail, 
  MessageSquare,
  Copy,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface ShareButtonProps {
  eventId?: string;
  eventName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({ 
  eventId, 
  eventName = 'Event',
  variant = 'outline',
  size = 'md',
  className = '',
  children
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareType, setShareType] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate shareable link
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    if (eventId) {
      return `${baseUrl}/event-manager/events/${eventId}`;
    }
    return `${baseUrl}/event-manager/events`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      setShowDropdown(false);
      const link = generateShareLink();
      await navigator.clipboard.writeText(link);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  // Share PDF
  const handleSharePDF = async () => {
    try {
      setIsSharing(true);
      setShareType('pdf');
      setShowDropdown(false);
      
      console.log('📄 Generating PDF for sharing...');

      let url = '/api/events/export/pdf';
      if (eventId) {
        url += `?eventId=${eventId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;

      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: eventName,
            text: `Check out this event: ${eventName}`,
            files: [file]
          });
          console.log('✅ PDF shared via Web Share API');
          alert('PDF shared successfully!');
          return;
        }
      }

      // Fallback: Download the PDF
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      alert('PDF downloaded - you can now share it manually');

    } catch (error) {
      console.error('❌ PDF sharing failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to share PDF');
    } finally {
      setIsSharing(false);
      setShareType(null);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    setShowDropdown(false);
    const link = generateShareLink();
    const message = `Check out this conference event: ${eventName}\n\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share via Email
  const handleEmailShare = () => {
    setShowDropdown(false);
    const link = generateShareLink();
    const subject = encodeURIComponent(`Conference Event: ${eventName}`);
    const body = encodeURIComponent(`Hi,\n\nI wanted to share details about the conference event "${eventName}".\n\nYou can view the event details here: ${link}\n\nBest regards`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  // If children are provided, render as custom layout
  if (children) {
    return (
      <div className="relative">
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={isSharing}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {children}
          {!isSharing && <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <button
              onClick={handleSharePDF}
              disabled={isSharing}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Share as PDF
              {isSharing && shareType === 'pdf' && (
                <Loader2 className="h-3 w-3 ml-auto animate-spin" />
              )}
            </button>
            
            <hr className="border-gray-100" />
            
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </button>
            
            <button
              onClick={handleWhatsAppShare}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </button>
            
            <button
              onClick={handleEmailShare}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send via Email
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
        disabled={isSharing}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {isSharing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sharing...
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            Share
            <ChevronDown className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-100">
            Share {eventName}
          </div>
          
          <button
            onClick={handleSharePDF}
            disabled={isSharing}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Share as PDF</span>
              <span className="text-xs text-gray-500">
                Generate and share PDF document
              </span>
            </div>
            {isSharing && shareType === 'pdf' && (
              <Loader2 className="h-3 w-3 ml-auto animate-spin" />
            )}
          </button>

          <hr className="border-gray-100" />

          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            <span>Copy Link</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Share via WhatsApp</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            <span>Send via Email</span>
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

export default ShareButton;