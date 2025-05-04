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
import { getConversationDetails, sendMessage, type Conversation, type Message } from '@/services/messaging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
       if (names.length === 1) return name[0].toUpperCase();
       return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : '');
    };

     // Function to get display name based on sender ID
     const getSenderName = (senderId: string): string => {
        if (!conversation || !user) return "Unknown";
        if (senderId === user.id) return "You";
        // Look up the other party's name
         if (user.role === 'organization') {
             // Assuming volunteer details might be stored or fetched
             return conversation.volunteerName || `Volunteer (${senderId.substring(0, 4)})`;
         } else { // user is volunteer
             // Assuming org details might be stored or fetched
             return conversation.organizationName || `Organization (${senderId.substring(0, 4)})`;
         }
    };


    const fetchConversationData = useCallback(async () => {
        if (user && conversationId) {
            setLoadingConversation(true);
            try {
                const { conversation: convoDetails, messages: convoMessages } = await getConversationDetails(conversationId, user.id, user.role as 'organization' | 'volunteer');
                setConversation(convoDetails);
                setMessages(convoMessages);
                 // TODO: Mark messages as read here or in the service
            } catch (error) {
                console.error("Failed to fetch conversation details:", error);
                toast({ title: 'Error', description: 'Could not load conversation.', variant: 'destructive' });
                // Optionally redirect back if conversation doesn't exist or access denied
                // router.push('/dashboard/messages');
            } finally {
                setLoadingConversation(false);
            }
        }
    }, [user, conversationId, toast, router]); // Added router to dependencies

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchConversationData();
        }
    }, [user, authLoading, router, fetchConversationData]); // Added fetchConversationData


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
            const sentMessage = await sendMessage(conversationId, user.id, newMessage.trim());
            setMessages(prev => [...prev, sentMessage]); // Add new message optimistically
            setNewMessage(''); // Clear input
        } catch (error) {
            console.error("Failed to send message:", error);
            toast({ title: 'Error', description: 'Could not send message.', variant: 'destructive' });
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
         // Handle case where conversation couldn't be loaded (e.g., not found, access denied)
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
                                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
