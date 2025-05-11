// src/app/dashboard/organization/edit/[opportunityId]/page.tsx
import { Header } from '@/components/layout/header';
import { OpportunityCreationForm } from '@/components/opportunity-creation-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getOpportunityByIdAction } from '@/actions/job-board-actions';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default async function EditOpportunityPage({ params }: { params: { opportunityId: string } }) {
  const { opportunityId } = params;
  
  // Fetch the opportunity details. This is a server component.
  const opportunity = await getOpportunityByIdAction(opportunityId);

  if (!opportunity) {
    notFound(); // Show 404 if opportunity not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow flex flex-col items-center">
        <Button asChild variant="outline" size="sm" className="mb-4 self-start">
          <Link href="/dashboard/organization">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <Card className="w-full max-w-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Edit Volunteer Opportunity</CardTitle>
            <CardDescription>Update the details for "{opportunity.title}".</CardDescription>
          </CardHeader>
          <CardContent>
            <OpportunityCreationForm
              mode="edit"
              initialData={opportunity}
              opportunityId={opportunityId}
            />
          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Optional: Add a loading skeleton component if fetching opportunity takes time
// This would typically be done with React Suspense if getOpportunityByIdAction were a promise
// that Suspense could track, or by handling loading state within this component if it were a client component.
// Since it's a server component and data is awaited, the page only renders once data is ready or notFound is called.
// However, for completeness, a conceptual skeleton for the form might look like this:
function EditOpportunityFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}