// src/services/messaging.ts

/**
 * Represents a single message within a conversation.
 */
export interface Message {
    id: string;
    conversationId: string;
    senderId: string; // ID of the user (volunteer or organization) who sent the message
    text: string;
    timestamp: Date;
    isRead?: boolean; // Optional: track read status
}

/**
 * Represents a conversation between an organization and a volunteer, usually regarding an opportunity.
 */
export interface Conversation {
    id: string;
    organizationId: string;
    volunteerId: string;
    opportunityId: string; // Link to the specific opportunity
    opportunityTitle?: string; // Denormalized for easier display
    organizationName?: string; // Denormalized
    volunteerName?: string; // Denormalized
    messages: Message[]; // Contains all messages in the conversation
    lastMessage?: Message; // The most recent message for preview
    unreadCount?: number; // Number of unread messages for the current user (calculated dynamically)
    createdAt: Date;
    updatedAt: Date; // Timestamp of the last message or interaction
}

// Simulate database for conversations and messages
let mockConversations: Conversation[] = [];

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    opportunityTitle?: string; // Optional title for display
    organizationName?: string; // Optional name
    volunteerName?: string; // Optional name
}): Promise<Conversation> {
    await sleep(500); // Simulate delay

    // Check if a conversation for this specific opportunity/volunteer/org already exists
     const existingConvo = mockConversations.find(c =>
        c.organizationId === data.organizationId &&
        c.volunteerId === data.volunteerId &&
        c.opportunityId === data.opportunityId
     );
     if (existingConvo) {
        console.log("Conversation already exists:", existingConvo.id);
        // Optionally, add the initial message if it's truly a *new* attempt to start
         // For now, just return the existing one
         return existingConvo;
     }


    const conversationId = `convo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const initialMsg: Message = {
        id: messageId,
        conversationId: conversationId,
        senderId: data.organizationId, // Assume organization initiates with acceptance message
        text: data.initialMessage,
        timestamp: now,
        isRead: false, // Initially unread by the volunteer
    };

    const newConversation: Conversation = {
        id: conversationId,
        organizationId: data.organizationId,
        volunteerId: data.volunteerId,
        opportunityId: data.opportunityId,
        opportunityTitle: data.opportunityTitle, // Store if provided
        organizationName: data.organizationName, // Store if provided
        volunteerName: data.volunteerName, // Store if provided
        messages: [initialMsg],
        lastMessage: initialMsg,
        createdAt: now,
        updatedAt: now,
        // unreadCount is calculated dynamically based on who is viewing
    };

    mockConversations.push(newConversation);
    console.log('New conversation created:', newConversation);
    return newConversation;
}

/**
 * Retrieves all conversations for a specific user (either volunteer or organization).
 * @param userId The ID of the user.
 * @param userRole The role of the user ('volunteer' or 'organization').
 * @returns A promise that resolves to an array of Conversation objects.
 */
export async function getConversationsForUser(userId: string, userRole: 'volunteer' | 'organization'): Promise<Conversation[]> {
    await sleep(600); // Simulate delay

    let userConversations: Conversation[];

    if (userRole === 'volunteer') {
        userConversations = mockConversations.filter(convo => convo.volunteerId === userId);
    } else { // organization
        userConversations = mockConversations.filter(convo => convo.organizationId === userId);
    }

    // Calculate unread count for each conversation FOR THE CURRENT USER
    const conversationsWithUnread = userConversations.map(convo => {
        const unreadCount = convo.messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
        return { ...convo, unreadCount };
    });

     // Sort by last message timestamp (most recent first)
     conversationsWithUnread.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp.getTime() ?? a.createdAt.getTime();
        const timeB = b.lastMessage?.timestamp.getTime() ?? b.createdAt.getTime();
        return timeB - timeA; // Descending order
     });


    console.log(`Found ${conversationsWithUnread.length} conversations for ${userRole} ${userId}`);
    return conversationsWithUnread;
}

/**
 * Retrieves the details and messages for a specific conversation.
 * Marks messages as read for the user viewing the conversation.
 * @param conversationId The ID of the conversation.
 * @param userId The ID of the user viewing the conversation.
 * @param userRole The role of the user viewing.
 * @returns A promise that resolves to an object containing the conversation details and messages.
 */
export async function getConversationDetails(conversationId: string, userId: string, userRole: 'volunteer' | 'organization'): Promise<{ conversation: Conversation; messages: Message[] }> {
    await sleep(400); // Simulate delay

    const conversation = mockConversations.find(convo => convo.id === conversationId);

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
    });
     if (updated) {
        conversation.updatedAt = new Date(); // Optionally update timestamp on read
        console.log(`Marked messages as read for user ${userId} in conversation ${conversationId}`);
     }

     // Sort messages by timestamp (oldest first)
     const sortedMessages = [...conversation.messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());


    // Return conversation details (without unread count needed here) and sorted messages
     const { unreadCount, ...convoDetails } = conversation; // Remove transient unreadCount


    return { conversation: convoDetails, messages: sortedMessages };
}

/**
 * Sends a new message within a conversation.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param text The content of the message.
 * @returns A promise that resolves to the newly created Message object.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    await sleep(300); // Simulate delay

    const conversation = mockConversations.find(convo => convo.id === conversationId);

    if (!conversation) {
        throw new Error('Conversation not found.');
    }

     // Optional: Add stricter check if senderId is part of the conversation
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
        isRead: false, // New message is initially unread by the recipient
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage;
    conversation.updatedAt = now;

    console.log('Message sent:', newMessage);
    return newMessage;
}

// Add some initial mock data if needed for testing
// createConversation({
//     organizationId: 'org1',
//     volunteerId: 'vol1',
//     opportunityId: '1',
//     opportunityTitle: 'Community Garden Helper',
//     organizationName: 'Green Thumbs Community',
//     volunteerName: 'Jane Doe Volunteer',
//     initialMessage: 'Welcome! We received your interest for the Garden Helper role. Can you confirm your availability for Saturday mornings?',
// });
