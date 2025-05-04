'use server';
// src/services/gamification.ts
import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext'; // Assuming UserProfile is exported

/**
 * Represents the gamification statistics for a volunteer.
 */
export interface VolunteerStats {
    points: number;
    badges: string[];
    hours: number;
}

/**
 * Represents an entry in the leaderboard.
 */
export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
}

/**
 * Represents a log entry for points or badges awarded.
 */
interface GamificationLog {
    userId: string;
    type: 'points' | 'badge' | 'hours'; // Added 'hours' type
    value: number | string;
    reason: string;
    timestamp: Date | string; // Allow string for reading
}

// File names for JSON data
const USER_STATS_FILE = 'user-stats.json'; // Stores Map<userId, VolunteerStats> as an object
const GAMIFICATION_LOG_FILE = 'gamification-log.json';
const USERS_FILE = 'users.json'; // To look up user names

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
// Load data dynamically within functions to ensure server-side execution context

async function loadUserStatsData(): Promise<Map<string, VolunteerStats>> {
    const statsObject = await readData<Record<string, VolunteerStats>>(USER_STATS_FILE, {});
    return objectToMap(statsObject);
}

async function loadGamificationLogData(): Promise<GamificationLog[]> {
     const rawLogs = await readData<GamificationLog[]>(GAMIFICATION_LOG_FILE, []);
     return rawLogs.map(log => ({
         ...log,
         timestamp: typeof log.timestamp === 'string' ? new Date(log.timestamp) : log.timestamp,
     }));
}

async function loadUsersData(): Promise<Map<string, UserProfile>> {
     const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
     return objectToMap(usersObject);
}


/**
 * Retrieves the gamification stats for a specific user.
 * Reads from the loaded data map.
 * @param userId The ID of the volunteer.
 * @returns A promise that resolves to the VolunteerStats object.
 */
export async function getUserStats(userId: string): Promise<VolunteerStats> {
    await sleep(50); // Simulate minimal delay
    const userStatsData = await loadUserStatsData();

    // If user has no stats yet, initialize them (doesn't save automatically here)
    if (!userStatsData.has(userId)) {
         const defaultStats = { points: 0, badges: [], hours: 0 };
          // Don't automatically save default stats, let actions like addPoints handle saving
         console.log(`User ${userId} stats not found, returning default.`);
         return defaultStats;
    }

    const stats = userStatsData.get(userId)!;
    console.log(`Fetched stats for user ${userId}:`, stats);
    return { ...stats }; // Return a copy
}

/**
 * Adds points to a volunteer's stats and saves the updated data.
 * @param userId The ID of the volunteer.
 * @param pointsToAdd The number of points to add.
 * @param reason A description of why the points were awarded.
 * @returns A promise that resolves when the operation is complete.
 */
export async function addPoints(userId: string, pointsToAdd: number, reason: string): Promise<VolunteerStats> {
    if (pointsToAdd <= 0) {
        // If no points are added, just return the current stats
        return await getUserStats(userId);
    }

    await sleep(100); // Simulate delay
    const userStatsData = await loadUserStatsData();
    let gamificationLogData = await loadGamificationLogData();

    // Get current stats or initialize if they don't exist
    const stats = userStatsData.get(userId) ?? { points: 0, badges: [], hours: 0 };
    stats.points += pointsToAdd;
    userStatsData.set(userId, stats); // Update stats in map

    // Add to log
    const logEntry: GamificationLog = {
        userId,
        type: 'points',
        value: pointsToAdd,
        reason,
        timestamp: new Date(),
    };
    gamificationLogData.push(logEntry);

    // Save updated stats and log
    await writeData(USER_STATS_FILE, mapToObject(userStatsData));
    await writeData(GAMIFICATION_LOG_FILE, gamificationLogData);

    console.log(`Added ${pointsToAdd} points to user ${userId} for: ${reason}. New total: ${stats.points}. Data saved.`);
    return { ...stats }; // Return the updated stats
}

/**
 * Awards a badge to a volunteer and saves the updated data.
 * @param userId The ID of the volunteer.
 * @param badgeName The name of the badge to award.
 * @param reason A description of why the badge was awarded.
 * @returns A promise that resolves to the updated VolunteerStats object.
 */
export async function awardBadge(userId: string, badgeName: string, reason: string): Promise<VolunteerStats> {
    await sleep(100); // Simulate delay
    const userStatsData = await loadUserStatsData();
    let gamificationLogData = await loadGamificationLogData();

    // Get current stats or initialize
    const stats = userStatsData.get(userId) ?? { points: 0, badges: [], hours: 0 };

    if (!stats.badges.includes(badgeName)) {
        stats.badges.push(badgeName);
        userStatsData.set(userId, stats); // Update stats in map

        // Add to log
        const logEntry: GamificationLog = {
            userId,
            type: 'badge',
            value: badgeName,
            reason,
            timestamp: new Date(),
        };
        gamificationLogData.push(logEntry);

        // Save updated stats and log
        await writeData(USER_STATS_FILE, mapToObject(userStatsData));
        await writeData(GAMIFICATION_LOG_FILE, gamificationLogData);

        console.log(`Awarded badge "${badgeName}" to user ${userId} for: ${reason}. Data saved.`);
    } else {
        console.log(`User ${userId} already has badge "${badgeName}".`);
    }
    return { ...stats }; // Return the potentially updated stats
}

