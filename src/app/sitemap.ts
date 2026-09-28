/**
 * @file src/app/sitemap.ts
 * @desc sitemap.xml: the editor, the gallery, the docs (every guide and tag page), the legal
 *       pages, every built-in template and every public template reports haven't hidden (private
 *       and unlisted ones stay out, and their pages are noindex). ISR, hourly; a database error fails the render, so ISR
 *       keeps serving the last good sitemap.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { MetadataRoute } from "next";
import { LEGAL_SLUGS } from "@/constants/legal";
import { SITE } from "@/constants/site";
import { builtinTemplates } from "@/lib/builtin-templates";
import { listPublicTemplates } from "@/services/template-gallery";
import { docsEntries } from "@/utils/docs";

/** Rebuilt at most once an hour. */
export const revalidate = 3600;

const STATIC_PATHS = ["/", "/templates", "/collab", "/docs"] as const;

const at = (path: string): string => `${SITE.url}${path}`;

/**
 * @function sitemap
 * @returns {Promise<MetadataRoute.Sitemap>} the static pages, docs pages, legal pages, built-in
 *          templates and public templates
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await listPublicTemplates();
  return [
    ...STATIC_PATHS.map((path) => ({ url: at(path) })),
    ...docsEntries().map((entry) => ({ url: at(entry.href) })),
    ...LEGAL_SLUGS.map((slug) => ({ url: at(`/legal/${slug}`) })),
    ...builtinTemplates().map((template) => ({ url: at(`/t/${template.id}`) })),
    ...templates.map((row) => ({ url: at(`/t/${row._id}`), lastModified: row.updatedAt })),
  ];
}
