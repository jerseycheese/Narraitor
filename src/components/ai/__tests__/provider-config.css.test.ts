import fs from 'fs';
import path from 'path';

const providerConfigCss = fs.readFileSync(path.join(__dirname, '../provider-config.css'), 'utf-8');
const sharedTokensCss = fs.readFileSync(
  path.join(__dirname, '../../../lib/theme/themes/_shared-tokens.css'),
  'utf-8'
);

/** The declaration block for a selector, up to its closing brace. */
function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) return '';
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open, close);
}

describe('provider settings width', () => {
  it('names the form width in the shared page-width scale', () => {
    expect(sharedTokensCss).toMatch(/--page-width-form:\s*\d+(\.\d+)?rem;/);
  });

  it('caps the providers page from the token rather than a literal width', () => {
    const rule = ruleFor(providerConfigCss, '.component-providers-page');
    expect(rule).toMatch(/max-width:\s*var\(--page-width-form\)/);
    expect(rule).not.toMatch(/max-width:\s*\d+(\.\d+)?(rem|px)/);
  });

  describe('v1.8 nested border rules (#2171)', () => {
    it('does not draw a 1px border on preset cards inside the wizard', () => {
      const rule = ruleFor(providerConfigCss, '.provider-preset {');
      expect(rule).toMatch(/border:\s*none;/);
      expect(rule).not.toMatch(/border:\s*1px\s+solid/);
    });

    it('does not draw a 1px border on the key reveal toggle', () => {
      const rule = ruleFor(providerConfigCss, '.provider-key-reveal {');
      expect(rule).toMatch(/border:\s*none;/);
      expect(rule).not.toMatch(/border:\s*1px\s+solid/);
    });

    it('does not draw a 1px border on the verify status block', () => {
      const rule = ruleFor(providerConfigCss, '.provider-verify-status {');
      expect(rule).not.toMatch(/border:\s*1px\s+solid/);
    });
  });
});
