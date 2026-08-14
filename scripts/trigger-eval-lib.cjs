// Pure scoring logic for the skill trigger-eval harness.
//
// No fs, no spawn, no process: every function takes plain data and returns a
// value, so the precision/recall and confusion-matrix maths are unit-testable
// against small fixtures. The CLI wrapper (scripts/run-trigger-eval.cjs) does
// the file I/O and drives the router that produces the observations.
//
// Mirrors the ds-canon-lib.cjs / verify-ds-canon.cjs split.

// The label used when the correct answer is "no skill should fire", and when
// the router observed no skill firing. Kept out of the per-skill precision and
// recall tables so a silent turn never inflates a skill's numbers.
const NO_SKILL = 'none';

// A fixture entry's ground-truth routing target. `expected_skill: null` is the
// library's encoding for a null case: nothing should fire.
function goldFor(entry) {
  return entry.expected_skill || NO_SKILL;
}

// Which of the three fixture shapes an entry is. The near-miss cases are the
// ones worth a confusion matrix: they name the sibling that should win instead.
function kindFor(entry) {
  if (entry.should_trigger) return 'positive';
  return entry.expected_skill ? 'near-miss' : 'null';
}

// Flatten per-skill fixture files into one deduplicated case list.
//
// `fixtures` is [{ skill, entries }]. A query may legitimately appear in two
// skills' files (once as a positive, once as that skill's near-miss); those
// agree on the gold label and collapse to one case. Disagreements are surfaced
// as warnings rather than silently resolved. A contradictory pair of labels is
// a fixture bug, and scoring it either way would report a fake number.
function buildCases(fixtures) {
  const byQuery = new Map();
  const warnings = [];

  for (const { skill, entries } of fixtures) {
    for (const entry of entries) {
      const gold = goldFor(entry);
      const kind = kindFor(entry);

      if (entry.should_trigger && entry.expected_skill !== skill) {
        warnings.push(
          `${skill}: should_trigger is true but expected_skill is ` +
            `${entry.expected_skill || 'null'} - "${entry.query}"`
        );
      }
      if (!entry.should_trigger && entry.expected_skill === skill) {
        warnings.push(
          `${skill}: should_trigger is false but expected_skill is the owning skill - "${entry.query}"`
        );
      }

      const existing = byQuery.get(entry.query);
      if (!existing) {
        byQuery.set(entry.query, { query: entry.query, gold, kind, owners: [skill] });
        continue;
      }
      existing.owners.push(skill);
      if (existing.gold !== gold) {
        warnings.push(
          `conflicting gold labels for one query (${existing.gold} vs ${gold}) - "${entry.query}"`
        );
      }
      // A query that is a positive anywhere is a positive: the near-miss copy
      // in a sibling's file describes the same routing decision.
      if (kind === 'positive') existing.kind = 'positive';
    }
  }

  return { cases: [...byQuery.values()], warnings };
}

function ratio(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator;
}

// Score routed observations against the gold labels.
//
// `observations` is [{ query, observed }] (or a Map of query -> observed).
// `errors` is [{ query, reason }] for queries where the router could not be
// asked at all.
//
// A case has three outcomes, not two. A skill fired, nothing fired, or the
// question never reached the model. That third one is the important
// distinction: "could not ask" is not "the model chose wrong", and collapsing
// them lets a broken environment print a confident zero-recall table. Errored
// cases are excluded from precision, recall and the pass rate entirely, and
// reported on their own with the underlying cause.
function scoreRouting(cases, observations, errors = []) {
  const observed = observations instanceof Map
    ? observations
    : new Map(observations.map((o) => [o.query, o.observed]));
  const errored = errors instanceof Map
    ? errors
    : new Map(errors.map((e) => [e.query, e.reason]));

  const kinds = ['positive', 'near-miss', 'null'];
  const byKind = {};
  for (const kind of kinds) byKind[kind] = { total: 0, correct: 0, passRate: null };

  const perSkill = new Map();
  const ensure = (skill) => {
    if (!perSkill.has(skill)) perSkill.set(skill, { skill, support: 0, tp: 0, fp: 0, fn: 0 });
    return perSkill.get(skill);
  };

  const confusion = new Map();
  const falsePositives = [];
  const falseNegatives = [];
  const unresolved = [];
  const erroredCases = [];
  let scored = 0;
  let correct = 0;

  for (const item of cases) {
    if (errored.has(item.query)) {
      erroredCases.push({ query: item.query, gold: item.gold, kind: item.kind, reason: errored.get(item.query) });
      continue;
    }
    if (!observed.has(item.query)) {
      unresolved.push(item.query);
      continue;
    }
    const got = observed.get(item.query) || NO_SKILL;
    const gold = item.gold;
    const hit = got === gold;

    scored += 1;
    if (hit) correct += 1;
    byKind[item.kind].total += 1;
    if (hit) byKind[item.kind].correct += 1;

    const key = JSON.stringify([gold, got]);
    const cell = confusion.get(key) || { gold, observed: got, count: 0 };
    cell.count += 1;
    confusion.set(key, cell);

    if (gold !== NO_SKILL) {
      const goldRow = ensure(gold);
      goldRow.support += 1;
      if (hit) goldRow.tp += 1;
      else goldRow.fn += 1;
    }
    if (got !== NO_SKILL && !hit) ensure(got).fp += 1;

    const record = { query: item.query, gold, observed: got, kind: item.kind };
    // A misroute is both: the expected skill stayed silent (false negative for
    // it) and a sibling fired that should not have (false positive for that
    // sibling). Listing it in both places is what makes the per-skill
    // precision/recall arithmetic add up.
    if (gold !== NO_SKILL && !hit) falseNegatives.push(record);
    if (got !== NO_SKILL && !hit) falsePositives.push(record);
  }

  for (const kind of kinds) {
    byKind[kind].passRate = ratio(byKind[kind].correct, byKind[kind].total);
  }

  const perSkillRows = [...perSkill.values()]
    .map((row) => ({
      ...row,
      precision: ratio(row.tp, row.tp + row.fp),
      recall: ratio(row.tp, row.tp + row.fn),
    }))
    .sort((a, b) => a.skill.localeCompare(b.skill));

  const confusionRows = [...confusion.values()].sort(
    (a, b) => b.count - a.count || a.gold.localeCompare(b.gold) || a.observed.localeCompare(b.observed)
  );

  return {
    summary: {
      cases: cases.length,
      scored,
      correct,
      passRate: ratio(correct, scored),
      unresolved: unresolved.length,
      errored: erroredCases.length,
    },
    byKind,
    perSkill: perSkillRows,
    confusion: confusionRows,
    nearMissConfusion: confusionRows.filter((row) => row.gold !== NO_SKILL && row.observed !== row.gold),
    falsePositives,
    falseNegatives,
    unresolvedQueries: unresolved,
    erroredCases,
  };
}

