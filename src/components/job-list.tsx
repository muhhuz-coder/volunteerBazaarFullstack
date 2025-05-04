'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Updated imports: getJobs -> getOpportunities, Job -> Opportunity
import { getOpportunities, type Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Updated icons: DollarSign -> Clock, Briefcase -> Activity
import { MapPin, Clock, Activity, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Renamed props interface
interface OpportunityListProps {
  keywords?: string;
  category?: string;
}

// Renamed component from JobList to OpportunityList
export function OpportunityList({ keywords = '', category = '' }: OpportunityListProps) {
  // Updated state variable name and type
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Renamed function call
    const fetchOpportunities = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch opportunities using the updated service function
        const fetchedOpportunities = await getOpportunities(keywords, category === 'All' ? undefined : category);
        // Update state with opportunities
        setOpportunities(fetchedOpportunities);
      } catch (err) {
         // Updated error message
        console.error('Failed to fetch opportunities:', err);
        setError('Failed to load opportunities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [keywords, category]); // Re-fetch when keywords or category change

  if (loading) {
    // Use updated skeleton component
    return <OpportunityListSkeleton />;
  }

  if (error) {
    return <div className="text-center text-destructive mt-8">{error}</div>;
  }

  // Updated message for no results
  if (opportunities.length === 0) {
    return <div className="text-center text-muted-foreground mt-8">No opportunities found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
       {/* Iterate over opportunities */}
      {opportunities.map((opportunity) => (
        <Card key={opportunity.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 border">
          <CardHeader>
             {/* Display opportunity title and organization */}
            <CardTitle className="text-xl font-semibold text-primary">{opportunity.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{opportunity.organization}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
               {/* Display opportunity location */}
              <span>{opportunity.location}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               {/* Display opportunity category with Activity icon */}
              <Activity className="h-4 w-4" />
              <span>{opportunity.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
               {/* Display opportunity commitment with Clock icon */}
              <Clock className="h-4 w-4" />
              <span>{opportunity.commitment}</span>
            </div>
             {/* Display opportunity description */}
            <p className="text-foreground line-clamp-3 pt-2">{opportunity.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="link" className="text-accent p-0 h-auto">
               {/* Link to the apply page with opportunity ID */}
              <Link href={`/apply/${opportunity.id}`} className="flex items-center gap-1">
                 {/* Updated button text */}
                Learn More & Apply <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Renamed skeleton component
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
              {/* Skeletons for location, category, commitment */}
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              {/* Skeletons for description */}
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
           </CardContent>
           <CardFooter>
              {/* Skeleton for button text */}
             <Skeleton className="h-5 w-32" />
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}
