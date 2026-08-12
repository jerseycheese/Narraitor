/**
 * robots.txt and sitemap.xml (#1636).
 *
 * The failure mode worth pinning is drift: a route lands in the sitemap that
 * robots.txt tells crawlers to skip, which is a Search Console warning nobody
 * notices until launch.
 */
import robots from '../robots';
import sitemap from '../sitemap';

const ORIGIN = 'https://narraitor.example';

// getSiteUrl() reads the environment when it's called, not at module load, so
// setting this here is enough to pin the origin for every case below.
beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = ORIGIN;
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('robots', () => {
  it('keeps the app, API, dev harnesses, and Storybook out of the index', () => {
    const { disallow } = robots().rules as { disallow: string[] };

    expect(disallow).toEqual(
      expect.arrayContaining(['/api/', '/dev/', '/settings', '/storybook']),
    );
  });

  it('points at the sitemap with an absolute URL', () => {
    expect(robots().sitemap).toBe(`${ORIGIN}/sitemap.xml`);
  });
});

describe('sitemap', () => {
  it('lists exactly the public marketing routes', () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      ORIGIN,
      `${ORIGIN}/about`,
      `${ORIGIN}/faq`,
      `${ORIGIN}/privacy`,
      `${ORIGIN}/terms`,
    ]);
  });

  it('never lists a URL that robots.txt disallows', () => {
    const { disallow } = robots().rules as { disallow: string[] };

    for (const entry of sitemap()) {
      const { pathname } = new URL(entry.url);
      const blocked = disallow.filter((rule) => pathname.startsWith(rule));

      expect(blocked).toEqual([]);
    }
  });
});
