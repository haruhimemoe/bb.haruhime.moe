/**
 * @file tests/unit/utils/collab-storage.test.ts
 * @desc The collab's saved copy: a round trip with fresh ids and nothing selected, regions fitted
 *       again, damaged or foreign entries ignored, an empty collab removing the entry, and a
 *       storage that throws.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { COLLAB_KEY } from "@/constants/collab";
import type { CollabState } from "@/utils/collab";
import { clearCollab, loadCollab, saveCollab } from "@/utils/collab-storage";
import type { StorageLike } from "@/utils/storage";

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
};

const ids = () => {
  let n = 100;
  return () => `r${++n}`;
};

const STATE: CollabState = {
  image: "https://i.example.com/a.png",
  regions: [{ id: "r1", x: 10, y: 10, w: 20, h: 20, href: "#", title: "peppy" }],
  selected: "r1",
};

describe("collab storage", () => {
  it("round-trips the image and regions with fresh ids, nothing selected", () => {
    const storage = memory();
    expect(saveCollab(STATE, storage)).toBe(true);
    expect(loadCollab(ids(), storage)).toEqual({
      image: STATE.image,
      regions: [{ ...STATE.regions[0], id: "r101" }],
      selected: null,
    });
  });

  it("fits regions back into the image", () => {
    const storage = memory();
    const regions = [{ x: 95, y: -5, w: 20, h: 0, href: "#", title: "" }];
    storage.setItem(COLLAB_KEY, JSON.stringify({ image: "", regions }));
    const rect = loadCollab(ids(), storage)?.regions[0];
    expect(rect).toMatchObject({ x: 80, y: 0, w: 20, h: 1 });
  });

  it.each([
    ["nothing", null],
    ["not JSON", "{oops"],
    ["the wrong shape", JSON.stringify({ image: 5, regions: [] })],
    ["an empty collab", JSON.stringify({ image: "", regions: [] })],
  ])("ignores %s", (_case, text) => {
    const storage = memory();
    if (text !== null) storage.setItem(COLLAB_KEY, text);
    expect(loadCollab(ids(), storage)).toBeNull();
  });

  it("removes the entry for an empty collab, and on clear", () => {
    const storage = memory();
    saveCollab(STATE, storage);
    saveCollab({ image: "", regions: [], selected: null }, storage);
    expect(storage.data.has(COLLAB_KEY)).toBe(false);
    saveCollab(STATE, storage);
    clearCollab(storage);
    expect(storage.data.has(COLLAB_KEY)).toBe(false);
  });

  it("says so when storage refuses the write", () => {
    const storage = memory();
    storage.setItem = () => {
      throw new Error("full");
    };
    expect(saveCollab(STATE, storage)).toBe(false);
  });
});
