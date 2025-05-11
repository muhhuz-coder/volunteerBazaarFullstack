// src/components/volunteer-card.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { UserProfile } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, Clock, UserCheck, Eye, Ban, AlertTriangle, Loader2 } from 'lucide-react'; // Added Ban, AlertTriangle, Loader2
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ReportUserDialog } from '@/components/report-user-dialog'; // Import new dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VolunteerCardProps {
  volunteer: UserProfile;
  view?: 'grid' | 'list';
  currentUserId?: string; // ID of the logged-in user, to check block status
}

export function VolunteerCard({ volunteer, view = 'grid', currentUserId }: VolunteerCardProps) {
  const { user: loggedInUser, blockUser, reportUser } = useAuth();
  const { toast } = useToast();
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const getInitials = (name?: string | null): string => {
    if (!name) return 'V';
    const names = name.split(' ');
    if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
    if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : 'V';
  };

  const displayStats = {
    points: volunteer.stats?.points ?? 0,
    badges: volunteer.stats?.badges ?? [],
    hours: volunteer.stats?.hours ?? 0,
  };

  const isBlockedByCurrentUser = loggedInUser?.blockedUserIds?.includes(volunteer.id);

  const handleBlockUser = async () => {
    if (!loggedInUser) {
      toast({ title: "Login Required", description: "You need to be logged in to block users.", variant: "destructive" });
      return;
    }
    if (loggedInUser.id === volunteer.id) {
        toast({ title: "Action Not Allowed", description: "You cannot block yourself.", variant: "destructive"});
        return;
    }
    setIsBlocking(true);
    const result = await blockUser(volunteer.id);
    if (result.success) {
      toast({ title: "User Blocked", description: `${volunteer.displayName} has been blocked.` });
      // Optionally, trigger a refresh of the volunteer list if this card should disappear
    } else {
      toast({ title: "Error", description: result.message || "Failed to block user.", variant: "destructive" });
    }
    setIsBlocking(false);
  };

  const handleReportSubmit = async (reason: string, details?: string) => {
    if (!loggedInUser) {
        toast({title: "Login Required", description: "You must be logged in to report users.", variant: "destructive"});
        return false;
    }
    if (loggedInUser.id === volunteer.id) {
        toast({ title: "Action Not Allowed", description: "You cannot report yourself.", variant: "destructive"});
        return false;
    }
    setIsReporting(true);
    const result = await reportUser(volunteer.id, reason, details);
    if (result.success) {
        toast({title: "Report Submitted", description: "Thank you for your report. It will be reviewed."});
        setShowReportDialog(false);
        setIsReporting(false);
        return true;
    } else {
        toast({title: "Error", description: result.message || "Failed to submit report.", variant: "destructive"});
        setIsReporting(false);
        return false;
    }
  };

  // Do not render the card if the current user is the volunteer being displayed (avoid self-actions)
  // or if the volunteer is already blocked by the logged-in user (handled by parent list filtering ideally)
  // This specific check is for the buttons inside the card.
  // if (loggedInUser && loggedInUser.id === volunteer.id) return null;


  return (
    <>
      <Card className={cn(
        "flex group overflow-hidden transition-all duration-300 ease-in-out border",
        view === 'grid'
          ? "flex-col card-hover-effect min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] scroll-snap-align-start"
          : "flex-row items-start hover:shadow-lg bg-card w-full" 
      )}>
        <div className={cn(
          "relative flex-shrink-0 flex items-center justify-center",
          view === 'grid' ? 'h-40 w-full bg-muted/30' : 'h-full w-1/3 md:w-1/4 bg-muted/30 p-4'
        )}>
          <Avatar className={cn(
            "border-4 border-primary/10 shadow-md",
            view === 'grid' ? "h-24 w-24" : "h-28 w-28 md:h-32 md:w-32"
          )}>
            {volunteer.profilePictureUrl ? (
              <AvatarImage src={volunteer.profilePictureUrl} alt={volunteer.displayName} className="object-cover" />
            ) : (
              <AvatarFallback className={cn(
                "bg-primary/20 text-primary font-semibold",
                view === 'grid' ? "text-3xl" : "text-4xl"
              )}>
                {getInitials(volunteer.displayName)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className={cn("flex flex-col flex-grow p-4", view === 'list' ? 'w-2/3 md:w-1/2' : '')}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
              {volunteer.displayName}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground pt-0.5 line-clamp-1">
              Volunteer {isBlockedByCurrentUser && <Badge variant="destructive" className="ml-2">Blocked</Badge>}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-2 text-xs md:text-sm flex-grow mt-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <span>{displayStats.points} Points</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span>{displayStats.badges.length} Badge{displayStats.badges.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>{displayStats.hours} Hours Logged</span>
            </div>
            {displayStats.badges.length > 0 && view === 'grid' && (
              <div className="pt-2 line-clamp-2">
                {displayStats.badges.slice(0, 3).map((badge, index) => (
                  <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">{badge}</Badge>
                ))}
                {displayStats.badges.length > 3 && <span className="text-xs text-muted-foreground">...</span>}
              </div>
            )}
          </CardContent>

          {view === 'grid' && (
            <CardFooter className="p-0 pt-3 flex flex-wrap gap-2 justify-between items-center border-t mt-3">
              <Button asChild variant="link" size="sm" className="text-accent p-0 h-auto font-medium group-hover:underline">
                <span className="flex items-center gap-1 cursor-not-allowed opacity-50">
                  View Profile <Eye className="h-4 w-4" />
                </span>
              </Button>
              {loggedInUser && loggedInUser.id !== volunteer.id && (
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setShowReportDialog(true)} title="Report User">
                    <AlertTriangle className="h-4 w-4 text-destructive/80" />
                  </Button>
                  {!isBlockedByCurrentUser && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-7 w-7" disabled={isBlocking} title="Block User">
                          {isBlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Block {volunteer.displayName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will no longer see this volunteer's profile or activities, and they will not see yours. Are you sure?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBlockUser} className="bg-destructive hover:bg-destructive/90" disabled={isBlocking}>
                            {isBlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Block User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardFooter>
          )}
        </div>
        
        {view === 'list' && (
          <div className="w-full md:w-1/4 p-4 border-l flex-shrink-0 flex flex-col justify-between items-start space-y-3 bg-card/50 md:bg-transparent">
              <div>
                {displayStats.badges.length > 0 && (
                    <div className="text-xs">
                        <p className="font-medium text-muted-foreground mb-1">Top Badges</p>
                        <div className="flex flex-wrap gap-1">
                            {displayStats.badges.slice(0, 2).map((badge, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{badge}</Badge>
                            ))}
                            {displayStats.badges.length > 2 && <Badge variant="outline" className="text-xs">+{displayStats.badges.length-2} more</Badge>}
                        </div>
                    </div>
                )}
              </div>
              <div className="w-full mt-auto space-y-1.5">
                <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
                    <span className="flex items-center justify-center gap-1.5">
                        <UserCheck className="h-4 w-4" /> View Full Profile
                    </span>
                </Button>
                 {loggedInUser && loggedInUser.id !== volunteer.id && (
                   <>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowReportDialog(true)}>
                      <AlertTriangle className="h-4 w-4 mr-1.5 text-destructive/80" /> Report
                    </Button>
                    {!isBlockedByCurrentUser && (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full" disabled={isBlocking}>
                            {isBlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1.5" />} Block
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Block {volunteer.displayName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will no longer see this volunteer's profile or activities, and they will not see yours. Are you sure?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBlockUser} className="bg-destructive hover:bg-destructive/90" disabled={isBlocking}>
                               {isBlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Block User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                   </>
                 )}
              </div>
          </div>
        )}
      </Card>
      {loggedInUser && loggedInUser.id !== volunteer.id && (
        <ReportUserDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          reportedUser={volunteer}
          onSubmit={handleReportSubmit}
          isSubmitting={isReporting}
        />
      )}
    </>
  );
}
