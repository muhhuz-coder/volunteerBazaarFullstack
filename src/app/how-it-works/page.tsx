// src/app/how-it-works/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserCheck, Building, Search, FileText, Handshake, Users, ListChecks, UserPlus, MessagesSquare, Award, HelpCircle } from 'lucide-react';

// Inline SVG for ShieldCheckIcon if not available elsewhere
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);


export default function HowItWorksPage() {
  const volunteerSteps = [
    { id: "v-step1", title: "Discover Opportunities", icon: Search, description: "Browse a wide range of volunteer listings. Use our search and filter tools to find roles matching your interests, skills, and location." },
    { id: "v-step2", title: "Express Interest (Apply)", icon: FileText, description: "Found an opportunity you like? Click 'Learn More & Apply' and fill out a short interest form. Optionally attach relevant documents like a resume or cover letter." },
    { id: "v-step3", title: "Connect & Communicate", icon: MessagesSquare, description: "Organizations will review your application. If it’s a match, they’ll contact you via our secure messaging system to coordinate next steps." },
    { id: "v-step4", title: "Volunteer & Earn Rewards", icon: Award, description: "Participate in activities, log your hours, and get rated by organizations. Earn points and badges for your contributions and climb the leaderboard!" },
  ];

  const organizationSteps = [
    { id: "o-step1", title: "Register & Post Opportunities", icon: UserPlus, description: "Sign up as an organization and easily create detailed postings for your volunteer needs. Specify required skills, time commitment, location, and event dates." },
    { id: "o-step2", title: "Receive & Review Applications", icon: ListChecks, description: "Interested volunteers will submit their details through the platform. Review applications, including any attached documents, directly from your organization dashboard." },
    { id: "o-step3", title: "Connect & Manage Volunteers", icon: Handshake, description: "Accept suitable candidates, manage communication via secure messaging, and track volunteer attendance and performance for your activities." },
    { id: "o-step4", title: "Recognize Contributions", icon: Award, description: "After an activity, record volunteer attendance, log their hours, and provide ratings. This helps volunteers build their profile and earn rewards." },
  ];
  
  const securityGuidelines = [
    { title: "Profile Verification (Future)", description: "We aim to implement verification processes for organizations to enhance trust and safety on the platform." },
    { title: "Secure Communication", description: "All messages between volunteers and organizations are exchanged through our secure in-app messaging system. Avoid sharing personal contact information until you are comfortable." },
    { title: "Data Privacy", description: "We are committed to protecting your personal information. Review our Privacy Policy for details on how we collect, use, and safeguard your data." },
    { title: "Opportunity Vetting (Future)", description: "While we encourage legitimate postings, we plan to introduce measures to vet opportunities for authenticity." },
    { title: "Reporting Concerns", description: "If you encounter any suspicious activity or inappropriate content, please report it to us immediately through the contact page or a dedicated reporting feature (to be implemented)." },
    { title: "Password Security", description: "Choose a strong, unique password for your VolunteerBazaar account and keep it confidential. Do not share your password with anyone." },
    { title: "Earning Badges", description: "Badges are awarded automatically for various achievements, such as logging specific numbers of volunteer hours (e.g., 10 Hour Hero, 25 Hour Champion, 50 Hour Superstar, 100 Hour Legend). Keep an eye on your dashboard for new badges!" },
  ];


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-secondary/50 to-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-grow">
        <Card className="w-full max-w-5xl mx-auto shadow-2xl border-border rounded-xl overflow-hidden bg-card">
          <CardHeader className="text-center pt-10 md:pt-12 pb-6 bg-primary/5 border-b border-border">
             <HelpCircle className="mx-auto h-14 w-14 text-primary mb-3" />
            <CardTitle className="text-4xl md:text-5xl font-bold text-primary mb-3 tracking-tight">How VolunteerBazaar Works</CardTitle>
            <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps for volunteers and organizations to connect and make an impact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 md:space-y-16 p-6 md:p-10">
            
            {/* Section for Volunteers */}
            <section>
              <h2 className="text-3xl font-semibold text-primary mb-8 flex items-center justify-center md:justify-start gap-3.5">
                <div className="p-2.5 bg-accent/15 rounded-full inline-flex">
                  <UserCheck className="h-8 w-8 text-accent" />
                </div>
                For Volunteers
              </h2>
              <Accordion type="single" collapsible defaultValue="v-step1" className="w-full space-y-3">
                {volunteerSteps.map(step => {
                  const StepIcon = step.icon;
                  return (
                    <AccordionItem key={step.id} value={step.id} className="border border-border rounded-lg bg-background/70 shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="text-lg md:text-xl font-medium hover:no-underline py-4 px-5 text-left">
                        <div className="flex items-center gap-3">
                          <StepIcon className="h-6 w-6 text-accent flex-shrink-0" />
                          <span>{step.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-14 pr-5 pb-5 leading-relaxed text-base">
                        {step.description}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </section>

            {/* Section for Organizations */}
            <section>
              <h2 className="text-3xl font-semibold text-primary mb-8 flex items-center justify-center md:justify-start gap-3.5">
                 <div className="p-2.5 bg-accent/15 rounded-full inline-flex">
                    <Building className="h-8 w-8 text-accent" />
                  </div>
                For Organizations
              </h2>
              <Accordion type="single" collapsible defaultValue="o-step1" className="w-full space-y-3">
                {organizationSteps.map(step => {
                  const StepIcon = step.icon;
                  return (
                    <AccordionItem key={step.id} value={step.id} className="border border-border rounded-lg bg-background/70 shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="text-lg md:text-xl font-medium hover:no-underline py-4 px-5 text-left">
                        <div className="flex items-center gap-3">
                          <StepIcon className="h-6 w-6 text-accent flex-shrink-0" />
                          <span>{step.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-14 pr-5 pb-5 leading-relaxed text-base">
                        {step.description}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </section>

            {/* Security and Best Practices Section */}
            <section>
              <h2 className="text-3xl font-semibold text-primary mb-8 flex items-center justify-center md:justify-start gap-3.5">
                 <div className="p-2.5 bg-primary/10 rounded-full inline-flex">
                    <ShieldCheckIcon className="h-8 w-8 text-primary" />
                  </div>
                Safety & Best Practices
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {securityGuidelines.map((item, index) => (
                    <AccordionItem key={`sg-${index}`} value={`sg-item-${index}`} className="border border-border rounded-lg bg-background/70 shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="text-lg md:text-xl font-medium hover:no-underline py-4 px-5 text-left">
                        <div className="flex items-center gap-3">
                           {/* Placeholder for specific icons if needed, default to Shield */}
                           <ShieldCheckIcon className="h-6 w-6 text-primary/70 flex-shrink-0" />
                          <span>{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-14 pr-5 pb-5 leading-relaxed text-base">
                        {item.description}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </section>


          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-6 mt-auto">
         <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}

