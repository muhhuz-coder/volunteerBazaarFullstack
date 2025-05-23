// src/app/dashboard/organization/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, AlertCircle, Users, FileText, Check, X, MessageSquare, Loader2, Briefcase, Settings, Download, Edit3, Trash2, Edit, UserSearch, Pencil } from 'lucide-react'; 
import type { Opportunity, VolunteerApplication } from '@/services/job-board'; 
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getOpportunitiesAction, getApplicationsForOrganizationAction, deleteOpportunityAction } from '@/actions/job-board-actions';
import { acceptVolunteerApplication, rejectVolunteerApplication } from '@/actions/application-actions';
import { cn } from '@/lib/utils'; 
import { AttendanceForm } from '@/components/dashboard/organization/attendance-form'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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


export default function OrganizationDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingData, setLoadingData] = useState(true); 
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [selectedAppForPerformance, setSelectedAppForPerformance] = useState<VolunteerApplication | null>(null);
  const [deletingOppId, setDeletingOppId] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    if (user && role === 'organization') {
      setLoadingData(true);
      try {
        
        const [fetchedApps, allOpportunities] = await Promise.all([
          getApplicationsForOrganizationAction(user.id),
          getOpportunitiesAction(undefined, undefined, undefined, undefined, 'recent', 'all') // Fetch all for this org initially
        ]);

        
        const processedApps = fetchedApps.map(app => ({
            ...app,
            submittedAt: typeof app.submittedAt === 'string' ? new Date(app.submittedAt) : app.submittedAt
        }));
        setApplications(processedApps);

        
        const orgOpportunities = allOpportunities.filter(opp => opp.organizationId === user.id);
        setOpportunities(orgOpportunities);

      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        toast({ title: 'Error', description: error.message || 'Could not load dashboard data.', variant: 'destructive' });
      } finally {
        setLoadingData(false);
      }
    }
  }, [user, role, toast]);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'organization')) {
      console.log('Redirecting from organization dashboard: Not logged in or incorrect role.');
      router.push('/login');
    } else if (user && role === 'organization') {
        fetchData();
    }
     console.log('Organization dashboard effect:', { authLoading, user, role });
  }, [user, role, authLoading, router, fetchData]);

  const handleAccept = async (app: VolunteerApplication) => {
     if (!user) return;
     setProcessingAppId(app.id);
     try {
        const result = await acceptVolunteerApplication(app.id, app.volunteerId, user.id, user.displayName);
        if (result.success && result.updatedApp) {
           toast({ title: 'Success', description: `Application accepted. Conversation started.` });
           setApplications(prev => prev.map(a => a.id === app.id ? result.updatedApp! : a));
           if (result.conversationId) {
              router.push(`/dashboard/messages/${result.conversationId}`);
           }
        } else {
           toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
     } catch (error: any) {
        console.error('Error accepting application:', error);
        toast({ title: 'Error', description: 'Failed to process acceptance.', variant: 'destructive' });
     } finally {
       setProcessingAppId(null);
     }
  };

  const handleReject = async (app: VolunteerApplication) => {
      setProcessingAppId(app.id);
      try {
          const result = await rejectVolunteerApplication(app.id);
           if (result.success && result.updatedApp) {
               toast({ title: 'Success', description: `Application rejected.` });
               setApplications(prev => prev.map(a => a.id === app.id ? result.updatedApp! : a));
           } else {
               toast({ title: 'Error', description: result.message, variant: 'destructive' });
           }
      } catch (error: any) {
          console.error('Error rejecting application:', error);
          toast({ title: 'Error', description: 'Failed to process rejection.', variant: 'destructive' });
      } finally {
          setProcessingAppId(null);
      }
  };

  
  const handleViewAttachment = (dataUri: string) => {
     if (!dataUri.startsWith('data:')) {
        toast({ title: "Error", description: "Invalid attachment data.", variant: "destructive" });
        return;
     }
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${dataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = "View Attachment"; 
    } else {
      toast({ title: "Popup Blocked", description: "Please allow popups for this site to view attachments.", variant: "destructive" });
    }
  };

  const handlePerformanceFormSubmit = (updatedApplication: VolunteerApplication) => {
    setApplications(prevApps => prevApps.map(app => app.id === updatedApplication.id ? updatedApplication : app));
    setSelectedAppForPerformance(null); 
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!user) return;
    setDeletingOppId(opportunityId);
    try {
      const result = await deleteOpportunityAction(opportunityId, user.id);
      if (result.success) {
        toast({ title: "Success", description: `Opportunity deleted. ${result.notifiedCount || 0} applicants notified.` });
        setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
        // Optionally, refresh applications if they might be affected (e.g., status change)
        // For now, just removing from opportunities list.
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast({ title: 'Error', description: 'Failed to delete opportunity.', variant: 'destructive' });
    } finally {
      setDeletingOppId(null);
    }
  };


  
  if (authLoading || (user && role === 'organization' && loadingData)) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <div className="flex justify-between items-center mb-6">
             <Skeleton className="h-8 w-64" />
             <Skeleton className="h-10 w-40" />
           </div>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
           </div>
           <Skeleton className="h-64 w-full mt-6 rounded-lg" />
           <Skeleton className="h-64 w-full mt-6 rounded-lg" />
         </div>
         <footer className="bg-primary p-4 mt-auto">
           <Skeleton className="h-4 w-1/3 mx-auto" />
         </footer>
       </div>
    );
  }

   if (!user || role !== 'organization') {
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Verifying access or redirecting...</p>
         </div>
          <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
             <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
          </footer>
       </div>
     );
   }

  console.log('Rendering organization dashboard for user:', user?.email);
  const newApplications = applications.filter(app => app.status === 'submitted');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const completedApplications = applications.filter(app => app.status === 'completed');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow"> 
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-primary">Organization Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/organization/volunteer-recommendations" className="flex items-center gap-2">
                <UserSearch size={16} />
                Find Volunteers
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/organization/create" className="flex items-center gap-2">
                <PlusCircle size={16} />
                Add Opportunity
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"> 
           <Card className={cn("border", "card-hover-effect")}>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-accent" /> Active Opportunities</CardTitle>
               <CardDescription>Manage your current volunteer postings.</CardDescription>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold text-primary">{opportunities.length}</p>
             </CardContent>
           </Card>
           <Card className={cn("border", "card-hover-effect")}>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-accent" /> Total Applications</CardTitle>
                <CardDescription>Overview of all received applications.</CardDescription>
             </CardHeader>
             <CardContent>
                <p className="text-3xl font-bold text-primary">{applications.length}</p>
             </CardContent>
           </Card>
            <Card className={cn("border", "card-hover-effect")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> Organization Profile</CardTitle>
                 <CardDescription>Update your organization's information.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button asChild variant="outline" size="sm"><Link href="/profile/edit">Edit Profile</Link></Button>
              </CardContent>
            </Card>
        </div>

        {/* List of Opportunities */}
        <Card className="shadow-lg border mb-8">
            <CardHeader>
                <CardTitle>Your Opportunities</CardTitle>
                <CardDescription>Overview of opportunities posted by your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                {opportunities.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {opportunities.map(opp => (
                            <div key={opp.id} className="flex flex-wrap justify-between items-center p-3 bg-card/80 rounded-md border gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{opp.title}</h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {opp.location} • {opp.category} • {opp.commitment}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <Link href={`/opportunities/${opp.id}`} title="View Volunteers">
                                            <Users className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <Link href={`/dashboard/organization/edit/${opp.id}`} title="Edit Opportunity">
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete Opportunity">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the opportunity
                                                    "{opp.title}" and notify all applicants.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteOpportunity(opp.id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    disabled={deletingOppId === opp.id}
                                                >
                                                    {deletingOppId === opp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-6">
                        <p className="text-muted-foreground mb-3">You haven't posted any opportunities yet.</p>
                         <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                           <Link href="/dashboard/organization/create">
                             <PlusCircle className="mr-2 h-4 w-4" /> Post First Opportunity
                           </Link>
                         </Button>
                     </div>
                )}
            </CardContent>
        </Card>


        {/* Applications Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New Applications */}
            <Card className="shadow-lg border">
              <CardHeader>
                <CardTitle>New Volunteer Applications ({newApplications.length})</CardTitle>
                <CardDescription>Review and respond to volunteers.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto pr-2">
                {newApplications.length > 0 ? (
                  <div className="space-y-4">
                    {newApplications.map(app => (
                      <Card key={app.id} className="bg-card/80 border">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                             <div>
                                <CardTitle className="text-lg">{app.applicantName}</CardTitle>
                                <CardDescription>Interested in: {app.opportunityTitle}</CardDescription>
                                <CardDescription>Submitted: {app.submittedAt instanceof Date ? app.submittedAt.toLocaleDateString() : 'Invalid Date'}</CardDescription>
                             </div>
                              <Badge variant="secondary" className="capitalize">{app.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1 pb-3">
                           <p><span className="font-medium">Email:</span> {app.applicantEmail}</p>
                           {app.coverLetter && <p><span className="font-medium">Statement:</span> {app.coverLetter.substring(0, 100)}{app.coverLetter.length > 100 ? '...' : ''}</p>}
                           {app.resumeUrl && app.resumeUrl.startsWith('data:') ? (
                             <p className="flex items-center gap-2">
                               <span className="font-medium">Attachment:</span>
                               <Button variant="link" size="sm" className="h-auto p-0 text-accent" onClick={() => handleViewAttachment(app.resumeUrl!)}>
                                 <Download className="mr-1 h-4 w-4" /> View Document
                               </Button>
                             </p>
                           ) : app.resumeUrl ? (
                             <p><span className="font-medium">Attachment:</span> <span className="text-muted-foreground italic">(Invalid or old format)</span></p>
                           ) : null}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(app)}
                            disabled={processingAppId === app.id}
                          >
                            {processingAppId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                            Reject
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAccept(app)}
                            disabled={processingAppId === app.id}
                          >
                             {processingAppId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            Accept & Message
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No new applications to review.</p>
                )}
              </CardContent>
            </Card>

            {/* Accepted/Ongoing Applications */}
             <Card className="shadow-lg border">
                <CardHeader>
                    <CardTitle>Accepted / Ongoing Activities ({acceptedApplications.length})</CardTitle>
                    <CardDescription>Manage volunteers for ongoing activities.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto pr-2">
                    {acceptedApplications.length > 0 ? (
                        <div className="space-y-4">
                            {acceptedApplications.map(app => (
                                <Card key={app.id} className="bg-card/80 border">
                                    <CardHeader className="pb-2">
                                         <div className="flex flex-wrap justify-between items-start gap-2">
                                            <div>
                                                <CardTitle className="text-lg">{app.applicantName}</CardTitle>
                                                <CardDescription>For: {app.opportunityTitle}</CardDescription>
                                            </div>
                                            <Badge variant="default" className="capitalize bg-green-600 text-white">{app.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-1 pb-3">
                                        <p><span className="font-medium">Attendance:</span> <span className="capitalize">{app.attendance || 'Pending'}</span></p>
                                        {app.orgRating && <p><span className="font-medium">Your Rating:</span> {app.orgRating}/5 Stars</p>}
                                        {app.hoursLoggedByOrg !== undefined && <p><span className="font-medium">Hours Logged:</span> {app.hoursLoggedByOrg} hrs</p>}
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 pt-3 border-t">
                                         <Dialog onOpenChange={(open) => !open && setSelectedAppForPerformance(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedAppForPerformance(app)}>
                                                    <Edit3 className="h-4 w-4 mr-1" /> Record Performance
                                                </Button>
                                            </DialogTrigger>
                                            {selectedAppForPerformance && selectedAppForPerformance.id === app.id && (
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Record Performance for {app.applicantName}</DialogTitle>
                                                        <DialogDescription>
                                                            Activity: {app.opportunityTitle}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <AttendanceForm
                                                        application={selectedAppForPerformance}
                                                        onFormSubmit={handlePerformanceFormSubmit}
                                                    />
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No applications currently accepted.</p>
                    )}
                </CardContent>
            </Card>
        </div>


         <div className="mt-8 text-center"> 
            <Button asChild variant="outline">
               <Link href="/dashboard/messages">
                 <MessageSquare className="mr-2 h-4 w-4" /> View All Messages
               </Link>
            </Button>
         </div>

      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
       </footer>
    </div>
  );
}