// src/ai/flows/generate-image.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating images based on text prompts.
 *
 * - generateImage - A function that takes a text prompt and returns an AI-generated image URL (as a data URI).
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input Schema: Expects a text prompt
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt for generating an image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output Schema: The generated image as a data URI string
const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The AI-generated image as a data URI (e.g., data:image/png;base64,...).'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// Exported async wrapper function that calls the flow
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

// Define the Genkit Flow
// Note: Image generation doesn't typically use ai.definePrompt in the same way as text generation.
// We call ai.generate directly with specific parameters for image models.
const generateImageFlow = ai.defineFlow<
  typeof GenerateImageInputSchema,
  typeof GenerateImageOutputSchema
>(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      // Use the experimental Gemini 2.0 Flash model for image generation
      const { media } = await ai.generate({
        // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model can generate images currently.
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: input.prompt, // Pass the user's text prompt directly
        config: {
          // MUST provide both TEXT and IMAGE modalities for this experimental model
          responseModalities: ['TEXT', 'IMAGE'],
        },
        // Specify the output format (optional but good practice)
        output: {
           format: 'media' // Request media output
        }
      });

      if (!media || !media.url) {
        throw new Error('Image generation failed: No media URL returned.');
      }

      // The 'media.url' will contain the Base64 encoded data URI
      return { imageUrl: media.url };

    } catch (error) {
        console.error("Error in generateImageFlow:", error);
        // Re-throw the error to be caught by the calling component
        throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Important:
// 1. Make sure your .env file has the GOOGLE_GENAI_API_KEY set.
// 2. Ensure the 'googleai/gemini-2.0-flash-exp' model is available and correctly configured
//    if any specific setup is needed beyond the standard ai-instance.ts.
// 3. This uses an experimental model; behavior might change.
