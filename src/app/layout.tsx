import type { Metadata, Viewport } from 'next';
import { Lora, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { DevToolsProvider } from '@/components/devtools';
import { ClientOnlyDevTools } from '@/components/ClientOnlyDevTools';
import { Navigation } from '@/components/Navigation';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';
import { NavigationPersistenceProvider } from '@/components/shared/NavigationPersistenceProvider';
import { SkipLinks } from '@/components/shared/SkipLinks';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { TutorialProvider } from '@/components/TutorialProvider';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-narrative',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-system',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-interface',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Narraitor',
  description: 'A narrative-driven RPG framework using AI',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable}`} suppressHydrationWarning>
        <SkipLinks />
        <NavigationLoadingProvider>
          <NavigationPersistenceProvider>
            <DevToolsProvider>
              {/* Toast notification system - provides context for all toast notifications */}
              <ToastProvider>
                <TutorialProvider>
                  <Navigation />
                  <main id="main-content" tabIndex={-1}>
                    {children}
                  </main>
                  {/* DevTools in normal flow to avoid interfering with screenshots */}
                  <ClientOnlyDevTools />
                  {/* Toast container - renders all active toasts */}
                  <Toaster />
                </TutorialProvider>
              </ToastProvider>
            </DevToolsProvider>
          </NavigationPersistenceProvider>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
