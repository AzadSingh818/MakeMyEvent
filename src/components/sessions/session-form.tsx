// src/components/sessions/session-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon,
  XIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  Loader2Icon,
  MicIcon,
  PresentationIcon,
  Coffee,
  Users2Icon,
  BookOpenIcon
} from 'lucide-react';

import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
  Switch,
  Label,
  Separator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCreateSession, useUpdateSession, useCheckConflicts } from '@/hooks/use-sessions';
import { useFaculty } from '@/hooks/use-faculty';

// Validation Schema
const SessionFormSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.date({ required_error: 'Start time is required' }),
  endTime: z.date({ required_error: 'End time is required' }),
  hallId: z.string().optional(),
  sessionType: z.enum(['KEYNOTE', 'PRESENTATION', 'PANEL', 'WORKSHOP', 'POSTER', 'BREAK']),
  maxParticipants: z.number().positive().optional(),
  requirements: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isBreak: z.boolean().default(false),
  speakers: z.array(z.object({
    userId: z.string(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON'])
  })).default([])
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
});

type SessionFormData = z.infer<typeof SessionFormSchema>;

interface SessionFormProps {
  eventId: string;
  session?: any; // Session data for editing
  halls?: Array<{
    id: string;
    name: string;
    capacity: number;
    location?: string;
    equipment?: string[];
  }>;
  onSuccess?: (session: any) => void;
  onCancel?: () => void;
  className?: string;
}

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote', icon: MicIcon, color: 'bg-purple-100 text-purple-800' },
  { value: 'PRESENTATION', label: 'Presentation', icon: PresentationIcon, color: 'bg-blue-100 text-blue-800' },
  { value: 'PANEL', label: 'Panel Discussion', icon: Users2Icon, color: 'bg-green-100 text-green-800' },
  { value: 'WORKSHOP', label: 'Workshop', icon: BookOpenIcon, color: 'bg-orange-100 text-orange-800' },
  { value: 'POSTER', label: 'Poster Session', icon: PresentationIcon, color: 'bg-cyan-100 text-cyan-800' },
  { value: 'BREAK', label: 'Break', icon: Coffee, color: 'bg-gray-100 text-gray-800' }
];

const SPEAKER_ROLES = [
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'CHAIRPERSON', label: 'Chairperson' }
];

