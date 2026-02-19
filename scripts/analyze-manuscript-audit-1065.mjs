#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { imgDiff } from 'img-diff-js';

const ISSUE_DIR = path.resolve(
  process.cwd(),
  'public_docs/design-system/redesign-planning/issue-1065',
);

const APP_DIR = path.join(ISSUE_DIR, 'screenshots/app');
const PROTOTYPE_DIR = path.join(ISSUE_DIR, 'screenshots/prototype');
const DIFF_DIR = path.join(ISSUE_DIR, 'screenshots/diff');
const METRICS_PATH = path.join(ISSUE_DIR, 'metrics.json');
const OUTPUT_PATH = path.join(ISSUE_DIR, 'comparison-report.json');
const HTML_OUTPUT_PATH = path.join(ISSUE_DIR, 'comparison-report.html');

const PIXEL_DELTA_THRESHOLD = 16;

const basenameNoExt = (filePath) => path.basename(filePath, path.extname(filePath));

const relativeKeyFromFilename = (filename) =>
  basenameNoExt(filename).replace(/^(app|prototype)-/, '');

const parseVariant = (key) => {
  const parts = key.split('-');
  if (parts.length < 4) {
    return {
      theme: 'unknown',
      state: key,
      viewport: 'unknown',
      width: null,
      id: key,
    };
  }

  const width = Number(parts.at(-1));
  const viewport = parts.at(-2);
  const theme = parts[0];
  const state = parts.slice(1, -2).join('-');

  return {
    theme,
    state,
    viewport,
    width: Number.isFinite(width) ? width : null,
    id: `${theme}:${state}:${viewport}`,
  };
};

const getRawBuffer = async (filePath, width, height) =>
  sharp(filePath)
    .ensureAlpha()
    .extract({ left: 0, top: 0, width, height })
    .raw()
    .toBuffer();

const compareImages = async (
  appPath,
  prototypePath,
  options = {},
) => {
  const maxHeight = options.maxHeight;
  const appMeta = await sharp(appPath).metadata();
  const prototypeMeta = await sharp(prototypePath).metadata();

  const appWidth = appMeta.width ?? 0;
  const appHeight = appMeta.height ?? 0;
  const prototypeWidth = prototypeMeta.width ?? 0;
  const prototypeHeight = prototypeMeta.height ?? 0;

  const overlapWidth = Math.min(appWidth, prototypeWidth);
  const overlapHeight = Math.min(appHeight, prototypeHeight);
  const comparedHeight =
    typeof maxHeight === 'number' && Number.isFinite(maxHeight) && maxHeight > 0
      ? Math.min(overlapHeight, Math.round(maxHeight))
      : overlapHeight;

  if (overlapWidth <= 0 || comparedHeight <= 0) {
    return {
      appWidth,
      appHeight,
      prototypeWidth,
      prototypeHeight,
      overlapWidth,
      overlapHeight: comparedHeight,
      dimensionMatch: false,
      comparedPixels: 0,
      meanAbsDelta: null,
      mismatchPixels: null,
      mismatchRatio: null,
      rmse: null,
    };
  }

  const appRaw = await getRawBuffer(appPath, overlapWidth, comparedHeight);
  const prototypeRaw = await getRawBuffer(prototypePath, overlapWidth, comparedHeight);

  const totalPixels = overlapWidth * comparedHeight;
  let mismatchPixels = 0;
  let absoluteDeltaAccumulator = 0;
  let squaredDeltaAccumulator = 0;

  for (let i = 0; i < totalPixels; i += 1) {
    const base = i * 4;

    const dr = Math.abs(appRaw[base] - prototypeRaw[base]);
    const dg = Math.abs(appRaw[base + 1] - prototypeRaw[base + 1]);
    const db = Math.abs(appRaw[base + 2] - prototypeRaw[base + 2]);

    const pixelMaxDelta = Math.max(dr, dg, db);
    const pixelSumDelta = dr + dg + db;

    absoluteDeltaAccumulator += pixelSumDelta;
    squaredDeltaAccumulator += dr * dr + dg * dg + db * db;

    if (pixelMaxDelta > PIXEL_DELTA_THRESHOLD) {
      mismatchPixels += 1;
    }
  }

  const comparedChannels = totalPixels * 3;
  const meanAbsDelta = absoluteDeltaAccumulator / comparedChannels;
  const rmse = Math.sqrt(squaredDeltaAccumulator / comparedChannels);

  return {
    appWidth,
    appHeight,
    prototypeWidth,
    prototypeHeight,
    overlapWidth,
    overlapHeight: comparedHeight,
    dimensionMatch: appWidth === prototypeWidth && appHeight === prototypeHeight,
    comparedPixels: totalPixels,
    meanAbsDelta,
    mismatchPixels,
    mismatchRatio: mismatchPixels / totalPixels,
    rmse,
  };
};

