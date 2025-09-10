// // src/app/(dashboard)/admin/roles/page.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { format } from "date-fns";
// import { 
//   Users, 
//   Shield, 
//   Edit3, 
//   Check,
//   X,
//   Loader2
// } from "lucide-react";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: string;
//   created_at: string;
// }

// const ROLE_COLORS = {
//   ORGANIZER: 'bg-purple-100 text-purple-800',
//   EVENT_MANAGER: 'bg-blue-100 text-blue-800',
//   FACULTY: 'bg-green-100 text-green-800',
//   DELEGATE: 'bg-gray-100 text-gray-800',
//   HALL_COORDINATOR: 'bg-orange-100 text-orange-800',
//   SPONSOR: 'bg-yellow-100 text-yellow-800',
//   VOLUNTEER: 'bg-cyan-100 text-cyan-800',
//   VENDOR: 'bg-pink-100 text-pink-800'
// };

// const ROLES = [
//   'ORGANIZER',
//   'EVENT_MANAGER', 
//   'FACULTY',
//   'DELEGATE',
//   'HALL_COORDINATOR',
//   'SPONSOR',
//   'VOLUNTEER',
//   'VENDOR'
// ];

// export default function RoleManagementPage() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [editingUserId, setEditingUserId] = useState<string | null>(null);
//   const [selectedRole, setSelectedRole] = useState<string>("");
//   const [updating, setUpdating] = useState(false);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch('/api/admin/roles');
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch users');
//       }
      
//       const data = await response.json();
//       setUsers(data.data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching users:', err);
//       setError('Failed to load users. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditRole = (user: User) => {
//     setEditingUserId(user.id);
//     setSelectedRole(user.role);
//   };

//   const handleCancelEdit = () => {
//     setEditingUserId(null);
//     setSelectedRole("");
//   };

//   const handleUpdateRole = async (userId: string) => {
//     try {
//       setUpdating(true);
      
//       const response = await fetch('/api/admin/roles', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           userId,
//           role: selectedRole
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update role');
//       }

//       const data = await response.json();
      
//       if (data.success) {
//         // Update the local state
//         setUsers(users.map(user => 
//           user.id === userId 
//             ? { ...user, role: selectedRole }
//             : user
//         ));
        
//         setEditingUserId(null);
//         setSelectedRole("");
//         alert('Role updated successfully!');
//       }

//     } catch (err) {
//       console.error('Error updating role:', err);
//       alert('Failed to update role. Please try again.');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container mx-auto p-6">
//         <div className="flex items-center justify-center min-h-[400px]">
//           <div className="text-center">
//             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
//             <p className="text-muted-foreground">Loading users...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <Shield className="h-8 w-8 text-blue-600" />
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
//           <p className="text-muted-foreground">
//             Manage user roles and permissions
//           </p>
//         </div>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircleIcon className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Users Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Users className="h-5 w-5" />
//             All Users ({users.length})
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left p-2 font-medium">User</th>
//                   <th className="text-left p-2 font-medium">Email</th>
//                   <th className="text-left p-2 font-medium">Current Role</th>
//                   <th className="text-left p-2 font-medium">Created</th>
//                   <th className="text-left p-2 font-medium">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((user) => (
//                   <tr key={user.id} className="border-b hover:bg-muted/50">
//                     <td className="p-2">
//                       <div>
//                         <div className="font-medium">{user.name || 'No Name'}</div>
//                         <div className="text-sm text-muted-foreground">ID: {user.id}</div>
//                       </div>
//                     </td>
//                     <td className="p-2">
//                       <div className="text-sm">{user.email}</div>
//                     </td>
//                     <td className="p-2">
//                       {editingUserId === user.id ? (
//                         <Select value={selectedRole} onValueChange={setSelectedRole}>
//                           <SelectTrigger className="w-48">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {ROLES.map((role) => (
//                               <SelectItem key={role} value={role}>
//                                 {role.replace('_', ' ')}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       ) : (
//                         <Badge className={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
//                           {user.role.replace('_', ' ')}
//                         </Badge>
//                       )}
//                     </td>
//                     <td className="p-2">
//                       <div className="text-sm text-muted-foreground">
//                         {format(new Date(user.created_at), "MMM dd, yyyy")}
//                       </div>
//                     </td>
//                     <td className="p-2">
//                       {editingUserId === user.id ? (
//                         <div className="flex items-center gap-2">
//                           <Button
//                             size="sm"
//                             onClick={() => handleUpdateRole(user.id)}
//                             disabled={updating || selectedRole === user.role}
//                           >
//                             {updating ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Check className="h-4 w-4" />
//                             )}
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={handleCancelEdit}
//                             disabled={updating}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       ) : (
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleEditRole(user)}
//                         >
//                           <Edit3 className="h-4 w-4 mr-1" />
//                           Edit Role
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Quick Actions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <Alert>
//               <Shield className="h-4 w-4" />
//               <AlertDescription>
//                 <strong>Role Permissions:</strong>
//                 <ul className="mt-2 space-y-1 text-sm">
//                   <li>• <strong>EVENT_MANAGER:</strong> Can create events, manage all sessions</li>
//                   <li>• <strong>ORGANIZER:</strong> Can create events, manage sessions under their events</li>
//                   <li>• <strong>FACULTY:</strong> Can view events, respond to session invitations</li>
//                   <li>• <strong>DELEGATE:</strong> Can register for events, view sessions</li>
//                 </ul>
//               </AlertDescription>
//             </Alert>
            
//             <div className="flex gap-2">
//               <Button onClick={fetchUsers} variant="outline">
//                 Refresh Users
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }