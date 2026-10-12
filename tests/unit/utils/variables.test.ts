/**
 * @file tests/unit/utils/variables.test.ts
 * @desc Variables in a draft: the keys it uses, filled only where a value was set (unset ones
 *       stay as written), sections dropping for a value set empty, and drafts keeping their
 *       values.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { parseDraftStore, setDraftVars, startStore } from "@/utils/drafts";
import { draftVariables, fillVariables } from "@/utils/variables";

describe("draftVariables", () => {
  it("lists every key once, sections included", () => {
    expect(draftVariables("{{name}} {{#link}}{{link}}{{/link}} {{name}}")).toEqual([
      "name",
      "link",
    ]);
    expect(draftVariables("[b]plain[/b]")).toEqual([]);
  });
});

describe("fillVariables", () => {
  it("fills the keys that have values and leaves the rest as written", () => {
    expect(fillVariables("hi {{name}}, {{other}}", { name: "peppy" })).toBe("hi peppy, {{other}}");
  });

  it("drops a section whose value is set empty, keeps one never set", () => {
    const text = "a{{#link}} [url={{link}}]x[/url]{{/link}}";
    expect(fillVariables(text, { link: "" })).toBe("a");
    expect(fillVariables(text, {})).toBe(text);
  });

  it("is the text itself without values", () => {
    expect(fillVariables("{{x}}", undefined)).toBe("{{x}}");
  });
});

describe("draft values", () => {
  it("are kept with the draft and survive storage", () => {
    const store = startStore("d1", 1, "{{name}}");
    const next = setDraftVars(store, "d1", { name: "peppy" }, 2);
    expect(next.drafts[0]).toMatchObject({ vars: { name: "peppy" }, updatedAt: 2 });
    expect(parseDraftStore(JSON.stringify(next))?.drafts[0]?.vars).toEqual({ name: "peppy" });
    expect(parseDraftStore(JSON.stringify(store))?.drafts[0]?.vars).toBeUndefined();
  });
});
