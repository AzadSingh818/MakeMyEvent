// // src/app/(dashboard)/volunteer/page.tsx
// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
// import { VolunteerLayout } from '@/components/dashboard/layout';

// import { useVolunteerTasks, useMyShifts, useTaskCompletion } from '@/hooks/use-volunteer';
// import { useTodaysSessions } from '@/hooks/use-sessions';
// import { useAuth } from '@/hooks/use-auth';

// import { 
//   Briefcase, 
//   Clock, 
//   CheckSquare, 
//   AlertCircle,
//   Calendar,
//   Users,
//   UserCheck,
//   MapPin,
//   MessageSquare,
//   Phone,
//   Star,
//   Award,
//   Timer,
//   Zap,
//   Target,
//   FileText
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { useState } from 'react';

// export default function VolunteerDashboardPage() {
//   const { user } = useAuth();
//   const [selectedTaskId, setSelectedTaskId] = useState<string>('');

//   // Data fetching hooks
//   const { data: volunteerTasks, isLoading: tasksLoading } = useVolunteerTasks();
//   const { data: myShifts, isLoading: shiftsLoading } = useMyShifts();
//   const { data: todaysSessions, isLoading: sessionsLoading } = useTodaysSessions();
  
//   // Mutations
//   const taskCompletion = useTaskCompletion();

//   // Calculate stats
//   const allTasks = volunteerTasks?.data?.tasks || [];
//   const pendingTasks = allTasks.filter(t => t.status === 'PENDING');
//   const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS');
//   const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');
//   const overdueTasksCount = allTasks.filter(t => 
//     t.status !== 'COMPLETED' && new Date(t.deadline) < new Date()
//   ).length;

//   // Today's shifts
//   const todaysShifts = myShifts?.data?.shifts?.filter(shift => {
//     const shiftDate = new Date(shift.startTime);
//     const today = new Date();
//     return shiftDate.toDateString() === today.toDateString();
//   }) || [];

//   // Current shift
//   const currentShift = todaysShifts.find(shift => {
//     const now = new Date();
//     const shiftStart = new Date(shift.startTime);
//     const shiftEnd = new Date(shift.endTime);
//     return now >= shiftStart && now <= shiftEnd;
//   });

//   // Next shift
//   const nextShift = todaysShifts.find(shift => {
//     const now = new Date();
//     const shiftStart = new Date(shift.startTime);
//     return shiftStart > now;
//   });

//   // Handle task actions
//   const handleStartTask = (taskId: string) => {
//     taskCompletion.mutate({
//       taskId,
//       action: 'START',
//       notes: 'Task started by volunteer'
//     });
//   };

//   const handleCompleteTask = (taskId: string) => {
//     taskCompletion.mutate({
//       taskId,
//       action: 'COMPLETE',
//       notes: 'Task completed successfully'
//     });
//   };

//   if (tasksLoading) {
//     return (
//       <VolunteerLayout>
//         <div className="space-y-6">
//           <SkeletonCard />
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//             <SkeletonCard />
//             <SkeletonCard />
//             <SkeletonCard />
//             <SkeletonCard />
//           </div>
//         </div>
//       </VolunteerLayout>
//     );
//   }

//   return (
//     <VolunteerLayout>
//       <div className="space-y-6">
//         {/* Welcome Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">
//               Welcome, {user?.name}! 👋
//             </h1>
//             <p className="text-muted-foreground">
//               Ready to make a difference today? Let's check your tasks and schedule.
//             </p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button>
//               <CheckSquare className="h-4 w-4 mr-2" />
//               Quick Check-in
//             </Button>
//             <Button variant="outline">
//               <Phone className="h-4 w-4 mr-2" />
//               Contact Support
//             </Button>
//           </div>
//         </div>

