/**
 * @file next.config.ts
 * @desc Next.js config: MDX page extensions (the docs, guides and legal pages, with ui's remark plugin
 *       for code fence meta, GitHub-style callouts and heading ids), strict mode, unoptimized
 *       images (we never transform or proxy an image), security headers on every route (no
 *       framing, no MIME sniffing, a trimmed Referer, and a CSP whose img-src is open to https:
 *       because the preview shows people's own image URLs, media-src https: for [audio], and
 *       frame-src the YouTube embed only; no plugins, foreign <base> or off-site form posts), no
 *       X-Powered-By, and content/templates traced into every server bundle (the built-in
 *       templates are read from disk), and the .md URLs of the docs, guides, legal and tag pages
 *       rewritten to their Markdown routes (next-kit's contentRewrites, plus the tag pages').
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { contentRewrites } from "@haruhimemoe/next-kit/docs";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  // Turbopack only takes MDX plugins as module names, not imported functions. No pipe tables in
  // our content, so no remark-gfm.
  options: { remarkPlugins: ["@haruhimemoe/ui/remark"] },
});

/**
 * frame-ancestors (with X-Frame-Options for older browsers) stops clickjacking. Images load from
 * here, data: URIs and any https host: a BBCode preview shows [img] and [imagemap] URLs people
 * host elsewhere, loaded by their browser straight from that host (we never fetch or store one).
 * Media ([audio]) is https only, and the only frame is YouTube's embed for [youtube]. No
 * plugins, no <base> pointing elsewhere and no form posting off the site: previews are HTML we
 * put in the page, so these cost nothing and back up the renderer.
 */
const CSP = [
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "media-src https:",
  "frame-src https://www.youtube.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** Sent on every route. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // brand draws the template cards per request (/t/<id>/og.png): resvg is a native binary and
  // brand reads its fonts by a computed path, so both stay out of the bundle.
  serverExternalPackages: ["@haruhimemoe/brand", "@resvg/resvg-js"],
  outputFileTracingIncludes: {
    // The built-in templates are read from disk at run time (src/lib/builtin-templates.ts).
    "/**": ["./content/templates/**"],
    // A picomatch glob over the route: "[id]" would be a character class.
    "/t/*/og.png": ["./node_modules/@haruhimemoe/brand/fonts/*.ttf"],
  },
  // Markdown copies for assistants. A dynamic segment can't end in ".md", so each docs, guides
  // and legal page's mirror lives one level down (/guides/x.md to /guides/x/md), and the tag
  // pages' at /docs-md/tags/<tag>.
  async rewrites() {
    return [
      ...contentRewrites(),
      { source: "/docs/tags/:tag.md", destination: "/docs-md/tags/:tag" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default withMDX(nextConfig);
