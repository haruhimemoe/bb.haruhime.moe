/**
 * @file tests/unit/utils/account-copy.test.ts
 * @desc The delete-account warning for no templates, one, and many (with a thousands separator).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { deletesSentence } from "@/utils/account-copy";

describe("deletesSentence", () => {
  it("names the templates that go with the account", () => {
    expect(deletesSentence(0)).toBe(
      "This deletes your account and signs you out everywhere. Drafts saved in your browser stay there. It can't be undone.",
    );
    expect(deletesSentence(1)).toContain("account and your template, and signs you out");
    expect(deletesSentence(1234)).toContain("all 1,234 of your templates, and signs you out");
  });
});
