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
  it('keeps a short closed content field when the rest of the JSON is malformed', () => {
    const parsed = parseNarrativeResponse(
      { content: '{"content":"You flee.","type": scene}' },
      'scene'
    );

    expect(parsed.actualContent).toBe('You flee.');
  });

  it('keeps a short closed content field when the object itself is cut off', () => {
    const parsed = parseNarrativeResponse(
      { content: '{"content":"You flee.","type":"sce' },
      'scene'
    );

    expect(parsed.actualContent).toBe('You flee.');
  });

});
