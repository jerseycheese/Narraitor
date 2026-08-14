/**
 * @jest-environment node
 *
 * Unit tests for the skill trigger-eval scorer's pure maths. Fixture-based and
 * deterministic - no fs, no spawn, no model calls. The point is to prove that
 * precision, recall and the confusion matrix are computed correctly, because a
 * scorer that reports plausible-looking wrong numbers is worse than none.
 */

import { buildCases, scoreRouting, formatReport, kindFor, goldFor } from '../trigger-eval-lib.cjs';

const fixtures = [
  {
    skill: 'skill-a',
    entries: [
      { query: 'a positive', should_trigger: true, expected_skill: 'skill-a' },
      { query: 'a second positive', should_trigger: true, expected_skill: 'skill-a' },
      { query: 'belongs to b', should_trigger: false, expected_skill: 'skill-b' },
      { query: 'nothing should fire', should_trigger: false, expected_skill: null },
    ],
  },
  {
    skill: 'skill-b',
    entries: [
      { query: 'b positive', should_trigger: true, expected_skill: 'skill-b' },
      { query: 'belongs to a', should_trigger: false, expected_skill: 'skill-a' },
    ],
  },
];

describe('goldFor and kindFor', () => {
  it('reads a null expected_skill as the no-skill label', () => {
    expect(goldFor({ expected_skill: null })).toBe('none');
    expect(goldFor({ expected_skill: 'skill-a' })).toBe('skill-a');
  });

  it('classifies the three fixture shapes', () => {
    expect(kindFor({ should_trigger: true, expected_skill: 'skill-a' })).toBe('positive');
    expect(kindFor({ should_trigger: false, expected_skill: 'skill-b' })).toBe('near-miss');
    expect(kindFor({ should_trigger: false, expected_skill: null })).toBe('null');
  });
});

