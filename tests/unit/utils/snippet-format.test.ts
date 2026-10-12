/**
 * @file tests/unit/utils/snippet-format.test.ts
 * @desc The shared snippet format, haruhime.snippet/1: a snippet out as JSON, read back, and
 *       refused when it isn't one (wrong format, wrong language, bad fields, not JSON).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { parseSnippetDoc, SNIPPET_FORMAT, toSnippetDoc } from "@/utils/snippet-format";

const SNIPPET = {
  name: "Header",
  description: "A centred title",
  body: "[centre][size=150]{{title}}[/size][/centre]",
  fields: [{ key: "title", label: "Title", kind: "text" as const, required: true, default: "" }],
};

describe("toSnippetDoc and parseSnippetDoc", () => {
  it("write a snippet out and read it back", () => {
    const doc = toSnippetDoc(SNIPPET);
    expect(JSON.parse(doc)).toEqual({ format: SNIPPET_FORMAT, language: "bbcode", ...SNIPPET });
    expect(parseSnippetDoc(doc)).toEqual({ ok: true, value: SNIPPET });
  });

  it("fills in what's optional", () => {
    const doc = JSON.stringify({
      format: SNIPPET_FORMAT,
      language: "bbcode",
      name: "x y z",
      body: "b",
    });
    expect(parseSnippetDoc(doc)).toEqual({
      ok: true,
      value: { name: "x y z", description: "", body: "b", fields: [] },
    });
  });

  it.each([
    ["not json", "{"],
    [
      "another format",
      JSON.stringify({ format: "other/1", language: "bbcode", name: "x", body: "b" }),
    ],
    [
      "another language",
      JSON.stringify({ format: SNIPPET_FORMAT, language: "css", name: "x", body: "b" }),
    ],
    ["no body", JSON.stringify({ format: SNIPPET_FORMAT, language: "bbcode", name: "x" })],
  ])("refuses %s", (_, text) => {
    expect(parseSnippetDoc(text).ok).toBe(false);
  });
});
