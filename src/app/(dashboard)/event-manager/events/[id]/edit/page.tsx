// src/app/(dashboard)/event-manager/events/[id]/edit/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useAuth } from '@/hooks/use-auth';

import { 
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building,
  Globe,
  Mail,
  Phone,
  Image,
  Settings,
  Eye,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

// Event update validation schema
const eventUpdateSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  venue: z.string().optional(),
  expectedAttendees: z.number().min(1, 'Expected attendees must be at least 1').optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  registrationDeadline: z.string().optional(),
  maxAttendees: z.number().min(1).optional(),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  tags: z.string().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine(data => {
  if (data.registrationDeadline && data.startDate) {
    return new Date(data.registrationDeadline) <= new Date(data.startDate);
  }
  return true;
}, {
  message: "Registration deadline must be before event start date",
  path: ["registrationDeadline"]
});

type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Data fetching hooks
  const { data: eventData, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const event = eventData?.data?.event;

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset
  } = useForm<EventUpdateFormData>({
    resolver: zodResolver(eventUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      venue: '',
      expectedAttendees: undefined,
      contactEmail: '',
      contactPhone: '',
      website: '',
      category: '',
      type: '',
      status: 'DRAFT',
      registrationDeadline: '',
      maxAttendees: undefined,
      isPublic: true,
      requiresApproval: true,
      tags: ''
    }
  });

  // Set form values when event data loads
  React.useEffect(() => {
    if (event) {
      const formData: EventUpdateFormData = {
        name: event.name || '',
        description: event.description || '',
        startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : '',
        endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : '',
        venue: event.venue || '',
        expectedAttendees: event.expectedAttendees || undefined,
        contactEmail: event.contactEmail || '',
        contactPhone: event.contactPhone || '',
        website: event.website || '',
        category: event.category || '',
        type: event.type || '',
        status: event.status || 'DRAFT',
        registrationDeadline: event.registrationDeadline ? format(new Date(event.registrationDeadline), "yyyy-MM-dd'T'HH:mm") : '',
        maxAttendees: event.maxAttendees || undefined,
        isPublic: event.isPublic ?? true,
        requiresApproval: event.requiresApproval ?? true,
        tags: event.tags?.join(', ') || ''
      };
      reset(formData);
    }
  }, [event, reset]);

  const onSubmit = async (data: EventUpdateFormData) => {
    try {
      const updateData = {
        ...data,
        expectedAttendees: data.expectedAttendees || null,
        maxAttendees: data.maxAttendees || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        website: data.website || null,
        category: data.category || null,
        type: data.type || null,
        registrationDeadline: data.registrationDeadline || null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      await updateEvent.mutateAsync({
        eventId,
        eventData: updateData
      });

      router.push(`/event-manager/events/${eventId}`);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await deleteEvent.mutateAsync(eventId);
      router.push('/event-manager/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-300';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (eventLoading) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </EventManagerLayout>
    );
  }

  if (eventError || !event) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Event not found or you don't have permission to edit it.
            </AlertDescription>
          </Alert>
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-muted-foreground">Editing: {event.name}</p>
                <Badge className={`${getStatusColor(event.status)} border text-xs`}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/event-manager/events/${eventId}`}>
              <Button type="button" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Event
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {isDirty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Make sure to save before leaving this page.
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter event name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Event Status</Label>
                <Select onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your event..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Conference, Workshop"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Input
                  id="type"
                  {...register('type')}
                  placeholder="e.g., Educational, Corporate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="e.g., technology, innovation, networking"
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                {...register('registrationDeadline')}
              />
              {errors.registrationDeadline && (
                <p className="text-sm text-red-600">{errors.registrationDeadline.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Capacity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location & Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                {...register('venue')}
                placeholder="Enter venue name and address"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                <Input
                  id="expectedAttendees"
                  type="number"
                  {...register('expectedAttendees', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.expectedAttendees && (
                  <p className="text-sm text-red-600">{errors.expectedAttendees.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  {...register('maxAttendees', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="contact@example.com"
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...register('contactPhone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Registration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                {...register('isPublic')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isPublic">Public Event (visible to all users)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresApproval"
                {...register('requiresApproval')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="requiresApproval">Require approval for registrations</Label>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Delete Event</h4>
                <p className="text-sm text-red-600/80">
                  Permanently delete this event and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="space-x-2">
                {showDeleteConfirm ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Confirm Delete
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fixed Save Button */}
        {/* <div className="fixed bottom-6 right-6 z-50">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="shadow-lg"
            size="lg"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div> */}
      </form>
    </EventManagerLayout>
  );
}