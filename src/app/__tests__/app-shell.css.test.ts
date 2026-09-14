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

const targetCssFiles = getCssFiles([
  path.join(__dirname, '..'),
  path.join(__dirname, '../../styles'),
  path.join(__dirname, '../../components'),
]);

const ALL_STYLES = targetCssFiles.map((filepath) => ({
  file: path.relative(path.join(__dirname, '../../..'), filepath),
  css: fs.readFileSync(filepath, 'utf-8'),
}));

const APPROVED_BRACKET_SELECTORS = new Set([
  ':root .world-detail-npc::before',
  ':root .world-detail-stat::before',
  ':root .world-detail-meta-grid .component-data-field::before',
  ':root .character-detail-derived-stat::before',
  ':root .character-detail-background-section::before',
  ':root .character-attribute-card::before',
  ':root .character-skill-card::before',
  ':root .component-dashboard-progress-card::before',
  ':root .component-dashboard-continue-card::before',
  ':root .component-dashboard-recent-worlds::before',
  ':root .component-dashboard-recent-characters::before',
  ':root .component-dashboard-getting-started::before',
  ':root .component-dashboard-progress-card::after',
  ':root .component-dashboard-continue-card::after',
  ':root .component-dashboard-recent-worlds::after',
  ':root .component-dashboard-recent-characters::after',
  ':root .component-dashboard-getting-started::after',
  ':root .component-about-step::before',
  ':root .component-about-step::after',
]);

const APPROVED_HEADING_RADIAL_SELECTORS = new Set([
  ':root .world-detail-section h2::after',
  ':root .component-collapsible-section [data-testid="collapsible-section-header"][aria-expanded="true"]::after',
  ':root .character-detail-section h2::after',
  ':root .settings-section h2::after',
]);

const EXEMPTED_FUNCTIONAL_PROGRESS_SELECTORS = new Set([
  ':root .wizard-page .wizard-progress-connector',
  ':root .wizard-page .wizard-progress-connector-active',
]);

function extractMatchingSelectors(
  predicate: (rule: Rule, decls: { prop: string; value: string }[]) => boolean
): { file: string; selector: string; decls: { prop: string; value: string }[] }[] {
  const matches: { file: string; selector: string; decls: { prop: string; value: string }[] }[] = [];
  for (const { file, css } of ALL_STYLES) {
    const root = postcss.parse(css, { from: file });
    root.walkRules((rule) => {
      const decls = (rule.nodes?.filter((n) => n.type === 'decl') ?? []) as {
        prop: string;
        value: string;
      }[];
      if (predicate(rule, decls)) {
        for (const sel of rule.selectors) {
          matches.push({
            file,
            selector: sel.replace(/\s+/g, ' ').trim(),
            decls,
          });
        }
      }
    });
  }
  return matches;
}

