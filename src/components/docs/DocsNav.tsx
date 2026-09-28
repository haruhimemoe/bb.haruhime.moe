/**
 * @file src/components/docs/DocsNav.tsx
 * @desc The docs' side navigation: the index, the guides, then every tag from TAGS, with the
 *       current page marked. A column beside the page on wide screens; a "Contents" disclosure
 *       above it on phones.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { cx } from "@haruhimemoe/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsEntry } from "@/utils/docs";

type DocsNavProps = {
  entries: readonly DocsEntry[];
};

/**
 * @function DocsNav
 * @param props {DocsNavProps} the docs' index
 * @returns {JSX.Element} the navigation, as a column and as a phone disclosure
 */
export function DocsNav({ entries }: DocsNavProps) {
  const path = usePathname();
  const link = (href: string, label: string, tag?: string) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={path === href ? "page" : undefined}
        className={cx(
          "flex items-baseline justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-b4 hover:text-c1",
          path === href ? "bg-b4 font-bold text-c1" : "text-c3",
        )}
      >
        <span>{label}</span>
        {tag ? <span className="font-mono text-c4 text-xs">{tag}</span> : null}
      </Link>
    </li>
  );
  const list = (
    <div className="flex flex-col gap-4">
      <ul>{link("/docs", "Overview")}</ul>
      {(["guide", "tag"] as const).map((kind) => (
        <div key={kind}>
          <p className="mb-1 px-2 font-bold text-c4 text-xs uppercase tracking-wide">
            {kind === "guide" ? "Guides" : "Tags"}
          </p>
          <ul>
            {entries
              .filter((entry) => entry.kind === kind)
              .map((entry) => link(entry.href, entry.title, entry.tag))}
          </ul>
        </div>
      ))}
    </div>
  );
  return (
    <>
      <nav aria-label="Docs" className="hidden lg:block">
        <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">{list}</div>
      </nav>
      <details className="rounded-md bg-b4 p-2 lg:hidden">
        <summary className="cursor-pointer px-2 py-1 font-bold text-c2 text-sm">Contents</summary>
        <nav aria-label="Docs" className="mt-2">
          {list}
        </nav>
      </details>
    </>
  );
}
