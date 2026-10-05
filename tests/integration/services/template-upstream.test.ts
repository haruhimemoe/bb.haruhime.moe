/**
 * @file tests/integration/services/template-upstream.test.ts
 * @desc upstreamStateOf and pullUpstream: a legacy fork (a bare forkOf string) gets a starting
 *       revision the first time it's read; a fork with no upstream changes reads current; one
 *       behind counts the upstream's changes; an unreachable upstream reads gone; a clean pull
 *       lands both sides and moves the fork's base; an overlapping pull conflicts and writes
 *       nothing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { templateRevisions } from "@/lib/template-revisions";
import { templatesCollection } from "@/models/Template";
import { pullUpstream, upstreamStateOf } from "@/services/template-upstream";
import { forkTemplate } from "@/services/templates-create";
import { findStoredTemplate } from "@/services/templates-read";
import { updateTemplate } from "@/services/templates-update";
import { setupTestDb } from "../../helpers/db";
import { insertTemplate } from "../../helpers/templates";

setupTestDb();

const maker = { osuId: 40, username: "forker", isAdmin: false };

describe("upstreamStateOf", () => {
  it("reads none for a template that isn't a fork", async () => {
    const stored = await insertTemplate();
    expect(await upstreamStateOf(stored, { osuId: stored.ownerOsuId, isAdmin: false })).toEqual({
      state: "none",
    });
  });

  it("reads current right after a fork, and behind once the upstream saves", async () => {
    const source = await insertTemplate({ name: "Source", body: "v1" });
    const answer = await forkTemplate(source._id, maker);
    if (!answer.ok) throw new Error("fork failed");
    const forkRow = await findStoredTemplate(answer.value.id);
    if (!forkRow) throw new Error("fork not found");
    expect(await upstreamStateOf(forkRow, { osuId: maker.osuId, isAdmin: false })).toMatchObject({
      state: "current",
    });
    // The source owner saves a change.
    const sourceOwner = { osuId: source.ownerOsuId, username: source.ownerName, isAdmin: false };
    await updateTemplate(source._id, sourceOwner, { baseVersion: source.version, body: "v2" });
    const behind = await upstreamStateOf(forkRow, { osuId: maker.osuId, isAdmin: false });
    expect(behind).toMatchObject({ state: "behind", changes: expect.any(Number) });
  });

  it("gives a legacy fork (a bare id) a starting revision on first read", async () => {
    const source = await insertTemplate({ name: "Source" });
    const fork = await insertTemplate({ ownerOsuId: maker.osuId, forkOf: source._id });
    const state = await upstreamStateOf(fork, { osuId: maker.osuId, isAdmin: false });
    expect(state).toMatchObject({ state: "current" });
    const row = await (await templatesCollection()).findOne({ _id: fork._id });
    expect(row?.forkOf).toMatchObject({ docId: source._id, rev: expect.any(String) });
  });

  it("reads gone when the upstream is deleted or made private", async () => {
    const source = await insertTemplate({ visibility: "private" });
    const fork = await insertTemplate({
      ownerOsuId: maker.osuId,
      forkOf: { docId: source._id, rev: "whatever" },
    });
    expect(await upstreamStateOf(fork, { osuId: maker.osuId, isAdmin: false })).toEqual({
      state: "gone",
    });
  });
});

describe("pullUpstream", () => {
  it("merges a clean pull and moves the fork's base forward", async () => {
    const source = await insertTemplate({ name: "Source", body: "line one\nline two" });
    const answer = await forkTemplate(source._id, maker);
    if (!answer.ok) throw new Error("fork failed");
    const fork = answer.value;
    const sourceOwner = { osuId: source.ownerOsuId, username: source.ownerName, isAdmin: false };
    await updateTemplate(source._id, sourceOwner, {
      baseVersion: source.version,
      body: "line one\nline two UPSTREAM",
    });
    const pulled = await pullUpstream(fork.id, maker);
    expect(pulled.ok).toBe(true);
    if (!pulled.ok) throw new Error("expected ok");
    expect(pulled.value.body).toBe("line one\nline two UPSTREAM");
    expect(pulled.value.forkOf).toBe(source._id);
    const row = await (await templatesCollection()).findOne({ _id: fork.id });
    const upstreamHead = await templateRevisions.head(source._id);
    expect(row?.forkOf).toEqual({ docId: source._id, rev: upstreamHead?.id });
  });

  it("conflicts with 409 pull_conflict when both sides edit the same line", async () => {
    const source = await insertTemplate({ name: "Source", body: "line one" });
    const answer = await forkTemplate(source._id, maker);
    if (!answer.ok) throw new Error("fork failed");
    const fork = answer.value;
    await updateTemplate(fork.id, maker, { baseVersion: fork.version, body: "line one OURS" });
    const sourceOwner = { osuId: source.ownerOsuId, username: source.ownerName, isAdmin: false };
    await updateTemplate(source._id, sourceOwner, {
      baseVersion: source.version,
      body: "line one THEIRS",
    });
    const pulled = await pullUpstream(fork.id, maker);
    expect(pulled.ok).toBe(false);
    if (pulled.ok) throw new Error("expected a refusal");
    expect(pulled.status).toBe(409);
    expect(pulled.code).toBe("pull_conflict");
    expect(pulled.details?.draft).toMatchObject({ body: expect.stringContaining("OURS") });
  });

  it("is 404 upstream_unavailable when the source was made private", async () => {
    const source = await insertTemplate({ name: "Source" });
    const answer = await forkTemplate(source._id, maker);
    if (!answer.ok) throw new Error("fork failed");
    await (await templatesCollection()).updateOne(
      { _id: source._id },
      { $set: { visibility: "private" } },
    );
    const pulled = await pullUpstream(answer.value.id, maker);
    expect(pulled.ok).toBe(false);
    if (pulled.ok) throw new Error("expected a refusal");
    expect(pulled.status).toBe(404);
    expect(pulled.code).toBe("upstream_unavailable");
  });
});
