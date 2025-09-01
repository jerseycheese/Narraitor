import type { Meta, StoryObj } from '@storybook/react';
import { AIMockingSection } from './AIMockingSection';
import { DevToolsProvider } from '../DevToolsContext';

const meta: Meta<typeof AIMockingSection> = {
  title: 'Narraitor/DevTools/Panels/AIMockingSection',
  component: AIMockingSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The AI Mocking Section is a development tool that allows developers to switch between live AI API calls 
and mock responses for testing and development purposes. This is essential for reliable testing and 
development without consuming API quota or depending on external services.

**Key Features:**
- Toggle between Live API and Mock modes
- Select from predefined mock scenarios (fast success, slow response, error conditions)
- Configure custom mock responses and delays
- Persistent settings across DevTools sessions
- Error simulation for testing error handling
- Configurable failure rates for mixed success/failure scenarios

**Mock Scenarios:**
- **Success Fast**: Quick successful responses (< 500ms)
- **Success Slow**: Delayed successful responses (2-5 seconds) 
- **Success Detailed**: Rich narrative content with realistic token counts
- **Error Timeout**: Simulates API timeout errors
- **Error Rate Limit**: Simulates API rate limiting
- **Custom**: User-defined responses with configurable timing

**Usage:**
This component is designed to be integrated into the DevTools panel during development. 
It provides developers with fine-grained control over AI response behavior for comprehensive testing.
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <DevToolsProvider initialIsOpen={true}>
        <div className="bg-gray-900 p-4 text-gray-200">
          <div style={{ maxWidth: '700px' }}>
            <Story />
          </div>
        </div>
      </DevToolsProvider>
    ),
  ],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing Live API mode
 */
export const LiveMode: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Default state of the AI Mocking Section when in Live API mode. This is the production-ready state 
where all AI requests go to the actual API service.

**Features visible:**
- Current mode indicator showing "Live API"
- Toggle button to switch to mock mode
- Clean, minimal interface when not in development mode
        `
      }
    }
  }
};

/**
 * Mock mode with scenario selection
 */
export const MockModeWithScenarios: Story = {
  args: {},
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: null,
      mockDelay: 1000,
      failureRate: 0
    },
    docs: {
      description: {
        story: `
AI Mocking Section in Mock mode, showing the full range of available mock scenarios. 
Developers can select from predefined scenarios to test different response conditions.

**Interactive Elements:**
- Mode toggle (currently set to Mock)
- Scenario dropdown with options like "Fast Success", "Slow Response", "Timeout Error"
- Scenario descriptions to help developers choose appropriate tests
- Additional configuration options for delays and failure rates
        `
      }
    }
  }
};

/**
 * Custom response configuration
 */
export const CustomResponseConfiguration: Story = {
  args: {},
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'custom',
      customResponses: {
        'custom': 'The brave knight approached the ancient castle, its towers shrouded in mist...'
      },
      mockDelay: 2500,
      failureRate: 0
    },
    docs: {
      description: {
        story: `
Shows the custom response configuration interface when "Custom" scenario is selected.
This allows developers to create specific narrative responses for testing particular scenarios.

**Configuration Options:**
- Custom response text editor with JSON validation
- Response delay configuration (in milliseconds)
- Failure rate slider for mixed success/failure testing
- Real-time preview of configuration
        `
      }
    }
  }
};

/**
 * Error simulation configuration
 */
export const ErrorSimulationSetup: Story = {
  args: {},
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'error-timeout',
      mockDelay: 5000,
      failureRate: 100
    },
    docs: {
      description: {
        story: `
Configuration for error simulation testing. This setup helps developers test how their 
application handles various API failure conditions.

**Error Testing Features:**
- Timeout errors with configurable delays
- Rate limit errors
- Network failure simulation
- 100% failure rate for consistent error testing
- Realistic error responses matching actual API error formats
        `
      }
    }
  }
};

/**
 * Mixed success/failure scenario
 */
export const MixedSuccessFailure: Story = {
  args: {},
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'success-variable',
      mockDelay: 1500,
      failureRate: 30
    },
    docs: {
      description: {
        story: `
Configuration for mixed success/failure testing with 30% failure rate. 
This is useful for testing application resilience and retry logic.

