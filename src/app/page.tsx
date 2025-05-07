
import { Header } from '@/components/layout/header';
import { OpportunitySearch } from '@/components/job-search';
import { OpportunityList } from '@/components/job-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getOpportunitiesAction } from '@/actions/job-board-actions';
import { getAppStatisticsAction, type AppStats } from '@/actions/analytics-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Building2, Briefcase, LayoutGrid, ListFilter, MapPin, Clock, Activity, Star, Eye, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

async function StatsDisplay() {
  const stats = await getAppStatisticsAction();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Card className={cn("border", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
          <Users className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalVolunteers}</div>
          <p className="text-xs text-muted-foreground">Individuals ready to help</p>
        </CardContent>
      </Card>
      <Card className={cn("border", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
          <Building2 className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">Groups making an impact</p>
        </CardContent>
      </Card>
      <Card className={cn("border", "card-hover-effect")}>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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


export default async function Home({
  searchParams,
}: {
  searchParams?: {
    keywords?: string;
    category?: string;
    location?: string;
    commitment?: string;
    view?: 'grid' | 'list'; // 'grid' will now be horizontal scroll
    sort?: string;
  };
}) {
  const keywords = searchParams?.keywords || '';
  const category = searchParams?.category || '';
  const location = searchParams?.location || '';
  const commitment = searchParams?.commitment || '';
  const view = searchParams?.view || 'grid'; // Default to 'grid' (horizontal scroll)
  const sort = searchParams?.sort || 'recent';

  const opportunities = await getOpportunitiesAction(keywords, category, location, commitment, sort);

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">

        {/* Analytics Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Platform Overview</h1>
          </div>
          <Suspense fallback={<StatsSkeleton />}>
            <StatsDisplay />
          </Suspense>
        </section>

        {/* Opportunities Section */}
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-1/4 lg:w-1/5">
            <OpportunitySearch
              initialKeywords={keywords}
              initialCategory={category}
              initialLocation={location}
              initialCommitment={commitment}
            />
          </aside>

          <main className="w-full md:w-3/4 lg:w-4/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary flex items-center">
                <Briefcase className="mr-2 h-6 w-6" />
                Explore Opportunities
                <span className="ml-2 text-sm font-normal text-muted-foreground">({opportunities.length} Found)</span>
              </h2>
            </div>
            <Suspense fallback={<OpportunityListSkeleton view={view} />}>
              <OpportunityList
                initialOpportunities={opportunities}
                keywords={keywords}
                category={category}
                location={location}
                commitment={commitment}
                currentView={view}
                currentSort={sort}
              />
            </Suspense>
          </main>
        </div>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}

function OpportunityListSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  const CardSkeleton = () => (
    <div className={cn(
      "bg-card p-4 rounded-lg shadow-md border flex",
      view === 'grid' ? "flex-col min-w-[300px] md:min-w-[320px] scroll-snap-align-start" : "flex-row items-start gap-4"
    )}>
      <Skeleton className={cn("bg-muted", view === 'grid' ? 'h-40 w-full rounded-md mb-3' : 'h-32 w-32 rounded-md flex-shrink-0')} />
      <div className="flex-grow flex flex-col">
        <div className={view === 'grid' ? '' : 'flex-grow'}>
          <Skeleton className="h-5 w-3/4 mb-1 bg-muted-foreground/20" />
          <Skeleton className="h-4 w-1/2 mb-3 bg-muted-foreground/20" />
          <div className="space-y-2 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <Skeleton className="h-3 w-20 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <Skeleton className="h-3 w-24 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <Skeleton className="h-3 w-16 bg-muted-foreground/20" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mb-1 bg-muted-foreground/20" />
          <Skeleton className="h-3 w-5/6 bg-muted-foreground/20" />
        </div>
        <div className={cn("mt-auto pt-3 flex justify-between items-center", view === 'grid' ? 'border-t' : '')}>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400" />
            <Skeleton className="h-3 w-8 bg-muted-foreground/20" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md bg-primary/20" />
        </div>
      </div>
      {view === 'list' && (
        <div className="w-1/4 pl-4 border-l flex-shrink-0 space-y-2">
            <div className="text-xs">
                <Skeleton className="h-3 w-20 mb-0.5 bg-muted-foreground/20" />
                <Skeleton className="h-5 w-10 bg-muted-foreground/20" />
            </div>
            <div className="text-xs">
                 <Skeleton className="h-3 w-24 mb-0.5 bg-muted-foreground/20" />
                 <Skeleton className="h-5 w-10 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-0.5 mt-1">
               {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 text-muted-foreground/30" />)}
            </div>
           <Skeleton className="h-8 w-full mt-2 rounded-md bg-primary/20" />
        </div>
      )}
    </div>
  );

  if (view === 'grid') {
    return (
      <div className="flex overflow-x-auto space-x-6 py-4 scroll-smooth scroll-snap-x-mandatory">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  // Fallback for list view skeleton (vertical)
  return (
    <div className="grid grid-cols-1 gap-6 mt-0">
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

    