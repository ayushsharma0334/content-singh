// src/components/accessibility-controls.tsx
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accessibility } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

type FontSize = 'small' | 'medium' | 'large';
type FontStyle =
  | 'system' | 'arial' | 'times-new-roman' | 'courier-new' | 'georgia'
  | 'verdana' | 'tahoma' | 'garamond' | 'helvetica' | 'comic-sans'
  | 'impact' | 'lucida-console' | 'palatino' | 'trebuchet-ms' | 'open-sans'
  | 'roboto' | 'lato' | 'montserrat' | 'oswald' | 'raleway'
  | 'open-dyslexic' | 'lexend';

interface AccessibilityControlsProps {
  children: ReactNode;
}

export default function AccessibilityControls({ children }: AccessibilityControlsProps) {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [fontStyle, setFontStyle] = useState<FontStyle>('system');
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [wordSpacing, setWordSpacing] = useState<number>(0);
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage(); // Get translation function

  // Expanded list of font styles
  const validFontStyles: FontStyle[] = [
      'system', 'arial', 'times-new-roman', 'courier-new', 'georgia', 'verdana',
      'garamond', 'helvetica', 'comic-sans', 'impact', 'lucida-console', 'palatino',
      'tahoma', 'trebuchet-ms', 'open-sans', 'roboto', 'lato', 'montserrat',
      'oswald', 'raleway', 'open-dyslexic', 'lexend'
    ];

  useEffect(() => {
    setIsClient(true);
    const savedFontSize = localStorage.getItem('accessibility-fontSize') as FontSize | null;
    const savedFontStyle = localStorage.getItem('accessibility-fontStyle') as FontStyle | null;
    const savedLetterSpacing = localStorage.getItem('accessibility-letterSpacing');
    const savedWordSpacing = localStorage.getItem('accessibility-wordSpacing');
    const savedLineHeight = localStorage.getItem('accessibility-lineHeight');

    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) setFontSize(savedFontSize);
    if (savedFontStyle && validFontStyles.includes(savedFontStyle)) setFontStyle(savedFontStyle);
    if (savedLetterSpacing) { const parsed = parseFloat(savedLetterSpacing); if (!isNaN(parsed)) setLetterSpacing(parsed); }
    if (savedWordSpacing) { const parsed = parseFloat(savedWordSpacing); if (!isNaN(parsed)) setWordSpacing(parsed); }
    if (savedLineHeight) { const parsed = parseFloat(savedLineHeight); if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 3.0) setLineHeight(parsed); }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const root = document.documentElement; // Still needed for spacing variables
    const body = document.body; // Target body for font classes

    // Font Size (Applied to HTML for potential global base size influence)
    root.classList.remove('text-base', 'text-lg', 'text-xl');
    switch (fontSize) {
      case 'small': root.classList.add('text-base'); break; // Tailwind text-sm (0.875rem)
      case 'medium': root.classList.add('text-lg'); break; // Tailwind text-base (1rem) - Adjusted
      case 'large': root.classList.add('text-xl'); break; // Tailwind text-lg (1.125rem) - Adjusted
      default: root.classList.add('text-lg');
    }

    // Font Style (Applied to Body)
    // Remove all potentially conflicting font classes from body first
    validFontStyles.forEach(style => {
      if (style !== 'system') {
        body.classList.remove(`font-${style.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
      }
    });
     body.classList.remove('font-sans', 'font-serif', 'font-mono'); // Remove Tailwind defaults

    // Apply the selected font class to body
    switch (fontStyle) {
      case 'arial': body.classList.add('font-arial'); break;
      case 'times-new-roman': body.classList.add('font-times-new-roman'); break;
      case 'courier-new': body.classList.add('font-courier-new'); break;
      case 'georgia': body.classList.add('font-georgia'); break;
      case 'verdana': body.classList.add('font-verdana'); break;
      case 'garamond': body.classList.add('font-garamond'); break;
      case 'helvetica': body.classList.add('font-helvetica'); break;
      case 'comic-sans': body.classList.add('font-comic-sans'); break;
      case 'impact': body.classList.add('font-impact'); break;
      case 'lucida-console': body.classList.add('font-lucida-console'); break;
      case 'palatino': body.classList.add('font-palatino'); break;
      case 'tahoma': body.classList.add('font-tahoma'); break;
      case 'trebuchet-ms': body.classList.add('font-trebuchet-ms'); break;
      case 'open-sans': body.classList.add('font-open-sans'); break;
      case 'roboto': body.classList.add('font-roboto'); break;
      case 'lato': body.classList.add('font-lato'); break;
      case 'montserrat': body.classList.add('font-montserrat'); break;
      case 'oswald': body.classList.add('font-oswald'); break;
      case 'raleway': body.classList.add('font-raleway'); break;
      case 'open-dyslexic': body.classList.add('font-open-dyslexic'); break; // Needs font files hosted
      case 'lexend': body.classList.add('font-lexend'); break;
      case 'system': default: body.classList.add('font-sans'); break; // Fallback to Tailwind's default sans applied via layout.tsx body className
    }

    // Spacing (Applied via CSS variables on root)
    root.style.setProperty('--letter-spacing', `${letterSpacing}px`);
    root.style.setProperty('--word-spacing', `${wordSpacing}px`);
    root.style.setProperty('--line-height', String(lineHeight));

    // Local Storage
    localStorage.setItem('accessibility-fontSize', fontSize);
    localStorage.setItem('accessibility-fontStyle', fontStyle);
    localStorage.setItem('accessibility-letterSpacing', String(letterSpacing));
    localStorage.setItem('accessibility-wordSpacing', String(wordSpacing));
    localStorage.setItem('accessibility-lineHeight', String(lineHeight));
  }, [fontSize, fontStyle, letterSpacing, wordSpacing, lineHeight, isClient, validFontStyles]);

  const handleFontStyleChange = (value: FontStyle) => { setFontStyle(value); };

  return (
    <Popover>
      {children}
      <PopoverContent className="w-72" align="end" side="right">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{t('accessibility.title', 'Accessibility')}</h4>
            <p className="text-sm text-muted-foreground">{t('accessibility.description', 'Adjust visual settings for comfort.')}</p>
          </div>
          <div className="grid gap-4">
            {/* Font Size */}
            <div className="space-y-1">
               <Label htmlFor="font-size-radio">{t('accessibility.fontSizeLabel', 'Font Size')}</Label>
               {isClient ? (
                 <RadioGroup id="font-size-radio" value={fontSize} onValueChange={(value: FontSize) => setFontSize(value)} className="flex space-x-2 pt-1">
                   {/* Adjusted labels to reflect new Tailwind classes */}
                   <div className="flex items-center space-x-1"><RadioGroupItem value="small" id="size-small" /><Label htmlFor="size-small" className="text-sm font-normal">S</Label></div>
                   <div className="flex items-center space-x-1"><RadioGroupItem value="medium" id="size-medium" /><Label htmlFor="size-medium" className="text-base font-normal">M</Label></div>
                   <div className="flex items-center space-x-1"><RadioGroupItem value="large" id="size-large" /><Label htmlFor="size-large" className="text-lg font-normal">L</Label></div>
                 </RadioGroup>
               ) : (
                  <div className="h-6"></div> // Placeholder for SSR/hydration mismatch prevention
               )}
            </div>

             {/* Font Style */}
             <div className="space-y-1">
              <Label htmlFor="font-style-select">{t('accessibility.fontStyleLabel', 'Font Style')}</Label>
              {isClient ? (
                <Select value={fontStyle} onValueChange={handleFontStyleChange}>
                  <SelectTrigger id="font-style-select" className="w-full h-8">
                    <SelectValue placeholder={t('accessibility.fontStylePlaceholder', 'Select style')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Translate font style options */}
                    <SelectItem value="system">{t('fontStyles.system', 'System Default (Sans)')}</SelectItem>
                    <SelectItem value="arial">{t('fontStyles.arial', 'Arial')}</SelectItem>
                    <SelectItem value="helvetica">{t('fontStyles.helvetica', 'Helvetica')}</SelectItem>
                    <SelectItem value="verdana">{t('fontStyles.verdana', 'Verdana')}</SelectItem>
                    <SelectItem value="tahoma">{t('fontStyles.tahoma', 'Tahoma')}</SelectItem>
                    <SelectItem value="trebuchet-ms">{t('fontStyles.trebuchetMs', 'Trebuchet MS')}</SelectItem>
                    <SelectItem value="open-sans">{t('fontStyles.openSans', 'Open Sans')}</SelectItem>
                    <SelectItem value="roboto">{t('fontStyles.roboto', 'Roboto')}</SelectItem>
                    <SelectItem value="lato">{t('fontStyles.lato', 'Lato')}</SelectItem>
                    <SelectItem value="montserrat">{t('fontStyles.montserrat', 'Montserrat')}</SelectItem>
                    <SelectItem value="oswald">{t('fontStyles.oswald', 'Oswald')}</SelectItem>
                    <SelectItem value="raleway">{t('fontStyles.raleway', 'Raleway')}</SelectItem>
                    <SelectItem value="times-new-roman">{t('fontStyles.timesNewRoman', 'Times New Roman')}</SelectItem>
                    <SelectItem value="georgia">{t('fontStyles.georgia', 'Georgia')}</SelectItem>
                    <SelectItem value="garamond">{t('fontStyles.garamond', 'Garamond')}</SelectItem>
                    <SelectItem value="palatino">{t('fontStyles.palatino', 'Palatino')}</SelectItem>
                    <SelectItem value="courier-new">{t('fontStyles.courierNew', 'Courier New')}</SelectItem>
                    <SelectItem value="lucida-console">{t('fontStyles.lucidaConsole', 'Lucida Console')}</SelectItem>
                    <SelectItem value="comic-sans">{t('fontStyles.comicSans', 'Comic Sans MS')}</SelectItem>
                    <SelectItem value="impact">{t('fontStyles.impact', 'Impact')}</SelectItem>
                    <SelectItem value="open-dyslexic">{t('fontStyles.openDyslexic', 'OpenDyslexic')}</SelectItem>
                    <SelectItem value="lexend">{t('fontStyles.lexend', 'Lexend')}</SelectItem>
                  </SelectContent>
                </Select>
               ) : (
                  <div className="h-8 border rounded-md"></div> // Placeholder
               )}
            </div>

             <Separator className="my-2" />

             {/* Spacing Controls */}
             <div className="space-y-2">
               <h5 className="text-sm font-medium leading-none">{t('accessibility.spacingTitle', 'Spacing')}</h5>
               <p className="text-xs text-muted-foreground">{t('accessibility.spacingDescription', 'Adjust text spacing for readability.')}</p>
             </div>

             {/* Letter Spacing */}
             <div className="grid gap-1">
                {isClient ? (
                  <Slider id="letter-spacing" label={t('accessibility.letterSpacingLabel', 'Letter Spacing')} min={-1} max={5} step={0.5} value={[letterSpacing]} onValueChange={(value) => setLetterSpacing(value[0])} showValue={true} valueSuffix="px" className="w-full" />
                ) : (
                  <div className="h-[52px] rounded-md border flex items-center justify-center text-xs text-muted-foreground">{t('accessibility.loading', 'Loading...')}</div>
                )}
              </div>

             {/* Word Spacing */}
             <div className="grid gap-1">
               {isClient ? (
                  <Slider id="word-spacing" label={t('accessibility.wordSpacingLabel', 'Word Spacing')} min={0} max={10} step={0.5} value={[wordSpacing]} onValueChange={(value) => setWordSpacing(value[0])} showValue={true} valueSuffix="px" className="w-full" />
                ) : (
                   <div className="h-[52px] rounded-md border flex items-center justify-center text-xs text-muted-foreground">{t('accessibility.loading', 'Loading...')}</div>
                )}
             </div>

             {/* Line Height */}
             <div className="grid gap-1">
                {isClient ? (
                  <Slider id="line-height" label={t('accessibility.lineHeightLabel', 'Line Height')} min={1.0} max={3.0} step={0.1} value={[lineHeight]} onValueChange={(value) => setLineHeight(value[0])} showValue={true} valueSuffix="" className="w-full" />
                ) : (
                  <div className="h-[52px] rounded-md border flex items-center justify-center text-xs text-muted-foreground">{t('accessibility.loading', 'Loading...')}</div>
                )}
              </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Re-export Popover components if needed by parent directly, though wrapping might be cleaner
export { Popover, PopoverContent, PopoverTrigger };
