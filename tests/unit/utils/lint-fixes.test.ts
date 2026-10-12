/**
 * @file tests/unit/utils/lint-fixes.test.ts
 * @desc Fix all: every fix as one change set, inner tags closed first where several insert at
 *       one spot, overlapping fixes after the first dropped; and the problem counts.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { EditorState } from "@codemirror/state";
import { type Diagnostic, lint } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { countProblems, fixAllChanges } from "@/utils/lint-fixes";

const fixAll = (text: string): string =>
  EditorState.create({ doc: text })
    .update({ changes: fixAllChanges(lint(text)) })
    .state.doc.toString();

const diagnostic = (start: number, fix?: Diagnostic["fix"]): Diagnostic => ({
  code: "unknown-tag",
  severity: "warning",
  message: "",
  start,
  end: start + 1,
  ...(fix ? { fix } : {}),
});

describe("fixAllChanges", () => {
  it("applies every fix at once", () => {
    expect(fixAll("[center][B]x[/B][/center]")).toBe("[centre][b]x[/b][/centre]");
  });

  it("closes the later-opened tag first when two close at one spot", () => {
    expect(fixAll("[i][b]x")).toBe("[i][b]x[/b][/i]");
  });

  it("keeps the first of two overlapping fixes", () => {
    const changes = fixAllChanges([
      diagnostic(0, { start: 0, end: 4, text: "a" }),
      diagnostic(2, { start: 2, end: 6, text: "b" }),
      diagnostic(6, { start: 6, end: 6, text: "c" }),
    ]);
    expect(changes).toEqual([
      { from: 0, to: 4, insert: "a" },
      { from: 6, to: 6, insert: "c" },
    ]);
  });

  it("is empty when nothing has a fix", () => {
    expect(fixAllChanges([diagnostic(0)])).toEqual([]);
  });
});

describe("countProblems", () => {
  it("counts only the fixes Fix all will make", () => {
    const found: Diagnostic[] = [
      diagnostic(0, { start: 0, end: 4, text: "a" }),
      diagnostic(2, { start: 2, end: 6, text: "b" }),
    ];
    expect(countProblems(found).fixable).toBe(1);
  });

  it("counts errors, warnings and fixes, ignoring info", () => {
    const found: Diagnostic[] = [
      { ...diagnostic(0), severity: "error", fix: { start: 0, end: 0, text: "" } },
      diagnostic(1),
      { ...diagnostic(2), severity: "info" },
    ];
    expect(countProblems(found)).toEqual({ errors: 1, warnings: 1, fixable: 1 });
  });
});
