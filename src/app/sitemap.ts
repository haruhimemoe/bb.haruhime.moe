/**
 * @file src/app/sitemap.ts
 * @desc sitemap.xml from next-kit's sitemapEntries: the editor, the gallery, the collab maker,
 *       the docs (every guide and tag page, and the API docs), the legal pages, every built-in
 *       template and every public template reports haven't hidden (private and unlisted ones
 *       stay out, and their pages are noindex). lastmod only where a real date exists: guides,
 *       tag pages and legal pages from their lastUpdated, public templates from updatedAt. ISR,
 *       hourly; a database error fails the render, so ISR keeps serving the last good sitemap.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { sitemapEntries } from "@haruhimemoe/next-kit/seo";
import type { MetadataRoute } from "next";
import { API_DOCS_PATH } from "@/constants/api";
import { GUIDE_SLUGS, GUIDES } from "@/constants/guides";
import { LEGAL_DOCS, LEGAL_SLUGS } from "@/constants/legal";
import { SEO_SITE } from "@/constants/seo";
import { TAG_DOCS_UPDATED } from "@/constants/tag-docs";
import { builtinTemplates } from "@/lib/builtin-templates";
import { listPublicTemplates } from "@/services/template-gallery";
import { docsEntries } from "@/utils/docs";

/** Rebuilt at most once an hour. */
export const revalidate = 3600;

/**
 * @function sitemap
 * @returns {Promise<MetadataRoute.Sitemap>} the static pages, docs pages, legal pages, built-in
 *          templates and public templates
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await listPublicTemplates();
  return sitemapEntries(SEO_SITE, [
    ["/", "/templates", "/collab", "/docs", API_DOCS_PATH],
    GUIDE_SLUGS.map((slug) => ({
      path: `/docs/guides/${slug}`,
      lastModified: GUIDES[slug].lastUpdated,
    })),
    docsEntries()
      .filter((entry) => entry.kind === "tag")
      .map((entry) => ({ path: entry.href, lastModified: TAG_DOCS_UPDATED })),
    LEGAL_SLUGS.map((slug) => ({
      path: `/legal/${slug}`,
      lastModified: LEGAL_DOCS[slug].lastUpdated,
    })),
    builtinTemplates().map((template) => `/t/${template.id}`),
    templates.map((row) => ({ path: `/t/${row._id}`, lastModified: row.updatedAt })),
  ]);
}
