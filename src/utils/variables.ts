/**
 * @file src/utils/variables.ts
 * @desc Variables in a draft that isn't a template: `{{key}}` and `{{#key}}...{{/key}}` set once
 *       in the Variables tool and filled for the preview, the count and Copy. Only keys given a
 *       value are filled (a value set empty drops its sections); a key never set stays as
 *       written, so a draft that happens to hold `{{...}}` reads the same. Runs on
 *       @haruhimemoe/bbcode/template, every key a text field. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { fillTemplate, templateFields } from "@/utils/template-fill";

/** A draft's values by key. */
export type DraftVars = Readonly<Record<string, string>>;

/**
 * @function draftVariables
 * @param text {string} the draft
 * @returns {string[]} every key it uses, sections included, in first-use order
 */
export const draftVariables = (text: string): string[] => templateFields(text).keys;

/**
 * @function fillVariables
 * @param text {string} the draft
 * @param vars {DraftVars | undefined} the values set so far
 * @returns {string} the text with every key that has a value filled, the rest as written
 */
export const fillVariables = (text: string, vars: DraftVars | undefined): string => {
  const keys = Object.keys(vars ?? {});
  if (keys.length === 0) return text;
  const fields = keys.map((key) => ({ key, label: key, kind: "text" as const }));
  return fillTemplate(text, fields, vars ?? {}).text;
};
