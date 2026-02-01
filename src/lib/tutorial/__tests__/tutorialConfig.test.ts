import { getTourOptions } from '@/lib/tutorial/tutorialConfig';

describe('tutorialConfig', () => {
  it('uses vertical fallback placements by default', () => {
    const options = getTourOptions('characterCreationWizard');

    expect(options.floaterProps?.modifiers?.flip?.fallbackPlacements).toEqual(['bottom', 'top']);
  });
});
