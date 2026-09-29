/**
 * @file src/utils/template-seo.ts
 * @desc Search title, description and JSON-LD for a template's page. Only templates the gallery
 *       lists (built in, or public and not hidden by reports) are indexable or get JSON-LD;
 *       private, unlisted and hidden ones get neither. A description people typed is used when
 *       it says enough (50 characters or more); otherwise one is written from the kind and
 *       fields. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { clampDescription, type LdGraph, ld } from "@haruhimemoe/next-kit/seo";
import { SEO_SITE } from "@/constants/seo";
import { KIND_LABELS } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";

/** Shorter typed descriptions are replaced by a written one. */
export const TEMPLATE_DESCRIPTION_MIN = 50;

type TemplateSeoView = Pick<
  TemplateView,
  | "id"
  | "builtIn"
  | "name"
  | "description"
  | "kind"
  | "fields"
  | "visibility"
  | "hidden"
  | "ownerName"
  | "updatedAt"
>;

/**
 * @function isListedTemplate
 * @param template {TemplateSeoView} a template
 * @returns {boolean} true for built-in templates and public ones reports haven't hidden
 */
export const isListedTemplate = (template: TemplateSeoView): boolean =>
  template.builtIn || (template.visibility === "public" && !template.hidden);

const kindWords = (template: TemplateSeoView): string =>
  template.kind === "other" ? "BBCode" : KIND_LABELS[template.kind].toLowerCase();

/**
 * @function templateSeoTitle
 * @param template {TemplateSeoView} a template
 * @returns {string} "<name>: osu! userpage template" (or "osu! BBCode template" for other)
 */
export const templateSeoTitle = (template: TemplateSeoView): string =>
  `${template.name.replace(/\s+/g, " ").trim()}: osu! ${kindWords(template)} template`;

/**
 * @function templateSeoDescription
 * @param template {TemplateSeoView} a template
 * @returns {string} its own description when it has 50 characters or more, else a written one;
 *          at most 160 characters
 */
export const templateSeoDescription = (template: TemplateSeoView): string => {
  const own = template.description.replace(/\s+/g, " ").trim();
  if (own.length >= TEMPLATE_DESCRIPTION_MIN) return clampDescription(own);
  const count = template.fields.length;
  const fields =
    count === 0 ? "ready to copy" : `with ${count} ${count === 1 ? "field" : "fields"} to fill in`;
  const lead = own === "" ? "" : `${own.replace(/[.!?]*$/, "")}. `;
  return clampDescription(
    `${lead}An osu! ${kindWords(template)} template ${fields}. Preview it, open it in bb's BBCode editor, or fork it to make your own.`,
  );
};

/**
 * @function templateLd
 * @param template {TemplateSeoView} a template
 * @returns {LdGraph | null} CreativeWork (author, dateModified, genre the kind) and breadcrumbs
 *          for a listed template; null for private, unlisted and hidden ones. No isBasedOn: the
 *          template it forked may be private.
 */
export const templateLd = (template: TemplateSeoView): LdGraph | null => {
  if (!isListedTemplate(template)) return null;
  const path = `/t/${template.id}`;
  return ld.graph(
    ld.creativeWork(SEO_SITE, {
      path,
      name: template.name,
      description: templateSeoDescription(template),
      author: template.ownerName ?? { "@id": "https://www.haruhime.moe/#organization" },
      dateModified: template.updatedAt ?? undefined,
      genre: `osu! ${KIND_LABELS[template.kind]} template`,
    }),
    ld.breadcrumbs(SEO_SITE, [
      { name: "bb", path: "/" },
      { name: "Templates", path: "/templates" },
      { name: template.name, path },
    ]),
  );
};
