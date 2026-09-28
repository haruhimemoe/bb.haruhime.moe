/**
 * @file src/services/template-uses.ts
 * @desc The uses counters "Use" bumps: a person's template counts on its own row (only one
 *       that anyone may see, so a private or hidden template isn't counted by strangers), a
 *       built-in one in builtin_template_uses. Also reading the built-in counters back onto
 *       the built-in templates.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { QUERY_TIME_MS } from "@/constants/db";
import { builtinTemplates, findBuiltinTemplate } from "@/lib/builtin-templates";
import { builtinUsesCollection, templatesCollection } from "@/models/Template";
import type { TemplateView } from "@/schemas/template-view";
import { isBuiltinId, isTemplateId } from "@/utils/template-ids";

/**
 * @function bumpUses
 * @param id {string} a template id
 * @returns {Promise<boolean>} true when a template anyone can use was counted; false when there
 *          is no such template (or it's private or hidden)
 */
export const bumpUses = async (id: string): Promise<boolean> => {
  if (isBuiltinId(id)) {
    if (!findBuiltinTemplate(id)) return false;
    const uses = await builtinUsesCollection();
    await uses.updateOne({ _id: id }, { $inc: { uses: 1 } }, { upsert: true });
    return true;
  }
  if (!isTemplateId(id)) return false;
  const templates = await templatesCollection();
  const { matchedCount } = await templates.updateOne(
    { _id: id, visibility: { $ne: "private" }, hidden: false },
    { $inc: { uses: 1 } },
  );
  return matchedCount === 1;
};

/**
 * @function builtinsWithUses
 * @returns {Promise<TemplateView[]>} every built-in template with its uses counter
 */
export const builtinsWithUses = async (): Promise<TemplateView[]> => {
  const uses = await builtinUsesCollection();
  const rows = await uses.find({}, { maxTimeMS: QUERY_TIME_MS }).toArray();
  const counts = new Map(rows.map((row) => [row._id, row.uses]));
  return builtinTemplates().map((template) => ({
    ...template,
    uses: counts.get(template.id) ?? 0,
  }));
};
