/**
 * @file tests/unit/utils/template-seo.test.ts
 * @desc A template page's search title, description and JSON-LD: only listed templates get
 *       JSON-LD, short descriptions are written out from the kind and fields.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import {
  isListedTemplate,
  templateLd,
  templateSeoDescription,
  templateSeoTitle,
} from "@/utils/template-seo";

const base = {
  id: "t-abcd1234",
  builtIn: false,
  name: "My  cup\npost",
  description: "my userpage",
  kind: "userpage" as const,
  fields: [{ key: "name", label: "Name", kind: "text" as const, required: true, default: "" }],
  visibility: "public" as const,
  hidden: false,
  ownerName: "someone",
  updatedAt: "2026-09-28T10:00:00.000Z",
};

describe("template seo", () => {
  it("lists built-in and public, unhidden templates only", () => {
    expect(isListedTemplate(base)).toBe(true);
    expect(isListedTemplate({ ...base, visibility: "unlisted" })).toBe(false);
    expect(isListedTemplate({ ...base, visibility: "private" })).toBe(false);
    expect(isListedTemplate({ ...base, hidden: true })).toBe(false);
    expect(isListedTemplate({ ...base, builtIn: true, ownerName: null })).toBe(true);
  });

  it("titles by name and kind", () => {
    expect(templateSeoTitle(base)).toBe("My cup post: osu! userpage template");
    expect(templateSeoTitle({ ...base, kind: "other" })).toBe("My cup post: osu! BBCode template");
  });

  it("writes a description when the typed one is short", () => {
    const text = templateSeoDescription(base);
    expect(text).toMatch(/^my userpage\. An osu! userpage template with 1 field to fill in\./);
    expect(text.length).toBeLessThanOrEqual(160);
    const long = "A long description that says plenty about what this userpage template does.";
    expect(templateSeoDescription({ ...base, description: long })).toBe(long);
    expect(templateSeoDescription({ ...base, description: "", fields: [] })).toMatch(
      /^An osu! userpage template ready to copy\./,
    );
  });

  it("gives JSON-LD only to listed templates", () => {
    expect(templateLd({ ...base, visibility: "private" })).toBeNull();
    expect(templateLd({ ...base, visibility: "unlisted" })).toBeNull();
    expect(templateLd({ ...base, hidden: true })).toBeNull();
    const graph = templateLd(base);
    const work = graph?.["@graph"][0];
    expect(work).toMatchObject({
      "@type": "CreativeWork",
      url: "https://bb.haruhime.moe/t/t-abcd1234",
      dateModified: "2026-09-28T10:00:00.000Z",
      genre: "osu! Userpage template",
    });
    expect(JSON.stringify(work)).toContain("someone");
    expect(graph?.["@graph"][1]?.["@type"]).toBe("BreadcrumbList");
  });
});
