/**
 * @file tests/unit/utils/template-fill.test.ts
 * @desc Filling {{key}} placeholders through @haruhimemoe/bbcode/template: typed values, defaults,
 *       each kind's output, refused values and undeclared placeholders left as written, and the
 *       form's own helpers (a field's value, required fields still blank).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import type { TemplateField } from "@/schemas/template-field";
import { fieldValue, fillTemplate, missingRequired, templateFields } from "@/utils/template-fill";

const field = (key: string, change: Partial<TemplateField> = {}): TemplateField => ({
  key,
  label: key,
  kind: "text",
  required: false,
  default: "",
  ...change,
});

describe("templateFields", () => {
  it("reports placeholders no field declares and fields no placeholder uses", () => {
    expect(templateFields("{{a}} {{ b }}", [field("a"), field("c")])).toEqual({
      keys: ["a", "b"],
      undeclared: ["b"],
      unused: ["c"],
    });
  });
});

describe("fillTemplate", () => {
  const fields = [
    field("name", { default: "someone" }),
    field("team", { kind: "users" }),
    field("from", { kind: "country" }),
  ];

  it("puts typed values in, by kind, and falls back to defaults for blank ones", () => {
    const { text, errors } = fillTemplate("Hi {{name}}!\n{{team}} {{from}}", fields, {
      name: " ",
      team: "peppy\n2",
      from: "jp",
    });
    expect(errors).toEqual([]);
    expect(text).toBe(
      "Hi someone!\n[profile]peppy[/profile]\n[profile=2]2[/profile] [img]https://osu.ppy.sh/assets/images/flags/1f1ef-1f1f5.svg[/img]",
    );
  });

  it("leaves refused values and undeclared placeholders as written", () => {
    const { text, errors } = fillTemplate("{{other}} {{from}}", fields, { from: "nowhere" });
    expect(text).toBe("{{other}} {{from}}");
    expect(errors.map((error) => error.key)).toEqual(["from"]);
  });
});

describe("the form's helpers", () => {
  it("reads a field's value or its default", () => {
    expect(fieldValue(field("a", { default: "d" }), {})).toBe("d");
    expect(fieldValue(field("a", { default: "d" }), { a: "typed" })).toBe("typed");
  });

  it("names required fields with neither a value nor a default", () => {
    const fields = [
      field("a", { required: true, label: "A" }),
      field("b", { required: true, default: "x", label: "B" }),
      field("c", { label: "C" }),
    ];
    expect(missingRequired(fields, {})).toEqual(["A"]);
    expect(missingRequired(fields, { a: "ok" })).toEqual([]);
  });
});
