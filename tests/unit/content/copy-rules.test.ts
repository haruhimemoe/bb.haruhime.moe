/**
 * @file tests/unit/content/copy-rules.test.ts
 * @desc No em dashes in any copy: source, content, and the docs people read.
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
    return statSync(full).isDirectory() ? files(full) : [full];
  });

const COPY = [
  ...files("src"),
  ...files("content"),
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "llms.txt",
];

describe("copy rules", () => {
  it("uses no em dashes", () => {
    expect(COPY.filter((file) => readFileSync(file, "utf8").includes("—"))).toEqual([]);
  });
});
