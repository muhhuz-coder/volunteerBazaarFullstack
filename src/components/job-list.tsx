
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import Image from 'next/image'; // Import next/image
import type { Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity, ArrowRight, MessageSquare, Loader2, ImageOff } from 'lucide-react'; // Added MessageSquare, Loader2, ImageOff
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Import VisuallyHidden
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
        <Card key={opportunity.id} className={cn(
           "flex flex-col justify-between border group overflow-hidden", // Base card styles
           "card-hover-effect" // Apply hover animation class
           )}>
          {opportunity.imageUrl && opportunity.imageUrl.startsWith('data:image') ? (
             <div className="relative h-40 w-full"> {/* Fixed height container for image */}
                <Image
                  src={opportunity.imageUrl}
                  alt={opportunity.title || 'Opportunity image'}
                  layout="fill"
                  objectFit="cover" // Cover the container
                  className="transition-transform duration-300 group-hover:scale-105" // Zoom effect on hover
                />
             </div>
           ) : (
              <div className="h-40 w-full bg-muted flex items-center justify-center">
                 <ImageOff className="h-10 w-10 text-muted-foreground" />
              </div>
           )}
          <CardHeader className="pb-3 pt-4"> {/* Adjusted padding */}
            <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200">{opportunity.title}</CardTitle>
            <CardDescription className="text-muted-foreground pt-1">{opportunity.organization}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm flex-grow px-6"> {/* Ensure padding */}
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
          <CardFooter className="pt-4 pb-6 px-6 flex flex-wrap gap-2 justify-between items-center"> {/* Use flex-wrap and justify-between, added padding */}
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
                     size="icon"
                     disabled={contactingOrgId === opportunity.id}
                     title="Contact Organization" // Add title for tooltip/accessibility
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
                     {/* Add VisuallyHidden DialogTitle for accessibility */}
                     <AlertDialogTitle>
                        <VisuallyHidden>Contact Organization</VisuallyHidden>
                        Contact {opportunity.organization}
                     </AlertDialogTitle>
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
        <Card key={i} className="flex flex-col justify-between shadow-md border overflow-hidden"> {/* Added overflow-hidden */}
           <Skeleton className="h-40 w-full" /> {/* Skeleton for image */}
           <CardHeader className="pb-3 pt-4">
             <Skeleton className="h-6 w-3/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
           </CardHeader>
           <CardContent className="space-y-3 text-sm flex-grow px-6"> {/* Ensure padding */}
              <div className="flex items-center gap-2">
                 <Skeleton className="h-4 w-4 rounded-full" />
                 <Skeleton className="h-4 w-1/3" />
              </div>
               <div className="flex items-center gap-2">
                 <Skeleton className="h-4 w-4 rounded-full" />
                 <Skeleton className="h-4 w-1/3" />
               </div>
              <div className="flex items-center gap-2">
                 <Skeleton className="h-4 w-4 rounded-full" />
                 <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="pt-3">
                 <Skeleton className="h-4 w-full mb-2" />
                 <Skeleton className="h-4 w-full mb-2" />
                 <Skeleton className="h-4 w-2/3" />
               </div>
           </CardContent>
           <CardFooter className="pt-4 pb-6 px-6 flex justify-between items-center"> {/* Match layout */}
             <Skeleton className="h-5 w-32" />
             <Skeleton className="h-8 w-8 rounded-md" /> {/* Skeleton for contact button */}
           </CardFooter>
        </Card>
      ))}
    </div>
  );
}
