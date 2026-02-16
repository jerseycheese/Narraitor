import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import { primitiveColors } from './src/lib/design-tokens'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      // Design system colors - limited palette
      white: primitiveColors.white,
      black: primitiveColors.black,
      zinc: primitiveColors.zinc,
      blue: primitiveColors.blue,
      green: primitiveColors.green,
      red: primitiveColors.red,
      amber: primitiveColors.amber,
      
      // Backward compatibility mapping (Gray -> Zinc)
      gray: primitiveColors.zinc,
      neutral: primitiveColors.zinc,
      
      // Semantic aliases
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
    },
    extend: {
      fontFamily: {
        narrative: ['var(--font-narrative)', 'Georgia', 'serif'],
        system: ['var(--font-system)', 'ui-monospace', 'monospace'],
        interface: ['var(--font-interface)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    typography,
  ],
}

export default config
