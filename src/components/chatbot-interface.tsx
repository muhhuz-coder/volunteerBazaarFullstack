'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/ai/flows/chatbot-flow'; // Import the message type
import { sendMessageToChatbotAction } from '@/actions/chatbot-actions'; // Import the server action
import { useToast } from '@/hooks/use-toast';

export function ChatbotInterface() {
  // Initialize with a welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: "Hi there 👋 I'm VolunteerBazaar Bot! How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      // Use requestAnimationFrame for smoother scrolling after render
      requestAnimationFrame(() => {
         const scrollableViewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
         if (scrollableViewport) {
            scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
            if (!hasScrolled) setHasScrolled(true);
         }
      });
    }
  }, [hasScrolled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessageToChatbotAction({
        message: userMessage.text,
        history: messages, // Send current history
      });

      if (result.success && result.reply) {
        const botMessage: ChatMessage = { role: 'model', text: result.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response.');
      }
    } catch (error: any) {
      console.error('Chatbot error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not connect to the chatbot.',
        variant: 'destructive',
      });
       // Add an error message to the chat
        setMessages((prev) => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-lg shadow-lg overflow-hidden">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-grow p-4 h-[calc(100%-70px)] overflow-y-auto" ref={scrollAreaRef}>
        <div className="flex flex-col space-y-4 min-h-[50px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-end gap-3 max-w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'model' && (
                <Avatar className="h-8 w-8 border border-primary/20 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-lg p-3 text-sm shadow-sm break-words',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {/* Improve text rendering for newlines */}
                {message.text.split('\n').map((line, i) => (
                    <p key={i} className="whitespace-pre-wrap">{line || <>&nbsp;</>}</p>
                ))}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border border-muted-foreground/20 flex-shrink-0">
                  <AvatarFallback className="bg-muted/50 text-muted-foreground">
                     <User size={18}/>
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start">
               <Avatar className="h-8 w-8 border border-primary/20 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              <div className="rounded-lg p-3 text-sm shadow-sm bg-muted text-foreground flex items-center">
                 <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3 bg-background/90 mt-auto">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Ask VolunteerBazaar Bot..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
