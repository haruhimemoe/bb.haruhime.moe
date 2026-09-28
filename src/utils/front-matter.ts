/**
 * @file src/utils/front-matter.ts
 * @desc Reads a built-in template file (content/templates/*.bb): front matter between two `---`
 *       lines, then the BBCode body. The front matter is a small YAML subset, all the templates
 *       need: `key: value` lines, and a `fields:` list whose items start with `  - key: value`
 *       and go on with `    key: value`. A value in double quotes is read as a JSON string (so
 *       it can hold `#` or a colon at the start); `true` and `false` are booleans; anything else
 *       is the text as written. Blank lines and `#` comments are skipped. Whatever it reads is
 *       checked with zod afterwards (src/schemas/builtin.ts). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** A parsed file: its front matter (unchecked) and its body. */
export type FrontMatterFile = { data: Record<string, unknown>; body: string };

/** Thrown for a file the parser can't read, naming the line. */
export class FrontMatterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrontMatterError";
  }
}

const PAIR = /^([A-Za-z][A-Za-z0-9_]*):(?:\s+(.*))?$/;

/**
 * @function scalar
 * @param raw {string} a value as written
 * @returns {string | boolean} a boolean, a JSON string's text, or the trimmed text
 */
export const scalar = (raw: string): string | boolean => {
  const text = raw.trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (text.startsWith('"')) return JSON.parse(text) as string;
  return text;
};

const pairOf = (text: string, lineNo: number): [string, string] => {
  const match = PAIR.exec(text);
  if (!match) throw new FrontMatterError(`line ${lineNo}: expected "key: value"`);
  return [match[1] ?? "", match[2] ?? ""];
};

/**
 * @function parseFrontMatter
 * @param source {string} the whole file
 * @returns {FrontMatterFile} its front matter and body (the body without the one line break
 *          that follows the closing `---`)
 * @throws {FrontMatterError} when the file has no front matter or a line it can't read
 */
export const parseFrontMatter = (source: string): FrontMatterFile => {
  const text = source.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) throw new FrontMatterError("the file must start with --- front matter ---");
  const data: Record<string, unknown> = {};
  let list: Record<string, unknown>[] | null = null;
  let item: Record<string, unknown> | null = null;
  (match[1] ?? "").split("\n").forEach((line, index) => {
    const lineNo = index + 2;
    if (line.trim() === "" || line.trimStart().startsWith("#")) return;
    if (!line.startsWith(" ")) {
      const [key, value] = pairOf(line, lineNo);
      list = value === "" ? [] : null;
      item = null;
      data[key] = list ?? scalar(value);
      return;
    }
    if (!list) throw new FrontMatterError(`line ${lineNo}: indented line outside a list`);
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      item = {};
      (list as Record<string, unknown>[]).push(item);
    } else if (!item) {
      throw new FrontMatterError(`line ${lineNo}: list item must start with "- "`);
    }
    const [key, value] = pairOf(trimmed.replace(/^- /, ""), lineNo);
    (item as Record<string, unknown>)[key] = scalar(value);
  });
  return { data, body: text.slice(match[0].length) };
};
