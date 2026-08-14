#!/usr/bin/env node

// Skill trigger-eval harness.
//
// Every narraitor-* skill ships evals/trigger_eval.json: labelled queries that
// encode where its trigger boundary is meant to sit (positives, sibling
// near-misses that should route elsewhere, and null cases that should fire
// nothing). This runs them through the real trigger path and scores the result,
// so a description edit that breaks routing shows up as a number instead of a
// hunch.
//
// WHAT "THE REAL TRIGGER PATH" MEANS HERE, EXACTLY
//
// There is no callable router to import. Skill triggering is a model decision:
// Claude Code puts every skill's name and frontmatter description in the system
// prompt, and the model chooses whether to invoke the Skill tool. So the harness
// drives that decision the only honest way available - it starts a real
// non-interactive Claude Code session in this repo with `claude -p`, sends the
// query as the first user message, and watches the stream for the first tool
// call. Skill tool -> that skill fired. A plain prose answer -> nothing fired.
// The candidate set is the repo's own .claude/skills/, the descriptions are the
// real ones on disk, and the decision is the real model's.
//
// It is NOT a keyword matcher and it does not read the descriptions itself.
//
// TWO OBSERVATION MODES, BOTH BIASED, IN DIFFERENT DIRECTIONS
//
// forced-choice (default): the session gets the Skill tool and nothing else, so
//   the model's only moves are "invoke a skill" or "answer in prose". This
//   isolates the routing decision the fixtures actually label. It biases TOWARD
//   triggering, because looking something up first is not an option.
// session: the session gets its normal toolset. Closer to a real session, but it
//   biases AGAINST triggering: the model routinely opens with a context-gathering
//   Bash call and only reaches for the skill on a later turn, which the
//   single-turn window scores as silence.
//
// Neither is ground truth. Run both if a number matters.
//
// Other limits, which the report repeats:
//   - One model call per query, and the model is nondeterministic. Numbers move
//     between runs. Use --runs to vote across repeats.
//   - Only the first turn is observed (--max-turns 1), which also means no tool
//     the model asks for is ever executed.
//   - A cold single-turn session is not a mid-conversation session; real
//     triggering also happens with conversation history in context.
//   - It costs real tokens. Budget before running the whole set.
//
// Usage:
//   node scripts/run-trigger-eval.cjs                        # everything
//   node scripts/run-trigger-eval.cjs --sample 3             # 3 per skill
//   node scripts/run-trigger-eval.cjs --skill narraitor-change-control
//   node scripts/run-trigger-eval.cjs --pairs                # confusable pairs
//   node scripts/run-trigger-eval.cjs --tools-mode session   # unrestricted
//   node scripts/run-trigger-eval.cjs --dry-run              # plan only
//   node scripts/run-trigger-eval.cjs --from results.json    # rescore, free
//
// The pure scoring maths lives in ./trigger-eval-lib.cjs (unit-tested in
// scripts/__tests__).

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const glob = require('glob');
const { buildCases, scoreRouting, formatReport, NO_SKILL } = require('./trigger-eval-lib.cjs');

const ROOT = process.cwd();
const FIXTURE_GLOB = '.claude/skills/narraitor-*/evals/trigger_eval.json';

// The highest-risk confusable pairs from .claude/skills/_trigger_matrix.md. The
// maintenance plan says to re-run these after ANY description edit that touches
// them, which is the cheap mode this harness exists to serve.
const CONFUSABLE_PAIR_SKILLS = [
  'narraitor-debugging-playbook',
  'narraitor-build-test-env',
  'narraitor-ai-quality-discipline',
  'narraitor-prompt-template-governance',
  'narraitor-change-control',
  'narraitor-validation-and-qa',
  'narraitor-storybook-app-parity',
];

