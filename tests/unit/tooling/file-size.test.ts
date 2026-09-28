/**
 * @file tests/unit/tooling/file-size.test.ts
 * @desc Source files stay under about 250 lines and components under about 200 (AGENTS.md
 *       section 3): split by what a part does.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : /\.tsx?$/.test(name) ? [full] : [];
  });

const lines = (file: string): number => readFileSync(file, "utf8").split("\n").length;

describe("file sizes", () => {
  it("keeps every source file under 250 lines", () => {
    expect(files("src").filter((file) => lines(file) > 250)).toEqual([]);
  });

  it("keeps every component under 200 lines", () => {
    expect(files("src/components").filter((file) => lines(file) > 200)).toEqual([]);
  });
});
