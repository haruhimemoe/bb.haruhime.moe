/**
 * @file tests/unit/tooling/pinned-deps.test.ts
 * @desc Every dependency is pinned to an exact version (no ^, ~, ranges or tags), so a new
 *       release (ours on npm included) never lands without a deliberate bump, and the shared
 *       @haruhimemoe packages sit at the versions bb is built and tested against.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import { describe, expect, it } from "vitest";
import pkg from "../../../package.json";

const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/** The shared packages and the versions bb uses (the same as pools, brand 0.5 for bb's mark). */
const SHARED: Readonly<Record<string, string>> = {
  "@haruhimemoe/bbcode": "0.2.2",
  "@haruhimemoe/ui": "0.19.0",
  "@haruhimemoe/osu": "0.4.0",
  "@haruhimemoe/next-kit": "0.15.0",
  "@haruhimemoe/pool": "0.2.0",
  "@haruhimemoe/brand": "0.8.0",
  "@haruhimemoe/vcs": "0.1.0",
};

describe("package.json", () => {
  it.each([
    ["dependencies", pkg.dependencies],
    ["devDependencies", pkg.devDependencies],
  ])("pins every entry in %s", (_, deps) => {
    const loose = Object.entries(deps).filter(([, version]) => !EXACT.test(version));
    expect(loose).toEqual([]);
  });

  it("pins the shared packages at the versions bb is built for", () => {
    const all: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    const shared = Object.fromEntries(
      Object.entries(all).filter(([name]) => name.startsWith("@haruhimemoe/")),
    );
    expect(shared).toEqual(SHARED);
  });
});
