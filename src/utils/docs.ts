/**
 * @file src/utils/docs.ts
 * @desc The docs' index: a URL slug for every tag in @haruhimemoe/bbcode's TAGS (the list item
 *       `*` is "list-item"), the tag behind a slug, every guide and tag as one searchable list,
 *       and the search over it (title, tag name, aliases and description). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";
import { GUIDE_SLUGS, GUIDES } from "@/constants/guides";
import { TAG_DOCS } from "@/constants/tag-docs";

/** One entry of the docs' index. */
export type DocsEntry = {
  kind: "guide" | "tag";
  href: string;
  title: string;
  /** The tag as written, `[b]`, for tags. */
  tag?: string;
  description: string;
  /** Extra words search matches: tag name and aliases. */
  keywords: string[];
};

/**
 * @function tagSlug
 * @param name {string} a TAGS name
 * @returns {string} its docs slug
 */
export const tagSlug = (name: string): string => (name === "*" ? "list-item" : name);

/**
 * @function tagBySlug
 * @param slug {string} untrusted route segment
 * @returns {TagSpec | undefined} the tag it names
 */
export const tagBySlug = (slug: string): TagSpec | undefined =>
  TAGS.find((tag) => tagSlug(tag.name) === slug);

/**
 * @function tagDescription
 * @param tag {TagSpec} a tag
 * @returns {string} its TAGS description as plain text (the Markdown backticks dropped)
 */
export const tagDescription = (tag: TagSpec): string => tag.description.replace(/`/g, "");

/**
 * @function tagTitle
 * @param tag {TagSpec} a tag
 * @returns {string} its docs title, "Bold"
 */
export const tagTitle = (tag: TagSpec): string => TAG_DOCS[tag.name]?.title ?? tag.name;

/**
 * @function docsEntries
 * @returns {DocsEntry[]} every guide, then every tag in TAGS order
 */
export const docsEntries = (): DocsEntry[] => [
  ...GUIDE_SLUGS.map((slug) => ({
    kind: "guide" as const,
    href: `/docs/guides/${slug}`,
    title: GUIDES[slug].title,
    description: GUIDES[slug].description,
    keywords: [],
  })),
  ...TAGS.map((tag) => ({
    kind: "tag" as const,
    href: `/docs/tags/${tagSlug(tag.name)}`,
    title: tagTitle(tag),
    tag: `[${tag.name}]`,
    description: tagDescription(tag),
    keywords: [tag.name, ...tag.aliases],
  })),
];

/** How well one typed word fits an entry: 0 names the tag, 1 starts a title word, 2 is inside. */
const wordFit = (entry: DocsEntry, word: string): number | null => {
  if (entry.keywords.includes(word)) return 0;
  if (
    entry.title
      .toLowerCase()
      .split(/\s+/)
      .some((part) => part.startsWith(word))
  )
    return 1;
  const haystack = [entry.title, entry.description, ...entry.keywords].join(" ").toLowerCase();
  return word.length > 1 && haystack.includes(word) ? 2 : null;
};

/**
 * @function searchDocs
 * @param entries {readonly DocsEntry[]} the index
 * @param query {string} what was typed
 * @returns {DocsEntry[]} the entries every word of the query fits (a tag's name or alias, the
 *          start of a title word, or, for words of two letters or more, anywhere in the title or
 *          description), best fits first; brackets, slashes and case are ignored, and a blank
 *          query returns everything
 */
export const searchDocs = (entries: readonly DocsEntry[], query: string): DocsEntry[] => {
  const words = query
    .toLowerCase()
    .replace(/[[\]/=]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [...entries];
  return entries
    .map((entry) => ({ entry, fits: words.map((word) => wordFit(entry, word)) }))
    .filter(({ fits }) => fits.every((one) => one !== null))
    .map(({ entry, fits }) => ({ entry, score: Math.max(...(fits as number[])) }))
    .sort((a, b) => a.score - b.score)
    .map(({ entry }) => entry);
};
