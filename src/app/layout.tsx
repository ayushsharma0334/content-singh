import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import QueryProvider from '@/components/providers/query-provider';
import { ActiveTabProvider } from '@/contexts/active-tab-context';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/contexts/LanguageContext'; // Import LanguageProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Content Singh- कंटेंट सिंह', // Updated Title
  description: 'Your LLM-Based Content Creator Friend by Team ACE.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Ensure suppressHydrationWarning is on html */}
      {/* Ensure no whitespace directly before or after body tag */}
      {/* Apply base font-sans class for default styling. Accessibility controls will override this on the client. */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Set default theme to light
          enableSystem={false} // Disable system theme detection if light is default
          disableTransitionOnChange
        >
          <QueryProvider>
            <LanguageProvider> {/* Wrap with LanguageProvider */}
              <ActiveTabProvider>
                <SidebarProvider defaultOpen>
                  <Sidebar side="left" variant="sidebar" collapsible="icon">
                    <SidebarNav />
                  </Sidebar>
                  <div className="flex flex-col flex-1">
                    <Header />
                    <SidebarInset>
                      {children}
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </ActiveTabProvider>
            </LanguageProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
