
'use server';
// src/services/notification.ts
import { readData, writeData } from '@/lib/db-utils';

/**
 * Represents a notification for a user.
 */
export interface UserNotification {
  id: string;
  userId: string; // The user who should receive the notification
  message: string;
  link?: string; // Optional link (e.g., to a conversation or application)
  isRead: boolean;
  timestamp: Date | string; // Allow string for reading
}

// File name for JSON data
const NOTIFICATIONS_FILE = 'notifications.json';

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
async function loadNotificationsData(): Promise<UserNotification[]> {
    const rawNotifications = await readData<UserNotification[]>(NOTIFICATIONS_FILE, []);
    // Ensure dates are Date objects
    return rawNotifications.map(notif => ({
        ...notif,
        timestamp: typeof notif.timestamp === 'string' ? new Date(notif.timestamp) : notif.timestamp,
    }));
}

/**
 * Creates a new notification for a user.
 * @param userId The ID of the user to notify.
 * @param message The notification message.
 * @param link Optional link associated with the notification.
 * @returns A promise that resolves to the created notification.
 */
export async function createNotification(userId: string, message: string, link?: string): Promise<UserNotification> {
  await sleep(50); // Short delay
  let notificationsData = await loadNotificationsData();

  const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const newNotification: UserNotification = {
    id: notificationId,
    userId: userId,
    message: message,
    link: link,
    isRead: false,
    timestamp: now,
  };

  notificationsData.push(newNotification);
  await writeData(NOTIFICATIONS_FILE, notificationsData);

  console.log(`Notification created for user ${userId}:`, newNotification);
  return { ...newNotification }; // Return a copy
}

/**
 * Retrieves notifications for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of notifications, sorted by timestamp descending.
 */
export async function getNotificationsForUser(userId: string): Promise<UserNotification[]> {
  await sleep(100);
  const notificationsData = await loadNotificationsData();

  const userNotifications = notificationsData.filter(notif => notif.userId === userId);

  // Sort by timestamp, most recent first
  userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log(`Found ${userNotifications.length} notifications for user ${userId}`);
  return userNotifications.map(n => ({ ...n })); // Return copies
}

/**
 * Marks a specific notification as read for a user.
 * @param notificationId The ID of the notification to mark as read.
 * @param userId The ID of the user who owns the notification (for verification).
 * @returns A promise that resolves to the updated notification or null if not found/unauthorized.
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<UserNotification | null> {
  await sleep(50);
  let notificationsData = await loadNotificationsData();

  const notificationIndex = notificationsData.findIndex(notif => notif.id === notificationId && notif.userId === userId);

  if (notificationIndex === -1) {
    console.log(`Notification ${notificationId} not found or does not belong to user ${userId}.`);
    return null;
  }

  if (!notificationsData[notificationIndex].isRead) {
    notificationsData[notificationIndex].isRead = true;
    notificationsData[notificationIndex].timestamp = new Date(notificationsData[notificationIndex].timestamp); // Ensure Date object
    await writeData(NOTIFICATIONS_FILE, notificationsData);
    console.log(`Notification ${notificationId} marked as read for user ${userId}.`);
  }

  return { ...notificationsData[notificationIndex] }; // Return a copy
}

/**
 * Marks all unread notifications as read for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the number of notifications marked as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  await sleep(100);
  let notificationsData = await loadNotificationsData();
  let updatedCount = 0;

  notificationsData.forEach(notif => {
    if (notif.userId === userId && !notif.isRead) {
      notif.isRead = true;
      notif.timestamp = new Date(notif.timestamp); // Ensure Date object
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await writeData(NOTIFICATIONS_FILE, notificationsData);
    console.log(`Marked ${updatedCount} notifications as read for user ${userId}.`);
  }

  return updatedCount;
}
