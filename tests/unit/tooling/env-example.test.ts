/**
 * @file tests/unit/tooling/env-example.test.ts
 * @desc .env.example documents every server variable and every optional one, and ships no secret
 *       values. The required server variables come first, so CONTRIBUTING.md's "first five" holds.
 *       An admin list never ships filled in.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OPTIONAL_ENV_KEYS, SERVER_ENV_KEYS } from "@/env";

const text = readFileSync(path.join(process.cwd(), ".env.example"), "utf8");

describe(".env.example", () => {
  it.each([...SERVER_ENV_KEYS, ...OPTIONAL_ENV_KEYS])("documents %s", (key) => {
    expect(text).toMatch(new RegExp(`^${key}=`, "m"));
  });

  it.each(["MONGODB_URI", "BETTER_AUTH_SECRET", "OSU_CLIENT_SECRET", "ADMIN_OSU_IDS"])(
    "leaves %s empty",
    (key) => {
      expect(text).toMatch(new RegExp(`^${key}=$`, "m"));
    },
  );

  it("lists the required server variables first, in schema order, before any optional one", () => {
    const assigned = [...text.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]);
    expect(assigned.slice(0, SERVER_ENV_KEYS.length)).toEqual(SERVER_ENV_KEYS);
  });

  it("matches the count CONTRIBUTING.md gives for the variables to fill in", () => {
    const contributing = readFileSync(path.join(process.cwd(), "CONTRIBUTING.md"), "utf8");
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    expect(contributing).toContain(`fill in the first ${words[SERVER_ENV_KEYS.length]} variables`);
  });
});
