/**
 * @file tests/integration/lib/db-indexes.test.ts
 * @desc Connecting builds every index: better-auth's, the rate-limit TTL, template_reports' unique
 *       reporter index, and the templates' owner, listing, text and hidden indexes.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { TEMPLATE_INDEXES, TEMPLATE_REPORT_INDEXES } from "@/constants/db";
import { getDb } from "@/lib/db";
import { templatesCollection } from "@/models/Template";
import { setupTestDb } from "../../helpers/db";

setupTestDb();

const names = async (collection: string) =>
  (await getDb().collection(collection).indexes()).map((index) => index.name);

describe("indexes", () => {
  it("builds the templates' indexes", async () => {
    await templatesCollection();
    expect(await names("templates")).toEqual(
      expect.arrayContaining(Object.values(TEMPLATE_INDEXES)),
    );
  });

  it("builds template_reports' and the counters' indexes", async () => {
    expect(await names("template_reports")).toEqual(
      expect.arrayContaining(Object.values(TEMPLATE_REPORT_INDEXES)),
    );
    const unique = (await getDb().collection("template_reports").indexes()).find(
      (index) => index.name === TEMPLATE_REPORT_INDEXES.unique,
    );
    expect(unique?.unique).toBe(true);
    expect(await names("rate_limits")).toContain("expiresAt_1");
  });
});
