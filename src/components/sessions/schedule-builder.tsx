// src/components/sessions/schedule-builder.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addHours, startOfDay, endOfDay, addDays, isSameDay, isWithinInterval } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  MoveIcon,
  AlertTriangleIcon,
  FilterIcon,
  ViewIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ScrollArea,
  Separator,
  Input,
  Switch,
  Label,
  Alert,
  AlertDescription
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSessionsByEvent, useDeleteSession, useBulkUpdateSessions } from '@/hooks/use-sessions';
import { SessionForm } from './session-form';

// Types
interface Hall {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
}

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  sessionType: string;
  hallId?: string;
  speakers: Array<{
    user: { name: string; institution?: string };
    role: string;
  }>;
  maxParticipants?: number;
  isBreak?: boolean;
  _count: {
    attendanceRecords: number;
  };
}

interface ScheduleBuilderProps {
  eventId: string;
  halls: Hall[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

// Constants
const SESSION_TYPE_COLORS = {
  KEYNOTE: 'bg-purple-100 border-purple-300 text-purple-800',
  PRESENTATION: 'bg-blue-100 border-blue-300 text-blue-800',
  PANEL: 'bg-green-100 border-green-300 text-green-800',
  WORKSHOP: 'bg-orange-100 border-orange-300 text-orange-800',
  POSTER: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  BREAK: 'bg-gray-100 border-gray-300 text-gray-600'
};

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return {
    hour,
    minute,
    label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  };
});

const VIEW_MODES = [
  { value: 'timeline', label: 'Timeline View', icon: ClockIcon },
  { value: 'grid', label: 'Grid View', icon: ViewIcon },
  { value: 'list', label: 'List View', icon: FilterIcon }
];

