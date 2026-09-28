/**
 * @file src/constants/guides.ts
 * @desc The docs' guides: slugs, titles and one-line descriptions, in reading order. The bodies
 *       are content/guides/<slug>.mdx; src/app/docs/guides/[guide]/page.tsx loads them.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** The guides, in reading order. */
export const GUIDE_SLUGS = [
  "getting-started",
  "userpage",
  "tournament-forum-post",
  "flags",
  "colors-and-gradients",
  "imagemaps-and-collabs",
  "limits-and-gotchas",
] as const;

/** One of GUIDE_SLUGS. */
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

/** Each guide's title and description. */
export const GUIDES: Readonly<Record<GuideSlug, { title: string; description: string }>> = {
  "getting-started": {
    title: "Getting started",
    description: "How osu! BBCode works, and how to write it in bb's editor.",
  },
  userpage: {
    title: "Your userpage",
    description: "Build a me! page that reads well: a header, sections in boxes, and links.",
  },
  "tournament-forum-post": {
    title: "A tournament forum post",
    description: "Lay out the information, schedule, rules, staff and mappools of a tournament.",
  },
  flags: {
    title: "Flags",
    description: "Put country flags next to names, and what to do if a flag doesn't show.",
  },
  "colors-and-gradients": {
    title: "Colors and gradients",
    description: "Pick colors people can read, and what a gradient costs in characters.",
  },
  "imagemaps-and-collabs": {
    title: "Imagemaps and collabs",
    description: "Make parts of an image clickable, as collab banners do.",
  },
  "limits-and-gotchas": {
    title: "Limits and gotchas",
    description: "The 60,000 character limit, and the mistakes that turn tags into text.",
  },
};

/**
 * @function isGuideSlug
 * @param value {string} untrusted route segment
 * @returns {boolean} true only for a guide's slug
 */
export const isGuideSlug = (value: string): value is GuideSlug =>
  (GUIDE_SLUGS as readonly string[]).includes(value);
