
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
import { AlertCircle, Inbox, MessageSquare } from 'lucide-react'; // Removed Users icon
import type { Conversation } from '@/services/messaging'; // Import Conversation type
import { Badge } from '@/components/ui/badge'; // Import Badge

// Type for conversations including the dynamically added unreadCount
type ConversationWithUnread = Conversation & { unreadCount: number };

export default function MessagesPage() {
    const { user, role, loading: authLoading, getUserConversations } = useAuth();
    const router = useRouter();

    const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (user) {
            setLoadingConversations(true);
            try {
                // Use the context method which internally calls the server action
                // The action now returns ConversationWithUnread[]
                const convos = await getUserConversations();
                setConversations(convos); // Directly set the result
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
                // Optionally show a toast message here
            } finally {
                setLoadingConversations(false);
            }
        }
    }, [user, getUserConversations]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchMessages();
        }
    }, [user, authLoading, router, fetchMessages]);

    if (authLoading || (user && loadingConversations)) {
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="container mx-auto px-4 py-8 flex-grow">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" /> // Added rounded-lg
                        ))}
                    </div>
                </div>
                <footer className="bg-primary p-4 mt-auto">
                    <Skeleton className="h-4 w-1/3 mx-auto" />
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
                    <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
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
            <div className="container mx-auto px-4 py-12 flex-grow"> {/* Increased padding */}
                <h1 className="text-3xl font-bold mb-8 text-primary flex items-center gap-3"> {/* Increased margin and gap */}
                    <Inbox className="h-8 w-8" /> {/* Increased icon size */}
                    Messaging Hub
                </h1>

                <Card className="shadow-xl border w-full max-w-3xl mx-auto"> {/* Increased shadow */}
                    <CardHeader className="border-b pb-4"> {/* Added bottom border and padding */}
                        <CardTitle className="text-2xl">Your Conversations</CardTitle> {/* Increased size */}
                        <CardDescription>Messages related to your volunteer activities.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0"> {/* Remove default padding */}
                        {conversations.length > 0 ? (
                            <div className="divide-y divide-border"> {/* Use divide for borders */}
                                {conversations.map((convo) => (
                                    <Link key={convo.id} href={`/dashboard/messages/${convo.id}`} passHref>
                                        {/* Apply padding within the link/div */}
                                        <div className="block p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-1.5"> {/* Increased margin */}
                                                <h3 className="font-semibold text-lg text-primary">
                                                   {getOtherPartyName(convo)}
                                                </h3>
                                                 {/* Use destructive for unread, secondary for read */}
                                                 <Badge variant={convo.unreadCount > 0 ? "destructive" : "secondary"} className="text-xs">
                                                     {convo.unreadCount > 0 ? `${convo.unreadCount} New` : 'Read'}
                                                 </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Regarding: {convo.opportunityTitle || 'General Inquiry'}
                                            </p>
                                            <p className="text-sm text-foreground truncate">
                                                 <span className="font-medium">{convo.lastMessage?.senderId === user.id ? 'You:' : ''}</span> {convo.lastMessage?.text ?? 'No messages yet.'}
                                             </p>
                                             <p className="text-xs text-muted-foreground text-right mt-1.5"> {/* Increased margin */}
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
                            <div className="text-center py-12 px-6"> {/* Increased padding */}
                                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" /> {/* Increased size and margin */}
                                <p className="text-muted-foreground text-lg mb-4">No conversations started yet.</p> {/* Increased size and margin */}
                                {role === 'volunteer' && (
                                    <Button variant="default" asChild className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                                        <Link href="/">Find Opportunities</Link>
                                    </Button>
                                )}
                                 {role === 'organization' && (
                                     <p className="text-sm text-muted-foreground mt-2">Accept volunteer applications to start chatting.</p>
                                 )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
            </footer>
        </div>
    );
}

    