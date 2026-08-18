// src/lib/ai/__tests__/worldThreadExtraction.test.ts

import {
  buildWorldThreadPromptSection,
  parseWorldThreadExtraction,
} from '../worldThreadExtraction';
import type { WorldThread } from '@/types/worldThread.types';

const openThread: WorldThread = {
  id: 'thread-abc',
  sessionId: 'session-1',
  worldId: 'world-1',
  kind: 'deadline',
  summary: 'The council vote is in six weeks',
  openedAtTurn: 1,
  lastAdvancedAtTurn: 4,
  dueByTurn: 30,
  status: 'open',
  notes: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildWorldThreadPromptSection', () => {
  it('renders the marker, the thread line and the current turn', () => {
    const section = buildWorldThreadPromptSection({ openThreads: [openThread], currentTurn: 7 });

    expect(section).toContain('WORLD CLOCK LEDGER');
    expect(section).toContain('current turn 7');
    expect(section).toContain(
      '- [thread-abc] (deadline, opened turn 1, last moved turn 4, due turn 30) The council vote is in six weeks'
    );
    expect(section).toContain('"worldThreads"');
    expect(section).not.toContain('SEEDING');
  });

  it('asks for a named state change per advance, refuses restatement, and gives the turn scale', () => {
    const section = buildWorldThreadPromptSection({ openThreads: [openThread], currentTurn: 7 });

    expect(section).toContain('ADVANCE an open thread only when the prose changes its state');
    expect(section).toContain('is NOT an advance');
    expect(section).toContain('`changed`');
    expect(section).toContain("'dropped' only when the story has made it impossible or irrelevant");
    expect(section).toContain("'six weeks' about 30");
    expect(section).toContain('Never earlier than two turns from now');
  });

  it('files offstage threats as event-shaped threads and makes resolution name the outcome', () => {
    const section = buildWorldThreadPromptSection({
      openThreads: [openThread],
      currentTurn: 7,
      segmentSignals: { majorEvent: 'A new thudding sound erupts from the boathouse' },
      seed: { activeGoals: [] },
    });

    expect(section).toContain('An offstage threat the prose introduces');
    expect(section).toContain('is a thread');
    expect(section).toContain('the event that will land, not a standing state');
    expect(section).toContain('major event the player did not cause');
    expect(section).toContain('`resolution` names the outcome');
    expect(section).toContain('is an ADVANCE, not a resolution');
    expect(section).toContain('phrased as the event that will land');
  });

  it('marks overdue threads and the DUE NOW thread, and asks for a match under covers before opening', () => {
    const overdue: WorldThread = { ...openThread, id: 'thread-late', dueByTurn: 3, summary: 'Those owed favors come to collect' };
    const section = buildWorldThreadPromptSection({
      openThreads: [openThread, overdue],
      currentTurn: 9,
      dueNowThreadId: 'thread-late',
    });

    expect(section).toContain(
      '- [thread-late] (deadline, opened turn 1, last moved turn 4, due turn 3, OVERDUE by 6 turns, DUE NOW: this segment was asked to land it) Those owed favors come to collect'
    );
    expect(section).toContain(
      '- [thread-abc] (deadline, opened turn 1, last moved turn 4, due turn 30) The council vote is in six weeks'
    );
    expect(section).toContain('`covers`');
    expect(section).toContain('the DUE NOW thread first');
    expect(section).not.toContain('OVERDUE by 0');
  });

  it('lists only the observable changes that are present', () => {
    const section = buildWorldThreadPromptSection({
      openThreads: [],
      currentTurn: 2,
      segmentSignals: { location: 'The docks', itemsLost: ['lantern'] },
    });

    expect(section).toContain('Observable changes this turn: location: The docks; items lost: lantern');
    expect(section).not.toContain('items acquired');

    const empty = buildWorldThreadPromptSection({ openThreads: [], currentTurn: 2, segmentSignals: {} });
    expect(empty).toContain('Observable changes this turn: none recorded');
  });

  it('adds the seeding block with the seed material when seed is present', () => {
    const section = buildWorldThreadPromptSection({
      openThreads: [],
      currentTurn: 1,
      seed: {
        worldDescription: 'A port city under a failing regent',
        toneInstructions: 'Slow-burn political dread',
        activeGoals: ['Find the missing ledger'],
      },
    });

    expect(section).toContain('SEEDING');
    expect(section).toContain("This session's ledger is empty");
    expect(section).toContain('World description: A port city under a failing regent');
    expect(section).toContain('Tone instructions: Slow-burn political dread');
    expect(section).toContain('- Find the missing ledger');
  });
});

describe('parseWorldThreadExtraction', () => {
  it('returns undefined when the block is absent or not an object', () => {
    expect(parseWorldThreadExtraction(undefined)).toBeUndefined();
    expect(parseWorldThreadExtraction(null)).toBeUndefined();
    expect(parseWorldThreadExtraction('nope')).toBeUndefined();
    expect(parseWorldThreadExtraction([])).toBeUndefined();
  });

  it('keeps allowlisted kinds and outcomes, coerces dueByTurn, drops junk', () => {
    const result = parseWorldThreadExtraction({
      opened: [
        { kind: 'deadline', summary: '  The vote  ', dueByTurn: '30' },
        { kind: 'weather', summary: 'Not a kind' },
        { kind: 'actor', summary: '' },
        { kind: 'consequence', summary: 'Guards remember your face', dueByTurn: 'soon' },
        { kind: 'actor', summary: 'Henderson comes for the roof loan', dueByTurn: 11, covers: ' thread-late ' },
        { kind: 'actor', summary: 'A cousin writes', covers: null },
        { kind: 'actor', summary: 'A stranger writes', covers: 'none' },
        'junk',
      ],
      advanced: [
        { id: 'thread-1', changed: ' Thorne is now in the room ' },
        { id: 'thread-6', note: 'legacy note, no changed clause' },
        { id: 'thread-7', changed: '   ' },
        { id: '' },
        { changed: 'no id' },
        42,
      ],
      resolved: [
        { id: 'thread-2', resolution: 'Paid off', outcome: 'resolved' },
        { id: 'thread-3', resolution: 'Moot now', outcome: 'dropped' },
        { id: 'thread-4', resolution: 'Bad outcome', outcome: 'exploded' },
        { id: 'thread-5', outcome: 'resolved' },
      ],
    });

    expect(result).toEqual({
      opened: [
        { kind: 'deadline', summary: 'The vote', dueByTurn: 30 },
        { kind: 'consequence', summary: 'Guards remember your face' },
        { kind: 'actor', summary: 'Henderson comes for the roof loan', dueByTurn: 11, covers: 'thread-late' },
        { kind: 'actor', summary: 'A cousin writes' },
        { kind: 'actor', summary: 'A stranger writes' },
      ],
      advanced: [{ id: 'thread-1', changed: 'Thorne is now in the room' }],
      resolved: [
        { id: 'thread-2', resolution: 'Paid off', outcome: 'resolved' },
        { id: 'thread-3', resolution: 'Moot now', outcome: 'dropped' },
      ],
    });
  });

  it('never throws on malformed shapes', () => {
    expect(parseWorldThreadExtraction({ opened: 'x', advanced: null, resolved: 3 })).toEqual({
      opened: [],
      advanced: [],
      resolved: [],
    });
  });
});
