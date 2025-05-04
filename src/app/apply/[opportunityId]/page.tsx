
// Import the specific server action
import { getOpportunityByIdAction } from '@/actions/job-board-actions';
import { Header } from '@/components/layout/header';
import { VolunteerApplicationForm } from '@/components/application-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

// Make the page component async
export default async function ApplyPage({ params }: { params: { opportunityId: string } }) {
  const { opportunityId } = params;

  // Fetch the specific opportunity using the server action
  const opportunity = await getOpportunityByIdAction(opportunityId);

  if (!opportunity) {
    notFound(); // Show 404 if opportunity not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Apply for {opportunity.title}</CardTitle>
            <CardDescription>Submit your interest for the volunteer role at {opportunity.organization}.</CardDescription>
          </CardHeader>
          <CardContent>
            <VolunteerApplicationForm opportunity={opportunity} />
          </CardContent>
        </Card>
      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}

// Optional: generateStaticParams can still use a service or action if needed
// export async function generateStaticParams() {
//   const opportunities = await getOpportunitiesAction(); // Use action if available
//   return opportunities.map((opportunity) => ({
//     opportunityId: opportunity.id,
//   }));
// }
