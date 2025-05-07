
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotInterface } from '@/components/chatbot-interface';
import { cn } from '@/lib/utils';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Button is now fixed at the bottom right */}
        <Button
          variant="default" // Use default for better visibility
          size="lg" // Make button larger
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-7 w-7" /> {/* Larger icon */}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top" // Open above the button
        align="end" // Align to the right of the button
        sideOffset={12} // Increased offset from the button
        className="w-[300px] h-[450px] sm:w-[380px] sm:h-[550px] p-0 border-0 shadow-2xl rounded-lg z-50 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
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
      </PopoverContent>
    </Popover>
  );
}
