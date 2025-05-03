// src/contexts/active-tab-context.tsx
'use client';

import React, { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Define the possible values for the active tab (History removed)
export type TabValue = 'text-generator' | 'image-captioner' | 'text-to-image';

interface ActiveTabContextProps {
  activeTab: TabValue;
  setActiveTab: Dispatch<SetStateAction<TabValue>>;
}

// Create the context with a default value
export const ActiveTabContext = createContext<ActiveTabContextProps>({
  activeTab: 'text-generator', // Default tab is now always text-generator
  setActiveTab: () => {}, // Placeholder function
});

interface ActiveTabProviderProps {
  children: ReactNode;
}

export const ActiveTabProvider = ({ children }: ActiveTabProviderProps) => {
  const pathname = usePathname();

  // Determine initial tab based on path (Simplified as History page is removed)
  const getInitialTab = (): TabValue => {
    // All paths now default to 'text-generator' initially
    // Specific tab selection is handled by user interaction via Tabs component
    return 'text-generator';
  };

  const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab);

   // Update active tab if the path changes (e.g., browser back/forward)
   // This ensures the context reflects the current page/view
   useEffect(() => {
     const currentTab = getInitialTab();
     if (activeTab !== currentTab) {
       setActiveTab(currentTab);
     }
     // If path changes away from root, reset to text-generator (or handle based on new routes)
     if (pathname !== '/') {
        setActiveTab('text-generator');
     }

   }, [pathname]);


  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
};