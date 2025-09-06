// // src/app/(dashboard)/event-manager/faculty/add/page.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { LoadingSpinner } from '@/components/ui/loading';
// import { EventManagerLayout } from '@/components/dashboard/layout';
// //import { Separator } from '@/components/ui/separator';

// import { useCreateFaculty } from '@/hooks/use-faculty';
// import { useEvents } from '@/hooks/use-events';
// import { useAuth } from '@/hooks/use-auth';

// import { 
//   ArrowLeft,
//   UserPlus,
//   User,
//   Mail,
//   Phone,
//   Building,
//   Globe,
//   FileText,
//   Save,
//   Upload,
//   Award,
//   Briefcase,
//   MapPin,
//   Calendar,
//   CheckCircle,
//   AlertCircle,
//   BookOpen,
//   Star,
//   Target,
//   Settings
// } from 'lucide-react';
// import { Separator } from '@radix-ui/react-select';

// // Validation schema
// const AddFacultySchema = z.object({
//   name: z.string().min(2, 'Name must be at least 2 characters'),
//   email: z.string().email('Please enter a valid email address'),
//   phone: z.string().optional(),
//   designation: z.string().optional(),
//   institution: z.string().optional(),
//   specialization: z.string().optional(),
//   bio: z.string().optional(),
//   website: z.string().url().optional().or(z.literal('')),
//   role: z.enum(['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('FACULTY'),
//   status: z.enum(['ACTIVE', 'PENDING', 'INACTIVE']).default('ACTIVE'),
//   eventId: z.string().optional(),
//   sessionRole: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).optional(),
//   // Additional fields
//   profileImage: z.string().optional(),
//   cv: z.string().optional(),
//   socialLinks: z.object({
//     linkedin: z.string().optional(),
//     twitter: z.string().optional(),
//     academia: z.string().optional(),
//     researchgate: z.string().optional(),
//   }).optional(),
// });

// type AddFacultyFormData = z.infer<typeof AddFacultySchema>;

// export default function AddFacultyPage() {
//   const router = useRouter();
//   const { user } = useAuth();
  
//   // State management
//   const [step, setStep] = useState<'basic' | 'details' | 'assignment'>('basic');

//   // Data fetching
//   const { data: events, isLoading: eventsLoading } = useEvents({ 
//     status: 'PUBLISHED',
//     limit: 50 
//   });

//   // Mutations
//   //const createFaculty = useCreateFaculty();

//   // Form setup
//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors, isSubmitting }
//   } = useForm<AddFacultyFormData>({
//     resolver: zodResolver(AddFacultySchema),
//     defaultValues: {
//       name: '',
//       email: '',
//       phone: '',
//       designation: '',
//       institution: '',
//       specialization: '',
//       bio: '',
//       website: '',
//       role: 'FACULTY',
//       status: 'ACTIVE',
//       eventId: '',
//       sessionRole: 'SPEAKER',
//       profileImage: '',
//       cv: '',
//       socialLinks: {
//         linkedin: '',
//         twitter: '',
//         academia: '',
//         researchgate: ''
//       }
//     }
//   });

//   const watchedRole = watch('role');
//   const watchedEventId = watch('eventId');
//   const selectedEvent = events?.data?.events?.find(e => e.id === watchedEventId);

//   // Handle form submission
//   const onSubmit = async (data: AddFacultyFormData) => {
//     try {
//       const result = await createFaculty.mutateAsync(data);
      
//       // Redirect to faculty profile or list
//       if (result.data.id) {
//         router.push(`/event-manager/faculty/${result.data.id}`);
//       } else {
//         router.push('/event-manager/faculty');
//       }
//     } catch (error) {
//       console.error('Failed to create faculty:', error);
//     }
//   };

//   // Handle step navigation
//   const handleNextStep = () => {
//     if (step === 'basic') setStep('details');
//     else if (step === 'details') setStep('assignment');
//   };

