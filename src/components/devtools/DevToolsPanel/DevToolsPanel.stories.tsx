import React, { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DevToolsPanel } from './DevToolsPanel';
import { DevToolsProvider } from '../DevToolsContext';

interface DevToolsWrapperProps {
  children: ReactNode;
  initialIsOpen?: boolean;
}

// Create a component wrapper for the different states
const DevToolsWrapper = ({ children, initialIsOpen = false }: DevToolsWrapperProps) => {
  return (
    <div className="h-[90vh] relative">
      <div className="h-full overflow-auto p-5">
        <h1>Page Content</h1>
        <p>This represents the main content of the page.</p>
        {/* Repeat content to show scrolling */}
        {Array(20).fill(0).map((_, i) => (
          <p key={i}>Content line {i+1}</p>
        ))}
      </div>
      <DevToolsProvider initialIsOpen={initialIsOpen}>
        {children}
      </DevToolsProvider>
    </div>
  );
};

const meta: Meta<typeof DevToolsPanel> = {
  title: 'Narraitor/DevTools/DevToolsPanel',
  component: DevToolsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Panel that displays at the bottom of the screen with debugging tools'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <DevToolsWrapper>
        <Story />
      </DevToolsWrapper>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof DevToolsPanel>;

export const Default: Story = {
  args: {}
};

export const InitiallyOpen: Story = {
  decorators: [
    (Story: React.ComponentType) => (
      <DevToolsWrapper initialIsOpen={true}>
        <Story />
      </DevToolsWrapper>
    )
  ]
};