/**
 * @file tests/unit/schemas/template.test.ts
 * @desc The template schemas: content limits, one-line and multi-line text rules, the content
 *       filter's code, field declarations, the create default, the PATCH body, and reads by
 *       shape only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { BODY_MAX, MAX_FIELDS } from "@/constants/templates";
import {
  createBodySchema,
  patchBodySchema,
  templateContentSchema,
  templateReadSchema,
} from "@/schemas/template";
import { templateFieldSchema } from "@/schemas/template-field";
import { accountDeleteBodySchema, reportBodySchema } from "@/schemas/template-view";
import { multiLineText, oneLineText, passesFilter, showable, wellFormed } from "@/schemas/text";
import { makeTemplate, validBody } from "../../helpers/templates";

const issueOf = (result: { error?: { issues: { message: string; params?: unknown }[] } }) =>
  result.error?.issues[0];

describe("templateContentSchema", () => {
  it("takes a valid template, trimming the name and description", () => {
    const parsed = templateContentSchema.parse(validBody({ name: "  Mine  ", description: " d " }));
    expect(parsed).toMatchObject({ name: "Mine", description: "d" });
  });

  it("limits the name, description and body", () => {
    expect(templateContentSchema.safeParse(validBody({ name: "ab" })).success).toBe(false);
    expect(templateContentSchema.safeParse(validBody({ name: "a".repeat(81) })).success).toBe(
      false,
    );
    expect(templateContentSchema.safeParse(validBody({ name: "two\nlines" })).success).toBe(false);
    expect(
      templateContentSchema.safeParse(validBody({ description: "d".repeat(281) })).success,
    ).toBe(false);
    expect(templateContentSchema.safeParse(validBody({ body: "x".repeat(BODY_MAX) })).success).toBe(
      true,
    );
    expect(
      templateContentSchema.safeParse(validBody({ body: "x".repeat(BODY_MAX + 1) })).success,
    ).toBe(false);
    expect(templateContentSchema.safeParse(validBody({ body: "a\u0000b" })).success).toBe(false);
    expect(templateContentSchema.safeParse(validBody({ body: "a\tb\r\nc" })).success).toBe(true);
    expect(templateContentSchema.safeParse(validBody({ body: "a\uD800" })).success).toBe(false);
  });

  it("marks the content filter's refusal with its code", () => {
    expect(
      issueOf(templateContentSchema.safeParse(validBody({ body: "sieg heil" }))),
    ).toMatchObject({
      message: "That fails the content filter.",
      params: { code: "content_filter" },
    });
  });

  it("checks fields: keys, kinds, labels, count and duplicates", () => {
    const field = { key: "name", label: "Name", kind: "user", required: true, default: "" };
    expect(templateFieldSchema.safeParse(field).success).toBe(true);
    expect(templateFieldSchema.safeParse({ ...field, key: "1st" }).success).toBe(false);
    expect(templateFieldSchema.safeParse({ ...field, kind: "song" }).success).toBe(false);
    expect(templateFieldSchema.safeParse({ ...field, label: "" }).success).toBe(false);
    expect(templateFieldSchema.safeParse({ ...field, label: "sieg heil" }).success).toBe(false);
    const many = Array.from({ length: MAX_FIELDS + 1 }, (_, i) => ({ ...field, key: `k${i}` }));
    expect(templateContentSchema.safeParse(validBody({ fields: many })).success).toBe(false);
  });
});

describe("the request bodies", () => {
  it("makes a new template private unless told otherwise", () => {
    expect(createBodySchema.parse(validBody()).visibility).toBe("private");
    expect(createBodySchema.safeParse(validBody({ visibility: "secret" })).success).toBe(false);
  });

  it("takes a PATCH with a version and at least one change", () => {
    expect(patchBodySchema.safeParse({ baseVersion: 1, visibility: "public" }).success).toBe(true);
    expect(patchBodySchema.safeParse({ baseVersion: 1 }).success).toBe(false);
    expect(patchBodySchema.safeParse({ name: "Only name" }).success).toBe(false);
    expect(patchBodySchema.safeParse({ baseVersion: 0, name: "Name" }).success).toBe(false);
  });

  it("takes a one-line report reason without the filter, and a username", () => {
    expect(reportBodySchema.safeParse({ reason: "  sieg heil in the body " }).success).toBe(true);
    expect(reportBodySchema.safeParse({ reason: "no" }).success).toBe(false);
    expect(reportBodySchema.safeParse({ reason: "two\nlines" }).success).toBe(false);
    expect(reportBodySchema.safeParse({ reason: "bad \uD800 one" }).success).toBe(false);
    expect(accountDeleteBodySchema.parse({ username: " me " })).toEqual({ username: "me" });
  });
});

describe("reads", () => {
  it("read a stored row by shape, whatever the filter says today", () => {
    expect(templateReadSchema.safeParse(makeTemplate({ body: "sieg heil" })).success).toBe(true);
    expect(templateReadSchema.safeParse({ _id: "t-1" }).success).toBe(false);
  });

  it("reads all three forkOf shapes: null, a bare id, and a ref", () => {
    expect(templateReadSchema.safeParse(makeTemplate({ forkOf: null })).success).toBe(true);
    expect(templateReadSchema.safeParse(makeTemplate({ forkOf: "t-abc" })).success).toBe(true);
    expect(
      templateReadSchema.safeParse(makeTemplate({ forkOf: { docId: "t-abc", rev: "r1" } })).success,
    ).toBe(true);
  });

  it("reads head and historyPublic as optional", () => {
    expect(templateReadSchema.safeParse(makeTemplate()).success).toBe(true);
    expect(
      templateReadSchema.safeParse(
        makeTemplate({ head: { id: "r1", seq: 0 }, historyPublic: true }),
      ).success,
    ).toBe(true);
  });
});

describe("text helpers", () => {
  it("check characters", () => {
    expect(wellFormed("ok \u{1F600}")).toBe(true);
    expect(showable("a\u0007")).toBe(false);
    expect(passesFilter("hello")).toBe(true);
    expect(oneLineText("thing", 1, 5).safeParse("").error?.issues[0]?.message).toBe(
      "Give it a thing.",
    );
    expect(multiLineText("thing", 3).safeParse("abcd").error?.issues[0]?.message).toMatch(
      /3 characters/,
    );
  });
});
