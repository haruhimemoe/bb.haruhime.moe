/**
 * @file tests/unit/utils/docs.test.ts
 * @desc The tag pages from TAGS and the guides: slugs both ways, every tag with its own docs
 *       whose forms and examples osu! reads cleanly, and a guide file per registered guide with
 *       no link to pages that don't exist.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { existsSync, readFileSync } from "node:fs";
import { lint, parse, TAGS } from "@haruhimemoe/bbcode";
import { findEntry } from "@haruhimemoe/next-kit/docs";
import { describe, expect, it } from "vitest";
import { CONTENT } from "@/constants/content";
import { TAG_DOCS } from "@/constants/tag-docs";
import { tagBySlug, tagSlug, tagTitle } from "@/utils/docs";

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
  it.each(CONTENT.entries.guides.map((e) => e.slug))(
    "%s has a file with examples and no dead links",
    (slug) => {
      const path = `content/guides/${slug}.mdx`;
      expect(existsSync(path)).toBe(true);
      const text = readFileSync(path, "utf8");
      for (const [, href] of text.matchAll(/\]\((\/[^)]*)\)/g)) {
        expect(href).toMatch(
          /^\/(guides\/[a-z-]+|docs|docs\/tags\/[a-z*-]+|templates|collab|t\/bb-[a-z-]+)?$/,
        );
        const guide = /^\/guides\/(.+)$/.exec(href ?? "")?.[1];
        if (guide) expect(findEntry(CONTENT, "guides", guide)).toBeDefined();
      }
    },
  );
});
