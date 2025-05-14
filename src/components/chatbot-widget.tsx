'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotInterface } from '@/components/chatbot-interface';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [useCustomPosition, setUseCustomPosition] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Use useEffect to handle client-side mounting
  useEffect(() => {
    setMounted(true);
    
    // Check if we need to use custom positioning (for mobile especially)
    const checkViewportSize = () => {
      setUseCustomPosition(window.innerHeight < 600 || window.innerWidth < 480);
    };
    
    checkViewportSize();
    window.addEventListener('resize', checkViewportSize);
    
    return () => {
      window.removeEventListener('resize', checkViewportSize);
    };
  }, []);

  // Don't render the popover content until client-side mounted
  if (!mounted) {
    return (
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
        aria-label="Open chatbot"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  const renderChatContent = () => (
    <Card className="flex flex-col h-full w-full border-0 shadow-none rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle className="text-base font-semibold">VolunteerBazaar Bot</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20">
          <X className="h-4 w-4" />
          <span className="sr-only">Close chat</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex overflow-hidden">
        <ChatbotInterface />
      </CardContent>
    </Card>
  );

  // For small screens, we position as a fullscreen modal
  if (useCustomPosition) {
    return (
      <>
        <Button
          ref={buttonRef}
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label="Open chatbot"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
        
        {isOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-[390px] h-[calc(100vh-40px)] max-h-[600px] overflow-hidden flex flex-col">
              {renderChatContent()}
            </div>
          </div>
        )}
      </>
    );
  }

  // For larger screens, use the popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border-0 shadow-2xl rounded-xl z-50 flex flex-col"
        style={{
          position: 'fixed',
          bottom: '6rem',
          right: '1.5rem',
          width: '380px',
          height: '550px',
          maxHeight: 'calc(100vh - 100px)',
          maxWidth: 'calc(100vw - 40px)',
          overflowY: 'hidden'
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {renderChatContent()}
      </PopoverContent>
    </Popover>
  );
}
