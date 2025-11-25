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
      gray: primitiveColors.gray,
      blue: primitiveColors.blue,
      green: primitiveColors.green,
      red: primitiveColors.red,
      amber: primitiveColors.amber,
      
      // Semantic aliases for better DX
      neutral: primitiveColors.gray,
      danger: primitiveColors.red,
      
      // shadcn/ui semantic tokens (extend with our colors)
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
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
      // Extended semantic tokens for buttons
      info: {
        DEFAULT: 'hsl(var(--info))',
        foreground: 'hsl(var(--info-foreground))',
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))',
      },
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    typography({
      // @ts-expect-error - Typography plugin types don't include theme option
      theme: {
        DEFAULT: {
          css: {
            // Align prose colors with design tokens (using fallback to closest available shade)
            '--tw-prose-body': primitiveColors.gray[700], // closest to 800
            '--tw-prose-headings': primitiveColors.gray[900],
            '--tw-prose-links': primitiveColors.blue[500],
            '--tw-prose-bold': primitiveColors.gray[900],
            '--tw-prose-bullets': primitiveColors.gray[500],
            '--tw-prose-quotes': primitiveColors.gray[900],
            '--tw-prose-quote-borders': primitiveColors.gray[300],
            '--tw-prose-captions': primitiveColors.gray[500], // closest to 600
            '--tw-prose-code': primitiveColors.gray[900],
            '--tw-prose-pre-code': primitiveColors.gray[300], // closest to 200
            '--tw-prose-pre-bg': primitiveColors.gray[700], // closest to 800
            '--tw-prose-th-borders': primitiveColors.gray[300],
            '--tw-prose-td-borders': primitiveColors.gray[300], // closest to 200
            color: primitiveColors.gray[700], // closest to 800
            a: {
              color: primitiveColors.blue[500],
              '&:hover': {
                color: primitiveColors.blue[700],
              },
            },
            strong: {
              color: primitiveColors.gray[900],
            },
          },
        },
        // Dark mode variant
        invert: {
          css: {
            '--tw-prose-body': primitiveColors.gray[300],
            '--tw-prose-headings': primitiveColors.white,
            '--tw-prose-links': primitiveColors.blue[300], // closest to 400
            '--tw-prose-bold': primitiveColors.white,
            '--tw-prose-bullets': primitiveColors.gray[300], // closest to 400
            '--tw-prose-quotes': primitiveColors.gray[100],
            '--tw-prose-quote-borders': primitiveColors.gray[700],
            '--tw-prose-captions': primitiveColors.gray[300], // closest to 400
            '--tw-prose-code': primitiveColors.white,
            '--tw-prose-pre-code': primitiveColors.gray[300],
            '--tw-prose-pre-bg': primitiveColors.gray[900],
            '--tw-prose-th-borders': primitiveColors.gray[500], // closest to 600
            '--tw-prose-td-borders': primitiveColors.gray[700],
          },
        },
      },
    }),
  ],
}

export default config