export function SessionForm({
  eventId,
  session,
  halls = [],
  onSuccess,
  onCancel,
  className
}: SessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [speakerSearchOpen, setSpeakerSearchOpen] = useState(false);

  const isEditing = !!session;

  // Hooks
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const checkConflicts = useCheckConflicts();
  const { data: facultyData } = useFaculty({ 
    eventId, 
    limit: 100,
    status: 'CONFIRMED' 
  });

  const faculty = facultyData?.data?.faculty || [];

  // Form setup
  const form = useForm<SessionFormData>({
    resolver: zodResolver(SessionFormSchema),
    defaultValues: {
      eventId,
      title: session?.title || '',
      description: session?.description || '',
      startTime: session?.startTime ? new Date(session.startTime) : undefined,
      endTime: session?.endTime ? new Date(session.endTime) : undefined,
      hallId: session?.hall?.id || '',
      sessionType: session?.sessionType || 'PRESENTATION',
      maxParticipants: session?.maxParticipants || undefined,
      requirements: session?.requirements || [],
      tags: session?.tags || [],
      isBreak: session?.isBreak || false,
      speakers: session?.speakers?.map((s: any) => ({
        userId: s.user.id,
        role: s.role
      })) || []
    }
  });

  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = useFieldArray({
    control: form.control,
    name: 'requirements'
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags'
  });

  const { fields: speakerFields, append: appendSpeaker, remove: removeSpeaker } = useFieldArray({
    control: form.control,
    name: 'speakers'
  });

  // Watch for changes to trigger conflict check
  const watchedHallId = form.watch('hallId');
  const watchedStartTime = form.watch('startTime');
  const watchedEndTime = form.watch('endTime');

  // Check for schedule conflicts
  useEffect(() => {
    if (watchedHallId && watchedStartTime && watchedEndTime) {
      const checkForConflicts = async () => {
        try {
          const result = await checkConflicts.mutateAsync({
            hallId: watchedHallId,
            startTime: watchedStartTime.toISOString(),
            endTime: watchedEndTime.toISOString(),
            sessionId: session?.id
          });
          
          if (result.conflicts && result.conflicts.length > 0) {
            setConflicts(result.conflicts);
          } else {
            setConflicts([]);
          }
        } catch (error) {
          console.error('Error checking conflicts:', error);
        }
      };

      const timeoutId = setTimeout(checkForConflicts, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [watchedHallId, watchedStartTime, watchedEndTime, session?.id, checkConflicts]);

  const onSubmit = async (data: SessionFormData) => {
    try {
      setIsSubmitting(true);

      if (conflicts.length > 0 && !confirm('There are schedule conflicts. Do you want to proceed anyway?')) {
        return;
      }

      const sessionData = {
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        requirements: data.requirements.filter(req => req.trim() !== ''),
        tags: data.tags.filter(tag => tag.trim() !== ''),
        speakers: data.speakers
      };

      let result;
      if (isEditing) {
        result = await updateSession.mutateAsync({
          sessionId: session.id,
          updates: sessionData
        });
      } else {
        result = await createSession.mutateAsync(sessionData);
      }

      if (result.success) {
        onSuccess?.(result.data);
      }
    } catch (error) {
      console.error('Session form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      appendRequirement(currentRequirement.trim());
      setCurrentRequirement('');
    }
  };

  const addTag = () => {
    if (currentTag.trim()) {
      appendTag(currentTag.trim());
      setCurrentTag('');
    }
  };

  const addSpeaker = (userId: string, role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON' = 'SPEAKER') => {
    const existing = speakerFields.find(s => s.userId === userId);
    if (!existing) {
      appendSpeaker({ userId, role });
      setSelectedSpeakers([...selectedSpeakers, userId]);
    }
    setSpeakerSearchOpen(false);
  };

  const removeSpeakerHandler = (index: number) => {
    const speaker = speakerFields[index];
    removeSpeaker(index);
    setSelectedSpeakers(selectedSpeakers.filter(id => id !== speaker.userId));
  };

  const getSelectedSessionType = () => {
    const type = form.watch('sessionType');
    return SESSION_TYPES.find(t => t.value === type);
  };

  const availableFaculty = faculty.filter(f => !selectedSpeakers.includes(f.id));

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          {isEditing ? 'Edit Session' : 'Create New Session'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Session Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter session title..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SESSION_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Optional"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the session content, objectives, and any special notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isBreak"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Break Session</FormLabel>
                      <FormDescription>
                        Mark this as a break session (coffee break, lunch, etc.)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Schedule Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Schedule & Venue
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP p')
                              ) : (
                                <span>Pick start time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP p')
                              ) : (
                                <span>Pick end time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hallId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hall</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hall" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No specific hall</SelectItem>
                          {halls.map((hall) => (
                            <SelectItem key={hall.id} value={hall.id}>
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{hall.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Capacity: {hall.capacity} | {hall.location}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Conflict Warning */}
              {conflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Schedule Conflict Detected!</strong>
                    <div className="mt-2 space-y-1">
                      {conflicts.map((conflict, index) => (
                        <div key={index} className="text-sm">
                          • {conflict.title} ({format(new Date(conflict.startTime), 'p')} - {format(new Date(conflict.endTime), 'p')})
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Speakers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Speakers & Moderators
                </h3>
                
                <Popover open={speakerSearchOpen} onOpenChange={setSpeakerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Speaker
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Command>
                      <CommandInput placeholder="Search faculty..." />
                      <CommandList>
                        <CommandEmpty>No faculty found.</CommandEmpty>
                        <CommandGroup>
                          {availableFaculty.map((member) => (
                            <CommandItem
                              key={member.id}
                              onSelect={() => addSpeaker(member.id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex-1">
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {member.institution}
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {speakerFields.length > 0 && (
                <div className="space-y-2">
                  {speakerFields.map((speaker, index) => {
                    const facultyMember = faculty.find(f => f.id === speaker.userId);
                    return (
                      <div key={speaker.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{facultyMember?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {facultyMember?.institution}
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`speakers.${index}.role`}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SPEAKER_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpeakerHandler(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Requirements & Equipment</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add requirement (e.g., Projector, Microphone)..."
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} variant="outline">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              {requirementFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requirementFields.map((requirement, index) => (
                    <Badge key={requirement.id} variant="secondary" className="flex items-center gap-1">
                      {requirement.value}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeRequirement(index)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (e.g., AI, Research, Industry)..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              {tagFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagFields.map((tag, index) => (
                    <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                      {tag.value}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeTag(index)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {getSelectedSessionType() && (
                  <Badge className={getSelectedSessionType()?.color}>
                    {getSelectedSessionType()?.label}
                  </Badge>
                )}
                {conflicts.length === 0 && watchedHallId && watchedStartTime && watchedEndTime && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-sm">No conflicts</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Update Session' : 'Create Session'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}