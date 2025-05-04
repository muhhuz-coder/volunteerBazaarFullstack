
'use client'; // Keep 'use client' if interactions/state remain, but data fetching is removed

// Removed useEffect and useState for opportunities data fetching
import Link from 'next/link';
// Removed getOpportunities import, type import remains
import type { Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OpportunityListProps {
  initialOpportunities: Opportunity[]; // Receive opportunities as a prop
  keywords?: string; // Keep for potential client-side filtering or display logic if needed
  category?: string; // Keep for potential client-side filtering or display logic if needed
}

export function OpportunityList({ initialOpportunities, keywords = '', category = '' }: OpportunityListProps) {
  // Removed useState for opportunities, loading, error
  const opportunities = initialOpportunities; // Use the prop directly

  // Removed useEffect for fetching

  // Loading state is no longer needed here as data is fetched server-side
  // Error state can be handled server-side or passed down if needed

  if (opportunities.length === 0) {
    return <div className="text-center text-muted-foreground mt-8">No opportunities found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {opportunities.map((opportunity) => (
        // Added group class, increased hover shadow, added scale transform
        <Card key={opportunity.id} className="flex flex-col justify-between shadow-md hover:shadow-xl border group transform transition duration-300 ease-in-out hover:scale-[1.02]">
          <CardHeader className="pb-3"> {/* Reduced bottom padding */}
            <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200">{opportunity.title}</CardTitle> {/* Added group-hover effect */}
            <CardDescription className="text-muted-foreground pt-1">{opportunity.organization}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm flex-grow"> {/* Added flex-grow */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.location}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.commitment}</span>
            </div>
            <p className="text-foreground line-clamp-3 pt-3 leading-relaxed">{opportunity.description}</p> {/* Increased top padding, added leading */}
          </CardContent>
          <CardFooter className="pt-4"> {/* Added top padding */}
            {/* Added group-hover effect to arrow */}
            <Button asChild variant="link" className="text-accent p-0 h-auto font-medium group-hover:underline">
              <Link href={`/apply/${opportunity.id}`} className="flex items-center gap-1">
                Learn More & Apply <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Skeleton remains the same as it's used as a fallback in Suspense boundary
function OpportunityListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col justify-between shadow-md border">
           <CardHeader>
             <Skeleton className="h-6 w-3/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
           </CardHeader>
           <CardContent className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
           </CardContent>
           <CardFooter>
             <Skeleton className="h-5 w-32" />
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}
