/**
 * @file tests/integration/services/template-gallery.test.ts
 * @desc The gallery: built-in templates on page 1 (filtered, by uses under Most used), then
 *       public templates that aren't hidden, by text search, kind, newest or most used, 24 a
 *       page; the public listing the sitemap and llms.txt read; and your own templates.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it, vi } from "vitest";
import { builtinUsesCollection } from "@/models/Template";
import { listGallery, listPublicTemplates } from "@/services/template-gallery";
import { listMyTemplates } from "@/services/templates-read";
import { DEFAULT_GALLERY } from "@/utils/gallery-params";
import { setupTestDb } from "../../helpers/db";
import { insertTemplate } from "../../helpers/templates";

setupTestDb();

const day = (n: number) => new Date(Date.UTC(2026, 8, n));

describe("listGallery", () => {
  it("lists public, unhidden templates newest first, after the built-in ones", async () => {
    await insertTemplate({ _id: "t-old00001", updatedAt: day(1) });
    await insertTemplate({ _id: "t-new00001", updatedAt: day(5) });
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    await insertTemplate({ _id: "t-unlist01", visibility: "unlisted" });
    await insertTemplate({ _id: "t-hidden01", hidden: true, reports: 3 });
    const page = await listGallery(DEFAULT_GALLERY);
    expect(page.templates.map((t) => t.id)).toEqual(["t-new00001", "t-old00001"]);
    expect(page.total).toBe(2);
    expect(page.builtIns).toHaveLength(6);
    expect(page.builtIns.every((t) => t.builtIn)).toBe(true);
  });

  it("sorts by uses, built-in ones too", async () => {
    await insertTemplate({ _id: "t-few00001", uses: 1 });
    await insertTemplate({ _id: "t-many0001", uses: 50 });
    await (await builtinUsesCollection()).insertOne({ _id: "bb-feature-request", uses: 7 });
    const page = await listGallery({ ...DEFAULT_GALLERY, sort: "used" });
    expect(page.templates.map((t) => t.id)).toEqual(["t-many0001", "t-few00001"]);
    expect(page.builtIns[0]).toMatchObject({ id: "bb-feature-request", uses: 7 });
  });

  it("filters by kind and searches names and descriptions", async () => {
    await insertTemplate({ _id: "t-cup00001", name: "Spring cup post", kind: "tournament" });
    await insertTemplate({ _id: "t-page0001", name: "Cute userpage", description: "pastel" });
    const kind = await listGallery({ ...DEFAULT_GALLERY, kind: "tournament" });
    expect(kind.templates.map((t) => t.id)).toEqual(["t-cup00001"]);
    expect(kind.builtIns.map((t) => t.kind)).toEqual(["tournament", "tournament"]);
    const search = await listGallery({ ...DEFAULT_GALLERY, q: "pastel" });
    expect(search.templates.map((t) => t.id)).toEqual(["t-page0001"]);
    expect(search.builtIns).toEqual([]);
    const builtin = await listGallery({ ...DEFAULT_GALLERY, q: "staff list" });
    expect(builtin.builtIns.map((t) => t.id)).toEqual(["bb-tournament-staff-list"]);
  });

  it("pages 24 at a time and leaves the built-in ones on page 1", async () => {
    for (let i = 0; i < 30; i++) {
      await insertTemplate({ _id: `t-page${String(i).padStart(4, "0")}`, updatedAt: day(1 + i) });
    }
    const first = await listGallery(DEFAULT_GALLERY);
    expect(first).toMatchObject({ total: 30, pageCount: 2 });
    expect(first.templates).toHaveLength(24);
    const second = await listGallery({ ...DEFAULT_GALLERY, page: 2 });
    expect(second.templates).toHaveLength(6);
    expect(second.builtIns).toEqual([]);
  });

  it("lists nothing from the database under SKIP_ENV_VALIDATION", async () => {
    await insertTemplate();
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    try {
      expect((await listGallery(DEFAULT_GALLERY)).templates).toEqual([]);
      expect(await listPublicTemplates()).toEqual([]);
    } finally {
      vi.stubEnv("SKIP_ENV_VALIDATION", "");
    }
  });
});

describe("listPublicTemplates and listMyTemplates", () => {
  it("lists public unhidden templates for the sitemap, and all of a person's own", async () => {
    await insertTemplate({ _id: "t-public01", name: "A" });
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    await insertTemplate({ _id: "t-hidden01", hidden: true });
    await insertTemplate({ _id: "t-someone1", ownerOsuId: 99 });
    expect((await listPublicTemplates()).map((row) => row._id).sort()).toEqual([
      "t-public01",
      "t-someone1",
    ]);
    expect((await listMyTemplates(10)).map((t) => t.id).sort()).toEqual([
      "t-hidden01",
      "t-private1",
      "t-public01",
    ]);
  });
});
