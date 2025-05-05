
'use server';

import { chatWithBot as chatWithBotFlow, type ChatbotInput, type ChatbotOutput } from '@/ai/flows/chatbot-flow';

/**
 * Server action to send a message to the chatbot flow and get a reply.
 * @param input The user's message and conversation history.
 * @returns The chatbot's reply or an error message.
 */
export async function sendMessageToChatbotAction(input: ChatbotInput): Promise<{ success: boolean; reply?: string; error?: string }> {
  console.log('Server Action: Sending message to chatbot flow:', input.message);
  try {
    const output: ChatbotOutput = await chatWithBotFlow(input);
    console.log('Server Action: Received reply from chatbot flow:', output.reply);
    return { success: true, reply: output.reply };
  } catch (error: any) {
    console.error("Server Action: Chatbot error -", error);
    return { success: false, error: error.message || 'Failed to get response from chatbot.' };
  }
}
