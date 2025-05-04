
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
import { AlertCircle, Inbox, MessageSquare, Users } from 'lucide-react';
import { Conversation } from '@/services/messaging'; // Import Conversation type
import { Badge } from '@/components/ui/badge'; // Import Badge
// Removed direct service import, using AuthContext method which calls server action
// import { getUserConversationsAction } from '@/actions/messaging-actions'; // Example if not using context

export default function MessagesPage() {
    const { user, role, loading: authLoading, getUserConversations } = useAuth();
    const router = useRouter();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (user) {
            setLoadingConversations(true);
            try {
                // Use the context method which internally calls the server action
                const convos = await getUserConversations();
                // Convert string dates from server action response if needed
                 const processedConvos = convos.map(convo => ({
                    ...convo,
                    createdAt: typeof convo.createdAt === 'string' ? new Date(convo.createdAt) : convo.createdAt,
                    updatedAt: typeof convo.updatedAt === 'string' ? new Date(convo.updatedAt) : convo.updatedAt,
                    lastMessage: convo.lastMessage ? {
                        ...convo.lastMessage,
                        timestamp: typeof convo.lastMessage.timestamp === 'string' ? new Date(convo.lastMessage.timestamp) : convo.lastMessage.timestamp,
                    } : undefined,
                    // messages array might not be needed in the list view, keeping structure consistent
                    messages: convo.messages?.map(msg => ({
                       ...msg,
                       timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
                   })) || [],
                 }));
                setConversations(processedConvos);
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
                            <Skeleton key={i} className="h-24 w-full" />
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
        // Should be redirected by useEffect, but include fallback UI
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
       if (user.role === 'organization') {
           return convo.volunteerName || `Volunteer (ID: ${convo.volunteerId.substring(0,4)})`; // Use name from convo if available
       } else { // User is volunteer
           return convo.organizationName || `Organization (ID: ${convo.organizationId.substring(0,4)})`; // Use name from convo if available
       }
    };

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <Header />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
                    <Inbox className="h-7 w-7" /> Messaging Hub
                </h1>

                <Card className="shadow-lg border w-full max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Your Conversations</CardTitle>
                        <CardDescription>Messages related to your volunteer applications and activities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {conversations.length > 0 ? (
                            <div className="space-y-4">
                                {conversations.map((convo) => (
                                    <Link key={convo.id} href={`/dashboard/messages/${convo.id}`} passHref>
                                        <div className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-lg text-primary">
                                                   {getOtherPartyName(convo)}
                                                </h3>
                                                 <Badge variant={convo.unreadCount && convo.unreadCount > 0 ? "destructive" : "outline"}>
                                                    {convo.unreadCount && convo.unreadCount > 0 ? `${convo.unreadCount} New` : 'Read'}
                                                 </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Regarding: {convo.opportunityTitle || 'General Inquiry'}
                                            </p>
                                            <p className="text-sm text-foreground truncate">
                                                 <span className="font-medium">{convo.lastMessage?.senderId === user.id ? 'You:' : ''}</span> {convo.lastMessage?.text ?? 'No messages yet.'}
                                             </p>
                                             <p className="text-xs text-muted-foreground text-right mt-1">
                                                 {/* Ensure timestamp is handled correctly */}
                                                 {convo.lastMessage?.timestamp instanceof Date
                                                    ? convo.lastMessage.timestamp.toLocaleString()
                                                    : 'No date'}
                                             </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No conversations started yet.</p>
                                {role === 'volunteer' && (
                                    <Button variant="link" asChild className="mt-2">
                                        <Link href="/">Find Opportunities</Link>
                                    </Button>
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

