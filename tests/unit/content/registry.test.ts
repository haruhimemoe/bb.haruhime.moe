/**
 * @file tests/unit/content/registry.test.ts
 * @desc The content registry, the MDX loaders and the files under content/ name the same pages,
 *       so no page builds without its file and no file sits unregistered; every tag page is a
 *       docs extra under Tags.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { contentFileDrift } from "@haruhimemoe/next-kit/docs/files";
import { expect, it } from "vitest";
import { CONTENT, TAGS_GROUP } from "@/constants/content";
import { LOADERS } from "@/content/load";
import { tagSlug } from "@/utils/docs";

it("registry, loaders and files agree", () => {
  expect(contentFileDrift(CONTENT)).toEqual({ missingFiles: [], unregistered: [] });
  for (const s of CONTENT.sections)
    expect(Object.keys(LOADERS[s] ?? {}).sort()).toEqual(
      CONTENT.entries[s].map((e) => e.slug).sort(),
    );
});

it("has docs, guides and legal", () => {
  expect(CONTENT.sections).toEqual(["docs", "guides", "legal"]);
  expect(CONTENT.entries.docs.map((e) => e.slug)).toEqual(["api"]);
});

it("keeps nav titles within 32 characters", () => {
  for (const s of CONTENT.sections)
    for (const e of CONTENT.entries[s])
      expect((e.navTitle ?? e.title).length).toBeLessThanOrEqual(32);
});

it("lists every tag page as a docs extra under Tags, with its .md mirror", () => {
  expect(CONTENT.extra.docs.map((e) => e.href)).toEqual(
    TAGS.map((tag) => `/docs/tags/${tagSlug(tag.name)}`),
  );
  for (const e of CONTENT.extra.docs) {
    expect(e.group).toBe(TAGS_GROUP);
    expect(e.markdownHref).toBe(`${e.href}.md`);
    expect(e.badge).toMatch(/^\[.+\]$/);
  }
});
