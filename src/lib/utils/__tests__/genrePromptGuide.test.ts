import {
  getGenreStyleGuidance,
  getGenreFallbackImage,
  type ImageContext,
} from '../genrePromptGuide';

describe('genrePromptGuide', () => {
  describe('getGenreStyleGuidance', () => {
    describe('with known genre (fantasy)', () => {
      it('returns expected landscape style guidance', () => {
        expect(getGenreStyleGuidance('fantasy', 'landscape')).toBe(
          'Epic fantasy landscape with magical elements, mystical lighting, ancient architecture, floating islands or magical forests. Style: high fantasy art, detailed digital painting, dramatic lighting.'
        );
      });

      it('returns expected ending style guidance', () => {
        expect(getGenreStyleGuidance('fantasy', 'ending')).toBe(
          'Epic fantasy setting with magical elements, ancient architecture, mystical lighting. Style: high fantasy art, detailed digital painting, cinematic composition.'
        );
      });

      it('returns expected portrait style guidance', () => {
        expect(getGenreStyleGuidance('fantasy', 'portrait')).toBe(
          'Epic fantasy setting with magical elements. Style: high fantasy art, detailed digital painting.'
        );
      });
    });

    describe('with unknown genre (unknown-genre)', () => {
      it('returns default landscape style guidance', () => {
        expect(getGenreStyleGuidance('unknown-genre', 'landscape')).toBe(
          'Epic landscape with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition, professional concept art.'
        );
      });

      it('returns default ending style guidance', () => {
        expect(getGenreStyleGuidance('unknown-genre', 'ending')).toBe(
          'Epic setting with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition.'
        );
      });

      it('returns default portrait style guidance', () => {
        expect(getGenreStyleGuidance('unknown-genre', 'portrait')).toBe(
          'Epic setting with dramatic lighting. Style: high-quality digital art.'
        );
      });
    });

    it('defaults context to landscape when omitted', () => {
      expect(getGenreStyleGuidance('fantasy')).toBe(
        getGenreStyleGuidance('fantasy', 'landscape')
      );
    });

    it('handles all supported contexts systematically', () => {
      const contexts: ImageContext[] = ['landscape', 'ending', 'portrait'];
      for (const context of contexts) {
        expect(getGenreStyleGuidance('fantasy', context)).toBeTruthy();
        expect(getGenreStyleGuidance('unknown-genre', context)).toBeTruthy();
      }
    });
  });

  describe('getGenreFallbackImage', () => {
    const seed = 'test-seed-123';

    describe('with known genre (fantasy)', () => {
      it('returns the blur fallback image when no tone is specified', () => {
        expect(getGenreFallbackImage('fantasy', seed)).toBe(
          `https://picsum.photos/seed/${seed}/800/600?blur=1`
        );
      });

      it('returns tone-based fallback image when tone is specified', () => {
        expect(getGenreFallbackImage('fantasy', seed, 'triumphant')).toBe(
          `https://picsum.photos/seed/${seed}/800/600?sepia`
        );
      });
    });

    describe('with unknown genre (unknown-genre)', () => {
      it('returns the default fallback image when no tone is specified', () => {
        expect(getGenreFallbackImage('unknown-genre', seed)).toBe(
          `https://picsum.photos/seed/${seed}/800/600`
        );
      });

      it('returns tone-based fallback image when tone is specified', () => {
        expect(getGenreFallbackImage('unknown-genre', seed, 'mysterious')).toBe(
          `https://picsum.photos/seed/${seed}/800/600?grayscale&blur=2`
        );
      });
    });
  });
});
