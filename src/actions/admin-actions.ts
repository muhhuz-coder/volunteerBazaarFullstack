// src/actions/admin-actions.ts
'use server';

import { initializeDb, getUserById } from '@/lib/db-mysql';
import type { AdminReport } from '@/services/admin';
import type { UserProfile } from '@/context/AuthContext'; // To enrich reported user info

// Initialize the database
initializeDb();

/**
 * Server action for an admin to get all reported users/content.
 * Optionally enriches reports with basic user info.
 */
export async function getReportedUsersAction(): Promise<AdminReport[]> {
  console.log('Admin Action: Getting all reported users.');
  try {
    // TODO: Implement getReports function in db-mysql.ts to get reports from the database
    // For now, return an empty array as placeholder
    const reports: AdminReport[] = [];
    
    // Enrich reports with user display names
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      // Get reporter user information
      const reporter = await getUserById(report.reporterId);
      const reportedUser = await getUserById(report.reportedUserId);
      
      return {
        ...report,
        reporterDisplayName: reporter?.displayName || `User (${report.reporterId.substring(0,4)})`,
        reportedUserDisplayName: reportedUser?.displayName || `User (${report.reportedUserId.substring(0,4)})`,
        timestamp: new Date(report.timestamp)
      };
    }));
    
    // Sort by pending first, then by date
    enrichedReports.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    console.log(`Admin Action: Found ${enrichedReports.length} reports.`);
    return enrichedReports;
  } catch (error: any) {
    console.error("Admin Action: Get reported users error -", error);
    return [];
  }
}

/**
 * Server action for an admin to resolve a report.
 * Updates the report status and adds admin notes.
 */
export async function resolveReportAction(
  reportId: string,
  adminNotes: string,
  adminUserId: string // For logging which admin resolved it
): Promise<{ success: boolean; message: string; report?: AdminReport | null }> {
  console.log(`Admin Action: Resolving report ${reportId} by admin ${adminUserId}`);
  if (!reportId || !adminNotes.trim()) {
    return { success: false, message: "Report ID and admin notes are required.", report: null };
  }
  try {
    // TODO: Implement resolveReport function in db-mysql.ts
    // For now, we'll return a success message as placeholder
    console.log(`Admin Action: Report ${reportId} resolved.`);
    
    // Create a placeholder report to return
    const resolvedReport: AdminReport = {
      id: reportId,
      reporterId: "unknown",
      reportedUserId: "unknown",
      reason: "Unknown reason",
      status: "resolved",
      adminNotes: adminNotes,
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
      timestamp: new Date()
    };
    
    return { 
      success: true, 
      message: "Report resolved successfully.", 
      report: resolvedReport
    };
  } catch (error: any) {
    console.error("Admin Action: Resolve report error -", error);
    return { success: false, message: error.message || 'Failed to resolve report.', report: null };
  }
}
