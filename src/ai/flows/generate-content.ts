// src/ai/flows/generate-content.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating content based on user prompts, potentially considering disability context.
 *
 * - generateContent - A function that takes a prompt and returns AI-generated content.
 * - GenerateContentInput - The input type for the generateContent function.
 * - GenerateContentOutput - The return type for the generateContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Updated Input Schema to include optional disability context
const GenerateContentInputSchema = z.object({
  prompt: z.string().describe('The base prompt for generating content.'),
  isPersonWithDisability: z.boolean().optional().describe('Whether the user identifies as a person with a disability.'),
  disabilityDescription: z.string().optional().describe('A description of the disability provided by the user.'),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

const GenerateContentOutputSchema = z.object({
  content: z.string().describe('The AI-generated content.'),
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

export async function generateContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  return generateContentFlow(input);
}

// Updated Prompt Definition
const prompt = ai.definePrompt({
  name: 'generateContentPrompt',
  input: {
    // Use the updated schema including optional fields
    schema: GenerateContentInputSchema,
  },
  output: {
    schema: z.object({
      content: z.string().describe('The AI-generated content.'),
    }),
  },
  // Updated Prompt Template to conditionally use disability info
  prompt: `Generate content based on the following prompt:
{{prompt}}

{{#if isPersonWithDisability}}
Consider that the user identifies as a person with a disability.
{{#if disabilityDescription}}
The user has described their disability as: "{{disabilityDescription}}".
Generate content that is particularly mindful, relevant, or suitable for someone with this context. This might involve using clear and simple language, focusing on accessible themes, suggesting accessible formats if applicable, or simply being sensitive to potential challenges or perspectives. Avoid making assumptions, but use the provided context to create helpful and considerate content.
{{else}}
Generate content that is mindful and considerate of potential accessibility needs or perspectives related to disability in general.
{{/if}}
{{/if}}
`,
});

const generateContentFlow = ai.defineFlow<
  typeof GenerateContentInputSchema,
  typeof GenerateContentOutputSchema
>({
  name: 'generateContentFlow',
  inputSchema: GenerateContentInputSchema,
  outputSchema: GenerateContentOutputSchema,
},
async input => {
    // The prompt template now handles the conditional logic based on input
    const {output} = await prompt(input);
    return output!;
  }
);