function parseArgs(argv) {
  const args = {
    skills: [],
    sample: null,
    runs: 1,
    concurrency: 4,
    model: null,
    from: null,
    out: null,
    pairs: false,
    dryRun: false,
    json: false,
    toolsMode: 'forced-choice',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    switch (arg) {
      case '--skill': args.skills.push(...next().split(',')); break;
      case '--sample': args.sample = Number(next()); break;
      case '--runs': args.runs = Number(next()); break;
      case '--concurrency': args.concurrency = Number(next()); break;
      case '--model': args.model = next(); break;
      case '--from': args.from = next(); break;
      case '--out': args.out = next(); break;
      case '--tools-mode': args.toolsMode = next(); break;
      case '--pairs': args.pairs = true; break;
      case '--dry-run': args.dryRun = true; break;
      case '--json': args.json = true; break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(2);
    }
  }
  if (args.pairs) args.skills.push(...CONFUSABLE_PAIR_SKILLS);
  if (!['forced-choice', 'session'].includes(args.toolsMode)) {
    console.error(`--tools-mode must be forced-choice or session, got ${args.toolsMode}`);
    process.exit(2);
  }
  // A fat-fingered --sample turns into NaN, and NaN is falsy, which would
  // silently drop the sampling and bill a full 376-query sweep. Sampling is the
  // cost control, so a bad value has to stop the run before anything spawns.
  for (const name of ['sample', 'runs', 'concurrency']) {
    const value = args[name];
    if (value === null) continue;
    if (!Number.isInteger(value) || value < 1) {
      console.error(`--${name} must be a positive whole number, got ${String(value)}`);
      process.exit(2);
    }
  }
  return args;
}

function loadFixtures(skillFilter) {
  const files = glob.sync(FIXTURE_GLOB, { cwd: ROOT }).sort();
  const fixtures = [];
  for (const file of files) {
    const skill = file.split('/')[2];
    if (skillFilter.length && !skillFilter.includes(skill)) continue;
    fixtures.push({ skill, entries: JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')) });
  }
  return fixtures;
}

// Take `perSkill` cases from each owning file, spread across the three case
// kinds so a small sample still exercises positives, near-misses and nulls
// rather than a run of whichever kind happens to be listed first.
function sampleCases(fixtures, cases, perSkill) {
  const ownerOf = new Map();
  for (const item of cases) ownerOf.set(item.query, item.owners[0]);

  const picked = new Set();
  for (const { skill } of fixtures) {
    const mine = cases.filter((c) => ownerOf.get(c.query) === skill);
    const buckets = ['positive', 'near-miss', 'null'].map((kind) => mine.filter((c) => c.kind === kind));
    let taken = 0;
    for (let round = 0; taken < perSkill && round < 20; round += 1) {
      for (const bucket of buckets) {
        if (taken >= perSkill) break;
        const item = bucket[round];
        if (item && !picked.has(item.query)) {
          picked.add(item.query);
          taken += 1;
        }
      }
    }
  }
  return cases.filter((c) => picked.has(c.query));
}

// Map a Skill tool call or a SKILL.md read back to a skill name. The Skill tool
// takes plugin-qualified names too, so keep only the trailing segment.
function skillFromToolUse(name, input) {
  if (name === 'Skill' && typeof input.skill === 'string') {
    const parts = input.skill.split(':');
    return parts[parts.length - 1];
  }
  if (name === 'Read' && typeof input.file_path === 'string') {
    const match = input.file_path.match(/\.claude\/skills\/([^/]+)\/SKILL\.md$/);
    if (match) return match[1];
  }
  return NO_SKILL;
}

// One routing observation: start a real session, send the query, report the
// first thing the model reaches for.
function routeQuery(query, { model, toolsMode }) {
  return new Promise((resolve) => {
    const args = [
      '-p', query,
      '--output-format', 'stream-json',
      '--verbose',
      '--max-turns', '1',
      '--no-session-persistence',
      // Project settings only. Two reasons, both load-bearing: it keeps the
      // candidate skill set to the ones these fixtures label (so the score is
      // reproducible on another machine), and it stops every query from firing
      // the developer's global SessionStart hooks - one of which reaps stale
      // worktrees, which would be destructive a few hundred times over.
      '--setting-sources', 'project',
      // Keeps the cacheable prefix identical between queries.
      '--exclude-dynamic-system-prompt-sections',
    ];
    if (model) args.push('--model', model);
    // Forced choice: withhold every tool but Skill, so the model cannot answer
    // the routing question by going and looking instead of picking a skill.
    if (toolsMode === 'forced-choice') args.push('--tools', 'Skill');

    // CLAUDECODE is the guard against nesting an interactive session; a
    // programmatic child is safe, and run_eval.py in skill-creator does the same.
    const env = { ...process.env };
    delete env.CLAUDECODE;

    const child = spawn('claude', args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let buffer = '';
    let stderr = '';
    let settled = false;
    let observed = NO_SKILL;
    let costUsd = 0;
    // Did a model turn actually happen? Without this, a missing binary, a
    // rejected option or an auth failure exits quietly and gets scored as "no
    // skill fired", which reads as a routing miss. A harness that reports
    // infrastructure breakage as a routing result is worse than no harness.
    let answered = false;

    const finish = (failure = null) => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({ query, observed, costUsd, failure: answered ? null : failure || 'no model turn observed' });
    };

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 500) stderr += chunk.toString();
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let index = buffer.indexOf('\n');
      while (index !== -1) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        index = buffer.indexOf('\n');
        if (!line) continue;
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.type === 'assistant') {
          // The model produced a turn, so whatever comes back is a real
          // observation even if it never reaches for a skill.
          answered = true;
          const content = (event.message && event.message.content) || [];
          const toolUse = content.find((c) => c.type === 'tool_use');
          if (toolUse) {
            observed = skillFromToolUse(toolUse.name, toolUse.input || {});
            finish();
            return;
          }
        }
        if (event.type === 'result') {
          costUsd = event.total_cost_usd || costUsd;
          if (event.subtype === 'success') answered = true;
          finish(`session ended with ${event.subtype || 'no subtype'}`);
          return;
        }
      }
    });

    child.on('error', (error) => finish(`could not run claude: ${error.message}`));
    child.on('close', (code) => finish(`claude exited ${code}${stderr ? `: ${stderr.trim().split('\n')[0]}` : ''}`));
  });
}

