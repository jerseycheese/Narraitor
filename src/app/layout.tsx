import type { Metadata, Viewport } from 'next';
import {
  Lora,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Crimson_Pro,
  JetBrains_Mono,
  Manrope,
  Newsreader,
  Fira_Code,
  DM_Sans,
} from 'next/font/google';
import './globals.css';
import './workshop.css';
import './wizard.css';
import '@/lib/theme/themes/ds1.css';
import '@/lib/theme/themes/ds2.css';
import '@/lib/theme/themes/ds3.css';
import { DevToolsProvider } from '@/components/devtools';
import { ClientOnlyDevTools } from '@/components/ClientOnlyDevTools';
import { AppSurfaceShell } from '@/components/layout/AppSurfaceShell';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';
import { NavigationPersistenceProvider } from '@/components/shared/NavigationPersistenceProvider';
import { SkipLinks } from '@/components/shared/SkipLinks';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { TutorialProvider } from '@/components/TutorialProvider';
import { ThemeProvider } from '@/lib/theme';

/* DS1 fonts (preloaded - default theme) */
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

/* DS2 fonts (lazy-loaded) */
const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson-pro',
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  preload: false,
});

/* DS3 fonts (lazy-loaded) */
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
});

const fontVariables = [
  lora.variable,
  ibmPlexMono.variable,
  ibmPlexSans.variable,
  crimsonPro.variable,
  jetbrainsMono.variable,
  manrope.variable,
  newsreader.variable,
  firaCode.variable,
  dmSans.variable,
].join(' ');

const themeScript = `(function(){try{var t=localStorage.getItem('narraitor-theme');if(t)document.documentElement.setAttribute('data-theme',t);var c=localStorage.getItem('narraitor-color-scheme');if(c==='dark'||(c==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

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
    <html lang="en" data-theme="ds1" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <SkipLinks />
        <ThemeProvider>
          <NavigationLoadingProvider>
            <NavigationPersistenceProvider>
              <DevToolsProvider>
                <ToastProvider>
                  <TutorialProvider>
                    <AppSurfaceShell>
                      {children}
                    </AppSurfaceShell>
                    <ClientOnlyDevTools />
                    <Toaster />
                  </TutorialProvider>
                </ToastProvider>
              </DevToolsProvider>
            </NavigationPersistenceProvider>
          </NavigationLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
