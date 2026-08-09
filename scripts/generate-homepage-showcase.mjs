#!/usr/bin/env node
/**
 * Produces the prose the homepage shows as evidence of what the product writes.
 *
 * The page pairs a short description a player typed against the story that came
 * back from it. That pairing is a claim, so the prose has to be real output, not
 * something written to read well. This script runs the same chain the app runs:
 *
 *   1. POST /api/ai/analyze-world      the typed description -> attributes, skills
 *   2. narrative/initialScene          -> POST /api/narrative/generate
 *   3. then, three times over:
 *        narrative/alignedPlayerChoice -> POST /api/narrative/choices
 *        roll a skill check locally
 *        narrative/scene               -> POST /api/narrative/generate
 *
 * Steps 2-3 render the production prompt templates, post them to the production
 * routes, and parse the replies with the production parsers. The only thing
 * replaced is the Zustand store lookups, which become literals here.
 *
 * It plays three turns and keeps the last one, because turn-1 decisions are
 * opening-scene decisions and too small to headline a page about choices that
 * cost something. The opening prose stays turn 1 either way, since the page
 * pairs it against what the player typed.
 *
 * Requires the dev server for THIS worktree to be running, because the routes
 * are where the Gemini call happens. Output is written as a TypeScript module
 * with a provenance header so a reviewer can see when it was generated and
 * against which model.
 *
 *   npm run dev                                  # in another terminal
 *   node scripts/generate-homepage-showcase.mjs
 *   node scripts/generate-homepage-showcase.mjs --id port-city --dry-run
 */

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { BRAND_IMAGES } from './brand-image-prompts.mjs';

const execFileAsync = promisify(execFile);
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(REPO_ROOT, 'src', 'components', 'Landing', 'homepageShowcase.generated.ts');
/**
 * SECURITY: randomized, not a fixed path under the shared temp dir. The bundle
 * written here gets import()ed, so a predictable name would let any other local
 * user pre-create it and choose what this script executes.
 */
const BUILD_DIR_PREFIX = join(tmpdir(), 'narraitor-showcase-');

const SENTINEL_KEY = 'MOCK_API_KEY';
// Matches src/lib/ai/config.ts modelName; recorded in the output header.
const TEXT_MODEL = 'gemini-2.5-flash';

/** The narrative routes make a single 30s attempt with no retries, so retry here. */
const MAX_ATTEMPTS = 3;

/**
 * How many turns to play before capturing one for the page.
 *
 * Turn 1 decisions are opening-scene decisions, and they are small: the first
 * pass of this script produced "Finish coffee, then answer the door" under a
 * heading claiming you have to decide something. By turn 3 the model has a
 * situation to escalate and the choice has weight behind it.
 */
const TURNS_BEFORE_CAPTURE = 3;

/** How many prior segments to carry into a prompt, matching what the app sends. */
const CONTEXT_WINDOW = 3;

