/**
 * @file src/utils/llms-txt.ts
 * @desc Builds the site's /llms.txt (llmstxt.org): a title, a one-line summary, then sections of
 *       links: the pages, the built-in templates, public templates and the legal pages. Names
 *       people typed are put on one line and their brackets escaped, so a template name can't
 *       break the Markdown. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { LEGAL_DOCS, LEGAL_SLUGS } from "@/constants/legal";
import { SITE } from "@/constants/site";
import { KIND_LABELS, type TemplateKind } from "@/constants/templates";

/** One link in a section. */
export type LlmsLink = { title: string; url: string; note?: string };
/** One section of links. */
export type LlmsSection = { heading: string; links: LlmsLink[] };

/** A template as llms.txt lists it. */
export type LlmsTemplate = { id: string; name: string; kind: TemplateKind };

/**
 * @function llmsText
 * @param text {string} text people typed
 * @returns {string} it on one line with Markdown link brackets escaped
 */
export const llmsText = (text: string): string =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[[\]]/g, (char) => `\\${char}`);

const templateLink = (template: LlmsTemplate): LlmsLink => ({
  title: llmsText(template.name),
  url: `${SITE.url}/t/${template.id}`,
  note: KIND_LABELS[template.kind],
});

/**
 * @function llmsSections
 * @param lists {{ builtIns: LlmsTemplate[]; templates: LlmsTemplate[] }} what to list
 * @returns {LlmsSection[]} Pages, Built-in templates, Public templates (when there are any) and
 *          Legal
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
      { title: "Editor", url: `${SITE.url}/`, note: "write osu! BBCode with a preview" },
      { title: "Templates", url: `${SITE.url}/templates`, note: "the public template gallery" },
      { title: "Docs", url: `${SITE.url}/docs`, note: "the osu! BBCode reference" },
    ],
  },
  { heading: "Built-in templates", links: builtIns.map(templateLink) },
  ...(templates.length > 0
    ? [{ heading: "Public templates", links: templates.map(templateLink) }]
    : []),
  {
    heading: "Legal",
    links: LEGAL_SLUGS.map((slug) => ({
      title: LEGAL_DOCS[slug].title,
      url: `${SITE.url}/legal/${slug}`,
    })),
  },
];

/**
 * @function buildLlmsTxt
 * @param sections {LlmsSection[]} the link sections
 * @returns {string} the whole llms.txt
 */
export const buildLlmsTxt = (sections: LlmsSection[]): string => {
  const body = sections
    .map(
      ({ heading, links }) =>
        `## ${heading}\n\n${links
          .map(({ title, url, note }) => `- [${title}](${url})${note ? `: ${note}` : ""}`)
          .join("\n")}`,
    )
    .join("\n\n");
  return `# ${SITE.title}\n\n> ${SITE.description}\n\n${body}\n`;
};
