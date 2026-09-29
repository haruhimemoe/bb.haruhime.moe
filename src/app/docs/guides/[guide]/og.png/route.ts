/**
 * @file src/app/docs/guides/[guide]/og.png/route.ts
 * @desc GET /docs/guides/<guide>/og.png: a guide's link preview card (1200×630 PNG), drawn by
 *       @haruhimemoe/brand's ogCard at build time (every guide is prerendered, like its page).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { ogCard, PRODUCTS } from "@haruhimemoe/brand";
import { GUIDE_SLUGS, isGuideSlug } from "@/constants/guides";
import { guideCard } from "@/utils/og-card";

/** Built at deploy; only the guides in GUIDES exist. */
export const dynamic = "force-static";
/** Only the guides in GUIDES have cards. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ guide: string }[]} every guide
 */
export function generateStaticParams() {
  return GUIDE_SLUGS.map((guide) => ({ guide }));
}

/**
 * @function GET
 * @param _request {Request} unused
 * @param context {RouteContext<"/docs/guides/[guide]/og.png">} the guide's slug
 * @returns {Promise<Response>} 200 image/png; 404 for a slug that isn't a guide
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/docs/guides/[guide]/og.png">,
) {
  const { guide } = await params;
  if (!isGuideSlug(guide)) return new Response("Not found", { status: 404 });
  return new Response(ogCard(PRODUCTS.bb, guideCard(guide)).slice().buffer, {
    headers: { "Content-Type": "image/png", "X-Content-Type-Options": "nosniff" },
  });
}
