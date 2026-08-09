import fs from 'fs';
import path from 'path';

const appShellCss = fs.readFileSync(path.join(__dirname, '../app-shell.css'), 'utf-8');
const dashboardCss = fs.readFileSync(path.join(__dirname, '../dashboard.css'), 'utf-8');
const aboutCss = fs.readFileSync(path.join(__dirname, '../about.css'), 'utf-8');
const wizardCss = fs.readFileSync(path.join(__dirname, '../wizard.css'), 'utf-8');
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

  it('does not carry the dead three-design-system theme-menu-* rules (#1583)', () => {
    expect(appShellCss).not.toMatch(/\.theme-menu-item-text/);
    expect(appShellCss).not.toMatch(/\.theme-menu-mode/);
    expect(appShellCss).not.toMatch(/\.theme-menu \.header-dropdown-menu\s*\{\s*width:\s*15rem/);
  });

  it('does not carry the retired workshop shell (#1655)', () => {
    expect(appShellCss).not.toMatch(/\.workshop-(sidebar|context-header|workspace)/);
    expect(appShellCss).not.toMatch(/\.app-surface-workshop/);
  });
});
