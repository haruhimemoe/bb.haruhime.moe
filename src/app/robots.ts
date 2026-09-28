/**
 * @file src/app/robots.ts
 * @desc robots.txt: everything is crawlable except the API, admin, sign-in, account and my-templates pages. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { MetadataRoute } from "next";
import { SITE } from "@/constants/site";

/**
 * @function robots
 * @returns {MetadataRoute.Robots} crawl rules (everything but /api, /admin, /signin, /account and /me)
 *          and the sitemap
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/signin", "/account", "/me"] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
