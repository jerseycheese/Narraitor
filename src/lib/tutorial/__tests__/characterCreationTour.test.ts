import { characterCreationTour } from '../characterCreationTour';

describe('characterCreationTour', () => {
  it('has valid placement values', () => {
    const validPlacements = ['top', 'bottom', 'left', 'right', 'center', 'auto'];
    characterCreationTour.forEach((step) => {
      expect(validPlacements).toContain(step.placement);
    });
  });

  it('includes character creation steps', () => {
    expect(characterCreationTour.length).toBe(9);
    expect(characterCreationTour[0].target).toBe('[data-tutorial="quickstart-archetypes"]');
    expect(characterCreationTour[1].target).toBe('[data-tutorial="quickstart-random"]');
    expect(characterCreationTour[2].target).toBe('[data-tutorial="quickstart-custom"]');
    expect(characterCreationTour[3].target).toBe('[data-tutorial="template-selector"]');
    expect(characterCreationTour[4].target).toBe('[data-tutorial="basic-info"]');
    expect(characterCreationTour[5].target).toBe('[data-tutorial="attribute-allocation"]');
    expect(characterCreationTour[6].target).toBe('[data-tutorial="skill-selection"]');
    expect(characterCreationTour[7].target).toBe('[data-tutorial="background-editor"]');
    expect(characterCreationTour[8].target).toBe('[data-tutorial="portrait-generator"]');
  });

  it('uses valid CSS selectors for all targets', () => {
    characterCreationTour.forEach((step) => {
      if (typeof step.target === 'string') {
        expect(() => document.querySelector(step.target as string)).not.toThrow();
      }
    });
  });
});
