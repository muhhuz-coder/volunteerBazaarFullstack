// src/app/contact/page.tsx
'use client'; // Add this directive

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react'; // Added Send icon

export default function ContactPage() {
  // Basic handler for form submission simulation
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real app, you would handle form data submission here
    alert('Thank you for your message! We will get back to you soon.');
    // Optionally reset the form
    (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      {/* Adjusted vertical padding */}
      <div className="container mx-auto px-4 py-12 flex-grow">
        {/* Added shadow-xl and margin-bottom */}
        <Card className="w-full max-w-4xl mx-auto shadow-xl border mb-12">
          <CardHeader className="text-center pt-8 pb-4"> {/* Adjusted padding */}
            <CardTitle className="text-3xl font-bold text-primary mb-2">Contact Us</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">We'd love to hear from you. Reach out with questions or feedback.</CardDescription>
          </CardHeader>
          {/* Increased gap, adjusted padding */}
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 px-6 md:px-8 pb-10">
            {/* Contact Information */}
            <div className="space-y-8"> {/* Increased spacing */}
              <h3 className="text-xl font-semibold text-primary border-b pb-3">Get in Touch</h3> {/* Adjusted padding */}
              <div className="flex items-start gap-4"> {/* Increased gap */}
                <Mail className="h-6 w-6 text-accent mt-1 flex-shrink-0" /> {/* Increased size */}
                <div>
                  <h4 className="font-medium text-lg mb-1">Email</h4> {/* Increased size, added margin */}
                  <a href="mailto:info@volunteerconnect.example" className="text-muted-foreground hover:text-primary transition-colors text-base">
                    info@volunteerconnect.example
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-lg mb-1">Phone</h4>
                  <span className="text-muted-foreground text-base">(123) 456-7890</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-lg mb-1">Address</h4>
                  <p className="text-muted-foreground text-base leading-relaxed"> {/* Added leading-relaxed */}
                    123 Community Lane<br />
                    Cityville, ST 12345
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-xl font-semibold text-primary border-b pb-3 mb-8">Send Us a Message</h3> {/* Adjusted padding and margin */}
              <form onSubmit={handleSubmit} className="space-y-5"> {/* Increased spacing */}
                <div className="grid gap-1.5"> {/* Adjusted gap */}
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" placeholder="Your Name" required className="bg-background border-border focus:border-primary focus:ring-primary/50" /> {/* Adjusted styles */}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your Email" required className="bg-background border-border focus:border-primary focus:ring-primary/50" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" type="text" placeholder="Message Subject" required className="bg-background border-border focus:border-primary focus:ring-primary/50" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." required rows={6} className="bg-background resize-none border-border focus:border-primary focus:ring-primary/50" /> {/* Increased rows */}
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold"> {/* Increased padding and font size */}
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Basic Footer */}
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
         <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
