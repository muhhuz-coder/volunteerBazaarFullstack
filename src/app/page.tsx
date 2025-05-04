import { Header } from '@/components/layout/header';
// Updated imports: JobSearch -> OpportunitySearch, JobList -> OpportunityList
import { OpportunitySearch } from '@/components/job-search';
import { OpportunityList } from '@/components/job-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home({
  searchParams,
}: {
  searchParams?: {
    keywords?: string;
    category?: string;
  };
}) {
  const keywords = searchParams?.keywords || '';
  const category = searchParams?.category || '';

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
         {/* Use OpportunitySearch component */}
        <OpportunitySearch initialKeywords={keywords} initialCategory={category} />
        <Suspense fallback={<OpportunityListSkeleton />}>
           {/* Use OpportunityList component and pass props */}
          <OpportunityList keywords={keywords} category={category} />
        </Suspense>
      </div>
      {/* Footer can be added here later */}
    </div>
  );
}

// Renamed skeleton component
function OpportunityListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
         // Kept the structure, adjusted text skeletons slightly if needed
        <div key={i} className="bg-card p-6 rounded-lg shadow-md border">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          {/* Adjusted skeleton for button text */}
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}