describe('buildCases', () => {
  it('flattens every fixture file into one case list', () => {
    const { cases, warnings } = buildCases(fixtures);
    expect(cases).toHaveLength(6);
    expect(warnings).toEqual([]);
    expect(cases.find((c) => c.query === 'belongs to b')).toMatchObject({
      gold: 'skill-b',
      kind: 'near-miss',
    });
  });

  it('collapses a query shared by two files and keeps the positive label', () => {
    const { cases, warnings } = buildCases([
      { skill: 'skill-a', entries: [{ query: 'shared', should_trigger: true, expected_skill: 'skill-a' }] },
      { skill: 'skill-b', entries: [{ query: 'shared', should_trigger: false, expected_skill: 'skill-a' }] },
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({ gold: 'skill-a', kind: 'positive', owners: ['skill-a', 'skill-b'] });
    expect(warnings).toEqual([]);
  });

  it('warns instead of guessing when two files disagree about one query', () => {
    const { warnings } = buildCases([
      { skill: 'skill-a', entries: [{ query: 'shared', should_trigger: true, expected_skill: 'skill-a' }] },
      { skill: 'skill-b', entries: [{ query: 'shared', should_trigger: true, expected_skill: 'skill-b' }] },
    ]);
    expect(warnings.some((w) => w.includes('conflicting gold labels'))).toBe(true);
  });
});

describe('scoreRouting', () => {
  const { cases } = buildCases(fixtures);

  // skill-a: 'a positive' hits, 'a second positive' misroutes to skill-b,
  // 'belongs to a' hits. skill-b: 'b positive' hits, 'belongs to b' stays
  // silent. The null case wrongly fires skill-a.
  const observations = [
    { query: 'a positive', observed: 'skill-a' },
    { query: 'a second positive', observed: 'skill-b' },
    { query: 'belongs to b', observed: 'none' },
    { query: 'nothing should fire', observed: 'skill-a' },
    { query: 'b positive', observed: 'skill-b' },
    { query: 'belongs to a', observed: 'skill-a' },
  ];

  const report = scoreRouting(cases, observations);

  it('reports the overall pass rate over scored cases', () => {
    expect(report.summary).toMatchObject({ cases: 6, scored: 6, correct: 3, unresolved: 0 });
    expect(report.summary.passRate).toBeCloseTo(0.5);
  });

  it('breaks the pass rate down by case kind', () => {
    expect(report.byKind.positive).toMatchObject({ total: 3, correct: 2 });
    expect(report.byKind['near-miss']).toMatchObject({ total: 2, correct: 1 });
    expect(report.byKind.null).toMatchObject({ total: 1, correct: 0 });
  });

  it('computes per-skill precision and recall', () => {
    const a = report.perSkill.find((row) => row.skill === 'skill-a');
    // skill-a fired 3 times: 2 correct ('a positive', 'belongs to a') and 1
    // wrong (the null case). It was the target 3 times and missed once.
    expect(a).toMatchObject({ support: 3, tp: 2, fp: 1, fn: 1 });
    expect(a.precision).toBeCloseTo(2 / 3);
    expect(a.recall).toBeCloseTo(2 / 3);

    const b = report.perSkill.find((row) => row.skill === 'skill-b');
    // skill-b fired twice: 1 correct, 1 stolen from skill-a. Target twice, missed once.
    expect(b).toMatchObject({ support: 2, tp: 1, fp: 1, fn: 1 });
    expect(b.precision).toBeCloseTo(0.5);
    expect(b.recall).toBeCloseTo(0.5);
  });

  it('leaves precision undefined rather than zero for a skill that never fired', () => {
    const quiet = scoreRouting(
      [{ query: 'q', gold: 'skill-c', kind: 'positive', owners: ['skill-c'] }],
      [{ query: 'q', observed: 'none' }]
    );
    const row = quiet.perSkill.find((r) => r.skill === 'skill-c');
    expect(row.precision).toBeNull();
    expect(row.recall).toBe(0);
  });

  it('builds a confusion matrix keyed expected -> observed', () => {
    const cell = (gold, observed) =>
      report.confusion.find((row) => row.gold === gold && row.observed === observed);
    expect(cell('skill-a', 'skill-b').count).toBe(1);
    expect(cell('skill-b', 'none').count).toBe(1);
    expect(cell('none', 'skill-a').count).toBe(1);
    expect(report.nearMissConfusion.every((row) => row.gold !== row.observed)).toBe(true);
  });

  it('lists a misroute as both a false negative and a false positive', () => {
    const misroute = { query: 'a second positive', gold: 'skill-a', observed: 'skill-b', kind: 'positive' };
    expect(report.falseNegatives).toContainEqual(misroute);
    expect(report.falsePositives).toContainEqual(misroute);
    // Silence is a false negative only; an unlabelled trigger is a false positive only.
    expect(report.falseNegatives.map((r) => r.query)).toContain('belongs to b');
    expect(report.falsePositives.map((r) => r.query)).not.toContain('belongs to b');
    expect(report.falsePositives.map((r) => r.query)).toContain('nothing should fire');
    expect(report.falseNegatives.map((r) => r.query)).not.toContain('nothing should fire');
  });

  it('reports missing observations as unresolved rather than scoring them as misses', () => {
    const partial = scoreRouting(cases, observations.slice(0, 2));
    expect(partial.summary).toMatchObject({ scored: 2, unresolved: 4 });
    expect(partial.unresolvedQueries).toContain('b positive');
  });
});

// The failure this guards against: the router crashes, every case comes back
// looking like "no skill fired", and the harness prints a confident zero-recall
// table that reads as a description regression. A case the model was never
// asked about must not be scoreable as a miss.
describe('scoreRouting with errored cases', () => {
  const { cases } = buildCases(fixtures);

  it('excludes an errored case from scoring entirely', () => {
    const report = scoreRouting(
      cases,
      [
        { query: 'a positive', observed: 'skill-a' },
        { query: 'a second positive', observed: 'skill-a' },
        { query: 'belongs to b', observed: 'skill-b' },
        { query: 'nothing should fire', observed: 'none' },
        { query: 'b positive', observed: 'skill-b' },
      ],
      [{ query: 'belongs to a', reason: 'could not run claude: spawn claude ENOENT' }]
    );

    expect(report.summary).toMatchObject({ cases: 6, scored: 5, correct: 5, errored: 1, unresolved: 0 });
    expect(report.summary.passRate).toBe(1);

    // The errored case was a skill-a target. It must not show up as a miss.
    const a = report.perSkill.find((row) => row.skill === 'skill-a');
    expect(a).toMatchObject({ support: 2, tp: 2, fn: 0 });
    expect(a.recall).toBe(1);
    expect(report.falseNegatives).toEqual([]);
    expect(report.unresolvedQueries).not.toContain('belongs to a');
    expect(report.erroredCases).toEqual([
      {
        query: 'belongs to a',
        gold: 'skill-a',
        kind: 'near-miss',
        reason: 'could not run claude: spawn claude ENOENT',
      },
    ]);
  });

  it('scores nothing at all when every case errored', () => {
    const report = scoreRouting(
      cases,
      [],
      cases.map((c) => ({ query: c.query, reason: 'claude exited 1: not authenticated' }))
    );
    expect(report.summary).toMatchObject({ scored: 0, correct: 0, errored: 6, unresolved: 0 });
    expect(report.summary.passRate).toBeNull();
    expect(report.perSkill).toEqual([]);
    expect(report.falseNegatives).toEqual([]);
    expect(report.falsePositives).toEqual([]);
  });

  it('says plainly in the report that a fully errored run measured nothing', () => {
    const report = scoreRouting(cases, [], cases.map((c) => ({ query: c.query, reason: 'boom' })));
    const text = formatReport(report, {});
    expect(text).toContain('NO CASE WAS SCORED');
    expect(text).toContain('WARNING: the router could not be reached');
    expect(text).toContain('Errored cases (router never answered, excluded from all scoring)');
    expect(text).toContain('cause: boom');
  });
});
