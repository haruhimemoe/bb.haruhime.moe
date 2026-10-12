/**
 * @file src/utils/table.ts
 * @desc The table builder's text work. osu! has no table tag, so a table is laid out in
 *       monospace for `[code]`: `parseTable` reads rows pasted from a spreadsheet (tabs), a
 *       markdown table (pipes, with its alignment row) or CSV; `layoutTable` pads every column to
 *       its widest cell and draws ASCII, box-drawing or no borders; `codeBlock` wraps the lines in
 *       [code] so nothing in a cell can close it. Widths go by grapheme: East Asian wide
 *       characters and emoji count 2, combining marks 0 (`displayWidth`). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

/** How a column's cells sit in its width; null picks: numbers right, text left. */
export type Align = "left" | "center" | "right" | null;

/** A parsed table: every row as long as the longest, and each column's alignment. */
export type Table = { rows: string[][]; align: readonly Align[] };

/** The border style: `+-|`, box drawing, or padded columns. */
export type TableStyle = "ascii" | "unicode" | "none";

/** How to lay a table out. */
export type TableOptions = { style: TableStyle; header: boolean };

/** Code point ranges two columns wide in monospace (East Asian wide and fullwidth, emoji). */
const WIDE: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f300, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x20000, 0x3fffd],
];

/** Code point ranges that take no column: combining marks, zero-width joiner, variation selectors. */
const ZERO: readonly (readonly [number, number])[] = [
  [0x0300, 0x036f],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x200b, 0x200d],
  [0x20d0, 0x20ff],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe2f],
];

const within = (ranges: readonly (readonly [number, number])[], point: number): boolean =>
  ranges.some(([from, to]) => point >= from && point <= to);

const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
/** What makes a pictograph show as a two-column emoji: emoji presentation, VS16, a join or a skin tone. */
const EMOJI_STYLE = /\p{Emoji_Presentation}|\uFE0F|\u200D|[\u{1F3FB}-\u{1F3FF}]/u;
const FLAG = /\p{Regional_Indicator}/u;

/**
 * @function displayWidth
 * @param text {string} one cell
 * @returns {number} how many monospace columns it takes: 2 for an emoji (however many code points
 *          make it) or a wide character, 0 for a combining mark, 1 otherwise
 */
export const displayWidth = (text: string): number => {
  let width = 0;
  for (const { segment } of GRAPHEMES.segment(text)) {
    if ((PICTOGRAPHIC.test(segment) && EMOJI_STYLE.test(segment)) || FLAG.test(segment)) {
      width += 2;
      continue;
    }
    for (const char of segment) {
      const point = char.codePointAt(0) ?? 0;
      if (!within(ZERO, point)) width += within(WIDE, point) ? 2 : 1;
    }
  }
  return width;
};

const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const alignOf = (cell: string): Align => {
  const text = cell.trim();
  const left = text.startsWith(":");
  const right = text.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return left ? "left" : null;
};

/** A markdown row's cells: split on pipes, but not on `\|`, which is a pipe in a cell. */
const pipeCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replaceAll("\\|", "|").trim());

/** One CSV line: commas split, double quotes wrap a cell, `""` is a quote inside one. */
const csvCells = (line: string): string[] => {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
};

/** A markdown table: a row starting with `|`, or an alignment row with pipes as line 2. */
const isPipeTable = (lines: readonly string[]): boolean =>
  lines.some((line) => line.trim().startsWith("|")) ||
  ((lines[1] ?? "").includes("|") && SEPARATOR.test(lines[1] ?? ""));

/**
 * @function parseTable
 * @param text {string} what was pasted or typed: one row per line
 * @returns {Table} the rows (blank lines dropped, short rows padded) and column alignment (from a
 *          markdown alignment row, else null)
 */
