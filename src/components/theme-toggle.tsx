// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { useLanguage } from "@/contexts/LanguageContext"; // Import useLanguage


export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useLanguage(); // Get translation function

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            variant="ghost"
            className="w-full justify-start"
            tooltip={t('themeToggle.tooltip', 'Change Theme')}
          >
             <Palette className="h-[1.2rem] w-[1.2rem]" />
             <span className="group-data-[collapsible=icon]:hidden">{t('sidebar.theme', 'Theme')}</span>
             <span className="sr-only">{t('themeToggle.tooltip', 'Change theme')}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
           <ScrollArea
             className="h-auto max-h-[250px]"
             style={{ overflow: 'overlay' as React.CSSProperties['overflow'] }}
            >
              <DropdownMenuLabel>{t('themeToggle.label', 'Select Theme')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Translate theme names */}
              <DropdownMenuItem onClick={() => setTheme("light")} disabled={theme === 'light'}>
                 {t('themeToggle.light', 'Light (Default)')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} disabled={theme === 'dark'}>
                {t('themeToggle.dark', 'Dark (Midnight)')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("greenish-blue")} disabled={theme === 'greenish-blue'}>
                 {t('themeToggle.greenishBlue', 'Greenish Blue')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("creamy")} disabled={theme === 'creamy'}>
                 {t('themeToggle.creamy', 'Creamy')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("greyish-black")} disabled={theme === 'greyish-black'}>
                 {t('themeToggle.greyishBlack', 'Greyish Black')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("turquoise")} disabled={theme === 'turquoise'}>
                 {t('themeToggle.turquoise', 'Turquoise')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("lavender")} disabled={theme === 'lavender'}>
                 {t('themeToggle.lavender', 'Lavender')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("high-contrast")} disabled={theme === 'high-contrast'}>
                 {t('themeToggle.highContrast', 'High Contrast')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme("system")} disabled={theme === 'system'}>
                {t('themeToggle.system', 'System')}
              </DropdownMenuItem>
           </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
