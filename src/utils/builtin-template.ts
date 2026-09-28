/**
 * @file src/utils/builtin-template.ts
 * @desc Turns one built-in template file into a TemplateView: its front matter (name, kind,
 *       description, fields, where a field's `required` defaults to false and its `default` to
 *       "") and body checked against the same content schema people's templates meet, content
 *       filter included, so a bad file fails its test instead of shipping. Built-in templates
 *       are public, never hidden, have no owner and no dates, and start with no uses. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { templateContentSchema } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { parseFrontMatter } from "@/utils/front-matter";
import { builtinId } from "@/utils/template-ids";

const withFieldDefaults = (fields: unknown): unknown => {
  // No fields at all is fine; anything but a list is left for zod to refuse.
  if (fields === undefined) return [];
  if (!Array.isArray(fields)) return fields;
  // The front matter parser only makes lists of maps.
  return fields.map((field: object) => ({ required: false, default: "", ...field }));
};

/**
 * @function toBuiltinTemplate
 * @param slug {string} the file's name without `.bb` (lower-case letters, digits and hyphens)
 * @param source {string} the file's text
 * @returns {TemplateView} the template, with no uses yet
 * @throws {FrontMatterError | ZodError} when the file can't be read or breaks the rules
 */
export const toBuiltinTemplate = (slug: string, source: string): TemplateView => {
  const { data, body } = parseFrontMatter(source);
  const content = templateContentSchema.parse({
    name: data.name,
    description: data.description ?? "",
    kind: data.kind,
    body,
    fields: withFieldDefaults(data.fields),
  });
  return {
    id: builtinId(slug),
    builtIn: true,
    ownerOsuId: null,
    ownerName: null,
    ...content,
    visibility: "public",
    forkOf: null,
    uses: 0,
    hidden: false,
    createdAt: null,
    updatedAt: null,
    version: 1,
  };
};
