import type { Metadata } from "next";
import "./globals.css";
import { DevToolsProvider } from "@/components/devtools";
import { ClientOnlyDevTools } from "@/components/ClientOnlyDevTools";
import { Navigation } from "@/components/Navigation";
import { NavigationLoadingProvider } from "@/components/shared/NavigationLoadingProvider";
import { NavigationPersistenceProvider } from "@/components/shared/NavigationPersistenceProvider";

export const metadata: Metadata = {
  title: "Narraitor",
  description: "A narrative-driven RPG framework using AI",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
              <Navigation />
              <div className="min-h-screen pb-12 md:pb-14">
                {children}
              </div>
              {/* Only render dev tools in development */}
              {process.env.NODE_ENV === 'development' && <ClientOnlyDevTools />}
            </DevToolsProvider>
          </NavigationPersistenceProvider>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
