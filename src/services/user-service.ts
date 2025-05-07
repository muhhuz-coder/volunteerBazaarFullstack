// src/services/user-service.ts
'use server';

import { readData, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification'; // Import for stats typing
import { getUserStats as fetchVolunteerStats } from '@/services/gamification'; // Import the service function

const USERS_FILE = 'users.json';
// USER_STATS_FILE is managed by gamification service

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads all user profiles from the users.json file.
 * For volunteers, it fetches their latest stats from the gamification service.
 */
async function getAllUsersWithStats(): Promise<UserProfile[]> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersMap = objectToMap(usersObject);
    
    const allUsersWithLiveStats: UserProfile[] = [];

    for (const basicProfile of usersMap.values()) {
        let userWithStats = { ...basicProfile }; // Shallow copy of user

        if (userWithStats.role === 'volunteer') {
            try {
                // Fetch live stats from the gamification service
                const liveStats = await fetchVolunteerStats(userWithStats.id);
                userWithStats.stats = liveStats;
            } catch (error) {
                console.error(`Failed to fetch stats for volunteer ${userWithStats.id}:`, error);
                // Default stats if fetching fails, to prevent breaking the list
                userWithStats.stats = {
                    points: 0,
                    badges: [],
                    hours: 0,
                };
            }
        }
        allUsersWithLiveStats.push(userWithStats);
    }
    return allUsersWithLiveStats;
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
  let users = await getAllUsersWithStats(); // This now fetches live stats for volunteers

  // Filter for volunteers (though getAllUsersWithStats focuses on enriching volunteers, an explicit filter is safer)
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
        // Default sort by points
        volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
        break;
    }
  } else {
    // Default sort if none provided
    volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
  }

  console.log(`Returning ${volunteers.length} public volunteer profiles with up-to-date stats.`);
  // Return copies of user profiles. Stats are already up-to-date from getAllUsersWithStats.
  return volunteers.map(v => ({
    ...v,
    // Ensure stats object and its badges array are properly copied if they exist
    stats: v.stats 
        ? { ...v.stats, badges: Array.isArray(v.stats.badges) ? [...v.stats.badges] : [] } 
        : { points: 0, badges: [], hours: 0 }
  }));
}
