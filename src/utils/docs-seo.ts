/**
 * @file src/utils/docs-seo.ts
 * @desc Search titles, descriptions and JSON-LD for the docs: each guide (TechArticle with its
 *       last update, and breadcrumbs), each tag page (TechArticle about the tag, generated from
 *       the tag's data, and breadcrumbs) and the docs' front page (the FAQ and the guides as an
 *       ItemList). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import { clampDescription, type LdGraph, ld } from "@haruhimemoe/next-kit/seo";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { GUIDE_SLUGS, GUIDES, type GuideSlug } from "@/constants/guides";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { TAG_DOCS_UPDATED } from "@/constants/tag-docs";
import { tagDescription, tagSlug, tagTitle } from "@/utils/docs";

const DOCS_CRUMBS = [
  { name: "bb", path: "/" },
  { name: "Docs", path: "/docs" },
] as const;

/**
 * @function guideLd
 * @param slug {GuideSlug} a guide
 * @returns {LdGraph} its TechArticle (with dateModified) and breadcrumbs
 */
export const guideLd = (slug: GuideSlug): LdGraph => {
  const guide = GUIDES[slug];
  const path = `/docs/guides/${slug}`;
  return ld.graph(
    ld.techArticle(SEO_SITE, {
      path,
      headline: guide.title,
      description: guide.summary,
      dateModified: guide.lastUpdated,
      about: "osu! BBCode",
    }),
    ld.breadcrumbs(SEO_SITE, [...DOCS_CRUMBS, { name: guide.title, path }]),
  );
};

/**
 * @function tagSeoTitle
 * @param tag {TagSpec} a tag
 * @returns {string} its search title, "osu! [imagemap] tag: syntax and examples"
 */
export const tagSeoTitle = (tag: TagSpec): string => `osu! [${tag.name}] tag: syntax and examples`;

/**
 * @function tagSeoDescription
 * @param tag {TagSpec} a tag
 * @returns {string} its meta description: what it does, then what the page has, at most 160
 *          characters
 */
export const tagSeoDescription = (tag: TagSpec): string =>
  clampDescription(
    `[${tag.name}] in osu! BBCode: ${tagDescription(tag)} The syntax, an example you can edit, and what makes osu! show it as text.`,
  );

/**
 * @function tagLd
 * @param tag {TagSpec} a tag
 * @returns {LdGraph} its TechArticle (about the tag, with dateModified) and breadcrumbs
 */
export const tagLd = (tag: TagSpec): LdGraph => {
  const path = `/docs/tags/${tagSlug(tag.name)}`;
  const name = `[${tag.name}] ${tagTitle(tag)}`;
  return ld.graph(
    ld.techArticle(SEO_SITE, {
      path,
      headline: `The osu! BBCode [${tag.name}] tag`,
      description: tagSeoDescription(tag),
      dateModified: TAG_DOCS_UPDATED,
      about: `osu! BBCode [${tag.name}] tag`,
    }),
    ld.breadcrumbs(SEO_SITE, [...DOCS_CRUMBS, { name, path }]),
  );
};

/**
 * @function docsLd
 * @returns {LdGraph} the docs' FAQPage (the questions shown on /docs) and the guides as an
 *          ItemList
 */
export const docsLd = (): LdGraph =>
  ld.graph(
    ld.faq(DOCS_FAQ.map(({ question, answer }) => ({ q: question, a: answer }))),
    ld.itemList(
      SEO_SITE,
      GUIDE_SLUGS.map((slug) => ({ name: GUIDES[slug].title, path: `/docs/guides/${slug}` })),
      { name: "osu! BBCode guides" },
    ),
    ld.breadcrumbs(SEO_SITE, [DOCS_CRUMBS[0], { name: "Docs", path: PAGE_SEO.docs.path }]),
  );
