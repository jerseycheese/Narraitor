import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillsStep } from '../SkillsStep';
import { World } from '@/types/world.types';

const buildWorldConfig = (skillPointPool: number): World => ({
  id: 'world-1',
  name: 'Test World',
  description: 'A world for testing skill allocation.',
  genre: 'fantasy',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-1',
      name: 'Agility',
      description: 'Determines speed and dexterity.',
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
      category: 'physical'
    }
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Stealth',
      description: 'Move unseen and unheard.',
      difficulty: 'medium',
      category: 'physical',
      attributeIds: ['attr-1'],
      baseValue: 1,
      minValue: 1,
      maxValue: 5
    }
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 20,
    skillPointPool,
  },
  toneSettings: undefined,
  image: undefined,
  reference: undefined,
  relationship: undefined,
});

describe('SkillsStep - skill point allocation', () => {
  const onUpdate = jest.fn();
  const onValidation = jest.fn();

  const renderSkillsStep = (overrides: Partial<React.ComponentProps<typeof SkillsStep>> = {}) => {
    const worldConfig = buildWorldConfig(3);

    const defaultProps: React.ComponentProps<typeof SkillsStep> = {
      data: {
        characterData: {
          skills: [
            {
              skillId: 'skill-1',
              name: 'Stealth',
              description: 'Move unseen and unheard.',
              attributeIds: ['attr-1'],
              isSelected: true,
              level: 2,
              minLevel: 1,
              maxLevel: 5,
            },
          ],
        },
        pointPools: {
          skills: {
            total: worldConfig.settings.skillPointPool,
            spent: 1,
            remaining: 2,
          },
        },
        validation: {},
      },
      onUpdate,
      onValidation,
      worldConfig,
    };

    render(<SkillsStep {...defaultProps} {...overrides} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains that unspent skill points are allowed', () => {
    renderSkillsStep();

    expect(
      screen.getByText(/You have extra skill points. It\'s fine to leave some unspent./)
    ).toBeInTheDocument();
  });

  it('clamps skill level changes to the available point pool', () => {
    renderSkillsStep();

    const slider = within(screen.getByTestId('skill-level-slider-skill-1')).getByRole('slider');
    
    // Attempt to set value beyond the available points (requested level 5 when only 3 total points)
    fireEvent.change(slider, { target: { value: '5' } });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedSkills = onUpdate.mock.calls[0][0].skills as Array<{ level: number }>;
    expect(updatedSkills[0].level).toBe(4);
  });

  it('resets levels to minimum when a skill is deselected', async () => {
    const user = userEvent.setup();
    renderSkillsStep();

    const toggle = screen.getByTestId('skill-toggle-skill-1');
    await user.click(toggle);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedSkills = onUpdate.mock.calls[0][0].skills as Array<{ isSelected: boolean; level: number }>;
    expect(updatedSkills[0].isSelected).toBe(false);
    expect(updatedSkills[0].level).toBe(1);
  });
});
