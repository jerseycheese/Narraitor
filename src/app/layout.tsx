import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Narraitor",
  description: "A narrative-driven RPG framework using AI",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
