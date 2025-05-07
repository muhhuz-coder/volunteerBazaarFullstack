// src/app/page.tsx
import { Header } from '@/components/layout/header';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAppStatisticsAction } from '@/actions/analytics-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Briefcase, BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';


async function StatsDisplay() {
  const stats = await getAppStatisticsAction();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className={cn("border", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
          <Users className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalVolunteers}</div>
          <p className="text-xs text-muted-foreground">Individuals ready to help</p>
        </CardContent>
      </Card>
      <Card className={cn("border", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
          <Building2 className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">Groups making an impact</p>
        </CardContent>
      </Card>
      <Card className={cn("border", "card-hover-effect")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
          <Briefcase className="h-5 w-5 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalOpportunities}</div>
          <p className="text-xs text-muted-foreground">Active volunteer postings</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-md border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/4 mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground py-20 md:py-32">
            <div className="absolute inset-0 opacity-20">
                <Image
                    src="https://picsum.photos/1600/800" 
                    alt="Volunteers working together"
                    layout="fill"
                    objectFit="cover"
                    priority
                    data-ai-hint="teamwork community volunteering"
                />
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
                    Connect. Volunteer. Inspire Change.
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto drop-shadow-md">
                    VolunteerBazaar is your gateway to meaningful volunteer opportunities and dedicated volunteers.
                </p>
                <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90 shadow-lg transition-transform hover:scale-105">
                    <Link href="/opportunities" className="flex items-center gap-2">
                        Explore Opportunities <ArrowRight className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </section>

        {/* Analytics Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">Platform Overview</h2>
            </div>
            <Suspense fallback={<StatsSkeleton />}>
              <StatsDisplay />
            </Suspense>
          </div>
        </section>

        {/* How It Works Snippet / Features Section */}
        <section className="py-12 md:py-16 bg-secondary">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-10">Why Choose VolunteerBazaar?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-card rounded-lg shadow-lg border card-hover-effect">
                        <Users className="h-12 w-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">For Volunteers</h3>
                        <p className="text-muted-foreground">Discover diverse opportunities, track your impact, and earn rewards for your contributions.</p>
                    </div>
                    <div className="p-6 bg-card rounded-lg shadow-lg border card-hover-effect">
                        <Building2 className="h-12 w-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">For Organizations</h3>
                        <p className="text-muted-foreground">Easily post listings, connect with passionate individuals, and manage your volunteer team.</p>
                    </div>
                    <div className="p-6 bg-card rounded-lg shadow-lg border card-hover-effect">
                        <Briefcase className="h-12 w-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">Seamless Connections</h3>
                        <p className="text-muted-foreground">Our platform makes it simple to find the right match and start making a difference together.</p>
                    </div>
                </div>
                 <Button asChild size="lg" className="mt-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
                    <Link href="/signup">
                        Get Started Today
                    </Link>
                </Button>
            </div>
        </section>

      </main>
      <footer className="bg-primary text-primary-foreground text-center p-4">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
}
