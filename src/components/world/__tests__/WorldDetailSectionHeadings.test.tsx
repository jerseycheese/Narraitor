/**
 * The attribute and skill lists used to route through SectionWrapper, which
 * put a second title class on the same h2 and left them rendering tiny and
 * uppercase beside their siblings. These assert the markup that keeps all the
 * world detail headings on one treatment.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorldAttributesList } from '@/components/world/WorldAttributesList';
import { WorldSkillsList } from '@/components/world/WorldSkillsList';
import { WorldAttribute, WorldSkill } from '@/types/world.types';

const attributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    worldId: 'world-1',
    name: 'Strength',
    description: 'Raw physical power.',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
  },
];

const skills: WorldSkill[] = [
  {
    id: 'skill-1',
    worldId: 'world-1',
    name: 'Lockpicking',
    description: 'Opening what should stay shut.',
    attributeIds: ['attr-1'],
    difficulty: 'medium',
    baseValue: 1,
    minValue: 1,
    maxValue: 5,
  },
];

describe('World detail section headings', () => {
  it('renders the attributes heading as a plain world detail section', () => {
    const { container } = render(
      <WorldAttributesList attributes={attributes} />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Attributes' })
    ).toBeInTheDocument();
    expect(
      container.querySelector('.world-detail-attributes')
    ).toHaveClass('world-detail-section');
    expect(
      container.querySelector('.component-section-wrapper')
    ).toBeNull();
  });

  it('renders the skills heading as a plain world detail section', () => {
    const { container } = render(
      <WorldSkillsList skills={skills} attributes={attributes} />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Skills' })
    ).toBeInTheDocument();
    expect(
      container.querySelector('.world-detail-skills')
    ).toHaveClass('world-detail-section');
    expect(
      container.querySelector('.component-section-wrapper')
    ).toBeNull();
  });

  it('renders nothing when there is no data to list', () => {
    const { container: emptyAttributes } = render(
      <WorldAttributesList attributes={[]} />
    );
    const { container: emptySkills } = render(
      <WorldSkillsList skills={[]} attributes={attributes} />
    );

    expect(emptyAttributes).toBeEmptyDOMElement();
    expect(emptySkills).toBeEmptyDOMElement();
  });
});
