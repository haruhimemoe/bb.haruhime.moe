/**
 * @file src/constants/guides.ts
 * @desc The docs' guides: slugs, titles, descriptions, search titles and last updates, in
 *       reading order. The bodies are content/guides/<slug>.mdx;
 *       src/app/docs/guides/[guide]/page.tsx loads them.
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

/** A guide's page title, one-line lead, search title and description, and last update. */
export type Guide = {
  /** The H1 and the docs' list. */
  title: string;
  /** The lead under the H1 and the docs' list. */
  description: string;
  /** The <title> keyword, before " · bb.haruhime.moe": shaped like the search it answers. */
  seoTitle: string;
  /** The meta description, 140 to 160 characters. */
  summary: string;
  /** YYYY-MM-DD. Bump it with any change to the guide's text. */
  lastUpdated: string;
};

/** Each guide's titles, descriptions and last update. */
export const GUIDES: Readonly<Record<GuideSlug, Guide>> = {
  "getting-started": {
    title: "Getting started",
    description: "How osu! BBCode works, and how to write it in bb's editor.",
    seoTitle: "What is osu! BBCode? Getting started",
    summary:
      "osu! BBCode is the tag markup osu! uses for userpages, forum posts and beatmap descriptions. How tags and arguments work, and how to write them in bb's editor.",
    lastUpdated: "2026-09-28",
  },
  userpage: {
    title: "How to make an osu! userpage",
    description: "Build a me! page that reads well: a header, sections in boxes, and links.",
    seoTitle: "How to make an osu! userpage (me! page)",
    summary:
      "Build an osu! userpage (the me! section) in BBCode: a centred header, sections in boxes, profile links, images, and colors that read well on osu!'s dark page.",
    lastUpdated: "2026-09-28",
  },
  "tournament-forum-post": {
    title: "A tournament forum post",
    description: "Lay out the information, schedule, rules, staff and mappools of a tournament.",
    seoTitle: "How to write an osu! tournament forum post",
    summary:
      "Lay out an osu! tournament forum post in BBCode: a banner, a deadline notice, and boxes for information, schedule, rules, staff and each round's mappool.",
    lastUpdated: "2026-09-28",
  },
  flags: {
    title: "Flags",
    description: "Put country flags next to names, and what to do if a flag doesn't show.",
    seoTitle: "osu! BBCode flags: add a country flag",
    summary:
      "osu! has no flag tag: a flag is an [img] of osu!'s own flag image. The small PNG and current SVG flags, player lists with flags, and what each flag costs.",
    lastUpdated: "2026-09-28",
  },
  "colors-and-gradients": {
    title: "Colors and gradients",
    description: "Pick colors people can read, and what a gradient costs in characters.",
    seoTitle: "osu! BBCode colors and gradient text",
    summary:
      "Use [color] in osu! BBCode with hex codes or names, keep text readable on osu!'s dark background, and see what gradient text costs toward the 60,000 limit.",
    lastUpdated: "2026-09-28",
  },
  "imagemaps-and-collabs": {
    title: "Imagemaps and collabs",
    description: "Make parts of an image clickable, as collab banners do.",
    seoTitle: "osu! imagemap collab banners, step by step",
    summary:
      "How osu!'s [imagemap] works: the line format, positions in percent, links and titles, why osu! shows one as text, and how to make a clickable collab banner.",
    lastUpdated: "2026-09-28",
  },
  "limits-and-gotchas": {
    title: "Limits and gotchas",
    description: "The 60,000 character limit, and the mistakes that turn tags into text.",
    seoTitle: "osu! userpage character limit and gotchas",
    summary:
      "osu! userpages, forum posts and beatmap descriptions hold 60,000 characters. What eats them fastest, and the mistakes that make osu! show a tag as plain text.",
    lastUpdated: "2026-09-28",
  },
};

/**
 * @function isGuideSlug
 * @param value {string} untrusted route segment
 * @returns {boolean} true only for a guide's slug
 */
export const isGuideSlug = (value: string): value is GuideSlug =>
  (GUIDE_SLUGS as readonly string[]).includes(value);
