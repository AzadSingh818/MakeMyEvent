// src/components/forms/event-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Switch } from '@/components/ui/switch';

import { Calendar, MapPin, Users, Globe, Mail, Plus, X, Settings, Clock } from 'lucide-react';

// Validation schema
const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(1, 'Location is required'),
  venue: z.string().optional(),
  eventType: z.enum(['CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SYMPOSIUM']),
  maxParticipants: z.number().positive().optional(),
  registrationDeadline: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  tags: z.array(z.string()).optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  // Additional fields
  isPublic: z.boolean().default(true),
  allowRegistrations: z.boolean().default(true),
  requireApproval: z.boolean().default(true),
  certificatesEnabled: z.boolean().default(true),
  attendanceRequired: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine((data) => {
  if (data.registrationDeadline) {
    const regDeadline = new Date(data.registrationDeadline);
    const startDate = new Date(data.startDate);
    return regDeadline <= startDate;
  }
  return true;
}, {
  message: "Registration deadline must be before event start date",
  path: ["registrationDeadline"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  eventId?: string;
  initialData?: Partial<EventFormData>;
  onSuccess?: (eventId?: string) => void;
  onCancel?: () => void;
}

export function EventForm({ eventId, initialData, onSuccess, onCancel }: EventFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form setup
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      location: initialData?.location || '',
      venue: initialData?.venue || '',
      eventType: initialData?.eventType || 'CONFERENCE',
      maxParticipants: initialData?.maxParticipants,
      registrationDeadline: initialData?.registrationDeadline || '',
      status: initialData?.status || 'DRAFT',
      tags: initialData?.tags || [],
      website: initialData?.website || '',
      contactEmail: initialData?.contactEmail || '',
      isPublic: initialData?.isPublic ?? true,
      allowRegistrations: initialData?.allowRegistrations ?? true,
      requireApproval: initialData?.requireApproval ?? true,
      certificatesEnabled: initialData?.certificatesEnabled ?? true,
      attendanceRequired: initialData?.attendanceRequired ?? false,
    },
  });

  const { watch, setValue, getValues } = form;

  // Add tag
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  // Remove tag
  const removeTag = (index: number) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  // Form submission - FIXED: Direct API call instead of hook
  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Submitting event data:', data);
      
      // Clean up data - remove fields that don't exist in API
      const eventData = {
        name: data.name,
        description: data.description || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        eventType: data.eventType,
        status: data.status,
        tags: data.tags || [],
        website: data.website || undefined,
        contactEmail: data.contactEmail || undefined,
        // Remove fields that API doesn't expect
        // venue, maxParticipants, registrationDeadline, isPublic, etc.
      };

      console.log('📤 Cleaned event data for API:', eventData);

      if (eventId) {
        // Update existing event
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update event');
        }

        const result = await response.json();
        console.log('✅ Event updated successfully:', result);
        toast.success('Event updated successfully!');
        onSuccess?.(eventId);
      } else {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ API Error:', error);
          throw new Error(error.error || 'Failed to create event');
        }

        const result = await response.json();
        console.log('✅ Event created successfully:', result);
        toast.success('Event created successfully!');
        
        // FIXED: Correct response structure from API
        const newEventId = result.data?.id;
        onSuccess?.(newEventId);
      }
    } catch (error) {
      console.error('❌ Event form error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter event name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter event description"
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={watch('eventType')} onValueChange={(value) => setValue('eventType', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFERENCE">Conference</SelectItem>
                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                <SelectItem value="SEMINAR">Seminar</SelectItem>
                <SelectItem value="SYMPOSIUM">Symposium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag (e.g., AI, Healthcare, Research)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(watch('tags') ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(watch('tags') ?? []).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...form.register('startDate')}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Venue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Venue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="City, Country"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                <Globe className="h-4 w-4" />
              </span>
              <Input
                id="website"
                {...form.register('website')}
                placeholder="https://example.com"
                className="rounded-l-none"
              />
            </div>
            {form.formState.errors.website && (
              <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                <Mail className="h-4 w-4" />
              </span>
              <Input
                id="contactEmail"
                type="email"
                {...form.register('contactEmail')}
                placeholder="contact@example.com"
                className="rounded-l-none"
              />
            </div>
            {form.formState.errors.contactEmail && (
              <p className="text-sm text-red-500">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Event Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Draft events are not visible to the public. Published events can accept registrations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          {eventId ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}