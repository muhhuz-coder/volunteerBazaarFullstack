// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
// Updated icons and added Bell for Notifications, MessageCircle for Chatbot
import { HandHeart as AppIcon, LogOut, LayoutDashboard, Info, HelpCircle, Mail, MessageSquare, Star, BarChart3, Edit, Bell, Briefcase, Search, Users, Home } from 'lucide-react'; // Added Home, Briefcase
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/layout/notification-dropdown';


export function Header() {
  const { user, loading, signOut, role, stats: userStats } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1 && name.length > 0) return name[0].toUpperCase();
    if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : 'U';
  };

  const dashboardPath = role === 'organization' ? '/dashboard/organization'
                      : role === 'volunteer' ? '/dashboard/volunteer'
                      : '/select-role';

   const baseNavLinks = [
     { href: "/", label: "Home", icon: Home }, // Changed icon to Home
     { href: "/opportunities", label: "Opportunities", icon: Briefcase }, // Added Opportunities link
     { href: "/volunteers", label: "Volunteers", icon: Users },
     { href: "/about", label: "About Us", icon: Info },
     { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
     { href: "/contact", label: "Contact", icon: Mail },
   ];

   // Adjusted navLinks logic to ensure "Home" and "Contact" are correctly placed for logged-in users
   const navLinks = user
     ? [
         { href: "/", label: "Home", icon: Home },
         { href: "/opportunities", label: "Opportunities", icon: Briefcase },
         { href: "/volunteers", label: "Volunteers", icon: Users },
         { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
         { href: "/about", label: "About Us", icon: Info },
         { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
         { href: "/contact", label: "Contact", icon: Mail },
       ]
     : baseNavLinks;


  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-primary/95 text-primary-foreground shadow-md sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold">
          <AppIcon className="h-6 w-6 md:h-7 md:w-7" />
          <span>VolunteerBazaar</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2"> {/* Reduced gap slightly */}
           {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild className="text-sm font-medium hover:bg-primary-foreground/10 relative px-2 lg:px-3"> {/* Reduced padding for smaller screens */}
                <Link href={link.href} className="flex items-center gap-1.5">
                   {link.icon && <link.icon className="h-4 w-4" />}
                   {link.label}
                </Link>
              </Button>
           ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          
          {user && !loading && <NotificationDropdown />}
          
          {loading ? (
             <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary-foreground/10 p-0">
                  <Avatar className="h-9 w-9">
                    {user.profilePictureUrl && (
                       <AvatarImage src={user.profilePictureUrl} alt={user.displayName || 'Profile Picture'} />
                    )}
                    <AvatarFallback className="bg-primary-foreground text-primary font-semibold text-xs">
                      {getInitials(user.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                     <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                      Role: {role || 'Not Set'}
                    </p>
                     {role === 'volunteer' && user.stats && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                           <Star className="h-3 w-3 text-yellow-500" />
                           <span>{user.stats.points ?? 0} Points</span>
                         </div>
                     )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {role ? (
                    <>
                     <DropdownMenuItem asChild>
                        <Link href={dashboardPath}>
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                         <span>Dashboard</span>
                        </Link>
                     </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile/edit">
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Profile</span>
                        </Link>
                      </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                         <Link href="/dashboard/messages">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Messages</span>
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                           <Link href="/notifications">
                               <Bell className="mr-2 h-4 w-4" />
                               <span>Notifications</span>
                           </Link>
                       </DropdownMenuItem>
                     </>
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
                         <Link href={link.href} className="flex items-center gap-2">
                           {link.icon && <link.icon className="h-5 w-5" />}
                           {link.label}
                         </Link>
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
                       <Button variant="ghost" asChild className="justify-start w-full mb-2 text-base" onClick={closeMobileMenu}>
                         <Link href="/profile/edit" className="flex items-center">
                           <Edit className="mr-2 h-5 w-5" /> Edit Profile
                         </Link>
                       </Button>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2 text-base" onClick={closeMobileMenu}>
                          <Link href="/dashboard/messages" className="flex items-center">
                            <MessageSquare className="mr-2 h-5 w-5" /> Messages
                          </Link>
                       </Button>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2 text-base" onClick={closeMobileMenu}>
                         <Link href="/notifications" className="flex items-center"> 
                           <Bell className="mr-2 h-5 w-5" /> Notifications
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
