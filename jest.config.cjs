const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  // Instruments every production source file so untested files are counted
  // in the denominator rather than silently omitted (#1994).
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/stories/**',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
  ],
  // Baseline ratchet with untested production files included.
  // Measured: statements 72.42%, branches 61.56%, functions 68.20%, lines 72.87%.
  // Thresholds set with a ~1-2% cushion so regressions fail the build without
  // tripping on current code.
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 66,
      lines: 71,
      statements: 71,
    },
  },
  moduleNameMapper: {
    // CSS stub must come first: mappers match in order, and the @/ alias would
    // otherwise resolve @/-form stylesheet imports to real files.
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/scripts/**/*.test.{js,mjs}',
    '<rootDir>/.github/scripts/**/__tests__/**/*.test.{js,mjs}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/pages/',  // Ignore old pages directory
    '<rootDir>/app/',    // Ignore old app directory
    '<rootDir>/.claude/worktrees/',  // Ignore git worktrees
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/worktrees/',  // Ignore git worktrees for module resolution
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
    '^.+\\.(js|jsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = config;
