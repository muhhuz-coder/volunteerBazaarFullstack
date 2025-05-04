// src/app/contact/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-4xl mx-auto shadow-lg border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary mb-2">Contact Us</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">We'd love to hear from you. Reach out with questions or feedback.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-primary border-b pb-2">Get in Touch</h3>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Email</h4>
                  <a href="mailto:info@volunteerconnect.example" className="text-muted-foreground hover:text-primary transition-colors">
                    info@volunteerconnect.example
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Phone</h4>
                  <span className="text-muted-foreground">(123) 456-7890</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Address</h4>
                  <p className="text-muted-foreground">
                    123 Community Lane<br />
                    Cityville, ST 12345
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" placeholder="Your Name" required className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your Email" required className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" type="text" placeholder="Message Subject" required className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." required rows={5} className="bg-background resize-none" />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Send Message
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
