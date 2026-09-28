/**
 * @file tests/unit/utils/storage.test.ts
 * @desc Browser storage that never throws: missing, blocked and full storage all read as
 *       nothing saved.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it, vi } from "vitest";
import {
  browserStorage,
  readStored,
  type StorageLike,
  takeStored,
  writeStored,
} from "@/utils/storage";

const memory = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
};

const broken: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("full");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("storage", () => {
  it("reads, writes and takes", () => {
    const storage = memory();
    expect(writeStored("k", "v", storage)).toBe(true);
    expect(readStored("k", storage)).toBe("v");
    expect(takeStored("k", storage)).toBe("v");
    expect(readStored("k", storage)).toBeNull();
    expect(takeStored("k", storage)).toBeNull();
  });

  it("never throws when storage fails or is missing", () => {
    expect(readStored("k", broken)).toBeNull();
    expect(writeStored("k", "v", broken)).toBe(false);
    expect(takeStored("k", broken)).toBeNull();
    expect(writeStored("k", "v", null)).toBe(false);
    expect(readStored("k", null)).toBeNull();
    const leaky = { ...memory(), removeItem: broken.removeItem };
    leaky.setItem("k", "v");
    expect(takeStored("k", leaky)).toBe("v");
  });

  it("reads blocked browser storage as none", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("SecurityError");
      },
    });
    try {
      expect(browserStorage()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("has no browser storage in Node", () => {
    expect(browserStorage()).toBeNull();
    expect(readStored("k")).toBeNull();
  });
});
