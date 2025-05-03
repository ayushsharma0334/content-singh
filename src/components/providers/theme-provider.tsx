// src/components/providers/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

// Added lavender and high-contrast
const validThemes = ["light", "dark", "system", "greenish-blue", "creamy", "greyish-black", "turquoise", "lavender", "high-contrast"];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Filter themes prop if provided, otherwise allow all defined themes
  const themes = props.themes ? props.themes.filter(t => validThemes.includes(t)) : validThemes;

  return (
    <NextThemesProvider
      {...props}
      themes={themes} // Pass the potentially filtered or full list of themes
    >
      {children}
    </NextThemesProvider>
  )
}
