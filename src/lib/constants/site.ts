/**
 * Public site identity and origin (#1636).
 *
 * SERVER-ONLY. `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` carry no
 * `NEXT_PUBLIC_` prefix, so Next never inlines them into client bundles — a
 * `'use client'` module importing `getSiteUrl()` would silently fall through to
 * localhost in the browser. Everything that needs this (metadataBase, robots,
 * sitemap) is server-rendered.
 */

export const SITE_NAME = 'Narraitor';

const DEFAULT_LOCAL_PORT = '3000';

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const toHttpsOrigin = (host: string): string =>
  stripTrailingSlash(`https://${host.replace(/^https?:\/\//, '')}`);

/**
 * Absolute origin for this deployment. Read at call time rather than module
 * load so the value tracks the environment the caller actually runs in.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is checked before `VERCEL_URL` because the
 * latter is deployment-unique (narraitor-a1b2c3-jack.vercel.app) and would bake
 * a throwaway hostname into every canonical and sitemap entry. Next's own
 * social-image fallback orders these the same way.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return toHttpsOrigin(productionHost);

  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (deploymentHost) return toHttpsOrigin(deploymentHost);

  // robots.txt, the sitemap, and every canonical are generated at build time,
  // so a localhost origin here would be published permanently. On Vercel one of
  // the hosts above is always set; anywhere else, refuse rather than ship a
  // dead URL to crawlers.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL must be set for a production build — without it, robots.txt, the sitemap, and every canonical link would publish a localhost URL.',
    );
  }

  // Worktrees each run the dev server on their own port, so read it rather
  // than assume 3000 — otherwise local sitemap and canonical output is a lie.
  return `http://localhost:${process.env.PORT?.trim() || DEFAULT_LOCAL_PORT}`;
}
