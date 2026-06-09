import { buildBreadcrumbSegments } from '../routeUtils';

describe('buildBreadcrumbSegments', () => {
  const worlds = { 'world-1': { id: 'world-1', name: 'Eldoria' } };
  const characters = {};

  it('returns no segments on the worlds home route', () => {
    expect(buildBreadcrumbSegments('/worlds', worlds, characters, null)).toEqual([]);
  });

  it('builds Worlds > <world name> for a world detail route', () => {
    const segs = buildBreadcrumbSegments('/worlds/world-1', worlds, characters, 'world-1');
    expect(segs.map((s) => s.label)).toEqual(['Worlds', 'Eldoria']);
  });

  it('adds a Settings segment on /settings', () => {
    const segs = buildBreadcrumbSegments('/settings', worlds, characters, null);
    expect(segs.map((s) => s.label)).toEqual(['Worlds', 'Settings']);
    expect(segs[segs.length - 1]).toMatchObject({ label: 'Settings', isCurrentPage: true });
  });

  it('adds Settings > Providers on /settings/providers', () => {
    const segs = buildBreadcrumbSegments('/settings/providers', worlds, characters, null);
    expect(segs.map((s) => s.label)).toEqual(['Worlds', 'Settings', 'Providers']);
    expect(segs[segs.length - 1]).toMatchObject({ label: 'Providers', isCurrentPage: true });
    // The parent Settings crumb should not be marked current
    expect(segs.find((s) => s.label === 'Settings')?.isCurrentPage).toBe(false);
  });
});
