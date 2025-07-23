// src/app/(dashboard)/event-manager/faculty/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  useFaculty, 
  useFacultyStats, 
  useSendInvitations, 
  useBulkUpdateFaculty,
  useUpdateFaculty 
} from '@/hooks/use-faculty';
import { useEvents } from '@/hooks/use-events';
import { useAuth } from '@/hooks/use-auth';

import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Send,
  Star,
  BarChart3,
  Target,
  Activity,
  MessageSquare,
  Globe,
  BookOpen,
  Briefcase,
  FileText,
  Settings,
  Plus,
  Zap,
  TrendingUp,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function EventManagerFacultyPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Data fetching
  const { data: events } = useEvents({ limit: 50 });
  const { data: facultyData, isLoading: facultyLoading } = useFaculty({
    eventId: selectedEvent || undefined,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    institution: institutionFilter || undefined,
    page,
    limit: 12
  });
  const { data: facultyStats, isLoading: statsLoading } = useFacultyStats(selectedEvent || undefined);

  // Mutations
  const sendInvitations = useSendInvitations();
  const bulkUpdate = useBulkUpdateFaculty();

  // Computed values
  const faculty = facultyData?.data?.faculty || [];
  const pagination = facultyData?.data?.pagination;
  const stats = facultyStats?.data;

  // Filter and search functionality
  const filteredFaculty = useMemo(() => {
    return faculty.filter(member => {
      const matchesSearch = !searchTerm || 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.institution?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [faculty, searchTerm]);

  // Get unique institutions for filter
  const institutions = useMemo(() => {
    const allInstitutions = faculty.map(f => f.institution).filter(Boolean);
    return Array.from(new Set(allInstitutions));
  }, [faculty]);

  // Handle bulk actions
  const handleBulkInvite = () => {
    router.push('/event-manager/faculty/invite');
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedFaculty.length > 0) {
      bulkUpdate.mutate({
        facultyIds: selectedFaculty,
        updates: { status },
        eventId: selectedEvent
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedFaculty.length === filteredFaculty.length) {
      setSelectedFaculty([]);
    } else {
      setSelectedFaculty(filteredFaculty.map(f => f.id));
    }
  };

  const handleSelectFaculty = (facultyId: string) => {
    setSelectedFaculty(prev => 
      prev.includes(facultyId) 
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'INVITED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SPEAKER': return 'bg-purple-100 text-purple-800';
      case 'MODERATOR': return 'bg-blue-100 text-blue-800';
      case 'CHAIRPERSON': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (facultyLoading && page === 1) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
            <p className="text-muted-foreground">
              Manage faculty members, invitations, and speaking assignments
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.push('/event-manager/faculty/invite')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Faculty
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <LoadingSpinner size="sm" /> : stats?.totalFaculty || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.confirmedFaculty || 0} confirmed, {stats?.pendingFaculty || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <LoadingSpinner size="sm" /> : `${stats?.responseRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Faculty invitation responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <LoadingSpinner size="sm" /> : stats?.totalSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                With assigned speakers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Institutions</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {institutions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Represented organizations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - ✅ FIXED: Select components with proper values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Event Filter - ✅ FIXED: No empty string values */}
              <Select value={selectedEvent || "all"} onValueChange={(value) => setSelectedEvent(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events?.data?.events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter - ✅ FIXED: No empty string values */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="INVITED">Invited</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter - ✅ FIXED: No empty string values */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SPEAKER">Speaker</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
                </SelectContent>
              </Select>

              {/* Institution Filter */}
              <Input
                placeholder="Institution..."
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
              />
            </div>

            {/* Bulk Actions */}
            {selectedFaculty.length > 0 && (
              <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  {selectedFaculty.length} faculty selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handleBulkInvite}>
                    <Mail className="h-3 w-3 mr-1" />
                    Send Invites
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('ACTIVE')}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedFaculty([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faculty List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Faculty Directory ({pagination?.total || 0})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  <UserCheck className="h-3 w-3 mr-1" />
                  {selectedFaculty.length === filteredFaculty.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {facultyLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredFaculty.length > 0 ? (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedFaculty.length === filteredFaculty.length && filteredFaculty.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-3">Faculty</div>
                  <div className="col-span-2">Institution</div>
                  <div className="col-span-2">Role & Status</div>
                  <div className="col-span-2">Sessions</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Faculty Cards/Rows */}
                <div className="space-y-2">
                  {filteredFaculty.map((member) => {
                    const isSelected = selectedFaculty.includes(member.id);
                    const sessionCount = member.sessionSpeakers?.length || 0;
                    const userEventStatus = member.userEvents?.[0]?.status || 'PENDING';
                    
                    return (
                      <div
                        key={member.id}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Selection Checkbox (Desktop) */}
                        <div className="hidden md:flex col-span-1 items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectFaculty(member.id)}
                            className="rounded border-gray-300"
                          />
                        </div>

                        {/* Faculty Info */}
                        <div className="col-span-1 md:col-span-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.profileImage} />
                              <AvatarFallback>
                                {member.name?.charAt(0) || 'F'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium truncate">{member.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                              {member.designation && (
                                <p className="text-xs text-muted-foreground">{member.designation}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Institution */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="flex items-center text-sm">
                            <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate">{member.institution || 'Not specified'}</span>
                          </div>
                          {member.specialization && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {member.specialization}
                            </p>
                          )}
                        </div>

                        {/* Role & Status */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="space-y-1">
                            <Badge className={getRoleColor(member.role)} variant="outline">
                              {member.role}
                            </Badge>
                            <Badge className={getStatusColor(userEventStatus)} variant="outline">
                              {userEventStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Sessions */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
                          </div>
                          {member.sessionSpeakers && member.sessionSpeakers.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Latest: {member.sessionSpeakers[0].session.title}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/event-manager/faculty/${member.id}`)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/event-manager/faculty/${member.id}/edit`)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile Selection */}
                        <div className="md:hidden">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectFaculty(member.id)}
                            className="rounded border-gray-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * (pagination.limit || 12)) + 1} to {Math.min(page * (pagination.limit || 12), pagination.total)} of {pagination.total} faculty
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No faculty found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || institutionFilter
                    ? 'Try adjusting your filters or search term'
                    : 'Start by inviting faculty members to your events'
                  }
                </p>
                <div className="flex justify-center space-x-2">
                  <Button onClick={() => router.push('/event-manager/faculty/invite')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Faculty
                  </Button>
                  {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || institutionFilter) && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setRoleFilter('all');
                        setInstitutionFilter('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EventManagerLayout>
  );
}