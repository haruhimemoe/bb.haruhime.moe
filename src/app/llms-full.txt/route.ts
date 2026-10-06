/**
 * @file src/app/llms-full.txt/route.ts
 * @desc GET /llms-full.txt: all of the docs in one Markdown file for AI assistants, from
 *       next-kit's contentLlmsFull over the content registry: the API docs, every guide (live
 *       examples as fenced bbcode blocks) and the legal pages (their `<YourRights />`-style
 *       blocks rendered as real Markdown via LEGAL_MARKDOWN_OPTIONS), then every tag page and
 *       the common questions. Built at deploy.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { contentLlmsFull } from "@haruhimemoe/next-kit/docs";
import { readContentMarkdown } from "@haruhimemoe/next-kit/docs/files";
import { textResponse } from "@haruhimemoe/next-kit/seo";
import { CONTENT } from "@/constants/content";
import { DOCS_FAQ, DOCS_INTRO } from "@/constants/docs-faq";
import { SEO_SITE } from "@/constants/seo";
import { SITE } from "@/constants/site";
import {
  faqMarkdown,
  LEGAL_MARKDOWN_OPTIONS,
  MARKDOWN_OPTIONS,
  tagPart,
} from "@/utils/docs-markdown";

/** Built once, at deploy. */
export const dynamic = "force-static";

/**
 * @function GET
 * @returns {Promise<Response>} every docs page as one Markdown file
 */
export async function GET() {
  const body = await contentLlmsFull({
    site: SEO_SITE,
    title: `${SITE.title} docs: the osu! BBCode reference`,
    summary: DOCS_INTRO,
    content: CONTENT,
    read: (section, slug) =>
      readContentMarkdown(
        CONTENT,
        section,
        slug,
        section === "legal" ? LEGAL_MARKDOWN_OPTIONS : MARKDOWN_OPTIONS,
      ).then((md) => md ?? ""),
    after: [
      ...TAGS.map(tagPart),
      {
        title: "osu! BBCode: common questions",
        url: `${SITE.url}/docs`,
        markdown: faqMarkdown(DOCS_FAQ),
      },
    ],
  });
  return textResponse(body, { type: "text/markdown", maxAge: 3600, sMaxAge: 86400 });
}
