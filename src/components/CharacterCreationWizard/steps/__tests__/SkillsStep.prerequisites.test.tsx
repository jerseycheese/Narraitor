import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillsStep } from '../SkillsStep';
import { World } from '@/types/world.types';

const buildWorldConfig = (): World => ({
  id: 'world-1',
  name: 'Test World',
  description: 'A world for testing skill prerequisites.',
  genre: 'fantasy',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attributes: [
    {
      id: 'attr-str',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Physical power.',
      baseValue: 1,
      minValue: 1,
      maxValue: 10,
      category: 'physical',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Heavy Lifting',
      description: 'Requires real muscle.',
      difficulty: 'medium',
      category: 'physical',
      attributeIds: ['attr-str'],
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
      attributePrerequisites: [{ attributeId: 'attr-str', minValue: 5 }],
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 20,
    skillPointPool: 5,
  },
  toneSettings: undefined,
  image: undefined,
  reference: undefined,
  relationship: undefined,
});

const buildSkill = (overrides = {}) => ({
  skillId: 'skill-1',
  name: 'Heavy Lifting',
  description: 'Requires real muscle.',
  attributeIds: ['attr-str'],
  isSelected: false,
  level: 1,
  minLevel: 1,
  maxLevel: 5,
  ...overrides,
});

describe('SkillsStep - attribute prerequisites', () => {
  const onUpdate = jest.fn();
  const onValidation = jest.fn();

  const renderStep = (
    attributeValue: number,
    skillOverrides: Record<string, unknown> = {}
  ) => {
    const worldConfig = buildWorldConfig();
    render(
      <SkillsStep
        data={{
          characterData: {
            skills: [buildSkill(skillOverrides)],
            attributes: [{ attributeId: 'attr-str', value: attributeValue }],
          },
          pointPools: { skills: { total: 5, spent: 0, remaining: 5 } },
          validation: {},
        }}
        onUpdate={onUpdate}
        onValidation={onValidation}
        worldConfig={worldConfig}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks a skill and shows the requirement when prerequisites are unmet', () => {
    renderStep(3);

    expect(screen.getByTestId('skill-toggle-skill-1')).toBeDisabled();
    expect(screen.getByTestId('skill-requirement-skill-1')).toHaveTextContent(
      'Requires Strength 5 (you have 3)'
    );
  });

  it('prevents selecting a locked skill', async () => {
    const user = userEvent.setup();
    renderStep(3);

    await user.click(screen.getByTestId('skill-toggle-skill-1'));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('enables selection once prerequisites are met', async () => {
    const user = userEvent.setup();
    renderStep(5);

    const toggle = screen.getByTestId('skill-toggle-skill-1');
    expect(toggle).not.toBeDisabled();
    expect(screen.queryByTestId('skill-requirement-skill-1')).not.toBeInTheDocument();

    await user.click(toggle);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedSkills = onUpdate.mock.calls[0][0].skills as Array<{ isSelected: boolean }>;
    expect(updatedSkills[0].isSelected).toBe(true);
  });

  it('auto-deselects a selected skill whose prerequisites are no longer met', () => {
    renderStep(3, { isSelected: true, level: 3 });

    expect(onUpdate).toHaveBeenCalled();
    const updatedSkills = onUpdate.mock.calls[0][0].skills as Array<{
      isSelected: boolean;
      level: number;
    }>;
    expect(updatedSkills[0].isSelected).toBe(false);
    expect(updatedSkills[0].level).toBe(1);
  });
});
