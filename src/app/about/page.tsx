// src/app/about/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar
import { Separator } from '@/components/ui/separator'; // Added Separator
import Image from 'next/image';
import { HandHeart, Target, Users, Code, Bot, Brush, GraduationCap } from 'lucide-react'; // Added icons

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      {/* Adjusted py-12 for consistent vertical padding */}
      <div className="container mx-auto px-4 py-12 flex-grow">
        {/* Added shadow-lg and slight margin-bottom */}
        <Card className="w-full max-w-4xl mx-auto shadow-xl border mb-12">
          <CardHeader className="text-center pt-8 pb-4"> {/* Adjusted padding */}
            <CardTitle className="text-3xl font-bold text-primary mb-2">About Volunteer Connect</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Connecting volunteers with organizations making a difference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 px-6 md:px-8 pb-10"> {/* Adjusted padding and spacing */}
            <div className="relative h-64 w-full rounded-lg overflow-hidden mb-10"> {/* Increased height and margin */}
               <Image
                 src="https://picsum.photos/1000/300"
                 alt="Group of diverse volunteers working together"
                 layout="fill"
                 objectFit="cover"
                 className="opacity-90" // Slightly reduce opacity for overlay effect
                 data-ai-hint="diverse volunteers community work"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
               <h2 className="absolute bottom-5 left-5 text-2xl font-semibold text-white z-10">Our Mission & Vision</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center md:text-left"> {/* Increased gap */}
              <div className="flex flex-col items-center md:items-start">
                <Target className="h-12 w-12 text-accent mb-4" /> {/* Increased margin */}
                <h3 className="text-xl font-semibold text-primary mb-3">Our Mission</h3> {/* Increased margin */}
                <p className="text-muted-foreground leading-relaxed"> {/* Added leading-relaxed */}
                  To bridge the gap between passionate volunteers and impactful organizations, fostering community engagement and positive social change. We aim to make volunteering accessible, rewarding, and easy for everyone.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <HandHeart className="h-12 w-12 text-accent mb-4" /> {/* Increased margin */}
                <h3 className="text-xl font-semibold text-primary mb-3">Our Vision</h3> {/* Increased margin */}
                <p className="text-muted-foreground leading-relaxed"> {/* Added leading-relaxed */}
                  A world where every individual feels empowered to contribute their time and skills to causes they care about, creating stronger, more connected communities.
                </p>
              </div>
            </div>

            <div className="text-center border-t pt-10"> {/* Increased padding */}
              <Users className="h-12 w-12 text-accent mb-4 inline-block" /> {/* Increased margin */}
              <h3 className="text-xl font-semibold text-primary mb-3">Who We Are</h3> {/* Increased margin */}
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"> {/* Added leading-relaxed */}
                Volunteer Connect was founded by a group of community enthusiasts who believe in the power of collective action. We provide a simple, effective platform for non-profits, charities, and community groups to find the help they need, and for volunteers to discover meaningful opportunities.
              </p>
            </div>

            {/* Developer Section */}
            <Separator className="my-8" /> {/* Added margin */}
            <div className="text-center pt-6"> {/* Adjusted padding */}
              <h3 className="text-2xl font-semibold text-primary mb-8">Developed By</h3> {/* Increased margin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Muhammad Huzaifa */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20 shadow-sm"> {/* Increased size, added border */}
                    {/* Placeholder image/icon - replace if available */}
                    {/* <AvatarImage src="/path/to/huzaifa.jpg" alt="Muhammad Huzaifa" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">MH</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg mb-1">Muhammad Huzaifa</h4>
                  <p className="text-accent flex items-center gap-1 text-sm"><Code className="h-4 w-4" /> Backend Developer</p>
                </div>
                {/* Obaida Naeem */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20 shadow-sm">
                    {/* <AvatarImage src="/path/to/obaida.jpg" alt="Obaida Naeem" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">ON</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg mb-1">Obaida Naeem</h4>
                  <p className="text-accent flex items-center gap-1 text-sm"><Bot className="h-4 w-4" /> AI Developer</p>
                </div>
                {/* Love Kumar */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20 shadow-sm">
                     {/* <AvatarImage src="/path/to/love.jpg" alt="Love Kumar" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">LK</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg mb-1">Love Kumar</h4>
                  <p className="text-accent flex items-center gap-1 text-sm"><Brush className="h-4 w-4" /> Frontend Developer</p>
                </div>
              </div>
              <div className="mt-8 text-muted-foreground flex items-center justify-center gap-2 text-sm">
                 <GraduationCap className="h-5 w-5" />
                 <span>FAST University, Karachi</span>
              </div>
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
