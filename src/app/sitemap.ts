/**
 * @file src/app/sitemap.ts
 * @desc sitemap.xml from next-kit's sitemapEntries: the editor, the gallery, the collab maker,
 *       the brand page, every docs, guides and legal page and every tag page (next-kit's
 *       contentSitemap over the content registry, dated by lastUpdated), every built-in template
 *       and every public template reports haven't hidden (private and unlisted ones stay out, and
 *       their pages are noindex), those dated by updatedAt. ISR, hourly; a database error fails
 *       the render, so ISR keeps serving the last good sitemap.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { contentSitemap } from "@haruhimemoe/next-kit/docs";
import { sitemapEntries } from "@haruhimemoe/next-kit/seo";
import type { MetadataRoute } from "next";
import { CONTENT } from "@/constants/content";
import { SEO_SITE } from "@/constants/seo";
import { builtinTemplates } from "@/lib/builtin-templates";
import { listPublicTemplates } from "@/services/template-gallery";

/** Rebuilt at most once an hour. */
export const revalidate = 3600;

/**
 * @function sitemap
 * @returns {Promise<MetadataRoute.Sitemap>} the static pages, the content pages, built-in
 *          templates and public templates
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await listPublicTemplates();
  return sitemapEntries(SEO_SITE, [
    ["/", "/templates", "/collab", "/brand"],
    contentSitemap(CONTENT),
    builtinTemplates().map((template) => `/t/${template.id}`),
    templates.map((row) => ({ path: `/t/${row._id}`, lastModified: row.updatedAt })),
  ]);
}
