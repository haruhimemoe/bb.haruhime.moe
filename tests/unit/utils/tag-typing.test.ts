/**
 * @file tests/unit/utils/tag-typing.test.ts
 * @desc The typing helpers: which tag a typed `]` opens, which tag `[/` should close, when Enter
 *       splits a tag pair, and how a `[*]` line continues.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { autoCloseName, innermostOpen, listContinuation, splitsPair } from "@/utils/tag-typing";

describe("autoCloseName", () => {
  it.each([
    ["[b", "", "b"],
    ["x [color=#ff66aa", " y", "color"],
    ["[box=Title", "", "box"],
    ["[strike", "", "strike"],
  ])("%j then ] closes %j", (before, after, name) => {
    expect(autoCloseName(before, after)).toBe(name);
  });

  it.each([
    ["[b", "[/b]"],
    ["[*", ""],
    ["[font", ""],
    ["[B", ""],
    ["[/b", ""],
    ["b", ""],
    ["[b]", ""],
  ])("%j with %j after closes nothing", (before, after) => {
    expect(autoCloseName(before, after)).toBeNull();
  });
});

describe("innermostOpen", () => {
  it.each([
    ["[b]x", "b"],
    ["[b][i]x", "i"],
    ["[b][i]x[/i]", "b"],
    ["[b]x[/b]", null],
    ["[list][*]a", "list"],
    ["[code][b]x", "code"],
    ["[code][b][/code][i]", "i"],
    ["[center]x", null],
    ["[i]x[/b]", "i"],
    ["[b][i]x[/b]", null],
    ["", null],
  ])("%j has %j open", (text, name) => {
    expect(innermostOpen(text)).toBe(name);
  });
});

describe("splitsPair", () => {
  it.each([
    ["[box=Title]", "[/box]", true],
    ["x [centre]", "[/centre] y", true],
    ["[list]", "[/list]", true],
    ["[b]", "[/b]", false],
    ["[box=Title]", "[/centre]", false],
    ["[box=Title]x", "[/box]", false],
  ])("%j | %j splits: %j", (before, after, splits) => {
    expect(splitsPair(before, after)).toBe(splits);
  });
});

describe("listContinuation", () => {
  it("continues a [*] line with text at its indentation", () => {
    expect(listContinuation("  [*] one")).toEqual({ kind: "continue", insert: "\n  [*] " });
    expect(listContinuation("[*]one")).toEqual({ kind: "continue", insert: "\n[*] " });
  });

  it("leaves the list from an empty [*] line", () => {
    expect(listContinuation("  [*] ")).toEqual({ kind: "exit", line: "  " });
    expect(listContinuation("[*]")).toEqual({ kind: "exit", line: "" });
  });

  it("does nothing elsewhere", () => {
    expect(listContinuation("plain")).toBeNull();
    expect(listContinuation("x [*] y")).toBeNull();
  });
});
