import type { Metadata, Viewport } from 'next';
import {
  Newsreader,
  Fira_Code,
  DM_Sans,
} from 'next/font/google';
import './globals.css';
import './workshop.css';
import './wizard.css';
import './dashboard.css';
import './about.css';
import './legal.css';
import './landing.css';
import './badge.css';
import './character-display.css';
import '@/lib/theme/themes/_shared-tokens.css';
import '@/lib/theme/themes/ds3.css';
import { DevToolsProvider } from '@/components/devtools';
import { ClientOnlyDevTools } from '@/components/ClientOnlyDevTools';
import { AppSurfaceShell } from '@/components/layout/AppSurfaceShell';
import { SessionRecoveryManager } from '@/components/GameSession/SessionRecoveryManager';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';
import { SkipLinks } from '@/components/shared/SkipLinks';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { TutorialProvider } from '@/components/TutorialProvider';
import { ThemeProvider } from '@/lib/theme';
import { THEME_INIT_SCRIPT } from '@/lib/theme/themeInitScript';
import { Analytics } from '@vercel/analytics/next';
import { FunnelAnalytics } from '@/components/analytics/FunnelAnalytics';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: true,
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
});

const fontVariables = [
  newsreader.variable,
  firaCode.variable,
  dmSans.variable,
].join(' ');

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
    <html lang="en" data-theme="ds3" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <SkipLinks />
        <ThemeProvider>
          <NavigationLoadingProvider>
            <DevToolsProvider>
              <ToastProvider>
                <TutorialProvider>
                  <AppSurfaceShell>
                    {children}
                  </AppSurfaceShell>
                  <SessionRecoveryManager />
                  <ClientOnlyDevTools />
                  <Toaster />
                </TutorialProvider>
              </ToastProvider>
            </DevToolsProvider>
          </NavigationLoadingProvider>
        </ThemeProvider>
        <FunnelAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
