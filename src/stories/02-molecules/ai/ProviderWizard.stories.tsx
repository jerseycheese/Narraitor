import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';
import { ProviderWizard } from '@/components/ai/ProviderWizard';

const meta: Meta<typeof ProviderWizard> = {
  title: '02-Molecules/ai/ProviderWizard',
  component: ProviderWizard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onComplete: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ProviderWizard>;

export const PresetSelection: Story = {};

export const PresetSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
  },
};

export const KeyState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
  },
};

export const KeyRevealed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
    const keyInput = await canvas.findByLabelText(/api key/i);
    await userEvent.type(keyInput, 'AIzaSyExampleSecretKey');
    const revealBtn = await canvas.findByRole('button', { name: /show key/i });
    await userEvent.click(revealBtn);
  },
};

export const VerifySuccess: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
    const keyInput = await canvas.findByLabelText(/api key/i);
    await userEvent.type(keyInput, 'AIzaSyExampleSecretKey');
    const nextBtn2 = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn2);
    const testBtn = await canvas.findByRole('button', { name: /test connection/i });
    await userEvent.click(testBtn);
  },
};

export const VerifyError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/ai/validate-provider', () =>
          HttpResponse.json({
            valid: false,
            error: 'INVALID_KEY',
          })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
    const keyInput = await canvas.findByLabelText(/api key/i);
    await userEvent.type(keyInput, 'AIzaSyBadKey');
    const nextBtn2 = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn2);
    const testBtn = await canvas.findByRole('button', { name: /test connection/i });
    await userEvent.click(testBtn);
  },
};
