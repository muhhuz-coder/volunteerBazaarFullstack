// src/app/opportunities/page.tsx
import { Header } from '@/components/layout/header';
import { OpportunitySearch } from '@/components/job-search';
import { OpportunityList } from '@/components/job-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getOpportunitiesAction } from '@/actions/job-board-actions';
import { Briefcase, MapPin, Activity, Clock, Star, CalendarClock, CalendarDays, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Import Button

// Re-using the skeleton
function OpportunityListSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  const CardSkeleton = () => (
    <div className={cn(
      "bg-card p-5 rounded-xl shadow-lg border border-border flex", // Increased padding and rounding
      view === 'grid' ? "flex-col min-w-[320px] md:min-w-[340px] scroll-snap-align-start" : "flex-row items-start gap-5 w-full" // Increased min-width for grid
    )}>
      <Skeleton className={cn("bg-muted/80", view === 'grid' ? 'h-48 w-full rounded-lg mb-4' : 'h-36 w-36 rounded-lg flex-shrink-0')} />
      <div className="flex-grow flex flex-col">
        <div className={view === 'grid' ? '' : 'flex-grow'}>
          <Skeleton className="h-6 w-4/5 mb-2 bg-muted-foreground/30" /> {/* Larger title skeleton */}
          <Skeleton className="h-4 w-3/5 mb-4 bg-muted-foreground/20" /> {/* Subtitle skeleton */}
          <div className="space-y-2.5 text-sm mb-4"> {/* Increased spacing */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground/70" />
              <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground/70" />
              <Skeleton className="h-4 w-28 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground/70" />
              <Skeleton className="h-4 w-20 bg-muted-foreground/20" />
            </div>
             <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground/70" />
              <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground/70" />
              <Skeleton className="h-4 w-36 bg-muted-foreground/20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-1.5 bg-muted-foreground/20" />
          <Skeleton className="h-4 w-5/6 bg-muted-foreground/20" />
        </div>
        <div className={cn("mt-auto pt-4 flex justify-between items-center", view === 'grid' ? 'border-t border-border' : '')}>
          <div className="flex items-center gap-1.5">
            <Star className="h-4.5 w-4.5 text-yellow-400/80" />
            <Skeleton className="h-4 w-10 bg-muted-foreground/20" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md bg-primary/30" />
        </div>
      </div>
      {view === 'list' && (
        <div className="w-1/3 pl-5 border-l border-border flex-shrink-0 space-y-3">
            <div className="text-sm">
                <Skeleton className="h-4 w-24 mb-1 bg-muted-foreground/20" />
                <Skeleton className="h-6 w-12 bg-muted-foreground/30" />
            </div>
            <div className="text-sm">
                 <Skeleton className="h-4 w-28 mb-1 bg-muted-foreground/20" />
                 <Skeleton className="h-6 w-12 bg-muted-foreground/30" />
            </div>
             <div className="text-sm">
                 <Skeleton className="h-4 w-20 mb-1 bg-muted-foreground/20" />
                 <Skeleton className="h-6 w-24 bg-muted-foreground/30" />
            </div>
            <div className="text-sm">
                 <Skeleton className="h-4 w-32 mb-1 bg-muted-foreground/20" />
                 <Skeleton className="h-6 w-28 bg-muted-foreground/30" />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
               {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-muted-foreground/40" />)}
            </div>
           <Skeleton className="h-9 w-full mt-3 rounded-md bg-primary/30" />
        </div>
      )}
    </div>
  );

  if (view === 'grid') {
    return (
      <div className="flex overflow-x-auto space-x-6 py-4 scroll-smooth scroll-snap-x-mandatory hide-scrollbar -mx-4 px-4"> {/* Negative margin to allow full bleed */}
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-8 mt-0"> {/* Increased gap for list view */}
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}


export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: {
    keywords?: string;
    category?: string;
    location?: string;
    commitment?: string;
    view?: 'grid' | 'list';
    sort?: string;
    tab?: 'all' | 'active' | 'archived';
  };
}) {
  const keywords = searchParams?.keywords;
  const category = searchParams?.category;
  const location = searchParams?.location;
  const commitment = searchParams?.commitment;
  const view = searchParams?.view || 'grid';
  const sort = searchParams?.sort || 'recent';
  const currentTab = searchParams?.tab || 'all';

  const opportunities = await getOpportunitiesAction(
    keywords,
    category,
    location,
    commitment,
    sort,
    currentTab as 'all' | 'active' | 'archived'
  );

  const createTabLink = (tabValue: 'all' | 'active' | 'archived') => {
    const params = new URLSearchParams(searchParams?.toString() || ''); 
    if (keywords) params.set('keywords', keywords);
    if (category && category !== 'All') params.set('category', category);
    if (location) params.set('location', location);
    if (commitment && commitment !== 'All') params.set('commitment', commitment);
    if (view) params.set('view', view);
    if (sort) params.set('sort', sort);
    
    params.set('tab', tabValue);
    return `/opportunities?${params.toString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          <aside className="w-full lg:w-1/4 xl:w-1/5">
             <div className="sticky top-24"> {/* Make sidebar sticky */}
                <OpportunitySearch
                  initialKeywords={keywords}
                  initialCategory={category}
                  initialLocation={location}
                  initialCommitment={commitment}
                />
            </div>
          </aside>

          <main className="w-full lg:w-3/4 xl:w-4/5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center tracking-tight">
                <Briefcase className="mr-3.5 h-8 w-8" />
                Volunteer Opportunities
              </h1>
               <span className="text-base font-medium text-muted-foreground whitespace-nowrap">({opportunities.length} results in "{currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}" list)</span>
            </div>

            <Tabs value={currentTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex h-auto p-1.5 rounded-lg">
                <TabsTrigger value="all" asChild className="py-2 text-sm data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Link href={createTabLink('all')}>All</Link>
                </TabsTrigger>
                <TabsTrigger value="active" asChild className="py-2 text-sm data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Link href={createTabLink('active')}>Active/New</Link>
                </TabsTrigger>
                <TabsTrigger value="archived" asChild className="py-2 text-sm data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Link href={createTabLink('archived')}>Archived</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
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
      <footer className="bg-primary text-primary-foreground text-center p-6 mt-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
