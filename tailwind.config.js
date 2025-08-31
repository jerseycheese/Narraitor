/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens mapped to CSS variables
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          background: 'hsl(var(--success-background))',
          border: 'hsl(var(--success-border))',
          muted: 'hsl(var(--success-muted))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          background: 'hsl(var(--warning-background))',
          border: 'hsl(var(--warning-border))',
          muted: 'hsl(var(--warning-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          background: 'hsl(var(--info-background))',
          border: 'hsl(var(--info-border))',
          muted: 'hsl(var(--info-muted))',
        },
        // Base shadcn/ui colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Contextual colors (genre-specific)
        ending: {
          triumphant: 'hsl(var(--ending-triumphant))',
          bittersweet: 'hsl(var(--ending-bittersweet))',
          mysterious: 'hsl(var(--ending-mysterious))',
          tragic: 'hsl(var(--ending-tragic))',
          hopeful: 'hsl(var(--ending-hopeful))',
        },
        lore: {
          characters: {
            bg: 'hsl(var(--lore-characters-bg))',
            border: 'hsl(var(--lore-characters-border))',
            text: 'hsl(var(--lore-characters-text))',
          },
          locations: {
            bg: 'hsl(var(--lore-locations-bg))',
            border: 'hsl(var(--lore-locations-border))',
            text: 'hsl(var(--lore-locations-text))',
          },
          events: {
            bg: 'hsl(var(--lore-events-bg))',
            border: 'hsl(var(--lore-events-border))',
            text: 'hsl(var(--lore-events-text))',
          },
          rules: {
            bg: 'hsl(var(--lore-rules-bg))',
            border: 'hsl(var(--lore-rules-border))',
            text: 'hsl(var(--lore-rules-text))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

