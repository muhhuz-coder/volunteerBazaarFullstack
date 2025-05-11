// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ShieldAlert, UserX, UserCheck, Loader2, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/services/user-service';
import type { UserProfile } from '@/context/AuthContext';
import { getAllReportsAction, updateReportStatusAction } from '@/actions/admin-actions';
import { suspendUserAccount, unsuspendUserAccount } from '@/actions/auth-actions'; // Using actions directly

export default function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // For potential future user management
  const [loadingData, setLoadingData] = useState(true);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (user && role === 'admin') {
      setLoadingData(true);
      try {
        const fetchedReports = await getAllReportsAction();
        // Sort reports by timestamp, newest first
        fetchedReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReports(fetchedReports);
        // TODO: Fetch users if user management is added here, e.g., getAllUsersAction()
      } catch (error: any) {
        console.error('Failed to fetch admin data:', error);
        toast({ title: 'Error', description: error.message || 'Could not load admin data.', variant: 'destructive' });
      } finally {
        setLoadingData(false);
      }
    }
  }, [user, role, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        router.push('/'); // Redirect non-admins
      } else {
        fetchData();
      }
    }
  }, [user, role, authLoading, router, fetchData]);

  const handleUpdateReportStatus = async (reportId: string, status: Report['status']) => {
    if (!user) return;
    setProcessingReportId(reportId);
    try {
      const result = await updateReportStatusAction(reportId, status, user.id);
      if (result.success && result.report) {
        toast({ title: 'Status Updated', description: `Report ${reportId} status changed to ${status}.` });
        setReports(prev => prev.map(r => (r.id === reportId ? result.report! : r)));
      } else {
        throw new Error(result.message || 'Failed to update report status.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingReportId(null);
    }
  };

  const handleSuspendUser = async (userIdToSuspend: string) => {
    if (!user) return;
    setProcessingUserId(userIdToSuspend);
    try {
      const result = await suspendUserAccount(userIdToSuspend, user.id); // Admin's ID for audit
      if (result.success) {
        toast({ title: 'User Suspended', description: `User ${userIdToSuspend} has been suspended.` });
        // Optionally update user status in a local 'users' state if managing users here
        fetchData(); // Re-fetch reports to see if reporter/reported user status changes visibility
      } else {
        throw new Error(result.message || 'Failed to suspend user.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleUnsuspendUser = async (userIdToUnsuspend: string) => {
    if (!user) return;
    setProcessingUserId(userIdToUnsuspend);
    try {
      const result = await unsuspendUserAccount(userIdToUnsuspend, user.id); // Admin's ID
      if (result.success) {
        toast({ title: 'User Unsuspended', description: `User ${userIdToUnsuspend} has been unsuspended.` });
        fetchData();
      } else {
        throw new Error(result.message || 'Failed to unsuspend user.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  };


  if (authLoading || (user && role === 'admin' && loadingData)) {
    return (
      <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
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
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-primary flex items-center">
            <ShieldAlert className="mr-3 h-10 w-10" /> Admin Panel
          </h1>
          {/* Add any global admin actions here, e.g., "System Stats" */}
        </div>

        <Card className="shadow-xl border">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">User Reports ({reports.length})</CardTitle>
            <CardDescription>Review and manage reports submitted by users.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-medium">{report.reportedUserName}</div>
                        <div className="text-xs text-muted-foreground">ID: {report.reportedUserId.substring(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                         <div className="font-medium">{report.reporterName}</div>
                         <div className="text-xs text-muted-foreground">ID: {report.reporterId.substring(0, 8)}...</div>
                      </TableCell>
                      <TableCell>{report.reason}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.details || 'N/A'}</TableCell>
                      <TableCell>{new Date(report.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={report.status}
                          onValueChange={(newStatus) => handleUpdateReportStatus(report.id, newStatus as Report['status'])}
                          disabled={processingReportId === report.id}
                        >
                          <SelectTrigger className="h-8 w-[180px] text-xs bg-card">
                            <SelectValue placeholder="Set status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed_action_taken">Reviewed (Action Taken)</SelectItem>
                            <SelectItem value="reviewed_no_action">Reviewed (No Action)</SelectItem>
                          </SelectContent>
                        </Select>
                         {processingReportId === report.id && <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block" />}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleSuspendUser(report.reportedUserId)}
                          disabled={processingUserId === report.reportedUserId}
                          className="text-xs"
                        >
                          {processingUserId === report.reportedUserId ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                           <span className="ml-1">Suspend</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnsuspendUser(report.reportedUserId)}
                          disabled={processingUserId === report.reportedUserId}
                           className="text-xs"
                        >
                          {processingUserId === report.reportedUserId ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                           <span className="ml-1">Unsuspend</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <ListFilter className="mx-auto h-12 w-12 mb-4" />
                No reports found.
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
             <p className="text-xs text-muted-foreground">Manage user reports and take appropriate actions.</p>
          </CardFooter>
        </Card>

        {/* TODO: Add more admin sections like User Management, System Analytics, etc. */}

      </main>
      <footer className="bg-primary text-primary-foreground text-center p-6 mt-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} VolunteerBazaar Admin. All rights reserved.</p>
      </footer>
    </div>
  );
}
