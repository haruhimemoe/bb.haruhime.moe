/**
 * @file tests/integration/app/api/account.test.ts
 * @desc DELETE /api/account: signed in, same site, the username typed exactly, 3 an hour per
 *       osu! account; removes the templates, their reports, the reports the account filed, its
 *       sessions and its user.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { DELETE } from "@/app/api/account/route";
import { RATE_LIMITS } from "@/constants/api";
import { getDb } from "@/lib/db";
import { limiter } from "@/lib/rate-limit";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const remove = (cookie: string | null, username: unknown, headers = {}) =>
  DELETE(apiRequest("DELETE", "/api/account", cookie, { username }, headers));

describe("DELETE /api/account", () => {
  it("deletes the account, its templates and reports, and clears the marker", async () => {
    const { owner, other } = await createCast();
    await insertTemplate({ _id: "t-owned001", ownerOsuId: owner.osuId });
    await insertTemplate({ _id: "t-others01", ownerOsuId: other.osuId });
    const reports = await templateReportsCollection();
    await reports.insertMany([
      { templateId: "t-owned001", reporterOsuId: other.osuId, reason: "x", at: new Date() },
      { templateId: "t-others01", reporterOsuId: owner.osuId, reason: "y", at: new Date() },
    ]);
    const response = await remove(owner.cookie, owner.username);
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("bb-signed-in=;");
    const templates = await templatesCollection();
    expect(await templates.countDocuments({ ownerOsuId: owner.osuId })).toBe(0);
    expect(await templates.countDocuments({ ownerOsuId: other.osuId })).toBe(1);
    expect(await reports.countDocuments()).toBe(0);
    expect(await getDb().collection("user").countDocuments({ osuId: owner.osuId })).toBe(0);
    expect(await getDb().collection("session").countDocuments()).toBe(2);
    expect((await remove(owner.cookie, owner.username)).status).toBe(401);
  });

  it("takes back the reports it made, so deleting and signing in again can't pile them up", async () => {
    const { owner, other, admin } = await createCast();
    await insertTemplate({ _id: "t-hidden01", ownerOsuId: 99, reports: 3, hidden: true });
    await insertTemplate({ _id: "t-shown001", ownerOsuId: 99, reports: 4, hidden: true });
    const reports = await templateReportsCollection();
    const at = new Date();
    await reports.insertMany([
      { templateId: "t-hidden01", reporterOsuId: owner.osuId, reason: "x", at },
      { templateId: "t-hidden01", reporterOsuId: other.osuId, reason: "x", at },
      { templateId: "t-hidden01", reporterOsuId: admin.osuId, reason: "x", at },
      { templateId: "t-shown001", reporterOsuId: owner.osuId, reason: "x", at },
    ]);
    expect((await remove(owner.cookie, owner.username)).status).toBe(204);
    const templates = await templatesCollection();
    expect(await templates.findOne({ _id: "t-hidden01" })).toMatchObject({
      reports: 2,
      hidden: false,
    });
    expect(await templates.findOne({ _id: "t-shown001" })).toMatchObject({
      reports: 3,
      hidden: true,
    });
  });

  it("refuses a visitor, another site and a name that doesn't match", async () => {
    const { owner } = await createCast();
    expect((await remove(null, owner.username)).status).toBe(401);
    expect((await remove(owner.cookie, owner.username, CROSS_SITE)).status).toBe(403);
    const mismatch = await remove(owner.cookie, "Owner");
    expect(mismatch.status).toBe(400);
    expect(await mismatch.json()).toMatchObject({ error: { code: "confirm_mismatch" } });
    expect(await getDb().collection("user").countDocuments({ osuId: owner.osuId })).toBe(1);
  });

  it("allows 3 deletions an hour per osu! account, counting only confirmed ones", async () => {
    const { owner } = await createCast();
    for (let i = 0; i < 4; i++) expect((await remove(owner.cookie, "wrong")).status).toBe(400);
    // Three deletions this hour already (an account deleted and signed in again keeps its id).
    for (let i = 0; i < 3; i++) await limiter.hit(RATE_LIMITS.accountDelete, `osu:${owner.osuId}`);
    expect((await remove(owner.cookie, owner.username)).status).toBe(429);
  });
});
