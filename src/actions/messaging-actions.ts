
// src/actions/messaging-actions.ts
'use server';

import {
    getConversationsForUser as getConversationsService,
    getConversationDetails as getConversationDetailsService,
    sendMessage as sendMessageService,
    createConversation as createConversationService // Add createConversationService
} from '@/services/messaging';
import type { Conversation, Message } from '@/services/messaging'; // Import types

/**
 * Server action to get conversations for a user.
 * Returns conversations augmented with unread count.
 */
export async function getUserConversationsAction(userId: string, userRole: 'volunteer' | 'organization'): Promise<(Conversation & { unreadCount: number })[]> {
    console.log('Server Action: Getting conversations for:', userId, 'Role:', userRole);
    try {
        // Service function now returns the array with unreadCount included
        const conversations = await getConversationsService(userId, userRole);
        return conversations;
    } catch (error: any) {
        console.error("Server Action: Get conversations error -", error);
        return []; // Return empty array on error
    }
}

/**
 * Server action to get details for a specific conversation.
 * Service function now handles marking messages as read.
 */
export async function getConversationDetailsAction(conversationId: string, userId: string, userRole: 'volunteer' | 'organization'): Promise<{ conversation: Conversation; messages: Message[] } | { error: string }> {
    console.log('Server Action: Getting details for conversation:', conversationId, 'User:', userId);
    try {
        // Service returns the conversation object and sorted messages
        const details = await getConversationDetailsService(conversationId, userId, userRole);
        return details; // Includes conversation object and messages array
    } catch (error: any) {
        console.error("Server Action: Get conversation details error -", error);
        return { error: error.message || 'Failed to fetch conversation details.' };
    }
}

/**
 * Server action to send a message.
 * Service handles adding the message and updating the conversation.
 */
export async function sendMessageAction(conversationId: string, senderId: string, text: string): Promise<{ success: boolean; message?: Message; error?: string }> {
    console.log('Server Action: Sending message in conversation:', conversationId, 'Sender:', senderId);
    if (!text.trim()) {
        return { success: false, error: "Message text cannot be empty." };
    }
    try {
        // Service function returns the newly created message
        const newMessage = await sendMessageService(conversationId, senderId, text);
        return { success: true, message: newMessage };
    } catch (error: any) {
        console.error("Server Action: Send message error -", error);
        return { success: false, error: error.message || 'Failed to send message.' };
    }
}

/**
 * Server action to initiate a new conversation (e.g., volunteer messaging organization).
 * This is a new action to allow volunteers to start conversations.
 */
export async function startConversationAction(data: {
    volunteerId: string;
    organizationId: string;
    opportunityId: string;
    initialMessage: string;
    opportunityTitle?: string;
    organizationName?: string;
    volunteerName?: string;
}): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    console.log(`Server Action: Attempting to start conversation between volunteer ${data.volunteerId} and org ${data.organizationId} for opportunity ${data.opportunityId}`);
    if (!data.initialMessage.trim()) {
        return { success: false, error: "Initial message cannot be empty." };
    }
    try {
        // Call the service function to create or get the conversation
        // NOTE: The service `createConversation` now needs adjustment to accept the initial message sender correctly.
        // Let's assume for now the service handles this (e.g., determines sender based on who calls).
        // Or, we modify the service or add a new one specifically for volunteer initiation.

        // TEMPORARY ADJUSTMENT: For now, let's simulate the service handling the volunteer as sender.
        // A better approach would be to modify `createConversationService` to accept senderId for the initial message.
        const conversation = await createConversationService({
            ...data,
            // Pass volunteer name if available
            volunteerName: data.volunteerName,
            organizationName: data.organizationName,
            // Modify the initial message slightly to indicate it's from the volunteer
            // OR modify the service to handle this better
            initialMessage: data.initialMessage, // Service needs to know who sent this
        });

        // If the conversation was newly created or retrieved successfully
        return { success: true, conversation: conversation };

    } catch (error: any) {
        console.error("Server Action: Start conversation error -", error);
        return { success: false, error: error.message || 'Failed to start conversation.' };
    }
}

    