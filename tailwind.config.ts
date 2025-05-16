/**
 * Tailwind CSS Configuration
 * Compatible with Tailwind CSS v4 and Next.js App Router
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/config-tests/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Any theme extensions would go here
    },
  },
  // Tailwind v4 specifics
  future: {
    // Use modern CSS features
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;
