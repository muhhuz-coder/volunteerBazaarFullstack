// src/app/how-it-works/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserCheck, Building, Search, FileText, Handshake, Users } from 'lucide-react'; // Re-added Users

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      {/* Adjusted vertical padding */}
      <div className="container mx-auto px-4 py-12 flex-grow">
        {/* Added shadow-xl and margin-bottom */}
        <Card className="w-full max-w-4xl mx-auto shadow-xl border mb-12">
          <CardHeader className="text-center pt-8 pb-4"> {/* Adjusted padding */}
            <CardTitle className="text-3xl font-bold text-primary mb-2">How Volunteer Connect Works</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Simple steps for volunteers and organizations.</CardDescription>
          </CardHeader>
          {/* Added more spacing, adjusted padding */}
          <CardContent className="space-y-12 px-6 md:px-8 pb-10">
            {/* Section for Volunteers */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center justify-center gap-3"> {/* Increased margin and gap */}
                <UserCheck className="h-8 w-8 text-accent" /> {/* Increased icon size */}
                For Volunteers
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-2"> {/* Added spacing between items */}
                <AccordionItem value="item-1" className="border-b rounded-md bg-background/50 px-4"> {/* Added background and padding */}
                  <AccordionTrigger className="text-lg font-medium hover:no-underline py-4"> {/* Adjusted padding */}
                    <Search className="h-5 w-5 mr-3 text-accent flex-shrink-0" /> {/* Increased margin */}
                    <span>1. Discover Opportunities</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed"> {/* Adjusted padding and added leading */}
                    Browse through a wide range of volunteer listings based on your interests, skills, or location. Use our search and filter tools to find the perfect match.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b rounded-md bg-background/50 px-4">
                  <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                    <FileText className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    <span>2. Express Interest (Apply)</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed">
                    Found an opportunity you like? Simply click 'Learn More & Apply' and fill out a short interest form. You can optionally attach relevant documents like a resume.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b rounded-md bg-background/50 px-4">
                  <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                    <Handshake className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    <span>3. Connect with Organizations</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed">
                    Organizations will review your interest form and reach out if it's a good fit. Manage your applications and track their status through your volunteer dashboard.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

             {/* Section for Organizations */}
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center justify-center gap-3">
                <Building className="h-8 w-8 text-accent" /> {/* Increased icon size */}
                For Organizations
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-2">
                 <AccordionItem value="item-org-1" className="border-b rounded-md bg-background/50 px-4">
                   <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                     {/* Using inline SVG for ShieldCheck */}
                     <ShieldCheckIcon className="mr-3 text-accent flex-shrink-0" />
                     <span>1. Register & Post Opportunities</span>
                   </AccordionTrigger>
                   <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed">
                     Sign up as an organization and easily create detailed postings for your volunteer needs. Specify skills required, time commitment, and location.
                   </AccordionContent>
                 </AccordionItem>
                 <AccordionItem value="item-org-2" className="border-b rounded-md bg-background/50 px-4">
                   <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                     <Users className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                     <span>2. Receive Volunteer Interest</span>
                   </AccordionTrigger>
                   <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed">
                     Interested volunteers will submit their details through the platform. Review applications, including any attached documents, directly from your organization dashboard.
                   </AccordionContent>
                 </AccordionItem>
                 <AccordionItem value="item-org-3" className="border-b rounded-md bg-background/50 px-4">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                      <Handshake className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                      <span>3. Connect & Manage Volunteers</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-10 pb-4 leading-relaxed">
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
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
