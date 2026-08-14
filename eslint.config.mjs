import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jest from "eslint-plugin-jest";
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
      // Route all production logging through the Logger utility (src/lib/utils/logger.ts).
      // Dev tools, tests, and stories are overridden below.
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
      }],
      // Promote no-explicit-any to error in production code so new `any`s
      // need a deliberate suppression with a reason. Dev tools, tests, and
      // stories are overridden below.
      "@typescript-eslint/no-explicit-any": "error",
      // Structural markup hygiene (#1088): both auto-fixable. warn keeps them
      // out of the blocking CI gate as a first-pass introduction.
      "react/jsx-no-useless-fragment": ["warn", { "allowExpressions": true }],
      "react/self-closing-comp": "warn",
    },
  },
  {
    files: [
      "**/*.test.{js,mjs,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,mjs,jsx,ts,tsx}",
      "**/__mocks__/**/*.{js,jsx,ts,tsx}",
      "**/*.stories.{js,jsx,ts,tsx}",
      "**/*.stories.helpers.{js,jsx,ts,tsx}",
      "src/app/dev/**/*.{js,jsx,ts,tsx}",
      "src/components/devtools/**/*.{js,jsx,ts,tsx}",
      "src/lib/devtools/**/*.{js,jsx,ts,tsx}",
      "src/lib/design-tokens/**/*.{js,jsx,ts,tsx}",
      "src/stories/**/*.{js,jsx,ts,tsx}",
      "tests/**/*.{js,jsx,ts,tsx}",
      "scripts/**/*.{js,cjs,mjs}",
      "eslint-rules/**/*.js"
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off", // Allow require() in test files for Jest mocking
      "design-tokens/no-hardcoded-colors": "off", // Allow hardcoded colors in tests, dev tools, design tokens, stories, and scripts
      "no-console": "off", // Dev tooling, tests, stories, and scripts legitimately use console
      "@typescript-eslint/no-explicit-any": "warn", // Allow `any` in dev tools and tests, but flag it
      "react-hooks/rules-of-hooks": "off", // Playwright fixture helpers are not React hooks
    },
  },
  {
    // Dead/low-value test detection. Scoped to real test files (not stories or
    // dev tooling). warn keeps these out of the blocking CI gate as a first-pass
    // introduction, matching the markup-hygiene rules above.
    files: [
      "**/*.test.{js,mjs,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,mjs,jsx,ts,tsx}",
    ],
    plugins: { jest },
    rules: {
      // A test with no expect() asserts nothing. Recognize custom assertion
      // helpers (assertChoicesVisible, etc.) so delegating tests aren't flagged.
      "jest/expect-expect": ["warn", { assertFunctionNames: ["expect", "assert*"] }],
      // Indefinitely skipped / commented-out tests are dead weight.
      "jest/no-disabled-tests": "warn",
      "jest/no-commented-out-tests": "warn",
      // Handing an element its own layout geometry means the test is reading
      // back numbers it wrote, not observing layout. jsdom has no layout engine,
      // so there's no repair for this in a unit test — the check belongs in
      // Playwright. See public_docs/development/visual-testing-best-practices.md,
      // "Two tiers of layout assertion".
      //
      // error rather than the warn the rules above use: those landed against an
      // existing backlog and needed phasing in. This one starts at zero.
      "no-restricted-syntax": ["error",
        {
          selector: "CallExpression[callee.object.name='Object'][callee.property.name='defineProperty'] > Literal.arguments:matches([value='scrollHeight'], [value='clientHeight'], [value='scrollTop'], [value='getBoundingClientRect'], [value='offsetHeight'], [value='offsetTop'])",
          message: "Stubbing layout geometry means the test isn't observing layout. Measure it in a Playwright spec under tests/visual/ instead.",
        },
        {
          // Same property set as above. A direct assignment reaches the same
          // place — `(element as any).scrollHeight = 1000` needs a cast, and a
          // cast only costs a non-blocking no-explicit-any warning.
          selector: "AssignmentExpression > MemberExpression.left[property.name=/^(scrollHeight|clientHeight|scrollTop|getBoundingClientRect|offsetHeight|offsetTop)$/]",
          message: "Stubbing layout geometry means the test isn't observing layout. Measure it in a Playwright spec under tests/visual/ instead.",
        },
      ],
    },
  },
];

export default eslintConfig;
