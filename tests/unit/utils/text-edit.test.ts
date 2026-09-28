/**
 * @file tests/unit/utils/text-edit.test.ts
 * @desc Toolbar edits as plans: wrapping a selection, a placeholder when nothing is selected,
 *       unwrapping tags already around it, and inserting text in place of it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { insert, planEdit, wrap } from "@/utils/text-edit";

const bold = wrap("[b]", "[/b]", "bold");

describe("planEdit", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(planEdit("say hi", 4, 6, bold)).toEqual({
      from: 4,
      to: 6,
      insert: "[b]hi[/b]",
      anchor: 7,
      head: 9,
    });
  });

  it("selects a placeholder when nothing is selected", () => {
    expect(planEdit("", 0, 0, bold)).toEqual({
      from: 0,
      to: 0,
      insert: "[b]bold[/b]",
      anchor: 3,
      head: 7,
    });
    expect(wrap("[i]", "[/i]").placeholder).toBe("text");
  });

  it("unwraps when the same tags already sit around the selection", () => {
    expect(planEdit("[b]hi[/b]", 3, 5, bold)).toEqual({
      from: 0,
      to: 9,
      insert: "hi",
      anchor: 0,
      head: 2,
    });
  });

  it("inserts text in place of the selection", () => {
    expect(planEdit("abc", 1, 2, insert("XY"))).toEqual({
      from: 1,
      to: 2,
      insert: "XY",
      anchor: 3,
      head: 3,
    });
  });
});
