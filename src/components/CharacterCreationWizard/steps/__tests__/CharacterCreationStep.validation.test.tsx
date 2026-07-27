import React from 'react';
import { render, screen } from '@testing-library/react';
import { BasicInfoStep } from '../BasicInfoStep';
import { AttributesStep } from '../AttributesStep';
import { SkillsStep } from '../SkillsStep';
import { BackgroundStep } from '../BackgroundStep';
import type { World } from '@/types/world.types';

const worldConfig: World = {
  id: 'world-1',
  name: 'Validation World',
  description: 'A world for wizard validation tests.',
  genre: 'fantasy',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Physical power.',
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
      category: 'physical',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Stealth',
      description: 'Move quietly.',
      difficulty: 'medium',
      category: 'physical',
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 1,
    skillPointPool: 3,
  },
};

const onUpdate = jest.fn();
const onValidation = jest.fn();

describe('CharacterCreationWizard step validation display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows basic-info errors from step 0', () => {
    render(
      <BasicInfoStep
        data={{
          characterData: {
            worldId: 'world-1',
            name: '',
            description: '',
            portraitPlaceholder: '',
            attributes: [],
            skills: [],
            background: {
              history: '',
              personality: '',
              goals: [],
              motivation: '',
            },
          },
          validation: {
            0: {
              valid: false,
              touched: true,
              errors: ['Character name is required'],
            },
          },
        }}
        onUpdate={onUpdate}
        onValidation={onValidation}
      />
    );

    expect(screen.getByText('Character name is required')).toBeInTheDocument();
  });

  it('shows attribute errors from step 1', () => {
    render(
      <AttributesStep
        data={{
          characterData: {
            attributes: [
              {
                attributeId: 'attr-1',
                name: 'Strength',
                value: 3,
                minValue: 1,
                maxValue: 5,
              },
            ],
          },
          pointPools: {
            attributes: {
              total: 1,
              spent: 3,
              remaining: -2,
            },
          },
          validation: {
            1: {
              valid: false,
              touched: true,
              errors: ['Too many attribute points'],
            },
          },
        }}
        onUpdate={onUpdate}
        onValidation={onValidation}
        worldConfig={worldConfig}
      />
    );

    expect(screen.getByText('Too many attribute points')).toBeInTheDocument();
  });

  it('does not duplicate skill errors inside step 2', () => {
    render(
      <SkillsStep
        data={{
          characterData: {
            attributes: [{ attributeId: 'attr-1', value: 1 }],
            skills: [
              {
                skillId: 'skill-1',
                name: 'Stealth',
                description: 'Move quietly.',
                isSelected: false,
                level: 1,
                minLevel: 1,
                maxLevel: 5,
              },
            ],
          },
          pointPools: {
            skills: {
              total: 3,
              spent: 0,
              remaining: 3,
            },
          },
          validation: {
            2: {
              valid: false,
              touched: true,
              errors: ['Select at least one skill'],
            },
          },
        }}
        onUpdate={onUpdate}
        onValidation={onValidation}
        worldConfig={worldConfig}
      />
    );

    expect(screen.queryByText('Select at least one skill')).not.toBeInTheDocument();
  });

  it('shows background errors from step 3', () => {
    render(
      <BackgroundStep
        data={{
          characterData: {
            worldId: 'world-1',
            name: 'Jamie Holt',
            description: '',
            portraitPlaceholder: '',
            attributes: [],
            skills: [],
            background: {
              history: '',
              personality: '',
              goals: [],
              motivation: '',
            },
          },
          validation: {
            3: {
              valid: false,
              touched: true,
              errors: ['Character history must be at least 50 characters'],
            },
          },
        }}
        onUpdate={onUpdate}
        onValidation={onValidation}
        worldConfig={worldConfig}
      />
    );

    expect(
      screen.getByText('Character history must be at least 50 characters')
    ).toBeInTheDocument();
  });
});
