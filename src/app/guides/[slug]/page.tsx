/**
 * @file src/app/guides/[slug]/page.tsx
 * @desc One guides page: the registry entry's title, description and last update, the MDX
 *       body, a "Copy as Markdown" button for its .md mirror, and TechArticle and
 *       breadcrumb JSON-LD. Static params from the registry; anything else 404s.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Mon Oct 5, 2026
 */

import { contentParams, contentPath, findEntry, markdownPath } from "@haruhimemoe/next-kit/docs";
import { notFoundMetadata, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ContentPage, Toc } from "@haruhimemoe/ui";
import type { MdxArticleModule } from "@haruhimemoe/ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT, GUIDE_SEO_TITLES } from "@/constants/content";
import { SEO_SITE } from "@/constants/seo";
import { LOADERS } from "@/content/load";
import { contentLd } from "@/utils/docs-seo";
import { cardImage, guideCard } from "@/utils/og-card";

type Props = { params: Promise<{ slug: string }> };

/** Only registered pages exist; anything else is a 404. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ slug: string }[]} one param per registered guides page
 */
export const generateStaticParams = () => contentParams(CONTENT, "guides");

/**
 * @function generateMetadata
 * @param props {Props} the route params
 * @returns {Promise<Metadata>} the page's title, description, canonical and article date
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = findEntry(CONTENT, "guides", slug);
  if (!entry) return notFoundMetadata(SEO_SITE, "Page");
  return pageMetadata(SEO_SITE, {
    path: contentPath("guides", slug),
    title: GUIDE_SEO_TITLES[slug] ?? entry.title,
    description: entry.description,
    ogType: "article",
    modifiedTime: entry.lastUpdated,
    images: [cardImage(contentPath("guides", slug), guideCard(entry))],
  });
}

/**
 * @function GuidePage
 * @param props {Props} the route params
 * @returns {Promise<JSX.Element>} the page in ContentPage, with an "On this page" toc
 * @throws {Error} Next's 404 for a slug that isn't registered
 */
export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const entry = findEntry(CONTENT, "guides", slug);
  const load = LOADERS.guides?.[slug];
  if (!entry || !load) notFound();
  const page = (await load()) as unknown as MdxArticleModule;
  const { default: Body } = page;
  return (
    <ContentPage
      title={entry.title}
      description={entry.description}
      lastUpdated={entry.lastUpdated}
      markdownHref={markdownPath("guides", slug)}
      jsonLd={contentLd("guides", entry)}
      toc={<Toc items={page.toc} />}
    >
      <Body />
    </ContentPage>
  );
}
