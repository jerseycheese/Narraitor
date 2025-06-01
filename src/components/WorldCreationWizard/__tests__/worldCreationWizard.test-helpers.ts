import { useRouter } from 'next/navigation';
import * as worldAnalyzer from '@/lib/ai/worldAnalyzer';

// Increase Jest timeout for all tests
jest.setTimeout(30000);

// Mock world analyzer
jest.mock('@/lib/ai/worldAnalyzer', () => ({
  analyzeWorldDescription: jest.fn(),
}));

// Get the mocked worldStore
const { worldStore } = jest.requireMock('@/state/worldStore');

// Export the mock functions directly from the mocked worldStore
export const mockCreateWorld = worldStore.__mockCreateWorld;
export const mockAnalyzeWorldDescription = worldAnalyzer.analyzeWorldDescription as jest.Mock;

// Create a mock router instance that can be reused
const createMockRouter = () => ({
  basePath: '',
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  forward: jest.fn(),
  refresh: jest.fn(),
});

export const setupMocks = () => {
  jest.clearAllMocks();
  
  // Reset worldStore mocks
  worldStore.__resetMocks();
  
  // Configure the useRouter mock with a fresh router instance
  const mockRouter = createMockRouter();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);

  // Set up default AI response with immediate resolution
  mockAnalyzeWorldDescription.mockImplementation(() => {
    return Promise.resolve({
      attributes: [
        {
          name: 'Strength',
          description: 'Physical power and endurance',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
          accepted: false,
          category: 'Physical',
        },
      ],
      skills: [
        {
          name: 'Combat',
          description: 'Ability to fight effectively',
          difficulty: 'medium',
          accepted: false,
          category: 'Combat',
          linkedAttributeId: null,
        },
      ],
    });
  });
  
  return { mockRouter };
};