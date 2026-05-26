import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterSuggestions } from '../CharacterSuggestions';
import {
  createMockWorld,
  createMockWorldAttribute,
  createMockWorldSkill,
} from '@/lib/test-utils/testDataFactory';
import { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';

const world = createMockWorld({
  attributes: [
    createMockWorldAttribute({ id: 'attr-1', name: 'Strength', minValue: 1, maxValue: 10 }),
  ],
  skills: [
    createMockWorldSkill({ id: 'skill-1', name: 'Athletics', minValue: 1, maxValue: 10 }),
  ],
});

const characterData: CharacterCreationData = {
  worldId: world.id,
  name: '',
  description: 'A wandering knight',
  portraitPlaceholder: '',
  attributes: [
    { attributeId: 'attr-1', name: 'Strength', value: 1, minValue: 1, maxValue: 10 },
  ],
  skills: [
    {
      skillId: 'skill-1',
      name: 'Athletics',
      level: 1,
      minLevel: 1,
      maxLevel: 10,
      isSelected: false,
    },
  ],
  background: { history: '', personality: '', goals: [], motivation: '' },
};

const generated = {
  name: 'Generated Hero',
  background: {
    description: 'A weathered investigator with a past.',
    personality: 'Sharp and cynical.',
    motivation: 'Find the truth.',
    fears: ['failure', 'the dark'],
    physicalDescription: 'Tall, tired eyes.',
  },
  attributes: [{ id: 'attr-1', value: 8 }],
  skills: [{ id: 'skill-1', level: 6 }],
  level: 3,
};

function mockFetchOk(data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  }) as jest.Mock;
}

function renderPanel(onAdopt = jest.fn()) {
  render(
    <CharacterSuggestions
      world={world}
      concept={characterData.description}
      characterData={characterData}
      onAdopt={onAdopt}
    />
  );
  return onAdopt;
}

describe('CharacterSuggestions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates and renders the four suggestion cards', async () => {
    mockFetchOk(generated);
    renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Description suggestion' })).toBeInTheDocument();
    });
    expect(screen.getByRole('article', { name: 'Background suggestion' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Attributes suggestion' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Skills suggestion' })).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/generate-character',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('adopts the description suggestion', async () => {
    mockFetchOk(generated);
    const onAdopt = renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );
    await screen.findByRole('article', { name: 'Description suggestion' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Adopt Description suggestion' })
    );

    expect(onAdopt).toHaveBeenCalledWith({
      description: generated.background.description,
    });
  });

  it('dismisses a suggestion card', async () => {
    mockFetchOk(generated);
    renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );
    await screen.findByRole('article', { name: 'Description suggestion' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Dismiss Description suggestion' })
    );

    expect(
      screen.queryByRole('article', { name: 'Description suggestion' })
    ).not.toBeInTheDocument();
  });

  it('edits a suggestion before adopting it', async () => {
    mockFetchOk(generated);
    const onAdopt = renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );
    await screen.findByRole('article', { name: 'Description suggestion' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Description suggestion' })
    );

    const textarea = screen.getByLabelText('Description');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'My edited description');

    await userEvent.click(
      screen.getByRole('button', { name: 'Adopt Description suggestion' })
    );

    expect(onAdopt).toHaveBeenCalledWith({ description: 'My edited description' });
  });

  it('never adopts NaN when an attribute edit clears the input', async () => {
    mockFetchOk(generated);
    const onAdopt = renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );
    await screen.findByRole('article', { name: 'Attributes suggestion' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Attributes suggestion' })
    );

    // Clear the Strength number input (transient state — empty string parses to NaN).
    await userEvent.clear(screen.getByLabelText('Strength value'));

    await userEvent.click(
      screen.getByRole('button', { name: 'Adopt Attributes suggestion' })
    );

    const call = onAdopt.mock.calls.find((c) => c[0]?.attributes);
    expect(call).toBeDefined();
    for (const attr of call![0].attributes) {
      expect(Number.isFinite(attr.value)).toBe(true);
    }
  });

  it('shows an error when generation fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Generation exploded' }),
    }) as jest.Mock;
    renderPanel();

    await userEvent.click(
      screen.getByRole('button', { name: 'Suggest character details' })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Generation exploded');
    });
  });
});
