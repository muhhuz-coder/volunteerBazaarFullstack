
'use server';
// src/services/messaging.ts
import { readData, writeData, dateReviver } from '@/lib/db-utils'; // Import dateReviver

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

// File name for JSON data
const CONVERSATIONS_FILE = 'conversations.json';

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
// Load data dynamically within functions to ensure server-side execution context

async function loadConversationsData(): Promise<Conversation[]> {
    // readData now uses dateReviver internally, so dates should be parsed correctly
    const conversations = await readData<Conversation[]>(CONVERSATIONS_FILE, []);
    // Ensure nested dates within messages are also handled if dateReviver doesn't catch them deeply (though it should)
    conversations.forEach(convo => {
        convo.createdAt = new Date(convo.createdAt);
        convo.updatedAt = new Date(convo.updatedAt);
        if (convo.lastMessage) {
            convo.lastMessage.timestamp = new Date(convo.lastMessage.timestamp);
        }
        convo.messages.forEach(msg => {
            msg.timestamp = new Date(msg.timestamp);
        });
    });
    return conversations;
}


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
    await sleep(300); // Simulate delay
    let conversationsData = await loadConversationsData(); // Load current data

    // Check if a conversation for this specific opportunity/volunteer/org already exists
     const existingConvo = conversationsData.find(c =>
        c.organizationId === data.organizationId &&
        c.volunteerId === data.volunteerId &&
        c.opportunityId === data.opportunityId
     );
     if (existingConvo) {
        console.log("Conversation already exists:", existingConvo.id);
         // Ensure dates are Date objects before returning (loadConversationsData should handle this)
         return { ...existingConvo }; // Return a copy
     }

    const conversationId = `convo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const initialMsg: Message = {
        id: messageId,
        conversationId: conversationId,
        senderId: data.organizationId, // Assuming org sends the initial message
        text: data.initialMessage,
        timestamp: now,
        isRead: false, // Initially unread by the volunteer
    };

    const newConversation: Conversation = {
        id: conversationId,
        organizationId: data.organizationId,
        volunteerId: data.volunteerId,
        opportunityId: data.opportunityId,
        opportunityTitle: data.opportunityTitle || 'Unknown Opportunity',
        organizationName: data.organizationName || `Org (${data.organizationId.substring(0, 4)})`,
        volunteerName: data.volunteerName || `Volunteer (${data.volunteerId.substring(0, 4)})`,
        messages: [initialMsg],
        lastMessage: initialMsg,
        createdAt: now,
        updatedAt: now,
    };

    // Add to data and write to file
    conversationsData.push(newConversation);
    await writeData(CONVERSATIONS_FILE, conversationsData);

    console.log('New conversation created and saved:', newConversation);
     return { ...newConversation }; // Return a copy
}

/**
 * Retrieves all conversations for a specific user, adding unread count.
 * Sorts conversations by the timestamp of the last message (most recent first).
 * @param userId The ID of the user.
 * @param userRole The role of the user ('volunteer' or 'organization').
 * @returns A promise that resolves to an array of Conversation objects augmented with unreadCount.
 */
export async function getConversationsForUser(userId: string, userRole: 'volunteer' | 'organization'): Promise<(Conversation & { unreadCount: number })[]> {
    await sleep(150); // Simulate minimal delay
    const conversationsData = await loadConversationsData(); // Load current data

    let userConversations: Conversation[];

    if (userRole === 'volunteer') {
        userConversations = conversationsData.filter(convo => convo.volunteerId === userId);
    } else { // organization
        userConversations = conversationsData.filter(convo => convo.organizationId === userId);
    }

    // Calculate unread count and ensure dates are Date objects
    const conversationsWithUnread = userConversations.map(convo => {
        // Count messages *not* sent by the current user that are *not* marked as read
        const unreadCount = convo.messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
        // loadConversationsData should have handled date conversion already
        return {
             ...convo,
             unreadCount, // Add dynamically calculated unread count
            };
    });

     // Sort by last message timestamp (most recent first)
     conversationsWithUnread.sort((a, b) => {
        // Use updatedAt as a proxy for last activity time, as lastMessage might not exist initially
        const timeA = a.lastMessage ? a.lastMessage.timestamp.getTime() : a.updatedAt.getTime();
        const timeB = b.lastMessage ? b.lastMessage.timestamp.getTime() : b.updatedAt.getTime();
        return timeB - timeA; // Descending order
     });


    console.log(`Found ${conversationsWithUnread.length} conversations for ${userRole} ${userId}`);
    return conversationsWithUnread; // Return copies
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
    await sleep(100); // Simulate minimal delay
    let conversationsData = await loadConversationsData(); // Load current data

    const conversationIndex = conversationsData.findIndex(convo => convo.id === conversationId);


    if (conversationIndex === -1) {
        throw new Error('Conversation not found.');
    }
    const conversation = conversationsData[conversationIndex];

    // Check access rights
    if ((userRole === 'volunteer' && conversation.volunteerId !== userId) ||
        (userRole === 'organization' && conversation.organizationId !== userId)) {
        throw new Error('Access denied to this conversation.');
    }

    // Mark messages sent by the *other* party as read
    let updated = false;
    conversation.messages.forEach(msg => {
        // Ensure timestamp is Date object (should be done by loadConversationsData)
        msg.timestamp = new Date(msg.timestamp);
        if (msg.senderId !== userId && !msg.isRead) {
            msg.isRead = true;
             updated = true;
        }
    });

     if (updated) {
        conversation.updatedAt = new Date(); // Update timestamp on read
        // Update the conversation in the array
        conversationsData[conversationIndex] = conversation;
        // Save changes back to file
        await writeData(CONVERSATIONS_FILE, conversationsData);
        console.log(`Marked messages as read for user ${userId} in conversation ${conversationId} and saved.`);
     }

     // Sort messages by timestamp (oldest first) for display
     const sortedMessages = [...conversation.messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());


    // Return conversation details and sorted messages
    // The conversation object from the array already has Date objects due to loadConversationsData
    return { conversation: { ...conversation }, messages: sortedMessages };
}

/**
 * Sends a new message within a conversation.
 * Adds the message, updates the conversation's last message and timestamp, and saves.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param text The content of the message.
 * @returns A promise that resolves to the newly created Message object.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    await sleep(200); // Simulate delay
    let conversationsData = await loadConversationsData(); // Load current data

    const conversationIndex = conversationsData.findIndex(convo => convo.id === conversationId);

    if (conversationIndex === -1) {
        throw new Error('Conversation not found.');
    }
    const conversation = conversationsData[conversationIndex];

     // Validate sender is part of the conversation
     if (senderId !== conversation.volunteerId && senderId !== conversation.organizationId) {
        throw new Error('Sender is not part of this conversation.');
     }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newMessage: Message = {
        id: messageId,
        conversationId: conversationId,
        senderId: senderId,
        text: text,
        timestamp: now,
        isRead: false, // New messages start as unread for the recipient
    };

    // Add message to the conversation's message list
    conversation.messages.push(newMessage);
    // Update last message and timestamp
    conversation.lastMessage = newMessage;
    conversation.updatedAt = now;

    // Ensure other dates are Date objects before saving (should be redundant if load works)
    conversation.createdAt = new Date(conversation.createdAt);
    if (conversation.lastMessage) {
       conversation.lastMessage.timestamp = new Date(conversation.lastMessage.timestamp);
    }
    conversation.messages.forEach(m => m.timestamp = new Date(m.timestamp));


    // Update the conversation in the main array
    conversationsData[conversationIndex] = conversation;

    // Save the updated conversations data back to the file
    await writeData(CONVERSATIONS_FILE, conversationsData);

    console.log('Message sent and conversation saved:', newMessage);
    return { ...newMessage }; // Return a copy
}

    