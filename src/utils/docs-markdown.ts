/**
 * @file src/utils/docs-markdown.ts
 * @desc The docs as plain Markdown for assistants: a guide's MDX with each live
 *       `<Example source={"..."} />` turned into a fenced bbcode block and its relative links
 *       made absolute, and a tag page written from TAGS and TAG_DOCS (what it does, facts,
 *       syntax, an example, what to watch for), and the docs' questions. These back
 *       /docs/.../<page>.md and /llms-full.txt. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import type { DocsFaqItem } from "@/constants/docs-faq";
import { SITE } from "@/constants/site";
import { TAG_DOCS } from "@/constants/tag-docs";
import { tagDescription, tagTitle } from "@/utils/docs";

const EXAMPLE = /<Example\s+source=\{("(?:[^"\\]|\\.)*")\}\s*\/>/g;

const fence = (source: string): string => `\`\`\`bbcode\n${source}\n\`\`\``;

/**
 * @function mdxToMarkdown
 * @param mdx {string} a guide's MDX source
 * @returns {string} the same text with every live example as a fenced bbcode block and every
 *          site-relative link ("](/docs/...)") made absolute
 */
export const mdxToMarkdown = (mdx: string): string =>
  mdx
    .replace(EXAMPLE, (_, literal: string) => fence(JSON.parse(literal) as string))
    .replace(/\]\(\//g, `](${SITE.url}/`)
    .trim();

/**
 * @function tagMarkdown
 * @param tag {TagSpec} a tag
 * @returns {string} its reference as Markdown: description, facts, syntax, example and gotchas
 */
export const tagMarkdown = (tag: TagSpec): string => {
  const docs = TAG_DOCS[tag.name];
  const facts = [
    tag.display === "block" ? "Block tag" : "Inline tag",
    tag.singleLine ? "opens and closes on one line" : null,
    tag.content === "raw" ? "content shown as written" : null,
    tag.arg === "required"
      ? "needs an argument"
      : tag.arg === "optional"
        ? "optional argument"
        : null,
    ...tag.aliases.map((alias) => `also written [${alias}]`),
  ].filter((fact): fact is string => fact !== null);
  const parts = [
    tagDescription(tag),
    `${facts.join(", ")}.`,
    "## Syntax",
    (docs?.syntax ?? [tag.example]).map(fence).join("\n\n"),
    "## Example",
    fence(docs?.example ?? tag.example),
  ];
  if (docs && docs.gotchas.length > 0) {
    parts.push("## Good to know", docs.gotchas.map((line) => `- ${line}`).join("\n"));
  }
  return parts.join("\n\n");
};

/**
 * @function tagMarkdownTitle
 * @param tag {TagSpec} a tag
 * @returns {string} its Markdown page title, "The osu! BBCode [b] tag (Bold)"
 */
export const tagMarkdownTitle = (tag: TagSpec): string =>
  `The osu! BBCode [${tag.name}] tag (${tagTitle(tag)})`;

/**
 * @function faqMarkdown
 * @param items {readonly DocsFaqItem[]} the docs' questions
 * @returns {string} each question as a ### heading with its answer
 */
export const faqMarkdown = (items: readonly DocsFaqItem[]): string =>
  items.map(({ question, answer }) => `### ${question}\n\n${answer}`).join("\n\n");
