/**
 * @file tests/unit/content/legal-content.test.ts
 * @desc The legal pages keep the clauses the code depends on: images never stored, drafts in the
 *       browser, the per-IP and per-account counters, what reports keep, and account deletion.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTENT } from "@/constants/content";

const privacy = readFileSync("content/legal/privacy.mdx", "utf8");

describe("legal pages", () => {
  it("registers privacy and terms", () => {
    expect(CONTENT.entries.legal.map((e) => e.slug)).toEqual(["privacy", "terms"]);
  });

  it.each([
    "We never fetch, pass through or store an image.",
    "local storage",
    "pool imports count per IP address",
    "for 24 hours, an hour for names osu! doesn't know",
    "bb never fetches, receives or stores it",
    "template changes, reports and account deletions",
    "your osu! ID, the reason and when",
    "every template you own and the reports on them",
    "`bb-signed-in`",
  ])("privacy says %s", (clause) => {
    expect(privacy).toContain(clause);
  });
});
