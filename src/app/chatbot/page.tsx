
// src/app/chatbot/page.tsx
import { Header } from '@/components/layout/header';
import { ChatbotInterface } from '@/components/chatbot-interface';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react'; // Use MessageCircle for chatbot icon

export default function ChatbotPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow flex flex-col">
        <Card className="w-full max-w-3xl mx-auto shadow-xl border flex flex-col flex-grow mb-12"> {/* Use flex-grow */}
          <CardHeader className="text-center pt-8 pb-4 border-b">
            <CardTitle className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
               <MessageCircle className="h-8 w-8" /> {/* Chatbot Icon */}
               VolunteerBazaar Bot
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Ask questions about volunteering or the platform.</CardDescription>
          </CardHeader>
          {/* Make CardContent grow and contain the chat interface */}
          <CardContent className="p-0 flex-grow flex">
            <ChatbotInterface />
          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
