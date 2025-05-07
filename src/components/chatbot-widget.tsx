
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
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12 shadow-lg hover:bg-accent/20 focus:ring-2 focus:ring-accent focus:ring-offset-2 fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8} // Added a bit more offset from the trigger
        className="w-[300px] h-[450px] sm:w-[380px] sm:h-[550px] p-0 border-0 shadow-2xl rounded-lg z-50 flex flex-col" // Removed fixed, bottom, right. Relies on Radix for positioning.
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
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

