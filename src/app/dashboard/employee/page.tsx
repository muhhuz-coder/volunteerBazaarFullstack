// src/app/dashboard/employee/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Using mock context
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, role, loading } = useAuth(); // Using mock context values
  const router = useRouter();

  useEffect(() => {
    // If not loading and user is not logged in OR role is not employee, redirect
    if (!loading && (!user || role !== 'employee')) {
      console.log('Redirecting from employee dashboard: Not logged in or incorrect role.');
      router.push('/login'); // Redirect to login if not an authenticated employee
    }
     console.log('Employee dashboard effect:', { loading, user, role });
  }, [user, role, loading, router]);

  // Show loading state while checking auth/role
  if (loading) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="container mx-auto px-4 py-8 flex-grow">
           <Skeleton className="h-8 w-64 mb-6" />
           <div className="grid gap-6 md:grid-cols-2">
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-48 w-full md:col-span-2" />
           </div>
         </div>
       </div>
    );
  }

  // If user is logged in but not an employee, show verifying/error or redirect might have already happened
  // This condition might be briefly hit if redirection is slightly delayed
  if (!user || role !== 'employee') {
     console.log('Rendering Access Denied on employee dashboard (should be redirecting soon)');
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Redirecting to login...</p>
           {/* Optional: Add a button to go home or login */}
         </div>
       </div>
     );
   }


  // Render the dashboard content if user is an authenticated employee
   console.log('Rendering employee dashboard for user:', user?.email);
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-primary">Employee Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>View the status of jobs you've applied for.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>You have applied to 3 jobs.</p>
              {/* Add link or button to view applications */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Saved Jobs</CardTitle>
               <CardDescription>Manage your saved job listings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
               <p>You have 5 saved jobs.</p>
               {/* Add link or button to view saved jobs */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
               <CardDescription>Update your profile and resume.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>Keep your information up-to-date.</p>
              {/* Add link or button to profile settings */}
            </CardContent>
          </Card>
          {/* Add more relevant cards/widgets for employees */}
        </div>
      </div>
    </div>
  );
}
