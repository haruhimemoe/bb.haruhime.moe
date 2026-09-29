/**
 * @file src/app/docs/guides/[guide]/page.tsx
 * @desc /docs/guides/<guide>: one guide, an MDX page from content/guides registered in
 *       src/constants/guides.ts, with its last update, links to the guides before and after it,
 *       and TechArticle and breadcrumb JSON-LD. Built at deploy; any other slug is a 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { notFoundMetadata, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { JsonLd, PageHeader, Prose, TextLink } from "@haruhimemoe/ui";
import type { MDXContent } from "mdx/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDE_SLUGS, GUIDES, type GuideSlug, isGuideSlug } from "@/constants/guides";
import { SEO_SITE } from "@/constants/seo";
import { formatIsoDate } from "@/utils/date";
import { guideLd } from "@/utils/docs-seo";
import { cardImage, guideCard } from "@/utils/og-card";

const LOADERS: Record<GuideSlug, () => Promise<{ default: MDXContent }>> = {
  "getting-started": () => import("@content/guides/getting-started.mdx"),
  userpage: () => import("@content/guides/userpage.mdx"),
  "tournament-forum-post": () => import("@content/guides/tournament-forum-post.mdx"),
  flags: () => import("@content/guides/flags.mdx"),
  "colors-and-gradients": () => import("@content/guides/colors-and-gradients.mdx"),
  "imagemaps-and-collabs": () => import("@content/guides/imagemaps-and-collabs.mdx"),
  "limits-and-gotchas": () => import("@content/guides/limits-and-gotchas.mdx"),
};

/** Only the guides in GUIDES exist. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ guide: string }[]} every guide, built at deploy
 */
export function generateStaticParams() {
  return GUIDE_SLUGS.map((guide) => ({ guide }));
}

/**
 * @function generateMetadata
 * @param props {PageProps<"/docs/guides/[guide]">} the guide's slug
 * @returns {Promise<Metadata>} its search title, description, canonical URL and article dates
 */
export async function generateMetadata({
  params,
}: PageProps<"/docs/guides/[guide]">): Promise<Metadata> {
  const { guide } = await params;
  if (!isGuideSlug(guide)) return notFoundMetadata(SEO_SITE, "Guide");
  const { seoTitle, summary, lastUpdated } = GUIDES[guide];
  return pageMetadata(SEO_SITE, {
    path: `/docs/guides/${guide}`,
    title: seoTitle,
    description: summary,
    ogType: "article",
    modifiedTime: lastUpdated,
    images: [cardImage(`/docs/guides/${guide}`, guideCard(guide))],
  });
}

/**
 * @function GuidePage
 * @param props {PageProps<"/docs/guides/[guide]">} the guide's slug
 * @returns {Promise<JSX.Element>} the guide, its JSON-LD and the neighbouring guides
 */
export default async function GuidePage({ params }: PageProps<"/docs/guides/[guide]">) {
  const { guide } = await params;
  if (!isGuideSlug(guide)) notFound();
  const { default: Content } = await LOADERS[guide]();
  const at = GUIDE_SLUGS.indexOf(guide);
  const [before, after] = [GUIDE_SLUGS[at - 1], GUIDE_SLUGS[at + 1]];
  return (
    <article className="flex flex-col gap-6">
      <JsonLd data={guideLd(guide)} />
      <PageHeader
        title={GUIDES[guide].title}
        lead={GUIDES[guide].description}
        meta={`Last updated ${formatIsoDate(GUIDES[guide].lastUpdated)}`}
      />
      <Prose className="max-w-none">
        <Content />
      </Prose>
      <nav aria-label="More guides" className="flex justify-between gap-4 border-b3 border-t pt-4">
        {before ? (
          <TextLink href={`/docs/guides/${before}`}>Previous: {GUIDES[before].title}</TextLink>
        ) : (
          <span />
        )}
        {after ? (
          <TextLink href={`/docs/guides/${after}`}>Next: {GUIDES[after].title}</TextLink>
        ) : null}
      </nav>
    </article>
  );
}
