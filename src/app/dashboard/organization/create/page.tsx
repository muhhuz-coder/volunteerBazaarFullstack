
// src/app/dashboard/organization/create/page.tsx
import { Header } from '@/components/layout/header';
import { OpportunityCreationForm } from '@/components/opportunity-creation-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function CreateOpportunityPage() {
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
            <CardTitle className="text-2xl font-bold text-primary">Create New Volunteer Opportunity</CardTitle>
            <CardDescription>Fill in the details below to post a new volunteer role.</CardDescription>
          </CardHeader>
          <CardContent>
            <OpportunityCreationForm />
          </CardContent>
        </Card>
      </div>
       <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
       </footer>
    </div>
  );
}
