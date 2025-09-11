// // src/app/(dashboard)/vendor/page.tsx
// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
// import { VendorLayout } from '@/components/dashboard/layout';

// import { useVendorBookings, useVendorServices, useVendorPayments, useVendorDeliveries } from '@/hooks/use-vendor';
// import { useAuth } from '@/hooks/use-auth';

// import { 
//   ShoppingBag, 
//   Calendar, 
//   Briefcase, 
//   DollarSign,
//   TrendingUp,
//   Clock,
//   CheckCircle,
//   AlertTriangle,
//   Truck,
//   Package,
//   MapPin,
//   Phone,
//   MessageSquare,
//   FileText,
//   BarChart3,
//   Star,
//   Users,
//   Timer,
//   Award
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { useState } from 'react';

// export default function VendorDashboardPage() {
//   const { user } = useAuth();
//   const [selectedBookingId, setSelectedBookingId] = useState<string>('');

//   // Data fetching hooks
//   const { data: vendorBookings, isLoading: bookingsLoading } = useVendorBookings();
//   const { data: vendorServices, isLoading: servicesLoading } = useVendorServices();
//   const { data: vendorPayments, isLoading: paymentsLoading } = useVendorPayments();
//   const { data: vendorDeliveries, isLoading: deliveriesLoading } = useVendorDeliveries();

//   // Calculate stats
//   const allBookings = vendorBookings?.data?.bookings || [];
//   const activeBookings = allBookings.filter(b => b.status === 'CONFIRMED');
//   const pendingBookings = allBookings.filter(b => b.status === 'PENDING');
//   const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
  
//   const totalRevenue = vendorPayments?.data?.totalRevenue || 0;
//   const pendingPayments = vendorPayments?.data?.pendingPayments || 0;
//   const averageRating = vendorServices?.data?.averageRating || 0;
  
//   const todaysDeliveries = vendorDeliveries?.data?.deliveries?.filter(delivery => {
//     const deliveryDate = new Date(delivery.scheduledDate);
//     const today = new Date();
//     return deliveryDate.toDateString() === today.toDateString();
//   }) || [];

//   const upcomingDeliveries = todaysDeliveries.filter(d => d.status === 'SCHEDULED');
//   const completedDeliveries = todaysDeliveries.filter(d => d.status === 'DELIVERED');

//   if (bookingsLoading) {
//     return (
//       <VendorLayout>
//         <div className="space-y-6">
//           <SkeletonCard />
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//             <SkeletonCard />
//             <SkeletonCard />
//             <SkeletonCard />
//             <SkeletonCard />
//           </div>
//         </div>
//       </VendorLayout>
//     );
//   }

//   return (
//     <VendorLayout>
//       <div className="space-y-6">
//         {/* Welcome Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">
//               Welcome, {user?.institution || user?.name}! 🏢
//             </h1>
//             <p className="text-muted-foreground">
//               Manage your services, bookings, and deliveries all in one place
//             </p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button>
//               <Package className="h-4 w-4 mr-2" />
//               New Service
//             </Button>
//             <Button variant="outline">
//               <BarChart3 className="h-4 w-4 mr-2" />
//               View Reports
//             </Button>
//           </div>
//         </div>

