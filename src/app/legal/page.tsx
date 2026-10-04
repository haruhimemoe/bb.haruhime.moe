/**
 * @file src/app/legal/page.tsx
 * @desc /legal: every legal page with its description, from the content registry. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import { pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ContentIndex, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { CONTENT } from "@/constants/content";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { toNavItem } from "@/utils/content-nav";

/** The page's title, description and canonical URL. */
export const metadata: Metadata = pageMetadata(SEO_SITE, PAGE_SEO.legal);

const ITEMS = CONTENT.entries.legal.map(toNavItem("legal"));

/**
 * @function LegalIndexPage
 * @returns {JSX.Element} the section's header and its pages
 */
export default function LegalIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Legal" lead="The terms, and what bb stores and why." />
      <ContentIndex items={ITEMS} />
    </div>
  );
}
