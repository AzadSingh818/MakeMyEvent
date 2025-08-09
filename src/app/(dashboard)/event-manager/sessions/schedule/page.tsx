// src/app/(dashboard)/event-manager/sessions/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  DownloadIcon,
  PrinterIcon,
  SettingsIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshCwIcon,
  FilterIcon,
  ViewIcon,
  ArrowLeftIcon,
  ShareIcon,
  SaveIcon,
  UndoIcon,
  RedoIcon,
  CopyIcon,
  AlertTriangleIcon
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
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Switch,
  Label,
  Input,
  Slider,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/use-events';
import { useSessionsByEvent } from '@/hooks/use-sessions';
import { ScheduleBuilder } from '@/components/sessions/schedule-builder';
import { SessionForm } from '@/components/sessions/session-form';

// Types
interface ScheduleSettings {
  timeRange: { start: number; end: number };
  timeSlotDuration: number; // in minutes
  showWeekends: boolean;
  compactView: boolean;
  showConflicts: boolean;
  autoRefresh: boolean;
  theme: 'light' | 'dark' | 'compact';
}

interface Hall {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
}

const DEFAULT_SETTINGS: ScheduleSettings = {
  timeRange: { start: 8, end: 18 },
  timeSlotDuration: 30,
  showWeekends: false,
  compactView: false,
  showConflicts: true,
  autoRefresh: true,
  theme: 'light'
};

export default function SessionsSchedulePage() {
  const router = useRouter();
  
  // State
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'timeline'>('day');
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedHalls, setSelectedHalls] = useState<string[]>([]);
  const [scheduleConflicts, setScheduleConflicts] = useState<any[]>([]);

  // Hooks
  const { data: eventsData } = useEvents({ limit: 100 });
  const events = eventsData?.data?.events || [];

  const { data: sessionsData, isLoading, refetch } = useSessionsByEvent(selectedEvent, {
    date: format(selectedDate, 'yyyy-MM-dd')
  });

  const sessions = sessionsData?.data?.sessions || [];

  // Get halls from sessions
  const halls: Hall[] = [];
  const hallMap = new Map();
  sessions.forEach(session => {
    if (session.hall && !hallMap.has(session.hall.id)) {
      hallMap.set(session.hall.id, session.hall);
      halls.push(session.hall);
    }
  });

  // Initialize selected halls
  useEffect(() => {
    if (halls.length > 0 && selectedHalls.length === 0) {
      setSelectedHalls(halls.map(h => h.id));
    }
  }, [halls]);

  // Auto-refresh functionality
  useEffect(() => {
    if (settings.autoRefresh && selectedEvent) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, selectedEvent, refetch]);

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewType === 'day') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
    } else if (viewType === 'week') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 7) : subDays(selectedDate, 7));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleCreateSession = () => {
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleExportSchedule = (format: 'pdf' | 'excel' | 'image') => {
    // Implementation for export functionality
    console.log(`Exporting schedule as ${format}`);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  const updateSettings = (newSettings: Partial<ScheduleSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Get date range for display
  const getDateRange = () => {
    if (viewType === 'week') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return { start, end, days: eachDayOfInterval({ start, end }) };
    }
    return { start: selectedDate, end: selectedDate, days: [selectedDate] };
  };

  const dateRange = getDateRange();

  // Settings Dialog Component
  const SettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Start Time</Label>
                <Select 
                  value={settings.timeRange.start.toString()} 
                  onValueChange={(value) => updateSettings({
                    timeRange: { ...settings.timeRange, start: parseInt(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">End Time</Label>
                <Select 
                  value={settings.timeRange.end.toString()} 
                  onValueChange={(value) => updateSettings({
                    timeRange: { ...settings.timeRange, end: parseInt(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Time Slot Duration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Slot Duration</Label>
            <Select 
              value={settings.timeSlotDuration.toString()} 
              onValueChange={(value) => updateSettings({ timeSlotDuration: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <Select 
              value={settings.theme} 
              onValueChange={(value: any) => updateSettings({ theme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Weekends</Label>
              <Switch
                checked={settings.showWeekends}
                onCheckedChange={(checked) => updateSettings({ showWeekends: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Compact View</Label>
              <Switch
                checked={settings.compactView}
                onCheckedChange={(checked) => updateSettings({ compactView: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Conflicts</Label>
              <Switch
                checked={settings.showConflicts}
                onCheckedChange={(checked) => updateSettings({ showConflicts: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto Refresh</Label>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSettings({ autoRefresh: checked })}
              />
            </div>
          </div>

          {/* Zoom Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Zoom Level: {zoomLevel}%</Label>
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => setZoomLevel(value[0])}
              min={50}
              max={200}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="text-xl font-semibold">Schedule Builder</h1>
                <p className="text-sm text-gray-600">
                  {selectedEvent ? 'Manage session scheduling' : 'Select an event to start'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">{zoomLevel}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  disabled={zoomLevel >= 200}
                >
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Export Options */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExportSchedule('pdf')}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExportSchedule('excel')}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export as Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExportSchedule('image')}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export as Image
                    </Button>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handlePrintSchedule}
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print Schedule
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <Button
                size="sm"
                onClick={handleCreateSession}
                disabled={!selectedEvent}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Event Selector */}
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEvent && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  
                  {/* View Type Selector */}
                  <Tabs value={viewType} onValueChange={(value: any) => setViewType(value)}>
                    <TabsList>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </>
              )}
            </div>

            {selectedEvent && (
              <div className="flex items-center gap-3">
                {/* Date Navigation */}
                <div className="flex items-center gap-2 border rounded px-3 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="font-medium">
                        {viewType === 'week' ? (
                          `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`
                        ) : (
                          format(selectedDate, 'EEEE, MMM dd, yyyy')
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCwIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {selectedEvent ? (
            <div 
              className="h-full"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
            >
              {/* Conflicts Alert */}
              {scheduleConflicts.length > 0 && settings.showConflicts && (
                <Alert className="m-4 border-orange-200 bg-orange-50">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Schedule Conflicts Detected:</strong> {scheduleConflicts.length} overlapping sessions found.
                    <Button variant="link" size="sm" className="p-0 ml-2">
                      View Details
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 h-full">
                <ScheduleBuilder
                  eventId={selectedEvent}
                  halls={halls.filter(hall => selectedHalls.includes(hall.id))}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  className="h-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="w-96">
                <CardHeader className="text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <CardTitle>No Event Selected</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">
                    Select an event from the dropdown above to start building your schedule.
                  </p>
                  {events.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No events available. Create an event first.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        <SettingsDialog />

        {/* Session Form Dialog */}
        <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>
            <SessionForm
              eventId={selectedEvent}
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
      </div>
    </TooltipProvider>
  );
}