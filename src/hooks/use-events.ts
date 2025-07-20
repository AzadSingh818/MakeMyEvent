// src/hooks/use-events.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  venue?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  eventType: 'CONFERENCE' | 'WORKSHOP' | 'SEMINAR' | 'SYMPOSIUM';
  maxParticipants?: number;
  registrationDeadline?: Date;
  tags?: string[];
  website?: string;
  contactEmail?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    sessions: number;
    registrations: number;
    userEvents: number;
  };
}

interface CreateEventData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  maxParticipants?: number;
  registrationDeadline?: string;
  eventType?: 'CONFERENCE' | 'WORKSHOP' | 'SEMINAR' | 'SYMPOSIUM';
  status?: 'DRAFT' | 'PUBLISHED';
  tags?: string[];
  website?: string;
  contactEmail?: string;
}

interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface EventResponse {
  success: boolean;
  data: {
    events: Event[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SingleEventResponse {
  success: boolean;
  data: Event;
}

// API functions
const eventsApi = {
  // Get all events with filters
  getEvents: async (filters: EventFilters = {}): Promise<EventResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/events?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch events');
    }

    return response.json();
  },

  // Get single event by ID
  getEvent: async (eventId: string): Promise<SingleEventResponse> => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch event');
    }

    return response.json();
  },

  // Create new event
  createEvent: async (eventData: CreateEventData): Promise<SingleEventResponse> => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }

    return response.json();
  },

  // Update event
  updateEvent: async (eventId: string, updates: Partial<CreateEventData>): Promise<SingleEventResponse> => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update event');
    }

    return response.json();
  },

  // Bulk update events
  bulkUpdateEvents: async (eventIds: string[], updates: Partial<CreateEventData>) => {
    const response = await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update events');
    }

    return response.json();
  },

  // Change event status
  changeEventStatus: async (eventId: string, action: 'PUBLISH' | 'UNPUBLISH' | 'START' | 'COMPLETE' | 'CANCEL') => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change event status');
    }

    return response.json();
  },

  // Delete event
  deleteEvent: async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete event');
    }

    return response.json();
  },

  // Bulk delete events
  bulkDeleteEvents: async (eventIds: string[]) => {
    const response = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete events');
    }

    return response.json();
  },
};

// React Query Hooks

// Get events hook
export function useEvents(filters: EventFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getEvents(filters),
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Get single event hook
export function useEvent(eventId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEvent(eventId),
    enabled: !!session?.user && !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: (data) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, updates }: { eventId: string; updates: Partial<CreateEventData> }) =>
      eventsApi.updateEvent(eventId, updates),
    onSuccess: (data, variables) => {
      // Update the cache for this specific event
      queryClient.setQueryData(['event', variables.eventId], data);
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update event');
    },
  });
}

// Bulk update events mutation
export function useBulkUpdateEvents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventIds, updates }: { eventIds: string[]; updates: Partial<CreateEventData> }) =>
      eventsApi.bulkUpdateEvents(eventIds, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`${data.data.updatedCount} events updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update events');
    },
  });
}

// Change event status mutation
export function useChangeEventStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, action }: { eventId: string; action: 'PUBLISH' | 'UNPUBLISH' | 'START' | 'COMPLETE' | 'CANCEL' }) =>
      eventsApi.changeEventStatus(eventId, action),
    onSuccess: (data, variables) => {
      // Update the cache for this specific event
      queryClient.setQueryData(['event', variables.eventId], data);
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(data.message || 'Event status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update event status');
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsApi.deleteEvent,
    onSuccess: (data, eventId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['event', eventId] });
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });
}

// Bulk delete events mutation
export function useBulkDeleteEvents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsApi.bulkDeleteEvents,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`${data.data.deletedCount} events deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete events');
    },
  });
}

// Helper hook for event statistics
export function useEventStats(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch event stats');
      return response.json();
    },
    enabled: !!session?.user && !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Helper hook for user's role in an event
export function useUserEventRole(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['user-event-role', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/role`);
      if (!response.ok) throw new Error('Failed to fetch user role');
      return response.json();
    },
    enabled: !!session?.user && !!eventId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}