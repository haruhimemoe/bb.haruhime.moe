/**
 * @file src/app/guides/page.tsx
 * @desc /guides: every osu! BBCode guide with its description, in reading order, searchable,
 *       from the content registry. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import { pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ContentSearch, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { CONTENT } from "@/constants/content";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { toNavItem } from "@/utils/content-nav";

/** The page's title, description and canonical URL. */
export const metadata: Metadata = pageMetadata(SEO_SITE, PAGE_SEO.guides);

const ITEMS = CONTENT.entries.guides.map(toNavItem("guides"));

/**
 * @function GuidesIndexPage
 * @returns {JSX.Element} the section's header and its guides
 */
export default function GuidesIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Guides"
        lead="Step by step: a userpage, a tournament forum post, flags, colors and collab imagemaps."
      />
      <ContentSearch items={ITEMS} label="Search the guides" countNoun={["guide", "guides"]} />
    </div>
  );
}
