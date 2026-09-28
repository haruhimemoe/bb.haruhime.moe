/**
 * @file tests/unit/utils/template-view.test.ts
 * @desc A stored template as the browser sees it, and a fork's name within the name limit.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { NAME_MAX } from "@/constants/templates";
import { forkName, toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

describe("toTemplateView", () => {
  it("sends plain JSON without the report count", () => {
    const view = toTemplateView(makeTemplate({ _id: "t-abcd1234", reports: 2 }));
    expect(view).toMatchObject({
      id: "t-abcd1234",
      builtIn: false,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    expect(view).not.toHaveProperty("reports");
  });
});

describe("forkName", () => {
  it("adds (copy)", () => {
    expect(forkName("Cup post")).toBe("Cup post (copy)");
  });

  it("cuts a long name so the whole fits, never splitting a character", () => {
    expect(forkName("a".repeat(80))).toHaveLength(NAME_MAX);
    const emoji = forkName("\u{1F600}".repeat(40));
    expect(emoji.length).toBeLessThanOrEqual(NAME_MAX);
    expect(emoji).not.toMatch(/\p{Cs}/u);
  });
});
