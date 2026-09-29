/**
 * @file tests/unit/utils/preview-scale.test.ts
 * @desc The preview's scale: drawn at osu!'s width and zoomed down to fit (never up), the fit or
 *       actual size choice read back from storage, and which osu! column a template is for.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import {
  fitZoom,
  loadScaleMode,
  parseScaleMode,
  previewTargetFor,
  saveScaleMode,
} from "@/utils/preview-scale";
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

describe("fitZoom", () => {
  it("scales osu!'s width down to the room there is", () => {
    expect(fitZoom(445, 890)).toBe(0.5);
    expect(fitZoom(600, 890)).toBeCloseTo(0.674, 3);
  });

  it("never scales up", () => {
    expect(fitZoom(1200, 890)).toBe(1);
    expect(fitZoom(890, 890)).toBe(1);
  });

  it("rounds down, so the scaled canvas never overflows by a fraction of a pixel", () => {
    expect(fitZoom(600, 890) * 890).toBeLessThanOrEqual(600);
  });

  it("stays at 1 before anything is measured", () => {
    expect(fitZoom(0, 890)).toBe(1);
    expect(fitZoom(Number.NaN, 890)).toBe(1);
    expect(fitZoom(400, 0)).toBe(1);
  });
});

describe("scale mode", () => {
  it("fits by default and reads only what it wrote", () => {
    expect(parseScaleMode(null)).toBe("fit");
    expect(parseScaleMode("junk")).toBe("fit");
    expect(parseScaleMode("actual")).toBe("actual");
  });

  it("remembers the choice", () => {
    const storage = memory();
    expect(loadScaleMode(storage)).toBe("fit");
    expect(saveScaleMode("actual", storage)).toBe(true);
    expect(loadScaleMode(storage)).toBe("actual");
  });

  it("works without storage", () => {
    expect(loadScaleMode(null)).toBe("fit");
    expect(saveScaleMode("actual", null)).toBe(false);
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
      removeItem: () => undefined,
    };
    expect(loadScaleMode(broken)).toBe("fit");
    expect(saveScaleMode("fit", broken)).toBe(false);
  });
});

describe("previewTargetFor", () => {
  it("maps a template's kind to the osu! column it's written for", () => {
    expect(previewTargetFor("userpage")).toBe("userpage");
    expect(previewTargetFor("forum")).toBe("forum");
    expect(previewTargetFor("tournament")).toBe("forum");
    expect(previewTargetFor("beatmap")).toBe("beatmap");
    expect(previewTargetFor("other")).toBe("userpage");
  });
});
