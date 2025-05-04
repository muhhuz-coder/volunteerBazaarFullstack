
// src/app/dashboard/messages/[conversationId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Conversation, Message } from '@/services/messaging'; // Keep types
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
// Import server actions
import { getConversationDetailsAction, sendMessageAction } from '@/actions/messaging-actions';


export default function ConversationPage() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const conversationId = params.conversationId as string;
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingConversation, setLoadingConversation] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null); // Add error state

    const getInitials = (name?: string | null): string => {
       if (!name) return 'U';
       const names = name.split(' ');
       if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
       if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
           return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
       }
       return name.length > 0 ? name[0].toUpperCase() : 'U';
    };

     // Function to get display name based on sender ID using conversation details
     const getSenderName = (senderId: string): string => {
        if (!conversation || !user) return "Unknown";
        if (senderId === user.id) return "You";

        if (senderId === conversation.organizationId) {
            return conversation.organizationName || `Organization (${conversation.organizationId.substring(0, 4)})`;
        } else if (senderId === conversation.volunteerId) {
            return conversation.volunteerName || `Volunteer (${conversation.volunteerId.substring(0, 4)})`;
        }
        return "Unknown";
    };


    const fetchConversationData = useCallback(async () => {
        if (!user || !conversationId || !user.role) {
            setLoadingConversation(false); // Stop loading if preconditions aren't met
            return;
        }

        setLoadingConversation(true);
        setError(null); // Reset error state
        try {
            const result = await getConversationDetailsAction(conversationId, user.id, user.role);
            if ('error' in result) {
                throw new Error(result.error);
            }
            // Ensure dates are Date objects (actions should return them as such)
            setConversation(result.conversation);
            setMessages(result.messages);
        } catch (error: any) {
            console.error("Failed to fetch conversation details:", error);
            toast({ title: 'Error', description: error.message || 'Could not load conversation.', variant: 'destructive' });
            setError(error.message || 'Could not load conversation.');
            setConversation(null);
            setMessages([]);
        } finally {
            setLoadingConversation(false);
        }
    }, [user, conversationId, toast]); // Removed user.role from deps as it's stable once user is set

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && user.role) { // Ensure role exists before fetching
            fetchConversationData();
        } else if (user && !user.role && !authLoading) {
             // Handle case where user is logged in but role is null (shouldn't normally happen after login/signup)
            setError("User role not set. Cannot load messages.");
            setLoadingConversation(false);
        }
        // Add conversationId to dependency array to refetch if it changes (though unlikely in this setup)
    }, [user, authLoading, router, fetchConversationData, conversationId]);


     // Scroll to bottom when messages change
     useEffect(() => {
         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
     }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !conversationId || !newMessage.trim() || isSending) {
            return;
        }

        setIsSending(true);
        try {
             const result = await sendMessageAction(conversationId, user.id, newMessage.trim());
             if (result.success && result.message) {
                 // Ensure timestamp is a Date object (action should guarantee this)
                 setMessages(prev => [...prev, result.message!]);
                 setNewMessage('');
             } else {
                 throw new Error(result.error || 'Failed to send message.');
             }
        } catch (error: any) {
            console.error("Failed to send message:", error);
            toast({ title: 'Error', description: error.message || 'Could not send message.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };


    if (authLoading || (user && loadingConversation && !error)) { // Show skeleton only if loading and no error
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="container mx-auto px-4 py-8 flex-grow">
                     <Skeleton className="h-8 w-32 mb-4" /> {/* Back button skeleton */}
                     <Card className="shadow-lg border w-full max-w-2xl mx-auto">
                        <CardHeader className="border-b"> {/* Added border */}
                             <Skeleton className="h-6 w-3/4" />
                             <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardHeader>
                         {/* Ensure proper height and padding for scrollable content */}
                         <CardContent className="h-[60vh] space-y-4 overflow-y-auto p-4">
                             {[...Array(5)].map((_, i) => (
                               <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                                  <Skeleton className="h-10 w-3/5 rounded-lg p-3" />
                                  {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                               </div>
                             ))}
                         </CardContent>
                         <CardFooter className="border-t pt-4"> {/* Added border and padding */}
                            {/* More detailed skeleton for input area */}
                            <div className="flex w-full items-center gap-2">
                                <Skeleton className="h-16 flex-grow rounded-md" />
                                <Skeleton className="h-10 w-10 rounded-md" />
                            </div>
                         </CardFooter>
                     </Card>
                </div>
                <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <Skeleton className="h-4 w-1/3 mx-auto" />
                </footer>
            </div>
        );
    }

     // Handle explicit error state
     if (error) {
         return (
              <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Error Loading Conversation</h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                   <Button asChild variant="outline">
                     <Link href="/dashboard/messages">
                       <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
                     </Link>
                   </Button>
                </div>
                 <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
                 </footer>
              </div>
            );
     }


     // Handle user not logged in (should be caught by effect, but good fallback)
     if (!user) {
        return (
             <div className="flex flex-col min-h-screen bg-secondary">
               <Header />
               <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                 <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                 <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
                 <p className="text-muted-foreground">Redirecting...</p>
               </div>
                <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                   <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
                </footer>
             </div>
           );
     }

    // Handle case where loading finished but conversation is still null (and no error string set)
    if (!conversation) {
         return (
              <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Conversation Not Found</h2>
                  <p className="text-muted-foreground mb-4">Could not load the requested conversation details.</p>
                   <Button asChild variant="outline">
                     <Link href="/dashboard/messages">
                       <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
                     </Link>
                   </Button>
                </div>
                 <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
                 </footer>
              </div>
            );
    }


    // Determine the other party's name for the header
    const otherPartyName = getSenderName(user.role === 'organization' ? conversation.volunteerId : conversation.organizationId);

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <Header />
            <div className="container mx-auto px-4 py-8 flex-grow flex flex-col">
                 <Button asChild variant="outline" size="sm" className="mb-4 self-start">
                    <Link href="/dashboard/messages">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
                    </Link>
                  </Button>

                <Card className="shadow-lg border w-full max-w-2xl mx-auto flex-grow flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle>Conversation with {otherPartyName}</CardTitle>
                        <CardDescription>Regarding: {conversation.opportunityTitle || 'General Inquiry'}</CardDescription>
                    </CardHeader>
                     {/* Adjust height dynamically, e.g., using viewport height minus header/footer */}
                    <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 h-[calc(100vh-20rem)]"> {/* Example height */}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-3", // Align items to bottom for better time display
                                    msg.senderId === user.id ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.senderId !== user.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {getInitials(getSenderName(msg.senderId))}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-lg p-3 text-sm shadow-sm", // Added shadow
                                        msg.senderId === user.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    <p>{msg.text}</p>
                                     <p className={cn(
                                          "text-xs mt-1.5", // Increased margin
                                          msg.senderId === user.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                                      )}>
                                          {/* Ensure timestamp is a Date object */}
                                         {msg.timestamp instanceof Date
                                             ? msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                                             : 'Invalid Date'
                                         }
                                     </p>
                                </div>
                                 {msg.senderId === user.id && (
                                     <Avatar className="h-8 w-8">
                                         <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                             {getInitials(getSenderName(msg.senderId))}
                                         </AvatarFallback>
                                     </Avatar>
                                 )}
                            </div>
                        ))}
                         <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                            <Textarea
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-grow resize-none bg-background"
                                rows={1}
                                disabled={isSending}
                                // Handle Shift+Enter for new line, Enter to send
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault(); // Prevent newline on Enter
                                        handleSendMessage(e); // Submit form
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send message</span>
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
            <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
            </footer>
        </div>
    );
}

    