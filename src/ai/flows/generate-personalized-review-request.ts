'use server';
/**
 * @fileOverview A Genkit flow for generating personalized review request messages for customers.
 *
 * - generatePersonalizedReviewRequest - A function that handles the generation of a personalized review request message.
 * - GeneratePersonalizedReviewRequestInput - The input type for the generatePersonalizedReviewRequest function.
 * - GeneratePersonalizedReviewRequestOutput - The return type for the generatePersonalizedReviewRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedReviewRequestInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  restaurantName: z.string().describe('The name of the restaurant.'),
  googleReviewLink: z
    .string()
    .url()
    .describe('The Google My Business review link for the restaurant.'),
  bookingDate: z.string().describe('The date of the customer\'s booking (e.g., "October 26, 2023").'),
});
export type GeneratePersonalizedReviewRequestInput = z.infer<
  typeof GeneratePersonalizedReviewRequestInputSchema
>;

const GeneratePersonalizedReviewRequestOutputSchema = z.object({
  message: z.string().describe('The personalized review request message.'),
});
export type GeneratePersonalizedReviewRequestOutput = z.infer<
  typeof GeneratePersonalizedReviewRequestOutputSchema
>;

export async function generatePersonalizedReviewRequest(
  input: GeneratePersonalizedReviewRequestInput
): Promise<GeneratePersonalizedReviewRequestOutput> {
  return generatePersonalizedReviewRequestFlow(input);
}

const reviewRequestPrompt = ai.definePrompt({
  name: 'personalizedReviewRequestPrompt',
  input: {schema: GeneratePersonalizedReviewRequestInputSchema},
  output: {schema: GeneratePersonalizedReviewRequestOutputSchema},
  prompt: `You are an AI assistant tasked with crafting friendly and engaging review request messages for restaurant customers.

Generate a personalized message for the customer asking them to leave a review for the restaurant. The message should:
- Be polite and appreciative of their visit.
- Mention their name and the restaurant name.
- Encourage them to share their experience.
- Include a clear call to action with the provided Google review link.
- Keep it concise and suitable for an email or SMS.

Customer Name: {{{customerName}}}
Restaurant Name: {{{restaurantName}}}
Booking Date: {{{bookingDate}}}
Google Review Link: {{{googleReviewLink}}}

Example Output:
{
  "message": "Ciao {{customerName}}, grazie per aver cenato al {{restaurantName}} il {{bookingDate}}! Speriamo che la tua esperienza sia stata fantastica. Ci faresti un enorme favore lasciando una recensione su Google? Ci vuole solo un momento: {{googleReviewLink}}"
}

Your personalized message should be in Italian.
`,
});

const generatePersonalizedReviewRequestFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedReviewRequestFlow',
    inputSchema: GeneratePersonalizedReviewRequestInputSchema,
    outputSchema: GeneratePersonalizedReviewRequestOutputSchema,
  },
  async input => {
    const {output} = await reviewRequestPrompt(input);
    return output!;
  }
);
