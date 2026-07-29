import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/constants/site';

/**
 * Crawl rules for the public site (#1636).
 *
 * Only the four server-rendered marketing routes carry indexable content. The
 * app surfaces are client components reading from local storage, so a crawler
 * would index an empty shell; /storybook is a full static Storybook build that
 * vercel.json rewrites into production and would otherwise swamp the index.
 *
 * /welcome is deliberately allowed — it 308s to /, and blocking it would stop
 * crawlers seeing the redirect at all.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dev/',
        '/dashboard',
        '/worlds',
        '/characters',
        '/play',
        '/settings',
        '/storybook',
        '/storybook-static',
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
