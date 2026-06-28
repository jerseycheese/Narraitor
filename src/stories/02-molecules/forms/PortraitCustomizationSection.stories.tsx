import { Meta, StoryObj } from '@storybook/react';
import { PortraitCustomizationSection } from '@/components/shared/PortraitCustomizationSection';

const meta: Meta<typeof PortraitCustomizationSection> = {
  title: '02-Molecules/forms/PortraitCustomizationSection',
  component: PortraitCustomizationSection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    physicalDescription: 'Silver hair, storm-grey eyes, a scar across the left temple.',
    setPhysicalDescription: () => {},
    environmentHint: 'A rain-soaked harbour at dusk.',
    setEnvironmentHint: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PortraitCustomizationSection>;

export const Default: Story = {};

export const Empty: Story = {
  args: { physicalDescription: '', environmentHint: '' },
};
