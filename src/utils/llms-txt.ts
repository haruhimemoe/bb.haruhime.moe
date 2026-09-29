/**
 * @file src/utils/llms-txt.ts
 * @desc What the site's /llms.txt (llmstxt.org) says, built with next-kit's llmsTxt: a title,
 *       the summary, notes on how bb and osu! BBCode behave, then sections of links: the pages,
 *       the guides and tag pages (each with its .md mirror noted), the built-in and public
 *       templates described by their own descriptions, the legal pages and where else to find
 *       bb. Only public templates reports haven't hidden are passed in. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { type LlmsLink, type LlmsSection, llmsTxt } from "@haruhimemoe/next-kit/seo";
import { LEGAL_DOCS, LEGAL_SLUGS } from "@/constants/legal";
import { SEO_SITE } from "@/constants/seo";
import { SITE } from "@/constants/site";
import { KIND_LABELS, type TemplateKind } from "@/constants/templates";
import { docsEntries } from "@/utils/docs";

/** A template as llms.txt lists it. */
export type LlmsTemplate = { id: string; name: string; kind: TemplateKind; description: string };

/** The prose under the summary: facts an assistant needs to answer about bb and osu! BBCode. */
export const LLMS_NOTES: readonly string[] = [
  "osu! BBCode is the markup osu! uses for userpages (the me! section), forum posts and beatmap descriptions. All three share one limit of 60,000 characters, tags included. osu! reads only its own lowercase tags; anything else, like [center] (osu! spells it [centre]), shows as plain text.",
  "bb's editor previews BBCode as osu! lays it out and underlines what osu! would show as text. Drafts stay in the browser and are never sent to bb. bb never hosts images: previews load [img] and [imagemap] URLs from their own host.",
  `Every guide and tag page has a Markdown copy at the same URL plus .md (e.g. ${SITE.url}/docs/tags/imagemap.md), and ${SITE.url}/llms-full.txt is all of the docs in one file.`,
  "bb is free and open source, part of haruhime.moe, and not affiliated with ppy Pty Ltd.",
];

const templateLink = (template: LlmsTemplate): LlmsLink => ({
  title: template.name,
  url: `${SITE.url}/t/${template.id}`,
  note: template.description
    ? `${KIND_LABELS[template.kind]}. ${template.description}`
    : KIND_LABELS[template.kind],
});

/**
 * @function llmsSections
 * @param lists {{ builtIns: LlmsTemplate[]; templates: LlmsTemplate[] }} what to list
 * @returns {LlmsSection[]} Pages, Guides, Tags, Built-in templates, Public templates (dropped
 *          when empty), Legal and Elsewhere
 */
export const llmsSections = ({
  builtIns,
  templates,
}: {
  builtIns: LlmsTemplate[];
  templates: LlmsTemplate[];
}): LlmsSection[] => {
  const docs = docsEntries();
  const docLink = (kind: "guide" | "tag") =>
    docs
      .filter((entry) => entry.kind === kind)
      .map((entry) => ({
        title: entry.tag ? `${entry.tag} ${entry.title}` : entry.title,
        url: `${SITE.url}${entry.href}`,
        note: entry.description,
      }));
  return [
    {
      heading: "Pages",
      links: [
        { title: "Editor", url: `${SITE.url}/`, note: "write osu! BBCode with a live preview" },
        { title: "Templates", url: `${SITE.url}/templates`, note: "the public template gallery" },
        {
          title: "Collab maker",
          url: `${SITE.url}/collab`,
          note: "draw link regions on a collab banner and get the [imagemap] BBCode",
        },
        {
          title: "Docs",
          url: `${SITE.url}/docs`,
          note: "the osu! BBCode reference, with common questions answered",
        },
      ],
    },
    { heading: "Guides", links: docLink("guide") },
    { heading: "Tags", links: docLink("tag") },
    { heading: "Built-in templates", links: builtIns.map(templateLink) },
    { heading: "Public templates", links: templates.map(templateLink) },
    {
      heading: "Legal",
      links: LEGAL_SLUGS.map((slug) => ({
        title: LEGAL_DOCS[slug].title,
        url: `${SITE.url}/legal/${slug}`,
        note: LEGAL_DOCS[slug].description,
      })),
    },
    {
      heading: "Elsewhere",
      links: [
        { title: "All docs in one file", url: `${SITE.url}/llms-full.txt` },
        { title: "Source on GitHub", url: SITE.repoUrl },
        { title: "Discord", url: SITE.discordUrl, note: "questions and bug reports" },
        { title: "haruhime.moe", url: SITE.parentUrl, note: "the other haruhime osu! tools" },
        { title: "packs", url: "https://packs.haruhime.moe", note: "osu! mappool pack downloads" },
        {
          title: "pools",
          url: "https://pools.haruhime.moe",
          note: "osu! tournament mappool builder",
        },
      ],
    },
  ];
};

/**
 * @function buildLlmsTxt
 * @param sections {LlmsSection[]} the link sections
 * @returns {string} the whole llms.txt
 */
export const buildLlmsTxt = (sections: LlmsSection[]): string =>
  llmsTxt({ title: SITE.title, summary: SEO_SITE.description, notes: LLMS_NOTES, sections });
