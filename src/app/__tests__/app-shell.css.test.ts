import fs from 'fs';
import path from 'path';

const appShellCss = fs.readFileSync(path.join(__dirname, '../app-shell.css'), 'utf-8');

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
