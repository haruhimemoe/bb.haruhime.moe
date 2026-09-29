/**
 * @file src/app/t/[id]/og.png/route.ts
 * @desc GET /t/<id>/og.png: a listed template's link preview card (1200×630 PNG), drawn at
 *       request time by @haruhimemoe/brand's ogCard (resvg, Node.js runtime). Built-in templates
 *       and public ones reports haven't hidden get one; any other id is a 404 (private, unlisted
 *       and hidden pages keep the site's image). Reads no cookies. Pages link it with
 *       ?v=<hash of the card's text>, so the CDN keeps it a week.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { ogCard, PRODUCTS } from "@haruhimemoe/brand";
import { getTemplateFor } from "@/services/templates-read";
import { templateCard } from "@/utils/og-card";
import { isListedTemplate } from "@/utils/template-seo";

/** Node.js, not edge: ogCard loads resvg's native binary. */
export const runtime = "nodejs";

/**
 * @function GET
 * @param _request {Request} unused
 * @param context {RouteContext<"/t/[id]/og.png">} the template id
 * @returns {Promise<Response>} 200 image/png for a listed template; 404 otherwise
 */
export async function GET(_request: Request, { params }: RouteContext<"/t/[id]/og.png">) {
  const template = await getTemplateFor((await params).id, null);
  if (!template || !isListedTemplate(template)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
    });
  }
  return new Response(ogCard(PRODUCTS.bb, templateCard(template)).slice().buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
