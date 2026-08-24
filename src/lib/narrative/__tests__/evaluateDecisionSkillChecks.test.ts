import { evaluateDecisionSkillChecks } from '../evaluateDecisionSkillChecks';
import type { Character as StoreCharacter } from '@/state/characterStore';
import type { World, WorldSkill } from '@/types/world.types';
import type { DecisionOption } from '@/types/narrative.types';

const worldSkill = (id: string, name: string): WorldSkill =>
  ({ id, name, attributeIds: [] } as unknown as WorldSkill);

const buildWorld = (skills: WorldSkill[]): World =>
  ({ skills } as unknown as World);

const buildCharacter = (): StoreCharacter =>
  ({
    id: 'char-1',
    name: 'Hero',
    description: '',
    worldId: 'world-1',
    attributes: [],
    skills: [
      {
        id: 'cs-1',
        characterId: 'char-1',
        worldSkillId: 'skill-1',
        name: 'Stealth',
        level: 3,
      },
    ],
    background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
    status: { conditions: [] },
    inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  } as unknown as StoreCharacter);

const optionWithSkill = (): DecisionOption => ({
  id: 'opt-1',
  text: 'Sneak past',
  requirements: [{ type: 'skill', targetId: 'skill-1', operator: 'gte', value: 1 }],
});

describe('evaluateDecisionSkillChecks', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty results and notifies with no rolls when the option has no requirements', () => {
    const onSkillCheckPerformed = jest.fn();
    const addToast = jest.fn();

    const result = evaluateDecisionSkillChecks({
      selectedOption: { id: 'opt-0', text: 'Wait' },
      character: buildCharacter(),
      world: buildWorld([worldSkill('skill-1', 'Stealth')]),
      toast: { addToast },
      onSkillCheckPerformed,
    });

    expect(result.rollResults).toHaveLength(0);
    expect(result.skillCheckTags).toEqual([]);
    expect(result.decisionOutcome).toBeUndefined();
    expect(onSkillCheckPerformed).toHaveBeenCalledWith([]);
    expect(addToast).not.toHaveBeenCalled();
  });

  it('skips evaluation when character or world is missing', () => {
    const addToast = jest.fn();

    const result = evaluateDecisionSkillChecks({
      selectedOption: optionWithSkill(),
      character: undefined,
      world: buildWorld([]),
      toast: { addToast },
    });

    expect(result.rollResults).toHaveLength(0);
    expect(result.skillCheckTags).toEqual([]);
    expect(addToast).not.toHaveBeenCalled();
  });

  it('builds success tags + outcome and fires a success toast on a passing roll', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // d20 -> 11
    const addToast = jest.fn();

    const result = evaluateDecisionSkillChecks({
      selectedOption: optionWithSkill(),
      character: buildCharacter(),
      world: buildWorld([worldSkill('skill-1', 'Stealth')]),
      toast: { addToast },
    });

    expect(result.skillCheckTags).toEqual(['skill-success:skill-1', 'skill-roll:11']);
    expect(result.decisionOutcome).toBe('success');
    expect(result.rollResults).toHaveLength(1);
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast.mock.calls[0][0]).toMatchObject({ variant: 'success' });
  });

  it('builds critical-failure tags + outcome and fires an error toast on a natural 1', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // d20 -> 1
    const addToast = jest.fn();

    const result = evaluateDecisionSkillChecks({
      selectedOption: optionWithSkill(),
      character: buildCharacter(),
      world: buildWorld([worldSkill('skill-1', 'Stealth')]),
      toast: { addToast },
    });

    expect(result.skillCheckTags).toEqual(['skill-critical-failure:skill-1', 'skill-roll:1']);
    expect(result.decisionOutcome).toBe('critical-failure');
    expect(addToast.mock.calls[0][0]).toMatchObject({ variant: 'error' });
  });
});
