/**
 * @file src/lib/api.ts
 * @desc bb's wiring for @haruhimemoe/next-kit/server's same-origin guard, which every write
 *       runs, bound to the site's URL and name. Routes import jsonError, noStore and
 *       parseJsonBody from @haruhimemoe/next-kit/server directly.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { crossSiteMessage, refuseCrossSite as refuseForeign } from "@haruhimemoe/next-kit/server";
import { SITE } from "@/constants/site";

/** The 403 message refuseCrossSite sends. */
export const CROSS_SITE_REFUSED = crossSiteMessage(SITE.title);

/**
 * @function refuseCrossSite
 * @param request {Request} a write
 * @returns {Response | null} 403 when Origin is present and isn't this request's own origin or
 *          the site's, or when Sec-Fetch-Site says cross-site or same-site (another
 *          *.haruhime.moe host is another site for us); otherwise null
 */
export const refuseCrossSite = (request: Request): Response | null =>
  refuseForeign(request, { siteUrl: SITE.url, siteTitle: SITE.title });
