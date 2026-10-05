/**
 * @file tests/integration/app/api/template-history.test.ts
 * @desc PUT /api/templates/<id>/history (toggle) and POST .../history/<rev>/revert: owner only.
 *       Signed out 401, cross-site 403, a non-owner 403, a template they can't see 404. A revert
 *       restores the revision's content; one today's filter refuses is a 400.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { POST as REVERT } from "@/app/api/templates/[id]/history/[rev]/revert/route";
import { PUT } from "@/app/api/templates/[id]/history/route";
import { connectedDb } from "@/lib/db";
import { templatesCollection } from "@/models/Template";
import { ensureHistory } from "@/services/template-history";
import { updateTemplate } from "@/services/templates-update";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const ID = "t-abcd1234";

const toggle = (cookie: string | null, body: unknown, headers = {}) =>
  PUT(apiRequest("PUT", `/api/templates/${ID}/history`, cookie, body, headers), params({ id: ID }));

const revert = (cookie: string | null, rev: string, headers = {}) =>
  REVERT(
    apiRequest("POST", `/api/templates/${ID}/history/${rev}/revert`, cookie, undefined, headers),
    params({ id: ID, rev }),
  );

describe("PUT /api/templates/<id>/history", () => {
  it("lets the owner turn history on and off", async () => {
    await insertTemplate({ _id: ID });
    const { owner } = await createCast();
    const response = await toggle(owner.cookie, { historyPublic: true });
    expect(response.status).toBe(200);
    const row = await (await templatesCollection()).findOne({ _id: ID });
    expect(row?.historyPublic).toBe(true);
  });

  it("refuses a visitor, another site, and a non-owner", async () => {
    await insertTemplate({ _id: ID });
    const { owner, other } = await createCast();
    expect((await toggle(null, { historyPublic: true })).status).toBe(401);
    expect((await toggle(owner.cookie, { historyPublic: true }, CROSS_SITE)).status).toBe(403);
    expect((await toggle(other.cookie, { historyPublic: true })).status).toBe(403);
  });
});

describe("POST /api/templates/<id>/history/<rev>/revert", () => {
  it("restores the template to an earlier revision", async () => {
    const stored = await insertTemplate({ _id: ID, name: "First", body: "[b]first[/b]" });
    const root = await ensureHistory(stored);
    const { owner } = await createCast();
    const owned = { osuId: owner.osuId, username: owner.username, isAdmin: false };
    await updateTemplate(ID, owned, {
      baseVersion: stored.version,
      base: root,
      name: "Second",
      body: "[b]second[/b]",
    });
    const response = await revert(owner.cookie, root.id);
    expect(response.status).toBe(200);
    const { template } = (await response.json()) as { template: { name: string; body: string } };
    expect(template).toMatchObject({ name: "First", body: "[b]first[/b]" });
  });

  it("is 400 when the target revision fails today's content rules", async () => {
    const stored = await insertTemplate({ _id: ID });
    const root = await ensureHistory(stored);
    const badId = crypto.randomUUID();
    const db = await connectedDb();
    await db.collection<{ _id: string } & Record<string, unknown>>("template_revisions").insertOne({
      _id: badId,
      docId: ID,
      seq: root.seq + 1,
      kind: "save",
      valueHash: "bad-hash",
      authorId: String(stored.ownerOsuId),
      authorName: stored.ownerName,
      message: null,
      createdAt: new Date(),
      value: { name: "Bad", description: "", kind: "userpage", body: "sieg heil", fields: [] },
    });
    const { owner } = await createCast();
    const response = await revert(owner.cookie, badId);
    expect(response.status).toBe(400);
  });

  it("refuses a visitor, another site, a non-owner, and an unknown revision", async () => {
    const stored = await insertTemplate({ _id: ID });
    const root = await ensureHistory(stored);
    const { owner, other } = await createCast();
    expect((await revert(null, root.id)).status).toBe(401);
    expect((await revert(owner.cookie, root.id, CROSS_SITE)).status).toBe(403);
    expect((await revert(other.cookie, root.id)).status).toBe(403);
    expect((await revert(owner.cookie, "nope")).status).toBe(404);
  });
});
