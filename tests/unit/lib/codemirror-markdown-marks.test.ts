/**
 * @file tests/unit/lib/codemirror-markdown-marks.test.ts
 * @desc Copy-as-markdown marks: set from toMarkdown's losses as info marks, kept while the text
 *       stays the same, and cleared by any change (typing, a toolbar edit, a draft switch).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { EditorState } from "@codemirror/state";
import { toMarkdown } from "@haruhimemoe/bbcode/markdown";
import { describe, expect, it } from "vitest";
import { markdownMarks, markdownMarksOf, markLossesEffect } from "@/lib/codemirror/markdown-marks";

const make = (doc: string) => EditorState.create({ doc, extensions: markdownMarks() });

const marked = (doc: string) => {
  const state = make(doc);
  return state.update({ effects: markLossesEffect(toMarkdown(doc).lost) }).state;
};

describe("markdown marks", () => {
  it("start empty", () => {
    expect(markdownMarksOf(make("[u]hi[/u]"))).toEqual([]);
  });

  it("mark each loss as info over its range", () => {
    const doc = "[u]hi[/u] and [color=red]x[/color]";
    const { lost } = toMarkdown(doc);
    const marks = markdownMarksOf(marked(doc));
    expect(lost.length).toBeGreaterThan(0);
    expect(marks).toHaveLength(lost.length);
    expect(marks.every((mark) => mark.severity === "info" && mark.source === "markdown")).toBe(
      true,
    );
    expect(marks[0]?.from).toBe(lost[0]?.start);
  });

  it("stay through a selection change", () => {
    const state = marked("[u]hi[/u]").update({ selection: { anchor: 2 } }).state;
    expect(markdownMarksOf(state)).not.toEqual([]);
  });

  it("clear on any doc change, a whole-doc swap included", () => {
    const before = marked("[u]hi[/u]");
    const after = before.update({
      changes: { from: 0, to: before.doc.length, insert: "other draft" },
    }).state;
    expect(markdownMarksOf(after)).toEqual([]);
  });

  it("read as none in a state without the extension", () => {
    expect(markdownMarksOf(EditorState.create({ doc: "x" }))).toEqual([]);
  });
});
