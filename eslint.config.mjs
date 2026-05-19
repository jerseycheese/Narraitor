import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import noHardcodedColors from "./eslint-rules/no-hardcoded-colors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "design-tokens": {
        rules: {
          "no-hardcoded-colors": noHardcodedColors,
        },
      },
    },
    rules: {
      "design-tokens/no-hardcoded-colors": "error",
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
      }],
    },
  },
  {
    files: [
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/__mocks__/**/*.{js,jsx,ts,tsx}",
      "**/*.stories.{js,jsx,ts,tsx}",
      "**/*.stories.helpers.{js,jsx,ts,tsx}",
      "src/app/dev/**/*.{js,jsx,ts,tsx}",
      "src/components/devtools/**/*.{js,jsx,ts,tsx}",
      "src/lib/design-tokens/**/*.{js,jsx,ts,tsx}",
      "src/stories/**/*.{js,jsx,ts,tsx}"
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off", // Allow require() in test files for Jest mocking
      "design-tokens/no-hardcoded-colors": "off", // Allow hardcoded colors in tests, dev tools, design tokens, and stories
      "no-console": "off", // Dev tooling, tests, and stories legitimately use console
    },
  },
];

export default eslintConfig;
