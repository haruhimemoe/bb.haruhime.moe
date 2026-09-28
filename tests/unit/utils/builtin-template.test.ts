/**
 * @file tests/unit/utils/builtin-template.test.ts
 * @desc A built-in template file becomes a public TemplateView with field defaults filled in,
 *       and a file that breaks the template rules throws.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { toBuiltinTemplate } from "@/utils/builtin-template";

const FILE = [
  "---",
  "name: Test template",
  "kind: forum",
  "fields:",
  "  - key: who",
  "    label: Who",
  "    kind: user",
  "---",
  "Hi {{who}}",
].join("\n");

describe("toBuiltinTemplate", () => {
  it("reads the file as a public, built-in template", () => {
    expect(toBuiltinTemplate("test", FILE)).toEqual({
      id: "bb-test",
      builtIn: true,
      ownerOsuId: null,
      ownerName: null,
      name: "Test template",
      description: "",
      kind: "forum",
      body: "Hi {{who}}",
      fields: [{ key: "who", label: "Who", kind: "user", required: false, default: "" }],
      visibility: "public",
      forkOf: null,
      uses: 0,
      hidden: false,
      createdAt: null,
      updatedAt: null,
      version: 1,
    });
  });

  it("reads no fields as none", () => {
    expect(toBuiltinTemplate("x", "---\nname: Plain one\nkind: other\n---\nbody").fields).toEqual(
      [],
    );
  });

  it("throws for a file that breaks the rules", () => {
    expect(() => toBuiltinTemplate("x", "---\nname: ab\nkind: other\n---\nbody")).toThrow();
    expect(() => toBuiltinTemplate("x", FILE.replace("kind: forum", "kind: song"))).toThrow();
    expect(() =>
      toBuiltinTemplate("x", "---\nname: Bad fields\nkind: other\nfields: nope\n---\nbody"),
    ).toThrow();
  });
});
