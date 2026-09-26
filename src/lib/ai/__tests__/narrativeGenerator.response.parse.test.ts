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

  it('reads a flattened dump the model wrapped in a json fence', () => {
    const raw =
      '```json\nmetadata.characterIds: [] metadata.mood: tense content: "Panic claws at your throat as the shadow lunges forward." type: action\n```';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'Panic claws at your throat as the shadow lunges forward.'
    );
    expect(parsed.segmentType).toBe('action');
  });

  it('reads a flattened dump the model wrapped in braces', () => {
    const raw =
      '{ metadata.mood: tense content: "Panic claws at your throat as the shadow lunges forward." type: action }';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'Panic claws at your throat as the shadow lunges forward.'
    );
  });

  it('stops cutting at the closing quote of content instead of sweeping trailing metadata into prose', () => {
    const raw =
      'content: "Panic claws at your throat as the shadow lunges forward. You have to move.", "type": "action", "metadata": {"characterIds": [], "itemsLost": [{"name": "pocketknife", "lossReason": "stolen"}], "mood": "tense, desperate", "location": "Camp Crystal Lake woods", "tags": ["combat", "escape", "darkness"], "majorEvent": "Player jabbed the creature in its eye and broke free of its grip"}';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'Panic claws at your throat as the shadow lunges forward. You have to move.'
    );
    expect(parsed.segmentType).toBe('action');
    expect(parsed.actualContent).not.toContain('metadata');
    expect(parsed.actualContent).not.toContain('majorEvent');
  });

  it('handles escaped quotes inside prose without cutting early', () => {
    const raw =
      'content: "She whispered, \\"Run!\\", then paused. You have to move.", "type": "action", "metadata": {"mood": "tense"}';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'She whispered, "Run!", then paused. You have to move.'
    );
    expect(parsed.segmentType).toBe('action');
  });

  it('recovers content cleanly when JSON has raw newlines in a quoted-key response', () => {
    const raw =
      '{"content": "The thing lunges.\nIts grip tightens. You have to move.", "type": "action", "metadata": {"mood": "tense, desperate", "majorEvent": "Player jabbed the creature in its eye and broke free of its grip"}}';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'The thing lunges.\nIts grip tightens. You have to move.'
    );
    expect(parsed.segmentType).toBe('action');
    expect(parsed.actualContent).not.toContain('metadata');
    expect(parsed.actualContent).not.toContain('majorEvent');
  });

  it('recovers content cleanly when a fenced JSON response has raw newlines in content', () => {
    const raw =
      '```json\n{"content": "The thing lunges.\nIts grip tightens. You have to move.", "type": "action", "metadata": {"mood": "tense, desperate", "majorEvent": "Player jabbed the creature in its eye and broke free of its grip"}}\n```';
    const parsed = parseNarrativeResponse({ content: raw }, 'scene');

    expect(parsed.actualContent).toBe(
      'The thing lunges.\nIts grip tightens. You have to move.'
    );
    expect(parsed.segmentType).toBe('action');
    expect(parsed.actualContent).not.toContain('metadata');
    expect(parsed.actualContent).not.toContain('majorEvent');
  });
});
