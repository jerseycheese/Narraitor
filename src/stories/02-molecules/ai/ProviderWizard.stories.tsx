import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { delay, http, HttpResponse } from 'msw';
import { ProviderWizard } from '@/components/ai/ProviderWizard';

const meta: Meta<typeof ProviderWizard> = {
  title: '02-Molecules/ai/ProviderWizard',
  component: ProviderWizard,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.post('/api/ai/models', () =>
          HttpResponse.json({
            models: [
              { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
              { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
            ],
          })
        ),
      ],
    },
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

export const ModelsLoaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
    const keyInput = await canvas.findByLabelText(/api key/i);
    await userEvent.type(keyInput, 'AIzaSyExampleSecretKey');
    const loadBtn = await canvas.findByRole('button', { name: /load models/i });
    await userEvent.click(loadBtn);
  },
};

export const ManualModelEntry: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    const nextBtn = await canvas.findByRole('button', { name: /^next$/i });
    await userEvent.click(nextBtn);
    const keyInput = await canvas.findByLabelText(/api key/i);
    await userEvent.type(keyInput, 'AIzaSyExampleSecretKey');
    const loadBtn = await canvas.findByRole('button', { name: /load models/i });
    await userEvent.click(loadBtn);
    const manualToggle = await canvas.findByRole('button', { name: /enter model id manually/i });
    await userEvent.click(manualToggle);
  },
};

export const ModelsLoading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/ai/models', async () => {
          await delay('infinite');
          return HttpResponse.json({ models: [] });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    await userEvent.click(await canvas.findByRole('button', { name: /^next$/i }));
    await userEvent.type(await canvas.findByLabelText(/api key/i), 'dummy-gemini-key');
    await userEvent.click(await canvas.findByRole('button', { name: /load models/i }));
    await canvas.findByRole('button', { name: /loading models/i });
  },
};

export const ModelDiscoveryFailureManualEntry: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/ai/models', () =>
          HttpResponse.json({ models: [], error: 'NETWORK' })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const geminiBtn = await canvas.findByRole('button', { name: /google gemini/i });
    await userEvent.click(geminiBtn);
    await userEvent.click(await canvas.findByRole('button', { name: /^next$/i }));
    await userEvent.type(await canvas.findByLabelText(/api key/i), 'dummy-gemini-key');
    await userEvent.click(await canvas.findByRole('button', { name: /load models/i }));
    await canvas.findByText(/could not reach provider to load models/i);
    const modelInput = await canvas.findByLabelText('Model');
    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, '~deepseek/deepseek-flash-latest');
  },
};
