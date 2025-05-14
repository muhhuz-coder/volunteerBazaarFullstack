// src/services/user-service.ts
'use server';

import { getUserById, getVolunteers } from '@/lib/db-mysql';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification'; // Import for stats typing
import { getUserStats as fetchVolunteerStats } from '@/services/gamification'; // Import the service function

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  console.log('Getting public volunteer profiles with filters:', filters);
  
  // Use the new getVolunteers function from db-mysql.ts
  const volunteers = await getVolunteers(
    filters?.keywords, 
    filters?.sortBy
  );
  
  // Remove sensitive data from the profiles
  return volunteers.map(volunteer => {
    const { hashedPassword, ...publicProfile } = volunteer;
    return publicProfile;
  });
}
