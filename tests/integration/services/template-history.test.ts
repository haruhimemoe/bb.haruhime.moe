/**
 * @file tests/integration/services/template-history.test.ts
 * @desc Template history plumbing: ensureHistory makes a lazy root once, survives a create race,
 *       and setHead never moves a row's head backwards; writeLive refuses to move a row's content
 *       backwards when a later revision is already on it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { templateRevisions } from "@/lib/template-revisions";
import { templatesCollection } from "@/models/Template";
import {
  ensureHistory,
  HISTORY_START,
  refOf,
  setHead,
  writeLive,
} from "@/services/template-history";
import { snapshotOf } from "@/utils/template-snapshot";
import { setupTestDb } from "../../helpers/db";
import { insertTemplate } from "../../helpers/templates";

setupTestDb();

describe("ensureHistory", () => {
  it("makes a root for a row with no head, naming it HISTORY_START", async () => {
    const stored = await insertTemplate();
    const ref = await ensureHistory(stored);
    expect(ref.seq).toBe(0);
    const revision = await templateRevisions.get(stored._id, ref.id);
    expect(revision?.message).toBe(HISTORY_START);
    expect(revision?.value).toEqual(snapshotOf(stored));
    const row = await (await templatesCollection()).findOne({ _id: stored._id });
    expect(row?.head).toEqual(ref);
  });

  it("returns the same ref without writing again on a second call", async () => {
    const stored = await insertTemplate();
    const first = await ensureHistory(stored);
    const second = await ensureHistory(stored);
    expect(second).toEqual(first);
    const list = await templateRevisions.list(stored._id);
    expect(list).toHaveLength(1);
  });

  it("ends with one root when two calls race (no stored head yet)", async () => {
    const stored = await insertTemplate();
    const [a, b] = await Promise.all([ensureHistory(stored), ensureHistory(stored)]);
    expect(a).toEqual(b);
    const list = await templateRevisions.list(stored._id);
    expect(list).toHaveLength(1);
  });

  it("returns the row's own head when it already has one", async () => {
    const stored = await insertTemplate();
    const first = await ensureHistory(stored);
    const withHead = { ...stored, head: first };
    const again = await ensureHistory(withHead);
    expect(again).toEqual(first);
  });
});

describe("setHead", () => {
  it("never moves a row's head backwards", async () => {
    const stored = await insertTemplate();
    await setHead(stored._id, { id: "later", seq: 5 });
    await setHead(stored._id, { id: "earlier", seq: 2 });
    const row = await (await templatesCollection()).findOne({ _id: stored._id });
    expect(row?.head).toEqual({ id: "later", seq: 5 });
  });
});

describe("writeLive", () => {
  it("writes the row's content and head, bumping version", async () => {
    const stored = await insertTemplate();
    const root = await templateRevisions.create(
      stored._id,
      snapshotOf(stored),
      { id: String(stored.ownerOsuId), name: stored.ownerName },
      null,
    );
    const next = await templateRevisions.commit({
      docId: stored._id,
      base: refOf(root),
      value: { ...snapshotOf(stored), name: "Renamed" },
      author: { id: String(stored.ownerOsuId), name: stored.ownerName },
    });
    expect(next.status).toBe("committed");
    if (next.status !== "committed") throw new Error("expected committed");
    const written = await writeLive(stored, next.revision, {}, new Date());
    expect(written?.name).toBe("Renamed");
    expect(written?.head).toEqual(refOf(next.revision));
    expect(written?.version).toBe(stored.version + 1);
  });

  it("refuses to move content backwards when a later revision is already on the row", async () => {
    const stored = await insertTemplate();
    const root = await templateRevisions.create(
      stored._id,
      snapshotOf(stored),
      { id: String(stored.ownerOsuId), name: stored.ownerName },
      null,
    );
    const first = await templateRevisions.commit({
      docId: stored._id,
      base: refOf(root),
      value: { ...snapshotOf(stored), name: "First" },
      author: { id: String(stored.ownerOsuId), name: stored.ownerName },
    });
    if (first.status !== "committed") throw new Error("expected committed");
    // Someone else's write already moved the row to `first`.
    await writeLive(stored, first.revision, {}, new Date());
    // A slower caller, still holding the root, tries to write an older revision back.
    const result = await writeLive(stored, root, {}, new Date());
    expect(result).toBeNull();
  });
});
