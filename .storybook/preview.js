/**
 * Simplified Storybook Preview Configuration
 * Without dark mode support
 */
import '../src/app/globals.css';

// Force color styles and CSS variables for Storybook
const styleOverrides = `
  /* Ensure CSS variables are applied to root */
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  /* Force Storybook to use CSS variables for buttons */
  .bg-destructive {
    background-color: hsl(var(--destructive)) !important;
  }
  
  .text-destructive-foreground {
    color: hsl(var(--destructive-foreground)) !important;
  }
  
  .bg-primary {
    background-color: hsl(var(--primary)) !important;
  }
  
  .text-primary-foreground {
    color: hsl(var(--primary-foreground)) !important;
  }
  
  .bg-secondary {
    background-color: hsl(var(--secondary)) !important;
  }
  
  .text-secondary-foreground {
    color: hsl(var(--secondary-foreground)) !important;
  }
  
  .hover\\:bg-destructive\\/90:hover {
    background-color: hsl(var(--destructive) / 0.9) !important;
  }
  
  .hover\\:bg-primary\\/90:hover {
    background-color: hsl(var(--primary) / 0.9) !important;
  }

  /* Force proper colors in Storybook */
  body.sb-show-main {
    color: #171717 !important;
    background-color: #ffffff !important;
  }
    
  /* For all text inside stories */
  #storybook-root {
    color: #171717 !important;
    background-color: #ffffff !important;
  }
`;

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
        push: (...args) => {
          console.log('[Storybook] router.push called with:', args);
          return Promise.resolve(true);
        },
        replace: (...args) => {
          console.log('[Storybook] router.replace called with:', args);
          return Promise.resolve(true);
        },
        back: () => {
          console.log('[Storybook] router.back called');
        },
      },
    },
  },
  // Add style tag to force colors
  decorators: [
    (Story) => (
      <>
        <style>{styleOverrides}</style>
        <Story />
      </>
    ),
  ],
};

export default preview;