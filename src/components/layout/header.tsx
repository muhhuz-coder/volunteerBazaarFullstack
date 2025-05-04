// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
// Updated icon
import { HandHeart as AppIcon, LogOut, LayoutDashboard, Info, HelpCircle, Mail } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react'; // For mobile menu
import { useState } from 'react';

export function Header() {
  const { user, loading, signOut, role } = useAuth(); // Using mock context values
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return name[0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : '');
  };

  // Determine dashboard path based on updated roles
  const dashboardPath = role === 'organization' ? '/dashboard/organization'
                      : role === 'volunteer' ? '/dashboard/volunteer'
                      : '/select-role'; // Or '/' if prefer home

  const navLinks = [
    { href: "/", label: "Opportunities" },
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/contact", label: "Contact" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold">
           {/* Updated icon and title */}
          <AppIcon className="h-6 w-6 md:h-7 md:w-7" />
          <span>Volunteer Connect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
           {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild className="text-sm font-medium hover:bg-primary-foreground/10">
                <Link href={link.href}>{link.label}</Link>
              </Button>
           ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Auth Section */}
          {loading ? (
             <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary-foreground/10">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary-foreground text-primary font-semibold">
                      {getInitials(user.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
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
                 {role ? (
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="hidden md:flex items-center gap-2">
               <Button variant="secondary" size="sm" asChild>
                 <Link href="/login">Login</Link>
               </Button>
               <Button variant="outline" size="sm" asChild className="text-primary border-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link href="/signup">Sign Up</Link>
               </Button>
             </div>
          )}

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background text-foreground p-4 flex flex-col">
                 <h2 className="text-lg font-semibold mb-4 border-b pb-2">Menu</h2>
                 <nav className="flex flex-col gap-2 mb-6">
                    {navLinks.map(link => (
                       <Button key={link.href} variant="ghost" asChild className="justify-start text-base" onClick={closeMobileMenu}>
                         <Link href={link.href}>{link.label}</Link>
                       </Button>
                    ))}
                 </nav>
                 <div className="mt-auto pt-4 border-t">
                   {user ? (
                     <>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2 text-base" onClick={closeMobileMenu}>
                         <Link href={dashboardPath} className="flex items-center">
                           <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                         </Link>
                       </Button>
                       <Button variant="destructive" size="sm" className="w-full" onClick={() => { signOut(); closeMobileMenu(); }}>
                         <LogOut className="mr-2 h-4 w-4" /> Log Out
                       </Button>
                     </>
                   ) : (
                     <div className="flex flex-col gap-2">
                       <Button variant="secondary" asChild className="w-full" onClick={closeMobileMenu}>
                         <Link href="/login">Login</Link>
                       </Button>
                       <Button variant="outline" asChild className="w-full" onClick={closeMobileMenu}>
                         <Link href="/signup">Sign Up</Link>
                       </Button>
                     </div>
                   )}
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
