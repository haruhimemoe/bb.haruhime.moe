/**
 * @file src/app/docs/tags/[tag]/og.png/route.ts
 * @desc GET /docs/tags/<tag>/og.png: a BBCode tag's link preview card (1200×630 PNG), drawn by
 *       @haruhimemoe/brand's ogCard at build time (every tag is prerendered, like its page).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { ogCard, PRODUCTS } from "@haruhimemoe/brand";
import { tagBySlug, tagSlug } from "@/utils/docs";
import { tagCard } from "@/utils/og-card";

/** Built at deploy; only the tags in TAGS exist. */
export const dynamic = "force-static";
/** Only the tags in TAGS have cards. */
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
 * @param context {RouteContext<"/docs/tags/[tag]/og.png">} the tag's slug
 * @returns {Promise<Response>} 200 image/png; 404 for a slug that isn't a tag
 */
export async function GET(_request: Request, { params }: RouteContext<"/docs/tags/[tag]/og.png">) {
  const tag = tagBySlug((await params).tag);
  if (!tag) return new Response("Not found", { status: 404 });
  return new Response(ogCard(PRODUCTS.bb, tagCard(tag)).slice().buffer, {
    headers: { "Content-Type": "image/png", "X-Content-Type-Options": "nosniff" },
  });
}
