// src/actions/admin-actions.ts
'use server';

import { readData, writeData, objectToMap, mapToObject } from '@/lib/db-utils';
import type { Report } from '@/services/user-service'; // Assuming Report type is in user-service
import type { UserProfile } from '@/context/AuthContext';

const REPORTS_FILE = 'reports.json';
const USERS_FILE = 'users.json'; // To verify admin status

async function verifyAdmin(adminUserId: string): Promise<boolean> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersMap = objectToMap(usersObject);
    for (const profile of usersMap.values()) {
        if (profile.id === adminUserId && profile.role === 'admin') {
            return true;
        }
    }
    return false;
}

/**
 * Server action to get all user reports.
 * Intended for admin use.
 */
export async function getAllReportsAction(): Promise<Report[]> {
    console.log('Admin Action: Getting all user reports.');
    // In a real app, you'd verify admin privileges here before proceeding.
    // For simplicity, assuming caller is authorized.
    try {
        const reports = await readData<Report[]>(REPORTS_FILE, []);
        // Ensure timestamps are Date objects
        return reports.map(report => ({
            ...report,
            timestamp: new Date(report.timestamp),
        }));
    } catch (error: any) {
        console.error("Admin Action: Get all reports error -", error);
        return []; // Return empty array on error
    }
}

/**
 * Server action to update the status of a user report.
 * Intended for admin use.
 */
export async function updateReportStatusAction(
    reportId: string,
    status: Report['status'],
    adminUserId: string // For auditing/authorization
): Promise<{ success: boolean; report?: Report | null; message: string }> {
    console.log(`Admin Action: Updating report ${reportId} status to ${status} by admin ${adminUserId}.`);
    
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
        return { success: false, message: 'Unauthorized action. Admin privileges required.', report: null };
    }

    try {
        let reports = await readData<Report[]>(REPORTS_FILE, []);
        const reportIndex = reports.findIndex(r => r.id === reportId);

        if (reportIndex === -1) {
            return { success: false, message: 'Report not found.', report: null };
        }

        reports[reportIndex].status = status;
        reports[reportIndex].timestamp = new Date(reports[reportIndex].timestamp); // Ensure Date object

        await writeData(REPORTS_FILE, reports);
        
        return { success: true, report: reports[reportIndex], message: 'Report status updated successfully.' };
    } catch (error: any) {
        console.error("Admin Action: Update report status error -", error);
        return { success: false, message: error.message || 'Failed to update report status.', report: null };
    }
}
