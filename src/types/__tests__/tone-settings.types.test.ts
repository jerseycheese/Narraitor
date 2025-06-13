import { ToneSettings, ContentRating, NarrativeStyle, LanguageComplexity } from '../tone-settings.types';

describe('ToneSettings Types', () => {
  test('should define valid ContentRating values', () => {
    const validRatings: ContentRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
    
    validRatings.forEach(rating => {
      expect(typeof rating).toBe('string');
    });
  });

  test('should define valid NarrativeStyle values', () => {
    const validStyles: NarrativeStyle[] = [
      'serious', 'humorous', 'dramatic', 'lighthearted', 
      'mysterious', 'action-packed', 'contemplative', 'epic'
    ];
    
    validStyles.forEach(style => {
      expect(typeof style).toBe('string');
    });
  });

  test('should define valid LanguageComplexity values', () => {
    const validComplexities: LanguageComplexity[] = [
      'simple', 'moderate', 'advanced', 'literary'
    ];
    
    validComplexities.forEach(complexity => {
      expect(typeof complexity).toBe('string');
    });
  });

  test('should create valid ToneSettings object', () => {
    const toneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate',
      customInstructions: 'Keep the tone professional but engaging'
    };

    expect(toneSettings.contentRating).toBe('PG');
    expect(toneSettings.narrativeStyle).toBe('serious');
    expect(toneSettings.languageComplexity).toBe('moderate');
    expect(toneSettings.customInstructions).toBe('Keep the tone professional but engaging');
  });

  test('should allow ToneSettings with minimal properties', () => {
    const minimalToneSettings: ToneSettings = {
      contentRating: 'G',
      narrativeStyle: 'lighthearted',
      languageComplexity: 'simple'
    };

    expect(minimalToneSettings.customInstructions).toBeUndefined();
    expect(minimalToneSettings.contentRating).toBe('G');
  });
});