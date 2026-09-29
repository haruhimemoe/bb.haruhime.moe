/**
 * @file src/app/docs/page.tsx
 * @desc /docs: the osu! BBCode reference's front page. What osu! BBCode is, search over every
 *       guide and every tag (from @haruhimemoe/bbcode's TAGS), and the common questions, with
 *       FAQPage and guide ItemList JSON-LD. Static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { pageMetadata } from "@haruhimemoe/next-kit/seo";
import { JsonLd, PageHeader } from "@haruhimemoe/ui";
import { DocsFaq } from "@/components/docs/DocsFaq";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { DOCS_FAQ, DOCS_INTRO } from "@/constants/docs-faq";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { docsEntries } from "@/utils/docs";
import { docsLd } from "@/utils/docs-seo";

/** The docs page's title, description and canonical URL. */
export const metadata = pageMetadata(SEO_SITE, PAGE_SEO.docs);

/**
 * @function DocsPage
 * @returns {JSX.Element} the intro, the searchable list of guides and tags, and the questions
 */
export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={docsLd()} />
      <PageHeader title="osu! BBCode reference" lead={DOCS_INTRO} />
      <section aria-labelledby="pages" className="flex flex-col gap-4">
        <h2 id="pages" className="font-bold text-c1 text-xl">
          Guides and tags
        </h2>
        <DocsSearch entries={docsEntries()} />
      </section>
      <DocsFaq items={DOCS_FAQ} />
    </div>
  );
}
