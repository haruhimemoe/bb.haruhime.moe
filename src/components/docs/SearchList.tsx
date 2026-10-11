/**
 * @file src/components/docs/SearchList.tsx
 * @desc ui's ContentSearch with its count line in the page's language: a client wrapper, since a
 *       server page can't hand ContentSearch a function. `count` names the catalog key for the
 *       unfiltered count ("count" for pages, "guidesCount" for guides).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { ContentSearch, type ContentSearchItem } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";

/**
 * @function SearchList
 * @param props {{ items: readonly ContentSearchItem[]; label: string; count: "count" | "guidesCount" }}
 *        the entries, the field's label and the unfiltered count's key
 * @returns {JSX.Element} ContentSearch with translated counts
 */
export function SearchList({
  items,
  label,
  count,
}: {
  items: readonly ContentSearchItem[];
  label: string;
  count: "count" | "guidesCount";
}) {
  const t = useTranslations("bb.docsPage");
  return (
    <ContentSearch
      items={items}
      label={label}
      countText={(total, matches) =>
        matches === null ? t(count, { total }) : t("matches", { count: matches })
      }
    />
  );
}
