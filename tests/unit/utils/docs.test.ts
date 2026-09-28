/**
 * @file tests/unit/utils/docs.test.ts
 * @desc The docs' index from TAGS and the guides: slugs both ways, every tag with its own docs
 *       whose forms and examples osu! reads cleanly, a guide file per slug with no link to pages
 *       that don't exist yet, and search that ranks a tag's own name first.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { existsSync, readFileSync } from "node:fs";
import { lint, parse, TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { GUIDE_SLUGS, isGuideSlug } from "@/constants/guides";
import { TAG_DOCS } from "@/constants/tag-docs";
import { docsEntries, searchDocs, tagBySlug, tagSlug, tagTitle } from "@/utils/docs";

const entries = docsEntries();

describe("tag slugs", () => {
  it.each(TAGS.map((tag) => [tag.name, tag] as const))("[%s] has a page slug", (_, tag) => {
    expect(tagBySlug(tagSlug(tag.name))).toBe(tag);
  });

  it("names the list item list-item and refuses others", () => {
    expect(tagSlug("*")).toBe("list-item");
    expect(tagBySlug("center")).toBeUndefined();
  });
});

describe("tag docs", () => {
  it("cover exactly the tags in TAGS", () => {
    expect(Object.keys(TAG_DOCS).sort()).toEqual(TAGS.map((tag) => tag.name).sort());
  });

  it.each(TAGS.map((tag) => [tag.name, tag] as const))("[%s] examples lint clean", (_, tag) => {
    const example = TAG_DOCS[tag.name]?.example ?? tag.example;
    expect(lint(example).filter((d) => d.severity === "error")).toEqual([]);
    expect(parse(example).children.some((node) => node.type === "tag")).toBe(true);
    expect(tagTitle(tag)).not.toBe("");
  });
});

describe("guides", () => {
  it.each(GUIDE_SLUGS)("%s has a file with examples and no dead links", (slug) => {
    const path = `content/guides/${slug}.mdx`;
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, "utf8");
    for (const [, href] of text.matchAll(/\]\((\/[^)]*)\)/g)) {
      expect(href).toMatch(
        /^\/(docs\/guides\/[a-z-]+|docs\/tags\/[a-z*-]+|templates|collab|t\/bb-[a-z-]+)?$/,
      );
      const guide = /^\/docs\/guides\/(.+)$/.exec(href ?? "")?.[1];
      if (guide) expect(isGuideSlug(guide)).toBe(true);
    }
  });

  it("knows only its slugs", () => {
    expect(isGuideSlug("collab")).toBe(false);
  });
});

describe("docs index and search", () => {
  it("lists every guide, then every tag", () => {
    expect(entries).toHaveLength(GUIDE_SLUGS.length + TAGS.length);
    expect(entries[0]?.href).toBe("/docs/guides/getting-started");
    expect(entries.at(-1)?.href).toBe("/docs/tags/imagemap");
  });

  it("puts a tag's own name first", () => {
    expect(searchDocs(entries, "[b]")[0]?.href).toBe("/docs/tags/b");
    expect(searchDocs(entries, "strike")[0]?.href).toBe("/docs/tags/s");
    expect(searchDocs(entries, "b").every((entry) => entry.title !== "Heading")).toBe(true);
  });

  it("matches titles, descriptions and several words", () => {
    expect(searchDocs(entries, "center").map((entry) => entry.href)).toContain("/docs/tags/centre");
    expect(searchDocs(entries, "spoiler box").map((entry) => entry.href)).toEqual([
      "/docs/tags/spoilerbox",
    ]);
    expect(searchDocs(entries, "  ")).toHaveLength(entries.length);
    expect(searchDocs(entries, "zzzz")).toEqual([]);
  });
});
