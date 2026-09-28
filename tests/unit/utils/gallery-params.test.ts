/**
 * @file tests/unit/utils/gallery-params.test.ts
 * @desc The gallery's URL: defaults for anything unknown, and links that leave defaults out.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { DEFAULT_GALLERY, galleryHref, parseGalleryParams } from "@/utils/gallery-params";

describe("parseGalleryParams", () => {
  it("reads every param", () => {
    expect(parseGalleryParams({ q: " cup ", kind: "tournament", sort: "used", page: "3" })).toEqual(
      {
        q: "cup",
        kind: "tournament",
        sort: "used",
        page: 3,
      },
    );
  });

  it("reads anything unknown as the default and takes the first of repeated params", () => {
    expect(parseGalleryParams({ kind: "song", sort: "best", page: "0" })).toEqual(DEFAULT_GALLERY);
    expect(parseGalleryParams({ page: "1.5" }).page).toBe(1);
    expect(parseGalleryParams({ page: "101" }).page).toBe(1);
    expect(parseGalleryParams({ q: ["a", "b"] }).q).toBe("a");
    expect(parseGalleryParams({ q: "x".repeat(300) }).q).toHaveLength(100);
  });
});

describe("galleryHref", () => {
  it("leaves defaults out", () => {
    expect(galleryHref(DEFAULT_GALLERY)).toBe("/templates");
    expect(galleryHref({ q: "a b", kind: "forum", sort: "used", page: 2 })).toBe(
      "/templates?q=a+b&kind=forum&sort=used&page=2",
    );
  });
});
