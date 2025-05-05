
'use server';
/**
 * @fileOverview A simple chatbot flow using Gemini.
 *
 * - chatWithBot - A function that handles the chat interaction.
 * - ChatbotInput - The input type for the chatWithBot function.
 * - ChatbotOutput - The return type for the chatWithBot function.
 */

import { ai } from '@/ai/ai-instance'; // Use the centralized AI instance
import { z } from 'zod';

// Define the structure for a single message in the history
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the input schema for the chatbot flow
const ChatbotInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).optional().describe('The conversation history up to this point.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

// Define the output schema for the chatbot flow
const ChatbotOutputSchema = z.object({
  reply: z.string().describe('The chatbot\'s reply to the user\'s message.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

/**
 * Processes a user message and conversation history to generate a chatbot reply.
 * @param input The user's message and optional conversation history.
 * @returns The chatbot's reply.
 */
export async function chatWithBot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

// Define the prompt for the chatbot
const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: ChatbotInputSchema },
  output: { schema: ChatbotOutputSchema },
  // Use Handlebars to construct the prompt with history and the new message
  prompt: `You are VolunteerBazaar Bot, a helpful assistant for the VolunteerBazaar platform.
Keep your responses concise and helpful, focusing on volunteering and the platform.

Conversation History:
{{#if history}}
{{#each history}}
{{role}}: {{{text}}}
{{/each}}
{{else}}
No history yet.
{{/if}}

user: {{{message}}}
model:`, // The final 'model:' prompts the AI to generate the reply
});

// Define the main chatbot flow
const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {
    console.log('Chatbot Flow Input:', input);
    // Generate the response using the defined prompt
    const { output } = await prompt(input);

    if (!output) {
        console.error('Chatbot Flow Error: No output generated from the prompt.');
        return { reply: "Sorry, I couldn't generate a response right now. Please try again." };
    }

    console.log('Chatbot Flow Output:', output);
    return output; // Output already matches ChatbotOutputSchema
  }
);
