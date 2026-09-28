/**
 * @file src/services/templates-read.ts
 * @desc Reading one template for whoever asks (a built-in one for anyone, a person's one when
 *       src/utils/template-access.ts lets the viewer see it) and listing a person's own
 *       templates. Rows are read by shape only (templateReadSchema), so a template a newer
 *       filter refuses still reads; a row that doesn't even have the shape is logged and
 *       treated as missing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { QUERY_TIME_MS } from "@/constants/db";
import { MAX_TEMPLATES_PER_USER } from "@/constants/templates";
import { findBuiltinTemplate } from "@/lib/builtin-templates";
import { builtinUsesCollection, templatesCollection } from "@/models/Template";
import { type StoredTemplate, templateReadSchema } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { canView, type Viewer } from "@/utils/template-access";
import { isBuiltinId, isTemplateId } from "@/utils/template-ids";
import { toTemplateView } from "@/utils/template-view";

/**
 * @function readStored
 * @param row {unknown} a row from templates
 * @returns {StoredTemplate | null} it by shape, or null (logged) when it has another shape
 */
export const readStored = (row: unknown): StoredTemplate | null => {
  const parsed = templateReadSchema.safeParse(row);
  if (parsed.success) return parsed.data;
  console.error("[templates] a row doesn't have a template's shape", parsed.error.issues[0]);
  return null;
};

/**
 * @function findStoredTemplate
 * @param id {string} a person's template id (anything else finds nothing)
 * @returns {Promise<StoredTemplate | null>} the row, or null
 */
export const findStoredTemplate = async (id: string): Promise<StoredTemplate | null> => {
  if (!isTemplateId(id)) return null;
  const templates = await templatesCollection();
  const row = await templates.findOne({ _id: id }, { maxTimeMS: QUERY_TIME_MS });
  return row ? readStored(row) : null;
};

/**
 * @function getTemplateFor
 * @param id {string} a template id from the URL
 * @param viewer {Viewer} who asks
 * @returns {Promise<TemplateView | null>} the template (a built-in one with its uses), or null
 *          when there is none or the viewer can't see it
 */
export const getTemplateFor = async (id: string, viewer: Viewer): Promise<TemplateView | null> => {
  if (isBuiltinId(id)) {
    const builtin = findBuiltinTemplate(id);
    if (!builtin) return null;
    const row = await (await builtinUsesCollection()).findOne({ _id: id });
    return { ...builtin, uses: row?.uses ?? 0 };
  }
  const stored = await findStoredTemplate(id);
  return stored && canView(stored, viewer) ? toTemplateView(stored) : null;
};

/**
 * @function listMyTemplates
 * @param osuId {number} the owner's osu! id
 * @returns {Promise<TemplateView[]>} every template they own, last changed first
 */
export const listMyTemplates = async (osuId: number): Promise<TemplateView[]> => {
  const templates = await templatesCollection();
  const rows = await templates
    .find({ ownerOsuId: osuId }, { maxTimeMS: QUERY_TIME_MS })
    .sort({ updatedAt: -1, _id: 1 })
    .limit(MAX_TEMPLATES_PER_USER)
    .toArray();
  return rows.flatMap((row) => {
    const stored = readStored(row);
    return stored ? [toTemplateView(stored)] : [];
  });
};
