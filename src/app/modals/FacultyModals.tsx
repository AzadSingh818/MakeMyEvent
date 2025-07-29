'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

// Upload Presentation Modal
export function UploadPresentationModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Presentation</DialogTitle>
        </DialogHeader>
        <p>Upload your presentation file here.</p>
      </DialogContent>
    </Dialog>
  );
}

// Travel Info Modal
export function TravelInfoModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Travel Information</DialogTitle>
        </DialogHeader>
        <p>Enter your travel details here.</p>
      </DialogContent>
    </Dialog>
  );
}

// Accommodation Modal
export function AccommodationModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accommodation Request</DialogTitle>
        </DialogHeader>
        <p>Fill in your accommodation requirements here.</p>
      </DialogContent>
    </Dialog>
  );
}

// Certificate Modal
export function CertificateModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Certificate Request</DialogTitle>
        </DialogHeader>
        <p>Download or request your participation certificate here.</p>
      </DialogContent>
    </Dialog>
  );
}

// Feedback Modal
export function FeedbackModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>
        <p>Share your feedback with us.</p>
      </DialogContent>
    </Dialog>
  );
}

// Contact Modal
export function ContactModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
        </DialogHeader>
        <p>Get in touch with the organizers.</p>
      </DialogContent>
    </Dialog>
  );
}
