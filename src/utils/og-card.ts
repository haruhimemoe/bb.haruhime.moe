/**
 * @file src/utils/og-card.ts
 * @desc Link preview cards (drawn by @haruhimemoe/brand's ogCard at <page>/og.png): what a
 *       template's, guide's and tag's card says, and the OgImage a page's metadata links,
 *       versioned by a hash of the card's text so an edit gets past caches. Listed templates,
 *       every guide and every tag get one; other pages keep the site's image. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import type { OgCardOptions } from "@haruhimemoe/brand";
import type { ContentEntry } from "@haruhimemoe/next-kit/docs";
import type { OgImage } from "@haruhimemoe/next-kit/seo";
import { KIND_LABELS } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { tagDescription, tagTitle } from "@/utils/docs";

/**
 * @function templateCard
 * @param template {Pick<TemplateView, "name" | "kind" | "fields" | "builtIn" | "ownerName">}
 *        a listed template
 * @returns {OgCardOptions} "osu! userpage template" over its name, then "By <owner> · 3 fields"
 *          ("Built in" for bb's own)
 */
export const templateCard = (
  template: Pick<TemplateView, "name" | "kind" | "fields" | "builtIn" | "ownerName">,
): OgCardOptions => {
  const kind = template.kind === "other" ? "BBCode" : KIND_LABELS[template.kind].toLowerCase();
  const count = template.fields.length;
  const fields = count === 0 ? "ready to copy" : `${count} ${count === 1 ? "field" : "fields"}`;
  const by = template.builtIn || !template.ownerName ? "Built in" : `By ${template.ownerName}`;
  return { eyebrow: `osu! ${kind} template`, title: template.name, subtitle: `${by} · ${fields}` };
};

/**
 * @function guideCard
 * @param guide {Pick<ContentEntry, "title" | "description">} a guide's registry entry
 * @returns {OgCardOptions} "bb guide" over its title, with its description under it
 */
export const guideCard = ({
  title,
  description,
}: Pick<ContentEntry, "title" | "description">): OgCardOptions => ({
  eyebrow: "bb guide",
  title,
  subtitle: description,
});

/**
 * @function tagCard
 * @param tag {TagSpec} a BBCode tag
 * @returns {OgCardOptions} "osu! BBCode tag" over "[b] Bold", with its description under it
 */
export const tagCard = (tag: TagSpec): OgCardOptions => ({
  eyebrow: "osu! BBCode tag",
  title: `[${tag.name}] ${tagTitle(tag)}`,
  subtitle: tagDescription(tag),
});

/**
 * @function cardImage
 * @param path {string} the page's path, like "/t/abc"
 * @param card {OgCardOptions} what its card says
 * @returns {OgImage} <path>/og.png?v=<hash of the card>, 1200×630 PNG, the title as alt
 */
export const cardImage = (path: string, card: OgCardOptions): OgImage => {
  let hash = 0x811c9dc5;
  for (const char of JSON.stringify(card)) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  }
  return {
    url: `${path}/og.png?v=${hash.toString(36)}`,
    width: 1200,
    height: 630,
    alt: card.subtitle ? `${card.title}: ${card.subtitle}` : card.title,
    type: "image/png",
  };
};
