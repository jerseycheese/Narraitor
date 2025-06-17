import type { Metadata } from "next";
import "./globals.css";
import { DevToolsProvider, DevToolsPanel } from "@/components/devtools";
import { DevMockState } from "@/components/devtools/DevMockState";
import { Navigation } from "@/components/Navigation";
import { NavigationLoadingProvider } from "@/components/shared/NavigationLoadingProvider";
import { NavigationPersistenceProvider } from "@/components/shared/NavigationPersistenceProvider";

export const metadata: Metadata = {
  title: "Narraitor",
  description: "A narrative-driven RPG framework using AI",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans m-0 p-0">
        <NavigationLoadingProvider>
          <NavigationPersistenceProvider>
            <DevToolsProvider>
              {/* Only render DevMockState in development */}
              {process.env.NODE_ENV === 'development' && <DevMockState />}
              <Navigation />
              <div className="min-h-screen pb-12 md:pb-14">
                {children}
              </div>
              {/* Only render DevToolsPanel in development */}
              {process.env.NODE_ENV === 'development' && <DevToolsPanel />}
            </DevToolsProvider>
          </NavigationPersistenceProvider>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
