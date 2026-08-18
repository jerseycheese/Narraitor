import { parseNarrativeResponse } from '../narrativeGenerator.response.parse';

describe('parseNarrativeResponse debris guard', () => {
  it('throws when the response is a bare opening brace', () => {
    expect(() => parseNarrativeResponse({ content: '{' }, 'scene')).toThrow(
      'Service error: malformed API response'
    );
  });

  it('throws when the response is truncated mid-content', () => {
    expect(() =>
      parseNarrativeResponse({ content: '{"content": "The door' }, 'scene')
    ).toThrow('Service error: malformed API response');
  });

  it('still returns prose from a well-formed JSON response', () => {
    const parsed = parseNarrativeResponse(
      {
        content:
          '{"content":"The door groans open on a room that has not been aired in years.","type":"scene"}',
      },
      'scene'
    );

    expect(parsed.actualContent).toBe(
      'The door groans open on a room that has not been aired in years.'
    );
  });
});
