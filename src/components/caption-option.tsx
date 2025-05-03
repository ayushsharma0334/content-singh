// src/components/caption-option.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

interface CaptionOptionProps {
  caption: string;
}

export default function CaptionOption({ caption }: CaptionOptionProps) {
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast({
        title: t('toast.copied', "Copied!"),
        description: t('toast.copiedDesc', "Caption copied to clipboard."),
      });
    } catch (err) {
      console.error("Failed to copy caption:", err);
      toast({
        variant: "destructive",
        title: t('toast.copyFailed', "Copy Failed"),
        description: t('toast.copyFailedDesc', "Could not copy caption to clipboard."),
      });
    }
  };

  return (
    <Card className="bg-card border border-border/70 shadow-sm relative group/caption-item overflow-hidden rounded-md hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 flex items-center justify-between space-x-2">
        <p className="text-sm text-foreground flex-1 break-words">{caption}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary flex-shrink-0 rounded-full btn-hover-subtle"
          onClick={handleCopy}
          aria-label={t('toast.copied', 'Copy caption')} // Translate aria-label
          title={t('toast.copied', 'Copy caption')} // Translate title
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
