// src/components/sidebar-nav.tsx
'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Text, Image as LucideImage, FileImage, Settings } from 'lucide-react'; // Removed History and Accessibility icons
import AccessibilityControls, { PopoverTrigger as AccessibilityPopoverTrigger } from './accessibility-controls';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ActiveTabContext, TabValue } from '@/contexts/active-tab-context';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SidebarNav() {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useContext(ActiveTabContext);
  const { t } = useLanguage(); // Get translation function

  const isActive = (path: string, tab?: TabValue) => {
    const isRootPath = pathname === '/';
    // History path check removed

    if (path === '/') {
      // Home is active if on root path AND not specifically on another tab
      return isRootPath && !['image-captioner', 'text-to-image'].includes(activeTab);
    }
    // History check removed
    // For other tabs, active only if on root path and the specific tab is selected
    return isRootPath && activeTab === tab;
  };

  const handleTabClick = (tab: TabValue) => {
    setActiveTab(tab);
  };

  const handleHomeClick = () => {
    setActiveTab('text-generator'); // Default to text generator when clicking Home
  };

  return (
    <>
      <SidebarHeader className="flex items-center justify-between px-2 py-3 border-b border-sidebar-border">
         <div className="flex items-center">
           <Image
             src="https://vsdstudio.in/wp-content/uploads/2025/05/Logo.png"
             alt="Content Singh"
             width={170}
             height={100}
             className="object-contain group-data-[collapsible=icon]:hidden"
           />
           <span className="hidden group-data-[collapsible=icon]:block text-primary font-bold p-1">CS</span>
         </div>
         <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive('/')}
                tooltip={t('sidebar.home', 'Home')}
                onClick={handleHomeClick}
              >
                <a>
                  <Home />
                  <span>{t('sidebar.home', 'Home')}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive('/', 'text-generator')}
                tooltip={t('sidebar.textGenerator', 'WordUp')}
                onClick={() => handleTabClick('text-generator')}
              >
                <a>
                  <Text />
                  <span>{t('sidebar.textGenerator', 'WordUp')}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive('/', 'image-captioner')}
                tooltip={t('sidebar.imageCaptioner', 'Generate captions for images using a generative AI tool that analyzes image content and suggests relevant cool captions.')}
                onClick={() => handleTabClick('image-captioner')}
              >
                <a>
                  <LucideImage />
                  <span>{t('sidebar.imageCaptioner', 'Captionizer')}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive('/', 'text-to-image')}
                tooltip={t('sidebar.textToImage', 'Push Your Imagination')}
                onClick={() => handleTabClick('text-to-image')}
              >
                <a>
                  <FileImage />
                  <span>{t('sidebar.textToImage', 'Push Your Imagination')}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

           {/* History Link - Removed */}

        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* Accessibility Controls Removed from Footer */}

          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>

          <SidebarMenuItem>
             {/* Wrap Settings button with AccessibilityControls and PopoverTrigger */}
             <AccessibilityControls>
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <AccessibilityPopoverTrigger asChild>
                       <SidebarMenuButton
                         variant="ghost"
                         className="w-full justify-start"
                         tooltip={t('sidebar.settings', 'Settings')}
                       >
                         <Settings />
                         <span className="group-data-[collapsible=icon]:hidden">{t('sidebar.settings', 'Settings')}</span>
                         <span className="sr-only">{t('sidebar.settings', 'Settings')}</span>
                       </SidebarMenuButton>
                     </AccessibilityPopoverTrigger>
                   </TooltipTrigger>
                   <TooltipContent side="right" align="center">{t('sidebar.settings', 'Settings')}</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </AccessibilityControls>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Footer Note */}
        <div className="px-2 py-3 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Powered by Team ACE
        </div>
      </SidebarFooter>
    </>
  );
}