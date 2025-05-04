// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { Briefcase, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Using mock context
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { user, loading, signOut, role } = useAuth(); // Using mock context values

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return name[0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : '');
  };

  // Determine dashboard path, default to home if role not set yet
  const dashboardPath = role === 'company' ? '/dashboard/company'
                      : role === 'employee' ? '/dashboard/employee'
                      : '/select-role'; // Or '/' if prefer home

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold">
          <Briefcase className="h-6 w-6 md:h-7 md:w-7" />
          <span>Job Board Lite</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Show skeleton only during explicit loading state (like sign in/out) */}
          {loading ? (
             <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    {/* No AvatarImage needed for mock user */}
                    <AvatarFallback className="bg-primary-foreground text-primary font-semibold">
                      {/* Use displayName or derive from email */}
                      {getInitials(user.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {/* Use displayName or email */}
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                     <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                      Role: {role || 'Not Set'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {role ? ( // Only show dashboard link if role is set
                    <DropdownMenuItem asChild>
                       <Link href={dashboardPath}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                       </Link>
                    </DropdownMenuItem>
                 ) : (
                     <DropdownMenuItem asChild>
                        <Link href="/select-role">
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                         <span>Select Role</span>
                        </Link>
                     </DropdownMenuItem>
                 )}
                {/* Add other items like Profile, Settings later */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-primary border-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                 <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
