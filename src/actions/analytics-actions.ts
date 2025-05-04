'use server';
// src/actions/analytics-actions.ts

import { readData, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';
import type { Opportunity } from '@/services/job-board';

const USERS_FILE = 'users.json';
const OPPORTUNITIES_FILE = 'opportunities.json';

export interface AppStats {
  totalVolunteers: number;
  totalOrganizations: number;
  totalOpportunities: number;
}

/**
 * Server action to get basic application statistics.
 */
export async function getAppStatisticsAction(): Promise<AppStats> {
  console.log('Server Action: Getting application statistics.');
  try {
    // Fetch users and opportunities data in parallel
    const [usersObject, opportunitiesData] = await Promise.all([
      readData<Record<string, UserProfile>>(USERS_FILE, {}),
      readData<Opportunity[]>(OPPORTUNITIES_FILE, []),
    ]);

    const usersMap = objectToMap(usersObject);

    let totalVolunteers = 0;
    let totalOrganizations = 0;

    // Count users by role
    for (const user of usersMap.values()) {
      if (user.role === 'volunteer') {
        totalVolunteers++;
      } else if (user.role === 'organization') {
        totalOrganizations++;
      }
    }

    const totalOpportunities = opportunitiesData.length;

    const stats: AppStats = {
      totalVolunteers,
      totalOrganizations,
      totalOpportunities,
    };

    console.log('Server Action: Statistics fetched:', stats);
    return stats;
  } catch (error: any) {
    console.error("Server Action: Get statistics error -", error);
    // Return zeroed stats on error
    return {
      totalVolunteers: 0,
      totalOrganizations: 0,
      totalOpportunities: 0,
    };
  }
}
