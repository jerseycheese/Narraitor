import { inferSegmentType } from './segmentTypeInference';

describe('inferSegmentType', () => {
  describe('dialogue detection', () => {
    it('should identify dialogue from quoted speech', () => {
      const content = '"Hello there," she said with a smile.';
      expect(inferSegmentType(content)).toBe('dialogue');
    });

    it('should identify dialogue with dialogue verbs', () => {
      const content = 'The merchant replied, explaining the situation.';
      expect(inferSegmentType(content)).toBe('dialogue');
    });

    it('should identify dialogue with speaking patterns', () => {
      const content = 'You ask about the ancient ruins.';
      expect(inferSegmentType(content)).toBe('dialogue');
    });
  });

  describe('action detection', () => {
    it('should identify combat action', () => {
      const content = 'You strike at the creature with your sword, hitting it squarely.';
      expect(inferSegmentType(content)).toBe('action');
    });

    it('should identify movement action', () => {
      const content = 'You run through the forest, dodging branches.';
      expect(inferSegmentType(content)).toBe('action');
    });

    it('should identify physical activity', () => {
      const content = 'You climb the steep cliff face carefully.';
      expect(inferSegmentType(content)).toBe('action');
    });
  });

  describe('transition detection', () => {
    it('should identify time passage', () => {
      const content = 'Several hours later, you arrive at the village.';
      expect(inferSegmentType(content)).toBe('transition');
    });

    it('should identify location changes', () => {
      const content = 'You travel to the northern mountains.';
      expect(inferSegmentType(content)).toBe('transition');
    });

    it('should identify scene transitions', () => {
      const content = 'Meanwhile, back at the tavern...';
      expect(inferSegmentType(content)).toBe('transition');
    });
  });

  describe('scene detection (default)', () => {
    it('should default to scene for descriptive content', () => {
      const content = 'The ancient temple looms before you, its stone walls covered in moss.';
      expect(inferSegmentType(content)).toBe('scene');
    });

    it('should default to scene for atmosphere', () => {
      const content = 'A cold wind blows through the canyon.';
      expect(inferSegmentType(content)).toBe('scene');
    });

    it('should default to scene for empty content', () => {
      expect(inferSegmentType('')).toBe('scene');
    });
  });

  describe('priority handling', () => {
    it('should prioritize dialogue over other types', () => {
      const content = '"I need to move quickly," you say as you start running.';
      expect(inferSegmentType(content)).toBe('dialogue');
    });

    it('should detect action when no dialogue present', () => {
      const content = 'You strike and then flee from the scene.';
      expect(inferSegmentType(content)).toBe('action');
    });
  });
});
