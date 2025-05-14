'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { Opportunity } from '@/services/job-board';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity, ArrowRight, MessageSquare, Loader2, Briefcase, LayoutGrid, List, Users, Handshake, Star, Eye, CalendarClock, CalendarDays, Info, Sparkles } from 'lucide-react'; // Added Sparkles
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';


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
  { value: 'deadline_asc', label: 'Application Deadline' },
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
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [currentOpportunityForDialog, setCurrentOpportunityForDialog] = useState<Opportunity | null>(null);


  const handleViewChange = (view: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortValue);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };


  const openContactDialog = (opportunity: Opportunity) => {
    if (!user || role !== 'volunteer') {
      toast({ title: "Login Required", description: "Please log in as a volunteer to contact organizations.", variant: "destructive" });
      return;
    }
    setCurrentOpportunityForDialog(opportunity);
    setMessageContent('');
    setShowContactDialog(true);
  };


  const handleContactOrganization = async () => {
     if (!currentOpportunityForDialog || !user || role !== 'volunteer') {
       toast({ title: "Error", description: "An unexpected error occurred or you are not authorized.", variant: "destructive" });
       return;
     }
      if (!messageContent.trim()) {
        toast({ title: "Message Required", description: "Please enter a message to send.", variant: "destructive" });
        return;
      }

     setContactingOrgId(currentOpportunityForDialog.id);

     try {
        const result = await startConversation({
            organizationId: currentOpportunityForDialog.organizationId,
            organizationName: currentOpportunityForDialog.organization,
            opportunityId: currentOpportunityForDialog.id,
            opportunityTitle: currentOpportunityForDialog.title,
            initialMessage: messageContent,
        });

        if (result.success && result.conversation) {
            toast({ title: "Message Sent", description: "Your message has been sent to the organization." });
            setMessageContent('');
            setShowContactDialog(false);
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
    return (
        <div className="text-center text-muted-foreground mt-12 py-16 bg-card rounded-xl border-2 border-dashed border-border shadow-sm flex flex-col items-center justify-center">
            <Info className="h-16 w-16 text-muted-foreground/50 mb-6" />
            <p className="text-xl font-semibold text-foreground mb-2">No Opportunities Found</p>
            <p className="text-base">Try adjusting your search filters or check back later.</p>
      </div>
    );
  }

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => (
    <Card className={cn(
        "flex group overflow-hidden transition-all duration-300 ease-out border border-border rounded-xl", // Consistent rounding and border
        currentView === 'grid' 
            ? 'flex-col card-hover-effect min-w-[320px] w-[320px] md:min-w-[340px] md:w-[340px] scroll-snap-align-start bg-card' // Ensure bg-card for grid
            : 'flex-row items-stretch hover:shadow-xl bg-card w-full' // Ensure bg-card for list, items-stretch
    )}>
      <div className={cn(
          "relative bg-muted/60 flex-shrink-0 overflow-hidden",
          currentView === 'grid' ? 'h-52 w-full rounded-t-xl' : 'h-auto w-2/5 md:w-1/3 rounded-l-xl' // Adjusted width for list, ensure full height for image
      )}>
        {opportunity.imageUrl && (opportunity.imageUrl.startsWith('data:image') || opportunity.imageUrl.startsWith('http')) ? (
          <Image
            src={opportunity.imageUrl}
            alt={opportunity.title || 'Opportunity image'}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="community event charity work"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/80"> {/* Softer placeholder */}
            <Briefcase className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
         {opportunity.pointsAwarded && opportunity.pointsAwarded > 0 && (
           <Badge variant="default" className="absolute top-3 right-3 bg-primary/85 backdrop-blur-sm text-primary-foreground shadow-lg text-xs px-2.5 py-1 rounded-full">
             {opportunity.pointsAwarded} PTS
           </Badge>
         )}
      </div>

      <div className={cn("flex flex-col flex-grow", currentView === 'grid' ? 'p-5' : 'p-5 w-3/5 md:w-2/3')}> {/* Consistent padding */}
        <CardHeader className="p-0 pb-2.5">
          <CardTitle className="text-xl md:text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2 tracking-tight">
            {opportunity.title}
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground pt-1 line-clamp-1">
            by {opportunity.organization}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-2 text-sm md:text-base flex-grow mt-3 text-foreground/90">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4 flex-shrink-0" />
            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 rounded-md">{opportunity.category}</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.commitment}</span>
          </div>
          {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {opportunity.requiredSkills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs font-normal">{skill}</Badge>
                ))}
                {opportunity.requiredSkills.length > 3 && <Badge variant="secondary" className="text-xs font-normal">+{opportunity.requiredSkills.length-3} more</Badge>}
              </div>
            </div>
          )}
          {opportunity.applicationDeadline && (
            <div className="flex items-center gap-2 text-destructive/90 font-medium">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span>Apply by: {format(new Date(opportunity.applicationDeadline), 'MMM d, yyyy')}</span>
            </div>
          )}
          {(opportunity.eventStartDate || opportunity.eventEndDate) && (
            <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">
                    Event: {opportunity.eventStartDate ? format(new Date(opportunity.eventStartDate), 'PPP') : ''}
                    {opportunity.eventEndDate ? ` - ${format(new Date(opportunity.eventEndDate), 'PPP')}` : ''}
                    {!opportunity.eventStartDate && !opportunity.eventEndDate && 'Dates TBD'}
                </span>
            </div>
           )}
          <p className="text-foreground/80 line-clamp-3 pt-2.5 text-sm leading-relaxed">{opportunity.description}</p>
        </CardContent>

        {currentView === 'grid' && ( 
          <CardFooter className="p-0 pt-4 flex flex-wrap gap-2 justify-between items-center border-t border-border mt-4">
            <Button asChild variant="link" className="text-accent p-0 h-auto font-semibold group-hover:underline text-sm rounded-md">
              <Link href={`/opportunities/${opportunity.id}`} className="flex items-center gap-1.5 px-2 py-1">
                View Details <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            {user && role === 'volunteer' && (
                 <AlertDialog open={showContactDialog && currentOpportunityForDialog?.id === opportunity.id} onOpenChange={(open) => { if(!open) {setShowContactDialog(false); setCurrentOpportunityForDialog(null);}}}>
                   <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-md" title="Contact Organization" onClick={() => openContactDialog(opportunity)}>
                       {contactingOrgId === opportunity.id ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <MessageSquare className="h-4.5 w-4.5" />}
                     </Button>
                   </AlertDialogTrigger>
                 </AlertDialog>
            )}
          </CardFooter>
        )}
      </div>

      {currentView === 'list' && ( 
        <div className="w-full md:w-1/3 p-5 border-l border-border flex-shrink-0 space-y-4 bg-secondary/50 rounded-r-xl flex flex-col justify-between">
          <div>
            {opportunity.pointsAwarded && opportunity.pointsAwarded > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</p>
                <p className="text-2xl font-bold text-gradient-primary-accent flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-yellow-400" /> {opportunity.pointsAwarded}
                </p>
              </div>
            )}
            {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                         {opportunity.requiredSkills.slice(0,4).map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {opportunity.requiredSkills.length > 4 && <Badge variant="outline" className="text-xs">+{opportunity.requiredSkills.length - 4} more</Badge>}
                    </div>
                </div>
            )}
             {opportunity.applicationDeadline && (
               <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</p>
                  <p className="text-base font-semibold text-destructive/90 flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" /> {format(new Date(opportunity.applicationDeadline), 'PPP')}
                  </p>
               </div>
             )}
             {(opportunity.eventStartDate || opportunity.eventEndDate) && (
              <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Dates</p>
                  <p className="text-base font-semibold text-primary flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                       {opportunity.eventStartDate ? format(new Date(opportunity.eventStartDate), 'MMM d') : 'TBD'}
                       {opportunity.eventEndDate && opportunity.eventStartDate ? ' - ' : ''}
                       {opportunity.eventEndDate ? format(new Date(opportunity.eventEndDate), 'MMM d, yyyy') : (opportunity.eventStartDate ? `, ${new Date(opportunity.eventStartDate).getFullYear()}` : '')}
                  </p>
              </div>
             )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1.5">
               {[...Array(5)].map((_,i) => <Star key={i} className={cn("h-4 w-4", i < Math.round((opportunity.pointsAwarded || 0) / 20) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40")} />)}
               <span className="ml-1.5">({((opportunity.pointsAwarded || 0) / 20).toFixed(1)} rating)</span>
            </div>
          </div>
          <div className="mt-auto space-y-2.5">
            <Button asChild size="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-base">
              <Link href={`/opportunities/${opportunity.id}`} className="flex items-center justify-center gap-2">
                <Eye className="h-4.5 w-4.5" /> View Details
              </Link>
            </Button>
             {user && role === 'volunteer' && (
                   <AlertDialog open={showContactDialog && currentOpportunityForDialog?.id === opportunity.id} onOpenChange={(open) => { if(!open) {setShowContactDialog(false); setCurrentOpportunityForDialog(null);}}}>
                     <AlertDialogTrigger asChild>
                       <Button variant="outline" size="default" className="w-full mt-1.5 rounded-md text-base" disabled={contactingOrgId === opportunity.id} onClick={() => openContactDialog(opportunity)}>
                         {contactingOrgId === opportunity.id ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <MessageSquare className="h-4.5 w-4.5 mr-2" />}
                          Contact Org
                       </Button>
                     </AlertDialogTrigger>
                   </AlertDialog>
              )}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex items-center rounded-lg bg-card border border-border p-1 shadow-sm">
          <Button
            variant={currentView === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('grid')}
            className={cn("h-9 px-3.5 rounded-md", currentView === 'grid' ? 'bg-primary/10 text-primary shadow-inner' : 'text-muted-foreground hover:bg-muted/50')}
            aria-label="Grid view (horizontal scroll)"
          >
            <LayoutGrid className="h-4.5 w-4.5" /> <span className="ml-2 hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={currentView === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('list')}
            className={cn("h-9 px-3.5 rounded-md", currentView === 'list' ? 'bg-primary/10 text-primary shadow-inner' : 'text-muted-foreground hover:bg-muted/50')}
            aria-label="List view"
          >
            <List className="h-4.5 w-4.5" /> <span className="ml-2 hidden sm:inline">List</span>
          </Button>
        </div>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-auto md:min-w-[220px] h-10 text-sm bg-card border-border shadow-sm rounded-lg focus:ring-2 focus:ring-primary/50">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm py-2">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentView === 'grid' ? (
        <div className="flex overflow-x-auto space-x-6 pb-6 scroll-smooth scroll-snap-x-mandatory hide-scrollbar -mx-2 px-2"> {/* Negative margin to allow full bleed for cards */}
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8"> {/* Increased gap for list view */}
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}

      {currentOpportunityForDialog && user && (
        <AlertDialog open={showContactDialog && currentOpportunityForDialog !== null} onOpenChange={(open) => {
            if (!open) {
                setShowContactDialog(false);
                setCurrentOpportunityForDialog(null); 
            } else {
                setShowContactDialog(true);
            }
        }}>
          <VisuallyHidden><AlertDialogTrigger asChild><Button>Open Dialog</Button></AlertDialogTrigger></VisuallyHidden>
          <AlertDialogContent className="sm:max-w-md rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold text-primary">Contact {currentOpportunityForDialog.organization}</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Send a message regarding "{currentOpportunityForDialog.title}".
                Your name ({user.displayName}) and email will be shared.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="min-h-[140px] bg-background rounded-md text-base p-3 focus:ring-2 focus:ring-primary/50"
              rows={5}
            />
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel className="h-10 rounded-md text-base">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleContactOrganization}
                disabled={!messageContent.trim() || contactingOrgId === currentOpportunityForDialog.id}
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 rounded-md text-base"
              >
                {contactingOrgId === currentOpportunityForDialog.id ? (
                  <> <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" /> Sending... </>
                ) : (
                  'Send Message'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
