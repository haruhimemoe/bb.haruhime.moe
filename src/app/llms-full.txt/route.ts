/**
 * @file src/app/llms-full.txt/route.ts
 * @desc GET /llms-full.txt: all of the docs in one Markdown file for AI assistants: the common
 *       questions, every guide, then every tag page. Built at deploy.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { llmsFull, textResponse } from "@haruhimemoe/next-kit/seo";
import { DOCS_FAQ, DOCS_INTRO } from "@/constants/docs-faq";
import { SITE } from "@/constants/site";
import { allDocsParts } from "@/lib/guide-source";
import { faqMarkdown } from "@/utils/docs-markdown";

/** Built once, at deploy. */
export const dynamic = "force-static";

/**
 * @function GET
 * @returns {Response} every docs page as one plain-text Markdown file
 */
export function GET() {
  const questions = {
    title: "osu! BBCode: common questions",
    url: `${SITE.url}/docs`,
    markdown: faqMarkdown(DOCS_FAQ),
  };
  return textResponse(
    llmsFull([questions, ...allDocsParts()], {
      title: `${SITE.title} docs: the osu! BBCode reference`,
      summary: DOCS_INTRO,
    }),
    { maxAge: 3600, sMaxAge: 86400 },
  );
}
