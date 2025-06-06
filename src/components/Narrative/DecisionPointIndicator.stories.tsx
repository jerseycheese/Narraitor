import type { Meta, StoryObj } from '@storybook/react';
import { DecisionPointIndicator } from './DecisionPointIndicator';

const meta: Meta<typeof DecisionPointIndicator> = {
  title: 'Narraitor/Narrative/DecisionPointIndicator',
  component: DecisionPointIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visual indicator that appears in the narrative flow to show decision points. Provides clear visual cues when players need to make choices.'
      }
    }
  },
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the decision point is currently active'
    },
    decisionWeight: {
      control: 'select',
      options: ['minor', 'major', 'critical'],
      description: 'The importance level of the decision, affecting visual prominence'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof DecisionPointIndicator>;

export const Inactive: Story = {
  args: {
    isActive: false,
    decisionWeight: 'minor'
  }
};

export const MinorDecision: Story = {
  args: {
    isActive: true,
    decisionWeight: 'minor'
  }
};

export const MajorDecision: Story = {
  args: {
    isActive: true,
    decisionWeight: 'major'
  }
};

export const CriticalDecision: Story = {
  args: {
    isActive: true,
    decisionWeight: 'critical'
  }
};

// Show all states in a grid for comparison
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Inactive</h3>
        <DecisionPointIndicator isActive={false} decisionWeight="minor" />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Minor Decision</h3>
        <DecisionPointIndicator isActive={true} decisionWeight="minor" />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Major Decision</h3>
        <DecisionPointIndicator isActive={true} decisionWeight="major" />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Critical Decision</h3>
        <DecisionPointIndicator isActive={true} decisionWeight="critical" />
      </div>
    </div>
  )
};

// Show in narrative context
export const InNarrativeContext: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      {/* Mock narrative segment */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <p className="text-xs uppercase text-gray-600 font-semibold mb-2">SCENE</p>
        <p className="text-lg leading-relaxed text-gray-800">
          You stand at the crossroads of the ancient forest path. To your left, mysterious lights 
          flicker between the dark trees. To your right, you hear the distant sound of running water. 
          Ahead, the path continues straight into an impenetrable fog.
        </p>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">Ancient Forest Crossroads</p>
        </div>
      </div>
      
      {/* Decision point indicator */}
      <DecisionPointIndicator isActive={true} decisionWeight="major" />
    </div>
  ),
  parameters: {
    layout: 'padded'
  }
};

// Mobile responsive view
export const MobileView: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <p className="text-sm leading-relaxed text-gray-800">
          A tense moment unfolds. Your choice here could determine the fate of the village.
        </p>
      </div>
      <DecisionPointIndicator isActive={true} decisionWeight="critical" />
    </div>
  ),
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};