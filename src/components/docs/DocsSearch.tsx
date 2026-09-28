/**
 * @file src/components/docs/DocsSearch.tsx
 * @desc The docs index's search: one field that narrows the guides and tags as it's typed (by
 *       tag name, alias, title or description), with the count said to screen readers.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { TextInput } from "@haruhimemoe/ui";
import Link from "next/link";
import { useState } from "react";
import { type DocsEntry, searchDocs } from "@/utils/docs";

type DocsSearchProps = {
  entries: readonly DocsEntry[];
};

/**
 * @function DocsSearch
 * @param props {DocsSearchProps} the docs' index
 * @returns {JSX.Element} the field, the result count and the matching entries
 */
export function DocsSearch({ entries }: DocsSearchProps) {
  const [query, setQuery] = useState("");
  const found = searchDocs(entries, query);
  return (
    <div className="flex flex-col gap-4">
      <TextInput
        id="docs-search"
        type="search"
        label="Search the docs"
        placeholder="box, color, [center]..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      <p className="text-c3 text-sm" aria-live="polite">
        {query.trim() === ""
          ? `${entries.length} pages.`
          : `${found.length} ${found.length === 1 ? "match" : "matches"}.`}
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {found.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="flex h-full flex-col gap-1 rounded-md bg-b4 p-3 hover:bg-b3"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-c1">{entry.title}</span>
                <span className="font-mono text-c4 text-xs">
                  {entry.tag ?? (entry.kind === "guide" ? "Guide" : "")}
                </span>
              </span>
              <span className="text-c3 text-sm">{entry.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
