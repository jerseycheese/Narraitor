import fs from 'fs';
import path from 'path';

/**
 * Root metadata static checks (#1636).
 *
 * Read as source rather than imported: layout.tsx pulls in next/font/google and
 * the whole provider stack, which is a lot of mocking to assert an object
 * literal. What's worth pinning is the regression — the description that leads
 * with "using AI", which #1421 rejected on the landing page.
 */
const layoutSource = fs.readFileSync(path.join(__dirname, '../layout.tsx'), 'utf-8');

describe('root layout metadata', () => {
  it('has dropped the retired "using AI" description', () => {
    expect(layoutSource).not.toMatch(/A narrative-driven RPG framework using AI/);
  });

  it('declares the share metadata the public launch needs', () => {
    expect(layoutSource).toMatch(/metadataBase:\s*new URL\(getSiteUrl\(\)\)/);
    expect(layoutSource).toMatch(/template:\s*'%s — Narraitor'/);
    expect(layoutSource).toMatch(/openGraph:/);
    expect(layoutSource).toMatch(/twitter:/);
  });
});
