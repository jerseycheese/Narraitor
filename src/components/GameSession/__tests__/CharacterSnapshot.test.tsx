import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { CharacterSnapshot } from '../CharacterSnapshot';
import { useWorldStore } from '@/state/worldStore';

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(),
}));

jest.mock('@/components/CharacterPortrait', () => ({
  CharacterPortrait: ({ characterName }: { characterName: string }) => (
    <div role="img" aria-label={characterName} />
  ),
}));

describe('CharacterSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows world skills with zero fallback and excludes non-world skills', () => {
    (useWorldStore as unknown as jest.Mock).mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          attributes: [],
          skills: [
            { id: 'skill-first-aid', name: 'First Aid' },
            { id: 'skill-medical-diagnosis', name: 'Medical Diagnosis' },
          ],
        },
      },
    });

    const character = {
      id: 'char-1',
      name: 'Eleanor "Ellie" Hayes',
      worldId: 'world-1',
      level: 1,
      attributes: [],
      skills: [
        {
          id: 'char-skill-first-aid',
          characterId: 'char-1',
          worldSkillId: 'skill-first-aid',
          name: 'First Aid',
          level: 6,
        },
        {
          id: 'char-skill-ghost',
          characterId: 'char-1',
          worldSkillId: 'skill-ghost',
          name: 'Ghost Skill',
          level: 9,
        },
      ],
      background: {
        history: '',
        personality: '',
        goals: [],
        fears: [],
        relationships: [],
      },
      isPlayer: true,
      status: {
        health: 10,
        maxHealth: 10,
        conditions: [],
      },
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 10,
        categories: [],
        itemOrder: [],
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const { container } = render(<CharacterSnapshot character={character} />);

    const firstAidRow = screen.getByText('First Aid').closest('.manuscript-character-snapshot-item');
    const medicalDiagnosisRow = screen.getByText('Medical Diagnosis').closest('.manuscript-character-snapshot-item');

    expect(firstAidRow).toBeInTheDocument();
    expect(medicalDiagnosisRow).toBeInTheDocument();

    expect(within(firstAidRow as HTMLElement).getByText('6')).toBeInTheDocument();
    expect(within(medicalDiagnosisRow as HTMLElement).getByText('0')).toBeInTheDocument();

    expect(screen.queryByText('Ghost Skill')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.manuscript-character-snapshot-item')).toHaveLength(2);
  });
});
