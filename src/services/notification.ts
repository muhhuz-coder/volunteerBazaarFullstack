'use server';
// src/services/notification.ts
import {
  createNotification as dbCreateNotification,
  getNotificationsForUser as dbGetNotificationsForUser,
  markNotificationRead as dbMarkNotificationRead,
  markAllNotificationsRead as dbMarkAllNotificationsRead
} from '@/lib/db-mysql';

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

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a new notification for a user.
 * @param userId The ID of the user to notify.
 * @param message The notification message.
 * @param link Optional link associated with the notification.
 * @returns A promise that resolves to the created notification.
 */
export async function createNotification(userId: string, message: string, link?: string): Promise<UserNotification> {
  await sleep(50); // Short delay
  console.log(`Creating notification for user ${userId}: ${message}`);
  
  // Use the MySQL database function
  return await dbCreateNotification(userId, message, link);
}

/**
 * Retrieves notifications for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of notifications, sorted by timestamp descending.
 */
export async function getNotificationsForUser(userId: string): Promise<UserNotification[]> {
  await sleep(50);
  console.log(`Getting notifications for user ${userId}`);
  
  // Use the MySQL database function
  return await dbGetNotificationsForUser(userId);
}

/**
 * Marks a specific notification as read for a user.
 * @param notificationId The ID of the notification to mark as read.
 * @param userId The ID of the user who owns the notification (for verification).
 * @returns A promise that resolves to the updated notification or null if not found/unauthorized.
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<UserNotification | null> {
  await sleep(50);
  console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  
  // Use the MySQL database function
  return await dbMarkNotificationRead(notificationId, userId);
}

/**
 * Marks all unread notifications as read for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the number of notifications marked as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  await sleep(50);
  console.log(`Marking all notifications as read for user ${userId}`);
  
  // Use the MySQL database function
  return await dbMarkAllNotificationsRead(userId);
}
