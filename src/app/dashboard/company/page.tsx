// src/app/dashboard/company/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, AlertCircle } from 'lucide-react';

export default function CompanyDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and user is not logged in OR role is not company, redirect
    if (!loading && (!user || role !== 'company')) {
      router.push('/login'); // Redirect to login if not an authenticated company user
    }
  }, [user, role, loading, router]);

  // Show loading state while checking auth/role
  if (loading) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <div className="flex justify-between items-center mb-6">
             <Skeleton className="h-8 w-64" />
             <Skeleton className="h-10 w-32" />
           </div>
           <div className="grid gap-6 md:grid-cols-2">
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-48 w-full md:col-span-2" />
           </div>
         </div>
       </div>
    );
  }

   // If user is logged in but not a company, show verifying/error or redirect might have already happened
   if (!user || role !== 'company') {
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">You do not have permission to view this page.</p>
         </div>
       </div>
     );
   }

  // Render the dashboard content if user is an authenticated company user
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Company Dashboard</h1>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Post New Job
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Active Job Postings</CardTitle>
              <CardDescription>Manage your current job openings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>You have 5 active job postings.</p>
              {/* Add link or button to view/manage postings */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Received Applications</CardTitle>
               <CardDescription>Review applications submitted for your jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
               <p>25 new applications received.</p>
               {/* Add link or button to view applications */}
            </CardContent>
          </Card>
           <Card>
             <CardHeader>
               <CardTitle>Company Profile</CardTitle>
                <CardDescription>Update your company information.</CardDescription>
             </CardHeader>
             <CardContent>
               {/* Placeholder content */}
               <p>Keep your company details current.</p>
               {/* Add link or button to company profile settings */}
             </CardContent>
           </Card>
          {/* Add more relevant cards/widgets for companies */}
        </div>
      </div>
    </div>
  );
}
