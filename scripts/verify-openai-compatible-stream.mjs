#!/usr/bin/env node
/**
 * Proves an OpenAI-compatible preset actually works, by playing one streamed
 * narrative turn against the live provider.
 *
 * The presets ship marked `available: false` because nothing in CI can call a
 * paid endpoint, so the only thing that can flip one is a human with a key.
 * This is that check, written down. It drives the SAME two functions the
 * narrative route drives - `openProviderTextStream` then
 * `consumeProviderStreamEvents`, over `openAICompatibleAdapter` - so a pass
 * here is a statement about the shipped path, not about a fetch this script
 * happened to write.
 *
 * It asserts, in order because each fails differently: the key was accepted,
 * the turn arrived as more than one delta (real progressive streaming rather
 * than a buffered blob dressed as a stream), it finished with prose instead of
 * an empty refusal, and that prose is the envelope the app parses.
 *
 * The key is read from OPENAI_COMPAT_API_KEY at call time. It is never written
 * to disk, never passed as an argument, and every line this prints goes through
 * a redactor first, since an upstream error body can echo the request back with
 * the credential in it.
 *
 *   OPENAI_COMPAT_API_KEY=... node scripts/verify-openai-compatible-stream.mjs --preset openai
 *   OPENAI_COMPAT_API_KEY=... node scripts/verify-openai-compatible-stream.mjs --preset openrouter --model openai/gpt-4o
 *   OPENAI_COMPAT_API_KEY=... node scripts/verify-openai-compatible-stream.mjs --endpoint https://host/v1/chat/completions --model some-model
 *
 * Exits 0 on pass, 1 on fail. No dev server needed, it calls the provider
 * directly the way the server would.
 */

import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * SECURITY: randomized, not a fixed path under the shared temp dir. The bundle
 * written here gets import()ed, so a predictable name would let any other local
 * user pre-create it and choose what this script executes.
 */
const BUILD_DIR_PREFIX = join(tmpdir(), 'narraitor-provider-verify-');

const KEY_ENV_VAR = 'OPENAI_COMPAT_API_KEY';
const DEFAULT_PRESET_ID = 'openai';

/** Matches the app's generation config; see src/lib/ai/config.ts. */
const TEMPERATURE = 0.7;
const MAX_TOKENS = 2048;

/**
 * Wall-clock cap on reading the streamed body. Generous, because a slow model
 * on a long turn is a pass and not a failure; it exists only so a provider that
 * stops sending without closing the stream ends the run instead of parking it.
 */
const STREAM_BUDGET_MS = 120000;

/** A throwaway world, small enough to read in the output and cheap to generate. */
const VERIFICATION_WORLD = {
  worldName: 'The Long Cold',
  worldDescription:
    'A research station on a frozen moon, three weeks after the last supply ship failed to arrive.',
  genre: 'Science Fiction',
  tone: 'serious',
  playerCharacterName: 'Vance',
  enhancedCharacterContext: 'Vance is the station engineer, and the only one still awake on night rotation.',
};

