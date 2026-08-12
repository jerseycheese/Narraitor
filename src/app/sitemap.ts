import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/constants/site';

/**
 * The public routes worth indexing (#1636) — every server-rendered page that
 * has real content. /welcome is excluded because it redirects, and everything
 * robots.ts disallows is excluded so the two files can't contradict each other.
 *
 * No lastModified: a build-time Date churns on every deploy for no signal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
