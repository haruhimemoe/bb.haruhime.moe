/**
 * @file src/app/docs/page.tsx
 * @desc /docs: the osu! BBCode reference's front page. What osu! BBCode is, search over the docs
 *       pages and every tag (from @haruhimemoe/bbcode's TAGS, matched by name and aliases too),
 *       and the common questions, with FAQPage and guide ItemList JSON-LD. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ContentSearch, JsonLd, PageHeader, TextLink } from "@haruhimemoe/ui";
import { DocsFaq } from "@/components/docs/DocsFaq";
import { CONTENT } from "@/constants/content";
import { DOCS_FAQ, DOCS_INTRO } from "@/constants/docs-faq";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { extraToNavItem, toNavItem } from "@/utils/content-nav";
import { tagBySlug } from "@/utils/docs";
import { docsLd } from "@/utils/docs-seo";

/** The docs page's title, description and canonical URL. */
export const metadata = pageMetadata(SEO_SITE, PAGE_SEO.docs);

const ITEMS = [
  ...CONTENT.entries.docs.map(toNavItem("docs")),
  ...CONTENT.extra.docs.map((extra) => {
    const tag = tagBySlug(extra.href.slice(extra.href.lastIndexOf("/") + 1));
    return { ...extraToNavItem(extra), keywords: tag ? [tag.name, ...tag.aliases] : [] };
  }),
];

/**
 * @function DocsPage
 * @returns {JSX.Element} the intro, the searchable list of pages and tags, and the questions
 */
export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={docsLd()} />
      <PageHeader
        title="osu! BBCode reference"
        lead={DOCS_INTRO}
        meta={<TextLink href="/guides">Read the guides</TextLink>}
      />
      <section aria-labelledby="pages" className="flex flex-col gap-4">
        <h2 id="pages" className="font-bold text-c1 text-xl">
          Tags and pages
        </h2>
        <ContentSearch items={ITEMS} label="Search the docs" countNoun={["page", "pages"]} />
      </section>
      <DocsFaq items={DOCS_FAQ} />
    </div>
  );
}
