/**
 * @file tests/unit/utils/template-access.test.ts
 * @desc Who sees and reports a template, and when reports hide it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { canReport, canView, isOwner, shouldHide } from "@/utils/template-access";

const owner = { osuId: 1, isAdmin: false };
const admin = { osuId: 2, isAdmin: true };
const other = { osuId: 3, isAdmin: false };
const t = (visibility: "private" | "unlisted" | "public", hidden = false) => ({
  ownerOsuId: 1,
  visibility,
  hidden,
});

describe("template access", () => {
  it("shows a private template to its owner only", () => {
    expect(canView(t("private"), owner)).toBe(true);
    expect(canView(t("private"), admin)).toBe(false);
    expect(canView(t("private"), other)).toBe(false);
    expect(canView(t("private"), null)).toBe(false);
  });

  it("shows unlisted and public templates to anyone, hidden ones to the owner and admins", () => {
    expect(canView(t("unlisted"), null)).toBe(true);
    expect(canView(t("public"), other)).toBe(true);
    expect(canView(t("public", true), null)).toBe(false);
    expect(canView(t("public", true), other)).toBe(false);
    expect(canView(t("public", true), admin)).toBe(true);
    expect(canView(t("public", true), owner)).toBe(true);
  });

  it("lets signed-in people who can see it and don't own it report it", () => {
    expect(canReport(t("public"), other)).toBe(true);
    expect(canReport(t("public"), owner)).toBe(false);
    expect(canReport(t("public"), null)).toBe(false);
    expect(canReport(t("private"), other)).toBe(false);
    expect(isOwner(t("public"), null)).toBe(false);
  });

  it("hides a public template at the threshold", () => {
    expect(shouldHide("public", 3, 3)).toBe(true);
    expect(shouldHide("public", 2, 3)).toBe(false);
    expect(shouldHide("unlisted", 9, 3)).toBe(false);
  });
});
