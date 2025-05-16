import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
