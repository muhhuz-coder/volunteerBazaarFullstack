
'use server';
// src/actions/notification-actions.ts

import {
    getNotificationsForUser as getNotificationsService,
    markNotificationRead as markNotificationReadService,
    markAllNotificationsRead as markAllNotificationsReadService
} from '@/services/notification';
import type { UserNotification } from '@/services/notification';

/**
 * Server action to get notifications for a user.
 * Filters for unread notifications by default.
 */
export async function getUserNotificationsAction(userId: string, includeRead: boolean = false): Promise<UserNotification[]> {
    console.log(`Server Action: Getting notifications for user ${userId}, includeRead: ${includeRead}`);
    try {
        const notifications = await getNotificationsService(userId);
        if (includeRead) {
            return notifications;
        } else {
            return notifications.filter(n => !n.isRead);
        }
    } catch (error: any) {
        console.error("Server Action: Get notifications error -", error);
        return [];
    }
}

/**
 * Server action to mark a specific notification as read.
 */
export async function markNotificationReadAction(notificationId: string, userId: string): Promise<{ success: boolean; notification?: UserNotification | null }> {
    console.log(`Server Action: Marking notification ${notificationId} as read for user ${userId}`);
    try {
        const updatedNotification = await markNotificationReadService(notificationId, userId);
        if (updatedNotification) {
            return { success: true, notification: updatedNotification };
        } else {
            return { success: false };
        }
    } catch (error: any) {
        console.error("Server Action: Mark notification read error -", error);
        return { success: false };
    }
}

/**
 * Server action to mark all notifications as read for a user.
 */
export async function markAllNotificationsReadAction(userId: string): Promise<{ success: boolean; count: number }> {
    console.log(`Server Action: Marking all notifications as read for user ${userId}`);
    try {
        const count = await markAllNotificationsReadService(userId);
        return { success: true, count: count };
    } catch (error: any) {
        console.error("Server Action: Mark all notifications read error -", error);
        return { success: false, count: 0 };
    }
}
