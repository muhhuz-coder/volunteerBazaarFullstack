
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
// Remove direct service imports, use server actions via AuthContext or action imports
// import { getConversationDetails, sendMessage, type Conversation, type Message } from '@/services/messaging';
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

    const getInitials = (name?: string | null): string => {
       if (!name) return 'U';
       const names = name.split(' ');
       if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
       if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
           return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
       }
       return name.length > 0 ? name[0].toUpperCase() : 'U'; // Fallback for single long name or empty strings
    };

     // Function to get display name based on sender ID using conversation details
     const getSenderName = (senderId: string): string => {
        if (!conversation || !user) return "Unknown";
        if (senderId === user.id) return "You";

        if (senderId === conversation.organizationId) {
            return conversation.organizationName || `Organization (${senderId.substring(0, 4)})`;
        } else if (senderId === conversation.volunteerId) {
            return conversation.volunteerName || `Volunteer (${senderId.substring(0, 4)})`;
        }
        return "Unknown"; // Fallback
    };


    const fetchConversationData = useCallback(async () => {
        if (user && conversationId && user.role) { // Ensure role is available
            setLoadingConversation(true);
            try {
                // Call the server action to get details
                const result = await getConversationDetailsAction(conversationId, user.id, user.role);
                if ('error' in result) {
                    throw new Error(result.error);
                }
                setConversation(result.conversation);
                // Convert string timestamps back to Date objects if necessary (action might already do this)
                const processedMessages = result.messages.map(msg => ({
                    ...msg,
                    timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
                }));
                setMessages(processedMessages);
                 // Server action now handles marking as read
            } catch (error: any) {
                console.error("Failed to fetch conversation details:", error);
                toast({ title: 'Error', description: error.message || 'Could not load conversation.', variant: 'destructive' });
                 setConversation(null); // Ensure conversation is null on error
            } finally {
                setLoadingConversation(false);
            }
        } else if (user && !user.role) {
             console.error("User role not set, cannot fetch conversation details.");
             toast({ title: 'Error', description: 'User role not set.', variant: 'destructive' });
             setLoadingConversation(false);
             setConversation(null);
        }
    }, [user, conversationId, toast]); // Removed router dependency as it's not used in fetch logic

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchConversationData();
        }
    }, [user, authLoading, router, fetchConversationData]);


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
             // Call the server action to send the message
             const result = await sendMessageAction(conversationId, user.id, newMessage.trim());

             if (result.success && result.message) {
                 // Convert string timestamp back to Date if necessary
                 const sentMessage = {
                     ...result.message,
                     timestamp: typeof result.message.timestamp === 'string' ? new Date(result.message.timestamp) : result.message.timestamp
                 };
                 setMessages(prev => [...prev, sentMessage]); // Add new message
                 setNewMessage(''); // Clear input
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


    if (authLoading || (user && loadingConversation)) {
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="container mx-auto px-4 py-8 flex-grow">
                    <Skeleton className="h-8 w-48 mb-4" />
                     <Card className="shadow-lg border w-full max-w-2xl mx-auto">
                        <CardHeader>
                             <Skeleton className="h-6 w-3/4" />
                             <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardHeader>
                         <CardContent className="h-96 space-y-4 overflow-y-auto p-4">
                             {[...Array(5)].map((_, i) => (
                               <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                  <Skeleton className="h-10 w-3/5 rounded-lg" />
                               </div>
                             ))}
                         </CardContent>
                         <CardFooter>
                            <Skeleton className="h-16 w-full" />
                         </CardFooter>
                     </Card>
                </div>
                <footer className="bg-primary p-4 mt-auto">
                    <Skeleton className="h-4 w-1/3 mx-auto" />
                </footer>
            </div>
        );
    }

     if (!user) {
        // Redirect handled by useEffect
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

    if (!conversation) {
         // Handle case where conversation couldn't be loaded
         return (
              <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Conversation Not Found</h2>
                  <p className="text-muted-foreground mb-4">Could not load the requested conversation, or you may not have access.</p>
                   <Button asChild>
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
                        {/* Use conversation details for the title */}
                        <CardTitle>Conversation with {getSenderName(user.role === 'organization' ? conversation.volunteerId : conversation.organizationId)}</CardTitle>
                        <CardDescription>Regarding: {conversation.opportunityTitle || 'General Inquiry'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-start gap-3",
                                    msg.senderId === user.id ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.senderId !== user.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                             {/* Use getSenderName and getInitials */}
                                            {getInitials(getSenderName(msg.senderId))}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-lg p-3 text-sm",
                                        msg.senderId === user.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    <p>{msg.text}</p>
                                     <p className={cn(
                                          "text-xs mt-1",
                                          msg.senderId === user.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                                      )}>
                                          {/* Ensure timestamp is a Date object */}
                                         {msg.timestamp instanceof Date
                                             ? msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                                             : 'Invalid Date' // Handle cases where it might still not be a date
                                         }
                                     </p>
                                </div>
                                 {msg.senderId === user.id && (
                                     <Avatar className="h-8 w-8">
                                         <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                             {/* Use getSenderName and getInitials */}
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
