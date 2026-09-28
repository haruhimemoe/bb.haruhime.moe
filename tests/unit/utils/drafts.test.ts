/**
 * @file tests/unit/utils/drafts.test.ts
 * @desc Named drafts as data: reading them back from storage text, names, adding past the cap,
 *       switching, renaming, editing and deleting, never leaving the store empty.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { MAX_DRAFTS } from "@/constants/editor";
import type { Draft, DraftStore } from "@/schemas/draft";
import * as drafts from "@/utils/drafts";

const STORE: DraftStore = {
  activeId: "d-a",
  drafts: [
    { id: "d-a", name: "A", text: "a", updatedAt: 1 },
    { id: "d-b", name: "B", text: "b", updatedAt: 3 },
    { id: "d-c", name: "Draft 3", text: "c", updatedAt: 2 },
  ],
};

describe("drafts", () => {
  it("draws ids from the random bytes", () => {
    expect(drafts.newDraftId((bytes) => bytes.fill(1))).toBe("d-bbbbbbbbbb");
    expect(drafts.newDraftId()).toMatch(/^d-[a-z0-9]{10}$/);
  });

  it("reads a store back and refuses anything else", () => {
    expect(drafts.parseDraftStore(JSON.stringify(STORE))).toEqual(STORE);
    expect(drafts.parseDraftStore(null)).toBeNull();
    expect(drafts.parseDraftStore("{")).toBeNull();
    expect(drafts.parseDraftStore(JSON.stringify({ ...STORE, activeId: "d-x" }))).toBeNull();
    expect(drafts.parseDraftStore(JSON.stringify({ activeId: "d-a", drafts: [] }))).toBeNull();
  });

  it("names drafts", () => {
    expect(drafts.cleanDraftName("  a \n b  ", "old")).toBe("a b");
    expect(drafts.cleanDraftName("   ", "old")).toBe("old");
    expect(drafts.cleanDraftName("x".repeat(80), "old")).toHaveLength(60);
    expect(drafts.nextDraftName(null)).toBe("Draft 1");
    expect(drafts.nextDraftName(STORE)).toBe("Draft 4");
  });

  it("starts, opens and switches", () => {
    const start = drafts.startStore("d-new", 5, "hi", "Mine");
    expect(drafts.activeDraft(start)).toEqual({
      id: "d-new",
      name: "Mine",
      text: "hi",
      updatedAt: 5,
    });
    expect(drafts.selectDraft(STORE, "d-b").activeId).toBe("d-b");
    expect(drafts.selectDraft(STORE, "d-x")).toBe(STORE);
  });

  it("adds a draft first and open, dropping the oldest past the cap", () => {
    const added = drafts.addDraft(STORE, { id: "d-n", name: "N", text: "", updatedAt: 9 });
    expect(added.activeId).toBe("d-n");
    expect(added.drafts.map((d) => d.id)).toEqual(["d-n", "d-b", "d-c", "d-a"]);
    let full = drafts.startStore("d-0", 0);
    for (let i = 1; i <= MAX_DRAFTS; i++) {
      full = drafts.addDraft(full, { id: `d-${i}`, name: `${i}`, text: "", updatedAt: i });
    }
    expect(full.drafts).toHaveLength(MAX_DRAFTS);
    expect(full.drafts.some((d) => d.id === "d-0")).toBe(false);
  });

  it("renames and edits", () => {
    expect(drafts.renameDraft(STORE, "d-b", " New ").drafts[1]?.name).toBe("New");
    expect(drafts.renameDraft(STORE, "d-b", "").drafts[1]?.name).toBe("B");
    expect(drafts.renameDraft(STORE, "d-x", "y")).toBe(STORE);
    const edited = drafts.setDraftText(STORE, "d-a", "new", 7);
    expect(edited.drafts[0]).toMatchObject({ text: "new", updatedAt: 7 });
    expect(drafts.setDraftText(STORE, "d-a", "a", 7)).toBe(STORE);
  });

  it("deletes, opening the most recent left, or a fresh draft after the last", () => {
    expect(drafts.deleteDraft(STORE, "d-a", "d-f", 9)).toMatchObject({ activeId: "d-b" });
    expect(drafts.deleteDraft(STORE, "d-c", "d-f", 9)).toMatchObject({ activeId: "d-a" });
    const one = drafts.startStore("d-1", 1, "x");
    expect(drafts.deleteDraft(one, "d-1", "d-f", 9)).toEqual(drafts.startStore("d-f", 9));
  });
});

describe("adoptStore", () => {
  const mine = drafts.startStore("d-1", 5, "mine");
  it("takes the other tab's drafts and keeps this tab's newer open draft", () => {
    const theirs: DraftStore = {
      activeId: "d-2",
      drafts: [
        { id: "d-2", name: "New", text: "t", updatedAt: 6 },
        { id: "d-1", name: "Draft 1", text: "old", updatedAt: 4 },
      ],
    };
    expect(drafts.adoptStore(mine, theirs)).toEqual({
      activeId: "d-1",
      drafts: [theirs.drafts[0], mine.drafts[0]],
    });
    const newer = { ...theirs, drafts: [{ ...(theirs.drafts[1] as Draft), updatedAt: 7 }] };
    expect(drafts.adoptStore(mine, newer).drafts).toEqual(newer.drafts);
  });

  it("keeps this tab's open draft when the other tab deleted it", () => {
    const theirs = drafts.startStore("d-9", 8, "x");
    expect(drafts.adoptStore(mine, theirs).drafts.map((d) => d.id)).toEqual(["d-1", "d-9"]);
  });
});

describe("oldestDraft", () => {
  it("names the least recently changed draft only when the list is full", () => {
    expect(drafts.oldestDraft(STORE)).toBeNull();
    const full: DraftStore = {
      activeId: "d-0",
      drafts: Array.from({ length: MAX_DRAFTS }, (_, i) => ({
        id: `d-${i}`,
        name: `D${i}`,
        text: "",
        updatedAt: (i + 7) % MAX_DRAFTS,
      })),
    };
    expect(drafts.oldestDraft(full)?.updatedAt).toBe(0);
  });
});
