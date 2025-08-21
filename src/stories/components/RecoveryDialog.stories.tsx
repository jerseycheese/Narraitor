/**
 * Recovery Dialog Component Story
 * Used for testing recovery dialog integration scenarios
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';

const meta: Meta<typeof RecoveryNotification> = {
  title: 'Integration/RecoveryDialog',
  component: RecoveryNotification,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Recovery dialog integration testing component. This story demonstrates the user workflow
for data recovery when returning to a game session with previously saved data.

**Testing Scenarios:**
- User returns to game and finds previous session data
- User chooses to recover previous session state
- User chooses to start fresh and dismiss recovery
- Error handling when recovery fails
- Accessibility and keyboard navigation

**Integration Points:**
- Game session initialization
- Auto-save service integration  
- User choice handling and state management
        `
      }
    }
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Controls whether the recovery dialog is shown'
    },
    lastSaved: {
      control: 'text',
      description: 'ISO timestamp of when data was last saved'
    },
    onRecover: {
      action: 'recovered',
      description: 'Called when user chooses to recover data'
    },
    onDismiss: {
      action: 'dismissed', 
      description: 'Called when user dismisses the recovery dialog'
    }
  }
};

export default meta;
type Story = StoryObj<typeof RecoveryNotification>;

export const GameSessionRecovery: Story = {
  name: 'Game Session Recovery',
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T14:30:00.000Z',
    onRecover: action('User recovered session'),
    onDismiss: action('User started fresh session'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary recovery dialog shown when user returns to a game with saved data. Test user choice workflow.'
      }
    }
  }
};

export const RecentRecovery: Story = {
  name: 'Recent Save Recovery',
  args: {
    isVisible: true,
    lastSaved: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    onRecover: action('User recovered recent session'),
    onDismiss: action('User dismissed recent recovery'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery dialog with very recent save data. Tests timestamp formatting for recent saves.'
      }
    }
  }
};

export const OldRecovery: Story = {
  name: 'Old Save Recovery',
  args: {
    isVisible: true,
    lastSaved: '2023-10-01T09:15:00.000Z',
    onRecover: action('User recovered old session'),
    onDismiss: action('User dismissed old recovery'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery dialog with older save data. Tests how well users can identify older sessions.'
      }
    }
  }
};

export const NoTimestampRecovery: Story = {
  name: 'Recovery Without Timestamp',
  args: {
    isVisible: true,
    lastSaved: undefined,
    onRecover: action('User recovered session with no timestamp'),
    onDismiss: action('User dismissed recovery with no timestamp'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Recovery dialog when save timestamp is unavailable. Tests graceful degradation.'
      }
    }
  }
};

export const HiddenDialog: Story = {
  name: 'Hidden Dialog State',
  args: {
    isVisible: false,
    lastSaved: '2023-12-15T14:30:00.000Z',
    onRecover: action('This should not fire'),
    onDismiss: action('This should not fire'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog in hidden state. Use to test conditional rendering and state transitions.'
      }
    }
  }
};

export const InteractiveRecoveryFlow: Story = {
  name: 'Interactive Recovery Flow',
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T16:45:00.000Z',
    onRecover: action('Recovery chosen - would restore game state'),
    onDismiss: action('Fresh start chosen - would clear saved data'),
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive story for testing the complete recovery flow:

1. **Recovery Action**: Click "Recover Data" to simulate restoring previous game state
2. **Fresh Start**: Click "Dismiss" to simulate starting a new game session  
3. **Keyboard Navigation**: Use Tab/Enter to test accessibility
4. **Focus Management**: First button should receive focus when dialog appears

**Integration Testing Notes:**
- In real implementation, onRecover would trigger state restoration
- onDismiss would clear recovery data and start fresh session
- Dialog should properly manage focus and keyboard navigation
- Actions logged in Storybook Actions tab for verification
        `
      }
    }
  }
};

// Story for testing error scenarios
export const RecoveryErrorScenarios: Story = {
  name: 'Error Scenarios',
  args: {
    isVisible: true,
    lastSaved: 'invalid-date-format',
    onRecover: action('Recovery attempt with invalid data'),
    onDismiss: action('Dismissed after error scenario'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test recovery dialog behavior with invalid or corrupted save data timestamps.'
      }
    }
  }
};