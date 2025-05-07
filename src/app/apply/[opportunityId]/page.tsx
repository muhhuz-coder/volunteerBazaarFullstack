
// src/app/apply/[opportunityId]/page.tsx
import { getOpportunityByIdAction } from '@/actions/job-board-actions';
import { Header } from '@/components/layout/header';
import { VolunteerApplicationForm } from '@/components/application-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import MapDisplay from '@/components/map-display'; // Import the MapDisplay component
import { Separator } from '@/components/ui/separator'; // Import Separator
import { MapPin, Clock, Activity, CalendarClock } from 'lucide-react'; // Import icons
import { format } from 'date-fns';

export default async function ApplyPage({ params }: { params: { opportunityId: string } }) {
  const { opportunityId } = params;
  const opportunity = await getOpportunityByIdAction(opportunityId);

  if (!opportunity) {
    notFound(); // Show 404 if opportunity not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow flex justify-center items-start">
        {/* Use a wider card */}
        <Card className="w-full max-w-3xl shadow-lg border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">{opportunity.title}</CardTitle>
            <CardDescription>Apply for the volunteer role at {opportunity.organization}.</CardDescription>
             {/* Add key details */}
             <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{opportunity.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  <span>{opportunity.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{opportunity.commitment}</span>
                </div>
                {opportunity.applicationDeadline && (
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    <span>Apply by: {format(new Date(opportunity.applicationDeadline), 'PPP')}</span>
                  </div>
                )}
              </div>
          </CardHeader>

          {/* Add Map Section */}
          {opportunity.location && (
            <CardContent className="pt-0"> {/* Remove top padding */}
              <Separator className="mb-6" />
              <h3 className="text-lg font-semibold mb-3 text-primary">Location</h3>
              <MapDisplay address={opportunity.location} />
               <Separator className="mt-6 mb-0" /> {/* Add separator below map */}
            </CardContent>
          )}

           <CardContent>
              <h3 className="text-lg font-semibold mb-4 text-primary">Your Application</h3>
              <VolunteerApplicationForm opportunity={opportunity} />
           </CardContent>
        </Card>
      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
       </footer>
    </div>
  );
}
