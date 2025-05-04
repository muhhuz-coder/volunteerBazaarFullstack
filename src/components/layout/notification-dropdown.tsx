
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import type { UserNotification } from '@/services/notification';
import { getUserNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from '@/actions/notification-actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link component
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

// Helper function to format time difference
function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}


export function NotificationDropdown() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch all notifications to display both read and unread initially
      const fetchedNotifications = await getUserNotificationsAction(user.id, true);
      const sortedNotifications = fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(sortedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Toast notification for error can be added here
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) { // Fetch only when logged in and dropdown is open
      fetchNotifications();
    }
     // Optional: Set up polling or WebSocket for real-time updates
     // const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
     // return () => clearInterval(interval);
  }, [user, isOpen, fetchNotifications]);

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!user) return;
    // Mark as read immediately on client for responsiveness
    if (!notification.isRead) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Mark as read on server in background
      await markNotificationReadAction(notification.id, user.id);
    }
    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false); // Close dropdown after click
  };

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
     // Optimistically update UI
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const result = await markAllNotificationsReadAction(user.id);
      if (result.success) {
        toast({ title: "Notifications", description: `Marked ${result.count} notifications as read.` });
        // Optionally re-fetch to confirm, though optimistic update is usually enough
        // fetchNotifications();
      } else {
        toast({ title: "Error", description: "Failed to mark notifications as read.", variant: "destructive" });
        // Revert optimistic update on failure
        fetchNotifications();
      }
    } catch (error) {
        toast({ title: "Error", description: "Failed to mark notifications as read.", variant: "destructive" });
        // Revert optimistic update on failure
        fetchNotifications();
    }
  };

  if (authLoading || !user) {
    return null; // Don't show the bell if loading or not logged in
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary-foreground/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
           {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-1 text-xs text-accent">
               <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
            </Button>
           )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]"> {/* Make content scrollable */}
            <DropdownMenuGroup>
            {isLoading ? (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
                No notifications yet.
                </DropdownMenuItem>
            ) : (
                notifications.map((notification) => (
                <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-2 cursor-pointer ${!notification.isRead ? 'bg-accent/10 hover:bg-accent/20' : 'hover:bg-muted/50'}`} // Highlight unread
                >
                    {!notification.isRead && <div className="h-2 w-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>}
                    <div className={`flex-grow ${notification.isRead ? 'pl-4' : ''}`}>
                        <p className={`text-sm ${!notification.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(new Date(notification.timestamp))}</p>
                    </div>
                </DropdownMenuItem>
                ))
            )}
            </DropdownMenuGroup>
        </ScrollArea>
         {/* Optional: Link to see all notifications */}
         <DropdownMenuSeparator />
         <DropdownMenuItem asChild className="justify-center">
            <Link href="/notifications" className="text-sm text-accent">View All Notifications</Link>
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
