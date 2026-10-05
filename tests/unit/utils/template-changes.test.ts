/**
 * @file tests/unit/utils/template-changes.test.ts
 * @desc templateChangeLines: name/description/kind renames, fields added/removed/reordered and
 *       changed, and the body's line diff kept apart for BodyDiff.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { diffValue } from "@haruhimemoe/vcs/json";
import { describe, expect, it } from "vitest";
import { templateChangeLines } from "@/utils/template-changes";
import { TEMPLATE_CODEC } from "@/utils/template-snapshot";

const base = {
  name: "Old name",
  description: "Old description",
  kind: "userpage" as const,
  body: "line one\nline two",
  fields: [{ key: "a", label: "A", kind: "text" as const, required: false, default: "" }],
};

describe("templateChangeLines", () => {
  it("reads a rename", () => {
    const after = { ...base, name: "New name" };
    const lines = templateChangeLines(diffValue(base, after, TEMPLATE_CODEC));
    expect(lines).toContainEqual({ kind: "text", text: "Renamed to New name" });
  });

  it("reads a description and kind change", () => {
    const after = { ...base, description: "New", kind: "tournament" as const };
    const lines = templateChangeLines(diffValue(base, after, TEMPLATE_CODEC));
    expect(lines).toContainEqual({ kind: "text", text: "Changed the description" });
    expect(lines).toContainEqual({ kind: "text", text: "Changed what it's for to Tournament" });
  });

  it("reads a field added, removed and reordered", () => {
    const added = {
      ...base,
      fields: [
        ...base.fields,
        { key: "b", label: "B", kind: "text" as const, required: false, default: "" },
      ],
    };
    expect(templateChangeLines(diffValue(base, added, TEMPLATE_CODEC))).toContainEqual({
      kind: "text",
      text: "Added the field B",
    });
    expect(templateChangeLines(diffValue(added, base, TEMPLATE_CODEC))).toContainEqual({
      kind: "text",
      text: "Removed the field B",
    });
    const reordered = {
      ...base,
      fields: [
        { key: "b", label: "B", kind: "text" as const, required: false, default: "" },
        ...base.fields,
      ],
    };
    const lines = templateChangeLines(diffValue(added, reordered, TEMPLATE_CODEC));
    expect(lines.filter((l) => l.kind === "text" && l.text === "Reordered fields")).toHaveLength(1);
  });

  it("reads a field's own change", () => {
    const changed = { ...base, fields: base.fields.map((f) => ({ ...f, label: "Changed" })) };
    expect(templateChangeLines(diffValue(base, changed, TEMPLATE_CODEC))).toContainEqual({
      kind: "text",
      text: "Changed the field a",
    });
  });

  it("keeps the body's line diff apart as a TextDiff", () => {
    const after = { ...base, body: "line one\nline two edited" };
    const lines = templateChangeLines(diffValue(base, after, TEMPLATE_CODEC));
    const bodyLine = lines.find((l) => l.kind === "body");
    expect(bodyLine).toBeDefined();
    if (bodyLine?.kind === "body") {
      expect(bodyLine.diff.some((run) => run.op === "insert")).toBe(true);
    }
  });
});
