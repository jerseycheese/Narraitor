import {
  describeContentRatingEnforcement,
  getContentRatingGuidance,
  parseContentRating,
} from '../contentRatingGuidance';

describe('parseContentRating', () => {
  it.each([
    ['G-RATED CONTENT GUIDELINES:\n- No violence', 'g'],
    ['PG-13 CONTENT GUIDELINES:\n- Moderate violence', 'pg-13'],
    ['NC-17 CONTENT GUIDELINES:\n- Mature themes', 'nc-17'],
    ['r-rated content guidelines:\n- Strong language', 'r'],
  ])('reads the rating out of %s', (prompt, expected) => {
    expect(parseContentRating(prompt)).toBe(expected);
  });

  it('returns null when the prompt carries no rating heading', () => {
    expect(parseContentRating('Generate a story about adventure.')).toBeNull();
  });

  it('returns null for a heading naming something that is not a rating', () => {
    expect(parseContentRating('SPICY-RATED CONTENT GUIDELINES:')).toBeNull();
  });
});

describe('getContentRatingGuidance', () => {
  it('escalates what is in scope as the rating loosens', () => {
    expect(getContentRatingGuidance('g')).toContain('all ages');
    expect(getContentRatingGuidance('nc-17')).toContain('no content restrictions');
  });

  it('falls back to a conservative default rather than to no guidance at all', () => {
    // Silence would read to the model as "anything goes".
    expect(getContentRatingGuidance(null)).toBe(getContentRatingGuidance('pg-13'));
  });
});

describe('describeContentRatingEnforcement', () => {
  it('tells the player a rating is only guidance where nothing enforces it', () => {
    const copy = describeContentRatingEnforcement(false);

    expect(copy).toContain('guidance');
    expect(copy).toContain('does not enforce');
  });

  it('does not oversell the native path either', () => {
    const copy = describeContentRatingEnforcement(true);

    expect(copy).toContain('safety-filter setting');
    expect(copy).toContain('no setting turns off');
  });
});
