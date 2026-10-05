/**
 * @file tests/unit/utils/template-history-access.test.ts
 * @desc templateHistoryAccessOf: the owner always reads and reverts; a visitor reads a public
 *       history of an unlisted or public template, never a private or hidden one; admins read any
 *       non-private template's history, hidden or not, but never revert.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { templateHistoryAccessOf } from "@/utils/template-history-access";

const base = { ownerOsuId: 10, visibility: "public" as const, hidden: false, historyPublic: false };
const owner = { osuId: 10, isAdmin: false };
const other = { osuId: 40, isAdmin: false };
const admin = { osuId: 99, isAdmin: true };

describe("templateHistoryAccessOf", () => {
  it("lets the owner always read and revert", () => {
    expect(templateHistoryAccessOf(base, owner)).toEqual({ canRead: true, canEdit: true });
    expect(templateHistoryAccessOf({ ...base, historyPublic: false }, owner).canRead).toBe(true);
  });

  it("refuses a visitor unless historyPublic is on and the template isn't hidden or private", () => {
    expect(templateHistoryAccessOf(base, other).canRead).toBe(false);
    expect(templateHistoryAccessOf({ ...base, historyPublic: true }, other).canRead).toBe(true);
    expect(
      templateHistoryAccessOf({ ...base, historyPublic: true, hidden: true }, other).canRead,
    ).toBe(false);
    expect(
      templateHistoryAccessOf({ ...base, historyPublic: true, visibility: "private" }, other)
        .canRead,
    ).toBe(false);
  });

  it("lets admins read any non-private template's history, hidden or not, but never edit", () => {
    expect(templateHistoryAccessOf({ ...base, hidden: true }, admin)).toEqual({
      canRead: true,
      canEdit: false,
    });
    expect(templateHistoryAccessOf({ ...base, visibility: "private" }, admin).canRead).toBe(false);
  });
});
