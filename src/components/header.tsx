// src/components/header.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Languages, PanelLeft, Settings } from 'lucide-react'; // Import Settings icon
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from '@/components/ui/sidebar';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext'; // Import useLanguage and supportedLanguages
import AccessibilityControls, { PopoverTrigger as AccessibilityPopoverTrigger } from '@/components/accessibility-controls'; // Import AccessibilityControls and PopoverTrigger

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { language, setLanguage, t } = useLanguage(); // Get language state, setter, and translation function

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
  };

  return (
    <header className="sticky top-0 z-10 flex h-auto items-center border-b px-4 py-3 sm:px-6 bg-background">
      {/* Sidebar Trigger - Kept at top left for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="mr-4 text-foreground md:hidden" // Show only on mobile/smaller screens where sidebar is offcanvas
        onClick={toggleSidebar}
        aria-label={t('header.toggleSidebar', 'Toggle Sidebar')} // Translate aria-label
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      {/* Settings/Profile Dropdown - Moved to top left, now triggers Accessibility Popover */}
       <AccessibilityControls>
        <AccessibilityPopoverTrigger asChild>
           <Button variant="ghost" size="icon" className="text-foreground mr-4"> {/* Added margin-right */}
              <Settings className="h-5 w-5" /> {/* Use Settings icon */}
              <span className="sr-only">{t('sidebar.settings', 'Settings')}</span> {/* Updated sr-only text */}
           </Button>
        </AccessibilityPopoverTrigger>
        {/* PopoverContent is within AccessibilityControls */}
      </AccessibilityControls>

      {/* Branding/Tagline Section - Centered */}
      <div className="flex flex-col items-center text-center mx-auto">
         {/* Tagline */}
         <p className="text-lg font-medium text-foreground mt-1 max-w-xl">
           {t('header.tagline', 'Your LLM-Based Content Creator Friend by Team ACE.')} {/* Translate tagline */}
         </p>
      </div>

      {/* Controls Section - Only Language Selector Remains Top Right */}
      <div className="ml-auto flex items-center gap-4"> {/* Use ml-auto to push to the right */}
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Languages className="h-4 w-4" />
              <span className="sr-only">{t('header.selectLanguage', 'Select Language')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px]">
            <DropdownMenuLabel>{t('header.selectLanguage', 'Select Language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea
              className="h-auto max-h-[400px]"
              style={{ overflow: 'overlay' as React.CSSProperties['overflow'] }} // Added overflow style
            >
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  disabled={language === code} // Disable the currently selected language
                >
                  {/* Use translation function `t` for language names, falling back to the name from supportedLanguages */}
                  {t(`languages.${code}`, name)} {language === code && `(${t('header.currentLanguage', 'Current')})`}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile/User Placeholder Removed from here */}
      </div>
    </header>
  );
}
