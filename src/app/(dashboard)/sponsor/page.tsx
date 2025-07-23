// src/app/(dashboard)/sponsor/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { SponsorLayout } from '@/components/dashboard/layout';

import { useEvents } from '@/hooks/use-events';
import { useSponsorshipPackages, useMySponsorships, useSponsorshipVisibility } from '@/hooks/use-sponsorships';
import { useAuth } from '@/hooks/use-auth';

import { 
  Building, 
  BarChart3, 
  Eye, 
  TrendingUp,
  Calendar,
  Users,
  Download,
  ExternalLink,
  Star,
  Award,
  FileText,
  Globe,
  Camera,
  Share2,
  Target,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function SponsorDashboardPage() {
  const { user } = useAuth();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Data fetching hooks
  const { data: availableEvents, isLoading: eventsLoading } = useEvents({ 
    status: 'PUBLISHED',
    limit: 10,
    sortBy: 'startDate',
    sortOrder: 'asc'
  });
  
  const { data: sponsorshipPackages, isLoading: packagesLoading } = useSponsorshipPackages();
  const { data: mySponsorships, isLoading: sponsorshipsLoading } = useMySponsorships();
  const { data: visibilityData, isLoading: visibilityLoading } = useSponsorshipVisibility();

  // Calculate stats
  const activeSponsorships = mySponsorships?.data?.sponsorships?.filter(s => s.status === 'ACTIVE') || [];
  const totalInvestment = activeSponsorships.reduce((sum, s) => sum + (s.package?.price || 0), 0);
  const totalReach = visibilityData?.data?.totalReach || 0;
  const engagementRate = visibilityData?.data?.engagementRate || 0;
  const brandMentions = visibilityData?.data?.brandMentions || 0;

  // Upcoming events for potential sponsorship
  const upcomingEvents = availableEvents?.data?.events?.filter(event => 
    new Date(event.startDate) > new Date() &&
    !activeSponsorships.some(s => s.eventId === event.id)
  ) || [];

  if (eventsLoading) {
    return (
      <SponsorLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </SponsorLayout>
    );
  }

  return (
    <SponsorLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user?.institution || user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Monitor your sponsorship performance and explore new opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <Target className="h-4 w-4 mr-2" />
              New Sponsorship
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Active Sponsorships Alert */}
        {activeSponsorships.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You have {activeSponsorships.length} active sponsorship{activeSponsorships.length > 1 ? 's' : ''} running. 
              Track their performance in the sections below.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sponsorships</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sponsorshipsLoading ? <LoadingSpinner size="sm" /> : activeSponsorships.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Events sponsored this year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sponsorshipsLoading ? <LoadingSpinner size="sm" /> : `₹${totalInvestment.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all sponsorships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brand Reach</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visibilityLoading ? <LoadingSpinner size="sm" /> : `${totalReach.toLocaleString()}+`}
              </div>
              <p className="text-xs text-muted-foreground">
                Total impressions this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visibilityLoading ? <LoadingSpinner size="sm" /> : `${engagementRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Average across events
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Sponsorships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Active Sponsorships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sponsorshipsLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : activeSponsorships.length > 0 ? (
                <div className="space-y-4">
                  {activeSponsorships.slice(0, 3).map((sponsorship) => {
                    const isOngoing = new Date(sponsorship.event.startDate) <= new Date() && 
                                     new Date(sponsorship.event.endDate) >= new Date();
                    
                    return (
                      <div key={sponsorship.id} className={`p-4 rounded-lg border transition-colors ${
                        isOngoing ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{sponsorship.event.name}</h5>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(sponsorship.event.startDate), 'MMM dd, yyyy')}
                              <Badge variant={sponsorship.package.tier} className="ml-2 text-xs">
                                {sponsorship.package.name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isOngoing && (
                              <Badge variant="default" className="text-xs">
                                Live
                              </Badge>
                            )}
                            <Button size="sm" variant="outline">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {activeSponsorships.length > 3 && (
                    <Button variant="ghost" className="w-full">
                      View All {activeSponsorships.length} Sponsorships
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active sponsorships</p>
                  <Button className="mt-3" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Explore Opportunities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sponsorship Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                New Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 3).map((event) => {
                    const daysUntilEvent = Math.ceil(
                      (new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div key={event.id} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{event.name}</h5>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(event.startDate), 'MMM dd, yyyy')}
                              <Users className="h-3 w-3 ml-2 mr-1" />
                              {event.expectedAttendees || 'TBD'} attendees
                            </div>
                            {daysUntilEvent <= 30 && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Only {daysUntilEvent} days left
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            <Button size="sm">
                              <Target className="h-3 w-3 mr-1" />
                              Sponsor
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <Button variant="ghost" className="w-full">
                    View All {upcomingEvents.length} Opportunities
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No new opportunities available</p>
                  <p className="text-sm">Check back later for new events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Overview
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Detailed Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Brand Visibility */}
              <div className="space-y-2">
                <h5 className="font-medium flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Brand Visibility
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Logo Impressions</span>
                    <span className="font-medium">{totalReach.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Brand Mentions</span>
                    <span className="font-medium">{brandMentions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Social Media Reach</span>
                    <span className="font-medium">{(totalReach * 0.3).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="space-y-2">
                <h5 className="font-medium flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Engagement
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Click-through Rate</span>
                    <span className="font-medium">{engagementRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lead Generation</span>
                    <span className="font-medium">{Math.round(totalReach * 0.02)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Booth Visits</span>
                    <span className="font-medium">{Math.round(totalReach * 0.05)}</span>
                  </div>
                </div>
              </div>

              {/* ROI Analysis */}
              <div className="space-y-2">
                <h5 className="font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  ROI Analysis
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost per Impression</span>
                    <span className="font-medium">₹{totalReach > 0 ? (totalInvestment / totalReach).toFixed(2) : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated ROI</span>
                    <span className="font-medium text-green-600">+{engagementRate * 2}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Brand Value</span>
                    <span className="font-medium">₹{(totalInvestment * 1.5).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto p-4 flex flex-col items-center space-y-2">
                <Target className="h-6 w-6" />
                <span>New Sponsorship</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Download className="h-6 w-6" />
                <span>Download Reports</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <FileText className="h-6 w-6" />
                <span>Contracts</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SponsorLayout>
  );
}