/**
 * @file src/lib/guide-source.ts
 * @desc The docs as Markdown parts ({ title, url, markdown }) for the .md mirrors and
 *       /llms-full.txt: guides read from content/guides and converted, tag pages written from
 *       TAGS. The routes using these are static, so the files are read at build time.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";
import type { LlmsFullPart } from "@haruhimemoe/next-kit/seo";
import { GUIDE_SLUGS, GUIDES, type GuideSlug } from "@/constants/guides";
import { SITE } from "@/constants/site";
import { tagSlug } from "@/utils/docs";
import { mdxToMarkdown, tagMarkdown, tagMarkdownTitle } from "@/utils/docs-markdown";

/**
 * @function guidePart
 * @param slug {GuideSlug} a guide
 * @returns {LlmsFullPart} its title, page URL and Markdown (lead, last update, body)
 */
export const guidePart = (slug: GuideSlug): LlmsFullPart => {
  const guide = GUIDES[slug];
  const mdx = readFileSync(path.join(process.cwd(), "content", "guides", `${slug}.mdx`), "utf8");
  return {
    title: guide.title,
    url: `${SITE.url}/docs/guides/${slug}`,
    markdown: `${guide.description}\n\nLast updated ${guide.lastUpdated}.\n\n${mdxToMarkdown(mdx)}`,
  };
};

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
 * @function allDocsParts
 * @returns {LlmsFullPart[]} every guide in reading order, then every tag in TAGS order
 */
export const allDocsParts = (): LlmsFullPart[] => [
  ...GUIDE_SLUGS.map(guidePart),
  ...TAGS.map(tagPart),
];
