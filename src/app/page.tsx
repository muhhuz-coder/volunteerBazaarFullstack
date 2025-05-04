import { Header } from '@/components/layout/header';
import { JobSearch } from '@/components/job-search';
import { JobList } from '@/components/job-list';
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
        <JobSearch initialKeywords={keywords} initialCategory={category} />
        <Suspense fallback={<JobListSkeleton />}>
          {/* Pass search params to JobList to fetch filtered jobs */}
          <JobList keywords={keywords} category={category} />
        </Suspense>
      </div>
      {/* Footer can be added here later */}
    </div>
  );
}

function JobListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card p-6 rounded-lg shadow-md border">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
