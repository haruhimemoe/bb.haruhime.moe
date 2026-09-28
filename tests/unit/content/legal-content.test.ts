/**
 * @file tests/unit/content/legal-content.test.ts
 * @desc The legal pages keep the clauses the code depends on: images never stored, drafts in the
 *       browser, the per-IP and per-account counters, what reports keep, and account deletion.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isLegalSlug, LEGAL_DOCS, LEGAL_SLUGS } from "@/constants/legal";
import { formatIsoDate } from "@/utils/date";

const privacy = readFileSync("content/legal/privacy.mdx", "utf8");

describe("legal pages", () => {
  it.each(LEGAL_SLUGS)("%s has a file and a real date", (slug) => {
    expect(existsSync(`content/legal/${slug}.mdx`)).toBe(true);
    expect(() => formatIsoDate(LEGAL_DOCS[slug].lastUpdated)).not.toThrow();
    expect(isLegalSlug(slug)).toBe(true);
  });

  it("knows only its slugs", () => {
    expect(isLegalSlug("disclaimer")).toBe(false);
  });

  it.each([
    "We never fetch, pass through or store an image.",
    "local storage",
    "counts per IP address",
    "template changes, reports and account deletions",
    "your osu! ID, the reason and when",
    "every template you own and the reports on them",
    "`bb-signed-in`",
  ])("privacy says %s", (clause) => {
    expect(privacy).toContain(clause);
  });
});
