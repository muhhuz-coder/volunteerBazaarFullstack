// src/app/contact/page.tsx
'use client'; 

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function ContactPage() {
  const { toast } = useToast(); // Initialize toast

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "Thank you for your message. We will get back to you soon.",
    });
    (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-secondary/50 to-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-grow">
        <Card className="w-full max-w-5xl mx-auto shadow-2xl border-border rounded-xl overflow-hidden bg-card">
          <CardHeader className="text-center pt-10 md:pt-12 pb-6 bg-primary/5 border-b border-border">
             <MessageCircle className="mx-auto h-14 w-14 text-primary mb-3" />
            <CardTitle className="text-4xl md:text-5xl font-bold text-primary mb-3 tracking-tight">Contact Us</CardTitle>
            <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We'd love to hear from you. Reach out with any questions, feedback, or partnership inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 p-6 md:p-10">
            {/* Contact Information */}
            <div className="space-y-8">
              <h3 className="text-2xl font-semibold text-primary border-b border-border pb-4 mb-6">Get in Touch</h3>
              {[
                { icon: Mail, title: "Email", content: "info@volunteerconnect.example", href: "mailto:info@volunteerconnect.example" },
                { icon: Phone, title: "Phone", content: "(123) 456-7890" },
                { icon: MapPin, title: "Address", content: "123 Community Lane\nCityville, ST 12345" },
              ].map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="p-3 bg-accent/15 rounded-full transition-colors duration-300 group-hover:bg-accent/25">
                       <ItemIcon className="h-6 w-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-foreground mb-1">{item.title}</h4>
                      {item.href ? (
                        <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-base leading-relaxed">
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">{item.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-2xl font-semibold text-primary border-b border-border pb-4 mb-8">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="font-medium text-foreground">Name</Label>
                  <Input id="name" type="text" placeholder="Your Full Name" required className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-medium text-foreground">Email</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" required className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject" className="font-medium text-foreground">Subject</Label>
                  <Input id="subject" type="text" placeholder="Message Subject" required className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/30 h-11 text-base rounded-md" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message" className="font-medium text-foreground">Message</Label>
                  <Textarea id="message" placeholder="Your message..." required rows={6} className="bg-background resize-none border-border focus:border-primary focus:ring-2 focus:ring-primary/30 text-base rounded-md p-3" />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out">
                  <Send className="mr-2.5 h-5 w-5" /> Send Message
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-6 mt-auto">
         <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
