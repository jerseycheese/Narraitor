/**
 * Unused-CSS audit (issue #1087)
 *
 * Lists custom CSS selectors in our production stylesheets that PurgeCSS could
 * not find a matching usage for in the source. It is an AUDIT, not a build step:
 * it writes nothing, deletes nothing, and never fails CI (exit 0 on findings).
 *
 * Why this approach (chosen over alternatives):
 *  - PurgeCSS (Node API, `rejected: true`) parses CSS, selectors, and at-rules
 *    properly and returns the unmatched-selector list directly. Run as a
 *    periodic/advisory audit, not a build-time purge or a blocking gate, because
 *    runtime-composed class names make false positives likely (see SAFELIST).
 *  - UnCSS would boot the app in a headless browser (more accurate, but slow and
 *    brittle against our route-gated app) -- overkill for an audit.
 *  - A hand-rolled regex scan would re-implement CSS/selector parsing -- fragile.
 *
 * Context: Tailwind was removed in #1097, so there is currently zero purging on
 * any CSS. This audit is the only signal we have for dead custom selectors.
 *
 * How to read the output: each line under a file is a selector with no detected
 * usage. Treat it as a WORKLIST for human review -- DO NOT auto-delete. A class
 * composed at runtime (e.g. `button-${variant}`) shows up here unless safelisted;
 * add genuinely-dynamic prefixes to SAFELIST and re-run.
 *
 * Run: npm run audit:css
 */
import { PurgeCSS } from 'purgecss';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const abs = (p) => path.join(rootDir, p);

// Production component/page CSS that ships to users. Excluded on purpose:
//  - src/lib/theme/themes/*.css  -> design-token definitions keyed on
//    [data-theme="dsN"] attribute selectors; auditing token files is noise.
//  - src/app/dev/design-system*/*.css -> dev-only showcases (already ignored by
//    knip + stylelint), not shipped.
const CSS_FILES = [
  'src/app/globals.css',
  'src/app/badge.css',
  'src/app/character-display.css',
  'src/app/dashboard.css',
  'src/app/wizard.css',
  'src/app/app-shell.css',
  'src/styles/manuscript-session.css',
].map(abs);

// Content scanned for class usage: all of src except tests/stories. dev/** IS
// included so dev-only usages of production classes are not falsely flagged
// (this biases toward under-reporting, which is the safe direction for an audit).
const CONTENT_GLOB = 'src/**/*.{tsx,ts,jsx,js}';
const CONTENT_IGNORE = ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'];

// Classes composed at runtime are invisible to static analysis -- keep them.
// greedy: keeps a rule if ANY part of the selector matches (compound classes).
const SAFELIST = {
  greedy: [
    /^alert-/, // alert.tsx: `alert-${variant}`
    /^button-/, // button.tsx: `button-${variant}`, `button-size-${size}`
    /^badge-/, // badge.tsx: `badge-${variant}`, `badge-${size}`
    /^ending-/, // EndingScreen.tsx: `ending-${tone}`
    /^manuscript-alignment-badge-/, // RequirementBadges.tsx: `...-${alignment}`
    /^card-action-variant-/, // CardActionGroup.tsx: `card-action-variant-${variant}`
    /^error-display-/, // ErrorDisplay.tsx: `error-display-${severity}`
    /^component-character-portrait-/, // CharacterPortrait.tsx: `component-character-portrait-${size}`
  ],
  standard: [
    'dark', // documentElement.classList.add('dark')
    'theme-switcher-option-active',
    'theme-switcher-option-compact',
    'dark-mode-toggle-option-active',
    'dark-mode-toggle-option-compact',
    'wizard-card-selected',
    'selected-template',
    'active-state-card',
    'active-state-indicator',
  ],
};

async function main() {
  const content = await glob(CONTENT_GLOB, {
    cwd: rootDir,
    absolute: true,
    ignore: CONTENT_IGNORE,
  });

  const results = await new PurgeCSS().purge({
    content,
    css: CSS_FILES,
    safelist: SAFELIST,
    rejected: true,
    // keyframes/fontFace/variables left at default (false): @keyframes,
    // @font-face, and CSS custom properties (design tokens) are never flagged.
  });

  let grandTotal = 0;
  for (const result of results) {
    const rejected = [
      ...new Set((result.rejected ?? []).map((s) => s.trim()).filter(Boolean)),
    ].sort();
    grandTotal += rejected.length;
    const file = path.relative(rootDir, result.file ?? '(unknown)');
    // eslint-disable-next-line no-console
    console.log(`\n${file} - ${rejected.length} potentially unused`);
    for (const selector of rejected) {
      // eslint-disable-next-line no-console
      console.log(`  ${selector}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\n==== TOTAL potentially-unused selectors: ${grandTotal} ====`);
  // eslint-disable-next-line no-console
  console.log(
    'NOTE: "rejected" = no usage found in scanned content. Review manually; ' +
      'safelist genuinely-dynamic classes and re-run. DO NOT auto-delete.',
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
