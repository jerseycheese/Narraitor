#!/usr/bin/env node
/**
 * Generates the marketing surface's world art through Gemini.
 *
 * Committed rather than run ad hoc because these images ARE brand assets: the
 * homepage claims they came out of the product's own image model, so the prompt
 * that produced each one needs to live in the repo next to it. The prompts are
 * in brand-image-prompts.mjs.
 *
 * Reads GEMINI_API_KEY from .env.local at call time and passes it as a header.
 * The key is never logged, never written to disk, and never included in an
 * error message.
 *
 *   node scripts/generate-brand-image.mjs --all
 *   node scripts/generate-brand-image.mjs --id port-city
 *   node scripts/generate-brand-image.mjs --id port-city --aspect 16:9 --force
 *
 * Aspect ratio is an argument because the app's own route hardcodes 1:1
 * (src/lib/ai/geminiImageGenerator.ts) and the hero needs landscape.
 */

import { readFile, writeFile, mkdir, access, rm, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_IMAGES, DEFAULT_ASPECT } from './brand-image-prompts.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(REPO_ROOT, 'public', 'visual-assets', 'worlds');

// Matches the app's configured image model (src/lib/ai/config.ts imageModelName).
const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const SENTINEL_KEY = 'MOCK_API_KEY';

/**
 * Pulls the key out of .env.local without importing a dotenv dependency.
 * Returns the value only; callers must not log it.
 */
async function readApiKey() {
  let raw;
  try {
    raw = await readFile(join(REPO_ROOT, '.env.local'), 'utf8');
  } catch {
    throw new Error('.env.local not found. This script needs GEMINI_API_KEY.');
  }

  for (const line of raw.split('\n')) {
    if (!line.startsWith('GEMINI_API_KEY=')) continue;
    const value = line.slice('GEMINI_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
    if (!value) break;
    // A mock key would return placeholder art that looks real once it's on the
    // page. Fail loudly instead.
    if (value === SENTINEL_KEY) {
      throw new Error(
        `GEMINI_API_KEY is the ${SENTINEL_KEY} sentinel. Set a real key or these ` +
          'images would be placeholders presented as product output.'
      );
    }
    return value;
  }

  throw new Error('GEMINI_API_KEY is missing or empty in .env.local.');
}

function parseArgs(argv) {
  const args = { all: false, force: false, model: DEFAULT_MODEL, aspect: null, id: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') args.all = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--id') args.id = argv[++i];
    else if (arg === '--model') args.model = argv[++i];
    else if (arg === '--aspect') args.aspect = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.all && !args.id) {
    throw new Error('Pass --all, or --id <one of: ' + BRAND_IMAGES.map((i) => i.id).join(', ') + '>');
  }
  return args;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * The model returns PNG at over a megabyte, which is far too heavy for a hero.
 * Convert to webp and drop the intermediate, so the committed asset is the one
 * the page actually serves. Quality 78 is chosen for painterly source art: it
 * has no hard edges or text to ring, so the artefacts land well below what the
 * scrim over the hero would reveal.
 */
async function toWebp(pngPath, webpPath, id) {
  try {
    await execFileAsync('cwebp', ['-quiet', '-q', '78', pngPath, '-o', webpPath]);
  } catch {
    console.warn(
      `warn   ${id}: cwebp unavailable, leaving PNG in place. Install webp ` +
        '(brew install webp) and re-run so the committed asset is optimized.'
    );
    return null;
  }
  await rm(pngPath, { force: true });
  return (await stat(webpPath)).size;
}

async function generateOne(image, { apiKey, model, aspect, force }) {
  const pngPath = join(OUT_DIR, `${image.id}.png`);
  const webpPath = join(OUT_DIR, `${image.id}.webp`);

  if (!force && ((await exists(webpPath)) || (await exists(pngPath)))) {
    console.log(`skip   ${image.id} (exists; --force to regenerate)`);
    return { id: image.id, skipped: true };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: image.prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: aspect || image.aspect || DEFAULT_ASPECT },
        },
      }),
    }
  );

  if (!response.ok) {
    // Read the body for the reason, but never echo request headers back.
    const detail = await response.text().catch(() => '');
    throw new Error(
      `${image.id}: Gemini returned ${response.status}. ${detail.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part?.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart?.inlineData?.data) {
    const finish = data?.candidates?.[0]?.finishReason || 'unknown';
    throw new Error(`${image.id}: no image in response (finishReason: ${finish}).`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const bytes = Buffer.from(imagePart.inlineData.data, 'base64');
  await writeFile(pngPath, bytes);

  const webpBytes = await toWebp(pngPath, webpPath, image.id);
  if (webpBytes === null) {
    console.log(`wrote  ${image.id}.png (${(bytes.length / 1024).toFixed(0)} KB, unoptimized)`);
    return { id: image.id, bytes: bytes.length };
  }

  console.log(
    `wrote  ${image.id}.webp (${(webpBytes / 1024).toFixed(0)} KB, ` +
      `from ${(bytes.length / 1024).toFixed(0)} KB PNG)`
  );
  return { id: image.id, bytes: webpBytes };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = await readApiKey();

  const targets = args.all
    ? BRAND_IMAGES
    : BRAND_IMAGES.filter((image) => image.id === args.id);

  if (targets.length === 0) {
    throw new Error(`No image with id "${args.id}".`);
  }

  console.log(`model: ${args.model}`);

  const failures = [];
  // Serial, not parallel: image generation is the expensive call and a partial
  // batch is easier to reason about than four interleaved failures.
  for (const image of targets) {
    try {
      await generateOne(image, { ...args, apiKey });
    } catch (error) {
      console.error(`FAILED ${image.id}: ${error.message}`);
      failures.push(image.id);
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} of ${targets.length} failed: ${failures.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