//         {/* Current Shift Alert */}
//         {currentShift && (
//           <Alert>
//             <Zap className="h-4 w-4" />
//             <AlertDescription>
//               <strong>You're currently on duty!</strong> Shift: {currentShift.role} - 
//               {format(new Date(currentShift.startTime), 'HH:mm')} to {format(new Date(currentShift.endTime), 'HH:mm')}
//               {currentShift.location && ` at ${currentShift.location}`}
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Overdue Tasks Alert */}
//         {overdueTasksCount > 0 && (
//           <Alert variant="destructive">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>
//               You have {overdueTasksCount} overdue task{overdueTasksCount > 1 ? 's' : ''}. 
//               Please prioritize completing them as soon as possible.
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Quick Stats */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
//               <Briefcase className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-orange-600">
//                 {tasksLoading ? <LoadingSpinner size="sm" /> : pendingTasks.length}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 {inProgressTasks.length} in progress
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
//               <CheckSquare className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-green-600">
//                 {tasksLoading ? <LoadingSpinner size="sm" /> : completedTasks.filter(t => 
//                   new Date(t.completedAt).toDateString() === new Date().toDateString()
//                 ).length}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Great progress!
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
//               <Clock className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">
//                 {shiftsLoading ? <LoadingSpinner size="sm" /> : todaysShifts.length}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 {currentShift ? 'Currently on duty' : nextShift ? `Next: ${format(new Date(nextShift.startTime), 'HH:mm')}` : 'No more shifts today'}
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Volunteer Points</CardTitle>
//               <Star className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-purple-600">
//                 {user?.volunteerPoints || 0}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 +{completedTasks.length * 10} this week
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid gap-6 md:grid-cols-2">
//           {/* Priority Tasks */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Target className="h-5 w-5 mr-2" />
//                 Priority Tasks
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {tasksLoading ? (
//                 <div className="space-y-3">
//                   <SkeletonCard />
//                   <SkeletonCard />
//                 </div>
//               ) : pendingTasks.length > 0 || inProgressTasks.length > 0 ? (
//                 <div className="space-y-4">
//                   {[...inProgressTasks, ...pendingTasks].slice(0, 4).map((task) => {
//                     const isOverdue = new Date(task.deadline) < new Date();
//                     const isUrgent = new Date(task.deadline).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000; // 2 hours
                    
//                     return (
//                       <div key={task.id} className={`p-4 rounded-lg border transition-colors ${
//                         isOverdue ? 'bg-red-50 border-red-200' :
//                         isUrgent ? 'bg-orange-50 border-orange-200' :
//                         task.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' :
//                         'bg-gray-50 border-gray-200'
//                       }`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h5 className="font-medium truncate">{task.title}</h5>
//                             <div className="flex items-center text-sm text-muted-foreground mt-1">
//                               <Timer className="h-3 w-3 mr-1" />
//                               Due: {format(new Date(task.deadline), 'MMM dd, HH:mm')}
//                               {task.location && (
//                                 <>
//                                   <MapPin className="h-3 w-3 ml-2 mr-1" />
//                                   {task.location}
//                                 </>
//                               )}
//                             </div>
//                             <p className="text-sm text-muted-foreground mt-1 truncate">
//                               {task.description}
//                             </p>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             {isOverdue && (
//                               <Badge variant="destructive" className="text-xs">
//                                 Overdue
//                               </Badge>
//                             )}
//                             {isUrgent && !isOverdue && (
//                               <Badge variant="secondary" className="text-xs">
//                                 Urgent
//                               </Badge>
//                             )}
//                             <Badge 
//                               variant={task.status === 'IN_PROGRESS' ? 'default' : 'outline'} 
//                               className="text-xs"
//                             >
//                               {task.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
//                             </Badge>
//                             {task.status === 'PENDING' ? (
//                               <Button size="sm" onClick={() => handleStartTask(task.id)}>
//                                 Start
//                               </Button>
//                             ) : (
//                               <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
//                                 Complete
//                               </Button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
                  
//                   {(pendingTasks.length + inProgressTasks.length) > 4 && (
//                     <Button variant="ghost" className="w-full">
//                       View All {pendingTasks.length + inProgressTasks.length} Tasks
//                     </Button>
//                   )}
//                 </div>
//               ) : (
//                 <div className="text-center py-6 text-muted-foreground">
//                   <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                   <p>All caught up! 🎉</p>
//                   <p className="text-sm">No pending tasks at the moment</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Today's Schedule */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Calendar className="h-5 w-5 mr-2" />
//                 Today's Schedule
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {shiftsLoading ? (
//                 <div className="space-y-3">
//                   <SkeletonCard />
//                   <SkeletonCard />
//                 </div>
//               ) : todaysShifts.length > 0 ? (
//                 <div className="space-y-4">
//                   {todaysShifts.map((shift) => {
//                     const isActive = currentShift?.id === shift.id;
//                     const isPast = new Date(shift.endTime) < new Date();
//                     const isUpcoming = new Date(shift.startTime) > new Date();
                    
//                     return (
//                       <div key={shift.id} className={`p-4 rounded-lg border transition-colors ${
//                         isActive ? 'bg-green-50 border-green-200' :
//                         isPast ? 'bg-gray-50 border-gray-200' :
//                         'bg-blue-50 border-blue-200'
//                       }`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h5 className="font-medium">{shift.role}</h5>
//                             <div className="flex items-center text-sm text-muted-foreground mt-1">
//                               <Clock className="h-3 w-3 mr-1" />
//                               {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
//                               {shift.location && (
//                                 <>
//                                   <MapPin className="h-3 w-3 ml-2 mr-1" />
//                                   {shift.location}
//                                 </>
//                               )}
//                             </div>
//                             {shift.supervisor && (
//                               <p className="text-sm text-muted-foreground">
//                                 Supervisor: {shift.supervisor}
//                               </p>
//                             )}
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             {isActive && (
//                               <Badge variant="default" className="text-xs">
//                                 Active
//                               </Badge>
//                             )}
//                             {isPast && (
//                               <Badge variant="secondary" className="text-xs">
//                                 Completed
//                               </Badge>
//                             )}
//                             {isUpcoming && (
//                               <Badge variant="outline" className="text-xs">
//                                 Upcoming
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="text-center py-6 text-muted-foreground">
//                   <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                   <p>No shifts scheduled today</p>
//                   <p className="text-sm">Enjoy your day off!</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Quick Actions */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Quick Actions</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//               <Button className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <UserCheck className="h-6 w-6" />
//                 <span>Check In/Out</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <MessageSquare className="h-6 w-6" />
//                 <span>Report Issue</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <Phone className="h-6 w-6" />
//                 <span>Contact Supervisor</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <FileText className="h-6 w-6" />
//                 <span>View Resources</span>
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Achievement Section */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center">
//               <Award className="h-5 w-5 mr-2" />
//               Your Impact
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-6 md:grid-cols-3">
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-blue-600 mb-1">
//                   {completedTasks.length}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Tasks Completed</p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-green-600 mb-1">
//                   {Math.round((myShifts?.data?.shifts?.length || 0) * 3.5)}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Hours Volunteered</p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-purple-600 mb-1">
//                   {user?.volunteerPoints || 0}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Recognition Points</p>
//               </div>
//             </div>
//             <div className="mt-4 text-center">
//               <p className="text-sm text-muted-foreground">
//                 Thank you for your dedication! You're making a real difference in making events successful.
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </VolunteerLayout>
//   );
// }