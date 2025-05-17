import type { Meta, StoryObj } from '@storybook/react';
import { useContext } from 'react';
import { DevToolsProvider, DevToolsContext } from './DevToolsContext';

// Demo component to show context usage
const ContextDemo = () => {
  const { isOpen, toggleDevTools } = useContext(DevToolsContext);
  return (
    <div className="p-4 border rounded">
      <div className="mb-4">DevTools is: <strong>{isOpen ? 'OPEN' : 'CLOSED'}</strong></div>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={toggleDevTools}
      >
        Toggle DevTools
      </button>
    </div>
  );
};

const meta: Meta<typeof DevToolsProvider> = {
  title: 'Narraitor/DevTools/DevToolsContext',
  component: DevToolsProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Context provider for managing DevTools state'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DevToolsProvider>;

export const Default: Story = {
  render: () => (
    <DevToolsProvider>
      <ContextDemo />
    </DevToolsProvider>
  ),
};

export const InitiallyOpen: Story = {
  render: () => (
    <DevToolsProvider initialIsOpen={true}>
      <ContextDemo />
    </DevToolsProvider>
  ),
};