export const parseTable = (text: string): Table => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  let align: Align[] = [];
  let rows: string[][];
  if (lines.some((line) => line.includes("\t"))) {
    rows = lines.map((line) => line.split("\t").map((cell) => cell.trim()));
  } else if (isPipeTable(lines)) {
    // The alignment row is always the second line of a markdown table.
    const separator = SEPARATOR.test(lines[1] ?? "") ? 1 : -1;
    if (separator >= 0) align = pipeCells(lines[separator] ?? "").map(alignOf);
    rows = lines.filter((_, index) => index !== separator).map(pipeCells);
  } else if (lines.some((line) => line.includes(","))) {
    rows = lines.map(csvCells);
  } else {
    rows = lines.map((line) => [line.trim()]);
  }
  const columns = Math.max(0, ...rows.map((row) => row.length));
  return {
    rows: rows.map((row) => [...row, ...Array<string>(columns - row.length).fill("")]),
    align: Array.from({ length: columns }, (_, index) => align[index] ?? null),
  };
};

const NUMBER = /^[-+]?(\d[\d,]*)?\.?\d+%?$/;

/** Numbers right, text left, judging every row after the first (often a header). */
const pickAlign = (rows: readonly string[][], column: number): "left" | "right" => {
  const cells = rows
    .slice(1)
    .map((row) => row[column] ?? "")
    .filter((cell) => cell !== "");
  return cells.length > 0 && cells.every((cell) => NUMBER.test(cell)) ? "right" : "left";
};

const pad = (cell: string, width: number, align: Align): string => {
  const gap = width - displayWidth(cell);
  if (align === "right") return " ".repeat(gap) + cell;
  if (align === "center") {
    const before = Math.floor(gap / 2);
    return " ".repeat(before) + cell + " ".repeat(gap - before);
  }
  return cell + " ".repeat(gap);
};

/** The box pieces for each border style: top, header rule, bottom (left, join, right), and bar. */
const BOXES = {
  ascii: { top: "+-++", rule: "+-++", bottom: "+-++", bar: "|" },
  unicode: { top: "┌─┬┐", rule: "├─┼┤", bottom: "└─┴┘", bar: "│" },
} as const;

const border = (widths: readonly number[], [left, line, join, right]: string): string =>
  `${left}${widths.map((width) => (line as string).repeat(width + 2)).join(join)}${right}`;

/**
 * @function layoutTable
 * @param table {Table} the parsed table
 * @param options {TableOptions} border style and whether the first row is a header
 * @returns {string[]} the table's lines, for a `[code]` block
 */
export const layoutTable = (table: Table, options: TableOptions): string[] => {
  const { rows } = table;
  const columns = table.align.length;
  const widths = Array.from({ length: columns }, (_, column) =>
    Math.max(1, ...rows.map((row) => displayWidth(row[column] ?? ""))),
  );
  const aligns = widths.map((_, column) => table.align[column] ?? pickAlign(rows, column));
  const cells = rows.map((row) =>
    widths.map((width, column) => pad(row[column] ?? "", width, aligns[column] ?? "left")),
  );
  const ruleAt = options.header && rows.length > 1 ? 1 : -1;
  if (options.style === "none") {
    const lines = cells.map((row) => row.join("  ").trimEnd());
    if (ruleAt > 0) lines.splice(ruleAt, 0, widths.map((width) => "-".repeat(width)).join("  "));
    return lines;
  }
  const box = BOXES[options.style];
  const lines = cells.map((row) => `${box.bar} ${row.join(` ${box.bar} `)} ${box.bar}`);
  if (ruleAt > 0) lines.splice(ruleAt, 0, border(widths, box.rule));
  return [border(widths, box.top), ...lines, border(widths, box.bottom)];
};

/**
 * @function codeBlock
 * @param lines {readonly string[]} the lines to show in monospace
 * @returns {string} the lines in [code], with any `[/code]` inside broken by a zero-width space
 *          so it can't close the block early
 */
export const codeBlock = (lines: readonly string[]): string =>
  `[code]\n${lines.map((line) => line.replaceAll("[/code]", "[\u200b/code]")).join("\n")}\n[/code]`;