export function ScheduleBuilder({
  eventId,
  halls,
  selectedDate,
  onDateChange,
  className
}: ScheduleBuilderProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'list'>('timeline');
  const [selectedHalls, setSelectedHalls] = useState<string[]>(halls.map(h => h.id));
  const [timeRange, setTimeRange] = useState({ start: 8, end: 18 }); // 8 AM to 6 PM
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [draggedSession, setDraggedSession] = useState<Session | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Hooks
  const { data: sessionsData, isLoading, refetch } = useSessionsByEvent(eventId, {
    date: format(selectedDate, 'yyyy-MM-dd')
  });
  const deleteSession = useDeleteSession();
  const bulkUpdateSessions = useBulkUpdateSessions();

  const sessions = sessionsData?.data?.sessions || [];

  // Filter sessions based on selected halls and filters
  const filteredSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      // Hall filter
      if (session.hallId && !selectedHalls.includes(session.hallId)) {
        return false;
      }
      
      // Search filter
      if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType && session.sessionType !== filterType) {
        return false;
      }
      
      return true;
    });

    return filtered;
  }, [sessions, selectedHalls, searchQuery, filterType]);

  // Calculate time slots for display
  const displayTimeSlots = useMemo(() => {
    return TIME_SLOTS.filter(slot => 
      slot.hour >= timeRange.start && slot.hour <= timeRange.end
    );
  }, [timeRange]);

  // Get sessions for a specific hall and time slot
  const getSessionsForSlot = (hallId: string, hour: number, minute: number) => {
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, minute, 0, 0);
    
    return filteredSessions.filter(session => {
      if (session.hallId !== hallId) return false;
      
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      
      return slotTime >= startTime && slotTime < endTime;
    });
  };

  // Calculate session position and height
  const getSessionStyle = (session: Session) => {
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const duration = endMinutes - startMinutes;
    
    const topOffset = ((startMinutes - (timeRange.start * 60)) / 30) * 40; // 40px per 30min slot
    const height = (duration / 30) * 40;
    
    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      minHeight: '40px'
    };
  };

  // Handle session creation
  const handleCreateSession = (hallId?: string, timeSlot?: TimeSlot) => {
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  // Handle session editing
  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession.mutateAsync(sessionId);
        refetch();
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  // Handle bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedSessions.length === 0) return;

    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedSessions.length} selected sessions?`)) {
          // Implementation for bulk delete
        }
        break;
      case 'move':
        // Implementation for bulk move
        break;
      case 'duplicate':
        // Implementation for bulk duplicate
        break;
    }
    
    setSelectedSessions([]);
  };

  // Timeline View Component
  const TimelineView = () => (
    <div className="flex border rounded-lg overflow-hidden">
      {/* Time column */}
      <div className="w-20 bg-gray-50 border-r">
        <div className="h-12 border-b bg-gray-100 flex items-center justify-center text-sm font-medium">
          Time
        </div>
        {displayTimeSlots.map((slot) => (
          <div
            key={`${slot.hour}-${slot.minute}`}
            className="h-10 border-b flex items-center justify-center text-xs text-gray-600"
          >
            {slot.label}
          </div>
        ))}
      </div>

      {/* Halls columns */}
      <div className="flex-1 flex">
        {halls.filter(hall => selectedHalls.includes(hall.id)).map((hall) => (
          <div key={hall.id} className="flex-1 border-r last:border-r-0 relative">
            {/* Hall header */}
            <div className="h-12 border-b bg-gray-50 p-2">
              <div className="text-sm font-medium truncate">{hall.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {hall.location} • Cap: {hall.capacity}
              </div>
            </div>

            {/* Time slots */}
            <div className="relative" style={{ height: `${displayTimeSlots.length * 40}px` }}>
              {displayTimeSlots.map((slot, index) => (
                <div
                  key={`${hall.id}-${slot.hour}-${slot.minute}`}
                  className="absolute w-full h-10 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group"
                  style={{ top: `${index * 40}px` }}
                  onClick={() => handleCreateSession(hall.id, slot)}
                >
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
                    <PlusIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}

              {/* Sessions */}
              {filteredSessions
                .filter(session => session.hallId === hall.id)
                .map((session) => {
                  const style = getSessionStyle(session);
                  const typeColor = SESSION_TYPE_COLORS[session.sessionType as keyof typeof SESSION_TYPE_COLORS];
                  
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        'absolute left-1 right-1 rounded border-2 p-1 cursor-pointer shadow-sm hover:shadow-md transition-shadow',
                        typeColor,
                        selectedSessions.includes(session.id) && 'ring-2 ring-blue-500'
                      )}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.ctrlKey || e.metaKey) {
                          setSelectedSessions(prev => 
                            prev.includes(session.id) 
                              ? prev.filter(id => id !== session.id)
                              : [...prev, session.id]
                          );
                        } else {
                          setSelectedSessions([session.id]);
                        }
                      }}
                      onDoubleClick={() => handleEditSession(session)}
                    >
                      <div className="text-xs font-medium truncate">
                        {session.title}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                      </div>
                      {session.speakers.length > 0 && (
                        <div className="text-xs opacity-75 truncate">
                          {session.speakers[0].user.name}
                          {session.speakers.length > 1 && ` +${session.speakers.length - 1}`}
                        </div>
                      )}

                      {/* Quick actions */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredSessions.map((session) => {
        const typeColor = SESSION_TYPE_COLORS[session.sessionType as keyof typeof SESSION_TYPE_COLORS];
        const hall = halls.find(h => h.id === session.hallId);
        
        return (
          <Card
            key={session.id}
            className={cn(
              'cursor-pointer hover:shadow-md transition-shadow',
              selectedSessions.includes(session.id) && 'ring-2 ring-blue-500'
            )}
            onClick={() => {
              setSelectedSessions(prev => 
                prev.includes(session.id) 
                  ? prev.filter(id => id !== session.id)
                  : [...prev, session.id]
              );
            }}
            onDoubleClick={() => handleEditSession(session)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm">{session.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn('text-xs', typeColor)}>
                      {session.sessionType}
                    </Badge>
                    {session.isBreak && (
                      <Badge variant="outline" className="text-xs">Break</Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditSession(session)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                  </span>
                </div>
                
                {hall && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>{hall.name}</span>
                  </div>
                )}
                
                {session.speakers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {session.speakers.map(s => s.user.name).join(', ')}
                    </span>
                  </div>
                )}

                {session._count.attendanceRecords > 0 && (
                  <div className="text-xs text-green-600">
                    {session._count.attendanceRecords} attendees
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="space-y-2">
      {filteredSessions.map((session) => {
        const typeColor = SESSION_TYPE_COLORS[session.sessionType as keyof typeof SESSION_TYPE_COLORS];
        const hall = halls.find(h => h.id === session.hallId);
        
        return (
          <div
            key={session.id}
            className={cn(
              'flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-gray-50',
              selectedSessions.includes(session.id) && 'bg-blue-50 border-blue-200'
            )}
            onClick={() => {
              setSelectedSessions(prev => 
                prev.includes(session.id) 
                  ? prev.filter(id => id !== session.id)
                  : [...prev, session.id]
              );
            }}
            onDoubleClick={() => handleEditSession(session)}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSessions.includes(session.id)}
                onChange={() => {}}
                className="rounded"
              />
              <Badge className={cn('text-xs', typeColor)}>
                {session.sessionType}
              </Badge>
            </div>

            <div className="flex-1">
              <div className="font-medium">{session.title}</div>
              <div className="text-sm text-gray-600">
                {session.description?.substring(0, 100)}...
              </div>
            </div>

            <div className="text-sm text-gray-600 min-w-[120px]">
              {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
            </div>

            <div className="text-sm text-gray-600 min-w-[100px]">
              {hall?.name || 'No hall'}
            </div>

            <div className="text-sm text-gray-600 min-w-[150px] truncate">
              {session.speakers.map(s => s.user.name).join(', ') || 'No speakers'}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditSession(session)}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-red-600"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Schedule Builder
              <Badge variant="outline">{format(selectedDate, 'MMM dd, yyyy')}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {mode.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Filters */}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label>Search Sessions</Label>
                      <Input
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Session Type</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          {Object.keys(SESSION_TYPE_COLORS).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Halls</Label>
                      <div className="space-y-2 mt-2">
                        {halls.map((hall) => (
                          <div key={hall.id} className="flex items-center space-x-2">
                            <Switch
                              id={hall.id}
                              checked={selectedHalls.includes(hall.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedHalls([...selectedHalls, hall.id]);
                                } else {
                                  setSelectedHalls(selectedHalls.filter(id => id !== hall.id));
                                }
                              }}
                            />
                            <Label htmlFor={hall.id} className="text-sm">
                              {hall.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Actions */}
              <Button
                onClick={() => handleCreateSession()}
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Session
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSessions.length > 0 && (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedSessions.length} session(s) selected</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('move')}
                  >
                    <MoveIcon className="h-4 w-4 mr-1" />
                    Move
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('duplicate')}
                  >
                    <CopyIcon className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <ScrollArea className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading schedule...</div>
              </div>
            ) : (
              <>
                {viewMode === 'timeline' && <TimelineView />}
                {viewMode === 'grid' && <GridView />}
                {viewMode === 'list' && <ListView />}
              </>
            )}
          </ScrollArea>
        </CardContent>

        {/* Session Form Dialog */}
        <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedSession ? 'Edit Session' : 'Create New Session'}
              </DialogTitle>
            </DialogHeader>
            <SessionForm
              eventId={eventId}
              session={selectedSession}
              halls={halls}
              onSuccess={(session) => {
                setShowSessionForm(false);
                setSelectedSession(null);
                refetch();
              }}
              onCancel={() => {
                setShowSessionForm(false);
                setSelectedSession(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}