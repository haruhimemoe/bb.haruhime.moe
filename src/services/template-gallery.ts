/**
 * @file src/services/template-gallery.ts
 * @desc The public gallery and the public listings. The gallery shows the built-in templates
 *       that match the search and kind (on page 1, in their own section, by uses under "Most
 *       used"), then public templates that reports haven't hidden: MongoDB's text search on
 *       name and description when there's a query, the kind, newest change or most used first,
 *       GALLERY_PAGE_SIZE a page. The count runs as the `count` command (the driver's
 *       countDocuments is an aggregation). The sitemap and llms.txt list public templates the
 *       same way. Under SKIP_ENV_VALIDATION (a CI build) the database lists are empty; at run
 *       time a database error throws, so ISR keeps the last good page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import type { Filter, Sort } from "mongodb";
import { QUERY_TIME_MS, TEMPLATES_COLLECTION } from "@/constants/db";
import { GALLERY_PAGE_SIZE } from "@/constants/templates";
import { skipsDatabase } from "@/env";
import { builtinTemplates } from "@/lib/builtin-templates";
import { getDb } from "@/lib/db";
import { templatesCollection } from "@/models/Template";
import type { StoredTemplate } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import type { GalleryParams } from "@/utils/gallery-params";
import { toTemplateView } from "@/utils/template-view";
import { builtinsWithUses } from "./template-uses";
import { readStored } from "./templates-read";

/** One gallery page. */
export type GalleryPage = {
  builtIns: TemplateView[];
  templates: TemplateView[];
  total: number;
  page: number;
  pageCount: number;
};

/** Public templates that reports haven't hidden. */
const LISTED: Filter<StoredTemplate> = { visibility: "public", hidden: false };

const SORTS: Record<GalleryParams["sort"], Sort> = {
  newest: { updatedAt: -1, _id: 1 },
  used: { uses: -1, updatedAt: -1, _id: 1 },
};

/**
 * @function matchesBuiltin
 * @param template {TemplateView} a built-in template
 * @param params {GalleryParams} the gallery's filters
 * @returns {boolean} true when its kind matches and every word of the query is in its name or
 *          description (case-insensitive)
 */
export const matchesBuiltin = (template: TemplateView, params: GalleryParams): boolean => {
  if (params.kind && template.kind !== params.kind) return false;
  const text = `${template.name} ${template.description}`.toLowerCase();
  return params.q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
};

const galleryFilter = (params: GalleryParams): Filter<StoredTemplate> => ({
  ...LISTED,
  ...(params.kind ? { kind: params.kind } : {}),
  ...(params.q ? { $text: { $search: params.q } } : {}),
});

/**
 * @function listGallery
 * @param params {GalleryParams} search, kind, sort and page
 * @returns {Promise<GalleryPage>} the matching built-in templates (page 1 only) and one page of
 *          public templates, with the total and page count
 */
export const listGallery = async (params: GalleryParams): Promise<GalleryPage> => {
  if (skipsDatabase()) {
    const builtIns = builtinTemplates().filter((template) => matchesBuiltin(template, params));
    return { builtIns, templates: [], total: 0, page: 1, pageCount: 1 };
  }
  const builtIns =
    params.page === 1
      ? (await builtinsWithUses())
          .filter((template) => matchesBuiltin(template, params))
          .sort((a, b) => (params.sort === "used" ? b.uses - a.uses : 0))
      : [];
  const filter = galleryFilter(params);
  const templates = await templatesCollection();
  const [rows, counted] = await Promise.all([
    templates
      .find(filter, { maxTimeMS: QUERY_TIME_MS })
      .sort(SORTS[params.sort])
      .skip((params.page - 1) * GALLERY_PAGE_SIZE)
      .limit(GALLERY_PAGE_SIZE)
      .toArray(),
    getDb().command({ count: TEMPLATES_COLLECTION, query: filter, maxTimeMS: QUERY_TIME_MS }),
  ]);
  const total = typeof counted.n === "number" ? counted.n : 0;
  return {
    builtIns,
    templates: rows.flatMap((row) => {
      const stored = readStored(row);
      return stored ? [toTemplateView(stored)] : [];
    }),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE)),
  };
};

/** A public template, as the sitemap and llms.txt list it. */
export type ListedTemplate = Pick<StoredTemplate, "_id" | "name" | "kind" | "updatedAt">;

/**
 * @function listPublicTemplates
 * @param limit {number} most templates (default 5000)
 * @returns {Promise<ListedTemplate[]>} public, unhidden templates, last changed first (none
 *          under SKIP_ENV_VALIDATION)
 */
export const listPublicTemplates = async (limit = 5000): Promise<ListedTemplate[]> => {
  if (skipsDatabase()) return [];
  const templates = await templatesCollection();
  return templates
    .find(LISTED, {
      maxTimeMS: QUERY_TIME_MS,
      projection: { _id: 1, name: 1, kind: 1, updatedAt: 1 },
    })
    .sort({ updatedAt: -1, _id: 1 })
    .limit(limit)
    .toArray() as Promise<ListedTemplate[]>;
};