async function routeAll(cases, { runs, concurrency, model, toolsMode }) {
  const jobs = [];
  for (const item of cases) for (let run = 0; run < runs; run += 1) jobs.push(item);

  const results = new Map();
  const failures = [];
  let totalCost = 0;
  let costReported = 0;
  let done = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < jobs.length) {
      const item = jobs[cursor];
      cursor += 1;
      const result = await routeQuery(item.query, { model, toolsMode });
      totalCost += result.costUsd;
      if (result.costUsd) costReported += 1;
      if (result.failure) {
        // Deliberately not recorded as an observation. A query whose every run
        // failed drops out of scoring as unresolved rather than counting
        // against the skill that never got a fair chance to fire.
        failures.push({ query: item.query, reason: result.failure });
      } else {
        if (!results.has(item.query)) results.set(item.query, []);
        results.get(item.query).push(result.observed);
      }
      done += 1;
      process.stderr.write(`\r  routed ${done}/${jobs.length}`);
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  process.stderr.write('\n');

  // Vote across repeats: the modal label wins, first-seen breaks ties.
  const observations = [...results.entries()].map(([query, labels]) => {
    const counts = new Map();
    for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
    let best = labels[0];
    for (const [label, count] of counts) if (count > (counts.get(best) || 0)) best = label;
    return { query, observed: best, labels };
  });

  return { observations, failures, totalCost, costReported, sessions: jobs.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = loadFixtures(args.skills);
  if (fixtures.length === 0) {
    console.error(`No fixtures matched. Looked for ${FIXTURE_GLOB} under ${ROOT}`);
    process.exit(1);
  }

  const { cases, warnings } = buildCases(fixtures);
  if (warnings.length) {
    console.error('Fixture warnings:');
    for (const warning of warnings) console.error(`  ${warning}`);
    console.error('');
  }

  const selected = args.sample ? sampleCases(fixtures, cases, args.sample) : cases;

  if (args.dryRun) {
    console.log(`${fixtures.length} fixture files, ${cases.length} unique queries, ${selected.length} selected.`);
    for (const kind of ['positive', 'near-miss', 'null']) {
      console.log(`  ${kind}: ${selected.filter((c) => c.kind === kind).length}`);
    }
    console.log(`Model calls if run: ${selected.length * args.runs}`);
    return;
  }

  let observations;
  let meta;
  let scoreAgainst = selected;
  let errors = [];

  if (args.from) {
    const saved = JSON.parse(fs.readFileSync(args.from, 'utf8'));
    observations = saved.observations;
    errors = saved.errors || [];
    // Score against the selection the saved run actually used. Rebuilding it
    // from this invocation's flags would silently rescore a --pairs run against
    // all 376 cases and report the difference as unresolved.
    scoreAgainst = saved.cases || selected;
    meta = { ...saved.meta, router: `${saved.meta.router} (rescored from ${args.from})` };
  } else {
    console.error(
      `Routing ${selected.length} queries x ${args.runs} run(s) through claude -p (${args.toolsMode}) ...`
    );
    const routed = await routeAll(selected, args);
    observations = routed.observations;
    // Only queries where EVERY run failed are errored. One flaky run out of
    // three should not discard a query that the model did answer.
    const answered = new Set(observations.map((o) => o.query));
    const reasons = new Map();
    for (const failure of routed.failures) {
      if (!answered.has(failure.query)) reasons.set(failure.query, failure.reason);
    }
    errors = [...reasons.entries()].map(([query, reason]) => ({ query, reason }));
    meta = {
      router: `claude -p, first turn of a cold session, ${args.toolsMode} tools`,
      model: args.model || 'session default',
      runsPerQuery: args.runs,
      timestamp: new Date().toISOString(),
      // A floor, not a total: sessions are killed the moment the routing
      // decision is visible, so the ones that reached a skill never emit a
      // result event to bill against.
      costUsd: routed.totalCost,
      costReportedBy: `${routed.costReported}/${routed.sessions}`,
      fixtureFiles: fixtures.length,
      selectedQueries: selected.length,
      failedSessions: routed.failures.length,
    };
  }

  const report = scoreRouting(scoreAgainst, observations, errors);

  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    // The case list and the errors ride along so --from rescores the same
    // selection and keeps the same errored cases out of the numbers.
    fs.writeFileSync(
      args.out,
      `${JSON.stringify({ meta, cases: scoreAgainst, observations, errors, report }, null, 2)}\n`
    );
    console.error(`Raw observations written to ${args.out} (rescore for free with --from)`);
  }

  if (args.json) {
    console.log(JSON.stringify({ meta, report }, null, 2));
  } else {
    console.log(formatReport(report, meta));
    console.log(
      'Caveat: routing is a model decision, not a deterministic function. These numbers\n' +
        'describe one sampled run over the first turn of a cold session, under one of two\n' +
        'biased observation modes (see the header comment in this script). Re-run with\n' +
        '--runs to vote across repeats before acting on a delta.'
    );
  }

  // A run with errored cases is not a clean run, and the exit code has to say
  // so. Anything scripted around this should be able to tell "the descriptions
  // regressed" from "the router was unreachable" without parsing the report.
  if (report.summary.scored === 0) {
    console.error('\nNothing was scored. Check that the claude CLI runs here before trusting any number.');
    process.exit(1);
  }
  if (report.summary.errored) {
    console.error(`\n${report.summary.errored} case(s) errored and were excluded. Partial result.`);
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
