// src/components/image-captioner.tsx
'use client';

import React, { useState, useRef, ChangeEvent, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle, AlertCircle } from "@/components/ui/alert";
import { Loader2, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { generateCaption, type GenerateCaptionInput, type GenerateCaptionOutput } from "@/ai/flows/generate-caption";
// import { addHistoryEntry } from '@/lib/history'; // History removed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CaptionOption from './caption-option';
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

export default function ImageCaptioner() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [tone, setTone] = useState("casual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: t('imageCaptioner.errorInvalidFile', 'Invalid File Type'),
          description: t('imageCaptioner.errorInvalidFileDesc', 'Please select an image file (e.g., JPG, PNG, GIF).'),
        });
        // Reset state
        setSelectedImage(null);
        setPreviewUrl(null);
        setCaptions([]);
        setError(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const maxSize = 5 * 1024 * 1024;
       if (file.size > maxSize) {
         const maxSizeMB = maxSize / 1024 / 1024;
         toast({
           variant: 'destructive',
           title: t('imageCaptioner.errorFileTooLarge', 'File Too Large'),
           description: t('imageCaptioner.errorFileTooLargeDesc', `Please select an image smaller than {maxSize}MB.`, { maxSize: maxSizeMB }),
         });
         // Reset state
         setSelectedImage(null);
         setPreviewUrl(null);
         setCaptions([]);
         setError(null);
         if(fileInputRef.current) fileInputRef.current.value = "";
         return;
       }

      setSelectedImage(file);
      setError(null);
      setCaptions([]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedImage || !previewUrl) {
      toast({
        variant: "destructive",
        title: t('imageCaptioner.errorNoImage', "No Image Selected"),
        description: t('imageCaptioner.errorNoImageDesc', "Please select an image first."),
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const input: GenerateCaptionInput = {
        photoDataUri: previewUrl,
        tone: tone
      };
      const output: GenerateCaptionOutput = await generateCaption(input);

      if (!output.captions || output.captions.length === 0) {
         throw new Error(t('imageCaptioner.errorNoCaptions', "No captions were generated."));
      }

      setCaptions(output.captions);

      // History entry removed
      // await addHistoryEntry({
      //   type: 'caption',
      //   prompt: `Image with tone: ${tone}`, // Or use image filename/preview data
      //   result: output.captions.join('\n---\n'), // Store all captions
      //   timestamp: new Date(),
      // });

    } catch (err) {
      console.error("Error generating caption:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`${t('imageCaptioner.errorTitle', 'Caption Generation Failed')}: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: t('imageCaptioner.errorTitle', "Caption Generation Failed"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-lg rounded-lg overflow-hidden border border-border bg-card text-card-foreground">
      <CardHeader className="bg-secondary/50 border-b border-border p-4">
        <CardTitle className="text-lg font-semibold text-foreground">{t('imageCaptioner.title', 'Image-to-Caption')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 overflow-auto">
        <div className="w-full max-w-md space-y-4">
          <div
            className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors h-48 bg-background shadow-inner"
            onClick={triggerFileInput}
            onDrop={(e) => { e.preventDefault(); handleImageChange({ target: { files: e.dataTransfer.files } } as ChangeEvent<HTMLInputElement>); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t('imageCaptioner.uploadLabel', 'Drag & drop an image, or click to select (Max 5MB)')}</p>
            <Input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={t('imageCaptioner.uploadLabel', 'Upload Image')}
            />
          </div>

          {previewUrl && (
            <div className="mt-4 border rounded-md overflow-hidden shadow-md max-w-full mx-auto bg-muted/30">
              <Image
                src={previewUrl}
                alt="Selected preview"
                width={400}
                height={300}
                className="object-contain w-full h-auto max-h-64"
                data-ai-hint="image preview"
              />
            </div>
          )}

          <div className="w-full max-w-md">
             <Label htmlFor="caption-tone-select" className="text-sm font-medium">{t('imageCaptioner.toneLabel', 'Caption Tone')}</Label>
             <Select value={tone} onValueChange={setTone} disabled={isLoading}>
               <SelectTrigger id="caption-tone-select" className="w-full h-9 mt-1 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary">
                 <SelectValue placeholder={t('tones.casual')} />
               </SelectTrigger>
               <SelectContent>
                 {/* Translate tone options */}
                 <SelectItem value="casual">{t('tones.casual', 'Casual')}</SelectItem>
                 <SelectItem value="funny">{t('tones.funny', 'Funny')}</SelectItem>
                 <SelectItem value="professional">{t('tones.professional', 'Professional')}</SelectItem>
                 <SelectItem value="poetic">{t('tones.poetic', 'Poetic')}</SelectItem>
                 <SelectItem value="informative">{t('tones.informative', 'Informative')}</SelectItem>
                 <SelectItem value="witty">{t('tones.witty', 'Witty')}</SelectItem>
                 <SelectItem value="inspirational">{t('tones.inspirational', 'Inspirational')}</SelectItem>
               </SelectContent>
             </Select>
          </div>
        </div>

         <Button
           onClick={handleGenerateCaption}
           disabled={!selectedImage || isLoading}
           className="w-full max-w-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-sm btn-hover-subtle"
         >
           {isLoading ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               {t('imageCaptioner.generatingButton', 'Generating...')}
             </>
           ) : (
             t('imageCaptioner.generateButton', 'Generate Captions')
           )}
         </Button>

        {error && (
          <Alert variant="destructive" className="w-full max-w-md rounded-md shadow-sm">
             <AlertCircle className="h-4 w-4"/>
            <AlertTitle>{t('imageCaptioner.errorTitle', 'Error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {captions.length > 0 && (
          <div className="w-full max-w-md mt-4 space-y-3">
             <h3 className="text-base font-medium text-center text-foreground">{t('imageCaptioner.captionsTitle', 'Generated Caption Options:')}</h3>
             {captions.map((cap, index) => (
               <CaptionOption key={index} caption={cap} />
             ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 rounded-md shadow-sm btn-hover-subtle"
              onClick={handleGenerateCaption}
              disabled={isLoading}
              title={t('imageCaptioner.alternativesButton', 'Generate a different set of captions')}
             >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('imageCaptioner.alternativesButton', 'See Alternatives')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}