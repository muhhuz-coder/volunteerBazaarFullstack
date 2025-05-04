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
import { PlusCircle, AlertCircle, Users, FileText, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { getApplicationsForOrganization, updateApplicationStatus, type VolunteerApplication } from '@/services/job-board';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // Import Badge

export default function OrganizationDashboard() {
  const { user, role, loading: authLoading, acceptApplication } = useAuth(); // Use acceptApplication from context
  const router = useRouter();
  const { toast } = useToast();

  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    if (user && role === 'organization') {
      setLoadingApps(true);
      try {
        // Service function now reads persisted data
        const fetchedApps = await getApplicationsForOrganization(user.id);
        setApplications(fetchedApps);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast({ title: 'Error', description: 'Could not load applications.', variant: 'destructive' });
      } finally {
        setLoadingApps(false);
      }
    }
  }, [user, role, toast]); // Dependencies for useCallback

  useEffect(() => {
    if (!authLoading && (!user || role !== 'organization')) {
      console.log('Redirecting from organization dashboard: Not logged in or incorrect role.');
      router.push('/login');
    } else if (user && role === 'organization') {
        fetchApps();
    }
     console.log('Organization dashboard effect:', { authLoading, user, role });
  }, [user, role, authLoading, router, fetchApps]);

  const handleAccept = async (app: VolunteerApplication) => {
     setProcessingAppId(app.id);
     try {
        // Use context function (which calls services that handle persistence)
        const result = await acceptApplication(app.id, app.volunteerId);
        if (result.success) {
           toast({ title: 'Success', description: `Application accepted. Conversation started.` });
           // Update UI: Change status locally or re-fetch
           setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));
            // Optional redirect handled in context or here if needed
            // if (result.conversationId) {
            //    router.push(`/dashboard/messages/${result.conversationId}`);
            // }
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
          // Use the direct service call for rejection (service handles persistence)
          await updateApplicationStatus(app.id, 'rejected');
          toast({ title: 'Success', description: `Application rejected.` });
          // Update UI
          setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
      } catch (error: any) {
          console.error('Error rejecting application:', error);
          toast({ title: 'Error', description: 'Failed to process rejection.', variant: 'destructive' });
      } finally {
          setProcessingAppId(null);
      }
  };


  // Combined loading state
  if (authLoading || (user && role === 'organization' && loadingApps)) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <div className="flex justify-between items-center mb-6">
             <Skeleton className="h-8 w-64" />
             <Skeleton className="h-10 w-40" />
           </div>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
           </div>
           <Skeleton className="h-64 w-full mt-6" />
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
             <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
          </footer>
       </div>
     );
   }

  console.log('Rendering organization dashboard for user:', user?.email);
  const submittedApplications = applications.filter(app => app.status === 'submitted');

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Organization Dashboard</h1>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Post New Opportunity
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
           <Card className="shadow-md border">
             <CardHeader>
               <CardTitle>Active Opportunities</CardTitle>
               <CardDescription>Manage your current volunteer postings.</CardDescription>
             </CardHeader>
             <CardContent>
                {/* TODO: Fetch and display actual count */}
               <p>You have active volunteer opportunities.</p>
             </CardContent>
           </Card>
           <Card className="shadow-md border">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Total Applications</CardTitle>
                <CardDescription>Overview of all received applications.</CardDescription>
             </CardHeader>
             <CardContent>
                <p>{applications.length} total applications received.</p>
             </CardContent>
           </Card>
            <Card className="shadow-md border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Organization Profile</CardTitle>
                 <CardDescription>Update your organization's information.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Keep your organization details current.</p>
              </CardContent>
            </Card>
        </div>

        <Card className="shadow-lg border">
          <CardHeader>
            <CardTitle>New Volunteer Applications ({submittedApplications.length})</CardTitle>
            <CardDescription>Review and respond to volunteers who expressed interest.</CardDescription>
          </CardHeader>
          <CardContent>
            {submittedApplications.length > 0 ? (
              <div className="space-y-4">
                {submittedApplications.map(app => (
                  <Card key={app.id} className="bg-card/80 border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                         <div>
                            <CardTitle className="text-lg">{app.applicantName}</CardTitle>
                            <CardDescription>Interested in: {app.opportunityTitle}</CardDescription>
                            {/* Ensure submittedAt is a Date object before formatting */}
                            <CardDescription>Submitted: {app.submittedAt instanceof Date ? app.submittedAt.toLocaleDateString() : new Date(app.submittedAt).toLocaleDateString()}</CardDescription>
                         </div>
                          <Badge variant="secondary">{app.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 pb-3">
                       <p><span className="font-medium">Email:</span> {app.applicantEmail}</p>
                       {app.coverLetter && <p><span className="font-medium">Statement:</span> {app.coverLetter.substring(0, 100)}{app.coverLetter.length > 100 ? '...' : ''}</p>}
                       {app.resumeUrl && <p><span className="font-medium">Attachment:</span> <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">View Document</a></p>}
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

         <div className="mt-6 text-center">
            <Button asChild variant="outline">
               <Link href="/dashboard/messages">
                 <MessageSquare className="mr-2 h-4 w-4" /> View All Messages
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
