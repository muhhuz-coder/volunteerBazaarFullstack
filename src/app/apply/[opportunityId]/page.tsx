// Renamed from getJobs to getOpportunities, Job -> Opportunity
import { getOpportunities } from '@/services/job-board';
import { Header } from '@/components/layout/header';
// Renamed from ApplicationForm to VolunteerApplicationForm
import { VolunteerApplicationForm } from '@/components/application-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

// Renamed param from jobId to opportunityId
export default async function ApplyPage({ params }: { params: { opportunityId: string } }) {
  // Destructure renamed param
  const { opportunityId } = params;
  // Fetch all opportunities first, then find the specific one.
  // In a real scenario, you'd fetch only the specific opportunity by ID.
  const opportunities = await getOpportunities();
  // Find opportunity by ID
  const opportunity = opportunities.find(o => o.id === opportunityId);

  // Check if opportunity was found
  if (!opportunity) {
    notFound(); // Show 404 if opportunity not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-lg border">
          <CardHeader>
             {/* Updated title and description */}
            <CardTitle className="text-2xl font-bold text-primary">Apply for {opportunity.title}</CardTitle>
            <CardDescription>Submit your interest for the volunteer role at {opportunity.organization}.</CardDescription>
          </CardHeader>
          <CardContent>
             {/* Pass opportunity to VolunteerApplicationForm */}
            <VolunteerApplicationForm opportunity={opportunity} />
          </CardContent>
        </Card>
      </div>
       {/* Basic Footer */}
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}

// Optional: Add generateStaticParams if needed for static site generation
// export async function generateStaticParams() {
//   const opportunities = await getOpportunities();
//   return opportunities.map((opportunity) => ({
//     opportunityId: opportunity.id, // Use opportunityId
//   }));
// }
