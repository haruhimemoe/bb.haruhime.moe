/**
 * @file src/utils/docs-markdown.ts
 * @desc The docs as plain Markdown for assistants: the transform that turns a guide's live
 *       `<Example source={"..."} />` into a fenced bbcode block (passed to next-kit's
 *       readContentMarkdown with the site's origin), a tag page written from TAGS and TAG_DOCS
 *       (what it does, facts, syntax, an example, what to watch for) and the docs' questions.
 *       These back the .md mirrors and /llms-full.txt. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import type { LlmsFullPart } from "@haruhimemoe/next-kit/seo";
import { mdxMarkdownTransforms } from "@haruhimemoe/ui/remark";
import type { DocsFaqItem } from "@/constants/docs-faq";
import { SITE } from "@/constants/site";
import { TAG_DOCS } from "@/constants/tag-docs";
import { tagDescription, tagSlug, tagTitle } from "@/utils/docs";

const EXAMPLE = /<Example\s+source=\{("(?:[^"\\]|\\.)*")\}\s*\/>/g;

const fence = (source: string): string => `\`\`\`bbcode\n${source}\n\`\`\``;

/**
 * @function exampleFences
 * @param mdx {string} a guide's raw MDX source
 * @returns {string} the same text with every live `<Example source={"..."} />` as a fenced
 *          bbcode block (next-kit's mdxToMarkdown runs it first, as a transform)
 */
export const exampleFences = (mdx: string): string =>
  mdx.replace(EXAMPLE, (_, literal: string) => fence(JSON.parse(literal) as string));

/** What readContentMarkdown takes for every bb page: the site's origin, the Example fence and
 * ui's figure/embed transforms (so `<Figure>`/`<Embed>` render as plain Markdown figures/links). */
export const MARKDOWN_OPTIONS = {
  siteUrl: SITE.url,
  transforms: [exampleFences, ...mdxMarkdownTransforms],
} as const;

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
 * @function tagPart
 * @param tag {TagSpec} a tag
 * @returns {LlmsFullPart} its title, page URL and reference as Markdown
 */
export const tagPart = (tag: TagSpec): LlmsFullPart => ({
  title: tagMarkdownTitle(tag),
  url: `${SITE.url}/docs/tags/${tagSlug(tag.name)}`,
  markdown: tagMarkdown(tag),
});

/**
 * @function faqMarkdown
 * @param items {readonly DocsFaqItem[]} the docs' questions
 * @returns {string} each question as a ### heading with its answer
 */
export const faqMarkdown = (items: readonly DocsFaqItem[]): string =>
  items.map(({ question, answer }) => `### ${question}\n\n${answer}`).join("\n\n");
