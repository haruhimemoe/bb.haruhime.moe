/**
 * @file tests/integration/app/api/template-report.test.ts
 * @desc POST /api/templates/<id>/report: once per signed-in user per template, never your own
 *       or a built-in one; a public template is hidden from everyone but its owner and admins at
 *       3 reports.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/[id]/report/route";
import { templatesCollection } from "@/models/Template";
import { getTemplateFor } from "@/services/templates-read";
import { createTestUser } from "../../../helpers/auth";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const ID = "t-report01";

const report = (cookie: string | null, id = ID, reason: unknown = "spam links", headers = {}) =>
  POST(
    apiRequest("POST", `/api/templates/${id}/report`, cookie, { reason }, headers),
    params({ id }),
  );

describe("POST /api/templates/<id>/report", () => {
  it("hides a public template at its third report", async () => {
    const { owner, admin } = await createCast();
    await insertTemplate({ _id: ID });
    const reporters = [
      await createTestUser(101, "r1"),
      await createTestUser(102, "r2"),
      await createTestUser(103, "r3"),
    ];
    const answers = [];
    for (const reporter of reporters) answers.push(await (await report(reporter.cookie)).json());
    expect(answers).toEqual([{ hidden: false }, { hidden: false }, { hidden: true }]);
    expect(await (await templatesCollection()).findOne({ _id: ID })).toMatchObject({
      reports: 3,
      hidden: true,
    });
    expect(await getTemplateFor(ID, null)).toBeNull();
    expect(await getTemplateFor(ID, { osuId: 101, isAdmin: false })).toBeNull();
    expect(await getTemplateFor(ID, { osuId: owner.osuId, isAdmin: false })).not.toBeNull();
    expect(await getTemplateFor(ID, { osuId: admin.osuId, isAdmin: true })).not.toBeNull();
  });

  it("counts but doesn't hide an unlisted template", async () => {
    await createCast();
    await insertTemplate({ _id: ID, visibility: "unlisted", reports: 2 });
    const reporter = await createTestUser(101, "r1");
    expect(await (await report(reporter.cookie)).json()).toEqual({ hidden: false });
  });

  it("takes one report per user per template", async () => {
    const { other } = await createCast();
    await insertTemplate({ _id: ID });
    expect((await report(other.cookie)).status).toBe(200);
    const again = await report(other.cookie);
    expect(again.status).toBe(409);
    expect((await (await templatesCollection()).findOne({ _id: ID }))?.reports).toBe(1);
  });

  it("refuses the owner, built-in templates, unseen templates and bad requests", async () => {
    const { owner, other } = await createCast();
    await insertTemplate({ _id: ID });
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    expect((await report(owner.cookie)).status).toBe(403);
    expect((await report(other.cookie, "bb-userpage-simple")).status).toBe(403);
    expect((await report(other.cookie, "t-private1")).status).toBe(404);
    expect((await report(null)).status).toBe(401);
    expect((await report(other.cookie, ID, "x")).status).toBe(400);
    expect((await report(other.cookie, ID, "spam", CROSS_SITE)).status).toBe(403);
  });

  it("allows 10 reports an hour per user", async () => {
    const { other } = await createCast();
    for (let i = 0; i < 10; i++) {
      await insertTemplate({ _id: `t-many${String(i).padStart(4, "0")}` });
      expect((await report(other.cookie, `t-many${String(i).padStart(4, "0")}`)).status).toBe(200);
    }
    await insertTemplate({ _id: ID });
    expect((await report(other.cookie)).status).toBe(429);
  });
});
