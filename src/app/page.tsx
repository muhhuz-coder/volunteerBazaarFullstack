
import { Header } from '@/components/layout/header';
import { OpportunitySearch } from '@/components/job-search';
import { OpportunityList } from '@/components/job-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
// Import the server action
import { getOpportunitiesAction } from '@/actions/job-board-actions';
import { MapPin, Clock, Activity } from 'lucide-react'; // Import icons for skeleton

export default async function Home({ // Make the component async
  searchParams,
}: {
  searchParams?: {
    keywords?: string;
    category?: string;
  };
}) {
  const keywords = searchParams?.keywords || '';
  const category = searchParams?.category || '';

  // Fetch opportunities using the server action
  // This now happens on the server during the request/build time
  const opportunities = await getOpportunitiesAction(keywords, category);

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      {/* Increased vertical padding py-12 */}
      <div className="container mx-auto px-4 py-12 flex-grow">
        <OpportunitySearch initialKeywords={keywords} initialCategory={category} />
         {/*
           OpportunityList now receives the fetched data directly.
           Suspense might not be strictly necessary here if the data fetching
           is fast enough during SSR, but keeping it doesn't hurt.
           Alternatively, remove Suspense and pass opportunities directly.
         */}
        <Suspense fallback={<OpportunityListSkeleton />}>
          <OpportunityList initialOpportunities={opportunities} keywords={keywords} category={category} />
        </Suspense>
      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}

// Renamed skeleton component
function OpportunityListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card p-6 rounded-lg shadow-md border flex flex-col justify-between">
           {/* Header Skeleton */}
           <div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
           </div>
           {/* Content Skeleton */}
           <div className="space-y-3 text-sm flex-grow mb-4">
               <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
               </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
               <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/4" />
               </div>
               <div className="pt-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
           </div>
           {/* Footer Skeleton */}
           <div className="flex justify-between items-center pt-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-md" />
           </div>
        </div>
      ))}
    </div>
  );
}
