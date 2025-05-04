// src/app/analytics/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAppStatisticsAction, type AppStats } from '@/actions/analytics-actions';
import { Users, Building2, Briefcase } from 'lucide-react'; // Import icons
import { Suspense } from 'react';

async function StatsDisplay() {
  const stats = await getAppStatisticsAction();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-lg border hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
          <Users className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalVolunteers}</div>
          <p className="text-xs text-muted-foreground">Individuals ready to help</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg border hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
          <Building2 className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">Groups making an impact</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg border hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
          <Briefcase className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalOpportunities}</div>
          <p className="text-xs text-muted-foreground">Active volunteer postings</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-md border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/4 mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-4xl mx-auto shadow-xl border mb-12">
           <CardHeader className="text-center pt-8 pb-4">
             <CardTitle className="text-3xl font-bold text-primary mb-2">Platform Analytics</CardTitle>
             <CardDescription className="text-lg text-muted-foreground">Overview of Volunteer Connect's impact.</CardDescription>
           </CardHeader>
           <CardContent className="px-6 md:px-8 pb-10">
             <Suspense fallback={<StatsSkeleton />}>
               <StatsDisplay />
             </Suspense>
              {/* Placeholder for future charts/more detailed stats */}
             <div className="mt-12 text-center">
               <h3 className="text-xl font-semibold text-primary mb-4">More Insights Coming Soon</h3>
               <p className="text-muted-foreground max-w-md mx-auto">
                 We're working on adding more detailed analytics, like volunteer hours logged and category breakdowns.
               </p>
             </div>
           </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
         <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
