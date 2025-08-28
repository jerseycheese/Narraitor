// src/components/devtools/MockControlsSection/MockControlsSection.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { MockControlsSection } from './MockControlsSection';

const meta: Meta<typeof MockControlsSection> = {
  title: 'DevTools/MockControlsSection',
  component: MockControlsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The MockControlsSection component provides comprehensive controls for managing AI response mocking in the DevTools. 

## Features

- **Enable/Disable Mock Mode**: Toggle between real AI responses and mock responses
- **Scenario Selection**: Choose from predefined scenarios (success, error, timeout, custom)
- **Global Settings**: Configure delay settings and variation options
- **Scenario Management**: Add, edit, and delete custom scenarios
- **Configuration Import/Export**: Save and restore mock configurations
- **Visual Status Indicators**: Clear feedback on current mock state

## Mock Scenarios

The component includes several built-in scenarios:
- **Success scenarios**: Fast, normal, and slow response times
- **Error scenarios**: API errors and quota exceeded
- **Timeout scenarios**: Network timeout simulation
- **Custom scenarios**: Pre-built character and world responses

## Usage

This component is typically used within the DevTools panel to provide developers with fine-grained control over AI response mocking during development and testing.
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="bg-slate-800 p-4 min-h-screen">
        <div className="max-w-2xl mx-auto bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockControlsSection>;

/**
 * Default state with mock disabled
 */
export const Default: Story = {
  name: 'Mock Disabled',
  parameters: {
    docs: {
      description: {
        story: 'The default state shows the MockControlsSection when mock mode is disabled. Only the enable button and status indicator are visible.'
      }
    }
  }
};

/**
 * Mock enabled with normal scenario active
 */
export const MockEnabled: Story = {
  name: 'Mock Enabled',
  parameters: {
    docs: {
      description: {
        story: 'When mock mode is enabled, all controls become available including scenario selection, global settings, and scenario management.'
      }
    },
    // This would require a mock store provider in a real implementation
    mockData: {
      configuration: {
        enabled: true,
        activeScenario: 'success-normal',
        globalDelay: 1000,
        enableDelayVariation: true
      }
    }
  }
};

/**
 * Error scenario active
 */
export const ErrorScenario: Story = {
  name: 'Error Scenario Active',
  parameters: {
    docs: {
      description: {
        story: 'Shows the interface when an error scenario is active. The status indicator shows red to indicate error state.'
      }
    },
    mockData: {
      configuration: {
        enabled: true,
        activeScenario: 'error-api',
        globalDelay: 1000,
        enableDelayVariation: true
      }
    }
  }
};

/**
 * Custom scenario management
 */
export const WithCustomScenarios: Story = {
  name: 'Custom Scenarios',
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with custom scenarios added. Custom scenarios can be edited and deleted, while built-in scenarios can only be edited.'
      }
    },
    mockData: {
      configuration: {
        enabled: true,
        activeScenario: 'custom-123',
        globalDelay: 1500,
        enableDelayVariation: false,
        customScenarios: [
          {
            id: 'custom-123',
            name: 'My Custom Scenario',
            type: 'success',
            delay: 800,
            response: {
              content: 'This is a custom response for testing purposes.'
            }
          }
        ]
      }
    }
  }
};

/**
 * Configuration import/export interface
 */
export const ImportExport: Story = {
  name: 'Import/Export Mode',
  parameters: {
    docs: {
      description: {
        story: 'Shows the import interface when the Import button is clicked. Users can paste JSON configuration data to restore previously exported settings.'
      }
    },
    // This would require specific interaction state management
  }
};

/**
 * Scenario editor interface
 */
export const ScenarioEditor: Story = {
  name: 'Scenario Editor',
  parameters: {
    docs: {
      description: {
        story: 'Shows the scenario editor interface that appears when creating or editing scenarios. Provides comprehensive options for scenario configuration.'
      }
    }
  }
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Shows how the component adapts to mobile screen sizes with stacked layouts and responsive controls.'
      }
    }
  }
};

/**
 * Dark theme variant
 */
export const DarkTheme: Story = {
  name: 'Dark Theme',
  decorators: [
    (Story) => (
      <div className="bg-slate-900 p-4 min-h-screen">
        <div className="max-w-2xl mx-auto bg-slate-800 p-4 rounded-lg border border-slate-500">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dark theme variant suitable for dark mode interfaces. Uses darker backgrounds and adjusted contrast ratios.'
      }
    }
  }
};

/**
 * Accessibility showcase
 */
export const AccessibilityDemo: Story = {
  name: 'Accessibility Features',
  parameters: {
    docs: {
      description: {
        story: `
## Accessibility Features Demonstrated

- **Keyboard Navigation**: All controls are focusable and keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Indicators**: Status indicators use both color and text
- **Form Labels**: All form inputs have associated labels
- **Button Descriptions**: Clear, descriptive button text

Use Tab to navigate through controls and verify keyboard accessibility.
        `
      }
    }
  }
};

/**
 * Performance testing scenario
 */
export const PerformanceTest: Story = {
  name: 'Performance Test',
  parameters: {
    docs: {
      description: {
        story: 'Configuration with many scenarios to test component performance with large datasets.'
      }
    },
    mockData: {
      configuration: {
        enabled: true,
        scenarios: Array.from({ length: 20 }, (_, i) => ({
          id: `scenario-${i}`,
          name: `Test Scenario ${i + 1}`,
          type: i % 4 === 0 ? 'error' : 'success',
          delay: Math.random() * 3000 + 500,
          description: `Generated test scenario number ${i + 1}`
        }))
      }
    }
  }
};

/**
 * Integration testing story
 */
export const IntegrationTest: Story = {
  name: 'Integration Test',
  parameters: {
    docs: {
      description: {
        story: 'Story for testing integration with other DevTools components and the mock store state management.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Integration test steps would go here in a real implementation
    console.log('Integration test running on:', canvasElement);
  }
};