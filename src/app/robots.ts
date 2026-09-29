/**
 * @file src/app/robots.ts
 * @desc robots.txt from next-kit's robots: everything is crawlable except the API, admin,
 *       sign-in, account and my-templates pages and the .md routes' internal paths (their public
 *       /docs/.../<page>.md URLs stay open), with the same rules repeated for each AI
 *       crawler (all allowed), and the sitemap. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { robots } from "@haruhimemoe/next-kit/seo";
import type { MetadataRoute } from "next";
import { SEO_SITE } from "@/constants/seo";

/**
 * @function robotsTxt
 * @returns {MetadataRoute.Robots} crawl rules (everything but /api, /admin, /signin, /account,
 *          /me and /docs-md), the AI crawler groups, the sitemap and the host
 */
export default function robotsTxt(): MetadataRoute.Robots {
  return robots(SEO_SITE, {
    disallow: ["/api/", "/admin", "/signin", "/account", "/me", "/docs-md/"],
    aiBots: "allow",
  });
}
