// src/contexts/LanguageContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

interface Translations {
  [key: string]: string | Translations; // Allow nested translations
}

interface LanguageContextProps {
  language: string;
  setLanguage: (language: string) => void;
  translations: Translations;
  t: (key: string, fallback?: string, args?: Record<string, string | number>) => string; // Add args for interpolation
}

// Define supported languages and their JSON file names
// Updated to include requested Indian languages
const supportedLanguages: { [key: string]: string } = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  te: 'Telugu',
  mr: 'Marathi',
  ta: 'Tamil',
  ur: 'Urdu', // Keeping Urdu as it was added previously
  gu: 'Gujarati',
  ml: 'Malayalam',
  kn: 'Kannada',
  or: 'Odia', // Keeping Odia as it was added previously
  pa: 'Punjabi',
  as: 'Assamese',
  mai: 'Maithili',
  sat: 'Santali',
  ks: 'Kashmiri',
  ne: 'Nepali',
  kok: 'Konkani',
  sd: 'Sindhi',
  doi: 'Dogri',
  mni: 'Manipuri',
  brx: 'Bodo',
};


const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Function to load translation file dynamically
const loadTranslations = async (locale: string): Promise<Translations> => {
  try {
    console.log(`Attempting to load translations for: ${locale}`);
    // Check if the language is supported before trying to import
    if (!supportedLanguages[locale]) {
        throw new Error(`Unsupported language: ${locale}`);
    }
    const module = await import(`@/locales/${locale}.json`);
    console.log(`Successfully loaded translations for: ${locale}`);
    return module.default;
  } catch (error) {
    console.warn(`Could not load translations for locale "${locale}". Falling back to English.`, error);
    // Fallback to English if the requested locale file doesn't exist or fails loading
    try {
        const englishModule = await import(`@/locales/en.json`);
        return englishModule.default;
    } catch (fallbackError) {
        console.error("Could not load fallback English translations.", fallbackError);
        return {}; // Return empty if even English fails
    }
  }
};

// Helper function to get nested translation values and handle interpolation
const getNestedTranslation = (translations: Translations, key: string, args?: Record<string, string | number>): string | undefined => {
  const keys = key.split('.');
  let result: Translations | string | undefined = translations;

  for (const k of keys) {
    if (typeof result === 'object' && result !== null && k in result) {
      result = result[k];
    } else {
      return undefined; // Key not found
    }
  }

  if (typeof result === 'string') {
    // Handle basic interpolation like {variableName}
    if (args) {
      return result.replace(/\{(\w+)\}/g, (match, variableName) => {
        return args[variableName] !== undefined ? String(args[variableName]) : match;
      });
    }
    return result;
  }

  return undefined; // Value found but is not a string
};


export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Initialize state without client-side checks first
  const [language, setLanguageState] = useState<string>('en'); // Default to English initially
  const [translations, setTranslations] = useState<Translations>({});
  const [isInitialized, setIsInitialized] = useState(false); // Track if client-side logic ran

  // Effect for client-side initialization (localStorage, loading initial translations)
  useEffect(() => {
    // Load initial language from localStorage
    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    let initialLang = 'en'; // Default to English

     if (supportedLanguages[savedLanguage]) {
         initialLang = savedLanguage;
     } else {
         console.warn(`Invalid or unsupported language '${savedLanguage}' found in localStorage, defaulting to 'en'.`);
         localStorage.setItem('appLanguage', 'en');
     }

    setLanguageState(initialLang);

    // Load translations for the initial language
    loadTranslations(initialLang).then((loadedTranslations) => {
      setTranslations(loadedTranslations);
      setIsInitialized(true); // Mark as initialized after first load
      console.log(`LanguageProvider initialized with language: ${initialLang}`);
    });

  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to load translations when language changes *after* initialization
  useEffect(() => {
    if (!isInitialized) return; // Don't run on the initial server render or before client init

    console.log(`Language changed to: ${language}. Loading new translations.`);
    loadTranslations(language).then((loadedTranslations) => {
      setTranslations(loadedTranslations);
    });
  }, [language, isInitialized]); // Run when language changes or after initialization

  const setLanguage = useCallback((newLanguage: string) => {
    if (supportedLanguages[newLanguage]) {
      setLanguageState(newLanguage);
      localStorage.setItem('appLanguage', newLanguage); // Persist preference client-side
    } else {
      console.warn(`Unsupported language selected: ${newLanguage}`);
    }
  }, []);

  // Translation function 't'
  const t = useCallback((key: string, fallback?: string, args?: Record<string, string | number>): string => {
     // If not initialized client-side yet, translations might be empty or default.
     // Return fallback or key to avoid potential mismatch during initial hydration.
     if (!isInitialized && typeof window !== 'undefined') {
        // During hydration, try to return a stable value, maybe just the key or fallback
        return fallback || key;
     }

     const translated = getNestedTranslation(translations, key, args);

     if (translated === undefined) {
       // Only warn after initialization to avoid noise during startup
       if (isInitialized) {
          console.warn(`Translation key "${key}" not found for language "${language}". Using fallback or key.`);
       }
       return fallback || key; // Return fallback or key if not found
     }
     return translated;
  }, [translations, language, isInitialized]); // Depend on isInitialized

  const value = { language, setLanguage, translations, t };

  // Render children immediately, rely on useEffect for client-side updates
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Export supportedLanguages for use in the dropdown
export { supportedLanguages };