/**
 * Retrieves the leaderboard based on points.
 * Reads user stats and user names from loaded data.
 * @param limit The maximum number of entries to return (default 10).
 * @returns A promise that resolves to an array of LeaderboardEntry objects, sorted by points descending.
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await sleep(150); // Simulate delay
    const userStatsData = await loadUserStatsData();
    const usersData = await loadUsersData();

    const leaderboard: LeaderboardEntry[] = [];

    for (const [userId, stats] of userStatsData.entries()) {
         // Attempt to find the user profile by ID first
         let userProfile: UserProfile | undefined;
         for (const profile of usersData.values()) {
             if (profile.id === userId) {
                 userProfile = profile;
                 break;
             }
         }

         // Only include users who are volunteers and have a profile
        if (userProfile && userProfile.role === 'volunteer') {
           leaderboard.push({
             userId,
             userName: userProfile.displayName || `User (${userId.substring(0, 4)})`,
             points: stats.points,
           });
        }
    }

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    console.log('Generated leaderboard:', leaderboard.slice(0, limit));
    return leaderboard.slice(0, limit); // Return top 'limit' entries
}

/**
 * Logs volunteer hours and saves the updated data.
 * @param userId The ID of the volunteer.
 * @param hours The number of hours to log.
 * @param opportunityId The ID of the opportunity the hours relate to (used in reason).
 * @returns A promise that resolves to the updated VolunteerStats object.
 */
export async function logHours(userId: string, hours: number, opportunityId: string): Promise<VolunteerStats> {
    if (hours <= 0) {
        return await getUserStats(userId); // Return current stats if no hours added
    }

    await sleep(100);
    const userStatsData = await loadUserStatsData();
    let gamificationLogData = await loadGamificationLogData();

    // Get current stats or initialize
    const stats = userStatsData.get(userId) ?? { points: 0, badges: [], hours: 0 };
    stats.hours += hours;
    userStatsData.set(userId, stats);

    // Add to log
    const logEntry: GamificationLog = {
        userId,
        type: 'hours',
        value: hours,
        reason: `Logged hours for opportunity ${opportunityId}`,
        timestamp: new Date(),
    };
    gamificationLogData.push(logEntry);

    // Save updated stats and log
    await writeData(USER_STATS_FILE, mapToObject(userStatsData));
    await writeData(GAMIFICATION_LOG_FILE, gamificationLogData);

    console.log(`Logged ${hours} hours for user ${userId} for opportunity ${opportunityId}. Total hours: ${stats.hours}. Data saved.`);

    // Trigger badge awards based on new hour total (this will also save data again)
    const finalStats = await checkAndAwardHourBadges(userId, stats.hours);
    return finalStats;
}

/**
 * Helper function to check hour milestones and award badges.
 * Returns the latest stats after potentially awarding badges.
 */
async function checkAndAwardHourBadges(userId: string, totalHours: number): Promise<VolunteerStats> {
     let stats = await getUserStats(userId); // Get potentially updated stats
    let awardedNewBadge = false;

    if (totalHours >= 10 && !stats.badges.includes('10 Hour Hero')) {
        stats = await awardBadge(userId, '10 Hour Hero', 'Logged 10+ volunteer hours');
        awardedNewBadge = true;
    }
    // Check subsequent badges only if stats were potentially updated by the previous check
    if (totalHours >= 50 && !stats.badges.includes('50 Hour Superstar')) {
        stats = await awardBadge(userId, '50 Hour Superstar', 'Logged 50+ volunteer hours');
        awardedNewBadge = true;
    }
    // Add more milestones as needed

     // Return the latest version of stats
     // If a badge was awarded, awardBadge already returned the updated stats.
     // If no badge was awarded, getUserStats fetched the latest.
    return stats;
}


/**
 * Example function called after an opportunity is verified as completed.
 * @param userId Volunteer ID.
 * @param opportunityId Opportunity ID.
 * @param opportunityPoints Points defined for the opportunity.
 * @param hoursVolunteered Hours spent on the opportunity.
 * @returns Promise resolving to the volunteer's final stats after updates.
 */
export async function recordOpportunityCompletion(userId: string, opportunityId: string, opportunityPoints: number, hoursVolunteered: number): Promise<VolunteerStats> {
   await addPoints(userId, opportunityPoints, `Completed opportunity ${opportunityId}`);
   // logHours handles saving and badge checks, and returns the final stats
   const finalStats = await logHours(userId, hoursVolunteered, opportunityId);
   return finalStats;
}