async function readApiKey() {
  const raw = await readFile(join(REPO_ROOT, '.env.local'), 'utf8').catch(() => {
    throw new Error('.env.local not found. This script needs GEMINI_API_KEY.');
  });
  for (const line of raw.split('\n')) {
    if (!line.startsWith('GEMINI_API_KEY=')) continue;
    const value = line.slice('GEMINI_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
    if (!value) break;
    if (value === SENTINEL_KEY) {
      throw new Error(
        `GEMINI_API_KEY is the ${SENTINEL_KEY} sentinel. Mock output would land on ` +
          'the homepage presented as real product writing.'
      );
    }
    return value;
  }
  throw new Error('GEMINI_API_KEY is missing or empty in .env.local.');
}

async function resolvePort() {
  const { stdout } = await execFileAsync('node', ['scripts/worktree-port.js'], { cwd: REPO_ROOT });
  const port = stdout.trim();
  if (!port) throw new Error('Could not resolve this worktree\'s dev-server port.');
  return port;
}

/**
 * The prompt templates and the choice parser are TypeScript using @/ aliases.
 * Bundle them once with the repo's own esbuild rather than reimplementing them,
 * so this script can never drift from what the app actually sends.
 */
async function bundleProductionModules() {
  const buildDir = await mkdtemp(BUILD_DIR_PREFIX);
  const entry = join(buildDir, 'entry.ts');
  const out = join(buildDir, 'production.mjs');
  await writeFile(
    entry,
    [
      "export { getNarrativeTemplate } from '@/lib/promptTemplates/narrativeTemplateManager';",
      "export { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';",
      "export { parseChoiceResponse } from '@/lib/ai/choiceGenerator.parser';",
      "export { attachSkillChecksWhereRelevant } from '@/lib/ai/choiceGenerator';",
      "export { parseJsonFromLLM } from '@/lib/ai/parseJSON';",
    ].join('\n')
  );
  await execFileAsync(
    join(REPO_ROOT, 'node_modules', '.bin', 'esbuild'),
    [entry, '--bundle', '--format=esm', '--platform=node', `--tsconfig=${join(REPO_ROOT, 'tsconfig.json')}`, `--outfile=${out}`],
    { cwd: REPO_ROOT }
  );
  return { modules: await import(out), buildDir };
}

/**
 * /api/narrative/generate streams newline-delimited JSON (issue #1476) — one
 * or more `{delta}` progress lines, then a terminal `{done: true, content,
 * finishReason, promptTokens, completionTokens}` line carrying the same
 * fields the old single-JSON response had. The other routes this script
 * calls still return plain JSON. Rather than branching per-route, parse the
 * body as JSON first and only fall back to scanning it as ndjson when that
 * fails, so every caller of post() keeps working unchanged either way.
 */
function parseRouteResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to ndjson parsing below.
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const event = JSON.parse(trimmed);
    if ('error' in event) throw new Error(event.error);
    if ('done' in event) return event;
  }
  throw new Error('Streamed response ended without a completion event.');
}

