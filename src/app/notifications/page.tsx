
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import type { UserNotification } from '@/services/notification';
import { getUserNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from '@/actions/notification-actions'; // Import actions
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper function to format time difference (reuse from dropdown)
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


export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    const fetchNotificationsData = useCallback(async () => {
        if (user) {
            setLoadingNotifications(true);
            try {
                // Fetch all notifications (including read) for this page
                const fetchedNotifications = await getUserNotificationsAction(user.id, true);
                setNotifications(fetchedNotifications); // Already sorted by service/action
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                toast({ title: 'Error', description: 'Could not load notifications.', variant: 'destructive' });
            } finally {
                setLoadingNotifications(false);
            }
        }
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchNotificationsData();
        }
    }, [user, authLoading, router, fetchNotificationsData]);

    const handleNotificationClick = async (notification: UserNotification) => {
        if (!user) return;
        // Mark as read on server if not already read
        if (!notification.isRead) {
            const result = await markNotificationReadAction(notification.id, user.id);
            if (result.success && result.notification) {
                // Update local state
                setNotifications(prev => prev.map(n => n.id === notification.id ? result.notification! : n));
            } else {
                // Handle error - maybe show toast
            }
        }
        // Navigate if link exists
        if (notification.link) {
            router.push(notification.link);
        }
    };

     const handleMarkAllRead = async () => {
        if (!user) return;
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
          const result = await markAllNotificationsReadAction(user.id);
          if (result.success) {
            toast({ title: "Notifications", description: `Marked ${result.count} notifications as read.` });
            // Data is already updated locally
          } else {
            toast({ title: "Error", description: "Failed to mark notifications as read.", variant: "destructive" });
            fetchNotificationsData(); // Re-fetch to revert
          }
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark notifications as read.", variant: "destructive" });
            fetchNotificationsData(); // Re-fetch to revert
        }
      };

    // TODO: Implement delete functionality if needed
    const handleDeleteNotification = async (notificationId: string) => {
        if (!user) return;
        // Placeholder: Implement delete action and service if required
        console.log("Delete notification:", notificationId);
        toast({ title: "Info", description: "Delete functionality not yet implemented." });
        // Example:
        // setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // const result = await deleteNotificationAction(notificationId, user.id);
        // Handle result...
    };


    if (authLoading || (user && loadingNotifications)) {
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="container mx-auto px-4 py-8 flex-grow">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
                <footer className="bg-primary p-4 mt-auto">
                    <Skeleton className="h-4 w-1/3 mx-auto" />
                </footer>
            </div>
        );
    }

    if (!user) {
        // Should be redirected by useEffect, but render this as fallback
        return (
            <div className="flex flex-col min-h-screen bg-secondary">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">Redirecting to login...</p>
                </div>
                <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                    <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
                </footer>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;


    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <Header />
            <div className="container mx-auto px-4 py-12 flex-grow">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">Your Notifications</h1>
                     {unreadCount > 0 && (
                        <Button onClick={handleMarkAllRead} variant="outline" size="sm">
                            <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
                        </Button>
                     )}
                </div>

                <Card className="shadow-xl border w-full max-w-3xl mx-auto">
                    <CardHeader className="border-b">
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Updates related to your applications and messages.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-border">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "flex items-start gap-3 p-4 transition-colors",
                                            notification.link ? "cursor-pointer" : "cursor-default",
                                            !notification.isRead ? 'bg-accent/10 hover:bg-accent/20' : 'hover:bg-muted/50'
                                        )}
                                    >
                                        {!notification.isRead && <div className="h-2.5 w-2.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>}
                                        <div className={cn("flex-grow", notification.isRead ? 'pl-[18px]' : '')}> {/* Align text if read */}
                                            <p className={cn("text-sm", !notification.isRead ? 'font-medium' : 'text-muted-foreground')}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {timeAgo(new Date(notification.timestamp))}
                                            </p>
                                        </div>
                                         {/* Optional: Delete button */}
                                         {/* <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                         </Button> */}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6">
                                <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-lg">You have no notifications.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
                <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
            </footer>
        </div>
    );
}