describe('drafting-mark family', () => {
  it('defines the arm length once, in shared tokens', () => {
    expect(sharedTokensCss).toMatch(/--mark-arm-length:\s*\d+px/);
    expect(appShellCss).not.toMatch(/--mark-arm-length:/);
    expect(dashboardCss).not.toMatch(/--mark-arm-length:/);
    expect(aboutCss).not.toMatch(/--mark-arm-length:/);
  });

  it('permits corner brackets only on approved borderless-card selectors', () => {
    const bracketRules = extractMatchingSelectors((rule, decls) => {
      const isPseudo = rule.selector.includes('::before') || rule.selector.includes('::after');
      const hasMarkArm = decls.some(
        (d) => (d.prop === 'width' || d.prop === 'height') && d.value.includes('--mark-arm-length')
      );
      const hasLBorder = decls.some(
        (d) => d.prop.startsWith('border-') && d.value.includes('1px solid')
      );
      return isPseudo && (hasMarkArm || hasLBorder);
    });

    for (const { selector } of bracketRules) {
      expect(APPROVED_BRACKET_SELECTORS.has(selector)).toBe(true);
    }
    const foundSelectors = new Set(bracketRules.map((r) => r.selector));
    expect(foundSelectors).toEqual(APPROVED_BRACKET_SELECTORS);
  });

  it('permits decorative radial-gradient rules only under approved section headings', () => {
    const radialRules = extractMatchingSelectors((_rule, decls) =>
      decls.some((d) => d.prop === 'background-image' && d.value.includes('radial-gradient'))
    );

    for (const { selector } of radialRules) {
      const isApprovedHeading = APPROVED_HEADING_RADIAL_SELECTORS.has(selector);
      const isExemptedProgress = EXEMPTED_FUNCTIONAL_PROGRESS_SELECTORS.has(selector);
      expect(isApprovedHeading || isExemptedProgress).toBe(true);
    }

    const foundSelectors = new Set(radialRules.map((r) => r.selector));
    const allExpected = new Set([
      ...APPROVED_HEADING_RADIAL_SELECTORS,
      ...EXEMPTED_FUNCTIONAL_PROGRESS_SELECTORS,
    ]);
    expect(foundSelectors).toEqual(allExpected);
  });

  it('asserts no pseudo-element implements registration-cross or dimension-tick patterns', () => {
    const tickOrCrossRules = extractMatchingSelectors((rule, decls) => {
      const isPseudo = rule.selector.includes('::before') || rule.selector.includes('::after');
      if (!isPseudo) return false;

      const hasCross = decls.some(
        (d) => d.prop === 'background-size' && d.value.includes('100% 1px, 1px 100%')
      );
      const hasTicks = decls.some(
        (d) =>
          d.value.includes('linear-gradient') &&
          decls.some((d2) => d2.prop === 'background-size' && d2.value.includes('12px 100%'))
      );
      return hasCross || hasTicks;
    });

    expect(tickOrCrossRules).toEqual([]);
    expect(appShellCss).not.toMatch(/repeating-linear-gradient/);
  });

  it('draws dotted rules at ink weight, not at border weight', () => {
    for (const { selector, decls } of extractMatchingSelectors((_rule, decls) =>
      decls.some((d) => d.prop === 'background-image' && d.value.includes('radial-gradient'))
    )) {
      if (APPROVED_HEADING_RADIAL_SELECTORS.has(selector)) {
        // Assert heading radial-gradients never use border-strong
        const usesBorderStrong = decls.some((d) => d.value.includes('--color-border-strong'));
        expect(usesBorderStrong).toBe(false);
      }
    }
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

const DATA_LABEL_REGEX = /(?:data|meta|metric|stat|snapshot|jumplist|label|badge|allocation)/i;

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

interface SelectorHeadingState {
  selector: string;
  hasMono: boolean;
  hasUppercase: boolean;
  declaresNonMono: boolean;
  declaresNonUppercase: boolean;
  file: string;
}

interface CascadeTrackingState {
  selectorMap: Map<string, SelectorHeadingState>;
  tagMap: Map<string, string>;
}

function createCascadeTrackingState(): CascadeTrackingState {
  return {
    selectorMap: new Map(),
    tagMap: new Map(),
  };
}

function evaluateCascadeViolations(state: CascadeTrackingState): { file: string; selector: string }[] {
  const { selectorMap, tagMap } = state;
  const violations: { file: string; selector: string }[] = [];
  for (const [selector, entry] of selectorMap.entries()) {
    const matchTag = selector.match(/(?:^|\s)(h[1-4])$/);
    const tag = matchTag ? matchTag[1] : null;
    const inheritsMono = Boolean(tag && tagMap.has(tag + ':mono') && !entry.declaresNonMono);
    const inheritsUppercase = Boolean(tag && tagMap.has(tag + ':uppercase') && !entry.declaresNonUppercase);

    if ((entry.hasMono || inheritsMono) && (entry.hasUppercase || inheritsUppercase)) {
      violations.push({
        file: entry.file,
        selector,
      });
    }
  }
  return violations;
}

function findMonoUppercaseHeadingRules(
  cssContent: string,
  filepath = 'inline.css',
  sharedState?: CascadeTrackingState
): { file: string; selector: string }[] {
  const root = postcss.parse(cssContent, { from: filepath });
  const isLocalState = !sharedState;
  const state: CascadeTrackingState = sharedState || createCascadeTrackingState();
  const { selectorMap, tagMap } = state;

  root.walkRules((rule: Rule) => {
    if (rule.selector.includes('::before') || rule.selector.includes('::after')) return;

    let current: Rule | undefined = rule;
    const parentSelectors: string[] = [];
    while (current && current.type === 'rule') {
      parentSelectors.unshift(current.selector);
      current = current.parent as Rule | undefined;
    }
    const rawFull = parentSelectors.join(' ');

    for (const sel of rawFull.split(',')) {
      const normalized = sel
        .replace(/^:root\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!HEADING_SELECTOR_REGEX.test(normalized)) continue;
      if (DATA_LABEL_REGEX.test(normalized)) continue;
      if (normalized.includes('devtools')) continue;

      const declaresMono = rule.nodes?.some(
        (node) =>
          node.type === 'decl' &&
          ((node.prop === 'font-family' && /(?:--font-system|--font-mono|monospace)/.test(node.value)) ||
            (node.prop === 'font' && /(?:--font-system|--font-mono|monospace)/.test(node.value)))
      );
      const declaresUppercase = rule.nodes?.some(
        (node) =>
          node.type === 'decl' &&
          node.prop === 'text-transform' &&
          node.value.includes('uppercase')
      );
      const declaresNonMono = rule.nodes?.some(
        (node) =>
          node.type === 'decl' &&
          ((node.prop === 'font-family' && /(?:--font-interface|--font-narrative)/.test(node.value)) ||
            (node.prop === 'font' && /(?:--font-interface|--font-narrative)/.test(node.value)))
      );
      const declaresNonUppercase = rule.nodes?.some(
        (node) =>
          node.type === 'decl' &&
          node.prop === 'text-transform' &&
          node.value.includes('none')
      );

      if (!declaresMono && !declaresUppercase && !declaresNonMono && !declaresNonUppercase) continue;

      const entry = selectorMap.get(normalized) || {
        selector: normalized,
        hasMono: false,
        hasUppercase: false,
        declaresNonMono: false,
        declaresNonUppercase: false,
        file: filepath,
      };

      if (declaresMono) {
        entry.hasMono = true;
        if (entry.file !== filepath && entry.hasUppercase) {
          entry.file = `${entry.file} + ${filepath}`;
        }
      }
      if (declaresNonMono) {
        entry.hasMono = false;
        entry.declaresNonMono = true;
      }
      if (declaresUppercase) {
        entry.hasUppercase = true;
        if (entry.file !== filepath && entry.hasMono) {
          entry.file = `${entry.file} + ${filepath}`;
        }
      }
      if (declaresNonUppercase) {
        entry.hasUppercase = false;
        entry.declaresNonUppercase = true;
      }
      selectorMap.set(normalized, entry);

      const isBaseTag = /^(h[1-4])$/.test(normalized);
      if (isBaseTag) {
        if (declaresMono) tagMap.set(normalized + ':mono', filepath);
        if (declaresUppercase) tagMap.set(normalized + ':uppercase', filepath);
      }
    }
  });

  if (isLocalState) {
    return evaluateCascadeViolations(state);
  }
  return [];
}

describe('heading typography static guards', () => {

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
    const sharedState = createCascadeTrackingState();
    for (const filepath of targetCssFiles) {
      const css = fs.readFileSync(filepath, 'utf-8');
      findMonoUppercaseHeadingRules(css, path.relative(rootDir, filepath), sharedState);
    }

    const allViolations = evaluateCascadeViolations(sharedState);
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
    expect(violations[0].selector).toBe('.card > h2');
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

  it('catches a heading selector where mono and uppercase are declared in separate rules across the cascade', () => {
    const fixture = `
      .card h2 { font-family: var(--font-system); }
      :root .card h2 { text-transform: uppercase; }
    `;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('.card h2');
  });

  it('catches a heading where base tag has mono and nested rule declares uppercase', () => {
    const fixture = `
      h2 { font-family: var(--font-system); }
      .card h2 { text-transform: uppercase; }
    `;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations.some((v) => v.selector === '.card h2' || v.selector === 'h2')).toBe(true);
  });

  it('catches mono-uppercase on journal detail h4 (no broad exemption)', () => {
    const fixture = `
      .journal-entry-detail h4 {
        font-family: var(--font-system);
        text-transform: uppercase;
      }
    `;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('.journal-entry-detail h4');
  });

  it('does not flag heading where uppercase is declared but font is explicitly DM Sans (non-mono)', () => {
    const fixture = `
      .mobile-nav-section-title {
        font-family: var(--font-interface);
        text-transform: uppercase;
      }
    `;
    const violations = findMonoUppercaseHeadingRules(fixture, 'fixture.css');
    expect(violations).toEqual([]);
  });

  it('catches mono in one file and uppercase in another file across the cascade for the same selector', () => {
    const sharedState = createCascadeTrackingState();
    findMonoUppercaseHeadingRules('.card h2 { font-family: var(--font-system); }', 'src/app/app-shell.css', sharedState);
    findMonoUppercaseHeadingRules('.card h2 { text-transform: uppercase; }', 'src/app/dashboard.css', sharedState);
    const violations = evaluateCascadeViolations(sharedState);
    expect(violations.length).toBe(1);
    expect(violations[0].selector).toBe('.card h2');
    expect(violations[0].file).toContain('app-shell.css + src/app/dashboard.css');
  });
});

