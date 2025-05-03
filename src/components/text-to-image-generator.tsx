// src/components/text-to-image-generator.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle, AlertCircle } from "@/components/ui/alert";
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Textarea } from "@/components/ui/textarea";
import { generateImage, type GenerateImageInput, type GenerateImageOutput } from "@/ai/flows/generate-image";
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

export default function TextToImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: t('textToImage.errorPromptRequired', "Prompt Required"),
        description: t('textToImage.errorPromptRequiredDesc', "Please enter a text prompt to generate an image."),
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    const currentPrompt = prompt;

    try {
      const input: GenerateImageInput = { prompt: currentPrompt };
      const output: GenerateImageOutput = await generateImage(input);

      if (!output.imageUrl) {
         throw new Error('Image generation flow did not return a valid image URL.');
      }

      setGeneratedImageUrl(output.imageUrl);

    } catch (err) {
      console.error("Error generating image:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`${t('textToImage.errorTitle', 'Image Generation Failed')}: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: t('textToImage.errorTitle', "Image Generation Failed"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

   const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
     console.warn("Failed to load generated image:", event.currentTarget.src);
     setError(t('textToImage.errorLoadFailed', "The generated image could not be loaded. It might be invalid or expired."));
     setGeneratedImageUrl(null);
   };

  return (
    <Card className="w-full h-full flex flex-col shadow-lg rounded-lg overflow-hidden border border-border bg-card text-card-foreground">
      <CardHeader className="bg-secondary/50 border-b border-border p-4">
        <CardTitle className="text-lg font-semibold text-foreground">{t('textToImage.title', 'Text-to-Image Generator')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 overflow-auto">
        <div className="w-full max-w-lg space-y-2">
          <Label htmlFor="image-prompt" className="text-sm font-medium">{t('textToImage.promptLabel', 'Enter Prompt')}</Label>
          <Textarea
            id="image-prompt"
            placeholder={t('textToImage.promptPlaceholder', 'e.g., A majestic lion wearing headphones, digital art, vibrant colors')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] resize-y rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim()}
          className="w-full max-w-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-sm btn-hover-subtle"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('textToImage.generatingButton', 'Generating Image...')}
            </>
          ) : (
             t('textToImage.generateButton', 'Generate Image')
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="w-full max-w-lg rounded-md shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('textToImage.errorTitle', 'Error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-lg flex items-center justify-center border border-dashed border-muted-foreground/50 rounded-lg min-h-[300px] bg-muted/20 p-4 mt-4 shadow-inner">
          {isLoading && !generatedImageUrl && (
             <div className="flex flex-col items-center text-muted-foreground">
               <Loader2 className="h-8 w-8 animate-spin mb-2" />
               <p>{t('textToImage.loadingText', 'Generating your image...')}</p>
             </div>
           )}
          {!isLoading && !generatedImageUrl && !error && (
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>{t('textToImage.placeholderText', 'Your generated image will appear here.')}</p>
            </div>
          )}
          {generatedImageUrl && (
            <Image
              src={generatedImageUrl}
              alt={prompt || "Generated AI image"}
              width={512}
              height={512}
              className="object-contain rounded-md max-w-full max-h-[400px] shadow-md"
              data-ai-hint="generated image ai"
              onError={handleImageError}
            />
          )}
        </div>

      </CardContent>
       {generatedImageUrl && !isLoading && (
         <CardFooter className="p-4 border-t bg-secondary/50 justify-end">
            <Button asChild variant="outline" size="sm" className="rounded-md shadow-sm btn-hover-subtle">
              <a
                href={generatedImageUrl}
                download={`generated-image-${Date.now()}.png`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('textToImage.downloadButton', 'Download Image')}
              </a>
            </Button>
         </CardFooter>
       )}
    </Card>
  );
}
