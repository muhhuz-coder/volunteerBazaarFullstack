'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getJobs, type Job } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Briefcase, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface JobListProps {
  keywords?: string;
  category?: string;
}

export function JobList({ keywords = '', category = '' }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch jobs using the service function
        const fetchedJobs = await getJobs(keywords, category === 'All' ? undefined : category);
        setJobs(fetchedJobs);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [keywords, category]); // Re-fetch when keywords or category change

  if (loading) {
    return <JobListSkeleton />;
  }

  if (error) {
    return <div className="text-center text-destructive mt-8">{error}</div>;
  }

  if (jobs.length === 0) {
    return <div className="text-center text-muted-foreground mt-8">No jobs found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {jobs.map((job) => (
        <Card key={job.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">{job.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{job.company}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{job.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{job.salary}</span>
            </div>
            <p className="text-foreground line-clamp-3 pt-2">{job.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="link" className="text-accent p-0 h-auto">
              <Link href={`/apply/${job.id}`} className="flex items-center gap-1">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}


function JobListSkeleton() {
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
             <Skeleton className="h-5 w-24" />
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}
