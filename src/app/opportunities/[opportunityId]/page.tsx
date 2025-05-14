import { getOpportunityByIdAction } from '@/actions/job-board-actions';
import { Header } from '@/components/layout/header';
import { OpportunityVolunteers } from '@/components/opportunity-volunteers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import MapDisplay from '@/components/map-display';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Activity, CalendarClock, CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function OpportunityDetailPage({ params }: { params: { opportunityId: string } }) {
  const { opportunityId } = params;
  const opportunity = await getOpportunityByIdAction(opportunityId);

  if (!opportunity) {
    notFound(); // Show 404 if opportunity not found
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main opportunity information */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">{opportunity.title}</CardTitle>
                <CardDescription>Hosted by {opportunity.organization}</CardDescription>
                {/* Key details */}
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
                  {(opportunity.eventStartDate || opportunity.eventEndDate) && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Event Dates: {opportunity.eventStartDate ? format(new Date(opportunity.eventStartDate), 'PPP') : 'Not specified'}
                        {opportunity.eventEndDate ? ` - ${format(new Date(opportunity.eventEndDate), 'PPP')}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-2 text-primary">Description</h3>
                  <div className="whitespace-pre-wrap">{opportunity.description}</div>
                </div>

                <Separator className="my-6" />

                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-2 text-primary">Requirements</h3>
                  <div className="whitespace-pre-wrap">{opportunity.requirements || 'No specific requirements.'}</div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-center mt-4">
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/apply/${opportunity.id}`}>Apply for This Opportunity</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Map Section */}
            {opportunity.location && (
              <Card className="shadow-lg border mt-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapDisplay address={opportunity.location} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar with volunteers */}
          <div>
            <OpportunityVolunteers opportunityId={opportunityId} />
          </div>
        </div>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
} 