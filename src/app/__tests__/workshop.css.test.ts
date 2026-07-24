import fs from 'fs';
import path from 'path';

const workshopCss = fs.readFileSync(path.join(__dirname, '../workshop.css'), 'utf-8');

describe('workshop.css static checks', () => {
  it('does not use the literal placeholder word "Section" in a section eyebrow (#1577)', () => {
    expect(workshopCss).not.toMatch(/content:\s*"•\s*Section"/);
  });

  it('does not carry the dead three-design-system theme-menu-* rules (#1583)', () => {
    expect(workshopCss).not.toMatch(/\.theme-menu-item-text/);
    expect(workshopCss).not.toMatch(/\.theme-menu-mode/);
    expect(workshopCss).not.toMatch(/\.theme-menu \.header-dropdown-menu\s*\{\s*width:\s*15rem/);
  });
});
