/**
 * @file src/app/docs/layout.tsx
 * @desc The docs' frame: the section nav (the overview, the Docs pages from the registry, then
 *       every tag page under Tags) beside the page on wide screens, above it on phones. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { ContentLayout, ContentNav } from "@haruhimemoe/ui";
import type { ReactNode } from "react";
import { CONTENT, TAGS_GROUP } from "@/constants/content";
import { extraToNavItem, toNavItem } from "@/utils/content-nav";

const GROUPS = [
  { heading: "Docs", items: CONTENT.entries.docs.map(toNavItem("docs")) },
  { heading: TAGS_GROUP, items: CONTENT.extra.docs.map(extraToNavItem) },
];

/**
 * @function DocsLayout
 * @param props {{ children: ReactNode }} the docs page
 * @returns {JSX.Element} the navigation and the page
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <ContentLayout nav={<ContentNav label="Docs" indexHref="/docs" groups={GROUPS} />}>
      {children}
    </ContentLayout>
  );
}
