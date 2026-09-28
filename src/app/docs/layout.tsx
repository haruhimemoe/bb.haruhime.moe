/**
 * @file src/app/docs/layout.tsx
 * @desc The docs' frame: the side navigation (guides and every tag) beside the page on wide
 *       screens, above it on phones. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { ReactNode } from "react";
import { DocsNav } from "@/components/docs/DocsNav";
import { docsEntries } from "@/utils/docs";

/**
 * @function DocsLayout
 * @param props {{ children: ReactNode }} the docs page
 * @returns {JSX.Element} the navigation and the page
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <DocsNav entries={docsEntries()} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
