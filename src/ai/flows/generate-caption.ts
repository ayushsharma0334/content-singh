// src/ai/flows/generate-caption.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating multiple caption options for images.
 *
 * - generateCaption - A function that takes image data and returns an array of AI-generated caption options.
 * - GenerateCaptionInput - The input type for the generateCaption function.
 * - GenerateCaptionOutput - The return type for the generateCaption function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input Schema: Expects image data as a Base64 encoded data URI and a tone
const GenerateCaptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo for captioning, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tone: z.string().describe('The desired tone for the captions (e.g., funny, professional, casual, poetic, informative). Default is casual.'),
});
export type GenerateCaptionInput = z.infer<typeof GenerateCaptionInputSchema>;

// Output Schema: An array of generated caption strings
const GenerateCaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe('An array of 3-5 AI-generated caption options for the image, suitable for social media.'),
});
export type GenerateCaptionOutput = z.infer<typeof GenerateCaptionOutputSchema>;

// Exported async wrapper function that calls the flow
export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionOutput> {
  // Provide a default tone if not specified
  const inputWithDefaults = {
    tone: 'casual', // Default tone
    ...input,
  };
  return generateCaptionFlow(inputWithDefaults);
}

// Define the Genkit Prompt - Updated for multiple captions and tone
// This prompt object is defined but the flow below makes a direct ai.generate call.
const prompt = ai.definePrompt({
  name: 'generateCaptionPrompt',
  input: {
    schema: GenerateCaptionInputSchema,
  },
  output: {
    schema: GenerateCaptionOutputSchema, // Use the updated schema
  },
  // Updated Prompt instructing the AI to generate 3-5 social media caption options with a specific tone
  prompt: `Analyze the provided image and generate 3 to 5 engaging caption options suitable for social media platforms like Instagram, Twitter, or Facebook.
The captions should have a **{{tone}}** tone.
Captions should be relevant, concise, and potentially include relevant hashtags.
Return the captions as a JSON object with a single key "captions" containing an array of strings.

Tone: {{tone}}
Image: {{media url=photoDataUri}}`,
});

// Define the Genkit Flow
const generateCaptionFlow = ai.defineFlow<
  typeof GenerateCaptionInputSchema,
  typeof GenerateCaptionOutputSchema
>(
  {
    name: 'generateCaptionFlow',
    inputSchema: GenerateCaptionInputSchema,
    outputSchema: GenerateCaptionOutputSchema,
  },
  async (input) => {
    // Use a model capable of understanding images.
    const { output } = await ai.generate({ // Directly call generate for vision model
        model: 'googleai/gemini-2.0-flash', // Use the default configured model
        prompt: [ // Use structured input for multi-modal
           // Updated the text prompt to request 3-5 social media caption options in an array with specified tone
           { text: `Analyze the provided image and generate 3 to 5 engaging caption options suitable for social media platforms like Instagram, Twitter, or Facebook. The captions should have a **${input.tone}** tone. Captions should be relevant, concise, and potentially include relevant hashtags. Return the captions as a JSON object with a single key "captions" containing an array of strings.` },
           { media: { url: input.photoDataUri } }
        ],
        output: {
             format: 'json', // Specify JSON output format
             schema: GenerateCaptionOutputSchema, // Ensure the output matches the schema
        },
        // Optional: Add safety settings if needed
        // safetySettings: [{ category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }],
     });

    if (!output || !output.captions || !Array.isArray(output.captions) || output.captions.length === 0) {
        // Try to parse if output is a stringified JSON (fallback)
        if (typeof output === 'string') {
          try {
            const parsedOutput = JSON.parse(output);
            if (parsedOutput.captions && Array.isArray(parsedOutput.captions) && parsedOutput.captions.length > 0) {
              return { captions: parsedOutput.captions };
            }
          } catch (parseError) {
             console.error("Failed to parse string output as JSON:", parseError);
             throw new Error("Caption generation failed: Received invalid output format from the model.");
          }
        }
        throw new Error("Caption generation failed: No valid caption options received from the model.");
    }

    // Ensure the output structure matches GenerateCaptionOutputSchema
    return { captions: output.captions };
  }
);

// Important: Make sure your .env file has the GOOGLE_GENAI_API_KEY set
// and that the chosen model ('googleai/gemini-2.0-flash')
// is available for your API key and enabled in your Google Cloud project.
