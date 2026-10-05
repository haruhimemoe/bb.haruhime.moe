/**
 * @file tests/integration/app/api/templates-change.test.ts
 * @desc PATCH and DELETE /api/templates/<id>: owner only (a template the caller can't see is
 *       404, one they see but don't own 403, admins included; built-in ones 403), versioned
 *       changes with a 409 carrying the current template, content changes that merge or
 *       conflict on their base revision, hidden kept once reports set it, and a delete that
 *       takes the template's reports and history with it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { DELETE, PATCH } from "@/app/api/templates/[id]/route";
import { templateRevisions } from "@/lib/template-revisions";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import { ensureHistory } from "@/services/template-history";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const ID = "t-abcd1234";

const patch = (cookie: string | null, body: unknown, id = ID, headers = {}) =>
  PATCH(apiRequest("PATCH", `/api/templates/${id}`, cookie, body, headers), params({ id }));

const remove = (cookie: string | null, id = ID, headers = {}) =>
  DELETE(apiRequest("DELETE", `/api/templates/${id}`, cookie, undefined, headers), params({ id }));

type Answer = { template: Record<string, unknown>; error?: { code: string; message: string } };

describe("PATCH /api/templates/<id>", () => {
  it("lets the owner change content and visibility, bumping the version", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID, visibility: "private" });
    const response = await patch(owner.cookie, {
      baseVersion: 1,
      name: "New name",
      visibility: "unlisted",
    });
    expect(response.status).toBe(200);
    const { template } = (await response.json()) as Answer;
    expect(template).toMatchObject({ name: "New name", visibility: "unlisted", version: 2 });
    const stored = await (await templatesCollection()).findOne({ _id: ID });
    expect(stored).toMatchObject({ name: "New name", body: "[b]hello[/b]", version: 2 });
  });

  it("answers a stale version with 409 and the template as it is now", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID, version: 3, name: "Current" });
    const response = await patch(owner.cookie, { baseVersion: 2, name: "Mine" });
    expect(response.status).toBe(409);
    const body = (await response.json()) as Answer;
    expect(body.error?.code).toBe("conflict");
    expect(body.template).toMatchObject({ name: "Current", version: 3 });
    expect((await (await templatesCollection()).findOne({ _id: ID }))?.name).toBe("Current");
  });

  it("refuses a visitor, another site, and an empty change", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID });
    expect((await patch(null, { baseVersion: 1, name: "x y z" })).status).toBe(401);
    expect(
      (await patch(owner.cookie, { baseVersion: 1, name: "x y z" }, ID, CROSS_SITE)).status,
    ).toBe(403);
    expect((await patch(owner.cookie, { baseVersion: 1 })).status).toBe(400);
  });

  it("is 404 for someone who can't see it and 403 for someone who can", async () => {
    const { other, admin } = await createCast();
    await insertTemplate({ _id: ID, visibility: "private" });
    expect((await patch(other.cookie, { baseVersion: 1, name: "Taken" })).status).toBe(404);
    expect((await patch(admin.cookie, { baseVersion: 1, name: "Taken" })).status).toBe(404);
    await insertTemplate({ _id: "t-public01" });
    expect(
      (await patch(other.cookie, { baseVersion: 1, name: "Taken" }, "t-public01")).status,
    ).toBe(403);
    expect(
      (await patch(admin.cookie, { baseVersion: 1, name: "Taken" }, "t-public01")).status,
    ).toBe(403);
    expect((await patch(other.cookie, { baseVersion: 1, name: "Taken" }, "nope")).status).toBe(404);
  });

  it("refuses built-in templates", async () => {
    const { owner } = await createCast();
    const response = await patch(
      owner.cookie,
      { baseVersion: 1, name: "Mine" },
      "bb-userpage-simple",
    );
    expect(response.status).toBe(403);
    expect(((await response.json()) as Answer).error?.code).toBe("built_in");
  });

  it("keeps a hidden template hidden, and hides one made public with 3 reports", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID, hidden: true, reports: 3 });
    await patch(owner.cookie, { baseVersion: 1, visibility: "unlisted" });
    expect((await (await templatesCollection()).findOne({ _id: ID }))?.hidden).toBe(true);
    await insertTemplate({ _id: "t-unlist01", visibility: "unlisted", reports: 3 });
    await patch(owner.cookie, { baseVersion: 1, visibility: "public" }, "t-unlist01");
    expect((await (await templatesCollection()).findOne({ _id: "t-unlist01" }))?.hidden).toBe(true);
  });

  it("runs changed text through the content filter", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID });
    const response = await patch(owner.cookie, { baseVersion: 1, body: "sieg heil" });
    expect(((await response.json()) as Answer).error?.code).toBe("content_filter");
  });

  it("merges two tabs editing different body lines from the same base", async () => {
    const { owner } = await createCast();
    const stored = await insertTemplate({ _id: ID, body: "line one\nline two\nline three" });
    const base = await ensureHistory(stored);
    const first = await patch(owner.cookie, {
      baseVersion: 1,
      base,
      body: "line one EDITED\nline two\nline three",
    });
    expect(first.status).toBe(200);
    const second = await patch(owner.cookie, {
      baseVersion: 1,
      base,
      body: "line one\nline two\nline three EDITED",
    });
    expect(second.status).toBe(200);
    const { template } = (await second.json()) as Answer;
    expect(template.body).toBe("line one EDITED\nline two\nline three EDITED");
  });

  it("conflicts with 409 merge_conflict when both tabs edit the same line", async () => {
    const { owner } = await createCast();
    const stored = await insertTemplate({ _id: ID, body: "line one\nline two" });
    const base = await ensureHistory(stored);
    const first = await patch(owner.cookie, { baseVersion: 1, base, body: "line one OURS" });
    expect(first.status).toBe(200);
    const second = await patch(owner.cookie, { baseVersion: 1, base, body: "line one THEIRS" });
    expect(second.status).toBe(409);
    const body = (await second.json()) as Answer & {
      error?: { conflicts?: { kind: string }[]; draft?: { body: string } };
    };
    expect(body.error?.code).toBe("merge_conflict");
    expect(body.error?.conflicts?.[0]?.kind).toBe("text");
    expect(body.error?.draft?.body).toContain("THEIRS");
  });

  it("writes no revision for a visibility-only PATCH without a base", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID, visibility: "private" });
    const response = await patch(owner.cookie, { baseVersion: 1, visibility: "unlisted" });
    expect(response.status).toBe(200);
    const list = await templateRevisions.list(ID);
    // The lazy root from ensureHistory, and nothing else: no content change was committed.
    expect(list).toHaveLength(1);
  });
});

describe("DELETE /api/templates/<id>", () => {
  it("lets the owner delete it with its reports", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: ID });
    const reports = await templateReportsCollection();
    await reports.insertOne({ templateId: ID, reporterOsuId: 40, reason: "spam", at: new Date() });
    expect((await remove(owner.cookie)).status).toBe(204);
    expect(await (await templatesCollection()).countDocuments({ _id: ID })).toBe(0);
    expect(await reports.countDocuments({ templateId: ID })).toBe(0);
    expect((await remove(owner.cookie)).status).toBe(404);
  });

  it("refuses everyone else", async () => {
    const { owner, other, admin } = await createCast();
    await insertTemplate({ _id: ID });
    expect((await remove(null)).status).toBe(401);
    expect((await remove(owner.cookie, ID, CROSS_SITE)).status).toBe(403);
    expect((await remove(other.cookie)).status).toBe(403);
    expect((await remove(admin.cookie)).status).toBe(403);
    expect((await remove(owner.cookie, "bb-userpage-simple")).status).toBe(403);
    expect(await (await templatesCollection()).countDocuments({ _id: ID })).toBe(1);
  });
});
