// src/app/(dashboard)/event-manager/faculty/invite/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';
import { Separator } from '@/components/ui/separator';

import { useSendInvitations } from '@/hooks/use-faculty';
import { useEvents } from '@/hooks/use-events';
import { useAuth } from '@/hooks/use-auth';

import { 
  ArrowLeft,
  UserPlus,
  Mail,
  Send,
  Plus,
  Trash2,
  Upload,
  Download,
  Eye,
  Users,
  Calendar,
  MapPin,
  Building,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Zap,
  Target,
  MessageSquare,
  Settings,
  Info,
  Star,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

// Validation schema
const InvitationSchema = z.object({
  eventId: z.string().min(1, 'Please select an event'),
  facultyList: z.array(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    institution: z.string().optional(),
    specialization: z.string().optional(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER'),
    sessionId: z.string().optional(),
  })).min(1, 'Please add at least one faculty member'),
  invitationMessage: z.string().min(10, 'Invitation message must be at least 10 characters'),
  invitationSubject: z.string().min(5, 'Subject must be at least 5 characters'),
  sendReminder: z.boolean().default(true),
  reminderDays: z.number().min(1).max(30).default(3),
});

type InvitationFormData = z.infer<typeof InvitationSchema>;

export default function FacultyInvitePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State management
  const [step, setStep] = useState<'compose' | 'preview' | 'send'>('compose');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [invitationResults, setInvitationResults] = useState<any>(null);

  // Data fetching
  const { data: events, isLoading: eventsLoading } = useEvents({ 
    status: 'PUBLISHED',
    limit: 50 
  });

  // Mutations
  const sendInvitations = useSendInvitations();

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<InvitationFormData>({
    resolver: zodResolver(InvitationSchema),
    defaultValues: {
      eventId: '',
      facultyList: [{ 
        name: '', 
        email: '', 
        phone: '', 
        designation: '', 
        institution: '', 
        specialization: '', 
        role: 'SPEAKER',
        sessionId: '' 
      }],
      invitationMessage: `Dear [Faculty Name],

We are delighted to invite you to participate as a speaker in our upcoming conference. Your expertise and insights would be invaluable to our academic community.

Conference Details:
- Date: [Event Date]
- Venue: [Event Venue]
- Theme: [Event Theme]

We would be honored to have you share your knowledge with our participants. Please confirm your participation by [Date].

Looking forward to your positive response.

Best regards,
[Organizer Name]
[Contact Information]`,
      invitationSubject: 'Invitation to Speak at Our Conference',
      sendReminder: true,
      reminderDays: 3
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'facultyList'
  });

  const watchedEventId = watch('eventId');
  const watchedFacultyList = watch('facultyList');
  const selectedEvent = events?.data?.events?.find(e => e.id === watchedEventId);

  // Handle bulk email input
  const handleBulkEmailParse = useCallback(() => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const newFaculty: any[] = [];

    lines.forEach(line => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        const [name, email, designation = '', institution = '', specialization = ''] = parts;
        if (email.includes('@')) {
          newFaculty.push({
            name: name.replace(/"/g, ''),
            email: email.replace(/"/g, ''),
            phone: '',
            designation: designation.replace(/"/g, ''),
            institution: institution.replace(/"/g, ''),
            specialization: specialization.replace(/"/g, ''),
            role: 'SPEAKER',
            sessionId: ''
          });
        }
      }
    });

    if (newFaculty.length > 0) {
      setValue('facultyList', [...watchedFacultyList, ...newFaculty]);
      setBulkInput('');
      setShowBulkInput(false);
    }
  }, [bulkInput, watchedFacultyList, setValue]);

  // Handle form submission
  const onSubmit = async (data: InvitationFormData) => {
    if (step === 'compose') {
      setStep('preview');
      return;
    }

    if (step === 'preview') {
      try {
        const result = await sendInvitations.mutateAsync(data);
        setInvitationResults(result);
        setStep('send');
      } catch (error) {
        console.error('Failed to send invitations:', error);
      }
    }
  };

  // Generate preview message
  const generatePreviewMessage = (facultyName: string) => {
    const message = getValues('invitationMessage');
    return message
      .replace('[Faculty Name]', facultyName)
      .replace('[Event Date]', selectedEvent ? format(new Date(selectedEvent.startDate), 'PPP') : '[Event Date]')
      .replace('[Event Venue]', selectedEvent?.venue || '[Event Venue]')
      .replace('[Event Theme]', selectedEvent?.description || '[Event Theme]')
      .replace('[Organizer Name]', user?.name || '[Organizer Name]')
      .replace('[Contact Information]', user?.email || '[Contact Information]');
  };

  if (eventsLoading) {
    return (
      <EventManagerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Faculty
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invite Faculty</h1>
              <p className="text-muted-foreground">
                Send professional invitations to faculty members
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              Step {step === 'compose' ? '1' : step === 'preview' ? '2' : '3'} of 3
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 ${step === 'compose' ? 'text-blue-600' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'compose' ? 'bg-blue-600 text-white' : 
                  step === 'preview' || step === 'send' ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step === 'preview' || step === 'send' ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <span className="font-medium">Compose Invitation</span>
              </div>
              
              <div className={`w-16 h-0.5 ${step === 'preview' || step === 'send' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
              <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'preview' ? 'bg-blue-600 text-white' : 
                  step === 'send' ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step === 'send' ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <span className="font-medium">Preview & Confirm</span>
              </div>
              
              <div className={`w-16 h-0.5 ${step === 'send' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
              <div className={`flex items-center space-x-2 ${step === 'send' ? 'text-blue-600' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'send' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className="font-medium">Send Invitations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          
          {/* Step 1: Compose */}
          {step === 'compose' && (
            <div className="space-y-6">
              
              {/* Event Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Select Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="eventId">Event *</Label>
                      <Select onValueChange={(value) => setValue('eventId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events?.data?.events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="flex items-center space-x-2">
                                <span>{event.name}</span>
                                <Badge variant="outline">
                                  {format(new Date(event.startDate), 'MMM dd, yyyy')}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.eventId && (
                        <p className="text-sm text-red-600 mt-1">{errors.eventId.message}</p>
                      )}
                    </div>

                    {selectedEvent && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-4">
                          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">{selectedEvent.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-blue-600 mt-1">
                              <span>📅 {format(new Date(selectedEvent.startDate), 'PPP')}</span>
                              {selectedEvent.venue && <span>📍 {selectedEvent.venue}</span>}
                            </div>
                            {selectedEvent.description && (
                              <p className="text-sm text-blue-600 mt-2">{selectedEvent.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Faculty List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Faculty Members ({fields.length})
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkInput(!showBulkInput)}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Bulk Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ 
                          name: '', 
                          email: '', 
                          phone: '', 
                          designation: '', 
                          institution: '', 
                          specialization: '', 
                          role: 'SPEAKER',
                          sessionId: '' 
                        })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Faculty
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Bulk Input */}
                    {showBulkInput && (
                      <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                        <Label>Bulk Add Faculty (CSV Format)</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Format: Name, Email, Designation, Institution, Specialization (one per line)
                        </p>
                        <Textarea
                          placeholder={`Dr. John Smith, john.smith@university.edu, Professor, MIT University, AI Research
Dr. Jane Doe, jane.doe@college.edu, Associate Professor, Stanford College, Machine Learning`}
                          value={bulkInput}
                          onChange={(e) => setBulkInput(e.target.value)}
                          rows={4}
                        />
                        <div className="flex space-x-2 mt-3">
                          <Button type="button" size="sm" onClick={handleBulkEmailParse}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add All
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkInput(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Individual Faculty Entries */}
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Faculty Member {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor={`facultyList.${index}.name`}>Name *</Label>
                              <Input
                                {...register(`facultyList.${index}.name`)}
                                placeholder="Dr. John Smith"
                              />
                              {errors.facultyList?.[index]?.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.facultyList[index]?.name?.message}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <Label htmlFor={`facultyList.${index}.email`}>Email *</Label>
                              <Input
                                {...register(`facultyList.${index}.email`)}
                                placeholder="john.smith@university.edu"
                                type="email"
                              />
                              {errors.facultyList?.[index]?.email && (
                                <p className="text-sm text-red-600 mt-1">
                                  {errors.facultyList[index]?.email?.message}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <Label htmlFor={`facultyList.${index}.designation`}>Designation</Label>
                              <Input
                                {...register(`facultyList.${index}.designation`)}
                                placeholder="Professor"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`facultyList.${index}.institution`}>Institution</Label>
                              <Input
                                {...register(`facultyList.${index}.institution`)}
                                placeholder="University Name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`facultyList.${index}.specialization`}>Specialization</Label>
                              <Input
                                {...register(`facultyList.${index}.specialization`)}
                                placeholder="AI Research"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`facultyList.${index}.role`}>Role</Label>
                              <Select 
                                onValueChange={(value) => 
                                  setValue(`facultyList.${index}.role`, value as 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON')
                                }
                                defaultValue="SPEAKER"
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SPEAKER">Speaker</SelectItem>
                                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                                  <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.facultyList && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please add at least one faculty member with valid information.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invitation Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Invitation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="invitationSubject">Email Subject *</Label>
                    <Input
                      {...register('invitationSubject')}
                      placeholder="Invitation to speak at our conference"
                    />
                    {errors.invitationSubject && (
                      <p className="text-sm text-red-600 mt-1">{errors.invitationSubject.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="invitationMessage">Invitation Message *</Label>
                    <Textarea
                      {...register('invitationMessage')}
                      placeholder="Write your invitation message here..."
                      rows={12}
                    />
                    {errors.invitationMessage && (
                      <p className="text-sm text-red-600 mt-1">{errors.invitationMessage.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Use placeholders: [Faculty Name], [Event Date], [Event Venue], [Event Theme], [Organizer Name], [Contact Information]
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('sendReminder')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="sendReminder">Send reminder email if no response</Label>
                  </div>

                  {watch('sendReminder') && (
                    <div className="ml-6">
                      <Label htmlFor="reminderDays">Send reminder after (days)</Label>
                      <Input
                        {...register('reminderDays', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        max="30"
                        className="w-20"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Preview Invitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="font-medium text-blue-800">{watchedFacultyList.length} Recipients</p>
                            <p className="text-sm text-blue-600">Faculty members</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="font-medium text-green-800">{selectedEvent?.name}</p>
                            <p className="text-sm text-green-600">Selected event</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-purple-600 mr-2" />
                          <div>
                            <p className="font-medium text-purple-800">Email Invitation</p>
                            <p className="text-sm text-purple-600">
                              {watch('sendReminder') ? `+ ${watch('reminderDays')} day reminder` : 'Single email'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Preview */}
                    <div className="border rounded-lg">
                      <div className="border-b p-4 bg-gray-50">
                        <h4 className="font-medium">Email Preview</h4>
                        <p className="text-sm text-muted-foreground">Sample for: {watchedFacultyList[0]?.name || 'Faculty Member'}</p>
                      </div>
                      <div className="p-6 bg-white">
                        <div className="space-y-4">
                          <div>
                            <strong>Subject:</strong> {watch('invitationSubject')}
                          </div>
                          <div>
                            <strong>To:</strong> {watchedFacultyList[0]?.email || 'faculty@example.com'}
                          </div>
                          <Separator />
                          <div className="whitespace-pre-wrap">
                            {generatePreviewMessage(watchedFacultyList[0]?.name || 'Faculty Member')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Faculty List Preview */}
                    <div>
                      <h4 className="font-medium mb-3">Recipients Summary</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {watchedFacultyList.map((faculty, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{faculty.name}</p>
                              <p className="text-sm text-muted-foreground">{faculty.email}</p>
                              {faculty.institution && (
                                <p className="text-xs text-muted-foreground">{faculty.institution}</p>
                              )}
                            </div>
                            <Badge variant="outline">{faculty.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'send' && invitationResults && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Invitations Sent Successfully
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Results Summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="font-medium text-green-800">{invitationResults.data.summary.successful}</p>
                            <p className="text-sm text-green-600">Sent successfully</p>
                          </div>
                        </div>
                      </div>
                      
                      {invitationResults.data.summary.failed > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                              <p className="font-medium text-red-800">{invitationResults.data.summary.failed}</p>
                              <p className="text-sm text-red-600">Failed to send</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="font-medium text-blue-800">{invitationResults.data.summary.total}</p>
                            <p className="text-sm text-blue-600">Total invitations</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Successful Invitations */}
                    {invitationResults.data.invited.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-green-800">Successfully Sent</h4>
                        <div className="space-y-2">
                          {invitationResults.data.invited.map((invitation: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                              <div>
                                <p className="font-medium">{invitation.name}</p>
                                <p className="text-sm text-muted-foreground">{invitation.email}</p>
                              </div>
                              <Badge variant="outline" className="text-green-600">
                                Sent
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Failed Invitations */}
                    {invitationResults.data.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-red-800">Failed to Send</h4>
                        <div className="space-y-2">
                          {invitationResults.data.errors.map((error: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                              <div>
                                <p className="font-medium">{error.email}</p>
                                <p className="text-sm text-red-600">{error.error}</p>
                              </div>
                              <Badge variant="outline" className="text-red-600">
                                Failed
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div>
              {step === 'preview' && (
                <Button type="button" variant="outline" onClick={() => setStep('compose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Edit
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {step === 'compose' && (
                <Button type="submit" disabled={!watchedEventId || watchedFacultyList.length === 0}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Invitations
                </Button>
              )}
              
              {step === 'preview' && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
              )}
              
              {step === 'send' && (
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/event-manager/faculty')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Faculty
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setStep('compose');
                      setInvitationResults(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Send More Invitations
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </EventManagerLayout>
  );
}