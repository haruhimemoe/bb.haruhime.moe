/**
 * @file src/app/guides/[slug]/og.png/route.ts
 * @desc GET /guides/<slug>/og.png: a guide's link preview card (1200×630 PNG), drawn by
 *       @haruhimemoe/brand's ogCard at build time (every guide is prerendered, like its page).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { ogCard, PRODUCTS } from "@haruhimemoe/brand";
import { contentParams, findEntry } from "@haruhimemoe/next-kit/docs";
import { CONTENT } from "@/constants/content";
import { guideCard } from "@/utils/og-card";

/** Built at deploy; only registered guides exist. */
export const dynamic = "force-static";
/** Only registered guides have cards. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ slug: string }[]} every registered guide
 */
export const generateStaticParams = () => contentParams(CONTENT, "guides");

/**
 * @function GET
 * @param _request {Request} unused
 * @param context {RouteContext<"/guides/[slug]/og.png">} the guide's slug
 * @returns {Promise<Response>} 200 image/png; 404 for a slug that isn't a guide
 */
export async function GET(_request: Request, { params }: RouteContext<"/guides/[slug]/og.png">) {
  const entry = findEntry(CONTENT, "guides", (await params).slug);
  if (!entry) return new Response("Not found.\n", { status: 404 });
  return new Response(ogCard(PRODUCTS.bb, guideCard(entry)).slice().buffer, {
    headers: { "Content-Type": "image/png", "X-Content-Type-Options": "nosniff" },
  });
}
