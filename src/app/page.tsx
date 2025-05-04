
import { Header } from '@/components/layout/header';
import { OpportunitySearch } from '@/components/job-search';
import { OpportunityList } from '@/components/job-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
// Import the server action
import { getOpportunitiesAction } from '@/actions/job-board-actions';

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
        <div key={i} className="bg-card p-6 rounded-lg shadow-md border">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}
