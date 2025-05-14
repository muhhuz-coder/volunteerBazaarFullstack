'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Shield, Settings, Database, FileText, RefreshCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getReportedUsersAction, resolveReportAction } from '@/actions/admin-actions';
import type { AdminReport } from '@/services/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const reportData = await getReportedUsersAction();
      setReports(reportData);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast({ title: 'Error', description: error.message || 'Could not load reports.', variant: 'destructive' });
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        console.log('Redirecting from admin dashboard: Not logged in or not admin.');
        router.push('/login');
      } else {
        fetchReports();
      }
    }
  }, [user, role, authLoading, router]);

  const handleResolveReport = async () => {
    if (!selectedReport || !user) return;
    
    setProcessingReportId(selectedReport.id);
    try {
      const result = await resolveReportAction(selectedReport.id, adminNotes, user.id);
      
      if (result.success) {
        toast({ title: 'Success', description: 'Report resolved successfully.' });
        setReports(prev => prev.map(report => 
          report.id === selectedReport.id 
            ? { ...report, status: 'resolved', adminNotes, resolvedBy: user.id, resolvedAt: new Date() }
            : report
        ));
        setSelectedReport(null);
        setAdminNotes('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Error resolving report:', error);
      toast({ title: 'Error', description: error.message || 'Failed to resolve report.', variant: 'destructive' });
    } finally {
      setProcessingReportId(null);
    }
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
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-64 w-full mt-6 rounded-lg" />
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

  const pendingReports = reports.filter(report => report.status === 'pending');
  const resolvedReports = reports.filter(report => report.status === 'resolved');
  const dismissedReports = reports.filter(report => report.status === 'dismissed');

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <Button onClick={fetchReports} variant="outline" className="flex items-center gap-2">
            <RefreshCcw size={16} />
            Refresh Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Total Users</CardTitle>
              <CardDescription>All registered users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">250</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> Reports</CardTitle>
              <CardDescription>User reports requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{pendingReports.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> System Settings</CardTitle>
              <CardDescription>Configure system parameters.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">Manage Settings</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Database Management
            </CardTitle>
            <CardDescription>Manage database operations and backups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full">Backup Database</Button>
              <Button variant="outline" className="w-full">View Logs</Button>
              <Button variant="outline" className="w-full">Clear Cache</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> User Reports
            </CardTitle>
            <CardDescription>Review and manage user reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  Pending <Badge variant="secondary">{pendingReports.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center gap-2">
                  Resolved <Badge variant="secondary">{resolvedReports.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="dismissed" className="flex items-center gap-2">
                  Dismissed <Badge variant="secondary">{dismissedReports.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {loadingReports ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : pendingReports.length > 0 ? (
                  <div className="space-y-4">
                    {pendingReports.map(report => (
                      <Card key={report.id} className="bg-card/80 border">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <CardTitle className="text-lg">Report #{report.id.substring(0, 8)}</CardTitle>
                              <CardDescription>
                                From: {report.reporterDisplayName || 'Unknown'} • 
                                Against: {report.reportedUserDisplayName || 'Unknown'}
                              </CardDescription>
                            </div>
                            <Badge variant="destructive">Pending</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 pb-3">
                          <p><span className="font-medium">Reason:</span> {report.reason}</p>
                          <p><span className="font-medium">Date:</span> {new Date(report.timestamp).toLocaleString()}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-3 border-t">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Report</DialogTitle>
                                <DialogDescription>
                                  Review details and take appropriate action.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Reporter</h4>
                                  <p className="text-sm">{report.reporterDisplayName || 'Unknown'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Reported User</h4>
                                  <p className="text-sm">{report.reportedUserDisplayName || 'Unknown'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Reason</h4>
                                  <p className="text-sm">{report.reason}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Date</h4>
                                  <p className="text-sm">{new Date(report.timestamp).toLocaleString()}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Admin Notes</h4>
                                  <Textarea 
                                    placeholder="Add your notes here..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={handleResolveReport}
                                  disabled={!adminNotes.trim() || processingReportId === report.id}
                                >
                                  {processingReportId === report.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                    </>
                                  ) : (
                                    'Resolve Report'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No pending reports to review.</p>
                )}
              </TabsContent>

              <TabsContent value="resolved">
                {loadingReports ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : resolvedReports.length > 0 ? (
                  <div className="space-y-4">
                    {resolvedReports.map(report => (
                      <Card key={report.id} className="bg-card/80 border">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <CardTitle className="text-lg">Report #{report.id.substring(0, 8)}</CardTitle>
                              <CardDescription>
                                From: {report.reporterDisplayName || 'Unknown'} • 
                                Against: {report.reportedUserDisplayName || 'Unknown'}
                              </CardDescription>
                            </div>
                            <Badge variant="success" className="bg-green-600 text-white">Resolved</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 pb-3">
                          <p><span className="font-medium">Reason:</span> {report.reason}</p>
                          <p><span className="font-medium">Admin Notes:</span> {report.adminNotes}</p>
                          <p><span className="font-medium">Resolved By:</span> Admin #{report.resolvedBy?.substring(0, 8) || 'Unknown'}</p>
                          <p><span className="font-medium">Resolved Date:</span> {report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : 'Unknown'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No resolved reports found.</p>
                )}
              </TabsContent>

              <TabsContent value="dismissed">
                {loadingReports ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : dismissedReports.length > 0 ? (
                  <div className="space-y-4">
                    {dismissedReports.map(report => (
                      <Card key={report.id} className="bg-card/80 border">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <CardTitle className="text-lg">Report #{report.id.substring(0, 8)}</CardTitle>
                              <CardDescription>
                                From: {report.reporterDisplayName || 'Unknown'} • 
                                Against: {report.reportedUserDisplayName || 'Unknown'}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">Dismissed</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 pb-3">
                          <p><span className="font-medium">Reason:</span> {report.reason}</p>
                          <p><span className="font-medium">Admin Notes:</span> {report.adminNotes}</p>
                          <p><span className="font-medium">Dismissed By:</span> Admin #{report.resolvedBy?.substring(0, 8) || 'Unknown'}</p>
                          <p><span className="font-medium">Dismissed Date:</span> {report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : 'Unknown'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No dismissed reports found.</p>
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