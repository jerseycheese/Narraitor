import type { Metadata, Viewport } from 'next';
import {
  Newsreader,
  Fira_Code,
  DM_Sans,
} from 'next/font/google';
import './globals.css';
import './app-shell.css';
import './wizard.css';
import './dashboard.css';
import './about.css';
import './legal.css';
import './landing.css';
import './badge.css';
import './character-display.css';
import '@/lib/theme/themes/_shared-tokens.css';
import '@/lib/theme/themes/ds3.css';
// Last, and route-scoped rather than global: it overrides tokens the two files
// above define, so reading it as an override layer means reading it after them.
import '@/lib/theme/themes/_register-brand.css';
import { DevToolsProvider } from '@/components/devtools';
import { ClientOnlyDevTools } from '@/components/ClientOnlyDevTools';
import { AppSurfaceShell } from '@/components/layout/AppSurfaceShell';
import { SessionRecoveryManager } from '@/components/GameSession/SessionRecoveryManager';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';
import { SkipLinks } from '@/components/shared/SkipLinks';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { TutorialProvider } from '@/components/TutorialProvider';
import { ThemeProvider } from '@/lib/theme';
import { getSiteUrl, SITE_NAME } from '@/lib/constants/site';
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

const SITE_TITLE =
  'Narraitor: play a story that answers to the world you built';
const SITE_DESCRIPTION =
  'Build a world, create a character, and make the choices that steer the story. A solo role-playing game that runs in your browser.';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: '%s — Narraitor',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // './' self-canonicalises each route. A literal '/' would point every page at
  // the site root, which is worse than having no canonical at all.
  alternates: { canonical: './' },
  // og:title and og:description are deliberately absent: Next fills them from
  // each route's own resolved title/description. Do NOT add an `openGraph`
  // block to a child route — Next replaces this object wholesale rather than
  // merging, which would drop opengraph-image.tsx from that route's card.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
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
