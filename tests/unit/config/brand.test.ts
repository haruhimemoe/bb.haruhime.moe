/**
 * @file tests/unit/config/brand.test.ts
 * @desc The bb brand: the generated palette is hue 265, globals.css pins the same hue (and the h2
 *       lightness), and the generated icon files are there.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import palette from "../../../public/brand/bb-palette.json" with { type: "json" };

describe("bb brand", () => {
  it("uses hue 265 in the palette and the theme", () => {
    expect(palette.hue).toBe(265);
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/--hue:\s*265;/);
    expect(css).toMatch(/--h2-l:\s*45%;/);
  });

  it.each([
    "public/brand/bb-wordmark.svg",
    "public/brand/bb-wordmark-on-light.svg",
    "public/brand/bb-icon.svg",
    "public/brand/bb-banner.svg",
    "src/app/icon.svg",
    "src/app/apple-icon.png",
    "src/app/opengraph-image.png",
    "src/app/opengraph-image.alt.txt",
  ])("ships %s", (file) => {
    expect(existsSync(file)).toBe(true);
  });
});
