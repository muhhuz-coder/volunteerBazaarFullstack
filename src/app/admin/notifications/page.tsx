'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bell, ArrowLeft, RefreshCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminNotifications() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // This is a placeholder - in a real implementation, you would fetch notifications from your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setNotifications([
        {
          id: 'notif-1',
          type: 'system',
          message: 'Database backup completed successfully',
          timestamp: new Date().toISOString(),
          isRead: false
        },
        {
          id: 'notif-2',
          type: 'user',
          message: 'New user report submitted',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isRead: false
        },
        {
          id: 'notif-3',
          type: 'system',
          message: 'System update available',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          isRead: true
        }
      ]);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast({ title: 'Error', description: error.message || 'Could not load notifications.', variant: 'destructive' });
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        console.log('Redirecting from admin notifications: Not logged in or not admin.');
        router.push('/admin/login');
      } else {
        fetchNotifications();
      }
    }
  }, [user, role, authLoading, router]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    toast({ title: 'Success', description: 'Notification marked as read.' });
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast({ title: 'Success', description: 'All notifications marked as read.' });
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return (
      <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You must be logged in as an admin to access this page.</p>
        </div>
        <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(notif => !notif.isRead);
  const readNotifications = notifications.filter(notif => notif.isRead);

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Bell className="h-6 w-6" /> Notifications
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchNotifications} variant="outline" className="flex items-center gap-2">
              <RefreshCcw size={16} />
              Refresh
            </Button>
            <Button onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
              Mark All Read
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Notifications</span>
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive">{unreadNotifications.length} unread</Badge>
              )}
            </CardTitle>
            <CardDescription>Important system alerts and user reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="unread">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  Unread <Badge variant="secondary">{unreadNotifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  Read <Badge variant="secondary">{readNotifications.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread">
                {loadingNotifications ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : unreadNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {unreadNotifications.map(notification => (
                      <Card key={notification.id} className="bg-card/80 border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{notification.message}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {notification.type === 'system' ? 'System' : 'User'}
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No unread notifications.</p>
                )}
              </TabsContent>

              <TabsContent value="read">
                {loadingNotifications ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : readNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {readNotifications.map(notification => (
                      <Card key={notification.id} className="bg-card/80 border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{notification.message}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {notification.type === 'system' ? 'System' : 'User'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No read notifications.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <footer className="bg-primary text-primary-foreground text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} VolunteerBazaar. All rights reserved.</p>
      </footer>
    </div>
  );
} 