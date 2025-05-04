'use server';
// src/services/messaging.ts
import { readData, writeData } from '@/lib/db-utils';

/**
 * Represents a single message within a conversation.
 */
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: Date | string; // Allow string for reading
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
    opportunityTitle?: string;
    organizationName?: string;
    volunteerName?: string;
    messages: Message[]; // Embedded messages for simplicity in JSON
    lastMessage?: Message; // Stored as object, will need date parsing
    unreadCount?: number; // Transient, calculated on retrieval
    createdAt: Date | string; // Allow string for reading
    updatedAt: Date | string; // Allow string for reading
}

// File name for JSON data
const CONVERSATIONS_FILE = 'conversations.json';

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Data Loading ---
// Load data dynamically within functions to ensure server-side execution context

async function loadConversationsData(): Promise<Conversation[]> {
    const rawConversations = await readData<Conversation[]>(CONVERSATIONS_FILE, []);
    // Parse dates within conversations and messages
    return rawConversations.map(convo => ({
        ...convo,
        createdAt: typeof convo.createdAt === 'string' ? new Date(convo.createdAt) : convo.createdAt,
        updatedAt: typeof convo.updatedAt === 'string' ? new Date(convo.updatedAt) : convo.updatedAt,
        lastMessage: convo.lastMessage ? {
            ...convo.lastMessage,
            timestamp: typeof convo.lastMessage.timestamp === 'string' ? new Date(convo.lastMessage.timestamp) : convo.lastMessage.timestamp,
        } : undefined,
        messages: convo.messages.map(msg => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        })),
    }));
}


/**
 * Creates a new conversation.
 * @param data Object containing organizationId, volunteerId, opportunityId, and initialMessage.
 * @returns A promise that resolves to the newly created Conversation object.
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
         // Ensure dates are Date objects before returning
         return {
            ...existingConvo,
            createdAt: new Date(existingConvo.createdAt),
            updatedAt: new Date(existingConvo.updatedAt),
            lastMessage: existingConvo.lastMessage ? { ...existingConvo.lastMessage, timestamp: new Date(existingConvo.lastMessage.timestamp) } : undefined,
            messages: existingConvo.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
         };
     }


    const conversationId = `convo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const initialMsg: Message = {
        id: messageId,
        conversationId: conversationId,
        senderId: data.organizationId,
        text: data.initialMessage,
        timestamp: now,
        isRead: false,
    };

    const newConversation: Conversation = {
        id: conversationId,
        organizationId: data.organizationId,
        volunteerId: data.volunteerId,
        opportunityId: data.opportunityId,
        opportunityTitle: data.opportunityTitle,
        organizationName: data.organizationName,
        volunteerName: data.volunteerName,
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
 * Retrieves all conversations for a specific user.
 * Calculates unread count dynamically.
 * @param userId The ID of the user.
 * @param userRole The role of the user ('volunteer' or 'organization').
 * @returns A promise that resolves to an array of Conversation objects.
 */
export async function getConversationsForUser(userId: string, userRole: 'volunteer' | 'organization'): Promise<Conversation[]> {
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
        const unreadCount = convo.messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
        return {
             ...convo,
             unreadCount,
             createdAt: new Date(convo.createdAt),
             updatedAt: new Date(convo.updatedAt),
             lastMessage: convo.lastMessage ? { ...convo.lastMessage, timestamp: new Date(convo.lastMessage.timestamp) } : undefined,
             messages: convo.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })) // Keep messages if needed, ensure dates
            };
    });

     // Sort by last message timestamp (most recent first)
     conversationsWithUnread.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp instanceof Date ? a.lastMessage.timestamp.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.lastMessage?.timestamp instanceof Date ? b.lastMessage.timestamp.getTime() : new Date(b.createdAt).getTime();
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
    const conversation = conversationIndex !== -1 ? conversationsData[conversationIndex] : undefined;


    if (!conversation) {
        throw new Error('Conversation not found.');
    }

    // Check access rights
    if ((userRole === 'volunteer' && conversation.volunteerId !== userId) ||
        (userRole === 'organization' && conversation.organizationId !== userId)) {
        throw new Error('Access denied to this conversation.');
    }

    // Mark messages sent by the *other* party as read
    let updated = false;
    conversation.messages.forEach(msg => {
        if (msg.senderId !== userId && !msg.isRead) {
            msg.isRead = true;
             updated = true;
        }
         // Ensure timestamp is Date object
         msg.timestamp = new Date(msg.timestamp);
    });

     if (updated) {
        conversation.updatedAt = new Date(); // Update timestamp on read
        // Save changes back to file
        await writeData(CONVERSATIONS_FILE, conversationsData);
        console.log(`Marked messages as read for user ${userId} in conversation ${conversationId} and saved.`);
     }

     // Sort messages by timestamp (oldest first)
     const sortedMessages = [...conversation.messages].sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime());


    // Return conversation details (without unread count) and sorted messages
     // Ensure dates are Date objects before returning
     const { unreadCount, ...convoDetails } = conversation;
     const finalConvoDetails = {
        ...convoDetails,
        createdAt: new Date(convoDetails.createdAt),
        updatedAt: new Date(convoDetails.updatedAt),
        lastMessage: convoDetails.lastMessage ? { ...convoDetails.lastMessage, timestamp: new Date(convoDetails.lastMessage.timestamp) } : undefined,
        // messages are returned separately
     };


    return { conversation: finalConvoDetails, messages: sortedMessages };
}

/**
 * Sends a new message within a conversation.
 * Adds the message and updates the conversation in the JSON file.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param text The content of the message.
 * @returns A promise that resolves to the newly created Message object.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    await sleep(200); // Simulate delay
    let conversationsData = await loadConversationsData(); // Load current data

    const conversationIndex = conversationsData.findIndex(convo => convo.id === conversationId);
    const conversation = conversationIndex !== -1 ? conversationsData[conversationIndex] : undefined;

    if (!conversation) {
        throw new Error('Conversation not found.');
    }

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
        isRead: false,
    };

    // Update conversation in the data array
    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage;
    conversation.updatedAt = now;

    // Ensure other dates are Date objects before saving
    conversation.createdAt = new Date(conversation.createdAt);
    conversation.messages.forEach(m => m.timestamp = new Date(m.timestamp));
     if (conversation.lastMessage) {
        conversation.lastMessage.timestamp = new Date(conversation.lastMessage.timestamp);
     }


    // Save the updated conversations data back to the file
    await writeData(CONVERSATIONS_FILE, conversationsData);

    console.log('Message sent and conversation saved:', newMessage);
    return { ...newMessage }; // Return a copy
}