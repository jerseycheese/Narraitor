import type { Meta, StoryObj } from '@storybook/react';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';

// Mock the sessionStore and worldStore for Storybook
jest.mock('@/state/sessionStore', () => ({
  sessionStore: () => ({
    setOnboardingCompleted: () => {},
    shouldShowOnboarding: () => true,
  }),
}));

jest.mock('@/state/worldStore', () => ({
  worldStore: () => ({
    createWorld: () => 'mock-world-id',
    setCurrentWorld: () => {},
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
  }),
}));

const meta: Meta<typeof GuidedFirstTimeExperience> = {
  title: 'Components/GuidedFirstTimeExperience',
  component: GuidedFirstTimeExperience,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A guided onboarding flow for first-time users to create their first world quickly and easily.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WelcomeStep: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The welcome screen with clear value proposition for new players.',
      },
    },
  },
};

export const ConceptStep: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Step where users describe their world concept to get personalized AI suggestions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Simulate advancing to step 2
    const nextButton = canvasElement.querySelector('button[class*="bg-blue-600"]');
    if (nextButton) {
      (nextButton as HTMLButtonElement).click();
    }
  },
};

export const DetailsStep: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Final step where users provide world name and theme before completion.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Simulate advancing to step 3
    const nextButton = canvasElement.querySelector('button[class*="bg-blue-600"]');
    if (nextButton) {
      (nextButton as HTMLButtonElement).click();
      // Click again to reach step 3
      setTimeout(() => {
        const nextButton2 = canvasElement.querySelector('button[class*="bg-blue-600"]');
        if (nextButton2) {
          (nextButton2 as HTMLButtonElement).click();
        }
      }, 100);
    }
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'iphone6',
    },
    docs: {
      description: {
        story: 'Mobile-optimized view with large touch targets and responsive layout.',
      },
    },
  },
};

export const InteractiveFlow: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive story demonstrating the complete onboarding flow.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Click Next from welcome
    await sleep(500);
    const nextButton1 = canvasElement.querySelector('button[class*="bg-blue-600"]') as HTMLButtonElement;
    if (nextButton1) nextButton1.click();
    
    // Step 2: Fill concept
    await sleep(500);
    const conceptTextarea = canvasElement.querySelector('textarea[name="world-concept"]') as HTMLTextAreaElement;
    if (conceptTextarea) {
      conceptTextarea.value = 'A magical forest realm';
      conceptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await sleep(500);
    const nextButton2 = canvasElement.querySelector('button[class*="bg-blue-600"]') as HTMLButtonElement;
    if (nextButton2) nextButton2.click();
    
    // Step 3: Fill details
    await sleep(500);
    const nameInput = canvasElement.querySelector('input[id="world-name"]') as HTMLInputElement;
    if (nameInput) {
      nameInput.value = 'Elderwood Realm';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await sleep(200);
    const themeSelect = canvasElement.querySelector('select[id="world-theme"]') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = 'fantasy';
      themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};