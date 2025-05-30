// src/app/page.tsx
import { Header } from '@/components/layout/header';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAppStatisticsAction } from '@/actions/analytics-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Briefcase, BarChart3, ArrowRight, CheckCircle, Search, Handshake } from 'lucide-react'; // Added more icons
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';


async function StatsDisplay() {
  const stats = await getAppStatisticsAction();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      <Card className={cn("border-border shadow-lg", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <CardTitle className="text-base font-semibold text-primary">Total Volunteers</CardTitle>
          <Users className="h-6 w-6 text-accent" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-4xl font-bold text-gradient-primary-accent">{stats.totalVolunteers}</div>
          <p className="text-sm text-muted-foreground">Individuals ready to help</p>
        </CardContent>
      </Card>
      <Card className={cn("border-border shadow-lg", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <CardTitle className="text-base font-semibold text-primary">Total Organizations</CardTitle>
          <Building2 className="h-6 w-6 text-accent" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-4xl font-bold text-gradient-primary-accent">{stats.totalOrganizations}</div>
          <p className="text-sm text-muted-foreground">Groups making an impact</p>
        </CardContent>
      </Card>
      <Card className={cn("border-border shadow-lg", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <CardTitle className="text-base font-semibold text-primary">Total Opportunities</CardTitle>
          <Briefcase className="h-6 w-6 text-accent" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-4xl font-bold text-gradient-primary-accent">{stats.totalOpportunities}</div>
          <p className="text-sm text-muted-foreground">Active volunteer postings</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <Skeleton className="h-5 w-2/5 bg-muted/80" />
            <Skeleton className="h-6 w-6 rounded-full bg-muted/80" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-10 w-1/3 mb-2 bg-muted/70" />
            <Skeleton className="h-4 w-3/4 bg-muted/60" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/90 via-primary to-accent/90 text-primary-foreground py-24 md:py-40 overflow-hidden">
            <div className="absolute inset-0 opacity-10 ">
                <Image
                    src="https://picsum.photos/1920/1080?grayscale&blur=2" 
                    alt="Abstract background pattern"
                    layout="fill"
                    objectFit="cover"
                    priority
                    data-ai-hint="abstract pattern community"
                />
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>
                    Connect. Volunteer. <span className="text-accent-foreground opacity-90">Inspire Change.</span>
                </h1>
                <p className="text-xl md:text-2xl lg:text-3xl mb-12 max-w-4xl mx-auto font-light" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>
                    VolunteerBazaar is your gateway to meaningful volunteer opportunities and dedicated volunteers who are ready to make a difference.
                </p>
                <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90 shadow-xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl py-3 px-8 text-lg font-semibold rounded-full group">
                    <Link href="/opportunities" className="flex items-center gap-2.5">
                        Explore Opportunities <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </Button>
            </div>
        </section>

        {/* Analytics Section */}
        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3.5 mb-12 justify-center">
              <BarChart3 className="h-10 w-10 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold text-primary text-center tracking-tight">Platform Overview</h2>
            </div>
            <Suspense fallback={<StatsSkeleton />}>
              <StatsDisplay />
            </Suspense>
          </div>
        </section>

        {/* How It Works Snippet / Features Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-16 tracking-tight">Why Choose VolunteerBazaar?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                    <div className="p-8 bg-card rounded-xl shadow-xl border-border card-hover-effect flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-6 inline-flex">
                           <Users className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold text-primary mb-3">For Volunteers</h3>
                        <p className="text-muted-foreground leading-relaxed">Discover diverse opportunities, track your impact, and earn rewards for your valuable contributions.</p>
                    </div>
                    <div className="p-8 bg-card rounded-xl shadow-xl border-border card-hover-effect flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-6 inline-flex">
                          <Building2 className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold text-primary mb-3">For Organizations</h3>
                        <p className="text-muted-foreground leading-relaxed">Easily post listings, connect with passionate individuals, and efficiently manage your volunteer team.</p>
                    </div>
                    <div className="p-8 bg-card rounded-xl shadow-xl border-border card-hover-effect flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-6 inline-flex">
                          <Handshake className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold text-primary mb-3">Seamless Connections</h3>
                        <p className="text-muted-foreground leading-relaxed">Our platform makes it simple to find the right match and start making a tangible difference together.</p>
                    </div>
                </div>
                 <Button asChild size="lg" className="mt-16 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl py-3 px-8 text-lg font-semibold rounded-full group">
                    <Link href="/signup" className="flex items-center gap-2.5">
                        Get Started Today <CheckCircle className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </section>

      </main>
      <footer className="bg-primary text-primary-foreground text-center p-6">
        <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
