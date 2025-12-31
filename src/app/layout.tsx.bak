import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DevToolsProvider } from "@/components/devtools";
import { ClientOnlyDevTools } from "@/components/ClientOnlyDevTools";
import { Navigation } from "@/components/Navigation";
import { NavigationLoadingProvider } from "@/components/shared/NavigationLoadingProvider";
import { NavigationPersistenceProvider } from "@/components/shared/NavigationPersistenceProvider";
import { SkipLinks } from "@/components/shared/SkipLinks";
import { ToastProvider, Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Narraitor",
  description: "A narrative-driven RPG framework using AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans m-0 p-0 min-h-screen flex flex-col" suppressHydrationWarning>
        <SkipLinks />
        <NavigationLoadingProvider>
          <NavigationPersistenceProvider>
            <DevToolsProvider>
              {/* Toast notification system - provides context for all toast notifications */}
              <ToastProvider>
                <Navigation />
                <main 
                  id="main-content" 
                  tabIndex={-1} 
                  className="flex-1 min-h-0 flex flex-col"
                >
                  {children}
                </main>
                {/* DevTools in normal flow to avoid interfering with screenshots */}
                <ClientOnlyDevTools />
                {/* Toast container - renders all active toasts */}
                <Toaster />
              </ToastProvider>
            </DevToolsProvider>
          </NavigationPersistenceProvider>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
