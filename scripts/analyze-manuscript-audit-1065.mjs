#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ISSUE_DIR = path.resolve(
  process.cwd(),
  'public_docs/design-system/redesign-planning/issue-1065',
);

const APP_DIR = path.join(ISSUE_DIR, 'screenshots/app');
const PROTOTYPE_DIR = path.join(ISSUE_DIR, 'screenshots/prototype');
const METRICS_PATH = path.join(ISSUE_DIR, 'metrics.json');
const OUTPUT_PATH = path.join(ISSUE_DIR, 'comparison-report.json');

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

const compareImages = async (appPath, prototypePath) => {
  const appMeta = await sharp(appPath).metadata();
  const prototypeMeta = await sharp(prototypePath).metadata();

  const appWidth = appMeta.width ?? 0;
  const appHeight = appMeta.height ?? 0;
  const prototypeWidth = prototypeMeta.width ?? 0;
  const prototypeHeight = prototypeMeta.height ?? 0;

  const overlapWidth = Math.min(appWidth, prototypeWidth);
  const overlapHeight = Math.min(appHeight, prototypeHeight);

  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return {
      appWidth,
      appHeight,
      prototypeWidth,
      prototypeHeight,
      overlapWidth,
      overlapHeight,
      dimensionMatch: false,
      comparedPixels: 0,
      meanAbsDelta: null,
      mismatchPixels: null,
      mismatchRatio: null,
      rmse: null,
    };
  }

  const appRaw = await getRawBuffer(appPath, overlapWidth, overlapHeight);
  const prototypeRaw = await getRawBuffer(prototypePath, overlapWidth, overlapHeight);

  const totalPixels = overlapWidth * overlapHeight;
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
    overlapHeight,
    dimensionMatch: appWidth === prototypeWidth && appHeight === prototypeHeight,
    comparedPixels: totalPixels,
    meanAbsDelta,
    mismatchPixels,
    mismatchRatio: mismatchPixels / totalPixels,
    rmse,
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

    const imageDiff = await compareImages(appPath, prototypePath);

    const metricsKey = `${parsed.viewport}:${parsed.state}`;
    const bucket = parsed.width === 1480 ? 'wide' : parsed.theme;

    const appMetrics = metricsLookup.app[bucket]?.[metricsKey] ?? null;
    const prototypeMetrics = metricsLookup.prototype[bucket]?.[metricsKey] ?? null;

    const metricDiff =
      appMetrics && prototypeMetrics
        ? summarizeMetricNodeDiffs(appMetrics, prototypeMetrics)
        : null;

    comparisons.push({
      key: appFile.key,
      ...parsed,
      screenshot: {
        appFile: appFile.file,
        prototypeFile,
        ...Object.fromEntries(
          Object.entries(imageDiff).map(([k, v]) => [k, round(v, 6)]),
        ),
      },
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

  const grouped = comparisons.reduce((acc, comparison) => {
    const stateKey = comparison.state ?? 'unknown';
    if (!acc[stateKey]) {
      acc[stateKey] = [];
    }
    acc[stateKey].push(comparison);
    return acc;
  }, {});

  const summary = {
    generatedAt: new Date().toISOString(),
    screenshotPairsCompared: comparisons.filter((c) => !c.missingPrototypeScreenshot).length,
    missingPrototypePairs: comparisons.filter((c) => c.missingPrototypeScreenshot).map((c) => c.key),
    maxMismatchRatio: round(
      comparisons.reduce((max, c) => {
        const ratio = c.screenshot?.mismatchRatio;
        return typeof ratio === 'number' && ratio > max ? ratio : max;
      }, 0),
      6,
    ),
    maxMeanAbsDelta: round(
      comparisons.reduce((max, c) => {
        const delta = c.screenshot?.meanAbsDelta;
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
              const ratio = c.screenshot?.mismatchRatio;
              return typeof ratio === 'number' && ratio > max ? ratio : max;
            }, 0),
            6,
          ),
          maxMeanAbsDelta: round(
            entries.reduce((max, c) => {
              const delta = c.screenshot?.meanAbsDelta;
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

  const output = {
    summary,
    comparisons,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote comparison report: ${OUTPUT_PATH}`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
};

await main();
