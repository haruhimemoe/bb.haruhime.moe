/**
 * @file tests/integration/services/template-proposals.test.ts
 * @desc Proposals, a fork's changes offered back to what it copied: proposing (only a fork's
 *       owner, only with changes, never to a built-in or a template they can't see); the
 *       upstream owner's list; a clean merge committing onto the upstream and crediting the
 *       proposer; an overlapping one handing back a draft and writing nothing; declining,
 *       withdrawing; a resolving save marking the proposal merged; deleting a template or its
 *       owner's data taking its proposals along.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { templateRevisions } from "@/lib/template-revisions";
import { templateProposalsCollection } from "@/models/Template";
import { deleteTemplatesOf } from "@/services/account";
import {
  createProposal,
  declineProposal,
  listProposals,
  mergeProposal,
  withdrawProposal,
} from "@/services/template-proposals";
import { forkTemplate } from "@/services/templates-create";
import { findStoredTemplate } from "@/services/templates-read";
import { deleteTemplate, updateTemplate } from "@/services/templates-update";
import { setupTestDb } from "../../helpers/db";
import { insertTemplate } from "../../helpers/templates";

setupTestDb();

const forker = { osuId: 40, username: "forker", isAdmin: false };
const stranger = { osuId: 41, username: "someone", isAdmin: false };

/** A source with four lines, its owner, and a fork of it whose second line changed. */
const forkWithChange = async () => {
  const source = await insertTemplate({ name: "Source", body: "one\ntwo\nthree\nfour" });
  const owner = { osuId: source.ownerOsuId, username: source.ownerName, isAdmin: false };
  const forked = await forkTemplate(source._id, forker);
  if (!forked.ok) throw new Error("fork failed");
  const fork = forked.value;
  const changed = await updateTemplate(fork.id, forker, {
    baseVersion: fork.version,
    body: "one\nTWO\nthree\nfour",
  });
  if (!changed.ok) throw new Error("fork save failed");
  return { source, owner, fork };
};

const propose = async (forkId: string, message = "Capitalize two") => {
  const answer = await createProposal(forkId, forker, { message });
  if (!answer.ok) throw new Error(`propose failed: ${answer.status}`);
  return answer.value;
};

describe("createProposal", () => {
  it("offers a fork's changes to its upstream", async () => {
    const { source, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    expect(proposal).toMatchObject({
      templateId: source._id,
      fromId: fork.id,
      proposer: { osuId: forker.osuId, username: "forker" },
      message: "Capitalize two",
      status: "open",
    });
  });

  it("refuses a fork without changes, someone else's fork and a template that isn't a fork", async () => {
    const source = await insertTemplate({ body: "a" });
    const forked = await forkTemplate(source._id, forker);
    if (!forked.ok) throw new Error("fork failed");
    expect(await createProposal(forked.value.id, forker, { message: "" })).toMatchObject({
      ok: false,
      status: 409,
      code: "no_changes",
    });
    // Someone else's fork is private to them: it reads as missing.
    expect(await createProposal(forked.value.id, stranger, { message: "" })).toMatchObject({
      ok: false,
      status: 404,
    });
    const plain = await insertTemplate({ ownerOsuId: forker.osuId });
    expect(await createProposal(plain._id, forker, { message: "" })).toMatchObject({
      ok: false,
      status: 404,
      code: "upstream_unavailable",
    });
  });

  it("keeps one open proposal per fork, replacing its changes", async () => {
    const { fork } = await forkWithChange();
    const first = await propose(fork.id, "first");
    const second = await propose(fork.id, "second");
    expect(second.id).toBe(first.id);
    expect(second.message).toBe("second");
  });
});

describe("listProposals", () => {
  it("shows the upstream owner its open proposals with what they change", async () => {
    const { source, owner, fork } = await forkWithChange();
    await propose(fork.id);
    const answer = await listProposals(source._id, owner);
    expect(answer.ok && answer.value).toEqual([
      expect.objectContaining({
        fromId: fork.id,
        changes: [expect.objectContaining({ op: "text", path: "body" })],
      }),
    ]);
    expect(await listProposals(source._id, stranger)).toMatchObject({ ok: false, status: 403 });
  });
});

describe("mergeProposal", () => {
  it("commits a clean merge onto the upstream and closes the proposal", async () => {
    const { source, owner, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    // The owner changes another line meanwhile: the merge keeps both.
    await updateTemplate(source._id, owner, {
      baseVersion: source.version,
      body: "one\ntwo\nthree\n4",
    });
    const answer = await mergeProposal(source._id, proposal.id, owner);
    expect(answer).toMatchObject({ ok: true, value: { body: "one\nTWO\nthree\n4" } });
    const head = await templateRevisions.head(source._id);
    expect(head?.message).toContain("forker");
    const row = await (await templateProposalsCollection()).findOne({ _id: proposal.id });
    expect(row?.status).toBe("merged");
  });

  it("hands back a draft for overlapping changes and writes nothing", async () => {
    const { source, owner, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    await updateTemplate(source._id, owner, {
      baseVersion: source.version,
      body: "one\ntwo!\nthree",
    });
    const answer = await mergeProposal(source._id, proposal.id, owner);
    expect(answer).toMatchObject({ ok: false, status: 409, code: "proposal_conflict" });
    expect((await findStoredTemplate(source._id))?.body).toBe("one\ntwo!\nthree");
    const row = await (await templateProposalsCollection()).findOne({ _id: proposal.id });
    expect(row?.status).toBe("open");
  });

  it("marks the proposal merged once the resolving save lands", async () => {
    const { source, owner, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    const saved = await findStoredTemplate(source._id);
    await updateTemplate(source._id, owner, {
      baseVersion: saved?.version ?? 0,
      body: "one\nTWO (merged by hand)\nthree",
      merged: proposal.id,
    });
    const row = await (await templateProposalsCollection()).findOne({ _id: proposal.id });
    expect(row?.status).toBe("merged");
  });

  it("is the upstream owner's only", async () => {
    const { source, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    expect(await mergeProposal(source._id, proposal.id, stranger)).toMatchObject({
      ok: false,
      status: 403,
    });
  });
});

describe("declining, withdrawing and deleting", () => {
  it("lets the owner decline and the proposer withdraw", async () => {
    const { source, owner, fork } = await forkWithChange();
    const proposal = await propose(fork.id);
    expect(await withdrawProposal(proposal.id, owner)).toMatchObject({ ok: false, status: 403 });
    expect(await declineProposal(source._id, proposal.id, owner)).toMatchObject({ ok: true });
    const again = await propose(fork.id, "again");
    expect(again.id).not.toBe(proposal.id);
    expect(await withdrawProposal(again.id, forker)).toMatchObject({ ok: true });
    const listed = await listProposals(source._id, owner);
    expect(listed.ok && listed.value).toEqual([]);
  });

  it("deletes a template's proposals with it", async () => {
    const { source, owner, fork } = await forkWithChange();
    await propose(fork.id);
    await deleteTemplate(source._id, owner);
    const left = await (await templateProposalsCollection()).countDocuments({
      templateId: source._id,
    });
    expect(left).toBe(0);
  });

  it("deletes a proposer's proposals with their bb data", async () => {
    const { source, fork } = await forkWithChange();
    await propose(fork.id);
    await deleteTemplatesOf(forker.osuId);
    const left = await (await templateProposalsCollection()).countDocuments({
      templateId: source._id,
    });
    expect(left).toBe(0);
  });
});