async function post(port, route, body, apiKey) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-provider-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${route} returned ${response.status}: ${text.slice(0, 300)}`);
      return parseRouteResponse(text);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.log(`       retry ${attempt}/${MAX_ATTEMPTS - 1} after: ${error.message.slice(0, 120)}`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * The route wraps Gemini's text in {content}; the narrative templates then ask
 * Gemini for its own {content, type, metadata} envelope. So the prose is two
 * layers down.
 */
function unwrapNarrative(routeResponse, parseJsonFromLLM) {
  const outer = routeResponse?.content;
  if (typeof outer !== 'string' || outer.trim() === '') {
    throw new Error('Route returned no content.');
  }
  let inner;
  try {
    inner = parseJsonFromLLM(outer);
  } catch {
    // Some replies come back as bare prose rather than the requested envelope.
    return outer.trim();
  }
  const prose = typeof inner?.content === 'string' ? inner.content : null;
  if (!prose || prose.trim() === '') throw new Error('Envelope carried no prose.');
  return prose.trim();
}

/** Rolls until the named skill fails, so the page can show a real failed check. */
function rollUntilFailure(evaluateSkillCheck, character, skillCheck, worldSkills) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const roll = evaluateSkillCheck(character, skillCheck, worldSkills);
    if (!roll.success) return roll;
  }
  throw new Error(`Could not roll a failure for ${skillCheck.skillName} in 200 tries.`);
}

/**
 * The skill the option is checked against, or null when it carries no check.
 *
 * A choice about hand signals resolved against Rifle Marksmanship is what made
 * the first pass read as nonsense, so nothing here invents a skill: the answer
 * comes from the requirement the option actually carries, and an option with no
 * requirement honestly has no check.
 */
function skillForOption(option, worldSkills) {
  const requirement = (option.requirements || []).find((req) => req.type === 'skill');
  if (!requirement) {
    return null;
  }
  return worldSkills.find((skill) => skill.id === requirement.targetId) || null;
}

/**
 * Which option the showcase plays.
 *
 * The page shows the check by name, so the option has to be one a world skill
 * genuinely speaks to. Option 2 reads best against the opening, so it wins when
 * it carries a check; otherwise the first checked option does. If nothing
 * carries a check there is no honest check to print, and stopping beats
 * reaching for an arbitrary skill - the whole point of this evidence.
 */
function pickTakenIndex(options, worldSkills) {
  const preferred = Math.min(1, options.length - 1);
  if (skillForOption(options[preferred], worldSkills)) {
    return preferred;
  }

  const firstChecked = options.findIndex((option) => skillForOption(option, worldSkills));
  if (firstChecked === -1) {
    throw new Error(
      'No option carries a resolvable skill check, so there is nothing honest to show. ' +
        `Options: ${JSON.stringify(options.map((option) => option.text))}`
    );
  }
  return firstChecked;
}

/** The situation line the app builds after a choice resolves against a check. */
function describeOutcome(taken, skillName, roll) {
  const verdict = roll.success ? 'SUCCESS' : 'FAILURE';
  return (
    `Player chose: "${taken.text}" ` +
    `[Skill checks: ${skillName}: ${verdict} (rolled ${roll.total} vs DC ${roll.dc})]`
  );
}

async function buildOne(world, ctx) {
  const { port, apiKey, prod } = ctx;
  const {
    getNarrativeTemplate,
    evaluateSkillCheck,
    parseChoiceResponse,
    attachSkillChecksWhereRelevant,
    parseJsonFromLLM,
  } = prod;

  console.log(`\n=== ${world.id} — ${world.caption}`);

  // 1. The typed description becomes real attributes and skills, the same way
  //    the world-creation wizard does it.
  console.log('  1 analyze-world');
  const analysis = await post(port, '/api/ai/analyze-world', { description: world.typed }, apiKey);
  const attributes = (analysis.attributes || []).slice(0, 4);
  const skills = (analysis.skills || []).slice(0, 6);
  if (skills.length === 0) throw new Error('analyze-world returned no skills.');

  const worldSkills = skills.map((skill, index) => ({
    id: `skill-${index}`,
    name: skill.name,
    description: skill.description || '',
    attributeIds: attributes.length > 0 ? ['attr-0'] : [],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
    worldId: world.id,
  }));

  // 2. The opening scene: what came back from what they typed.
  console.log('  2 initialScene');
  const scenePrompt = getNarrativeTemplate('narrative/initialScene')({
    worldName: world.caption,
    worldDescription: world.typed,
    genre: world.genre,
    tone: 'serious',
    attributes,
    playerCharacterName: world.protagonist,
    enhancedCharacterContext: world.protagonistContext,
  });
  const opening = unwrapNarrative(
    await post(port, '/api/narrative/generate', { prompt: scenePrompt, config: { maxTokens: 2048, temperature: 0.7 } }, apiKey),
    parseJsonFromLLM
  );

  // 3. Play forward. Each turn asks for choices, takes one, resolves it against a
  //    skill check, and narrates the result. Only the last turn is kept: `opening`
  //    stays turn 1 so the "you wrote this, it wrote that" pairing on the page
  //    remains true, and the decision the page shows comes from a story that has
  //    somewhere to go.
  // parseChoiceResponse resolves a choice's "[Skill 3+]" tag against world.skills,
  // so it needs the world, not the bare skill array. Passing the array drops every
  // requirement with an "Unknown skill" warning, which is how the first pass ended
  // up checking the same arbitrary skill on every choice.
  const worldForParser = { id: world.id, name: world.caption, skills: worldSkills, attributes };
  const character = {
    skills: worldSkills.map((skill) => ({ skillId: skill.id, level: 3, isActive: true })),
    attributes: attributes.length > 0 ? [{ attributeId: 'attr-0', value: 7 }] : [],
  };

  const segments = [{ content: opening }];
  let captured = null;

  for (let turn = 1; turn <= TURNS_BEFORE_CAPTURE; turn += 1) {
    const isFinalTurn = turn === TURNS_BEFORE_CAPTURE;
    const recentSegments = segments.slice(-CONTEXT_WINDOW);

    console.log(`  turn ${turn}/${TURNS_BEFORE_CAPTURE}: alignedPlayerChoice`);
    const choicePrompt = getNarrativeTemplate('narrative/alignedPlayerChoice')({
      worldName: world.caption,
      worldDescription: world.typed,
      genre: world.genre,
      narrativeContext: { recentSegments, currentLocation: world.caption },
      worldSkills: worldSkills.map(({ id, name, description }) => ({ id, name, description })),
      worldNpcs: [],
    });
    const choiceRaw = await post(port, '/api/narrative/choices', { prompt: choicePrompt, config: { maxTokens: 1024, temperature: 0.7 } }, apiKey);
    // The app never uses a parsed decision raw: generateChoices runs it through
    // attachSkillChecksWhereRelevant, which drops requirements this world can't
    // resolve and fills in a check when the option's own words point at a skill.
    // Skipping that step here is what made the homepage's checks drift from the
    // app's.
    const decision = attachSkillChecksWhereRelevant(
      parseChoiceResponse(
        choiceRaw.content,
        { recentSegments, currentLocation: world.caption },
        worldForParser
      ),
      worldForParser
    );
    const options = decision?.options || [];
    if (options.length < 3) throw new Error(`Turn ${turn}: only ${options.length} choices parsed.`);

    // The roll is local, the same way production does it. Only the captured turn
    // is forced to fail, so the page shows a real failure without the turns
    // leading up to it being rigged.
    const takenIndex = pickTakenIndex(options, worldSkills);
    const taken = options[takenIndex];
    const checkSkill = skillForOption(taken, worldSkills);
    const skillCheck = { skillId: checkSkill.id, skillName: checkSkill.name, difficulty: 6 };
    const roll = isFinalTurn
      ? rollUntilFailure(evaluateSkillCheck, character, skillCheck, worldSkills)
      : evaluateSkillCheck(character, skillCheck, worldSkills);

    console.log(`  turn ${turn}/${TURNS_BEFORE_CAPTURE}: scene (${checkSkill.name} ${roll.success ? 'passed' : 'failed'}: ${roll.total} vs DC ${roll.dc})`);
    const scenePromptForTurn = getNarrativeTemplate('narrative/scene')({
      worldName: world.caption,
      genre: world.genre,
      tone: 'serious',
      playerCharacterName: world.protagonist,
      narrativeContext: {
        recentSegments,
        currentLocation: world.caption,
        currentSituation: describeOutcome(taken, checkSkill.name, roll),
        currentTags: [
          `skill-${roll.success ? 'success' : 'failure'}:${checkSkill.id}`,
          `skill-roll:${roll.diceRoll}`,
        ],
      },
      generationParameters: { desiredLength: 'short', segmentType: 'scene' },
    });
    const scene = unwrapNarrative(
      await post(port, '/api/narrative/generate', { prompt: scenePromptForTurn, config: { maxTokens: 2048, temperature: 0.7 } }, apiKey),
      parseJsonFromLLM
    );
    segments.push({ content: scene });

    if (isFinalTurn) {
      // The passage the captured choices answer. Without it the page jumps from
      // the opening to a decision about things that happened in between, and the
      // options read as non-sequiturs.
      const situation = recentSegments[recentSegments.length - 1].content;
      captured = { decision, options, takenIndex, checkSkill, roll, situation, consequence: scene };
    }
  }

  const { decision, options, takenIndex, checkSkill, roll, situation, consequence } = captured;

  return {
    id: world.id,
    caption: world.caption,
    genre: world.genre,
    typed: world.typed,
    protagonist: world.protagonist,
    attributeNames: attributes.map((a) => a.name),
    skillNames: skills.map((s) => s.name),
    opening,
    situation,
    decisionPrompt: decision.prompt || '',
    options: options.map((option, index) => ({
      text: option.text,
      alignment: option.alignment || 'neutral',
      taken: index === takenIndex,
    })),
    check: {
      skillName: checkSkill.name,
      diceRoll: roll.diceRoll,
      skillLevel: roll.skillLevel,
      attributeBonus: roll.attributeBonus,
      total: roll.total,
      dc: roll.dc,
    },
    consequence,
  };
}

function serialize(entries, model) {
  const header = `/**
 * GENERATED FILE — do not hand-edit.
 *
 * Real output from the product's own generation chain, produced by
 * scripts/generate-homepage-showcase.mjs. The homepage presents this as
 * evidence of what the product writes, so editing it by hand would turn it
 * back into a claim nobody checked. Re-run the script instead.
 *
 * Model: ${model}
 * Generated: ${new Date().toISOString()}
 * Turns played per world: ${TURNS_BEFORE_CAPTURE} (the last one is what's kept)
 *
 * The player's side of the exchange is authored, standing in for what someone
 * would bring: the typed description, the world caption, the genre, and the
 * character the story is played as. Everything else here came back from the
 * model: the attribute and skill names, the opening prose, the decision and
 * its options, and the consequence. The skill check numbers are a real roll
 * from the production evaluator, rolled until it failed so the page can show
 * a failure honestly.
 *
 * The attributes and skills came from the typed description on its own, the
 * same single-field call the creation wizard makes. "opening" is turn 1,
 * written from that world plus the authored character. The decision, options,
 * check and consequence are turn ${TURNS_BEFORE_CAPTURE}, played forward from it.
 */

