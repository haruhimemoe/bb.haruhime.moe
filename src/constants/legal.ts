/**
 * @file src/constants/legal.ts
 * @desc Legal document registry: slugs, titles, descriptions, last-updated dates. The MDX bodies
 *       live in content/legal/<slug>.mdx. Bump lastUpdated in the same commit as any wording
 *       change.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** The legal pages, by slug. */
export const LEGAL_SLUGS = ["privacy", "terms"] as const;

/** One of LEGAL_SLUGS. */
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/** Each legal page's title, description and last update. */
export const LEGAL_DOCS: Record<
  LegalSlug,
  { title: string; description: string; lastUpdated: string }
> = {
  privacy: {
    title: "Privacy",
    description: "What bb.haruhime.moe stores, why, and for how long.",
    lastUpdated: "2026-09-28",
  },
  terms: {
    title: "Terms",
    description: "The rules for signing in and sharing templates on bb.haruhime.moe.",
    lastUpdated: "2026-09-28",
  },
};

/**
 * @function isLegalSlug
 * @param value {string} untrusted route segment
 * @returns {boolean} true only for an exact registered slug
 */
export const isLegalSlug = (value: string): value is LegalSlug =>
  (LEGAL_SLUGS as readonly string[]).includes(value);
