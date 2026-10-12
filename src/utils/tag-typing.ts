/**
 * @file src/utils/tag-typing.ts
 * @desc What the editor does as you type, worked out on plain text: the tag a typed `]` opens
 *       (so its closing tag can follow), the tag `[/` should close, whether Enter between a block
 *       tag and its closing tag splits them onto their own lines, and how a `[*]` line continues.
 *       Tags are @haruhimemoe/bbcode's TAGS, names and aliases as written. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";

/** Every name and alias osu! reads, to its tag. */
const BY_NAME: ReadonlyMap<string, TagSpec> = new Map(
  TAGS.flatMap((tag) => [tag.name, ...tag.aliases].map((name) => [name, tag] as const)),
);

const OPENING_BEFORE = /\[([a-z*]+)(=[^\]\n]*)?$/;
const OPENING_AT_END = /\[([a-z]+)(?:=[^\]\n]*)?\]$/;
const TOKEN = /\[(\/?)([a-z*]+)(=[^\]\n]*)?\]/g;
const ITEM_LINE = /^(\s*)\[\*\]\s*(.*)$/;

/** What Enter does on a `[*]` line: start the next item, or leave the list. */
export type ListContinuation =
  | { kind: "continue"; insert: string }
  | { kind: "exit"; line: string };

/**
 * @function autoCloseName
 * @param before {string} the line up to the cursor, before the `]` being typed
 * @param after {string} the line from the cursor on
 * @returns {string | null} the tag to close after the cursor, or null (not a tag osu! knows, a
 *          list item, or already closed right there)
 */
export const autoCloseName = (before: string, after: string): string | null => {
  const name = OPENING_BEFORE.exec(before)?.[1];
  if (!name || name === "*" || !BY_NAME.has(name)) return null;
  return after.startsWith(`[/${name}]`) ? null : name;
};

/**
 * @function innermostOpen
 * @param text {string} everything before the `[/` being typed
 * @returns {string | null} the innermost tag still open there, as written, or null. Inside an
 *          open raw tag (`[code]`, `[img]`...) only its own closing tag counts.
 */
export const innermostOpen = (text: string): string | null => {
  const stack: string[] = [];
  let raw: string | null = null;
  for (const [, slash, name = "", arg] of text.matchAll(TOKEN)) {
    const tag = BY_NAME.get(name);
    if (!tag || name === "*") continue;
    if (slash) {
      if (arg !== undefined) continue;
      if (raw !== null && name !== raw) continue;
      const at = stack.lastIndexOf(name);
      if (at >= 0) stack.length = at;
      raw = null;
      continue;
    }
    if (raw !== null) continue;
    stack.push(name);
    if (tag.content === "raw") raw = name;
  }
  return stack.at(-1) ?? null;
};

/**
 * @function splitsPair
 * @param before {string} the line up to the cursor
 * @param after {string} the line from the cursor on
 * @returns {boolean} true when the cursor sits right between a block tag and its closing tag
 */
export const splitsPair = (before: string, after: string): boolean => {
  const name = OPENING_AT_END.exec(before)?.[1];
  if (!name || BY_NAME.get(name)?.display !== "block") return false;
  return after.startsWith(`[/${name}]`);
};

/**
 * @function listContinuation
 * @param line {string} the whole line, with the cursor at its end
 * @returns {ListContinuation | null} the next `[*] ` at the same indentation, leaving the list
 *          from an empty item, or null when the line isn't a list item
 */
export const listContinuation = (line: string): ListContinuation | null => {
  const match = ITEM_LINE.exec(line);
  if (!match) return null;
  const [, indent = "", rest = ""] = match;
  return rest === ""
    ? { kind: "exit", line: indent }
    : { kind: "continue", insert: `\n${indent}[*] ` };
};
