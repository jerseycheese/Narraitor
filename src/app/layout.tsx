import type { Metadata } from "next";
import "./globals.css";
import { DevToolsProvider, DevToolsPanel } from "@/components/devtools";
import { DevMockState } from "@/components/devtools/DevMockState";

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
        <DevToolsProvider>
          {/* Add DevMockState to initialize development data */}
          <DevMockState />
          {children}
          <DevToolsPanel />
        </DevToolsProvider>
      </body>
    </html>
  );
}
