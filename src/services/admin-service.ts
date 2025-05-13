'use server';
// src/services/admin-service.ts
import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile } from '@/context/AuthContext';

const USERS_FILE = 'users.json';
const COMPLAINTS_FILE = 'complaints.json'; // Assuming a file for general complaints

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function loadUsersData(): Promise<Map<string, UserProfile>> {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    return objectToMap(usersObject);
}

async function loadComplaintsData(): Promise<GeneralComplaint[]> {
    return await readData<GeneralComplaint[]>(COMPLAINTS_FILE, []);
}


export interface GeneralComplaint {
    id: string;
    category: string;
    description: string;
    reportedByUserId?: string; // Optional: ID of the user who submitted the complaint
    reporterEmail?: string; // Optional: Email of the reporter (if not a logged-in user)
    createdAt: Date | string;
    status: 'open' | 'resolved';
}


/**
 * Retrieves users who have been reported.
 * @returns A promise that resolves to an array of UserProfile objects who have been reported.
 */
export async function getReportedUsers(): Promise<UserProfile[]> {
  await sleep(100);
  const usersData = await loadUsersData();
  const reportedUsers: UserProfile[] = [];
  usersData.forEach(user => {
    if (user.reportedBy && user.reportedBy.length > 0 && !user.isBlocked) { // Show non-blocked reported users
      reportedUsers.push({ ...user });
    }
  });
  // Sort by number of reports, descending
  reportedUsers.sort((a, b) => (b.reportedBy?.length || 0) - (a.reportedBy?.length || 0));
  console.log(`Found ${reportedUsers.length} reported users.`);
  return reportedUsers;
}

/**
 * Blocks a user.
 * @param adminId The ID of the admin performing the action (for logging or audit, not currently used).
 * @param userIdToBlock The ID of the user to block.
 * @returns A promise that resolves to the updated UserProfile or null if not found.
 */
export async function blockUser(adminId: string, userIdToBlock: string): Promise<UserProfile | null> {
  await sleep(200);
  const usersData = await loadUsersData();
  let userToBlock: UserProfile | undefined;
  let userEmailKey: string | undefined;

  for (const [emailKey, profile] of usersData.entries()) {
    if (profile.id === userIdToBlock) {
      userToBlock = profile;
      userEmailKey = emailKey;
      break;
    }
  }

  if (!userToBlock || !userEmailKey) {
    console.log(`User with ID ${userIdToBlock} not found for blocking.`);
    return null;
  }

  userToBlock.isBlocked = true;
  userToBlock.reportedBy = []; // Clear reports once blocked by admin
  userToBlock.passwordHash = undefined; // Optionally clear sensitive data upon blocking

  usersData.set(userEmailKey, userToBlock);
  await writeData(USERS_FILE, mapToObject(usersData));

  console.log(`Admin ${adminId} blocked user ${userIdToBlock}. User data saved.`);
  return { ...userToBlock };
}

/**
 * Retrieves general complaints.
 * @returns A promise that resolves to an array of GeneralComplaint objects.
 */
export async function getGeneralComplaints(): Promise<GeneralComplaint[]> {
  await sleep(100);
  const complaints = await loadComplaintsData();
  // Sort by creation date, newest first
  return complaints
    .map(c => ({ ...c, createdAt: new Date(c.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Marks a general complaint as resolved.
 * @param complaintId The ID of the complaint to resolve.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function resolveComplaint(complaintId: string): Promise<boolean> {
  await sleep(150);
  let complaintsData = await loadComplaintsData();
  const complaintIndex = complaintsData.findIndex(c => c.id === complaintId);

  if (complaintIndex === -1) {
    console.log(`Complaint with ID ${complaintId} not found.`);
    return false;
  }

  // Instead of removing, mark as resolved. Or remove if that's the desired behavior.
  // For this example, let's remove it.
  complaintsData.splice(complaintIndex, 1);
  // If marking as resolved:
  // complaintsData[complaintIndex].status = 'resolved';

  await writeData(COMPLAINTS_FILE, complaintsData);
  console.log(`Complaint ${complaintId} marked as resolved/removed.`);
  return true;
}

/**
 * Submits a general complaint or feedback.
 */
export async function submitComplaintAction(formData: {
  category: string;
  description: string;
  reportedByUserId?: string;
  reporterEmail?: string;
}): Promise<{ success: boolean; message: string; complaint?: GeneralComplaint }> {
    await sleep(200);
    let complaintsData = await loadComplaintsData();

    const newComplaint: GeneralComplaint = {
        id: `complaint-${Date.now()}`,
        ...formData,
        createdAt: new Date(),
        status: 'open',
    };

    complaintsData.push(newComplaint);
    await writeData(COMPLAINTS_FILE, complaintsData);

    return { success: true, message: 'Complaint submitted successfully.', complaint: newComplaint };
}

/**
 * Retrieves users who are currently blocked.
 * @returns A promise that resolves to an array of UserProfile objects who are blocked.
 */
export async function getBlockedUsers(): Promise<UserProfile[]> {
  await sleep(100);
  const usersData = await loadUsersData();
  const blockedUsers: UserProfile[] = [];
  usersData.forEach(user => {
    if (user.isBlocked) {
      blockedUsers.push({ ...user });
    }
  });
  console.log(`Found ${blockedUsers.length} blocked users.`);
  return blockedUsers;
}

/**
 * Unblocks a user.
 * @param adminId The ID of the admin performing the action.
 * @param userIdToUnblock The ID of the user to unblock.
 * @returns A promise that resolves to the updated UserProfile or null if not found.
 */
export async function unblockUser(adminId: string, userIdToUnblock: string): Promise<UserProfile | null> {
  await sleep(200);
  const usersData = await loadUsersData();
  let userToUnblock: UserProfile | undefined;
  let userEmailKey: string | undefined;

  for (const [emailKey, profile] of usersData.entries()) {
    if (profile.id === userIdToUnblock) {
      userToUnblock = profile;
      userEmailKey = emailKey;
      break;
    }
  }

  if (!userToUnblock || !userEmailKey) {
    console.log(`User with ID ${userIdToUnblock} not found for unblocking.`);
    return null;
  }

  userToUnblock.isBlocked = false;
  // We don't restore reportedBy, as those reports were actioned by the initial block.
  // If specific reports need to be re-instated, it would be a separate process.

  usersData.set(userEmailKey, userToUnblock);
  await writeData(USERS_FILE, mapToObject(usersData));

  console.log(`Admin ${adminId} unblocked user ${userIdToUnblock}. User data saved.`);
  return { ...userToUnblock };
}