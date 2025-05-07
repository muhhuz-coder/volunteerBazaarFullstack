// src/services/user-service.ts
'use server';

import { readData, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification'; // Import for stats typing

const USERS_FILE = 'users.json';
const USER_STATS_FILE = 'user-stats.json'; // Assuming stats might be separate or need merging

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads all user profiles from the users.json file.
 * Ensures volunteer stats are merged if they are stored separately.
 */
async function getAllUsersWithStats(): Promise<UserProfile[]> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersMap = objectToMap(usersObject);
    
    // If stats are stored separately and need to be merged:
    // const userStatsObject = await readData<Record<string, VolunteerStats>>(USER_STATS_FILE, {});
    // const userStatsMap = objectToMap(userStatsObject);

    const allUsers: UserProfile[] = [];
    for (const user of usersMap.values()) {
        let userWithStats = { ...user };
        // If stats are in users.json, user.stats should already be populated for volunteers.
        // If stats were separate:
        // if (user.role === 'volunteer' && userStatsMap.has(user.id)) {
        //     userWithStats.stats = userStatsMap.get(user.id);
        // } else if (user.role === 'volunteer' && !userWithStats.stats) {
        //     userWithStats.stats = { points: 0, badges: [], hours: 0 }; // Default if not found
        // }
        // Ensure volunteers always have a stats object
        if (user.role === 'volunteer' && !userWithStats.stats) {
            userWithStats.stats = { points: 0, badges: [], hours: 0 };
        }
        allUsers.push(userWithStats);
    }
    return allUsers;
}

/**
 * Retrieves public volunteer profiles based on filters and sorting.
 * @param filters Optional filters for keywords and sorting.
 * @returns A promise that resolves to an array of UserProfile objects for volunteers.
 */
export async function getPublicVolunteers(filters?: {
  keywords?: string;
  sortBy?: string; // e.g., 'points_desc', 'name_asc', 'hours_desc'
}): Promise<UserProfile[]> {
  await sleep(150); // Simulate delay
  let users = await getAllUsersWithStats();

  // Filter for volunteers
  let volunteers = users.filter(user => user.role === 'volunteer');

  // Apply keyword filter (search displayName)
  if (filters?.keywords) {
    const lowerKeywords = filters.keywords.toLowerCase();
    volunteers = volunteers.filter(volunteer =>
      volunteer.displayName.toLowerCase().includes(lowerKeywords)
    );
  }

  // Apply sorting
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'points_desc':
        volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
        break;
      case 'hours_desc':
        volunteers.sort((a, b) => (b.stats?.hours ?? 0) - (a.stats?.hours ?? 0));
        break;
      case 'name_asc':
        volunteers.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'name_desc':
        volunteers.sort((a, b) => b.displayName.localeCompare(a.displayName));
        break;
      default:
        // Default sort (e.g., by points if no specific sort or by registration date if available)
        volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
        break;
    }
  } else {
    // Default sort if none provided
    volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
  }

  console.log(`Returning ${volunteers.length} public volunteer profiles.`);
  // Return copies of user profiles
  return volunteers.map(v => ({ ...v, stats: v.stats ? {...v.stats, badges: [...(v.stats.badges || [])]} : undefined }));
}