function pct(value) {
  return value === null ? '  n/a' : `${(value * 100).toFixed(1).padStart(5)}%`;
}

function pad(value, width) {
  return String(value).padEnd(width);
}

// Plain-text report. Deliberately ASCII only, and it leads with the caveat: the
// numbers describe one sampled run of a nondeterministic router, not a fixed
// property of the descriptions.
function formatReport(report, meta = {}) {
  const lines = [];
  const { summary, byKind } = report;

  lines.push('Skill trigger eval');
  lines.push('==================');
  if (meta.router) lines.push(`Router:        ${meta.router}`);
  if (meta.model) lines.push(`Model:         ${meta.model}`);
  if (meta.runsPerQuery) lines.push(`Runs/query:    ${meta.runsPerQuery}`);
  if (meta.timestamp) lines.push(`Run at:        ${meta.timestamp}`);
  if (meta.costUsd !== undefined && meta.costUsd !== null) {
    const billed = meta.costReportedBy ? ` (floor; billed by ${meta.costReportedBy} sessions)` : '';
    lines.push(`Reported cost: ${meta.costUsd.toFixed(2)} USD${billed}`);
  }
  lines.push('');

  if (summary.errored) {
    lines.push('*** WARNING: the router could not be reached for some queries. ***');
    lines.push(
      `*** ${summary.errored} of ${summary.cases} cases errored. They are excluded from every`
    );
    lines.push('*** number below, and are NOT counted as routing misses. See the errored');
    lines.push('*** section at the bottom for causes before reading anything as a regression.');
    lines.push('');
  }

  if (summary.scored === 0) {
    lines.push('NO CASE WAS SCORED. Nothing below is a measurement of routing quality.');
    lines.push(`Cases: ${summary.cases}, errored: ${summary.errored}, unresolved: ${summary.unresolved}.`);
    lines.push('');
  }

  lines.push(
    `Overall: ${summary.correct}/${summary.scored} routed to the labelled target (${pct(summary.passRate).trim()})`
  );
  if (summary.unresolved) lines.push(`Unresolved (no observation recorded): ${summary.unresolved}`);
  if (summary.errored) lines.push(`Errored (router unreachable): ${summary.errored}`);
  lines.push('');

  lines.push('By case kind');
  lines.push('------------');
  for (const kind of ['positive', 'near-miss', 'null']) {
    const k = byKind[kind];
    lines.push(`  ${pad(kind, 10)} ${String(k.correct).padStart(4)}/${String(k.total).padEnd(4)} ${pct(k.passRate)}`);
  }
  lines.push('');

  lines.push('Per skill');
  lines.push('---------');
  lines.push(`  ${pad('skill', 40)} ${pad('support', 8)}${pad('tp', 5)}${pad('fp', 5)}${pad('fn', 5)}precision  recall`);
  for (const row of report.perSkill) {
    lines.push(
      `  ${pad(row.skill, 40)} ${pad(row.support, 8)}${pad(row.tp, 5)}${pad(row.fp, 5)}${pad(row.fn, 5)}` +
        `   ${pct(row.precision)}  ${pct(row.recall)}`
    );
  }
  lines.push('');

  lines.push('Confusion (expected -> observed, misroutes only)');
  lines.push('-----------------------------------------------');
  if (report.nearMissConfusion.length === 0) {
    lines.push('  none');
  } else {
    for (const row of report.nearMissConfusion) {
      lines.push(`  ${String(row.count).padStart(4)}  ${row.gold} -> ${row.observed}`);
    }
  }
  lines.push('');

  const listSection = (title, rows) => {
    lines.push(title);
    lines.push('-'.repeat(title.length));
    if (rows.length === 0) {
      lines.push('  none');
    } else {
      for (const row of rows) {
        lines.push(`  [${row.kind}] expected ${row.gold}, fired ${row.observed}`);
        lines.push(`      ${row.query}`);
      }
    }
    lines.push('');
  };

  listSection('False negatives (labelled skill did not fire)', report.falseNegatives);
  listSection('False positives (a skill fired that should not have)', report.falsePositives);

  if (report.erroredCases.length) {
    const title = 'Errored cases (router never answered, excluded from all scoring)';
    lines.push(title);
    lines.push('-'.repeat(title.length));
    for (const row of report.erroredCases) {
      lines.push(`  [${row.kind}] expected ${row.gold}`);
      lines.push(`      ${row.query}`);
      lines.push(`      cause: ${row.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  NO_SKILL,
  goldFor,
  kindFor,
  buildCases,
  scoreRouting,
  formatReport,
};
