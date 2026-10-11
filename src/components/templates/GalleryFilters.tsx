/**
 * @file src/components/templates/GalleryFilters.tsx
 * @desc The gallery's search, kind and sort. Searching goes on Enter or the button; a kind or
 *       sort takes effect at once. Every change goes back to page 1 and lives in the URL
 *       (galleryHref), so a search can be shared and the back button works.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Select, TextInput } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GALLERY_QUERY_MAX, GALLERY_SORTS, TEMPLATE_KINDS } from "@/constants/templates";
import { type GalleryParams, galleryHref } from "@/utils/gallery-params";

type GalleryFiltersProps = {
  /** What the gallery shows now. */
  params: GalleryParams;
};

/**
 * @function GalleryFilters
 * @param props {GalleryFiltersProps} the current search, kind, sort and page
 * @returns {JSX.Element} the search form with its kind and sort pickers
 */
export function GalleryFilters({ params }: GalleryFiltersProps) {
  const t = useTranslations("bb");
  const router = useRouter();
  const [q, setQ] = useState(params.q);
  const go = (change: Partial<GalleryParams>) =>
    router.push(galleryHref({ ...params, q: q.trim(), ...change, page: 1 }));
  return (
    <search>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          go({});
        }}
      >
        <TextInput
          id="gallery-q"
          label={t("gallery.search")}
          type="search"
          value={q}
          maxLength={GALLERY_QUERY_MAX}
          onChange={(event) => setQ(event.target.value)}
          wrapperClassName="min-w-48 flex-1"
        />
        <Select
          id="gallery-kind"
          label={t("gallery.kind")}
          value={params.kind ?? ""}
          onChange={(event) => go({ kind: (event.target.value || null) as GalleryParams["kind"] })}
        >
          <option value="">{t("gallery.allKinds")}</option>
          {TEMPLATE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </option>
          ))}
        </Select>
        <Select
          id="gallery-sort"
          label={t("gallery.sort")}
          value={params.sort}
          onChange={(event) => go({ sort: event.target.value as GalleryParams["sort"] })}
        >
          {GALLERY_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`gallery.sorts.${sort}`)}
            </option>
          ))}
        </Select>
        <Button type="submit">{t("gallery.submit")}</Button>
      </form>
    </search>
  );
}
