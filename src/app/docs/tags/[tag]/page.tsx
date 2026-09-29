/**
 * @file src/app/docs/tags/[tag]/page.tsx
 * @desc /docs/tags/<tag>: one tag's reference, one page per entry in @haruhimemoe/bbcode's TAGS
 *       (the list item is /docs/tags/list-item), with its last update, links to the tags before
 *       and after it, and TechArticle and breadcrumb JSON-LD. Built at deploy; any other slug is
 *       a 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { notFoundMetadata, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { JsonLd, PageHeader, TextLink } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TagReference } from "@/components/docs/TagReference";
import { SEO_SITE } from "@/constants/seo";
import { TAG_DOCS_UPDATED } from "@/constants/tag-docs";
import { formatIsoDate } from "@/utils/date";
import { tagBySlug, tagDescription, tagSlug, tagTitle } from "@/utils/docs";
import { tagLd, tagSeoDescription, tagSeoTitle } from "@/utils/docs-seo";
import { cardImage, tagCard } from "@/utils/og-card";

/** Only the tags in TAGS have pages. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ tag: string }[]} every tag's slug
 */
export function generateStaticParams() {
  return TAGS.map((tag) => ({ tag: tagSlug(tag.name) }));
}

/**
 * @function generateMetadata
 * @param props {PageProps<"/docs/tags/[tag]">} the tag's slug
 * @returns {Promise<Metadata>} its search title, description, canonical URL and article date
 */
export async function generateMetadata({
  params,
}: PageProps<"/docs/tags/[tag]">): Promise<Metadata> {
  const tag = tagBySlug((await params).tag);
  if (!tag) return notFoundMetadata(SEO_SITE, "Tag");
  return pageMetadata(SEO_SITE, {
    path: `/docs/tags/${tagSlug(tag.name)}`,
    title: tagSeoTitle(tag),
    description: tagSeoDescription(tag),
    ogType: "article",
    modifiedTime: TAG_DOCS_UPDATED,
    images: [cardImage(`/docs/tags/${tagSlug(tag.name)}`, tagCard(tag))],
  });
}

/**
 * @function TagPage
 * @param props {PageProps<"/docs/tags/[tag]">} the tag's slug
 * @returns {Promise<JSX.Element>} the tag's reference, its JSON-LD and the neighbouring tags
 */
export default async function TagPage({ params }: PageProps<"/docs/tags/[tag]">) {
  const tag = tagBySlug((await params).tag);
  if (!tag) notFound();
  const at = TAGS.indexOf(tag);
  const [before, after] = [TAGS[at - 1], TAGS[at + 1]];
  return (
    <article className="flex flex-col gap-6">
      <JsonLd data={tagLd(tag)} />
      <PageHeader
        title={`[${tag.name}] ${tagTitle(tag)}`}
        lead={tagDescription(tag)}
        meta={`Last updated ${formatIsoDate(TAG_DOCS_UPDATED)}`}
      />
      <TagReference tag={tag} />
      <nav aria-label="More tags" className="flex justify-between gap-4 border-b3 border-t pt-4">
        {before ? (
          <TextLink href={`/docs/tags/${tagSlug(before.name)}`}>
            Previous: [{before.name}] {tagTitle(before)}
          </TextLink>
        ) : (
          <span />
        )}
        {after ? (
          <TextLink href={`/docs/tags/${tagSlug(after.name)}`}>
            Next: [{after.name}] {tagTitle(after)}
          </TextLink>
        ) : null}
      </nav>
    </article>
  );
}
