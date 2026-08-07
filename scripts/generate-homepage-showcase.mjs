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
 *   3. narrative/alignedPlayerChoice   -> POST /api/narrative/choices
 *   4. roll a skill check locally, then narrative/scene -> /api/narrative/generate
 *
 * Steps 2-4 render the production prompt templates, post them to the production
 * routes, and parse the replies with the production parsers. The only thing
 * replaced is the Zustand store lookups, which become literals here.
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

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { BRAND_IMAGES } from './brand-image-prompts.mjs';

const execFileAsync = promisify(execFile);
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(REPO_ROOT, 'src', 'components', 'Landing', 'homepageShowcase.generated.ts');
const BUILD_DIR = join(tmpdir(), 'narraitor-showcase-build');

const SENTINEL_KEY = 'MOCK_API_KEY';
// Matches src/lib/ai/config.ts modelName; recorded in the output header.
const TEXT_MODEL = 'gemini-2.5-flash';

/** The narrative routes make a single 30s attempt with no retries, so retry here. */
const MAX_ATTEMPTS = 3;

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
  await mkdir(BUILD_DIR, { recursive: true });
  const entry = join(BUILD_DIR, 'entry.ts');
  const out = join(BUILD_DIR, 'production.mjs');
  await writeFile(
    entry,
    [
      "export { getNarrativeTemplate } from '@/lib/promptTemplates/narrativeTemplateManager';",
      "export { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';",
      "export { parseChoiceResponse } from '@/lib/ai/choiceGenerator.parser';",
      "export { parseJsonFromLLM } from '@/lib/ai/parseJSON';",
    ].join('\n')
  );
  await execFileAsync(
    join(REPO_ROOT, 'node_modules', '.bin', 'esbuild'),
    [entry, '--bundle', '--format=esm', '--platform=node', `--tsconfig=${join(REPO_ROOT, 'tsconfig.json')}`, `--outfile=${out}`],
    { cwd: REPO_ROOT }
  );
  return import(out);
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
      return JSON.parse(text);
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

async function buildOne(world, ctx) {
  const { port, apiKey, prod } = ctx;
  const { getNarrativeTemplate, evaluateSkillCheck, parseChoiceResponse, parseJsonFromLLM } = prod;

  console.log(`\n=== ${world.id} — ${world.caption}`);

  // 1. The typed description becomes real attributes and skills, the same way
  //    the world-creation wizard does it.
  console.log('  1/4 analyze-world');
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
  console.log('  2/4 initialScene');
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

  // 3. The choices that follow it.
  console.log('  3/4 alignedPlayerChoice');
  const choicePrompt = getNarrativeTemplate('narrative/alignedPlayerChoice')({
    worldName: world.caption,
    worldDescription: world.typed,
    genre: world.genre,
    narrativeContext: { recentSegments: [{ content: opening }], currentLocation: world.caption },
    worldSkills: worldSkills.map(({ id, name, description }) => ({ id, name, description })),
    worldNpcs: [],
  });
  const choiceRaw = await post(port, '/api/narrative/choices', { prompt: choicePrompt, config: { maxTokens: 1024, temperature: 0.7 } }, apiKey);
  const decision = parseChoiceResponse(choiceRaw.content, [], worldSkills);
  const options = decision?.options || [];
  if (options.length < 3) throw new Error(`Only ${options.length} choices parsed.`);

  // 4. Take the second option, fail a check on it, and let the model narrate the
  //    consequence. The roll is local (production does it locally too); only the
  //    prose is generated.
  const takenIndex = Math.min(1, options.length - 1);
  const taken = options[takenIndex];
  const checkSkill = worldSkills[0];
  const character = {
    skills: [{ skillId: checkSkill.id, level: 3, isActive: true }],
    attributes: attributes.length > 0 ? [{ attributeId: 'attr-0', value: 7 }] : [],
  };
  const roll = rollUntilFailure(
    evaluateSkillCheck,
    character,
    { skillId: checkSkill.id, skillName: checkSkill.name, difficulty: 6 },
    worldSkills
  );

  console.log(`  4/4 scene (after ${checkSkill.name} failed: ${roll.total} vs DC ${roll.dc})`);
  const consequencePrompt = getNarrativeTemplate('narrative/scene')({
    worldName: world.caption,
    genre: world.genre,
    tone: 'serious',
    playerCharacterName: world.protagonist,
    narrativeContext: {
      recentSegments: [{ content: opening }],
      currentLocation: world.caption,
      currentSituation: `Player chose: "${taken.text}" [Skill checks: ${checkSkill.name}: FAILURE (rolled ${roll.total} vs DC ${roll.dc})]`,
      currentTags: [`skill-failure:${checkSkill.id}`, `skill-roll:${roll.diceRoll}`],
    },
    generationParameters: { desiredLength: 'short', segmentType: 'scene' },
  });
  const consequence = unwrapNarrative(
    await post(port, '/api/narrative/generate', { prompt: consequencePrompt, config: { maxTokens: 2048, temperature: 0.7 } }, apiKey),
    parseJsonFromLLM
  );

  return {
    id: world.id,
    caption: world.caption,
    genre: world.genre,
    typed: world.typed,
    protagonist: world.protagonist,
    attributeNames: attributes.map((a) => a.name),
    skillNames: skills.map((s) => s.name),
    opening,
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
 *
 * The typed descriptions and world captions are authored (they stand in for
 * what a player would write). Everything else here came back from the model:
 * the attribute and skill names, the opening prose, the decision and its
 * options, and the consequence. The skill check numbers are a real roll from
 * the production evaluator, rolled until it failed so the page can show a
 * failure honestly.
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
  decisionPrompt: string;
  options: ShowcaseOption[];
  check: ShowcaseCheck;
  consequence: string;
}

export const HOMEPAGE_SHOWCASE: ShowcaseWorld[] = ${JSON.stringify(entries, null, 2)};
`;
  return header;
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

  const prod = await bundleProductionModules();
  const targets = only ? BRAND_IMAGES.filter((w) => w.id === only) : BRAND_IMAGES;
  if (targets.length === 0) throw new Error(`No world with id "${only}".`);

  const entries = [];
  for (const world of targets) {
    entries.push(await buildOne(world, { port, apiKey, prod }));
  }

  if (dryRun) {
    console.log(`\n${JSON.stringify(entries, null, 2)}`);
    return;
  }

  await writeFile(OUT_FILE, serialize(entries, TEXT_MODEL));
  console.log(`\nwrote ${OUT_FILE.replace(REPO_ROOT + '/', '')} (${entries.length} worlds)`);
  await rm(BUILD_DIR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
