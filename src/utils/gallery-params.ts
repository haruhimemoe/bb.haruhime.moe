/**
 * @file src/utils/gallery-params.ts
 * @desc The gallery's URL: `q` (search text, trimmed, at most GALLERY_QUERY_MAX characters),
 *       `kind` (one of TEMPLATE_KINDS, or all), `sort` (newest, the default, or used) and `page`
 *       (1 to GALLERY_MAX_PAGE). Anything unknown reads as the default, so an old or edited link
 *       still opens the gallery. galleryHref writes the same params back, leaving defaults out.
 *       Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import {
  GALLERY_MAX_PAGE,
  GALLERY_QUERY_MAX,
  GALLERY_SORTS,
  type GallerySort,
  TEMPLATE_KINDS,
  type TemplateKind,
} from "@/constants/templates";

/** What the gallery shows. */
export type GalleryParams = {
  q: string;
  kind: TemplateKind | null;
  sort: GallerySort;
  page: number;
};

/** The gallery with no filter. */
export const DEFAULT_GALLERY: GalleryParams = { q: "", kind: null, sort: "newest", page: 1 };

type RawParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * @function parseGalleryParams
 * @param raw {RawParams} the page's search params
 * @returns {GalleryParams} what to show, defaults for anything missing or unknown
 */
export const parseGalleryParams = (raw: RawParams): GalleryParams => {
  const kind = first(raw.kind);
  const sort = first(raw.sort);
  const page = Number(first(raw.page));
  return {
    q: first(raw.q).trim().slice(0, GALLERY_QUERY_MAX),
    kind: (TEMPLATE_KINDS as readonly string[]).includes(kind) ? (kind as TemplateKind) : null,
    sort: (GALLERY_SORTS as readonly string[]).includes(sort) ? (sort as GallerySort) : "newest",
    page: Number.isInteger(page) && page >= 1 && page <= GALLERY_MAX_PAGE ? page : 1,
  };
};

/**
 * @function galleryHref
 * @param params {GalleryParams} what to show
 * @returns {string} /templates with only the params that differ from the defaults
 */
export const galleryHref = (params: GalleryParams): string => {
  const search = new URLSearchParams();
  if (params.q !== "") search.set("q", params.q);
  if (params.kind) search.set("kind", params.kind);
  if (params.sort !== "newest") search.set("sort", params.sort);
  if (params.page > 1) search.set("page", String(params.page));
  const text = search.toString();
  return text === "" ? "/templates" : `/templates?${text}`;
};