export interface ShowcaseOption {
  text: string;
  alignment: string;
  taken: boolean;
}

export interface ShowcaseCheck {
  skillName: string;
  diceRoll: number;
  skillLevel: number;
  attributeBonus: number;
  total: number;
  dc: number;
}

export interface ShowcaseWorld {
  id: string;
  caption: string;
  genre: string;
  typed: string;
  protagonist: string;
  attributeNames: string[];
  skillNames: string[];
  opening: string;
  /** The passage the choices below answer. Turn ${TURNS_BEFORE_CAPTURE - 1}'s scene, not the opening. */
  situation: string;
  decisionPrompt: string;
  options: ShowcaseOption[];
  check: ShowcaseCheck;
  consequence: string;
}

export const HOMEPAGE_SHOWCASE: ShowcaseWorld[] = ${JSON.stringify(entries, null, 2)};
`;
  return header;
}

/** Reads back whatever the last run wrote, so a partial re-run can merge into it. */
async function readPreviousEntries() {
  const raw = await readFile(OUT_FILE, 'utf8').catch(() => null);
  if (!raw) return [];
  // Anchor on "= [" rather than the first "[", which belongs to ShowcaseWorld[].
  const marker = raw.indexOf('= [', raw.indexOf('HOMEPAGE_SHOWCASE'));
  if (marker === -1) return [];
  try {
    return JSON.parse(raw.slice(marker + 2, raw.lastIndexOf(']') + 1));
  } catch {
    return [];
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const only = argv.includes('--id') ? argv[argv.indexOf('--id') + 1] : null;
  const dryRun = argv.includes('--dry-run');

  const apiKey = await readApiKey();
  const port = await resolvePort();

  // Fail early and clearly if the server isn't up, rather than four times over.
  const probe = await fetch(`http://localhost:${port}/api/narrative/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null);
  if (!probe) {
    throw new Error(`No dev server on port ${port}. Run "npm run dev" in this worktree first.`);
  }

  console.log(`server: localhost:${port}`);
  console.log(`model:  ${TEXT_MODEL}`);

  const { modules: prod, buildDir } = await bundleProductionModules();
  const targets = only ? BRAND_IMAGES.filter((w) => w.id === only) : BRAND_IMAGES;
  if (targets.length === 0) throw new Error(`No world with id "${only}".`);

  const generated = [];
  try {
    for (const world of targets) {
      generated.push(await buildOne(world, { port, apiKey, prod }));
    }
  } finally {
    await rm(buildDir, { recursive: true, force: true });
  }

  if (dryRun) {
    console.log(`\n${JSON.stringify(generated, null, 2)}`);
    return;
  }

  // Regenerating one world keeps the other three. Writing just the new entry
  // would silently drop them, and the loss wouldn't show up until the page
  // rendered one plate.
  const previous = await readPreviousEntries();
  const merged = BRAND_IMAGES.map(
    (world) =>
      generated.find((entry) => entry.id === world.id) ||
      previous.find((entry) => entry.id === world.id)
  ).filter(Boolean);

  await writeFile(OUT_FILE, serialize(merged, TEXT_MODEL));
  console.log(
    `\nwrote ${OUT_FILE.replace(REPO_ROOT + '/', '')} ` +
      `(${generated.length} regenerated, ${merged.length} total)`
  );
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
