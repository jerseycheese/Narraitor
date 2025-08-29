import type { Meta, StoryObj } from '@storybook/react';
import { ConsoleDebugAPIDemo } from './ConsoleDebugAPIDemo';

const meta: Meta<typeof ConsoleDebugAPIDemo> = {
  title: 'DevTools/ConsoleDebugAPI',
  component: ConsoleDebugAPIDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Console Debug API provides programmatic access to debugging functions via the browser console.

Available only in development environment via \`window.NARRAITOR_DEBUG\`.

## Usage in Console

\`\`\`javascript
// Show available functions
NARRAITOR_DEBUG.help()

// Clear console logs
NARRAITOR_DEBUG.clearLogs()

// Trigger test errors
NARRAITOR_DEBUG.triggerError()
NARRAITOR_DEBUG.triggerError("Custom error message")

// Simulate conditions
NARRAITOR_DEBUG.simulateCondition('offline')
NARRAITOR_DEBUG.simulateCondition('slow_network')
NARRAITOR_DEBUG.simulateCondition('api_error')

// Access store state
NARRAITOR_DEBUG.getStoreState()

// Reset all stores
NARRAITOR_DEBUG.resetStores()
\`\`\`

## Automation Support

Functions support batch operations and scripting scenarios for automated testing and debugging workflows.
        `
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing console debug API usage. Check browser console for the NARRAITOR_DEBUG object.'
      }
    }
  }
};

export const FunctionReference: Story = {
  parameters: {
    docs: {
      description: {
        story: `
## Function Reference

| Function | Description | Parameters |
|----------|-------------|------------|
| \`clearLogs()\` | Clears browser console | None |
| \`triggerError(message?)\` | Throws test error | Optional error message |
| \`simulateCondition(type)\` | Simulates various conditions | 'offline', 'slow_network', 'api_error' |
| \`getStoreState()\` | Access current store state | None |
| \`resetStores()\` | Reset all Zustand stores | None |
| \`help()\` | Show available functions | None |

### Environment Restriction

All functions are only available in development environment (\`NODE_ENV === 'development'\`).
        `
      }
    }
  }
};