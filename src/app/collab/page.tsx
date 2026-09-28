/**
 * @file src/app/collab/page.tsx
 * @desc /collab: the imagemap maker for collabs and link maps. Static; everything runs in the
 *       browser, and the image loads from its own host.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { CollabMaker } from "@/components/collab/CollabMaker";
import { COLLAB_LEAD } from "@/constants/collab";

/** The page's title and description. */
export const metadata: Metadata = {
  title: "Collab maker",
  description:
    "Draw link regions over an image and get an osu! [imagemap] for a collab, a userpage or a forum post.",
  alternates: { canonical: "/collab" },
};

/**
 * @function CollabPage
 * @returns {JSX.Element} the page title and the collab maker
 */
export default function CollabPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Collab maker" lead={COLLAB_LEAD} />
      <CollabMaker />
    </div>
  );
}
