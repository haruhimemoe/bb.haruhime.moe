/**
 * @file tests/unit/utils/account-copy.test.ts
 * @desc The delete-my-bb-data warning for no templates, one, and many (with a thousands separator).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import { describe, expect, it } from "vitest";
import { deletesSentence } from "@/utils/account-copy";

describe("deletesSentence", () => {
  it("names the templates that go, and that the haruhime account stays", () => {
    expect(deletesSentence(0)).toBe(
      "This deletes your API key from bb. Drafts saved in your browser stay there, and so does your haruhime account. It can't be undone.",
    );
    expect(deletesSentence(1)).toContain("deletes your template and your API key from bb");
    expect(deletesSentence(1234)).toContain("all 1,234 of your templates and your API key");
  });
});