**Realistic Testing:**
- 70% success rate with normal responses
- 30% failure rate with various error types
- Variable response timing to simulate real-world conditions
- Helps validate error handling and user experience during intermittent failures
        `
      }
    }
  }
};

/**
 * Persistence demonstration
 */
export const PersistentSettings: Story = {
  args: {},
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'success-slow',
      customResponses: {
        'testing': 'Persistent test response that survives browser refresh'
      },
      mockDelay: 3000,
      failureRate: 15
    },
    docs: {
      description: {
        story: `
Demonstrates how mock settings persist across browser sessions. All configuration 
is automatically saved to localStorage and restored when DevTools is reopened.

**Persistent Data:**
- Selected mock mode (Live/Mock)
- Chosen scenario
- Custom response configurations  
- Delay and failure rate settings
- Cross-session consistency for reliable development workflow
        `
      }
    }
  }
};

/**
 * Compact layout for smaller DevTools panels
 */
export const CompactLayout: Story = {
  args: {},
  decorators: [
    (Story) => (
      <DevToolsProvider initialIsOpen={true}>
        <div className="bg-gray-900 p-2 text-gray-200">
          <div style={{ maxWidth: '400px' }}>
            <Story />
          </div>
        </div>
      </DevToolsProvider>
    ),
  ],
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'success-fast',
      mockDelay: 500,
      failureRate: 0
    },
    docs: {
      description: {
        story: `
Compact layout adaptation for smaller DevTools panels or constrained screen space.
The component gracefully adapts its interface while maintaining full functionality.

**Space-Efficient Features:**
- Condensed control layouts
- Tooltip-based help text
- Collapsible configuration sections
- Essential controls remain accessible
        `
      }
    }
  }
};

/**
 * Interactive workflow example
 */
export const InteractiveWorkflow: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Complete interactive workflow demonstration for developers learning to use AI mocking:

**Step-by-Step Workflow:**
1. **Start in Live Mode**: Toggle to Mock mode using the mode switch
2. **Select Scenario**: Choose "Success Slow" to test loading states
3. **Configure Timing**: Adjust delay to 3000ms for realistic testing
4. **Test Error Handling**: Switch to "Error Timeout" scenario  
5. **Custom Responses**: Select "Custom" and enter specific narrative content
6. **Mixed Testing**: Set failure rate to 25% for resilience testing

**Development Benefits:**
- No API quota consumption during development
- Consistent, reproducible test conditions
- Offline development capability
- Comprehensive error scenario coverage
        `
      }
    }
  }
};

/**
 * Integration preview with other DevTools sections
 */
export const DevToolsIntegration: Story = {
  args: {},
  decorators: [
    (Story) => (
      <DevToolsProvider initialIsOpen={true}>
        <div className="bg-gray-900 p-4 text-gray-200">
          {/* Simulated DevTools environment */}
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-gray-100 border-b border-gray-700 pb-2">
              AI Tools & Validation
            </h3>
            <div className="space-y-3">
              {/* AI Mocking Section */}
              <div className="bg-gray-700/30 p-3 rounded border border-gray-500">
                <h4 className="text-sm font-medium mb-2 text-gray-200">AI Response Mocking</h4>
                <Story />
              </div>
              {/* Simulated other sections */}
              <div className="bg-gray-700/30 p-3 rounded border border-gray-500 opacity-50">
                <h4 className="text-sm font-medium mb-2 text-gray-200">AI Testing Panel</h4>
                <div className="text-xs text-gray-500">Other DevTools sections...</div>
              </div>
            </div>
          </div>
        </div>
      </DevToolsProvider>
    ),
  ],
  parameters: {
    mockState: {
      mode: 'mock',
      selectedScenario: 'success-fast',
      mockDelay: 1000,
      failureRate: 0
    },
    docs: {
      description: {
        story: `
Preview of how the AI Mocking Section integrates within the broader DevTools panel structure.
Shows the component's placement within the AI Tools group alongside other debugging utilities.

**Integration Context:**
- Part of the AI Tools & Validation group
- Consistent styling with other DevTools sections
- Complementary to AI Testing and Monitoring tools
- Maintains visual hierarchy and organization
        `
      }
    }
  }
};