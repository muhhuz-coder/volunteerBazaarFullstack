
// src/actions/gamification-actions.ts
'use server';

import {
    addPoints as addPointsService,
    awardBadge as awardBadgeService,
    getUserStats as getUserStatsService, // To return updated stats
    getLeaderboard as getLeaderboardService, // Import service for leaderboard
    logHours as logHoursService // Import logHours service
} from '@/services/gamification';
import type { VolunteerStats, LeaderboardEntry } from '@/services/gamification'; // Import LeaderboardEntry

/**
 * Server action to add points to a volunteer's stats.
 * Calls the service function to persist the update.
 * Returns the potentially updated stats.
 */
export async function addPointsAction(
    userId: string,
    pointsToAdd: number,
    reason: string
): Promise<{ success: boolean; message: string; newStats?: VolunteerStats | null }> {
    console.log('Server Action: Adding points for user:', userId, 'Amount:', pointsToAdd, 'Reason:', reason);
    if (pointsToAdd <= 0) {
        // Fetch current stats if no points are added, to return consistent structure
         try {
            const currentStats = await getUserStatsService(userId);
            return { success: true, message: 'No points added.', newStats: currentStats };
         } catch (error: any) {
             console.error("Server Action: Error fetching current stats -", error);
             return { success: false, message: 'Error fetching current stats.', newStats: null };
         }
    }
    try {
        // Service function returns the updated stats
        const updatedStats = await addPointsService(userId, pointsToAdd, reason);
        return { success: true, message: `${pointsToAdd} points added successfully.`, newStats: updatedStats };
    } catch (error: any) {
        console.error("Server Action: Add points error -", error);
        return { success: false, message: error.message || 'Failed to add points.', newStats: null };
    }
}

/**
 * Server action to award a badge to a volunteer.
 * Calls the service function to persist the update.
 * Returns the potentially updated stats.
 */
export async function awardBadgeAction(
    userId: string,
    badgeName: string,
    reason: string
): Promise<{ success: boolean; message: string; newStats?: VolunteerStats | null }> {
    console.log('Server Action: Awarding badge for user:', userId, 'Badge:', badgeName, 'Reason:', reason);
    try {
        // Service function returns the updated stats
        const updatedStats = await awardBadgeService(userId, badgeName, reason);
        // Check if the badge was actually added (service might skip if already present)
        if (updatedStats.badges.includes(badgeName)) {
             return { success: true, message: `Badge "${badgeName}" awarded successfully.`, newStats: updatedStats };
        } else {
            // This case might not happen if awardBadge service always returns stats.
            // If awardBadge ensures the badge is in newStats if it's supposed to be,
            // this specific check might be redundant. The primary check is if it's present in newStats.
            const currentStats = await getUserStatsService(userId); // Re-fetch to be sure
            if (currentStats.badges.includes(badgeName)) {
                return { success: true, message: `User already has badge "${badgeName}".`, newStats: currentStats };
            }
             // If it wasn't added and isn't in current stats, then it implies an issue or no change.
            return { success: true, message: `Badge "${badgeName}" not awarded (no change or already present).`, newStats: currentStats };
        }
    } catch (error: any)
    {
        console.error("Server Action: Award badge error -", error);
        return { success: false, message: error.message || 'Failed to award badge.', newStats: null };
    }
}

/**
 * Server action to get the leaderboard.
 */
export async function getLeaderboardAction(limit: number = 10): Promise<LeaderboardEntry[]> {
    console.log('Server Action: Getting leaderboard, limit:', limit);
    try {
        const leaderboard = await getLeaderboardService(limit);
        return leaderboard;
    } catch (error: any) {
        console.error("Server Action: Get leaderboard error -", error);
        return []; // Return empty array on error
    }
}


/**
 * Server action to log volunteer hours.
 * Calls the service function to persist the update and check for badges.
 * Returns the potentially updated stats.
 */
export async function logHoursAction(
    userId: string,
    hoursToAdd: number,
    reason: string
): Promise<{ success: boolean; message: string; newStats?: VolunteerStats | null }> {
    console.log('Server Action: Logging hours for user:', userId, 'Hours:', hoursToAdd, 'Reason:', reason);
    if (hoursToAdd <= 0) {
        try {
            const currentStats = await getUserStatsService(userId);
            return { success: true, message: 'No hours added.', newStats: currentStats };
        } catch (error: any) {
            console.error("Server Action: Error fetching current stats -", error);
            return { success: false, message: 'Error fetching current stats.', newStats: null };
        }
    }
    try {
        // logHoursService now handles badge checks and returns final stats
        const updatedStats = await logHoursService(userId, hoursToAdd, reason);
        return { success: true, message: `${hoursToAdd} hours logged successfully.`, newStats: updatedStats };
    } catch (error: any) {
        console.error("Server Action: Log hours error -", error);
        return { success: false, message: error.message || 'Failed to log hours.', newStats: null };
    }
}
