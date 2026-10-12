/**
 * @file tests/unit/utils/recents.test.ts
 * @desc Recently used picks: newest first, no repeats, capped; stored lists read back and junk
 *       ignored.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { loadRecents, pushRecent, saveRecents } from "@/utils/recents";
import type { StorageLike } from "@/utils/storage";

const memory = (): StorageLike => {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
};

describe("pushRecent", () => {
  it("puts the newest first, once, up to the cap", () => {
    expect(pushRecent(["a", "b", "c"], "b", 3)).toEqual(["b", "a", "c"]);
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });
});

describe("loadRecents and saveRecents", () => {
  it("reads back what was saved, capped", () => {
    const storage = memory();
    saveRecents("k", ["x", "y", "z"], storage);
    expect(loadRecents("k", 2, storage)).toEqual(["x", "y"]);
  });

  it.each([null, "nope", "{}", "[1, 2]"])("ignores %j", (stored) => {
    const storage = memory();
    if (stored !== null) storage.setItem("k", stored);
    expect(loadRecents("k", 5, storage)).toEqual([]);
  });
});