//   const handlePreviousStep = () => {
//     if (step === 'assignment') setStep('details');
//     else if (step === 'details') setStep('basic');
//   };

//   return (
//     <EventManagerLayout>
//       <div className="max-w-4xl mx-auto space-y-6">
        
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Button variant="outline" onClick={() => router.back()}>
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Faculty
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight">Add Faculty Member</h1>
//               <p className="text-muted-foreground">
//                 Create a new faculty profile and assign to events
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Badge variant="outline" className="px-3 py-1">
//               Step {step === 'basic' ? '1' : step === 'details' ? '2' : '3'} of 3
//             </Badge>
//           </div>
//         </div>

//         {/* Progress Steps */}
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div className={`flex items-center space-x-2 ${step === 'basic' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'basic' ? 'bg-blue-600 text-white' : 
//                   step === 'details' || step === 'assignment' ? 'bg-green-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   {step === 'details' || step === 'assignment' ? <CheckCircle className="h-4 w-4" /> : '1'}
//                 </div>
//                 <span className="font-medium">Basic Information</span>
//               </div>
              
//               <div className={`w-16 h-0.5 ${step === 'details' || step === 'assignment' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
//               <div className={`flex items-center space-x-2 ${step === 'details' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'details' ? 'bg-blue-600 text-white' : 
//                   step === 'assignment' ? 'bg-green-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   {step === 'assignment' ? <CheckCircle className="h-4 w-4" /> : '2'}
//                 </div>
//                 <span className="font-medium">Additional Details</span>
//               </div>
              
//               <div className={`w-16 h-0.5 ${step === 'assignment' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
//               <div className={`flex items-center space-x-2 ${step === 'assignment' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'assignment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   3
//                 </div>
//                 <span className="font-medium">Event Assignment</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Main Form */}
//         <form onSubmit={handleSubmit(onSubmit)}>
          
//           {/* Step 1: Basic Information */}
//           {step === 'basic' && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center">
//                   <User className="h-5 w-5 mr-2" />
//                   Basic Information
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
                
//                 <div className="grid gap-6 md:grid-cols-2">
//                   <div>
//                     <Label htmlFor="name">Full Name *</Label>
//                     <Input
//                       {...register('name')}
//                       placeholder="Dr. John Smith"
//                     />
//                     {errors.name && (
//                       <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
//                     )}
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="email">Email Address *</Label>
//                     <Input
//                       {...register('email')}
//                       placeholder="john.smith@university.edu"
//                       type="email"
//                     />
//                     {errors.email && (
//                       <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
//                     )}
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="phone">Phone Number</Label>
//                     <Input
//                       {...register('phone')}
//                       placeholder="+1 (555) 123-4567"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="designation">Designation</Label>
//                     <Input
//                       {...register('designation')}
//                       placeholder="Professor, Associate Professor, etc."
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="institution">Institution</Label>
//                     <Input
//                       {...register('institution')}
//                       placeholder="University Name"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="specialization">Specialization</Label>
//                     <Input
//                       {...register('specialization')}
//                       placeholder="Computer Science, AI Research, etc."
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <Label htmlFor="role">Faculty Role</Label>
//                   <Select onValueChange={(value) => setValue('role', value as any)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select role" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="FACULTY">Faculty Member</SelectItem>
//                       <SelectItem value="SPEAKER">Speaker</SelectItem>
//                       <SelectItem value="MODERATOR">Moderator</SelectItem>
//                       <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="status">Status</Label>
//                   <Select onValueChange={(value) => setValue('status', value as any)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="ACTIVE">Active</SelectItem>
//                       <SelectItem value="PENDING">Pending</SelectItem>
//                       <SelectItem value="INACTIVE">Inactive</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Step 2: Additional Details */}
//           {step === 'details' && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center">
//                   <FileText className="h-5 w-5 mr-2" />
//                   Additional Details
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
                
//                 <div>
//                   <Label htmlFor="bio">Biography</Label>
//                   <Textarea
//                     {...register('bio')}
//                     placeholder="Brief professional biography..."
//                     rows={4}
//                   />
//                   <p className="text-sm text-muted-foreground mt-1">
//                     This will be displayed on the faculty profile page
//                   </p>
//                 </div>

//                 <div>
//                   <Label htmlFor="website">Personal Website</Label>
//                   <Input
//                     {...register('website')}
//                     placeholder="https://example.com"
//                     type="url"
//                   />
//                   {errors.website && (
//                     <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
//                   )}
//                 </div>

//                 <Separator />

//                 <h3 className="text-lg font-medium">Social Links (Optional)</h3>
                
//                 <div className="grid gap-4 md:grid-cols-2">
//                   <div>
//                     <Label htmlFor="linkedin">LinkedIn</Label>
//                     <Input
//                       {...register('socialLinks.linkedin')}
//                       placeholder="https://linkedin.com/in/username"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="twitter">Twitter</Label>
//                     <Input
//                       {...register('socialLinks.twitter')}
//                       placeholder="https://twitter.com/username"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="academia">Academia.edu</Label>
//                     <Input
//                       {...register('socialLinks.academia')}
//                       placeholder="https://university.academia.edu/username"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="researchgate">ResearchGate</Label>
//                     <Input
//                       {...register('socialLinks.researchgate')}
//                       placeholder="https://researchgate.net/profile/username"
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Step 3: Event Assignment */}
//           {step === 'assignment' && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center">
//                   <Calendar className="h-5 w-5 mr-2" />
//                   Event Assignment (Optional)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
                
//                 <Alert>
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertDescription>
//                     You can assign this faculty member to an event now or do it later from the faculty list.
//                   </AlertDescription>
//                 </Alert>

//                 <div>
//                   <Label htmlFor="eventId">Assign to Event</Label>
//                   <Select onValueChange={(value) => setValue('eventId', value === 'none' ? '' : value)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select an event (optional)" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="none">No assignment</SelectItem>
//                       {events?.data?.events?.map((event) => (
//                         <SelectItem key={event.id} value={event.id}>
//                           <div className="flex items-center space-x-2">
//                             <span>{event.name}</span>
//                             <Badge variant="outline">
//                               {new Date(event.startDate).toLocaleDateString()}
//                             </Badge>
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {selectedEvent && (
//                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                     <div className="flex items-start space-x-4">
//                       <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
//                       <div>
//                         <h4 className="font-medium text-blue-800">{selectedEvent.name}</h4>
//                         <div className="flex items-center space-x-4 text-sm text-blue-600 mt-1">
//                           <span>📅 {new Date(selectedEvent.startDate).toLocaleDateString()}</span>
//                           {selectedEvent.venue && <span>📍 {selectedEvent.venue}</span>}
//                         </div>
//                         {selectedEvent.description && (
//                           <p className="text-sm text-blue-600 mt-2">{selectedEvent.description}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {watchedEventId && (
//                   <div>
//                     <Label htmlFor="sessionRole">Role in Event</Label>
//                     <Select onValueChange={(value) => setValue('sessionRole', value as any)}>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select role" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="SPEAKER">Speaker</SelectItem>
//                         <SelectItem value="MODERATOR">Moderator</SelectItem>
//                         <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between">
//             <div>
//               {step !== 'basic' && (
//                 <Button type="button" variant="outline" onClick={handlePreviousStep}>
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Previous
//                 </Button>
//               )}
//             </div>
            
//             <div className="flex space-x-2">
//               {step !== 'assignment' ? (
//                 <Button type="button" onClick={handleNextStep}>
//                   Next Step
//                   <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
//                 </Button>
//               ) : (
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting ? (
//                     <LoadingSpinner size="sm" />
//                   ) : (
//                     <>
//                       <Save className="h-4 w-4 mr-2" />
//                       Create Faculty
//                     </>
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </form>
//       </div>
//     </EventManagerLayout>
//   );
// }