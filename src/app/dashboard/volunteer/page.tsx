// src/app/dashboard/volunteer/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Using mock context
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// Updated icons
import { AlertCircle, FileCheck, Heart, UserCog } from 'lucide-react';

// Renamed component from EmployeeDashboard to VolunteerDashboard
export default function VolunteerDashboard() {
  // Updated role check: 'employee' -> 'volunteer'
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not loading and user is not logged in OR role is not volunteer
    if (!loading && (!user || role !== 'volunteer')) {
      // Updated log message
      console.log('Redirecting from volunteer dashboard: Not logged in or incorrect role.');
      router.push('/login'); // Redirect to login
    }
     // Updated log message
     console.log('Volunteer dashboard effect:', { loading, user, role });
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

  // If user is logged in but not a volunteer, show verifying/error or redirect might have already happened
  // Updated role check
  if (!user || role !== 'volunteer') {
     // Updated log message
     console.log('Rendering Access Denied on volunteer dashboard (should be redirecting soon)');
     return (
       <div className="flex flex-col min-h-screen bg-secondary">
         <Header />
         <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Redirecting to login...</p>
         </div>
       </div>
     );
   }


  // Render the dashboard content if user is an authenticated volunteer
   // Updated log message
   console.log('Rendering volunteer dashboard for user:', user?.email);
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
         {/* Updated heading */}
        <h1 className="text-3xl font-bold mb-6 text-primary">Volunteer Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
               {/* Updated title, description, and icon */}
              <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />My Applications</CardTitle>
              <CardDescription>View the status of opportunities you've applied for.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>You have applied to 2 opportunities.</p>
              {/* Add link or button */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
               {/* Updated title, description, and icon */}
              <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />Saved Opportunities</CardTitle>
               <CardDescription>Manage your saved volunteer listings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
               <p>You have 4 saved opportunities.</p>
               {/* Add link or button */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
               {/* Updated title, description, and icon */}
              <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Profile Settings</CardTitle>
               <CardDescription>Update your profile and skills.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder content */}
              <p>Keep your information up-to-date.</p>
              {/* Add link or button */}
            </CardContent>
          </Card>
          {/* Add more relevant cards/widgets for volunteers */}
        </div>
      </div>
    </div>
  );
}
