
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import type { Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity, ArrowRight, MessageSquare, Loader2 } from 'lucide-react'; // Added MessageSquare, Loader2
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { useToast } from '@/hooks/use-toast'; // Import useToast
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Textarea } from '@/components/ui/textarea'; // Import Textarea

interface OpportunityListProps {
  initialOpportunities: Opportunity[];
  keywords?: string;
  category?: string;
}

export function OpportunityList({ initialOpportunities, keywords = '', category = '' }: OpportunityListProps) {
  const opportunities = initialOpportunities;
  const { user, role, startConversation } = useAuth(); // Get user, role, and startConversation
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  const [contactingOrgId, setContactingOrgId] = useState<string | null>(null); // Track which org is being contacted
  const [messageContent, setMessageContent] = useState('');

  const handleContactOrganization = async (opportunity: Opportunity) => {
     if (!user || role !== 'volunteer') {
       toast({ title: "Login Required", description: "Please log in as a volunteer to contact organizations.", variant: "destructive" });
       return;
     }
      if (!messageContent.trim()) {
        toast({ title: "Message Required", description: "Please enter a message to send.", variant: "destructive" });
        return;
      }

     setContactingOrgId(opportunity.id); // Indicate loading state for this button

     try {
        const result = await startConversation({
            organizationId: opportunity.organizationId,
            organizationName: opportunity.organization, // Pass org name
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title, // Pass opportunity title
            initialMessage: messageContent,
        });

        if (result.success && result.conversation) {
            toast({ title: "Message Sent", description: "Your message has been sent to the organization." });
            setMessageContent(''); // Clear message input
            // Optionally navigate to the new conversation
            router.push(`/dashboard/messages/${result.conversation.id}`);
        } else {
             throw new Error(result.error || "Failed to start conversation.");
        }
     } catch (error: any) {
        console.error("Failed to contact organization:", error);
        toast({ title: "Error", description: error.message || "Could not send message.", variant: "destructive" });
     } finally {
        setContactingOrgId(null); // Reset loading state
     }
  };

  if (opportunities.length === 0) {
    return <div className="text-center text-muted-foreground mt-8">No opportunities found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {opportunities.map((opportunity) => (
        <Card key={opportunity.id} className="flex flex-col justify-between shadow-md hover:shadow-xl border group transform transition duration-300 ease-in-out hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200">{opportunity.title}</CardTitle>
            <CardDescription className="text-muted-foreground pt-1">{opportunity.organization}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm flex-grow">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.location}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{opportunity.commitment}</span>
            </div>
            <p className="text-foreground line-clamp-3 pt-3 leading-relaxed">{opportunity.description}</p>
          </CardContent>
          <CardFooter className="pt-4 flex flex-wrap gap-2 justify-between items-center"> {/* Use flex-wrap and justify-between */}
            {/* Apply Button */}
            <Button asChild variant="link" className="text-accent p-0 h-auto font-medium group-hover:underline">
              <Link href={`/apply/${opportunity.id}`} className="flex items-center gap-1">
                Learn More & Apply <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>

            {/* Contact Organization Button (Visible to Volunteers) */}
            {user && role === 'volunteer' && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button
                     variant="outline"
                     size="sm"
                     disabled={contactingOrgId === opportunity.id}
                   >
                     {contactingOrgId === opportunity.id ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                       <MessageSquare className="h-4 w-4" />
                     )}
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                      {/* Add a DialogTitle for accessibility */}
                     <AlertDialogTitle>Contact {opportunity.organization}</AlertDialogTitle>
                     <AlertDialogDescription>
                       Send a message regarding the "{opportunity.title}" opportunity.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                    <Textarea
                       placeholder="Type your message here..."
                       value={messageContent}
                       onChange={(e) => setMessageContent(e.target.value)}
                       className="min-h-[100px]" // Ensure decent height
                     />
                   <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setMessageContent('')}>Cancel</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={() => handleContactOrganization(opportunity)}
                       disabled={!messageContent.trim() || contactingOrgId === opportunity.id}
                       className="bg-accent hover:bg-accent/90 text-accent-foreground"
                     >
                       {contactingOrgId === opportunity.id ? 'Sending...' : 'Send Message'}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Skeleton remains the same
function OpportunityListSkeleton() {
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
           <CardFooter className="flex justify-between"> {/* Match layout */}
             <Skeleton className="h-5 w-32" />
             <Skeleton className="h-8 w-8 rounded-md" /> {/* Skeleton for contact button */}
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}

    