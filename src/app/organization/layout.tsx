'use client';

import { Header } from '@/components/layout/header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  // Redirect if user is not logged in or not an organization
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'organization') {
        router.push('/dashboard/volunteer');
      }
    }
  }, [user, loading, router, role]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 flex-grow">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated or not an organization
  if (!user || role !== 'organization') {
    return null; // useEffect will handle redirect
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {children}
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-6 mt-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
} 