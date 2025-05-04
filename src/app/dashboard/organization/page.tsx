// src/app/dashboard/organization/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Using mock context
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// Updated icons
import { PlusCircle, AlertCircle, Users, FileText } from 'lucide-react';

// Renamed component from CompanyDashboard to OrganizationDashboard
export default function OrganizationDashboard() {
  // Updated role check: 'company' -> 'organization'
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not loading and user is not logged in OR role is not organization
    if (!loading && (!user || role !== 'organization')) {
      // Updated log message
      console.log('Redirecting from organization dashboard: Not logged in or incorrect role.');
      router.push('/login'); // Redirect to login
    }
     // Updated log message
     console.log('Organization dashboard effect:', { loading, user, role });
  }, [user, role, loading, router]);

  // Show loading state while checking auth/role
  if (loading) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <div className="flex justify-between items-center mb-6">
             <Skeleton className="h-8 w-64" />
             <Skeleton className="h-10 w-40" /> {/* Adjusted width */}
           </div>
           <div className="grid gap-6 md:grid-cols-2">
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-48 w-full md:col-span-2" />
           </div>
         </div>
         {/* Basic Footer Skeleton */}
         <footer className="bg-primary p-4 mt-auto">
           <Skeleton className="h-4 w-1/3 mx-auto" />
         </footer>
       </div>
    );
  }

   // If user is logged in but not an organization, show verifying/error or redirect might have already happened
   // Updated role check
   if (!user || role !== 'organization') {
     // Updated log message
     console.log('Rendering Access Denied on organization dashboard (should be redirecting soon)');
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Redirecting to login...</p>
         </div>
          {/* Basic Footer */}
          <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
             <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
          </footer>
       </div>
     );
   }

  // Render the dashboard content if user is an authenticated organization user
   // Updated log message
  console.log('Rendering organization dashboard for user:', user?.email);
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
           {/* Updated heading */}
          <h1 className="text-3xl font-bold text-primary">Organization Dashboard</h1>
           {/* Updated button text */}
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Post New Opportunity
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md border">
            <CardHeader>
               {/* Updated title and description */}
              <CardTitle>Active Opportunities</CardTitle>
              <CardDescription>Manage your current volunteer postings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>You have 3 active volunteer opportunities.</p>
              {/* Add link or button */}
            </CardContent>
          </Card>
          <Card className="shadow-md border">
            <CardHeader>
               {/* Updated title, description, and icon */}
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Received Applications</CardTitle>
               <CardDescription>Review volunteer interest forms.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
               <p>15 new volunteer applications received.</p>
               {/* Add link or button */}
            </CardContent>
          </Card>
           <Card className="shadow-md border">
             <CardHeader>
                {/* Updated title, description, and icon */}
               <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Organization Profile</CardTitle>
                <CardDescription>Update your organization's information.</CardDescription>
             </CardHeader>
             <CardContent>
               {/* Placeholder content */}
               <p>Keep your organization details current.</p>
               {/* Add link or button */}
             </CardContent>
           </Card>
          {/* Add more relevant cards/widgets for organizations */}
        </div>
      </div>
       {/* Basic Footer */}
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}
