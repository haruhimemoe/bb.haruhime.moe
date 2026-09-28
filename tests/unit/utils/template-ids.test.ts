/**
 * @file tests/unit/utils/template-ids.test.ts
 * @desc Template ids: t- and 8 base36 characters for people's, bb-<slug> for built-in ones.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { builtinId, isBuiltinId, isTemplateId, newTemplateId } from "@/utils/template-ids";

describe("template ids", () => {
  it("draws t- and 8 base36 characters", () => {
    expect(newTemplateId()).toMatch(/^t-[a-z0-9]{8}$/);
    expect(newTemplateId((bytes) => bytes.fill(37))).toBe("t-bbbbbbbb");
    expect(newTemplateId()).not.toBe(newTemplateId());
  });

  it("tells the two kinds apart", () => {
    expect(isTemplateId("t-abcd1234")).toBe(true);
    expect(isTemplateId("t-ABCD1234")).toBe(false);
    expect(isTemplateId("bb-userpage")).toBe(false);
    expect(isBuiltinId(builtinId("userpage-simple"))).toBe(true);
    expect(isBuiltinId("bb-../etc")).toBe(false);
  });
});
