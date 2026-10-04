/**
 * @file src/utils/content-nav.ts
 * @desc Turns registry entries and extras into the items ContentNav and ContentSearch take: a
 *       resolved href, the title, the nav title, the badge (a tag page's "[b]") and the
 *       description. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import {
  type ContentEntry,
  type ContentSection,
  contentPath,
  type ExtraEntry,
} from "@haruhimemoe/next-kit/docs";
import type { ContentSearchItem } from "@haruhimemoe/ui";

/**
 * @function toNavItem
 * @param section {ContentSection} the section the entries live under
 * @returns {(entry: ContentEntry) => ContentSearchItem} maps one entry to its nav and search item
 */
export const toNavItem =
  (section: ContentSection) =>
  ({ slug, title, navTitle, description }: ContentEntry): ContentSearchItem => ({
    href: contentPath(section, slug),
    title,
    ...(navTitle ? { navTitle } : {}),
    description,
  });

/**
 * @function extraToNavItem
 * @param extra {ExtraEntry} an app-made page, like a tag page
 * @returns {ContentSearchItem} its nav and search item (search matches its badge too)
 */
export const extraToNavItem = ({
  href,
  title,
  navTitle,
  description,
  badge,
}: ExtraEntry): ContentSearchItem => ({
  href,
  title,
  ...(navTitle ? { navTitle } : {}),
  ...(badge ? { badge } : {}),
  description,
});