//         {/* Urgent Deliveries Alert */}
//         {upcomingDeliveries.length > 0 && (
//           <Alert>
//             <Truck className="h-4 w-4" />
//             <AlertDescription>
//               You have {upcomingDeliveries.length} delivery{upcomingDeliveries.length > 1 ? 'ies' : ''} scheduled for today. 
//               Make sure to prepare and dispatch them on time.
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Pending Bookings Alert */}
//         {pendingBookings.length > 0 && (
//           <Alert variant="secondary">
//             <AlertTriangle className="h-4 w-4" />
//             <AlertDescription>
//               {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} awaiting your confirmation. 
//               Review and respond to maintain good customer relations.
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Quick Stats */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
//               <Calendar className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-blue-600">
//                 {bookingsLoading ? <LoadingSpinner size="sm" /> : activeBookings.length}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 {pendingBookings.length} pending approval
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
//               <DollarSign className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-green-600">
//                 {paymentsLoading ? <LoadingSpinner size="sm" /> : `₹${totalRevenue.toLocaleString()}`}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 ₹{pendingPayments.toLocaleString()} pending
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
//               <Truck className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-orange-600">
//                 {deliveriesLoading ? <LoadingSpinner size="sm" /> : todaysDeliveries.length}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 {completedDeliveries.length} completed, {upcomingDeliveries.length} pending
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Service Rating</CardTitle>
//               <Star className="h-4 w-4 text-muted-foreground" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-purple-600">
//                 {servicesLoading ? <LoadingSpinner size="sm" /> : averageRating.toFixed(1)}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 ⭐ Based on customer reviews
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid gap-6 md:grid-cols-2">
//           {/* Recent Bookings */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Briefcase className="h-5 w-5 mr-2" />
//                 Recent Bookings
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {bookingsLoading ? (
//                 <div className="space-y-3">
//                   <SkeletonCard />
//                   <SkeletonCard />
//                 </div>
//               ) : allBookings.length > 0 ? (
//                 <div className="space-y-4">
//                   {allBookings.slice(0, 4).map((booking) => {
//                     const isUpcoming = new Date(booking.serviceDate) > new Date();
//                     const isPending = booking.status === 'PENDING';
//                     const isActive = booking.status === 'CONFIRMED';
                    
//                     return (
//                       <div key={booking.id} className={`p-4 rounded-lg border transition-colors ${
//                         isPending ? 'bg-yellow-50 border-yellow-200' :
//                         isActive ? 'bg-blue-50 border-blue-200' :
//                         'bg-gray-50 border-gray-200'
//                       }`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h5 className="font-medium truncate">{booking.eventName}</h5>
//                             <div className="flex items-center text-sm text-muted-foreground mt-1">
//                               <Calendar className="h-3 w-3 mr-1" />
//                               {format(new Date(booking.serviceDate), 'MMM dd, yyyy')}
//                               <MapPin className="h-3 w-3 ml-2 mr-1" />
//                               {booking.venue}
//                             </div>
//                             <p className="text-sm text-muted-foreground mt-1">
//                               Service: {booking.serviceName} • ₹{booking.amount.toLocaleString()}
//                             </p>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <Badge 
//                               variant={
//                                 isPending ? 'secondary' :
//                                 isActive ? 'default' :
//                                 booking.status === 'COMPLETED' ? 'outline' :
//                                 'destructive'
//                               } 
//                               className="text-xs"
//                             >
//                               {booking.status}
//                             </Badge>
//                             {isPending && (
//                               <Button size="sm">
//                                 Review
//                               </Button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
                  
//                   {allBookings.length > 4 && (
//                     <Button variant="ghost" className="w-full">
//                       View All {allBookings.length} Bookings
//                     </Button>
//                   )}
//                 </div>
//               ) : (
//                 <div className="text-center py-6 text-muted-foreground">
//                   <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                   <p>No bookings yet</p>
//                   <p className="text-sm">Your bookings will appear here</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Today's Deliveries */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Truck className="h-5 w-5 mr-2" />
//                 Today's Deliveries
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {deliveriesLoading ? (
//                 <div className="space-y-3">
//                   <SkeletonCard />
//                   <SkeletonCard />
//                 </div>
//               ) : todaysDeliveries.length > 0 ? (
//                 <div className="space-y-4">
//                   {todaysDeliveries.map((delivery) => {
//                     const isCompleted = delivery.status === 'DELIVERED';
//                     const isInTransit = delivery.status === 'IN_TRANSIT';
//                     const isScheduled = delivery.status === 'SCHEDULED';
                    
//                     return (
//                       <div key={delivery.id} className={`p-4 rounded-lg border transition-colors ${
//                         isCompleted ? 'bg-green-50 border-green-200' :
//                         isInTransit ? 'bg-blue-50 border-blue-200' :
//                         'bg-orange-50 border-orange-200'
//                       }`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h5 className="font-medium truncate">{delivery.itemName}</h5>
//                             <div className="flex items-center text-sm text-muted-foreground mt-1">
//                               <Clock className="h-3 w-3 mr-1" />
//                               {format(new Date(delivery.scheduledTime), 'HH:mm')}
//                               <MapPin className="h-3 w-3 ml-2 mr-1" />
//                               {delivery.deliveryAddress}
//                             </div>
//                             <p className="text-sm text-muted-foreground mt-1">
//                               {delivery.customerName} • {delivery.customerPhone}
//                             </p>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <Badge 
//                               variant={
//                                 isCompleted ? 'outline' :
//                                 isInTransit ? 'default' :
//                                 'secondary'
//                               } 
//                               className="text-xs"
//                             >
//                               {delivery.status === 'DELIVERED' ? 'Delivered' :
//                                delivery.status === 'IN_TRANSIT' ? 'In Transit' :
//                                'Scheduled'}
//                             </Badge>
//                             {!isCompleted && (
//                               <Button size="sm" variant="outline">
//                                 Track
//                               </Button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="text-center py-6 text-muted-foreground">
//                   <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                   <p>No deliveries scheduled today</p>
//                   <p className="text-sm">Enjoy your day!</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Performance Overview */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               <div className="flex items-center">
//                 <BarChart3 className="h-5 w-5 mr-2" />
//                 Business Performance
//               </div>
//               <Button variant="outline" size="sm">
//                 <FileText className="h-4 w-4 mr-2" />
//                 Detailed Report
//               </Button>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-6 md:grid-cols-3">
//               {/* Revenue Metrics */}
//               <div className="space-y-2">
//                 <h5 className="font-medium flex items-center">
//                   <DollarSign className="h-4 w-4 mr-2" />
//                   Revenue Metrics
//                 </h5>
//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">This Month</span>
//                     <span className="font-medium">₹{totalRevenue.toLocaleString()}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Pending Payments</span>
//                     <span className="font-medium text-orange-600">₹{pendingPayments.toLocaleString()}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Average Order Value</span>
//                     <span className="font-medium">₹{allBookings.length > 0 ? Math.round(totalRevenue / allBookings.length) : 0}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Service Metrics */}
//               <div className="space-y-2">
//                 <h5 className="font-medium flex items-center">
//                   <Star className="h-4 w-4 mr-2" />
//                   Service Quality
//                 </h5>
//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Average Rating</span>
//                     <span className="font-medium">{averageRating.toFixed(1)} ⭐</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Completion Rate</span>
//                     <span className="font-medium text-green-600">
//                       {allBookings.length > 0 ? Math.round((completedBookings.length / allBookings.length) * 100) : 0}%
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">On-time Delivery</span>
//                     <span className="font-medium text-green-600">95%</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Growth Metrics */}
//               <div className="space-y-2">
//                 <h5 className="font-medium flex items-center">
//                   <TrendingUp className="h-4 w-4 mr-2" />
//                   Growth Trends
//                 </h5>
//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">New Clients</span>
//                     <span className="font-medium text-blue-600">+{Math.round(allBookings.length * 0.3)}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Repeat Customers</span>
//                     <span className="font-medium text-purple-600">{Math.round(allBookings.length * 0.4)}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Monthly Growth</span>
//                     <span className="font-medium text-green-600">+12%</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Quick Actions */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Quick Actions</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//               <Button className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <Package className="h-6 w-6" />
//                 <span>Add Service</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <Calendar className="h-6 w-6" />
//                 <span>Manage Bookings</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <Truck className="h-6 w-6" />
//                 <span>Track Deliveries</span>
//               </Button>
//               <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
//                 <MessageSquare className="h-6 w-6" />
//                 <span>Customer Support</span>
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Achievements */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center">
//               <Award className="h-5 w-5 mr-2" />
//               Business Achievements
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-6 md:grid-cols-4">
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-blue-600 mb-1">
//                   {completedBookings.length}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Orders Completed</p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-green-600 mb-1">
//                   {Math.round(allBookings.length * 0.4)}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Happy Customers</p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-purple-600 mb-1">
//                   {averageRating.toFixed(1)} ⭐
//                 </div>
//                 <p className="text-sm text-muted-foreground">Service Rating</p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-orange-600 mb-1">
//                   ₹{totalRevenue.toLocaleString()}
//                 </div>
//                 <p className="text-sm text-muted-foreground">Total Revenue</p>
//               </div>
//             </div>
//             <div className="mt-4 text-center">
//               <p className="text-sm text-muted-foreground">
//                 Thank you for being a trusted vendor partner! Your quality service makes events successful.
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </VendorLayout>
//   );
// }