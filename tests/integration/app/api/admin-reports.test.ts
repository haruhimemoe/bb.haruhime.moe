/**
 * @file tests/integration/app/api/admin-reports.test.ts
 * @desc DELETE /api/admin/templates/<id>/reports: 404 to everyone but an admin; an admin's
 *       clear resets the counter and shows a hidden template again, keeping the report rows.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { DELETE } from "@/app/api/admin/templates/[id]/reports/route";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import { listReportedTemplates } from "@/services/template-reports";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const ID = "t-hidden01";

const clear = (cookie: string | null, id = ID, headers = {}) =>
  DELETE(apiRequest("DELETE", `/api/admin/templates/${id}/reports`, cookie, undefined, headers), {
    ...params({ id }),
  });

describe("DELETE /api/admin/templates/<id>/reports", () => {
  it("lists hidden templates first for admins, then clears one", async () => {
    const { admin } = await createCast();
    await insertTemplate({ _id: "t-report01", reports: 1 });
    await insertTemplate({ _id: ID, reports: 3, hidden: true });
    await (await templateReportsCollection()).insertOne({
      templateId: ID,
      reporterOsuId: 40,
      reason: "spam",
      at: new Date(),
    });
    const listed = await listReportedTemplates();
    expect(listed.map((row) => row.template.id)).toEqual([ID, "t-report01"]);
    expect(listed[0]?.reasons).toEqual(["spam"]);
    const response = await clear(admin.cookie);
    expect(response.status).toBe(200);
    expect(await (await templatesCollection()).findOne({ _id: ID })).toMatchObject({
      reports: 0,
      hidden: false,
    });
    expect(await (await templateReportsCollection()).countDocuments({ templateId: ID })).toBe(1);
  });

  it("is 404 to visitors and non-admins, and refuses another site", async () => {
    const { admin, owner } = await createCast();
    await insertTemplate({ _id: ID, reports: 3, hidden: true });
    expect((await clear(null)).status).toBe(404);
    expect((await clear(owner.cookie)).status).toBe(404);
    expect((await clear(admin.cookie, ID, CROSS_SITE)).status).toBe(403);
    expect((await (await templatesCollection()).findOne({ _id: ID }))?.hidden).toBe(true);
  });

  it("is 404 for a private, built-in or missing template", async () => {
    const { admin } = await createCast();
    await insertTemplate({ _id: "t-private1", visibility: "private", reports: 1 });
    for (const id of ["t-private1", "bb-userpage-simple", "t-missing1"]) {
      expect((await clear(admin.cookie, id)).status).toBe(404);
    }
  });
});
