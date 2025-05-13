// src/app/dashboard/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Inbox, MessageSquare, Search } from 'lucide-react'; // Removed Users icon
import type { Conversation } from '@/services/messaging'; // Import Conversation type
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';

// Type for conversations including the dynamically added unreadCount
type ConversationWithUnread = Conversation & { unreadCount: number };

export default function MessagesPage() {
    const { user, role, loading: authLoading, getUserConversations } = useAuth();
    const router = useRouter();

    const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (user && user.role) {
            setLoadingConversations(true);
            try {
                // Use the context method which internally calls the server action
                // The action now returns ConversationWithUnread[]
                const convos = await getUserConversations();
                setConversations(convos || []); // Handle case if convos is undefined
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
                setConversations([]); // Set empty array on error
            } finally {
                setLoadingConversations(false);
            }
        }
    }, [user, getUserConversations]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && user.role) {
            fetchMessages();
        }
    }, [user, authLoading, router, fetchMessages]);

    if (authLoading || (user && loadingConversations)) {
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="container mx-auto px-4 py-8 flex-grow">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-8 rounded-full bg-primary/20"></div>
                            <div className="h-8 w-48 bg-primary/20 rounded-md"></div>
                        </div>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <div className="h-12 w-3/4 bg-muted/60 rounded-t-lg animate-pulse mb-1"></div>
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-24 w-full rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
                <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <div className="h-4 w-1/3 mx-auto bg-primary-foreground/20 rounded animate-pulse"></div>
                </footer>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">Redirecting to login...</p>
                </div>
                <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
                </footer>
            </div>
        );
    }

    // Determine the other party's name based on conversation details
    const getOtherPartyName = (convo: Conversation): string => {
       if (!user) return "Unknown";
       // Use names stored in the conversation object
       if (user.role === 'organization') {
           return convo.volunteerName || `Volunteer (${convo.volunteerId.substring(0, 4)})`;
       } else { // User is volunteer
           return convo.organizationName || `Organization (${convo.organizationId.substring(0, 4)})`;
       }
    };

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <Header />
            <div className="container mx-auto px-4 py-12 flex-grow"> 
                <h1 className="text-3xl font-bold mb-8 text-primary flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500"> 
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse"></div>
                        <Inbox className="h-8 w-8 relative" /> 
                    </div>
                    <span className="relative">
                        Messaging Hub
                        <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></span>
                    </span>
                </h1>

                <Card className="shadow-xl border w-full max-w-3xl mx-auto"> {/* Increased shadow */}
                    <CardHeader className="border-b pb-4"> {/* Added bottom border and padding */}
                        <CardTitle className="text-2xl">Your Conversations</CardTitle> {/* Increased size */}
                        <CardDescription>Messages related to your volunteer activities.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0"> {/* Remove default padding */}
                        {conversations.length > 0 ? (
                            <div className="divide-y divide-border"> {/* Use divide for borders */}
                                {conversations.map((convo, index) => (
                                    <Link key={convo.id} href={`/dashboard/messages/${convo.id}`} passHref>
                                        {/* Apply padding within the link/div */}
                                        <div className={cn(
                                            "block p-4 hover:bg-muted/80 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-3",
                                            "hover:shadow-md hover:scale-[1.01]",
                                            index === 0 ? "delay-0" : `delay-[${Math.min(index * 75, 500)}ms]`
                                        )}>
                                            <div className="flex justify-between items-start mb-1.5">
                                                <h3 className="font-semibold text-lg text-primary">
                                                   {getOtherPartyName(convo)}
                                                </h3>
                                                 {/* Use destructive for unread, secondary for read */}
                                                 <Badge variant={convo.unreadCount > 0 ? "destructive" : "secondary"} 
                                                     className={cn(
                                                         "text-xs transition-all duration-300",
                                                         convo.unreadCount > 0 && "animate-pulse"
                                                     )}>
                                                     {convo.unreadCount > 0 ? `${convo.unreadCount} New` : 'Read'}
                                                 </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Regarding: {convo.opportunityTitle || 'General Inquiry'}
                                            </p>
                                            <p className="text-sm text-foreground truncate">
                                                 <span className="font-medium">{convo.lastMessage?.senderId === user.id ? 'You:' : ''}</span> {convo.lastMessage?.text ?? 'No messages yet.'}
                                             </p>
                                             <p className="text-xs text-muted-foreground text-right mt-1.5">
                                                 {/* Ensure timestamp is handled correctly */}
                                                 {convo.lastMessage?.timestamp instanceof Date
                                                    ? convo.lastMessage.timestamp.toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) // Format date/time
                                                    : 'No date'}
                                             </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 animate-in fade-in duration-500"> 
                                <div className="relative mx-auto w-24 h-24 mb-6">
                                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-75 duration-1000"></div>
                                    <div className="absolute inset-0 rounded-full bg-primary/10"></div>
                                    <MessageSquare className="h-16 w-16 text-primary/60 mx-auto mt-4 animate-in fade-in-50 zoom-in duration-1000" />
                                </div>
                                <h3 className="text-xl font-semibold text-primary mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-200">No conversations yet</h3>
                                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto animate-in slide-in-from-bottom-2 duration-500 delay-300">
                                    {role === 'volunteer' ? 
                                        "Start connecting with organizations by applying to opportunities." :
                                        "Accept volunteer applications to begin messaging with potential volunteers."}
                                </p>
                                {role === 'volunteer' && (
                                    <Button 
                                        variant="default" 
                                        asChild 
                                        className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-2 duration-500 delay-500"
                                    >
                                        <Link href="/">
                                            <Search className="mr-2 h-4 w-4" />
                                            Find Opportunities
                                        </Link>
                                    </Button>
                                )}
                                {role === 'organization' && (
                                    <p className="text-sm text-muted-foreground mt-2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                        Accept volunteer applications to start chatting.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
            </footer>
        </div>
    );
}

    