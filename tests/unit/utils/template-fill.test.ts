/**
 * @file tests/unit/utils/template-fill.test.ts
 * @desc Filling {{key}} placeholders: typed values, defaults, each kind's formatting, undeclared
 *       placeholders left alone and reported, and required fields still blank.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import type { TemplateField } from "@/schemas/template-field";
import {
  fieldValue,
  fillTemplate,
  formatValue,
  missingRequired,
  placeholderKeys,
  templateFields,
} from "@/utils/template-fill";

const field = (key: string, change: Partial<TemplateField> = {}): TemplateField => ({
  key,
  label: key,
  kind: "text",
  required: false,
  default: "",
  ...change,
});

describe("placeholders", () => {
  it("finds each key once, in order, with spaces inside the braces allowed", () => {
    expect(placeholderKeys("{{a}} {{ b }} {{a}} {{1x}} {c}")).toEqual(["a", "b"]);
  });

  it("reports keys no field declares", () => {
    expect(templateFields("{{a}} {{b}}", [field("a")])).toEqual(["b"]);
  });
});

describe("formatValue", () => {
  it.each([
    ["text", "  hi  ", "hi"],
    ["multiline", " a\n b ", " a\n b "],
    ["user", " peppy ", "[profile]peppy[/profile]"],
    ["user", "  ", ""],
    ["users", "a\n\n b \r\nc", "[profile]a[/profile]\n[profile]b[/profile]\n[profile]c[/profile]"],
    ["country", " jp ", "JP"],
    ["color", " #ff66aa ", "#ff66aa"],
  ] as const)("formats %s", (kind, value, expected) => {
    expect(formatValue(kind, value)).toBe(expected);
  });
});

describe("fillTemplate", () => {
  const fields = [field("name", { default: "someone" }), field("team", { kind: "users" })];

  it("puts typed values in and falls back to defaults for blank ones", () => {
    expect(fillTemplate("Hi {{name}}!\n{{team}}", fields, { name: " ", team: "a" })).toBe(
      "Hi someone!\n[profile]a[/profile]",
    );
    expect(fillTemplate("Hi {{ name }}", fields, { name: "Haru" })).toBe("Hi Haru");
  });

  it("leaves undeclared placeholders as written", () => {
    expect(fillTemplate("{{other}} {{name}}", fields, {})).toBe("{{other}} someone");
  });

  it("reads a field's value", () => {
    expect(fieldValue(fields[0] as TemplateField, {})).toBe("someone");
  });
});

describe("missingRequired", () => {
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
