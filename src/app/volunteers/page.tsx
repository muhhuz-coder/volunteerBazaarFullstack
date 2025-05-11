// src/app/volunteers/page.tsx
'use client'; // Make this a client component to use useAuth

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // For reading search params on client
import { Header } from '@/components/layout/header';
import { VolunteerFilter } from '@/components/volunteer-filter';
import { VolunteerList } from '@/components/volunteer-list';
import { getPublicVolunteersAction } from '@/actions/user-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ListFilter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

function VolunteerListSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  const CardSkeleton = () => (
    <div className={cn(
      "bg-card p-4 rounded-lg shadow-md border flex",
      view === 'grid' ? "flex-col min-w-[280px] md:min-w-[300px] scroll-snap-align-start" : "flex-row items-start gap-4 w-full"
    )}>
      <Skeleton className={cn("bg-muted flex-shrink-0", view === 'grid' ? 'h-32 w-full rounded-md mb-3' : 'h-24 w-24 md:h-28 md:w-28 rounded-full')} />
      <div className="flex-grow flex flex-col mt-2 md:mt-0">
        <Skeleton className="h-5 w-3/4 mb-1 bg-muted-foreground/20" />
        <Skeleton className="h-4 w-1/2 mb-3 bg-muted-foreground/20" />
        <div className="space-y-2 text-xs mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/20" />
              <Skeleton className="h-3 w-20 bg-muted-foreground/20" />
            </div>
          ))}
        </div>
        {view === 'grid' && (
          <div className="mt-auto pt-3 flex justify-end items-center border-t">
            <Skeleton className="h-8 w-24 rounded-md bg-primary/20" />
          </div>
        )}
      </div>
      {view === 'list' && (
         <div className="w-1/4 pl-4 border-l flex-shrink-0 space-y-2">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="text-xs">
                    <Skeleton className="h-3 w-20 mb-0.5 bg-muted-foreground/20" />
                    <Skeleton className="h-5 w-10 bg-muted-foreground/20" />
                </div>
            ))}
           <Skeleton className="h-8 w-full mt-2 rounded-md bg-primary/20" />
        </div>
      )}
    </div>
  );

  if (view === 'grid') {
    return (
      <div className="flex overflow-x-auto space-x-4 py-4 hide-scrollbar">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 mt-0">
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function VolunteersPage() {
  const searchParams = useSearchParams(); // Hook for client components
  const { user: loggedInUser, loading: authLoading } = useAuth(); // Get current user

  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const keywords = searchParams.get('keywords') || '';
  const sortBy = searchParams.get('sortBy') || 'points_desc';
  const view = (searchParams.get('view') as 'grid' | 'list') || 'grid';

  useEffect(() => {
    // Fetch volunteers only after auth state is resolved
    if (!authLoading) {
      setIsLoading(true);
      getPublicVolunteersAction({ keywords, sortBy }, loggedInUser?.id)
        .then(data => {
          setVolunteers(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch volunteers:", error);
          setIsLoading(false);
          // Optionally set an error state and display an error message
        });
    }
  }, [keywords, sortBy, loggedInUser, authLoading]); // Re-fetch if params or loggedInUser changes

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-1/4 lg:w-1/5">
            <VolunteerFilter
              initialKeywords={keywords}
              initialSortBy={sortBy}
            />
          </aside>

          <main className="w-full md:w-3/4 lg:w-4/5">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                <Users className="mr-3 h-7 w-7" />
                Meet Our Volunteers
                {!isLoading && <span className="ml-2 text-sm font-normal text-muted-foreground">({volunteers.length} Found)</span>}
              </h1>
            </div>

            {isLoading || authLoading ? (
              <VolunteerListSkeleton view={view} />
            ) : (
              <VolunteerList
                initialVolunteers={volunteers}
                currentView={view}
                currentSortBy={sortBy}
              />
            )}
          </main>
        </div>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
