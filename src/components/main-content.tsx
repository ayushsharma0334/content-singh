// src/components/main-content.tsx
'use client';

import React, { useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextGenerator from './text-generator';
import ImageCaptioner from './image-captioner';
import TextToImageGenerator from './text-to-image-generator';
import { Text, Image as LucideImage, FileImage } from 'lucide-react'; // Corrected import
import { ActiveTabContext } from '@/contexts/active-tab-context';
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

export default function MainContent() {
  const { activeTab, setActiveTab } = useContext(ActiveTabContext);
  const { t } = useLanguage(); // Get translation function

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
      <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted p-1 rounded-md">
        <TabsTrigger value="text-generator" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm font-medium">
          <Text className="h-4 w-4" />
          <span>{t('mainContent.textGeneratorTab', 'WordUp')}</span>
        </TabsTrigger>
        <TabsTrigger value="image-captioner" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm font-medium">
          <LucideImage className="h-4 w-4" /> {/* Use imported LucideImage */}
          <span>{t('mainContent.imageCaptionerTab', 'Captionizer')}</span>
        </TabsTrigger>
        <TabsTrigger value="text-to-image" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm font-medium">
           <FileImage className="h-4 w-4" />
           <span>{t('mainContent.textToImageTab', 'Push Your Imagination')}</span>
        </TabsTrigger>
        {/* History tab removed */}
      </TabsList>

      <TabsContent value="text-generator" className="flex-1 overflow-auto p-1 mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <TextGenerator />
      </TabsContent>
      <TabsContent value="image-captioner" className="flex-1 overflow-auto p-1 mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <ImageCaptioner />
      </TabsContent>
      <TabsContent value="text-to-image" className="flex-1 overflow-auto p-1 mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <TextToImageGenerator />
      </TabsContent>
      {/* History TabsContent removed */}
    </Tabs>
  );
}