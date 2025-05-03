'use server';
/**
 * @fileOverview This file defines a Genkit flow for translating text content.
 *
 * - translateContent - A function that takes text and a target language code, returning the translated text.
 * - TranslateContentInput - The input type for the translateContent function.
 * - TranslateContentOutput - The return type for the translateContent function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input Schema: Expects text and target language code
const TranslateContentInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguage: z
    .string()
    .describe(
      'The target language code (e.g., "hi" for Hindi, "es" for Spanish, "fr" for French).'
    ),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

// Output Schema: The translated text
const TranslateContentOutputSchema = z.object({
  translatedText: z.string().describe('The translated text content.'),
});
export type TranslateContentOutput = z.infer<
  typeof TranslateContentOutputSchema
>;

// Exported async wrapper function that calls the flow
export async function translateContent(
  input: TranslateContentInput
): Promise<TranslateContentOutput> {
  // Basic validation: Don't translate if target is English or empty text
  if (input.targetLanguage.toLowerCase() === 'en' || !input.textToTranslate.trim()) {
      return { translatedText: input.textToTranslate };
  }
  return translateContentFlow(input);
}

// Define the Genkit Prompt for translation
const prompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: {
    schema: TranslateContentInputSchema,
  },
  output: {
    schema: TranslateContentOutputSchema,
  },
  prompt: `Translate the following text into the language specified by the target language code "{{targetLanguage}}".
Only provide the translated text as the output but meaningful, nothing else.

Text to translate:
{{{textToTranslate}}}
`,
});

// Define the Genkit Flow
const translateContentFlow = ai.defineFlow<
  typeof TranslateContentInputSchema,
  typeof TranslateContentOutputSchema
>(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async (input) => {
    try {
      // Use a standard text generation model for translation task
      const { output } = await prompt(input);

      if (!output || typeof output.translatedText !== 'string') {
        throw new Error('Translation failed: Invalid output received from the model.');
      }

      return { translatedText: output.translatedText.trim() };
    } catch (error) {
      console.error('Error in translateContentFlow:', error);
      // Re-throw the error to be caught by the calling component
      throw new Error(
        `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
