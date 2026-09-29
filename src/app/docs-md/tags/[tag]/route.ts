/**
 * @file src/app/docs-md/tags/[tag]/route.ts
 * @desc GET /docs/tags/<tag>.md (rewritten here in next.config.ts): one tag's reference as
 *       Markdown, with a canonical Link header pointing at the HTML page. Built at deploy; any
 *       other slug is a 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { llmsFull, textResponse } from "@haruhimemoe/next-kit/seo";
import { tagPart } from "@/lib/guide-source";
import { tagBySlug, tagSlug } from "@/utils/docs";

/** Only the tags in TAGS have pages. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ tag: string }[]} every tag's slug
 */
export function generateStaticParams() {
  return TAGS.map((tag) => ({ tag: tagSlug(tag.name) }));
}

/**
 * @function GET
 * @param _request {Request} unused
 * @param context {RouteContext<"/docs-md/tags/[tag]">} the tag's slug
 * @returns {Promise<Response>} the tag's reference as text/markdown, or a 404
 */
export async function GET(_request: Request, context: RouteContext<"/docs-md/tags/[tag]">) {
  const tag = tagBySlug((await context.params).tag);
  if (!tag) return new Response("Not found", { status: 404 });
  const part = tagPart(tag);
  const response = textResponse(llmsFull([part]), { type: "text/markdown", maxAge: 3600 });
  response.headers.set("Link", `<${part.url}>; rel="canonical"`);
  return response;
}
