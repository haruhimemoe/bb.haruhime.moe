/**
 * @file src/app/docs/page.tsx
 * @desc /docs: the osu! BBCode reference's front page. A short intro, then search over every
 *       guide and every tag (from @haruhimemoe/bbcode's TAGS). Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { docsEntries } from "@/utils/docs";

/** The docs page's title and description. */
export const metadata: Metadata = {
  title: "Docs",
  description:
    "The osu! BBCode reference: every tag osu! supports with an example you can edit, and guides for userpages, tournament posts, flags, colors and imagemaps.",
  alternates: { canonical: "/docs" },
};

/**
 * @function DocsPage
 * @returns {JSX.Element} the intro and the searchable list of guides and tags
 */
export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Docs"
        lead="Every tag osu! reads in userpages, forum posts and beatmap descriptions, each with an example you can edit, plus guides for the things people build with them."
      />
      <DocsSearch entries={docsEntries()} />
    </div>
  );
}
