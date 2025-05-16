import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {
      // Add PostCSS options if needed
    }
  },
  "staticDirs": [
    "../public"
  ],
  // Ensure Tailwind CSS is processed properly
  "viteFinal": async (config) => {
    // Return the modified config
    return config;
  }
};
export default config;