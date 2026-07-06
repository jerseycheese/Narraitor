import { Meta, StoryObj } from '@storybook/react';
import {
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
  WizardSelect,
} from '@/components/shared/wizard/components/FormComponents';

const meta: Meta = {
  title: '02-Molecules/wizard/FormComponents',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const genres = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'noir', label: 'Noir' },
];

export const FullForm: Story = {
  render: () => (
    <WizardFormSection title="World basics" description="The essentials before we generate.">
      <WizardFormGroup label="Name" required>
        <WizardTextField value="The Shattered Isles" onChange={() => {}} />
      </WizardFormGroup>
      <WizardFormGroup label="Genre" required>
        <WizardSelect value="fantasy" onChange={() => {}} options={genres} />
      </WizardFormGroup>
      <WizardFormGroup label="Description" helpText="A sentence or two sets the tone.">
        <WizardTextArea value="A storm-ravaged archipelago where ancient magic stirs." onChange={() => {}} />
      </WizardFormGroup>
    </WizardFormSection>
  ),
};

export const WithError: Story = {
  render: () => (
    <WizardFormGroup label="Name" required error="A name is required.">
      <WizardTextField value="" onChange={() => {}} error="A name is required." />
    </WizardFormGroup>
  ),
};
