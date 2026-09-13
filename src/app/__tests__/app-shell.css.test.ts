import fs from 'fs';
import path from 'path';
import postcss, { Rule } from 'postcss';

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

const HEADING_SELECTOR_REGEX = /\bh[1-4]\b|\.(?:[a-zA-Z0-9_-]+-)?(?:title|heading|subheading|name)(?![a-zA-Z0-9_-])/;

function findItalicHeadingRules(cssContent: string, filepath = 'inline.css'): { file: string; selector: string }[] {
  const root = postcss.parse(cssContent, { from: filepath });
  const violations: { file: string; selector: string }[] = [];

  root.walkRules((rule: Rule) => {
    const hasItalic = rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        ((node.prop === 'font-style' && node.value.includes('italic')) ||
          (node.prop === 'font' && /\bitalic\b/.test(node.value)))
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

const DATA_LABEL_REGEX = /(?:data|meta|metric|stat|snapshot|jumplist|label|detail\s+h[3-4])/i;

function findBulletOrDotHeadingRules(
  cssContent: string,
  filepath = 'inline.css'
): { file: string; selector: string; reason: string }[] {
  const root = postcss.parse(cssContent, { from: filepath });
  const violations: { file: string; selector: string; reason: string }[] = [];

  root.walkRules((rule: Rule) => {
    if (!rule.selector.includes('::before') && !rule.selector.includes('::after')) return;

    let current: Rule | undefined = rule;
    const selectors: string[] = [];
    while (current && current.type === 'rule') {
      selectors.unshift(current.selector);
      current = current.parent as Rule | undefined;
    }
    const fullSelector = selectors.join(' ');
    const baseSelector = fullSelector.replace(/::(before|after)[^,\s]*/g, '');

    if (!HEADING_SELECTOR_REGEX.test(baseSelector)) return;
    if (DATA_LABEL_REGEX.test(baseSelector)) return;

    // Bullet text or circular dot bullet on pseudo-element
    const hasBulletText = rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === 'content' &&
        /•|\\2022/.test(node.value)
    );
    const hasDot = rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === 'border-radius' &&
        /full|50%|\d+px/.test(node.value)
    );

    if (hasBulletText || hasDot) {
      violations.push({
        file: filepath,
        selector: rule.selector.replace(/\s+/g, ' ').trim(),
        reason: hasBulletText ? 'bullet' : 'dot',
      });
    }
  });

  return violations;
}

function findMonoUppercaseHeadingRules(
  cssContent: string,
  filepath = 'inline.css'
): { file: string; selector: string }[] {
  const root = postcss.parse(cssContent, { from: filepath });
  const violations: { file: string; selector: string }[] = [];

  root.walkRules((rule: Rule) => {
    if (rule.selector.includes('::before') || rule.selector.includes('::after')) return;

    let current: Rule | undefined = rule;
    const selectors: string[] = [];
    while (current && current.type === 'rule') {
      selectors.unshift(current.selector);
      current = current.parent as Rule | undefined;
    }
    const fullSelector = selectors.join(' ');

    if (!HEADING_SELECTOR_REGEX.test(fullSelector)) return;
    if (DATA_LABEL_REGEX.test(fullSelector)) return;

    const hasMono = rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        ((node.prop === 'font-family' && /(?:--font-system|--font-mono|monospace)/.test(node.value)) ||
          (node.prop === 'font' && /(?:--font-system|--font-mono|monospace)/.test(node.value)))
    );
    const hasUppercase = rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === 'text-transform' &&
        node.value.includes('uppercase')
    );

    if (hasMono && hasUppercase) {
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
    path.join(__dirname, '../../components'),
  ]);

  it('does not declare font-style: italic on heading selectors in app, styles, or components css', () => {
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

  it('catches font shorthand containing italic', () => {
    const fixture = `h2 { font: italic 1.2rem sans-serif; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('h2');
  });

  it('catches heading selectors without preceding hyphen', () => {
    const fixture = `.wizard-subheading { font-style: italic; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('.wizard-subheading');
  });

  it('does not false-positive on heading wrapper classes', () => {
    const fixture = `.component-hero-title-wrapper { font-style: italic; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });

  it('does not false-positive on words ending in title, name, or heading without hyphen', () => {
    const fixture = `.username, .filename, .subtitle { font-style: italic; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });

  it('ignores prose emphasis', () => {
    const fixture = `.text-narrative em { font-style: italic; }`;
    const violations = findItalicHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });

  it('does not attach bullet or dot pseudo-elements to heading selectors in app, styles, or components css', () => {
    const rootDir = path.join(__dirname, '../../..');
    const allViolations: { file: string; selector: string; reason: string }[] = [];
    for (const filepath of targetCssFiles) {
      const css = fs.readFileSync(filepath, 'utf-8');
      const violations = findBulletOrDotHeadingRules(css, path.relative(rootDir, filepath));
      allViolations.push(...violations);
    }

    const violationMessages = allViolations.map(
      (v) => `${v.file}: ${v.selector} (${v.reason})`
    );
    expect(violationMessages).toEqual([]);
  });

  it('does not declare mono-uppercase typography on heading selectors in app, styles, or components css', () => {
    const rootDir = path.join(__dirname, '../../..');
    const allViolations: { file: string; selector: string }[] = [];
    for (const filepath of targetCssFiles) {
      const css = fs.readFileSync(filepath, 'utf-8');
      const violations = findMonoUppercaseHeadingRules(css, path.relative(rootDir, filepath));
      allViolations.push(...violations);
    }

    const violationMessages = allViolations.map(
      (v) => `${v.file}: ${v.selector}`
    );
    expect(violationMessages).toEqual([]);
  });

  it('catches a semantic h2 with a bullet or dot pseudo-element', () => {
    const bulletFixture = `h2::before { content: "• "; }`;
    const dotFixture = `:root .card h2::before { content: ""; border-radius: var(--radius-full); width: 6px; height: 6px; }`;
    const bulletViolations = findBulletOrDotHeadingRules(bulletFixture, 'fixture.css');
    const dotViolations = findBulletOrDotHeadingRules(dotFixture, 'fixture.css');
    expect(bulletViolations.length).toBe(1);
    expect(bulletViolations[0].selector).toBe('h2::before');
    expect(dotViolations.length).toBe(1);
    expect(dotViolations[0].selector).toBe(':root .card h2::before');
  });

  it('catches a semantic h2 with mono-uppercase typography', () => {
    const fixture = `h2 { font-family: var(--font-system); text-transform: uppercase; }`;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('h2');
  });

  it('catches a multi-line heading selector with mono-uppercase or dot bullet', () => {
    const fixture = `:root .card\n > h2 {\n font-family: var(--font-system);\n text-transform: uppercase;\n}`;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe(':root .card > h2');
  });

  it('catches named classes such as .wizard-subheading with mono-uppercase or bullet', () => {
    const monoFixture = `.wizard-subheading { font-family: var(--font-system); text-transform: uppercase; }`;
    const bulletFixture = `.wizard-subheading::before { content: "• "; }`;
    const monoViolations = findMonoUppercaseHeadingRules(monoFixture, 'fixture.css');
    const bulletViolations = findBulletOrDotHeadingRules(bulletFixture, 'fixture.css');
    expect(monoViolations.length).toBe(1);
    expect(monoViolations[0].selector).toBe('.wizard-subheading');
    expect(bulletViolations.length).toBe(1);
    expect(bulletViolations[0].selector).toBe('.wizard-subheading::before');
  });

  it('does not false-positive on genuine data labels or metric labels', () => {
    const fixture = `
      .character-data-label { font-family: var(--font-system); text-transform: uppercase; }
      .component-data-field .data-label { font-family: var(--font-system); text-transform: uppercase; }
      .metric-label::before { content: "• "; }
      .manuscript-character-snapshot-subheading { font-family: var(--font-system); text-transform: uppercase; }
    `;
    const monoViolations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    const bulletViolations = findBulletOrDotHeadingRules(fixture, 'fixture.css');
    expect(monoViolations).toEqual([]);
    expect(bulletViolations).toEqual([]);
  });

  it('preserves perforated dotted rules under headings', () => {
    const fixture = `
      :root .world-detail-section h2::after {
        content: "";
        display: block;
        height: 4px;
        background-image: radial-gradient(circle, var(--color-text-muted) 1.5px, transparent 1.5px);
        background-size: 12px 4px;
        background-repeat: repeat-x;
      }
    `;
    const violations = findBulletOrDotHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });
});

