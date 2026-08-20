import {
  stripNonNarrativeBlocks,
  dedupeAgainstRecent,
  applyNarrativeContentGate,
} from '../narrativeContentGate';

const PROSE = 'Rain slicked the cobbles as Mira pushed the gate open.';
const MORE_PROSE = 'A lantern guttered somewhere behind the wall, and went out.';

describe('stripNonNarrativeBlocks', () => {
  it('leaves ordinary prose alone, including emphasis inside a sentence', () => {
    const content = `${PROSE}\n\nShe was **certain** now, and said so aloud.`;
    expect(stripNonNarrativeBlocks(content)).toBe(content);
  });

  it('removes a details/summary wrapper and everything inside it', () => {
    const content = [
      PROSE,
      '',
      '<details open><summary>World Clock</summary>',
      'Turn 8. Turns since the world last moved on its own: 2.',
      '- (consequence owed, open 8 turns) Albright will call in the debt.',
      '</details>',
      '',
      MORE_PROSE,
    ].join('\n');

    const result = stripNonNarrativeBlocks(content);

    expect(result).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('removes bare HTML container tags without eating the prose between them', () => {
    const content = `<div class="scene">${PROSE}</div>`;

    expect(stripNonNarrativeBlocks(content)).toBe(PROSE);
  });

  it('removes a bold status heading and the list of states under it', () => {
    const content = [
      PROSE,
      '',
      '**Player Status:**',
      '- Wounded (left arm)',
      '- Exhausted',
      '',
      '**Outstanding Goals:**',
      '- Reach the Harrowgate before dusk',
      '- Find out who paid Albright',
      '',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('removes a bookkeeping heading whose body is written as prose', () => {
    const content = [
      PROSE,
      '',
      "**World Clock Update:** Albright's call has acted. It has taken two turns.",
      '',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('removes a metadata JSON block', () => {
    const content = [
      PROSE,
      '',
      'metadata: {"location": "Harrowgate", "mood": "tense"}',
      '',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('removes a fenced JSON block', () => {
    const content = [
      PROSE,
      '',
      '```json',
      '{"tags": ["tense"]}',
      '```',
      '',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('keeps a fenced block that holds prose rather than machine data', () => {
    const inscription = [
      '```',
      'HERE LIES THE HARROWGATE WATCH',
      'WHO KEPT THE ROAD UNTIL THE ROAD ENDED',
      '```',
    ].join('\n');
    const content = [PROSE, '', inscription, '', MORE_PROSE].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(content);
  });

  it('removes a fenced block explicitly labelled metadata', () => {
    const content = [
      PROSE,
      '',
      '```metadata',
      'location: Harrowgate',
      '```',
      '',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n\n${MORE_PROSE}`);
  });

  it('removes loose ledger and clock scaffolding lines', () => {
    const content = [
      PROSE,
      'Turn 12. Turns since the world last moved on its own: 0.',
      '- (off-screen actor, open 3 turns) The magistrate rides north. [OVERDUE - this must come due now]',
      MORE_PROSE,
    ].join('\n');

    expect(stripNonNarrativeBlocks(content)).toBe(`${PROSE}\n${MORE_PROSE}`);
  });
});

describe('dedupeAgainstRecent', () => {
  const shown =
    'The bell over the door rang twice before Mira realised nobody had opened it. She stood very still, counting the seconds against the sound of her own breathing, and found that the count would not settle.';
  const alsoShown =
    'Albright had left the ledger open on the counter, its last line still wet, as though he meant for it to be read by whoever came next.';

  it('drops a paragraph repeated verbatim from a recent segment', () => {
    const content = `${shown}\n\nOutside, the rain had stopped and the street smelled of hot iron.`;

    expect(dedupeAgainstRecent(content, [shown, alsoShown])).toBe(
      'Outside, the rain had stopped and the street smelled of hot iron.'
    );
  });

  it('drops a paragraph that is a lightly reworded splice of a recent one', () => {
    const reworded =
      'The bell over the door rang twice before Mira realised that nobody had opened it. She stood very still, counting the seconds against the sound of her own breathing, and found the count would not settle.';
    const content = `${reworded}\n\nOutside, the rain had stopped.`;

    expect(dedupeAgainstRecent(content, [shown])).toBe(
      'Outside, the rain had stopped.'
    );
  });

  it('keeps genuinely new prose about the same people and places', () => {
    const content =
      'Mira closed the ledger, took Albright by the sleeve, and walked him out into a street that had emptied while they argued.';

    expect(dedupeAgainstRecent(content, [shown, alsoShown])).toBe(content);
  });

  it('keeps the passage when every paragraph is a repeat, rather than emitting nothing', () => {
    const content = `${shown}\n\n${alsoShown}`;

    expect(dedupeAgainstRecent(content, [shown, alsoShown])).toBe(content);
  });

  it('only looks back over a bounded window of recent segments', () => {
    // Deliberately unlike one another, so the window is the only thing under test.
    const since = [
      'A cart went past the window carrying turnips under a wet tarpaulin, and the driver did not look up once.',
      'Somewhere north of the square a dog began barking at nothing, and kept it up for a quarter of an hour.',
      'The magistrate signed three warrants that afternoon and burned a fourth without reading it twice.',
      'Snow came early that year, thin and grey, and settled in the gutters where it turned immediately to slush.',
    ];
    const content = `${shown}\n\nOutside, the rain had stopped.`;

    // shown is pushed out of the window by the four segments since, so it survives.
    expect(dedupeAgainstRecent(content, [shown, ...since])).toBe(content);
    // Inside the window, the same paragraph is trimmed.
    expect(dedupeAgainstRecent(content, [...since.slice(1), shown])).toBe(
      'Outside, the rain had stopped.'
    );
  });
});

describe('applyNarrativeContentGate', () => {
  it('strips bookkeeping and dedupes in one pass', () => {
    const shown =
      'The bell over the door rang twice before Mira realised nobody had opened it, and she stood very still against the sound of her own breathing.';
    const content = [
      shown,
      '',
      '<details open><summary>World Clock</summary>',
      '- (deadline, open 4 turns) The magistrate arrives at dusk.',
      '</details>',
      '',
      'She went to the window instead, and did not like what she saw there.',
    ].join('\n');

    expect(applyNarrativeContentGate(content, [shown])).toBe(
      'She went to the window instead, and did not like what she saw there.'
    );
  });

  it('never returns an empty passage', () => {
    const content = '**Player Status:**\n- Wounded';

    expect(applyNarrativeContentGate(content, []).length).toBeGreaterThan(0);
  });
});
