/**
 * @file src/app/docs/tags/[tag]/page.tsx
 * @desc /docs/tags/<tag>: one tag's reference, one page per entry in @haruhimemoe/bbcode's TAGS
 *       (the list item is /docs/tags/list-item), with links to the tags before and after it.
 *       Built at deploy; any other slug is a 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { PageHeader, TextLink } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TagReference } from "@/components/docs/TagReference";
import { tagBySlug, tagDescription, tagSlug, tagTitle } from "@/utils/docs";

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
 * @returns {Promise<Metadata>} its title, description and canonical URL
 */
export async function generateMetadata({
  params,
}: PageProps<"/docs/tags/[tag]">): Promise<Metadata> {
  const tag = tagBySlug((await params).tag);
  if (!tag) return {};
  return {
    title: `[${tag.name}] ${tagTitle(tag)}`,
    description: `osu! BBCode's [${tag.name}] tag: ${tagDescription(tag)}`,
    alternates: { canonical: `/docs/tags/${tagSlug(tag.name)}` },
  };
}

/**
 * @function TagPage
 * @param props {PageProps<"/docs/tags/[tag]">} the tag's slug
 * @returns {Promise<JSX.Element>} the tag's reference and the neighbouring tags
 */
export default async function TagPage({ params }: PageProps<"/docs/tags/[tag]">) {
  const tag = tagBySlug((await params).tag);
  if (!tag) notFound();
  const at = TAGS.indexOf(tag);
  const [before, after] = [TAGS[at - 1], TAGS[at + 1]];
  return (
    <article className="flex flex-col gap-6">
      <PageHeader title={`[${tag.name}] ${tagTitle(tag)}`} lead={tagDescription(tag)} />
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
