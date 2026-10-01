import {
  parseNarrativeResponse,
  unescapeJsonString,
} from '../narrativeGenerator.response.parse';
import { isFeatureEnabled } from '@/lib/featureFlags';

jest.mock('@/lib/featureFlags', () => ({ isFeatureEnabled: jest.fn(() => false) }));

describe('parseNarrativeResponse debris guard', () => {
  it('keeps scene movement out of flag-off parsed metadata', () => {
    const response = { content: '{"content":"Guard enters.","metadata":{"characterIds":["npc-guard"],"sceneEntries":["npc-guard"],"sceneExits":[],"sceneTransition":{"to":"Old Mill"}}}' };
    const withoutMovement = { content: '{"content":"Guard enters.","metadata":{"characterIds":["npc-guard"]}}' };
    expect(parseNarrativeResponse(response, 'scene')).toEqual(parseNarrativeResponse(withoutMovement, 'scene'));
  });

  it('keeps only string scene movement IDs when the flag is on', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    try {
      const parsed = parseNarrativeResponse({
        content: '{"content":"Guard enters.","metadata":{"characterIds":["npc-guard"],"sceneEntries":["npc-guard","npc-unknown",5,null,{}],"sceneExits":"npc-guard"}}',
      }, 'scene');
      expect(parsed.extractedMetadata.sceneEntries).toEqual(['npc-guard']);
      expect(parsed.extractedMetadata.sceneExits).toEqual([]);
    } finally {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    }
  });

  it('accepts an exit for an NPC already in the current scene', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    try {
      const parsed = parseNarrativeResponse({
        content: '{"content":"Guard steps outside.","metadata":{"characterIds":[],"sceneExits":["npc-guard","npc-unknown"]}}',
      }, 'scene', ['npc-guard']);
      expect(parsed.extractedMetadata.sceneExits).toEqual(['npc-guard']);
    } finally {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    }
  });

  it('parses a named scene transition and ignores invalid targets', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    try {
      const valid = parseNarrativeResponse({
        content: '{"content":"You enter the mill.","metadata":{"sceneTransition":{"to":" Old Mill "}}}',
      }, 'scene');
      const invalid = parseNarrativeResponse({
        content: '{"content":"You wait.","metadata":{"sceneTransition":{"to":17}}}',
      }, 'scene');
      expect(valid.extractedMetadata.sceneTransition).toEqual({ to: 'Old Mill' });
      expect(invalid.extractedMetadata.sceneTransition).toBeUndefined();
    } finally {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    }
  });

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

describe('unescapeJsonString', () => {
  it('unescapes escaped quotes', () => {
    expect(unescapeJsonString('She whispered, \\"Run!\\"')).toBe(
      'She whispered, "Run!"'
    );
  });

  it('unescapes escaped newlines', () => {
    expect(unescapeJsonString('Line one\\nLine two')).toBe('Line one\nLine two');
  });

  it('leaves raw literal newlines untouched', () => {
    expect(unescapeJsonString('Line one\nLine two')).toBe('Line one\nLine two');
  });

  it('unescapes escaped backslashes', () => {
    expect(unescapeJsonString('path\\\\to\\\\file')).toBe('path\\to\\file');
  });

  it('does not corrupt an escaped backslash before n into a newline', () => {
    // In raw string: \\\\n (an escaped backslash followed by the character n)
    // Should decode to a single backslash followed by n: \n, NOT a newline character
    expect(unescapeJsonString('pattern \\\\n test')).toBe('pattern \\n test');
  });

  it('decodes escaped backslash followed by escaped newline correctly', () => {
    // In raw string: \\\\\\n (an escaped backslash followed by an escaped newline)
    // Should decode to a single backslash followed by an actual newline
    expect(unescapeJsonString('line one\\\\\\nline two')).toBe(
      'line one\\\nline two'
    );
  });

  it('handles carriage returns and tabs', () => {
    expect(unescapeJsonString('col1\\tcol2\\r\\ncol3')).toBe(
      'col1\tcol2\r\ncol3'
    );
  });
});
