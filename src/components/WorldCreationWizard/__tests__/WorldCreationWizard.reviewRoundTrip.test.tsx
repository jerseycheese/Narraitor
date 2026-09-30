import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldCreationWizard from '../WorldCreationWizard';
import { withoutSuggestedEntries, type WorldCreationData } from '../WizardState';

const mockPush = jest.fn();
const mockCreateWorld = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/state/worldStore', () => {
  const state = {
    createWorld: (...args: unknown[]) => mockCreateWorld(...args),
    setCurrentWorld: jest.fn(),
    updateWorld: jest.fn(),
    worlds: {},
  };
  const useWorldStore = (selector?: (s: typeof state) => unknown) =>
    typeof selector === 'function' ? selector(state) : state;
  useWorldStore.getState = () => state;
  return { useWorldStore };
});

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: () => ({
    tutorialProgress: {
      phases: { worldCreation: { completed: true, skipped: true, lastStep: 99 } },
    },
  }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    setCurrentWizardStep: jest.fn(),
    pauseTour: jest.fn(),
    resumeTour: jest.fn(),
    startTour: jest.fn(),
    isTourActive: false,
  }),
}));

jest.mock('@/lib/ai/worldImageGenerator', () => ({
  generateWorldImage: jest.fn(() => new Promise(() => {})),
}));

jest.mock('@/lib/services/worldCreationService', () => ({
  ensureWorldNpcRoster: jest.fn().mockResolvedValue(undefined),
}));

const attr = (name: string) => ({
  name,
  description: `${name} description`,
  minValue: 1,
  maxValue: 10,
  baseValue: 5,
  category: 'General',
  accepted: true,
});

const skill = (name: string, linked: string[] = []) => ({
  name,
  description: `${name} description`,
  difficulty: 'medium' as const,
  category: 'General',
  linkedAttributeNames: linked,
  accepted: true,
  baseValue: 3,
  minValue: 1,
  maxValue: 5,
});

const baseData: Partial<WorldCreationData> = {
  name: 'Round Trip',
  genre: 'fantasy',
  description: 'A world long enough to pass the description step validation rule.',
  aiSuggestionsGenerated: true,
  aiSuggestions: {
    attributes: [attr('Might'), attr('Wits')],
    skills: [skill('Brawling', ['Might']), skill('Lore', ['Wits'])],
  },
};

const next = () => userEvent.click(screen.getByRole('button', { name: /^next/i }));
const back = () => userEvent.click(screen.getByRole('button', { name: /^back/i }));

describe('WorldCreationWizard review steps', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockCreateWorld.mockReturnValue('world-1');
  });

  it('keeps exclusions, custom entries and ids across Back and forward', async () => {
    const custom = {
      id: 'attribute-custom',
      worldId: '',
      name: 'Custom Grit',
      description: 'Made by hand',
      baseValue: 4,
      minValue: 1,
      maxValue: 10,
    };
    const onComplete = jest.fn();
    render(
      <WorldCreationWizard
        initialStep={2}
        initialData={{ ...baseData, attributes: [custom] }}
        onComplete={onComplete}
      />
    );

    await userEvent.click(await screen.findByTestId('attribute-toggle-1'));
    expect(screen.getByTestId('attribute-toggle-1')).toHaveTextContent('Excluded');
    await next();
    await userEvent.click(await screen.findByTestId('skill-toggle-1'));
    await back();
    await next();
    await back();

    expect(await screen.findByTestId('attribute-toggle-1')).toHaveTextContent('Excluded');
    expect(screen.getByTestId('custom-attribute-card-attribute-custom')).toBeInTheDocument();

    await next();
    expect(await screen.findByTestId('skill-toggle-1')).toHaveTextContent('Excluded');
    await next();
    await userEvent.click(screen.getByTestId('step-complete-button'));

    const created = mockCreateWorld.mock.calls[0][0];
    expect(created.attributes.map((a: { name: string }) => a.name)).toEqual(['Might', 'Custom Grit']);
    expect(created.skills.map((s: { name: string }) => s.name)).toEqual(['Brawling']);
    // The skill's link must point at the attribute id that was actually saved.
    expect(created.skills[0].attributeIds).toEqual([created.attributes[0].id]);
  });

  it('adopts saved entries from a draft whose suggestions have no ids', async () => {
    const saved = (id: string, name: string) => ({
      id, worldId: '', name, description: `${name} description`, baseValue: 7, minValue: 1, maxValue: 10,
    });
    const savedSkill = {
      id: 'skill-old', worldId: '', name: 'Brawling', description: 'x', difficulty: 'medium' as const,
      baseValue: 3, minValue: 1, maxValue: 5, attributeIds: ['attribute-old-might'],
    };
    render(
      <WorldCreationWizard
        initialStep={2}
        initialData={{
          ...baseData,
          attributes: [saved('attribute-old-might', 'Might'), saved('attribute-custom', 'Custom Grit')],
          skills: [savedSkill],
        }}
      />
    );

    expect(await screen.findByText(/attributes selected: 3 \/ 6/i)).toBeInTheDocument();
    expect(screen.getAllByTestId(/^custom-attribute-card-/)).toHaveLength(1);
    expect(screen.getByTestId('custom-attribute-card-attribute-custom')).toBeInTheDocument();

    await next();
    expect(await screen.findByText(/skills selected: 2 \/ 12/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^custom-skill-card-/)).toHaveLength(0);
    await next();
    await userEvent.click(screen.getByTestId('step-complete-button'));

    const created = mockCreateWorld.mock.calls[0][0];
    expect(created.attributes.map((a: { id: string }) => a.id)).toContain('attribute-old-might');
    expect(created.attributes).toHaveLength(3);
    expect(created.skills.find((s: { name: string }) => s.name === 'Brawling')).toMatchObject({
      id: 'skill-old',
      attributeIds: ['attribute-old-might'],
    });
  });

  it('caps selections at the world attribute limit', async () => {
    const many = Array.from({ length: 8 }, (_, i) => attr(`Attr ${i}`));
    render(
      <WorldCreationWizard
        initialStep={2}
        initialData={{ ...baseData, aiSuggestions: { attributes: many, skills: [] } }}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('attribute-toggle-7')).toHaveTextContent('Excluded')
    );
    await userEvent.click(screen.getByTestId('attribute-toggle-7'));
    expect(screen.getByTestId('attribute-toggle-7')).toHaveTextContent('Excluded');
    expect(screen.getByText(/attributes selected: 6 \/ 6/i)).toBeInTheDocument();
  });

  it('surfaces a createWorld failure instead of completing', async () => {
    mockCreateWorld.mockImplementation(() => {
      throw new Error('storage full');
    });
    const onComplete = jest.fn();
    render(<WorldCreationWizard initialStep={4} initialData={baseData} onComplete={onComplete} />);

    await userEvent.click(screen.getByTestId('step-complete-button'));

    expect(await screen.findByText(/couldn't create this world/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('withoutSuggestedEntries', () => {
  it('also drops entries from id-less legacy suggestions, by name', () => {
    const entry = (id: string, name: string) => ({
      id, worldId: '', name, description: '', baseValue: 5, minValue: 1, maxValue: 10,
    });
    const result = withoutSuggestedEntries({
      aiSuggestions: { attributes: [attr('Might')], skills: [] },
      attributes: [entry('a1', 'Might'), entry('a2', 'Custom Grit')],
    });
    expect(result.attributes?.map((a) => a.name)).toEqual(['Custom Grit']);
  });
});
