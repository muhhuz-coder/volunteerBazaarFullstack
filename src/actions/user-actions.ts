// src/actions/user-actions.ts
'use server';

import {
  getPublicVolunteers as getPublicVolunteersService,
  blockUserById,
  unblockUserById,
  submitReport as submitReportService,
} from '@/services/user-service';
import type { UserProfile } from '@/context/AuthContext';
import type { Report } from '@/services/user-service'; // Import Report type

interface GetVolunteersFilters {
    keywords?: string;
    sortBy?: string;
}

/**
 * Server action to get public volunteer profiles.
 * Calls the service function to retrieve and filter volunteers.
 * Passes currentUserId to filter out blocked/blocking users.
 */
export async function getPublicVolunteersAction(
    filters?: GetVolunteersFilters,
    currentUserId?: string // Optional: ID of the user making the request
): Promise<UserProfile[]> {
    console.log('Server Action: Getting public volunteer profiles with filters:', filters, 'for user:', currentUserId);
    try {
        const volunteers = await getPublicVolunteersService(filters, currentUserId);
        return volunteers;
    } catch (error: any) {
        console.error("Server Action: Get public volunteers error -", error);
        return []; 
    }
}

/**
 * Server action for a user to block another user.
 */
export async function blockUserAction(
    blockerUserId: string,
    userIdToBlock: string
): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
    console.log(`Server Action: User ${blockerUserId} attempting to block user ${userIdToBlock}`);
    try {
        if (blockerUserId === userIdToBlock) {
            return { success: false, message: "You cannot block yourself.", user: null };
        }
        const updatedUser = await blockUserById(blockerUserId, userIdToBlock);
        if (updatedUser) {
            return { success: true, message: `User ${userIdToBlock} has been blocked.`, user: updatedUser };
        } else {
            return { success: false, message: 'Failed to block user. User not found or already blocked.', user: null };
        }
    } catch (error: any) {
        console.error("Server Action: Block user error -", error);
        return { success: false, message: error.message || 'Failed to block user.', user: null };
    }
}

/**
 * Server action for a user to unblock another user.
 */
export async function unblockUserAction(
    blockerUserId: string,
    userIdToUnblock: string
): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
    console.log(`Server Action: User ${blockerUserId} attempting to unblock user ${userIdToUnblock}`);
    try {
        const updatedUser = await unblockUserById(blockerUserId, userIdToUnblock);
        if (updatedUser) {
            return { success: true, message: `User ${userIdToUnblock} has been unblocked.`, user: updatedUser };
        } else {
            return { success: false, message: 'Failed to unblock user. User not found or not in block list.', user: null };
        }
    } catch (error: any) {
        console.error("Server Action: Unblock user error -", error);
        return { success: false, message: error.message || 'Failed to unblock user.', user: null };
    }
}

/**
 * Server action to submit a user report.
 */
export async function reportUserAction(
    reporterId: string,
    reporterName: string,
    reportedUserId: string,
    reason: string,
    details?: string
): Promise<{ success: boolean; message: string; report?: Report | null }> {
    console.log(`Server Action: User ${reporterId} (${reporterName}) reporting user ${reportedUserId}. Reason: ${reason}`);
    try {
        if (reporterId === reportedUserId) {
             return { success: false, message: "You cannot report yourself.", report: null };
        }
        const reportData: Omit<Report, 'id' | 'timestamp' | 'status' | 'reportedUserName'> = {
            reporterId,
            reporterName,
            reportedUserId,
            reason,
            details,
        };
        const newReport = await submitReportService(reportData);
        return { success: true, message: 'Report submitted successfully.', report: newReport };
    } catch (error: any) {
        console.error("Server Action: Report user error -", error);
        return { success: false, message: error.message || 'Failed to submit report.', report: null };
    }
}
