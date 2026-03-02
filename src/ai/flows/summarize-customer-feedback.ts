'use server';
/**
 * @fileOverview An AI agent for summarizing customer feedback.
 *
 * - summarizeCustomerFeedback - A function that handles the summarization of customer feedback.
 * - SummarizeCustomerFeedbackInput - The input type for the summarizeCustomerFeedback function.
 * - SummarizeCustomerFeedbackOutput - The return type for the summarizeCustomerFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeCustomerFeedbackInputSchema = z.object({
  feedbackEntries: z.array(z.string()).describe('An array of qualitative customer feedback entries.'),
});
export type SummarizeCustomerFeedbackInput = z.infer<typeof SummarizeCustomerFeedbackInputSchema>;

const SummarizeCustomerFeedbackOutputSchema = z.object({
  summary: z.string().describe('A concise summary of common themes, recurring issues, and actionable insights from the customer feedback.'),
});
export type SummarizeCustomerFeedbackOutput = z.infer<typeof SummarizeCustomerFeedbackOutputSchema>;

export async function summarizeCustomerFeedback(input: SummarizeCustomerFeedbackInput): Promise<SummarizeCustomerFeedbackOutput> {
  return summarizeCustomerFeedbackFlow(input);
}

const summarizeFeedbackPrompt = ai.definePrompt({
  name: 'summarizeCustomerFeedbackPrompt',
  input: { schema: SummarizeCustomerFeedbackInputSchema },
  output: { schema: SummarizeCustomerFeedbackOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing customer feedback for restaurants. Your task is to review the provided customer feedback entries and generate a concise summary that highlights common themes, recurring issues, and actionable insights.

The feedback is from customers who gave low ratings, so focus on identifying areas for improvement.

Customer Feedback Entries:
{{#each feedbackEntries}}
- {{{this}}}
{{/each}}

Please provide a summary that is:
1. Concise and easy to read.
2. Focuses on common themes and patterns.
3. Identifies specific areas for improvement or actionable insights.`,
});

const summarizeCustomerFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeCustomerFeedbackFlow',
    inputSchema: SummarizeCustomerFeedbackInputSchema,
    outputSchema: SummarizeCustomerFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeFeedbackPrompt(input);
    return output!;
  }
);
