'use server';
// src/services/gamification.ts
import { 
  getVolunteerStats,
  addPoints as dbAddPoints,
  awardBadge as dbAwardBadge,
  logHours as dbLogHours
} from '@/lib/db-mysql';
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

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves the gamification stats for a specific user.
 * @param userId The ID of the volunteer.
 * @returns A promise that resolves to the VolunteerStats object.
 */
export async function getUserStats(userId: string): Promise<VolunteerStats> {
    await sleep(50); // Simulate minimal delay
    console.log(`Fetching stats for user ${userId}`);
    
    // Use the MySQL database function to get the volunteer stats
    return await getVolunteerStats(userId);
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
    console.log(`Adding ${pointsToAdd} points to user ${userId} for: ${reason}`);
    
    // Use the MySQL database function to add points
    return await dbAddPoints(userId, pointsToAdd, reason);
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
    console.log(`Awarding badge "${badgeName}" to user ${userId} for: ${reason}`);
    
    // Use the MySQL database function to award a badge
    return await dbAwardBadge(userId, badgeName, reason);
}

/**
 * Retrieves the leaderboard based on points.
 * @param limit The maximum number of entries to return (default 10).
 * @returns A promise that resolves to an array of LeaderboardEntry objects, sorted by points descending.
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await sleep(150); // Simulate delay
    console.log(`Generating leaderboard with limit: ${limit}`);
    
    // TODO: Implement getLeaderboard function in db-mysql.ts and use it here
    // For now, we'll return a mock leaderboard
    const mockLeaderboard: LeaderboardEntry[] = [
        { userId: 'vol_1', userName: 'Top Volunteer', points: 500 },
        { userId: 'vol_2', userName: 'Second Place', points: 450 },
        { userId: 'vol_3', userName: 'Third Place', points: 400 }
    ];
    
    return mockLeaderboard.slice(0, limit);
}

/**
 * Logs volunteer hours and saves the updated data.
 * This function will also trigger checks for hour-based badges.
 * @param userId The ID of the volunteer.
 * @param hours The number of hours to log.
 * @param reason The reason for logging hours (e.g., opportunity ID/title).
 * @returns A promise that resolves to the updated VolunteerStats object.
 */
export async function logHours(userId: string, hours: number, reason: string): Promise<VolunteerStats> {
    if (hours <= 0) {
        return await getUserStats(userId); // Return current stats if no hours added
    }

    await sleep(100);
    console.log(`Logging ${hours} hours for user ${userId} for: ${reason}`);
    
    // Use the MySQL database function to log hours
    const updatedStats = await dbLogHours(userId, hours, reason);
    
    // Check and award hour-based badges
    await checkAndAwardHourBadges(userId, updatedStats.hours);
    
    return updatedStats;
}

/**
 * Checks and awards badges based on a volunteer's total hours.
 * @param userId The ID of the volunteer.
 * @param totalHours The total hours the volunteer has logged.
 * @returns A promise that resolves to the updated VolunteerStats object.
 */
async function checkAndAwardHourBadges(userId: string, totalHours: number): Promise<VolunteerStats> {
    console.log(`Checking hour-based badges for user ${userId} with ${totalHours} total hours`);
    
    // Define hour-based badges
    const hourBadges = [
        { name: 'First Timer', threshold: 1, reason: 'Logging your first volunteer hour' },
        { name: 'Helping Hand', threshold: 10, reason: 'Volunteering for 10 hours' },
        { name: 'Dedicated Helper', threshold: 25, reason: 'Volunteering for 25 hours' },
        { name: 'Community Champion', threshold: 50, reason: 'Volunteering for 50 hours' },
        { name: 'Volunteer Hero', threshold: 100, reason: 'Volunteering for 100 hours' },
    ];
    
    let stats = await getUserStats(userId);
    
    // Award badges for reached thresholds
    for (const badge of hourBadges) {
        if (totalHours >= badge.threshold && !stats.badges.includes(badge.name)) {
            console.log(`User ${userId} qualifies for badge "${badge.name}" with ${totalHours} hours`);
            stats = await awardBadge(userId, badge.name, badge.reason);
        }
    }
    
    return stats;
}

/**
 * Records the completion of an opportunity, awarding points and logging hours.
 * @param userId The ID of the volunteer.
 * @param opportunityId The ID of the opportunity completed.
 * @param opportunityPoints The points associated with the opportunity.
 * @param hoursVolunteered The hours spent volunteering.
 * @returns A promise that resolves to the updated VolunteerStats object.
 */
export async function recordOpportunityCompletion(userId: string, opportunityId: string, opportunityPoints: number, hoursVolunteered: number): Promise<VolunteerStats> {
    console.log(`Recording completion for user ${userId}, opportunity ${opportunityId}, points ${opportunityPoints}, hours ${hoursVolunteered}`);
    await sleep(200);
    
    let updatedStats: VolunteerStats;
    
    // Log the volunteer hours first
    if (hoursVolunteered > 0) {
        updatedStats = await logHours(userId, hoursVolunteered, `Completing opportunity: ${opportunityId}`);
    } else {
        updatedStats = await getUserStats(userId);
    }
    
    // Award the points associated with the opportunity
    if (opportunityPoints > 0) {
        updatedStats = await addPoints(userId, opportunityPoints, `Completing opportunity: ${opportunityId}`);
    }
    
    // Award a completion badge if this is their first completed opportunity
    // We would need to check if this is their first completion
    const isFirstCompletion = false; // This would require more context from applications
    if (isFirstCompletion) {
        updatedStats = await awardBadge(userId, 'First Completion', 'Completing your first volunteer opportunity');
    }
    
    return updatedStats;
}
