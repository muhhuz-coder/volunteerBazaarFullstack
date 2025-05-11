
// src/services/user-service.ts
'use server';

import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification'; 
import { getUserStats as fetchVolunteerStats } from '@/services/gamification'; 

const USERS_FILE = 'users.json';
const REPORTS_FILE = 'reports.json'; // For storing user reports

export interface Report {
  id: string;
  reporterId: string;        // ID of the user who made the report
  reporterName: string;      // Name of the reporter
  reportedUserId: string;    // ID of the user being reported
  reportedUserName: string;  // Name of the user being reported
  reason: string;            // Reason for the report (e.g., category or short description)
  details?: string;           // More detailed description of the issue
  timestamp: Date;
  status: 'pending' | 'reviewed_action_taken' | 'reviewed_no_action'; // For admin tracking
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function loadUsersMap(): Promise<Map<string, UserProfile>> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    return objectToMap(usersObject);
}

async function loadReportsData(): Promise<Report[]> {
    const reports = await readData<Report[]>(REPORTS_FILE, []);
    return reports.map(report => ({
        ...report,
        timestamp: new Date(report.timestamp),
    }));
}

async function getAllUsersWithStats(currentUserId?: string): Promise<UserProfile[]> {
    const usersMap = await loadUsersMap();
    const allUsersWithLiveStats: UserProfile[] = [];

    for (const basicProfile of usersMap.values()) {
        let userWithStats = { ...basicProfile }; 

        // Initialize missing fields for safety
        userWithStats.blockedUserIds = userWithStats.blockedUserIds || [];
        userWithStats.isSuspended = userWithStats.isSuspended || false;

        // Filter out suspended users immediately
        if (userWithStats.isSuspended) {
            continue;
        }
        
        // Filter based on blocking, if currentUserId is provided
        if (currentUserId) {
            // If current user has blocked this profile
            if (userWithStats.blockedUserIds.includes(currentUserId)) {
                continue; 
            }
            // If this profile has blocked the current user
            const currentUserProfile = usersMap.get(currentUserId) || Array.from(usersMap.values()).find(u => u.id === currentUserId); // Find current user by ID if email is not key
            if (currentUserProfile?.blockedUserIds?.includes(userWithStats.id)) {
                continue;
            }
        }


        if (userWithStats.role === 'volunteer') {
            try {
                const liveStats = await fetchVolunteerStats(userWithStats.id);
                userWithStats.stats = liveStats;
            } catch (error) {
                console.error(`Failed to fetch stats for volunteer ${userWithStats.id}:`, error);
                userWithStats.stats = { points: 0, badges: [], hours: 0 };
            }
        }
        allUsersWithLiveStats.push(userWithStats);
    }
    return allUsersWithLiveStats;
}


export async function getPublicVolunteers(filters?: {
  keywords?: string;
  sortBy?: string; 
}, currentUserId?: string): Promise<UserProfile[]> {
  await sleep(150); 
  let users = await getAllUsersWithStats(currentUserId); 

  let volunteers = users.filter(user => user.role === 'volunteer');

  if (filters?.keywords) {
    const lowerKeywords = filters.keywords.toLowerCase();
    volunteers = volunteers.filter(volunteer =>
      volunteer.displayName.toLowerCase().includes(lowerKeywords)
    );
  }

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
        volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
        break;
    }
  } else {
    volunteers.sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));
  }

  console.log(`Returning ${volunteers.length} public volunteer profiles. Current user: ${currentUserId}`);
  return volunteers.map(v => ({
    ...v,
    stats: v.stats 
        ? { ...v.stats, badges: Array.isArray(v.stats.badges) ? [...v.stats.badges] : [] } 
        : { points: 0, badges: [], hours: 0 }
  }));
}

// --- User Blocking and Reporting Services ---

/**
 * Blocks a user.
 * @param blockerUserId The ID of the user initiating the block.
 * @param userIdToBlock The ID of the user to be blocked.
 * @returns Updated UserProfile of the blocker or null if an error occurs.
 */
export async function blockUserById(blockerUserId: string, userIdToBlock: string): Promise<UserProfile | null> {
    if (blockerUserId === userIdToBlock) {
        console.warn("User cannot block themselves.");
        return null; // Or throw error
    }
    await sleep(100);
    const usersMap = await loadUsersMap();
    
    let blockerProfile: UserProfile | undefined;
    let blockerEmailKey: string | undefined;

    // Find blocker profile by ID
    for (const [emailKey, profile] of usersMap.entries()) {
        if (profile.id === blockerUserId) {
            blockerProfile = profile;
            blockerEmailKey = emailKey;
            break;
        }
    }

    if (!blockerProfile || !blockerEmailKey) {
        console.error(`Blocker user with ID ${blockerUserId} not found.`);
        return null;
    }

    blockerProfile.blockedUserIds = blockerProfile.blockedUserIds || [];
    if (!blockerProfile.blockedUserIds.includes(userIdToBlock)) {
        blockerProfile.blockedUserIds.push(userIdToBlock);
        usersMap.set(blockerEmailKey, blockerProfile); // Update the map with the modified profile
        await writeData(USERS_FILE, mapToObject(usersMap));
        console.log(`User ${blockerUserId} blocked user ${userIdToBlock}.`);
    } else {
        console.log(`User ${userIdToBlock} is already blocked by ${blockerUserId}.`);
    }
    return { ...blockerProfile };
}


export async function unblockUserById(blockerUserId: string, userIdToUnblock: string): Promise<UserProfile | null> {
    await sleep(100);
    const usersMap = await loadUsersMap();
    
    let blockerProfile: UserProfile | undefined;
    let blockerEmailKey: string | undefined;

    for (const [emailKey, profile] of usersMap.entries()) {
        if (profile.id === blockerUserId) {
            blockerProfile = profile;
            blockerEmailKey = emailKey;
            break;
        }
    }
    
    if (!blockerProfile || !blockerEmailKey) {
        console.error(`Blocker user with ID ${blockerUserId} not found.`);
        return null;
    }

    if (blockerProfile.blockedUserIds) {
        const index = blockerProfile.blockedUserIds.indexOf(userIdToUnblock);
        if (index > -1) {
            blockerProfile.blockedUserIds.splice(index, 1);
            usersMap.set(blockerEmailKey, blockerProfile);
            await writeData(USERS_FILE, mapToObject(usersMap));
            console.log(`User ${blockerUserId} unblocked user ${userIdToUnblock}.`);
        } else {
            console.log(`User ${userIdToUnblock} was not in ${blockerUserId}'s block list.`);
        }
    }
    return { ...blockerProfile };
}


export async function submitReport(reportData: Omit<Report, 'id' | 'timestamp' | 'status'>): Promise<Report> {
    await sleep(200);
    const reportsData = await loadReportsData();
    const usersMap = await loadUsersMap();

    const reportedUserProfile = Array.from(usersMap.values()).find(u => u.id === reportData.reportedUserId);
    if (!reportedUserProfile) {
        throw new Error("Reported user not found.");
    }

    const newReport: Report = {
        ...reportData,
        id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        reportedUserName: reportedUserProfile.displayName, // Add reported user's name for convenience
        timestamp: new Date(),
        status: 'pending',
    };
    reportsData.push(newReport);
    await writeData(REPORTS_FILE, reportsData);
    console.log('User report submitted:', newReport);
    return newReport;
}
