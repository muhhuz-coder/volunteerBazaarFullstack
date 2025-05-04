
// src/actions/messaging-actions.ts
'use server';

import {
    getConversationsForUser as getConversationsService,
    getConversationDetails as getConversationDetailsService,
    sendMessage as sendMessageService
} from '@/services/messaging';
import type { Conversation, Message } from '@/services/messaging'; // Import types

/**
 * Server action to get conversations for a user.
 */
export async function getUserConversationsAction(userId: string, userRole: 'volunteer' | 'organization'): Promise<Conversation[]> {
    console.log('Server Action: Getting conversations for:', userId, 'Role:', userRole);
    try {
        const conversations = await getConversationsService(userId, userRole);
        return conversations;
    } catch (error: any) {
        console.error("Server Action: Get conversations error -", error);
        // Return empty array or re-throw based on desired error handling
        return [];
    }
}

/**
 * Server action to get details for a specific conversation.
 */
export async function getConversationDetailsAction(conversationId: string, userId: string, userRole: 'volunteer' | 'organization'): Promise<{ conversation: Conversation; messages: Message[] } | { error: string }> {
    console.log('Server Action: Getting details for conversation:', conversationId, 'User:', userId);
    try {
        const details = await getConversationDetailsService(conversationId, userId, userRole);
        return details;
    } catch (error: any) {
        console.error("Server Action: Get conversation details error -", error);
        return { error: error.message || 'Failed to fetch conversation details.' };
    }
}

/**
 * Server action to send a message.
 */
export async function sendMessageAction(conversationId: string, senderId: string, text: string): Promise<{ success: boolean; message?: Message; error?: string }> {
    console.log('Server Action: Sending message in conversation:', conversationId, 'Sender:', senderId);
    try {
        const newMessage = await sendMessageService(conversationId, senderId, text);
        return { success: true, message: newMessage };
    } catch (error: any) {
        console.error("Server Action: Send message error -", error);
        return { success: false, error: error.message || 'Failed to send message.' };
    }
}
