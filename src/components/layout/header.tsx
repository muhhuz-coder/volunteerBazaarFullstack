// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { HandHeart as AppIcon, LogOut, LayoutDashboard, Info, HelpCircle, Mail, MessageSquare, Star, BarChart3, Edit, Bell, Briefcase, Search, Users, Home, Settings } from 'lucide-react'; 
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
     { href: "/", label: "Home", icon: Home },
     { href: "/opportunities", label: "Opportunities", icon: Search },
     { href: "/volunteers", label: "Volunteers", icon: Users },
     { href: "/about", label: "About Us", icon: Info },
     { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
     { href: "/contact", label: "Contact", icon: Mail },
   ];

   const navLinks = user
     ? [
         { href: "/", label: "Home", icon: Home },
         { href: "/opportunities", label: "Opportunities", icon: Search }, 
         { href: "/volunteers", label: "Volunteers", icon: Users },
         { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
         { href: "/about", label: "About Us", icon: Info },
         { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
         { href: "/contact", label: "Contact", icon: Mail },
       ]
     : baseNavLinks;


  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-gradient-to-r from-primary/90 via-primary to-accent/80 text-primary-foreground shadow-xl sticky top-0 z-40 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 text-xl md:text-2xl font-bold hover:opacity-90 transition-opacity group">
          <AppIcon className="h-8 w-8 md:h-9 md:w-9 text-accent-foreground transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-background via-secondary/80 to-background font-extrabold tracking-tight">VolunteerBazaar</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
           {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild className="text-sm font-medium hover:bg-primary-foreground/15 text-primary-foreground/90 hover:text-primary-foreground relative px-2.5 lg:px-3.5 py-2 rounded-md transition-all duration-200 ease-in-out group">
                <Link href={link.href}>
                  <span className="flex items-center gap-1.5">
                    {link.icon && <link.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
                    {link.label}
                  </span>
                </Link>
              </Button>
           ))}
        </nav>

        <div className="flex items-center gap-2.5 md:gap-3.5">
          
          {user && !loading && <NotificationDropdown />}
          
          {loading ? (
             <Skeleton className="h-10 w-10 rounded-full bg-primary/70" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary-foreground/15 p-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-accent-foreground/50">
                  <Avatar className="h-10 w-10 border-2 border-primary-foreground/60 hover:border-accent-foreground/80 transition-all duration-200">
                    {user.profilePictureUrl ? (
                       <AvatarImage src={user.profilePictureUrl} alt={user.displayName || 'Profile Picture'} className="object-cover"/>
                    ) : (
                      <AvatarFallback className="bg-primary-foreground text-primary font-bold text-sm">
                        {getInitials(user.displayName || user.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal py-3 px-3">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-base font-semibold leading-none truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                     <p className="text-xs leading-none text-muted-foreground/80 capitalize pt-1.5">
                      Role: {role || 'Not Set'}
                    </p>
                     {role === 'volunteer' && user.stats && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 pt-1">
                           <Star className="h-3.5 w-3.5 text-yellow-400" />
                           <span>{user.stats.points ?? 0} Points</span>
                         </div>
                     )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {role ? (
                    <>
                     <DropdownMenuItem asChild className="py-2 px-3 text-sm hover:bg-accent/10 cursor-pointer">
                        <Link href={dashboardPath} className="flex items-center gap-2.5">
                         <LayoutDashboard className="mr-1 h-4 w-4" />
                         <span>Dashboard</span>
                        </Link>
                     </DropdownMenuItem>
                      <DropdownMenuItem asChild className="py-2 px-3 text-sm hover:bg-accent/10 cursor-pointer">
                        <Link href="/profile/edit" className="flex items-center gap-2.5">
                          <Settings className="mr-1 h-4 w-4" />
                          <span>Profile Settings</span>
                        </Link>
                      </DropdownMenuItem>
                     <DropdownMenuItem asChild className="py-2 px-3 text-sm hover:bg-accent/10 cursor-pointer">
                         <Link href="/dashboard/messages" className="flex items-center gap-2.5">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          <span>Messages</span>
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild className="py-2 px-3 text-sm hover:bg-accent/10 cursor-pointer">
                           <Link href="/notifications" className="flex items-center gap-2.5">
                               <Bell className="mr-1 h-4 w-4" />
                               <span>Notifications</span>
                           </Link>
                       </DropdownMenuItem>
                     </>
                 ) : ( 
                     <DropdownMenuItem asChild className="py-2 px-3 text-sm hover:bg-accent/10 cursor-pointer">
                        <Link href="/select-role" className="flex items-center gap-2.5">
                         <LayoutDashboard className="mr-1 h-4 w-4" /> 
                         <span>Complete Profile</span>
                        </Link>
                     </DropdownMenuItem>
                 )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2 px-3 text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="hidden md:flex items-center gap-2.5">
               <Button variant="secondary" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md font-semibold">
                 <Link href="/login">Login</Link>
               </Button>
               <Button variant="outline" size="sm" asChild className="border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground rounded-md font-semibold">
                  <Link href="/signup">Sign Up</Link>
               </Button>
             </div>
          )}

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/15 text-primary-foreground rounded-md">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-card text-card-foreground p-5 flex flex-col shadow-2xl border-l border-border">
                 <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                    <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-primary" onClick={closeMobileMenu}>
                      <AppIcon className="h-7 w-7" />
                      <span className="text-gradient-primary-accent">VolunteerBazaar</span>
                    </Link>
                 </div>
                 <nav className="flex flex-col gap-2.5 mb-auto">
                    {navLinks.map(link => (
                       <Button key={link.href} variant="ghost" asChild className="justify-start text-base py-3 px-3 rounded-md hover:bg-muted/80 group" onClick={closeMobileMenu}>
                         <Link href={link.href} className="flex items-center gap-3.5">
                           {link.icon && <link.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />}
                           <span className="text-foreground transition-colors group-hover:text-primary">{link.label}</span>
                         </Link>
                       </Button>
                    ))}
                 </nav>
                 <div className="mt-6 pt-5 border-t border-border">
                   {user ? (
                     <>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2.5 text-base py-3 px-3 rounded-md hover:bg-muted/80 group" onClick={closeMobileMenu}>
                         <Link href={dashboardPath} className="flex items-center gap-3.5">
                           <LayoutDashboard className="mr-1 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /> <span className="text-foreground transition-colors group-hover:text-primary">Dashboard</span>
                         </Link>
                       </Button>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2.5 text-base py-3 px-3 rounded-md hover:bg-muted/80 group" onClick={closeMobileMenu}>
                         <Link href="/profile/edit" className="flex items-center gap-3.5">
                           <Settings className="mr-1 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /> <span className="text-foreground transition-colors group-hover:text-primary">Profile Settings</span>
                         </Link>
                       </Button>
                       <Button variant="ghost" asChild className="justify-start w-full mb-2.5 text-base py-3 px-3 rounded-md hover:bg-muted/80 group" onClick={closeMobileMenu}>
                          <Link href="/dashboard/messages" className="flex items-center gap-3.5">
                            <MessageSquare className="mr-1 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /> <span className="text-foreground transition-colors group-hover:text-primary">Messages</span>
                          </Link>
                       </Button>
                       <Button variant="ghost" asChild className="justify-start w-full mb-4 text-base py-3 px-3 rounded-md hover:bg-muted/80 group" onClick={closeMobileMenu}>
                         <Link href="/notifications" className="flex items-center gap-3.5"> 
                           <Bell className="mr-1 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /> <span className="text-foreground transition-colors group-hover:text-primary">Notifications</span>
                         </Link>
                       </Button>
                       <Button variant="destructive" size="lg" className="w-full mt-3 py-3 rounded-md text-base" onClick={() => { signOut(); closeMobileMenu(); }}>
                         <LogOut className="mr-2 h-5 w-5" /> Log Out
                       </Button>
                     </>
                   ) : (
                     <div className="flex flex-col gap-3.5">
                       <Button variant="default" asChild className="w-full bg-accent text-accent-foreground py-3 rounded-md text-base font-semibold" onClick={closeMobileMenu}>
                         <Link href="/login">Login</Link>
                       </Button>
                       <Button variant="outline" asChild className="w-full py-3 rounded-md text-base font-semibold" onClick={closeMobileMenu}>
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
