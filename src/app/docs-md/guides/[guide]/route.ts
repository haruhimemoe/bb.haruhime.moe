/**
 * @file src/app/docs-md/guides/[guide]/route.ts
 * @desc GET /docs/guides/<guide>.md (rewritten here in next.config.ts): one guide as Markdown,
 *       with a canonical Link header pointing at the HTML page. Built at deploy; any other slug
 *       is a 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { llmsFull, textResponse } from "@haruhimemoe/next-kit/seo";
import { GUIDE_SLUGS, isGuideSlug } from "@/constants/guides";
import { guidePart } from "@/lib/guide-source";

/** Only the guides in GUIDES exist. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ guide: string }[]} every guide, built at deploy
 */
export function generateStaticParams() {
  return GUIDE_SLUGS.map((guide) => ({ guide }));
}

/**
 * @function GET
 * @param _request {Request} unused
 * @param context {RouteContext<"/docs-md/guides/[guide]">} the guide's slug
 * @returns {Promise<Response>} the guide as text/markdown, or a 404
 */
export async function GET(_request: Request, context: RouteContext<"/docs-md/guides/[guide]">) {
  const { guide } = await context.params;
  if (!isGuideSlug(guide)) return new Response("Not found", { status: 404 });
  const part = guidePart(guide);
  const response = textResponse(llmsFull([part]), { type: "text/markdown", maxAge: 3600 });
  response.headers.set("Link", `<${part.url}>; rel="canonical"`);
  return response;
}
