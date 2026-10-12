/**
 * @file src/utils/snippet-format.ts
 * @desc The snippet file format the haruhime tools share, `haruhime.snippet/1`: a JSON object
 *       with the format, the language (`bbcode` here; other tools name their own), a name, an
 *       optional description, the body, and the body's `{{key}}` fields. bb writes it for "Copy
 *       as file" and reads it for "Import". It lives here until a second tool needs it, then
 *       moves to a package. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { z } from "zod";
import { BODY_MAX, DESCRIPTION_MAX, NAME_MAX } from "@/constants/templates";
import { type TemplateField, templateFieldsSchema } from "@/schemas/template-field";

/** The format's name and version. */
export const SNIPPET_FORMAT = "haruhime.snippet/1";

/** What a snippet carries in bb. */
export type Snippet = {
  name: string;
  description: string;
  body: string;
  fields: TemplateField[];
};

const docSchema = z.object({
  format: z.literal(SNIPPET_FORMAT),
  language: z.literal("bbcode"),
  name: z.string().min(1).max(NAME_MAX),
  description: z.string().max(DESCRIPTION_MAX).default(""),
  body: z.string().min(1).max(BODY_MAX),
  fields: templateFieldsSchema.default([]),
});

/**
 * @function toSnippetDoc
 * @param snippet {Snippet} a snippet
 * @returns {string} its `haruhime.snippet/1` JSON, pretty-printed
 */
export const toSnippetDoc = ({ name, description, body, fields }: Snippet): string =>
  JSON.stringify(
    { format: SNIPPET_FORMAT, language: "bbcode", name, description, body, fields },
    null,
    2,
  );

/**
 * @function parseSnippetDoc
 * @param text {string} what was pasted
 * @returns {{ ok: true; value: Snippet } | { ok: false }} the snippet, or not one bb can read
 *          (not JSON, another format or language, or a part out of range)
 */
export const parseSnippetDoc = (text: string): { ok: true; value: Snippet } | { ok: false } => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  const parsed = docSchema.safeParse(json);
  if (!parsed.success) return { ok: false };
  const { name, description, body, fields } = parsed.data;
  return { ok: true, value: { name, description, body, fields } };
};
