// src/services/gamification.ts

/**
 * Represents the gamification statistics for a volunteer.
 */
export interface VolunteerStats {
    points: number;
    badges: string[]; // Array of badge names earned
    hours: number; // Total volunteer hours logged (can be extended)
}

/**
 * Represents an entry in the leaderboard.
 */
export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    // rank?: number; // Rank can be calculated based on position in sorted list
}

/**
 * Represents a log entry for points or badges awarded.
 */
interface GamificationLog {
    userId: string;
    type: 'points' | 'badge';
    value: number | string; // Points amount or badge name
    reason: string;
    timestamp: Date;
}

// Simulate database for user stats and logs
const mockUserStats = new Map<string, VolunteerStats>();
const mockGamificationLog: GamificationLog[] = [];

// Ensure default users from AuthContext have initial stats
mockUserStats.set('vol1', { points: 0, badges: [], hours: 0 });
// Organizations don't typically have stats in this model
// mockUserStats.set('org1', { points: 0, badges: [], hours: 0 });


// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves the gamification stats for a specific user.
 * @param userId The ID of the volunteer.
 * @returns A promise that resolves to the VolunteerStats object.
 */
export async function getUserStats(userId: string): Promise<VolunteerStats> {
    await sleep(150); // Simulate short delay

    // If user has no stats yet, initialize them
    if (!mockUserStats.has(userId)) {
        mockUserStats.set(userId, { points: 0, badges: [], hours: 0 });
    }

    const stats = mockUserStats.get(userId)!; // We know it exists now
    console.log(`Fetched stats for user ${userId}:`, stats);
    return { ...stats }; // Return a copy
}

/**
 * Adds points to a volunteer's stats.
 * @param userId The ID of the volunteer.
 * @param pointsToAdd The number of points to add.
 * @param reason A description of why the points were awarded.
 * @returns A promise that resolves when the operation is complete.
 */
export async function addPoints(userId: string, pointsToAdd: number, reason: string): Promise<void> {
    if (pointsToAdd <= 0) return; // Don't add zero or negative points

    await sleep(200); // Simulate delay

    const stats = await getUserStats(userId); // Get current or initialize stats
    stats.points += pointsToAdd;
    mockUserStats.set(userId, stats); // Update stats in map

    // Add to log
    const logEntry: GamificationLog = {
        userId,
        type: 'points',
        value: pointsToAdd,
        reason,
        timestamp: new Date(),
    };
    mockGamificationLog.push(logEntry);

    console.log(`Added ${pointsToAdd} points to user ${userId} for: ${reason}. New total: ${stats.points}`);
}

/**
 * Awards a badge to a volunteer.
 * @param userId The ID of the volunteer.
 * @param badgeName The name of the badge to award.
 * @param reason A description of why the badge was awarded.
 * @returns A promise that resolves when the operation is complete.
 */
export async function awardBadge(userId: string, badgeName: string, reason: string): Promise<void> {
    await sleep(200); // Simulate delay

    const stats = await getUserStats(userId); // Get current or initialize stats

    // Avoid duplicate badges
    if (!stats.badges.includes(badgeName)) {
        stats.badges.push(badgeName);
        mockUserStats.set(userId, stats); // Update stats in map

        // Add to log
        const logEntry: GamificationLog = {
            userId,
            type: 'badge',
            value: badgeName,
            reason,
            timestamp: new Date(),
        };
        mockGamificationLog.push(logEntry);

        console.log(`Awarded badge "${badgeName}" to user ${userId} for: ${reason}.`);
    } else {
        console.log(`User ${userId} already has badge "${badgeName}".`);
    }
}

/**
 * Retrieves the leaderboard based on points.
 * @param limit The maximum number of entries to return (default 10).
 * @returns A promise that resolves to an array of LeaderboardEntry objects, sorted by points descending.
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await sleep(400); // Simulate delay

    // In a real app, you'd fetch user names along with stats or join data.
    // Here, we'll simulate it using a simple lookup (needs mockUsers from AuthContext or similar).
     const mockUsersLookup = new Map<string, { displayName: string }>();
     mockUsersLookup.set('vol1', { displayName: 'Jane Doe Volunteer' });
     // Add more mock users if needed for leaderboard testing

    const leaderboard: LeaderboardEntry[] = [];

    for (const [userId, stats] of mockUserStats.entries()) {
        // Ensure we only include volunteers if the stats map might contain others
         // const userRole = getUserRoleFromId(userId); // Need a way to determine role if map includes non-volunteers
         // if (userRole === 'volunteer') {
           leaderboard.push({
             userId,
             // Fetch or lookup userName - using mock lookup here
             userName: mockUsersLookup.get(userId)?.displayName || `User (${userId.substring(0, 4)})`,
             points: stats.points,
           });
         // }
    }

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    console.log('Generated leaderboard:', leaderboard.slice(0, limit));
    return leaderboard.slice(0, limit); // Return top 'limit' entries
}

/**
 * Logs volunteer hours. (Example extension)
 * @param userId The ID of the volunteer.
 * @param hours The number of hours to log.
 * @param opportunityId The ID of the opportunity the hours relate to.
 * @returns A promise that resolves when hours are logged.
 */
export async function logHours(userId: string, hours: number, opportunityId: string): Promise<void> {
    if (hours <= 0) return;

    await sleep(150);
    const stats = await getUserStats(userId);
    stats.hours += hours;
    mockUserStats.set(userId, stats);

    console.log(`Logged ${hours} hours for user ${userId} for opportunity ${opportunityId}. Total hours: ${stats.hours}`);

    // Potentially award points/badges based on hours milestones
    if (stats.hours >= 10 && !stats.badges.includes('10 Hour Hero')) {
        await awardBadge(userId, '10 Hour Hero', 'Logged 10+ volunteer hours');
    }
     if (stats.hours >= 50 && !stats.badges.includes('50 Hour Superstar')) {
        await awardBadge(userId, '50 Hour Superstar', 'Logged 50+ volunteer hours');
    }
}

// Example of triggering gamification based on actions (could be called from other services/components)
// e.g., called after an application is accepted and verified
export async function recordOpportunityCompletion(userId: string, opportunityPoints: number, opportunityId: string, hoursVolunteered: number) {
   await addPoints(userId, opportunityPoints, `Completed opportunity ${opportunityId}`);
   await logHours(userId, hoursVolunteered, opportunityId);
}
