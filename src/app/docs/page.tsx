/**
 * @file src/app/docs/page.tsx
 * @desc /docs: the BBCode reference's placeholder until the reference (one section per tag, from
 *       @haruhimemoe/bbcode's TAGS, and the guides) lands. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { ButtonLink, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";

/** The docs page's title and description. */
export const metadata: Metadata = {
  title: "Docs",
  description: "The osu! BBCode reference: every tag osu! supports, with examples.",
};

/**
 * @function DocsPage
 * @returns {JSX.Element} a short note that the reference is on its way, with links to the editor
 *          and the templates
 */
export default function DocsPage() {
  return (
    <PageHeader
      title="Docs"
      lead="The BBCode reference is on its way: every tag osu! supports, with an example you can edit. Until then, the built-in templates show most tags in use."
      actions={
        <>
          <ButtonLink href="/templates">Browse templates</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Open the editor
          </ButtonLink>
        </>
      }
    />
  );
}
