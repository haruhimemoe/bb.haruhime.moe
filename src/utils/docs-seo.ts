/**
 * @file src/utils/docs-seo.ts
 * @desc Search titles, descriptions and JSON-LD for the docs: each docs, guides and legal page
 *       (TechArticle with its last update, and breadcrumbs), each tag page (TechArticle about the tag, generated from
 *       the tag's data, and breadcrumbs) and the docs' front page (the FAQ and the guides as an
 *       ItemList). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import {
  type ContentEntry,
  type ContentSection,
  contentPath,
  SECTION_LABELS,
} from "@haruhimemoe/next-kit/docs";
import { clampDescription, type LdGraph, ld } from "@haruhimemoe/next-kit/seo";
import { CONTENT } from "@/constants/content";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { TAG_DOCS_UPDATED } from "@/constants/tag-docs";
import { tagDescription, tagSlug, tagTitle } from "@/utils/docs";

const DOCS_CRUMBS = [
  { name: "bb", path: "/" },
  { name: "Docs", path: "/docs" },
] as const;

/**
 * @function contentLd
 * @param section {ContentSection} the section the page lives under
 * @param entry {ContentEntry} the page's registry entry
 * @returns {LdGraph} its TechArticle (with dateModified) and breadcrumbs (bb, the section, the
 *          page)
 */
export const contentLd = (section: ContentSection, entry: ContentEntry): LdGraph => {
  const path = contentPath(section, entry.slug);
  return ld.graph(
    ld.techArticle(SEO_SITE, {
      path,
      headline: entry.title,
      description: entry.description,
      dateModified: entry.lastUpdated,
      about: "osu! BBCode",
    }),
    ld.breadcrumbs(SEO_SITE, [
      DOCS_CRUMBS[0],
      { name: SECTION_LABELS[section], path: `/${section}` },
      { name: entry.title, path },
    ]),
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
      CONTENT.entries.guides.map((entry) => ({
        name: entry.title,
        path: contentPath("guides", entry.slug),
      })),
      { name: "osu! BBCode guides" },
    ),
    ld.breadcrumbs(SEO_SITE, [DOCS_CRUMBS[0], { name: "Docs", path: PAGE_SEO.docs.path }]),
  );
