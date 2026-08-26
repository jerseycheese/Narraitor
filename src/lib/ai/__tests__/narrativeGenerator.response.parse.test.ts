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

  it('recovers prose from a flattened dotted-key dump', () => {
    const raw =
      'metadata.characterIds: [] metadata.speakerId: null metadata.location: "Ruins" metadata.mood: "grim" metadata.majorEvent: "The fall" content: "Panic claws at your throat as the shadow lunges forward. Your blade rises too late, and the iron edge finds its mark." type: action';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'Panic claws at your throat as the shadow lunges forward. Your blade rises too late, and the iron edge finds its mark.'
    );
  });

  it('takes the segment type from trailing unquoted type in a flattened dump', () => {
    const raw =
      'metadata.characterIds: [] content: "Panic claws at your throat as the shadow lunges forward." type: action';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.segmentType).toBe('action');
  });

  it('leaves ordinary prose containing colons untouched', () => {
    const prose = 'She read the label aloud: content: three grams of powder.';
    const parsed = parseNarrativeResponse({ content: prose }, 'scene');

    expect(parsed.actualContent).toBe(prose);
  });

  it('keeps the whole passage when malformed JSON holds a content marker in its prose', () => {
    const raw =
      '{"content":"She squinted at the terminal. content: "redacted" it said, and nothing else. Mira stepped back from the glow.","type":"scene"}';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'She squinted at the terminal. content: "redacted" it said, and nothing else. Mira stepped back from the glow.'
    );
  });

  it('keeps the whole passage when a fenced response holds a content marker in its prose', () => {
    const raw =
      '```json\n{"content":"The sign read content: "closed" and she turned away down the long wet street."}\n```';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'The sign read content: "closed" and she turned away down the long wet street.'
    );
  });
});
