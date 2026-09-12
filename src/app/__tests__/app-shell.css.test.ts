import fs from 'fs';
import path from 'path';

const appShellCss = fs.readFileSync(path.join(__dirname, '../app-shell.css'), 'utf-8');
const dashboardCss = fs.readFileSync(path.join(__dirname, '../dashboard.css'), 'utf-8');
const aboutCss = fs.readFileSync(path.join(__dirname, '../about.css'), 'utf-8');
const wizardCss = fs.readFileSync(path.join(__dirname, '../wizard.css'), 'utf-8');
const manuscriptSessionCss = fs.readFileSync(
  path.join(__dirname, '../../styles/manuscript-session.css'),
  'utf-8'
);
const sharedTokensCss = fs.readFileSync(
  path.join(__dirname, '../../lib/theme/themes/_shared-tokens.css'),
  'utf-8'
);

/** A corner-bracket block: an absolute pseudo-element with 1px L-shaped borders. */
const BRACKET_BLOCK = /content:\s*""[^}]*?border-(?:top|bottom):\s*1px solid[^}]*?\}/g;

const bracketBlocksIn = (css: string) => css.match(BRACKET_BLOCK) ?? [];

/** The span of every radial-gradient(...) call, paren-matched. */
function radialGradients(css: string): string[] {
  const spans: string[] = [];
  let i = css.indexOf('radial-gradient(');
  while (i >= 0) {
    let k = i + 'radial-gradient('.length;
    let depth = 1;
    while (depth > 0 && k < css.length) {
      if (css[k] === '(') depth += 1;
      else if (css[k] === ')') depth -= 1;
      k += 1;
    }
    spans.push(css.slice(i, k));
    i = css.indexOf('radial-gradient(', k);
  }
  return spans;
}

describe('drafting-mark family', () => {
  it('defines the arm length once, in shared tokens', () => {
    expect(sharedTokensCss).toMatch(/--mark-arm-length:\s*\d+px/);
    expect(appShellCss).not.toMatch(/--mark-arm-length:/);
    expect(dashboardCss).not.toMatch(/--mark-arm-length:/);
    expect(aboutCss).not.toMatch(/--mark-arm-length:/);
  });

  it('sizes every corner bracket from the token, never a literal arm length', () => {
    for (const css of [appShellCss, dashboardCss, aboutCss]) {
      for (const block of bracketBlocksIn(css)) {
        expect(block).not.toMatch(/width:\s*\d+px/);
      }
    }
  });

  it('draws dotted rules at ink weight, not at border weight', () => {
    // --color-border-strong sits ~0.2:1 above the card's own border, which makes
    // the mark read as a darker edge rather than a mark. The family shares one
    // weight; see the bracket rules for the same choice.
    for (const css of [appShellCss, wizardCss]) {
      for (const gradient of radialGradients(css)) {
        expect(gradient).not.toMatch(/--color-border-strong/);
      }
    }
  });

  it('tiles dimension ticks without repeating-linear-gradient', () => {
    // Not in this file group's stylelint function-allowed-list, and background-size
    // tiling covers it. Guards against reaching for the allow-list instead.
    expect(appShellCss).not.toMatch(/repeating-linear-gradient/);
  });
});

describe('app-shell.css static checks', () => {
  it('does not use the literal placeholder word "Section" in a section eyebrow (#1577)', () => {
    expect(appShellCss).not.toMatch(/content:\s*"•\s*Section"/);
  });

  it('does not render a block-level eyebrow bullet with no label after it', () => {
    // A block-level eyebrow (its own line above the heading) needs label text
    // between the bullet and the closing quote — otherwise it's a lone bullet
    // floating over the heading with nothing to say.
    const bareBulletEyebrow = /content:\s*"•\s*";\s*display:\s*block;/;
    for (const css of [appShellCss, wizardCss, manuscriptSessionCss]) {
      expect(css).not.toMatch(bareBulletEyebrow);
    }
  });
});

import postcss, { Rule } from 'postcss';

const HEADING_SELECTOR_REGEX = /\bh[1-4]\b|\.[\w-]+-(title|heading|name)\b/;

function findItalicHeadingRules(cssContent: string, filepath = 'inline.css'): { file: string; selector: string }[] {
  const root = postcss.parse(cssContent, { from: filepath });
  const violations: { file: string; selector: string }[] = [];

  root.walkRules((rule: Rule) => {
    const hasItalic = rule.nodes?.some(
      (node) => node.type === 'decl' && node.prop === 'font-style' && node.value.includes('italic')
    );
    if (!hasItalic) return;

    let current: Rule | undefined = rule;
    const selectors: string[] = [];
    while (current && current.type === 'rule') {
      selectors.unshift(current.selector);
      current = current.parent as Rule | undefined;
    }
    const fullSelector = selectors.join(' ');

    if (HEADING_SELECTOR_REGEX.test(fullSelector)) {
      violations.push({
        file: filepath,
        selector: rule.selector.replace(/\s+/g, ' ').trim(),
      });
    }
  });

  return violations;
}

function getCssFiles(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getCssFiles([fullPath]));
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

describe('heading typography static guards', () => {
  const targetCssFiles = getCssFiles([
    path.join(__dirname, '..'),
    path.join(__dirname, '../../styles'),
  ]);

  it('does not declare font-style: italic on heading selectors in app or styles css', () => {
    const rootDir = path.join(__dirname, '../../..');
    const allViolations: { file: string; selector: string }[] = [];
    for (const filepath of targetCssFiles) {
      const css = fs.readFileSync(filepath, 'utf-8');
      const violations = findItalicHeadingRules(css, path.relative(rootDir, filepath));
      allViolations.push(...violations);
    }

    const violationMessages = allViolations.map(
      (v) => `${v.file}: ${v.selector}`
    );
    expect(violationMessages).toEqual([]);
  });

  it('catches a multi-line heading selector with italic', () => {
    const fixture = `:root .x\n > h2 {\n font-style: italic;\n}`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe(':root .x > h2');
  });

  it('ignores prose emphasis', () => {
    const fixture = `.text-narrative em { font-style: italic; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });
});

