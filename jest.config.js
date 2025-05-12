/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Add any other necessary module mocks if Next.js specific imports cause issues
    // For example, for CSS modules or static assets if not handled by ts-jest/jsdom
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Handles CSS imports
  },
  testMatch: [
    // Adjusted to be more specific to avoid potential conflicts if 'tests' dir is used later
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', { 
      tsconfig: {
        module: 'esnext',
        target: 'esnext',
        moduleResolution: 'node',
        allowJs: true,
        esModuleInterop: true,
      }
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;
