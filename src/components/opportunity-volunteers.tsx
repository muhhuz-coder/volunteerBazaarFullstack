'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Star, Award, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVolunteersForOpportunityAction } from '@/actions/job-board-actions';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerApplication } from '@/services/job-board';

interface OpportunityVolunteersProps {
  opportunityId: string;
}

export function OpportunityVolunteers({ opportunityId }: OpportunityVolunteersProps) {
  const [volunteers, setVolunteers] = useState<{application: VolunteerApplication; volunteer: UserProfile}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVolunteers() {
      try {
        setLoading(true);
        setError(null);
        const result = await getVolunteersForOpportunityAction(opportunityId);
        if (result.success && result.volunteers) {
          setVolunteers(result.volunteers);
        } else {
          setError(result.message || 'Failed to load volunteers');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadVolunteers();
  }, [opportunityId]);

  // Helper function to get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return 'V';
    const names = name.split(' ');
    if (names.length === 1) return name.charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Filter volunteers by status
  const acceptedVolunteers = volunteers.filter(v => v.application.status === 'accepted' || v.application.status === 'completed');
  const pendingVolunteers = volunteers.filter(v => v.application.status === 'submitted');
  const rejectedVolunteers = volunteers.filter(v => v.application.status === 'rejected' || v.application.status === 'withdrawn');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> 
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> Error Loading Volunteers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (volunteers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Volunteers
          </CardTitle>
          <CardDescription>No one has applied to this opportunity yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Volunteers
        </CardTitle>
        <CardDescription>{volunteers.length} people have applied to this opportunity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {acceptedVolunteers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Accepted ({acceptedVolunteers.length})</h3>
            <div className="space-y-3">
              {acceptedVolunteers.map(({ volunteer, application }) => (
                <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-card/80 rounded-md border">
                  <Avatar className="h-10 w-10 border border-primary/10">
                    {volunteer.profilePictureUrl ? (
                      <AvatarImage src={volunteer.profilePictureUrl} alt={volunteer.displayName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(volunteer.displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{volunteer.displayName}</h4>
                      <Badge variant={application.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                        {application.status === 'completed' ? 'Completed' : 'Accepted'}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" /> {volunteer.stats?.points || 0} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-orange-500" /> {volunteer.stats?.badges?.length || 0} badges
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" /> {volunteer.stats?.hours || 0} hrs
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingVolunteers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Pending ({pendingVolunteers.length})</h3>
            <div className="space-y-3">
              {pendingVolunteers.map(({ volunteer, application }) => (
                <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-card/80 rounded-md border">
                  <Avatar className="h-10 w-10 border border-primary/10">
                    {volunteer.profilePictureUrl ? (
                      <AvatarImage src={volunteer.profilePictureUrl} alt={volunteer.displayName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(volunteer.displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{volunteer.displayName}</h4>
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" /> {volunteer.stats?.points || 0} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-orange-500" /> {volunteer.stats?.badges?.length || 0} badges
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" /> {volunteer.stats?.hours || 0} hrs
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rejectedVolunteers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Rejected/Withdrawn ({rejectedVolunteers.length})</h3>
            <div className="space-y-3">
              {rejectedVolunteers.map(({ volunteer, application }) => (
                <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-card/80 rounded-md border border-muted">
                  <Avatar className="h-10 w-10 border border-primary/10">
                    {volunteer.profilePictureUrl ? (
                      <AvatarImage src={volunteer.profilePictureUrl} alt={volunteer.displayName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(volunteer.displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{volunteer.displayName}</h4>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {application.status === 'withdrawn' ? 'Withdrawn' : 'Rejected'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 