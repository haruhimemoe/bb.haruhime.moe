/**
 * @file src/lib/builtin-templates.ts
 * @desc The built-in templates: every content/templates/*.bb file, read once per process and
 *       kept (next.config.ts traces the folder into every server bundle), in file-name order.
 *       Each goes through toBuiltinTemplate, so a file that breaks the template rules throws
 *       here and in its test. Their uses counters live in the database
 *       (src/services/template-uses.ts).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { TemplateView } from "@/schemas/template-view";
import { toBuiltinTemplate } from "@/utils/builtin-template";

/** Where the built-in template files live, from the app's root. */
export const BUILTIN_DIR = path.join("content", "templates");

let cache: readonly TemplateView[] | null = null;

/**
 * @function loadBuiltinTemplates
 * @param dir {string} the folder to read (default content/templates under the working directory)
 * @returns {TemplateView[]} every `.bb` file there as a template, in file-name order
 * @throws when a file can't be read or breaks the template rules
 */
export const loadBuiltinTemplates = (
  dir: string = path.join(process.cwd(), BUILTIN_DIR),
): TemplateView[] =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".bb"))
    .sort()
    .map((name) =>
      toBuiltinTemplate(name.slice(0, -3), readFileSync(path.join(dir, name), "utf8")),
    );

/**
 * @function builtinTemplates
 * @returns {readonly TemplateView[]} the built-in templates, read on first use and kept
 */
export const builtinTemplates = (): readonly TemplateView[] => {
  cache ??= loadBuiltinTemplates();
  return cache;
};

/**
 * @function findBuiltinTemplate
 * @param id {string} a template id
 * @returns {TemplateView | null} the built-in template with that id, or null
 */
export const findBuiltinTemplate = (id: string): TemplateView | null =>
  builtinTemplates().find((template) => template.id === id) ?? null;
