/**
 * @file tests/unit/utils/front-matter.test.ts
 * @desc The built-in templates' front matter subset: scalars, quoted JSON strings, booleans, a
 *       fields list, comments, and the errors for a file it can't read.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { FrontMatterError, parseFrontMatter, scalar } from "@/utils/front-matter";

describe("parseFrontMatter", () => {
  it("reads scalars, a list of maps and the body", () => {
    const file = [
      "---",
      "name: My template",
      "# a comment",
      "",
      "fields:",
      "  - key: a",
      "    required: true",
      '    default: "#ff0000"',
      "  - key: b",
      "kind: other",
      "---",
      "[b]body[/b]",
      "",
    ].join("\r\n");
    expect(parseFrontMatter(file)).toEqual({
      data: {
        name: "My template",
        fields: [{ key: "a", required: true, default: "#ff0000" }, { key: "b" }],
        kind: "other",
      },
      body: "[b]body[/b]\n",
    });
  });

  it("reads a file that ends right after the front matter", () => {
    expect(parseFrontMatter("---\nname: x\n---")).toEqual({ data: { name: "x" }, body: "" });
  });

  it.each([
    ["no front matter", "name: x"],
    ["a bad line", "---\nnot a pair\n---\n"],
    ["an indented line outside a list", "---\nname: x\n  key: y\n---\n"],
    ["a list item without a dash", "---\nfields:\n    key: y\n---\n"],
  ])("throws for %s", (_, file) => {
    expect(() => parseFrontMatter(file)).toThrow(FrontMatterError);
  });
});

describe("scalar", () => {
  it("reads booleans, JSON strings and plain text", () => {
    expect(scalar("true")).toBe(true);
    expect(scalar(" false ")).toBe(false);
    expect(scalar('"a\\nb"')).toBe("a\nb");
    expect(scalar(" plain ")).toBe("plain");
  });
});