const deltaColor = (ratio) => {
  if (ratio == null) return '#888';
  if (ratio <= 0.05) return '#22c55e';
  if (ratio <= 0.15) return '#f59e0b';
  return '#ef4444';
};

const pct = (ratio) =>
  ratio == null ? 'n/a' : `${(ratio * 100).toFixed(1)}%`;

const buildHtml = (comparisons, summary, summaryViewportCrop) => {
  const grouped = comparisons
    .filter((c) => !c.missingPrototypeScreenshot)
    .reduce((acc, c) => {
      const key = c.state ?? 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

  const overallRatio = summaryViewportCrop?.maxMismatchRatio ?? summary?.maxMismatchRatio;
  const overallDelta = summaryViewportCrop?.maxMeanAbsDelta ?? summary?.maxMeanAbsDelta;
  const generatedAt = summary?.generatedAt ?? new Date().toISOString();

  const groupSections = Object.entries(grouped).map(([state, entries]) => {
    const stateRatio = summaryViewportCrop?.states?.[state]?.maxMismatchRatio
      ?? summary?.states?.[state]?.maxMismatchRatio;
    const stateDelta = summaryViewportCrop?.states?.[state]?.maxMeanAbsDelta
      ?? summary?.states?.[state]?.maxMeanAbsDelta;
    const color = deltaColor(stateRatio);

    const pairCards = entries.map((c) => {
      const crop = c.screenshotViewportCrop ?? c.screenshot;
      const ratio = crop?.mismatchRatio;
      const mad = crop?.meanAbsDelta;
      const appSrc = `screenshots/app/${c.screenshot?.appFile ?? ''}`;
      const protSrc = `screenshots/prototype/${c.screenshot?.prototypeFile ?? ''}`;
      const diffSrc = c.diffFile ? `screenshots/diff/${c.diffFile}` : null;
      const pairId = `pair-${c.key}`;
      const cardColor = deltaColor(ratio);

      const selectorRows = (c.metrics?.selectorsOver8px ?? [])
        .slice(0, 6)
        .map((s) => `<tr><td class="sel-cell">${s.selector}</td><td class="num-cell">${Math.round(s.maxGeometryDelta)}px</td></tr>`)
        .join('');

      return `
<div class="pair" id="${pairId}">
  <div class="pair-header">
    <span class="viewport-badge">${c.theme ?? ''} · ${c.viewport ?? ''} · ${c.width ?? ''}px</span>
    <div class="delta-badges">
      <span class="badge" style="background:${cardColor}">${pct(ratio)} mismatch</span>
      <span class="badge badge-secondary">Δ${mad != null ? mad.toFixed(1) : 'n/a'} px</span>
    </div>
  </div>
  <div class="images">
    <div class="image-slot">
      <div class="slot-label">app</div>
      <img src="${appSrc}" loading="lazy" onclick="zoom(this)" />
    </div>
    ${diffSrc ? `<div class="image-slot image-slot-diff">
      <div class="slot-label">diff</div>
      <img src="${diffSrc}" loading="lazy" onclick="zoom(this)" />
    </div>` : ''}
    <div class="image-slot">
      <div class="slot-label">prototype</div>
      <img src="${protSrc}" loading="lazy" onclick="zoom(this)" />
    </div>
  </div>
  ${selectorRows ? `<details class="selector-details"><summary>Layout deltas (&gt;8px)</summary><table class="selector-table">${selectorRows}</table></details>` : ''}
</div>`;
    }).join('');

    return `
<section class="group">
  <h2 class="group-heading" onclick="toggleGroup(this)">
    <span class="caret">&#9660;</span>
    ${state}
    <span class="group-badges">
      <span class="badge" style="background:${color}">${pct(stateRatio)}</span>
      <span class="badge badge-secondary">Δ${stateDelta != null ? stateDelta.toFixed(1) : 'n/a'}</span>
    </span>
  </h2>
  <div class="group-body">${pairCards}</div>
</section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Issue 1065 — App vs Prototype Diff</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; font-size: 13px; background: #0f0f0f; color: #e0e0e0; line-height: 1.4; }
  a { color: inherit; }

  .summary-bar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    padding: 0.6rem 1rem;
    background: #1a1a1a; border-bottom: 1px solid #333;
    font-size: 12px;
  }
  .summary-title { font-weight: 600; font-size: 14px; flex-shrink: 0; }
  .summary-meta { color: #888; }
  .summary-bar .badge { font-size: 12px; }

  .content { padding: 1rem; max-width: 100%; }

  .group { margin-bottom: 1.5rem; border: 1px solid #2a2a2a; border-radius: 6px; overflow: hidden; }
  .group-heading {
    display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
    padding: 0.6rem 0.75rem; background: #1e1e1e;
    font-size: 13px; font-weight: 600; cursor: pointer; user-select: none;
    border-bottom: 1px solid #2a2a2a;
  }
  .group-heading:hover { background: #252525; }
  .caret { font-size: 10px; transition: transform 0.15s; }
  .group-heading.collapsed .caret { transform: rotate(-90deg); }
  .group-badges { display: flex; gap: 0.4rem; margin-left: auto; }
  .group-body { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .group-body.hidden { display: none; }

  .pair { background: #161616; border: 1px solid #2a2a2a; border-radius: 4px; overflow: hidden; }
  .pair-header {
    display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
    padding: 0.4rem 0.6rem; background: #1c1c1c; border-bottom: 1px solid #2a2a2a;
  }
  .viewport-badge { font-size: 11px; color: #aaa; font-family: monospace; }
  .delta-badges { display: flex; gap: 0.35rem; }

  .badge {
    display: inline-block; padding: 1px 7px; border-radius: 10px;
    font-size: 11px; font-weight: 600; color: #000;
  }
  .badge-secondary { background: #3a3a3a; color: #ccc; font-weight: 400; }

  .images {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0;
  }
  .image-slot { position: relative; overflow: hidden; background: #111; }
  .image-slot + .image-slot { border-left: 1px solid #2a2a2a; }
  .image-slot-diff { background: #0a0a0a; }
  .slot-label {
    position: absolute; top: 4px; left: 6px; z-index: 2;
    font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    background: rgba(0,0,0,0.7); color: #ccc; padding: 1px 5px; border-radius: 3px;
  }
  .image-slot img {
    display: block; width: 100%; height: auto; cursor: zoom-in;
  }

  .selector-details { padding: 0.4rem 0.6rem; border-top: 1px solid #2a2a2a; font-size: 11px; }
  .selector-details summary { cursor: pointer; color: #888; }
  .selector-details summary:hover { color: #ccc; }
  .selector-table { margin-top: 0.35rem; width: 100%; border-collapse: collapse; }
  .sel-cell { color: #a78bfa; font-family: monospace; padding: 1px 0.5rem 1px 0; }
  .num-cell { color: #ef4444; text-align: right; }

  /* lightbox */
  .lightbox {
    display: none; position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.9); align-items: center; justify-content: center;
    cursor: zoom-out;
  }
  .lightbox.open { display: flex; }
  .lightbox img { max-width: 95vw; max-height: 95vh; object-fit: contain; border: 1px solid #333; }
</style>
</head>
<body>
<div class="summary-bar">
  <span class="summary-title">Issue 1065 — App vs Prototype</span>
  <span class="badge" style="background:${deltaColor(overallRatio)}">${pct(overallRatio)} worst mismatch</span>
  <span class="badge badge-secondary">Δ${overallDelta != null ? overallDelta.toFixed(1) : 'n/a'} px worst mean delta</span>
  <span class="summary-meta">${comparisons.filter((c) => !c.missingPrototypeScreenshot).length} pairs · ${generatedAt.slice(0, 10)}</span>
</div>
<div class="content">
  ${groupSections}
</div>
<div id="lightbox" class="lightbox" onclick="closeLightbox()">
  <img id="lightbox-img" src="" alt="zoomed screenshot" />
</div>
<script>
  function toggleGroup(heading) {
    heading.classList.toggle('collapsed');
    const body = heading.nextElementSibling;
    body.classList.toggle('hidden');
  }
  function zoom(img) {
    document.getElementById('lightbox-img').src = img.src;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
</script>
</body>
</html>`;
};

const buildSummary = (comparisons, screenshotKey) => {
  const grouped = comparisons.reduce((acc, comparison) => {
    const stateKey = comparison.state ?? 'unknown';
    if (!acc[stateKey]) {
      acc[stateKey] = [];
    }
    acc[stateKey].push(comparison);
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    screenshotPairsCompared: comparisons.filter((c) => !c.missingPrototypeScreenshot).length,
    missingPrototypePairs: comparisons
      .filter((c) => c.missingPrototypeScreenshot)
      .map((c) => c.key),
    maxMismatchRatio: round(
      comparisons.reduce((max, c) => {
        const ratio = c[screenshotKey]?.mismatchRatio;
        return typeof ratio === 'number' && ratio > max ? ratio : max;
      }, 0),
      6,
    ),
    maxMeanAbsDelta: round(
      comparisons.reduce((max, c) => {
        const delta = c[screenshotKey]?.meanAbsDelta;
        return typeof delta === 'number' && delta > max ? delta : max;
      }, 0),
      6,
    ),
    states: Object.fromEntries(
      Object.entries(grouped).map(([state, entries]) => [
        state,
        {
          comparisons: entries.length,
          maxMismatchRatio: round(
            entries.reduce((max, c) => {
              const ratio = c[screenshotKey]?.mismatchRatio;
              return typeof ratio === 'number' && ratio > max ? ratio : max;
            }, 0),
            6,
          ),
          maxMeanAbsDelta: round(
            entries.reduce((max, c) => {
              const delta = c[screenshotKey]?.meanAbsDelta;
              return typeof delta === 'number' && delta > max ? delta : max;
            }, 0),
            6,
          ),
          maxSelectorDelta: round(
            entries.reduce((max, c) => {
              const delta = c.metrics?.maxSelectorDelta;
              return typeof delta === 'number' && delta > max ? delta : max;
            }, 0),
            3,
          ),
          maxRelationshipDelta: round(
            entries.reduce((max, c) => {
              const delta = c.metrics?.maxRelationshipDelta;
              return typeof delta === 'number' && delta > max ? delta : max;
            }, 0),
            3,
          ),
        },
      ]),
    ),
  };
};

const round = (value, digits = 3) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : value;

const summarizeMetricNodeDiffs = (appMetrics, prototypeMetrics) => {
  const appNodes = new Map((appMetrics.nodes ?? []).map((node) => [node.selector, node]));
  const prototypeNodes = new Map(
    (prototypeMetrics.nodes ?? []).map((node) => [node.selector, node]),
  );

  const selectors = new Set([...appNodes.keys(), ...prototypeNodes.keys()]);
  const geometricFields = ['width', 'height', 'top', 'left', 'right', 'bottom'];

  const selectorSummaries = [];
  let maxSelectorDelta = 0;

  for (const selector of selectors) {
    const appNode = appNodes.get(selector);
    const prototypeNode = prototypeNodes.get(selector);

    if (!appNode || !prototypeNode) {
      selectorSummaries.push({
        selector,
        existsInApp: Boolean(appNode),
        existsInPrototype: Boolean(prototypeNode),
        maxGeometryDelta: null,
      });
      continue;
    }

    let nodeMaxDelta = 0;

    for (const field of geometricFields) {
      const appValue = appNode[field];
      const prototypeValue = prototypeNode[field];

      if (typeof appValue === 'number' && typeof prototypeValue === 'number') {
        const delta = Math.abs(appValue - prototypeValue);
        if (delta > nodeMaxDelta) {
          nodeMaxDelta = delta;
        }
      }
    }

    if (nodeMaxDelta > maxSelectorDelta) {
      maxSelectorDelta = nodeMaxDelta;
    }

    selectorSummaries.push({
      selector,
      existsInApp: true,
      existsInPrototype: true,
      maxGeometryDelta: nodeMaxDelta,
      displayMatch: appNode.display === prototypeNode.display,
      positionMatch: appNode.position === prototypeNode.position,
      overflowMatch:
        appNode.overflow === prototypeNode.overflow &&
        appNode.overflowY === prototypeNode.overflowY,
    });
  }

  const relationshipKeys = new Set([
    ...Object.keys(appMetrics.relationships ?? {}),
    ...Object.keys(prototypeMetrics.relationships ?? {}),
  ]);

  const relationshipDiffs = {};
  let maxRelationshipDelta = 0;

  for (const relationshipKey of relationshipKeys) {
    const appValue = appMetrics.relationships?.[relationshipKey];
    const prototypeValue = prototypeMetrics.relationships?.[relationshipKey];

    if (typeof appValue === 'number' && typeof prototypeValue === 'number') {
      const delta = Math.abs(appValue - prototypeValue);
      relationshipDiffs[relationshipKey] = {
        app: appValue,
        prototype: prototypeValue,
        delta,
      };
      if (delta > maxRelationshipDelta) {
        maxRelationshipDelta = delta;
      }
      continue;
    }

    relationshipDiffs[relationshipKey] = {
      app: appValue ?? null,
      prototype: prototypeValue ?? null,
      delta: null,
    };
  }

  return {
    maxSelectorDelta,
    maxRelationshipDelta,
    selectorSummaries,
    relationshipDiffs,
  };
};

const main = async () => {
  await fs.mkdir(DIFF_DIR, { recursive: true });

  const appFiles = (await fs.readdir(APP_DIR))
    .filter((file) => file.endsWith('.png'))
    .map((file) => ({ file, key: relativeKeyFromFilename(file) }));
  const prototypeFiles = new Map(
    (await fs.readdir(PROTOTYPE_DIR))
      .filter((file) => file.endsWith('.png'))
      .map((file) => [relativeKeyFromFilename(file), file]),
  );

  const metricsRaw = JSON.parse(await fs.readFile(METRICS_PATH, 'utf8'));

  const metricsLookup = {
    app: {
      light: metricsRaw.app?.light ?? {},
      dark: metricsRaw.app?.dark ?? {},
      wide: metricsRaw.app?.wide ?? {},
    },
    prototype: {
      light: metricsRaw.prototype?.light ?? {},
      dark: metricsRaw.prototype?.dark ?? {},
      wide: metricsRaw.prototype?.wide ?? {},
    },
  };

  const comparisons = [];

  for (const appFile of appFiles) {
    const prototypeFile = prototypeFiles.get(appFile.key);
    if (!prototypeFile) {
      comparisons.push({
        key: appFile.key,
        missingPrototypeScreenshot: true,
      });
      continue;
    }

    const parsed = parseVariant(appFile.key);

    const appPath = path.join(APP_DIR, appFile.file);
    const prototypePath = path.join(PROTOTYPE_DIR, prototypeFile);

    const metricsKey = `${parsed.viewport}:${parsed.state}`;
    const bucket = parsed.width === 1480 ? 'wide' : parsed.theme;

    const appMetrics = metricsLookup.app[bucket]?.[metricsKey] ?? null;
    const prototypeMetrics = metricsLookup.prototype[bucket]?.[metricsKey] ?? null;

    const diffFile = `diff-${appFile.key}.png`;
    const diffPath = path.join(DIFF_DIR, diffFile);
    await imgDiff({
      actualFilename: appPath,
      expectedFilename: prototypePath,
      diffFilename: diffPath,
    });

    const imageDiff = await compareImages(appPath, prototypePath);

    const appViewportHeight = appMetrics?.viewport?.height;
    const prototypeViewportHeight = prototypeMetrics?.viewport?.height;
    const viewportCropHeight =
      typeof appViewportHeight === 'number' &&
      typeof prototypeViewportHeight === 'number'
        ? Math.min(appViewportHeight, prototypeViewportHeight)
        : null;
    const imageDiffViewportCrop =
      typeof viewportCropHeight === 'number' && viewportCropHeight > 0
        ? await compareImages(appPath, prototypePath, {
            maxHeight: viewportCropHeight,
          })
        : null;

    const metricDiff =
      appMetrics && prototypeMetrics
        ? summarizeMetricNodeDiffs(appMetrics, prototypeMetrics)
        : null;

    comparisons.push({
      key: appFile.key,
      ...parsed,
      diffFile,
      screenshot: {
        appFile: appFile.file,
        prototypeFile,
        ...Object.fromEntries(
          Object.entries(imageDiff).map(([k, v]) => [k, round(v, 6)]),
        ),
      },
      screenshotViewportCrop: imageDiffViewportCrop
        ? {
            appFile: appFile.file,
            prototypeFile,
            viewportCropHeight: round(viewportCropHeight, 3),
            ...Object.fromEntries(
              Object.entries(imageDiffViewportCrop).map(([k, v]) => [
                k,
                round(v, 6),
              ]),
            ),
          }
        : null,
      metrics: metricDiff
        ? {
            maxSelectorDelta: round(metricDiff.maxSelectorDelta, 3),
            maxRelationshipDelta: round(metricDiff.maxRelationshipDelta, 3),
            relationshipDiffs: Object.fromEntries(
              Object.entries(metricDiff.relationshipDiffs).map(([k, v]) => [
                k,
                {
                  app: v.app,
                  prototype: v.prototype,
                  delta: round(v.delta, 3),
                },
              ]),
            ),
            selectorsOver8px: metricDiff.selectorSummaries
              .filter(
                (summary) =>
                  typeof summary.maxGeometryDelta === 'number' &&
                  summary.maxGeometryDelta >= 8,
              )
              .map((summary) => ({
                selector: summary.selector,
                maxGeometryDelta: round(summary.maxGeometryDelta, 3),
              })),
            selectorsWithDisplayMismatch: metricDiff.selectorSummaries
              .filter((summary) => summary.displayMatch === false)
              .map((summary) => summary.selector),
            selectorsWithPositionMismatch: metricDiff.selectorSummaries
              .filter((summary) => summary.positionMatch === false)
              .map((summary) => summary.selector),
            selectorsWithOverflowMismatch: metricDiff.selectorSummaries
              .filter((summary) => summary.overflowMatch === false)
              .map((summary) => summary.selector),
          }
        : null,
    });
  }

  const summary = buildSummary(comparisons, 'screenshot');
  const summaryViewportCrop = buildSummary(comparisons, 'screenshotViewportCrop');

  const output = {
    summary,
    summaryViewportCrop,
    comparisons,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  const html = buildHtml(comparisons, summary, summaryViewportCrop);
  await fs.writeFile(HTML_OUTPUT_PATH, html, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote comparison report: ${OUTPUT_PATH}`);
  // eslint-disable-next-line no-console
  console.log(`Wrote HTML diff viewer:   ${HTML_OUTPUT_PATH}`);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        summary,
        summaryViewportCrop,
      },
      null,
      2,
    ),
  );
};

await main();
