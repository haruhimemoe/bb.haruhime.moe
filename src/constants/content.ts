/**
 * @file src/constants/content.ts
 * @desc The content registry (next-kit's defineContent): the docs page (the API), the guides in
 *       reading order and the legal pages (content/<section>/<slug>.mdx), each with its title,
 *       description and last update, plus every tag page from @haruhimemoe/bbcode's TAGS as a
 *       docs extra (group "Tags", at /docs/tags/<tag> with its .md mirror). Pages, .md mirrors,
 *       nav, search, sitemap and both llms files read it. Bump an entry's lastUpdated in the same
 *       commit as its text.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { defineContent } from "@haruhimemoe/next-kit/docs";
import { TAG_DOCS_UPDATED } from "@/constants/tag-docs";
import { tagDescription, tagSlug, tagTitle } from "@/utils/docs";

/** The nav group the tag pages sit under on /docs. */
export const TAGS_GROUP = "Tags";

/** Each guide's search title (before " · bb.haruhime.moe"), shaped like the search it answers. */
export const GUIDE_SEO_TITLES: Readonly<Record<string, string>> = {
  "getting-started": "What is osu! BBCode? Getting started",
  userpage: "How to make an osu! userpage (me! page)",
  "tournament-forum-post": "How to write an osu! tournament forum post",
  flags: "osu! BBCode flags: add a country flag",
  "colors-and-gradients": "osu! BBCode colors and gradient text",
  "imagemaps-and-collabs": "osu! imagemap collab banners, step by step",
  "limits-and-gotchas": "osu! userpage character limit and gotchas",
};

/** Every docs, guides and legal page, and the tag pages as docs extras. */
export const CONTENT = defineContent({
  docs: [
    {
      slug: "api",
      title: "API",
      description:
        "The bb.haruhime.moe API for scripts and bots: hbb_ keys from your account page, the rate limits, GET /api/v1/me with a curl example and the OpenAPI document.",
      lastUpdated: "2026-10-04",
    },
  ],
  guides: [
    {
      slug: "getting-started",
      title: "Getting started",
      description:
        "osu! BBCode is the tag markup osu! uses for userpages, forum posts and beatmap descriptions. How tags and arguments work, and how to write them in bb's editor.",
      lastUpdated: "2026-10-04",
    },
    {
      slug: "userpage",
      title: "How to make an osu! userpage",
      navTitle: "osu! userpage",
      description:
        "Build an osu! userpage (the me! section) in BBCode: a centred header, sections in boxes, profile links, images, and colors that read well on osu!'s dark page.",
      lastUpdated: "2026-09-28",
    },
    {
      slug: "tournament-forum-post",
      title: "A tournament forum post",
      description:
        "Lay out an osu! tournament forum post in BBCode: a banner, a deadline notice, and boxes for information, schedule, rules, staff and each round's mappool.",
      lastUpdated: "2026-10-04",
    },
    {
      slug: "flags",
      title: "Flags",
      description:
        "osu! has no flag tag: a flag is an [img] of osu!'s own flag image. The small PNG and current SVG flags, player lists with flags, and what each flag costs.",
      lastUpdated: "2026-09-28",
    },
    {
      slug: "colors-and-gradients",
      title: "Colors and gradients",
      description:
        "Use [color] in osu! BBCode with hex codes or names, keep text readable on osu!'s dark background, and see what gradient text costs toward the 60,000 limit.",
      lastUpdated: "2026-09-28",
    },
    {
      slug: "imagemaps-and-collabs",
      title: "Imagemaps and collabs",
      description:
        "How osu!'s [imagemap] works: the line format, positions in percent, links and titles, why osu! shows one as text, and how to make a clickable collab banner.",
      lastUpdated: "2026-09-28",
    },
    {
      slug: "limits-and-gotchas",
      title: "Limits and gotchas",
      description:
        "osu! userpages, forum posts and beatmap descriptions hold 60,000 characters. What eats them fastest, and the mistakes that make osu! show a tag as plain text.",
      lastUpdated: "2026-09-28",
    },
  ],
  legal: [
    {
      slug: "privacy",
      title: "Privacy",
      description: "What bb.haruhime.moe stores, why, and for how long.",
      lastUpdated: "2026-10-05",
    },
    {
      slug: "terms",
      title: "Terms",
      description: "The rules for signing in and sharing templates on bb.haruhime.moe.",
      lastUpdated: "2026-09-28",
    },
  ],
  extra: {
    docs: TAGS.map((tag) => {
      const slug = tagSlug(tag.name);
      return {
        href: `/docs/tags/${slug}`,
        title: `[${tag.name}] ${tagTitle(tag)}`,
        navTitle: tagTitle(tag),
        description: tagDescription(tag),
        group: TAGS_GROUP,
        badge: `[${tag.name}]`,
        lastUpdated: TAG_DOCS_UPDATED,
        markdownHref: `/docs/tags/${slug}.md`,
      };
    }),
  },
});
