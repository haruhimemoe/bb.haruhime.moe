/**
 * @file src/utils/llms-txt.ts
 * @desc What the site's /llms.txt (llmstxt.org) says: next-kit's contentLlmsTxt (title, summary,
 *       notes on how bb and osu! BBCode behave, then Docs with every tag page, Guides, API and
 *       Legal from the content registry, each linking its .md mirror), then bb's own sections:
 *       the pages, the built-in and public templates described by their own descriptions, and
 *       where else to find bb. Only public templates reports haven't hidden are passed in. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { type ContentApiLink, contentLlmsTxt } from "@haruhimemoe/next-kit/docs";
import { type LlmsLink, type LlmsSection, llmsTxt } from "@haruhimemoe/next-kit/seo";
import { OPENAPI_PATH } from "@/constants/api";
import { CONTENT } from "@/constants/content";
import { SEO_SITE } from "@/constants/seo";
import { SITE } from "@/constants/site";
import { KIND_LABELS, type TemplateKind } from "@/constants/templates";

/** A template as llms.txt lists it. */
export type LlmsTemplate = { id: string; name: string; kind: TemplateKind; description: string };

/** Where every docs, guides, tag and legal page is served as one Markdown file. */
export const LLMS_FULL_PATH = "/llms-full.txt";

/** The API section: the OpenAPI document and every page in one file. */
export const LLMS_API: readonly ContentApiLink[] = [
  {
    title: "OpenAPI",
    url: `${SITE.url}${OPENAPI_PATH}`,
    note: "the API as an OpenAPI 3.1 document",
  },
  {
    title: "All docs in one file",
    url: `${SITE.url}${LLMS_FULL_PATH}`,
    note: "the common questions and every docs, guide, tag and legal page as one Markdown file",
  },
];

/** The prose under the summary: facts an assistant needs to answer about bb and osu! BBCode. */
export const LLMS_NOTES: readonly string[] = [
  "osu! BBCode is the markup osu! uses for userpages (the me! section), forum posts and beatmap descriptions. All three share one limit of 60,000 characters, tags included. osu! reads only its own lowercase tags; anything else, like [center] (osu! spells it [centre]), shows as plain text.",
  "bb's editor previews BBCode as osu! lays it out and underlines what osu! would show as text. Drafts stay in the browser and are never sent to bb. bb never hosts images: previews load [img] and [imagemap] URLs from their own host.",
  `Every docs, guide, tag and legal page has a Markdown copy at the same URL plus .md (e.g. ${SITE.url}/docs/tags/imagemap.md), and ${SITE.url}${LLMS_FULL_PATH} is all of them in one file.`,
  "A small public API answers with an hbb_ key from the account page; see /docs/api.",
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
 * @returns {LlmsSection[]} bb's own sections, after the registry's: Pages, Built-in templates,
 *          Public templates (dropped when empty) and Elsewhere
 */
export const llmsSections = ({
  builtIns,
  templates,
}: {
  builtIns: LlmsTemplate[];
  templates: LlmsTemplate[];
}): LlmsSection[] => [
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
      { title: "Brand", url: `${SITE.url}/brand`, note: "the bb name, logos, colors and type" },
    ],
  },
  { heading: "Built-in templates", links: builtIns.map(templateLink) },
  { heading: "Public templates", links: templates.map(templateLink) },
  {
    heading: "Elsewhere",
    links: [
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

/**
 * @function llmsSectionsMarkdown
 * @param sections {readonly LlmsSection[]} link sections
 * @returns {string} just their "## heading" blocks, as llmsTxt writes them (empty ones dropped)
 */
export const llmsSectionsMarkdown = (sections: readonly LlmsSection[]): string =>
  llmsTxt({ title: "-", summary: "-", sections }).split("\n").slice(3).join("\n");

/**
 * @function buildLlmsTxt
 * @param sections {readonly LlmsSection[]} bb's own link sections, after the registry's
 * @returns {string} the whole llms.txt: title, summary and notes, then Docs, Guides, API and
 *          Legal from the content registry, then the sections given; ending in one newline
 */
export const buildLlmsTxt = (sections: readonly LlmsSection[]): string =>
  `${contentLlmsTxt({
    site: SEO_SITE,
    title: SITE.title,
    summary: SEO_SITE.description,
    notes: LLMS_NOTES,
    content: CONTENT,
    api: LLMS_API,
  }).replace(/\n$/, "")}\n${llmsSectionsMarkdown(sections)}`;
