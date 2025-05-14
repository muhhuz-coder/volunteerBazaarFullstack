'use server';
// src/services/messaging.ts
import { 
  createConversation as dbCreateConversation,
  getConversationsForUser as dbGetConversationsForUser,
  getConversationDetails as dbGetConversationDetails,
  sendMessage as dbSendMessage
} from '@/lib/db-mysql';

/**
 * Represents a single message within a conversation.
 */
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: Date; // Use Date type consistently
    isRead?: boolean;
}

/**
 * Represents a conversation between an organization and a volunteer.
 */
export interface Conversation {
    id: string;
    organizationId: string;
    volunteerId: string;
    opportunityId: string;
    opportunityTitle?: string; // Title of the related opportunity
    organizationName?: string; // Name of the organization
    volunteerName?: string; // Name of the volunteer
    messages: Message[]; // Embedded messages for simplicity in JSON
    lastMessage?: Message; // Store the latest message object
    createdAt: Date; // Use Date type consistently
    updatedAt: Date; // Use Date type consistently
    // unreadCount is calculated dynamically and not stored
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a new conversation or returns an existing one for the same participants and opportunity.
 * @param data Object containing participant IDs, opportunity details, and initial message.
 * @returns A promise that resolves to the Conversation object (new or existing).
 */
export async function createConversation(data: {
    organizationId: string;
    volunteerId: string;
    opportunityId: string;
    initialMessage: string;
    opportunityTitle?: string;
    organizationName?: string;
    volunteerName?: string;
}): Promise<Conversation> {
    await sleep(100); // Minimal delay for better UX
    console.log('Creating conversation between organization', data.organizationId, 'and volunteer', data.volunteerId, 'for opportunity', data.opportunityId);
    
    // Use the MySQL database function
    return await dbCreateConversation(data);
}

/**
 * Retrieves all conversations for a specific user, adding unread count.
 * Sorts conversations by the timestamp of the last message (most recent first).
 * @param userId The ID of the user.
 * @param userRole The role of the user ('volunteer' or 'organization').
 * @returns A promise that resolves to an array of Conversation objects augmented with unreadCount.
 */
export async function getConversationsForUser(userId: string, userRole: 'volunteer' | 'organization'): Promise<(Conversation & { unreadCount: number })[]> {
    await sleep(100); // Minimal delay for better UX
    console.log(`Getting conversations for ${userRole} with ID ${userId}`);
    
    // Use the MySQL database function
    return await dbGetConversationsForUser(userId, userRole);
}

/**
 * Retrieves the details and messages for a specific conversation.
 * Marks messages as read for the user viewing the conversation and saves changes.
 * @param conversationId The ID of the conversation.
 * @param userId The ID of the user viewing the conversation.
 * @param userRole The role of the user viewing.
 * @returns A promise that resolves to an object containing the conversation details and messages.
 */
export async function getConversationDetails(conversationId: string, userId: string, userRole: 'volunteer' | 'organization'): Promise<{ conversation: Conversation; messages: Message[] }> {
    await sleep(100); // Minimal delay for better UX
    console.log(`Getting conversation details for ${conversationId} viewed by ${userRole} ${userId}`);
    
    // Use the MySQL database function
    return await dbGetConversationDetails(conversationId, userId, userRole);
}

/**
 * Sends a new message in a conversation.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the message sender.
 * @param text The message text.
 * @returns A promise that resolves to the Message object.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    await sleep(100); // Minimal delay for better UX
    console.log(`Sending message in conversation ${conversationId} from ${senderId}: ${text.substring(0, 20)}...`);
    
    // Use the MySQL database function
    return await dbSendMessage(conversationId, senderId, text);
}

    