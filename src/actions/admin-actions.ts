// src/actions/admin-actions.ts
'use server';

import { readData, writeData } from '@/lib/db-utils';
import type { AdminReport } from '@/services/admin';
import type { UserProfile } from '@/context/AuthContext'; // To enrich reported user info

const REPORTS_FILE = 'reports.json';
const USERS_FILE = 'users.json'; // To fetch user details

/**
 * Server action for an admin to get all reported users/content.
 * Optionally enriches reports with basic user info.
 */
export async function getReportedUsersAction(): Promise<AdminReport[]> {
  console.log('Admin Action: Getting all reported users.');
  try {
    const reports = await readData<AdminReport[]>(REPORTS_FILE, []);
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    
    // Enrich reports with user display names if available
    const enrichedReports = reports.map(report => {
      let reporterDisplayName = `User (${report.reporterId.substring(0,4)})`;
      let reportedUserDisplayName = `User (${report.reportedUserId.substring(0,4)})`;

      for (const user of Object.values(usersObject)) {
        if (user.id === report.reporterId) {
          reporterDisplayName = user.displayName;
        }
        if (user.id === report.reportedUserId) {
          reportedUserDisplayName = user.displayName;
        }
      }
      return {
        ...report,
        reporterDisplayName,
        reportedUserDisplayName,
        timestamp: new Date(report.timestamp), // Ensure timestamp is a Date object
      };
    });
    
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
    const reports = await readData<AdminReport[]>(REPORTS_FILE, []);
    const reportIndex = reports.findIndex(r => r.id === reportId);

    if (reportIndex === -1) {
      return { success: false, message: "Report not found.", report: null };
    }

    reports[reportIndex].status = 'resolved';
    reports[reportIndex].adminNotes = adminNotes;
    reports[reportIndex].resolvedBy = adminUserId;
    reports[reportIndex].resolvedAt = new Date();
    reports[reportIndex].timestamp = new Date(reports[reportIndex].timestamp);


    await writeData(REPORTS_FILE, reports);
    console.log(`Admin Action: Report ${reportId} resolved.`);
    return { success: true, message: "Report resolved successfully.", report: reports[reportIndex] };
  } catch (error: any) {
    console.error("Admin Action: Resolve report error -", error);
    return { success: false, message: error.message || 'Failed to resolve report.', report: null };
  }
}
