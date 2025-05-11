// src/app/about/page.tsx
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { HandHeart, Target, Users, Code, Bot, Brush, GraduationCap, Building } from 'lucide-react'; // Added Building

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-secondary/50 to-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-grow">
        <Card className="w-full max-w-5xl mx-auto shadow-2xl border-border rounded-xl overflow-hidden bg-card">
          <CardHeader className="text-center pt-10 md:pt-12 pb-6 bg-primary/5 border-b border-border">
            <CardTitle className="text-4xl md:text-5xl font-bold text-primary mb-3 tracking-tight">About VolunteerBazaar</CardTitle>
            <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connecting passionate volunteers with impactful organizations to foster community and drive positive change.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 md:space-y-16 p-6 md:p-10">
            <div className="relative h-72 md:h-96 w-full rounded-lg overflow-hidden shadow-lg group">
               <Image
                 src="https://picsum.photos/1200/400"
                 alt="Group of diverse volunteers working together with joy"
                 layout="fill"
                 objectFit="cover"
                 className="opacity-90 transition-transform duration-500 group-hover:scale-105"
                 data-ai-hint="diverse volunteers community work"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6 md:p-8">
                 <h2 className="text-3xl md:text-4xl font-semibold text-white z-10 drop-shadow-md">Our Mission & Vision</h2>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start p-6 bg-secondary/50 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-accent/15 rounded-full mb-5 inline-flex">
                  <Target className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold text-primary mb-3.5">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  To bridge the gap between passionate volunteers and impactful organizations, fostering community engagement and positive social change. We aim to make volunteering accessible, rewarding, and easy for everyone.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start p-6 bg-secondary/50 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                 <div className="p-3 bg-accent/15 rounded-full mb-5 inline-flex">
                    <HandHeart className="h-10 w-10 text-accent" />
                  </div>
                <h3 className="text-2xl font-semibold text-primary mb-3.5">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  A world where every individual feels empowered to contribute their time and skills to causes they care about, creating stronger, more connected communities globally.
                </p>
              </div>
            </div>

            <div className="text-center border-t border-border pt-12 md:pt-16">
              <div className="p-3 bg-primary/10 rounded-full mb-6 inline-flex">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-semibold text-primary mb-5">Who We Are</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed text-lg">
                VolunteerBazaar was founded by a group of community enthusiasts who believe in the power of collective action. We provide a simple, effective platform for non-profits, charities, and community groups to find the help they need, and for volunteers to discover meaningful opportunities.
              </p>
            </div>

            <Separator className="my-10 md:my-12 bg-border/70" />
            <div className="text-center pt-8 md:pt-10">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-10 tracking-tight">Meet the Developers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
                {[
                  { name: "Muhammad Huzaifa", role: "Backend Developer", initials: "MH", icon: Code, imageHint: "developer coding backend" },
                  { name: "Obaida Naeem", role: "AI Developer", initials: "ON", icon: Bot, imageHint: "developer ai machine learning" },
                  { name: "Love Kumar", role: "Frontend Developer", initials: "LK", icon: Brush, imageHint: "developer ui ux design" },
                ].map((dev, index) => {
                  const DevIcon = dev.icon;
                  return (
                    <div key={index} className="flex flex-col items-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                      <Avatar className="h-28 w-28 mb-5 border-4 border-primary/20 shadow-md">
                         {/* Replace with actual images if available, or use picsum with hints */}
                         <AvatarImage src={`https://picsum.photos/seed/${dev.initials}/112/112`} alt={dev.name} data-ai-hint={dev.imageHint}/>
                        <AvatarFallback className="bg-primary/15 text-primary text-4xl font-semibold">
                          {dev.initials}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-semibold text-xl text-foreground mb-1.5">{dev.name}</h4>
                      <p className="text-accent flex items-center gap-1.5 text-sm font-medium">
                        <DevIcon className="h-4.5 w-4.5" /> {dev.role}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-12 text-muted-foreground flex items-center justify-center gap-2.5 text-base">
                 <Building className="h-5 w-5" /> {/* Changed icon to Building for University */}
                 <span>FAST National University of Computer and Emerging Sciences, Karachi</span>
              </div>
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
