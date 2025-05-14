'use server';
// src/actions/analytics-actions.ts

import { initializeDb, getAppStatistics } from '@/lib/db-mysql';
import type { UserProfile } from '@/context/AuthContext';
import type { Opportunity } from '@/services/job-board';

// Initialize the database
initializeDb();

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
    // Get actual statistics from the database
    const stats = await getAppStatistics();

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
