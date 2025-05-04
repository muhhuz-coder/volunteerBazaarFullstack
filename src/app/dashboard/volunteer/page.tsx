// src/app/dashboard/volunteer/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileCheck, Heart, UserCog, MessageSquare, Star, Medal, Trophy } from 'lucide-react';
import { getApplicationsForVolunteer, type VolunteerApplication } from '@/services/job-board';
import { getLeaderboard, type LeaderboardEntry } from '@/services/gamification'; // Import gamification service
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'; // For potential progress bars


export default function VolunteerDashboard() {
  const { user, role, loading: authLoading, stats: userStats } = useAuth(); // Get user stats from context
  const router = useRouter();
  const { toast } = useToast();

  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);


  // Fetch applications for the volunteer
  const fetchApps = useCallback(async () => {
    if (user && role === 'volunteer') {
      setLoadingApps(true);
      try {
        const fetchedApps = await getApplicationsForVolunteer(user.id);
        setApplications(fetchedApps);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast({ title: 'Error', description: 'Could not load your applications.', variant: 'destructive' });
      } finally {
        setLoadingApps(false);
      }
    }
  }, [user, role, toast]);

  // Fetch leaderboard data
   const fetchLeaderboardData = useCallback(async () => {
     setLoadingLeaderboard(true);
     try {
       const data = await getLeaderboard();
       setLeaderboard(data);
     } catch (error) {
       console.error('Failed to fetch leaderboard:', error);
       toast({ title: 'Error', description: 'Could not load leaderboard.', variant: 'destructive' });
     } finally {
       setLoadingLeaderboard(false);
     }
   }, [toast]);


  useEffect(() => {
    if (!authLoading && (!user || role !== 'volunteer')) {
      console.log('Redirecting from volunteer dashboard: Not logged in or incorrect role.');
      router.push('/login');
    } else if (user && role === 'volunteer') {
      fetchApps();
      fetchLeaderboardData(); // Fetch leaderboard when volunteer logs in
    }
     console.log('Volunteer dashboard effect:', { authLoading, user, role });
  }, [user, role, authLoading, router, fetchApps, fetchLeaderboardData]);


  // Combined loading state check
  if (authLoading || (user && role === 'volunteer' && (loadingApps || loadingLeaderboard))) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <Skeleton className="h-8 w-64 mb-6" />
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <Skeleton key={`summary-${i}`} className="h-32 w-full" />)}
           </div>
           {/* Skeleton for Applications & Leaderboard Cards */}
            <div className="grid gap-6 md:grid-cols-2 mt-6">
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-64 w-full" />
            </div>
         </div>
          <footer className="bg-primary p-4 mt-auto">
           <Skeleton className="h-4 w-1/3 mx-auto" />
         </footer>
       </div>
    );
  }

  if (!user || role !== 'volunteer') {
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Verifying access or redirecting...</p>
         </div>
          <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
             <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
          </footer>
       </div>
     );
   }


  // Render the dashboard content
   console.log('Rendering volunteer dashboard for user:', user?.email, 'Stats:', user.stats);
   const points = user.stats?.points ?? 0;
   const badges = user.stats?.badges ?? [];
   const nextLevelPoints = 100; // Example: Points needed for next level/badge

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-primary">Volunteer Dashboard</h1>

        {/* Gamification & Summary Row */}
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
           {/* Points & Progress */}
           <Card className="shadow-md border">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Your Points</CardTitle>
                 <CardDescription>Earn points by participating!</CardDescription>
              </CardHeader>
              <CardContent>
                 <p className="text-3xl font-bold text-primary mb-2">{points}</p>
                 <Progress value={(points / nextLevelPoints) * 100} className="w-full h-2" />
                 <p className="text-xs text-muted-foreground mt-1">{points} / {nextLevelPoints} points to next level</p>
              </CardContent>
           </Card>

           {/* Badges */}
           <Card className="shadow-md border">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Medal className="h-5 w-5 text-orange-500" /> Earned Badges</CardTitle>
                 <CardDescription>Achievements unlocked.</CardDescription>
              </CardHeader>
              <CardContent>
                 {badges.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {badges.map((badge, index) => (
                       <Badge key={index} variant="secondary" className="text-xs">{badge}</Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-muted-foreground text-sm">No badges earned yet. Keep volunteering!</p>
                 )}
              </CardContent>
           </Card>

           {/* Profile Settings (Existing) */}
           <Card className="shadow-md border">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Profile Settings</CardTitle>
               <CardDescription>Update your profile and skills.</CardDescription>
             </CardHeader>
             <CardContent>
               <p>Keep your information up-to-date.</p>
               {/* TODO: Add link or button to profile page */}
             </CardContent>
           </Card>
         </div>


        <div className="grid gap-6 md:grid-cols-2">
          {/* My Applications Section */}
          <Card className="shadow-lg border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />My Applications</CardTitle>
              <CardDescription>Status of opportunities you've applied for.</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* Added scroll */}
                  {applications.map(app => (
                    <div key={app.id} className="flex justify-between items-center p-3 bg-card/80 rounded-md border">
                      <div>
                        <p className="font-medium">{app.opportunityTitle}</p>
                        <p className="text-sm text-muted-foreground">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={
                         app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'
                       } className="capitalize text-xs">
                         {app.status}
                       </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">You haven't applied to any opportunities yet.</p>
              )}
               <div className="mt-4 text-center">
                  <Button asChild variant="link">
                     <Link href="/">Browse Opportunities</Link>
                  </Button>
               </div>
            </CardContent>
          </Card>

          {/* Leaderboard Section */}
          <Card className="shadow-lg border">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-600" /> Leaderboard</CardTitle>
                 <CardDescription>See top contributing volunteers.</CardDescription>
              </CardHeader>
              <CardContent>
                 {leaderboard.length > 0 ? (
                   <ol className="space-y-3">
                     {leaderboard.slice(0, 5).map((entry, index) => ( // Show top 5
                       <li key={entry.userId} className="flex justify-between items-center p-2 bg-card/80 rounded-md border text-sm">
                         <span className="flex items-center gap-2">
                            <span className="font-semibold w-6 text-center">{index + 1}.</span>
                            {entry.userName} {entry.userId === user.id ? '(You)' : ''}
                         </span>
                         <Badge variant="outline">{entry.points} pts</Badge>
                       </li>
                     ))}
                   </ol>
                 ) : (
                   <p className="text-muted-foreground text-center py-4">Leaderboard data is currently unavailable.</p>
                 )}
                 {/* TODO: Add link to full leaderboard page */}
              </CardContent>
           </Card>
        </div>

         {/* Messaging Link */}
         <div className="mt-6 text-center">
            <Button asChild variant="outline">
               <Link href="/dashboard/messages">
                 <MessageSquare className="mr-2 h-4 w-4" /> View My Messages
               </Link>
            </Button>
         </div>

      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}
