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
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="w-full max-w-4xl mx-auto shadow-lg border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary mb-2">About Volunteer Connect</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Connecting volunteers with organizations making a difference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="relative h-60 w-full rounded-lg overflow-hidden mb-8">
               <Image
                 src="https://picsum.photos/1000/300"
                 alt="Group of diverse volunteers working together"
                 layout="fill"
                 objectFit="cover"
                 data-ai-hint="diverse volunteers community work"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
               <h2 className="absolute bottom-4 left-4 text-2xl font-semibold text-white z-10">Our Mission & Vision</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <Target className="h-12 w-12 text-accent mb-3" />
                <h3 className="text-xl font-semibold text-primary mb-2">Our Mission</h3>
                <p className="text-muted-foreground">
                  To bridge the gap between passionate volunteers and impactful organizations, fostering community engagement and positive social change. We aim to make volunteering accessible, rewarding, and easy for everyone.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <HandHeart className="h-12 w-12 text-accent mb-3" />
                <h3 className="text-xl font-semibold text-primary mb-2">Our Vision</h3>
                <p className="text-muted-foreground">
                  A world where every individual feels empowered to contribute their time and skills to causes they care about, creating stronger, more connected communities.
                </p>
              </div>
            </div>

            <div className="text-center border-t pt-8">
              <Users className="h-12 w-12 text-accent mb-3 inline-block" />
              <h3 className="text-xl font-semibold text-primary mb-2">Who We Are</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Volunteer Connect was founded by a group of community enthusiasts who believe in the power of collective action. We provide a simple, effective platform for non-profits, charities, and community groups to find the help they need, and for volunteers to discover meaningful opportunities.
              </p>
            </div>

            {/* Developer Section */}
            <Separator />
            <div className="text-center pt-8">
              <h3 className="text-2xl font-semibold text-primary mb-6">Developed By</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Muhammad Huzaifa */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-3">
                    {/* Placeholder image/icon - replace if available */}
                    {/* <AvatarImage src="/path/to/huzaifa.jpg" alt="Muhammad Huzaifa" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">MH</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg">Muhammad Huzaifa</h4>
                  <p className="text-accent flex items-center gap-1"><Code className="h-4 w-4" /> Backend Developer</p>
                </div>
                {/* Obaida Naeem */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-3">
                    {/* <AvatarImage src="/path/to/obaida.jpg" alt="Obaida Naeem" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">ON</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg">Obaida Naeem</h4>
                  <p className="text-accent flex items-center gap-1"><Bot className="h-4 w-4" /> AI Developer</p>
                </div>
                {/* Love Kumar */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-3">
                     {/* <AvatarImage src="/path/to/love.jpg" alt="Love Kumar" /> */}
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">LK</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg">Love Kumar</h4>
                  <p className="text-accent flex items-center gap-1"><Brush className="h-4 w-4" /> Frontend Developer</p>
                </div>
              </div>
              <div className="mt-6 text-muted-foreground flex items-center justify-center gap-2">
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
