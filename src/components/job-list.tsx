
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity, ArrowRight, MessageSquare, Loader2, ImageOff, Star, Eye, Briefcase, LayoutGrid, List, ShieldCheck, Users, Handshake } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface OpportunityListProps {
  initialOpportunities: Opportunity[];
  keywords?: string;
  category?: string;
  location?: string;
  commitment?: string;
  currentView?: 'grid' | 'list';
  currentSort?: string;
}

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  // Add more sort options as needed, e.g., by points, by organization
];

export function OpportunityList({
  initialOpportunities,
  currentView = 'grid',
  currentSort = 'recent',
}: OpportunityListProps) {
  const opportunities = initialOpportunities;
  const { user, role, startConversation } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [contactingOrgId, setContactingOrgId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');

  const handleViewChange = (view: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortValue);
    router.push(`${pathname}?${params.toString()}`);
  };


  const handleContactOrganization = async (opportunity: Opportunity) => {
     if (!user || role !== 'volunteer') {
       toast({ title: "Login Required", description: "Please log in as a volunteer to contact organizations.", variant: "destructive" });
       return;
     }
      if (!messageContent.trim()) {
        toast({ title: "Message Required", description: "Please enter a message to send.", variant: "destructive" });
        return;
      }

     setContactingOrgId(opportunity.id);

     try {
        const result = await startConversation({
            organizationId: opportunity.organizationId,
            organizationName: opportunity.organization,
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            initialMessage: messageContent,
        });

        if (result.success && result.conversation) {
            toast({ title: "Message Sent", description: "Your message has been sent to the organization." });
            setMessageContent('');
            router.push(`/dashboard/messages/${result.conversation.id}`);
        } else {
             throw new Error(result.error || "Failed to start conversation.");
        }
     } catch (error: any) {
        console.error("Failed to contact organization:", error);
        toast({ title: "Error", description: error.message || "Could not send message.", variant: "destructive" });
     } finally {
        setContactingOrgId(null);
     }
  };

  if (opportunities.length === 0) {
    return <div className="text-center text-muted-foreground mt-8 py-10 bg-card rounded-lg border">No opportunities found matching your criteria. Try adjusting your filters.</div>;
  }

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => (
    <Card className={cn(
        "flex group overflow-hidden transition-all duration-300 ease-in-out border",
        currentView === 'grid' ? 'flex-col card-hover-effect' : 'flex-row items-start hover:shadow-lg'
    )}>
      {/* Image Section */}
      <div className={cn(
          "relative bg-muted flex-shrink-0",
          currentView === 'grid' ? 'h-48 w-full' : 'h-full w-1/3 md:w-1/4' // Adjust width for list view
      )}>
        {opportunity.imageUrl && opportunity.imageUrl.startsWith('data:image') ? (
          <Image
            src={opportunity.imageUrl}
            alt={opportunity.title || 'Opportunity image'}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="community event charity work"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className={cn("flex flex-col flex-grow", currentView === 'grid' ? 'p-4' : 'p-4 w-2/3 md:w-1/2')}>
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {opportunity.title}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground pt-0.5 line-clamp-1">
            {opportunity.organization}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-1.5 text-xs md:text-sm flex-grow">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="h-3.5 w-3.5 flex-shrink-0" />
            <Badge variant="secondary" className="text-xs">{opportunity.category}</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.commitment}</span>
          </div>
          <p className="text-foreground line-clamp-2 pt-2 text-xs leading-relaxed">{opportunity.description}</p>
        </CardContent>

        {currentView === 'grid' && (
          <CardFooter className="p-0 pt-3 flex flex-wrap gap-2 justify-between items-center border-t mt-3">
            <Button asChild variant="link" className="text-accent p-0 h-auto font-medium group-hover:underline text-sm">
              <Link href={`/apply/${opportunity.id}`} className="flex items-center gap-1">
                View Details <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            {user && role === 'volunteer' && (
                <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Contact Organization">
                     {contactingOrgId === opportunity.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Contact {opportunity.organization}</AlertDialogTitle>
                     <AlertDialogDescription>Send a message regarding "{opportunity.title}".</AlertDialogDescription>
                   </AlertDialogHeader>
                    <Textarea placeholder="Type your message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="min-h-[100px]" />
                   <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setMessageContent('')}>Cancel</AlertDialogCancel>
                     <AlertDialogAction onClick={() => handleContactOrganization(opportunity)} disabled={!messageContent.trim() || contactingOrgId === opportunity.id} className="bg-primary hover:bg-primary/90">
                       {contactingOrgId === opportunity.id ? 'Sending...' : 'Send Message'}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            )}
          </CardFooter>
        )}
      </div>

      {/* Right Stats Panel (Inspired by MILKAR, for List View) */}
      {currentView === 'list' && (
        <div className="w-full md:w-1/4 p-4 border-l flex-shrink-0 space-y-3 bg-card/50 md:bg-transparent">
          <div className="text-xs">
            <p className="font-medium text-muted-foreground">Points Awarded</p>
            <p className="text-lg font-bold text-primary">{opportunity.pointsAwarded || 0}</p>
          </div>
          <div className="text-xs">
             <p className="font-medium text-muted-foreground">Category</p>
             <Badge variant="outline" className="mt-1">{opportunity.category}</Badge>
          </div>
           {/* Placeholder for rating */}
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
             {[...Array(5)].map((_,i) => <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round((opportunity.pointsAwarded || 0) / 20) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
             <span className="ml-1">({((opportunity.pointsAwarded || 0) / 20).toFixed(1)} of 5.0)</span>
          </div>
          <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={`/apply/${opportunity.id}`} className="flex items-center justify-center gap-1.5">
              <Eye className="h-4 w-4" /> Visit Details
            </Link>
          </Button>
           {user && role === 'volunteer' && (
                <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="outline" size="sm" className="w-full" disabled={contactingOrgId === opportunity.id}>
                     {contactingOrgId === opportunity.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-1.5" />}
                      Contact Org
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Contact {opportunity.organization}</AlertDialogTitle>
                     <AlertDialogDescription>Send a message regarding "{opportunity.title}".</AlertDialogDescription>
                   </AlertDialogHeader>
                    <Textarea placeholder="Type your message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="min-h-[100px]" />
                   <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setMessageContent('')}>Cancel</AlertDialogCancel>
                     <AlertDialogAction onClick={() => handleContactOrganization(opportunity)} disabled={!messageContent.trim() || contactingOrgId === opportunity.id} className="bg-primary hover:bg-primary/90">
                       {contactingOrgId === opportunity.id ? 'Sending...' : 'Send Message'}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            )}
        </div>
      )}
    </Card>
  );

  return (
    <>
      {/* Sort and View Toggle Controls */}
      <div className="mb-6 flex flex-wrap gap-2 justify-end items-center">
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-auto md:w-[180px] h-9 text-sm bg-card">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md bg-card border p-0.5">
          <Button
            variant={currentView === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('grid')}
            className={cn("h-8 px-3", currentView === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={currentView === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('list')}
            className={cn("h-8 px-3", currentView === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${currentView === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </>
  );
}

// Skeleton component is now part of page.tsx to receive the view prop
// This ensures the skeleton matches the view being loaded.
// The skeleton in page.tsx has been updated to reflect this new card design.
