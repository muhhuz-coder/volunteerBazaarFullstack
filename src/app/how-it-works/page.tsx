// src/app/how-it-works/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserCheck, Building, Search, FileText, Handshake } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-4xl mx-auto shadow-lg border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary mb-2">How Volunteer Connect Works</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Simple steps for volunteers and organizations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {/* Section for Volunteers */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center justify-center gap-2">
                <UserCheck className="h-7 w-7 text-accent" />
                For Volunteers
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-medium">
                    <Search className="h-5 w-5 mr-2 text-accent" />
                    1. Discover Opportunities
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-8">
                    Browse through a wide range of volunteer listings based on your interests, skills, or location. Use our search and filter tools to find the perfect match.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-medium">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    2. Express Interest (Apply)
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-8">
                    Found an opportunity you like? Simply click 'Learn More & Apply' and fill out a short interest form. You can optionally attach relevant documents like a resume.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-medium">
                    <Handshake className="h-5 w-5 mr-2 text-accent" />
                    3. Connect with Organizations
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-8">
                    Organizations will review your interest form and reach out if it's a good fit. Manage your applications and track their status through your volunteer dashboard.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

             {/* Section for Organizations */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center justify-center gap-2">
                <Building className="h-7 w-7 text-accent" />
                For Organizations
              </h2>
              <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="item-org-1">
                   <AccordionTrigger className="text-lg font-medium">
                      {/* Placeholder icon - replace if needed */}
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                     1. Register & Post Opportunities
                   </AccordionTrigger>
                   <AccordionContent className="text-muted-foreground pl-8">
                     Sign up as an organization and easily create detailed postings for your volunteer needs. Specify skills required, time commitment, and location.
                   </AccordionContent>
                 </AccordionItem>
                 <AccordionItem value="item-org-2">
                   <AccordionTrigger className="text-lg font-medium">
                     <Users className="h-5 w-5 mr-2 text-accent" />
                     2. Receive Volunteer Interest
                   </AccordionTrigger>
                   <AccordionContent className="text-muted-foreground pl-8">
                     Interested volunteers will submit their details through the platform. Review applications, including any attached documents, directly from your organization dashboard.
                   </AccordionContent>
                 </AccordionItem>
                 <AccordionItem value="item-org-3">
                    <AccordionTrigger className="text-lg font-medium">
                      <Handshake className="h-5 w-5 mr-2 text-accent" />
                      3. Connect & Manage Volunteers
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-8">
                      Connect with suitable candidates, manage communication, and track your volunteer engagement all in one place. Build your team of dedicated volunteers.
                    </AccordionContent>
                 </AccordionItem>
               </Accordion>
             </div>
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

// Using an inline SVG for the checkmark shield as lucide doesn't have a direct equivalent
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