function parseArgs(argv) {
  const args = { preset: DEFAULT_PRESET_ID, endpoint: null, model: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--preset') args.preset = argv[++i];
    else if (flag === '--endpoint') args.endpoint = argv[++i];
    else if (flag === '--model') args.model = argv[++i];
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return args;
}

/**
 * Replaces the key with a placeholder anywhere it appears in text bound for the
 * terminal.
 *
 * SECURITY: not paranoia about our own console.log calls - a provider that
 * echoes the failing request back puts the bearer credential in its error body,
 * and that body reaches this script as `error.detail` (see
 * MAX_UPSTREAM_DETAIL in providers/core/request.ts).
 */
function makeRedactor(apiKey) {
  return (text) => String(text).split(apiKey).join('[redacted]');
}

/**
 * The provider path is TypeScript using @/ aliases. Bundle it with the repo's
 * own esbuild rather than reimplementing it, so this script cannot drift from
 * what the app actually sends. Same approach as generate-homepage-showcase.mjs.
 */
async function bundleProductionModules() {
  const buildDir = await mkdtemp(BUILD_DIR_PREFIX);
  const entry = join(buildDir, 'entry.ts');
  const out = join(buildDir, 'production.mjs');
  await writeFile(
    entry,
    [
      "export { getPresetById, presetHeadersForEndpoint, presetMaxOutputTokensParamForEndpoint, presetHasFixedSamplingControlsForEndpoint } from '@/lib/ai/presets';",
      "export { openAICompatibleAdapter } from '@/lib/ai/providers/openai-compatible/adapter';",
      "export { openProviderTextStream } from '@/lib/ai/providers/core/request';",
      "export { consumeProviderStreamEvents } from '@/lib/ai/providers/core/streamConsumer';",
      "export { parseContentRating } from '@/lib/ai/safety/contentRatingGuidance';",
      "export { getNarrativeTemplate } from '@/lib/promptTemplates/narrativeTemplateManager';",
      "export { parseJsonFromLLM } from '@/lib/ai/parseJSON';",
    ].join('\n')
  );
  await execFileAsync(
    join(REPO_ROOT, 'node_modules', '.bin', 'esbuild'),
    [
      entry,
      '--bundle',
      '--format=esm',
      '--platform=node',
      `--tsconfig=${join(REPO_ROOT, 'tsconfig.json')}`,
      `--outfile=${out}`,
    ],
    { cwd: REPO_ROOT }
  );
  return { modules: await import(out), buildDir };
}

/** Endpoint and model for this run: explicit flags win, otherwise the preset's. */
function resolveTarget(args, getPresetById) {
  if (args.endpoint) {
    if (!args.model) throw new Error('--endpoint requires --model.');
    return { label: args.endpoint, endpoint: args.endpoint, model: args.model };
  }

  const preset = getPresetById(args.preset);
  if (!preset) throw new Error(`No preset with id "${args.preset}".`);
  if (preset.type !== 'openai-compatible') {
    throw new Error(`Preset "${preset.id}" is ${preset.type}, not openai-compatible.`);
  }

  return {
    label: preset.name,
    endpoint: preset.endpoint,
    model: args.model ?? preset.defaultModel,
  };
}

/**
 * Play the turn and collect what the route's client would have seen.
 *
 * The delta count is the interesting one, and the threshold has to be more than
 * one rather than more than zero. A provider that buffers the whole completion
 * and hands it back in a single SSE frame still grows the preview once, so it
 * still produces exactly one delta and then a terminal event. Counting "at
 * least one" would pass the very response this check exists to catch.
 */
async function playStreamedTurn(prod, descriptor, prompt) {
  const spec = {
    prompt,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    contentRating: prod.parseContentRating(prompt),
    stream: true,
  };

  const upstream = await prod.openProviderTextStream(
    prod.openAICompatibleAdapter,
    descriptor,
    spec
  );
  if (!upstream.body) throw new Error('Provider answered 200 with an empty stream body.');

  const reader = upstream.body.getReader();
  const result = { deltas: 0, preview: '', done: null, error: null };

  // sendProviderRequest's timeout is cleared the moment the response headers
  // land, so nothing upstream bounds the body read. A provider that answers 200,
  // opens an SSE body and then stalls without closing it would park this loop
  // forever, which is a poor thing to hand somebody running the check by hand.
  let timedOut = false;
  const watchdog = setTimeout(() => {
    timedOut = true;
    reader.cancel().catch(() => {});
  }, STREAM_BUDGET_MS);

  try {
    for await (const event of prod.consumeProviderStreamEvents(
      reader,
      prod.openAICompatibleAdapter,
      'Provider verification'
    )) {
      if (event.error) result.error = event.error;
      else if (event.done) result.done = event;
      else if (typeof event.delta === 'string') {
        result.deltas += 1;
        result.preview += event.delta;
      }
    }
  } finally {
    // Also stops a pending timer from holding the process open on the fast path.
    clearTimeout(watchdog);
  }

  // Cancelling the reader ends the loop cleanly, so the consumer yields a
  // normal terminal event carrying a partial turn. Naming the timeout here is
  // what keeps that from being read as a provider that answered badly.
  if (timedOut) {
    result.error = `provider stalled: no end of stream within ${STREAM_BUDGET_MS / 1000}s`;
  }

  return result;
}

/** The prose inside the narrative envelope, or '' if the reply wasn't one. */
function readEnvelopeProse(prod, content) {
  try {
    const prose = prod.parseJsonFromLLM(content)?.content;
    return typeof prose === 'string' ? prose.trim() : '';
  } catch {
    return '';
  }
}

/**
 * The checks, as a list so a failure names which one broke rather than just
 * failing somewhere in a stream.
 */
function evaluate(turn, prod) {
  if (turn.error) return [{ name: 'stream completed', passed: false, detail: turn.error }];

  const content = turn.done?.content ?? '';
  const prose = readEnvelopeProse(prod, content);

  return [
    { name: 'stream completed', passed: true, detail: '' },
    {
      name: 'the turn was revealed progressively, not in one piece',
      passed: turn.deltas > 1,
      detail:
        turn.deltas > 1
          ? `${turn.deltas} deltas`
          : `${turn.deltas} delta, so the reply was buffered and handed over whole`,
    },
    {
      name: 'turn produced content',
      passed: content.trim().length > 0,
      detail: `${content.length} chars`,
    },
    {
      name: 'finish reason is a normal stop',
      passed: turn.done?.finishReason === 'STOP',
      detail: `finishReason=${turn.done?.finishReason ?? 'none'}`,
    },
    {
      name: 'content parses as the narrative envelope',
      passed: prose.length > 0,
      detail: prose.length > 0 ? `${prose.length} chars of prose` : 'not the envelope the app parses',
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env[KEY_ENV_VAR];
  if (!apiKey) {
    console.error(
      `${KEY_ENV_VAR} is not set. Run this as:\n\n` +
        `  ${KEY_ENV_VAR}=<your key> node scripts/verify-openai-compatible-stream.mjs --preset <id>\n\n` +
        'The key is read at call time and never written anywhere.'
    );
    return 1;
  }
  const redact = makeRedactor(apiKey);

  const { modules: prod, buildDir } = await bundleProductionModules();
  try {
    const target = resolveTarget(args, prod.getPresetById);
    console.log(`Provider : ${target.label}`);
    console.log(`Endpoint : ${target.endpoint}`);
    console.log(`Model    : ${target.model}`);
    console.log('Playing one streamed opening scene...\n');

    const prompt = prod.getNarrativeTemplate('narrative/initialScene')(VERIFICATION_WORLD);
    // Built the way resolveProvider builds it, using the same lookups, rather
    // than by hand. A descriptor assembled here would be missing whatever the
    // server derives from the endpoint, and the run would quietly prove out a
    // request the app never sends.
    const descriptor = {
      type: 'openai-compatible',
      endpoint: target.endpoint,
      model: target.model,
      apiKey,
      customHeaders: prod.presetHeadersForEndpoint(target.endpoint),
      maxOutputTokensParam: prod.presetMaxOutputTokensParamForEndpoint(target.endpoint),
      hasFixedSamplingControls: prod.presetHasFixedSamplingControlsForEndpoint(target.endpoint),
    };

    let turn;
    try {
      turn = await playStreamedTurn(prod, descriptor, prompt);
    } catch (error) {
      // ProviderUpstreamError carries the upstream status and a slice of its
      // body; both are worth printing, and both go through the redactor.
      const status = error?.status ? ` (HTTP ${error.status})` : '';
      const detail = error?.detail ? `\n${redact(error.detail)}` : '';
      console.error(`FAIL  request never completed${status}: ${redact(error?.message ?? error)}${detail}`);
      return 1;
    }

    const checks = evaluate(turn, prod);
    for (const check of checks) {
      const mark = check.passed ? 'pass' : 'FAIL';
      console.log(`${mark}  ${check.name}${check.detail ? ` - ${redact(check.detail)}` : ''}`);
    }

    const usage = turn.done
      ? `prompt ${turn.done.promptTokens ?? 'n/a'} / completion ${turn.done.completionTokens ?? 'n/a'}`
      : 'n/a';
    console.log(`\nTokens reported: ${usage}`);

    if (turn.preview) {
      console.log(`\nFirst of what a player would have watched appear:\n  ${redact(turn.preview.slice(0, 240))}...`);
    }

    const failed = checks.filter((check) => !check.passed);
    if (failed.length > 0) {
      console.log(`\nFAIL - ${failed.length} of ${checks.length} checks failed for ${target.label}.`);
      return 1;
    }

    console.log(
      `\nPASS - ${target.label} works end to end on the streamed narrative path.\n` +
        'This is the evidence needed to flip its preset to available: true in src/lib/ai/presets.ts.'
    );
    return 0;
  } finally {
    await rm(buildDir, { recursive: true, force: true });
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    // Nothing here has the key in scope, so this path prints the message as-is.
    console.error(`FAIL  ${error?.message ?? error}`);
    process.exitCode = 1;
  });
