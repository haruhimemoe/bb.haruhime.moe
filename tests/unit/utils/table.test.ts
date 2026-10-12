/**
 * @file tests/unit/utils/table.test.ts
 * @desc The table builder's text: rows from tabs, markdown pipes (with alignment) or CSV;
 *       ragged rows padded; display widths for wide characters; and each border style laid out.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { displayWidth, layoutTable, parseTable } from "@/utils/table";

describe("parseTable", () => {
  it("splits spreadsheet rows on tabs", () => {
    expect(parseTable("a\tb\n1\t2")).toEqual({
      rows: [
        ["a", "b"],
        ["1", "2"],
      ],
      align: [null, null],
    });
  });

  it("reads a markdown table and its alignment row", () => {
    const text = "| Map | Stars |\n| :-- | --: |\n| FD | 7.2 |";
    expect(parseTable(text)).toEqual({
      rows: [
        ["Map", "Stars"],
        ["FD", "7.2"],
      ],
      align: ["left", "right"],
    });
  });

  it("reads CSV with quoted cells and pads short rows", () => {
    expect(parseTable('name,note\n"Doe, J","say ""hi"""\nsolo').rows).toEqual([
      ["name", "note"],
      ["Doe, J", 'say "hi"'],
      ["solo", ""],
    ]);
  });

  it("drops blank lines and treats a lone column as one cell per line", () => {
    expect(parseTable("one\n\ntwo\n").rows).toEqual([["one"], ["two"]]);
  });
});

describe("displayWidth", () => {
  it.each([
    ["abc", 3],
    ["日本", 4],
    ["ｱ", 1],
    ["Ａ", 2],
    ["é", 1],
    ["🍣", 2],
    ["", 0],
  ])("%j is %i wide", (text, width) => {
    expect(displayWidth(text)).toBe(width);
  });
});

describe("layoutTable", () => {
  const table = {
    rows: [
      ["Player", "PP"],
      ["peppy", "12"],
      ["日本", "3456"],
    ],
    align: [null, null] as const,
  };

  it("draws ASCII borders with a header rule, numbers to the right", () => {
    expect(layoutTable(table, { style: "ascii", header: true })).toEqual([
      "+--------+------+",
      "| Player |   PP |",
      "+--------+------+",
      "| peppy  |   12 |",
      "| 日本   | 3456 |",
      "+--------+------+",
    ]);
  });

  it("draws box-drawing borders", () => {
    expect(layoutTable(table, { style: "unicode", header: false })).toEqual([
      "┌────────┬──────┐",
      "│ Player │   PP │",
      "│ peppy  │   12 │",
      "│ 日本   │ 3456 │",
      "└────────┴──────┘",
    ]);
  });

  it("pads columns without borders and follows given alignment", () => {
    const centred = { ...table, align: ["center", "left"] as const };
    expect(layoutTable(centred, { style: "none", header: true })).toEqual([
      "Player  PP",
      "------  ----",
      "peppy   12",
      " 日本   3456",
    ]);
  });
});
