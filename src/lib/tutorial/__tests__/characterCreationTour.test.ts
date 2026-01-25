import { characterCreationTour } from '../characterCreationTour';

describe('characterCreationTour', () => {
  it('positions every tooltip above its target', () => {
    characterCreationTour.forEach((step) => {
      expect(step.placement).toBe('top');
    });
  });

  it('includes quickstart steps', () => {
    expect(characterCreationTour.length).toBe(9);
    expect(characterCreationTour[0].target).toBe('[data-tutorial="quickstart-archetypes"]');
  });
});
