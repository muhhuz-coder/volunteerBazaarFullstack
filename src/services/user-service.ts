// src/services/user-service.ts
'use server';

import { readData, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification'; // Import for stats typing

const USERS_FILE = 'users.json';
// const USER_STATS_FILE = 'user-stats.json'; // User stats are part of UserProfile in users.json

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads all user profiles from the users.json file.
 * Ensures volunteer stats are merged and defaulted if necessary.
 */
async function getAllUsersWithStats(): Promise<UserProfile[]> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersMap = objectToMap(usersObject);
    
    const allUsers: UserProfile[] = [];
    for (const user of usersMap.values()) {
        let userWithStats = { ...user }; // Shallow copy of user

        if (userWithStats.role === 'volunteer') {
            const existingStats = userWithStats.stats || {}; // Handle undefined/null stats
            userWithStats.stats = {
                points: existingStats.points ?? 0,
                badges: Array.isArray(existingStats.badges) ? [...existingStats.badges] : [], // Ensure badges is an array and copied
                hours: existingStats.hours ?? 0,
            };
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
        // Default sort by points
        volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
        break;
    }
  } else {
    // Default sort if none provided
    volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
  }

  console.log(`Returning ${volunteers.length} public volunteer profiles.`);
  // Return copies of user profiles with stats ensured to be copied as well
  return volunteers.map(v => ({
    ...v,
    // Since getAllUsersWithStats ensures stats object and its fields are initialized for volunteers,
    // we can confidently spread it. We also ensure badges array is a new copy.
    stats: v.stats ? { ...v.stats, badges: [...v.stats.badges] } : { points: 0, badges: [], hours: 0 }
  }));
}

