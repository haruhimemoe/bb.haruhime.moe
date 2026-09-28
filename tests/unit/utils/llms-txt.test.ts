/**
 * @file tests/unit/utils/llms-txt.test.ts
 * @desc The site's llms.txt: sections of links, names on one line with brackets escaped.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { buildLlmsTxt, llmsSections, llmsText } from "@/utils/llms-txt";

describe("llms.txt", () => {
  it("lists the pages, built-in and public templates, and legal pages", () => {
    const text = buildLlmsTxt(
      llmsSections({
        builtIns: [{ id: "bb-userpage-simple", name: "Userpage (simple)", kind: "userpage" }],
        templates: [{ id: "t-abcd1234", name: "My [cup]\npost", kind: "tournament" }],
      }),
    );
    expect(text).toMatch(/^# bb\.haruhime\.moe\n\n> /);
    expect(text).toContain(
      "- [Userpage (simple)](https://bb.haruhime.moe/t/bb-userpage-simple): Userpage",
    );
    expect(text).toContain(
      "- [My \\[cup\\] post](https://bb.haruhime.moe/t/t-abcd1234): Tournament",
    );
    expect(text).toContain("## Legal");
    expect(text).toContain("(https://bb.haruhime.moe/legal/privacy)");
  });

  it("leaves out Public templates when there are none", () => {
    const text = buildLlmsTxt(llmsSections({ builtIns: [], templates: [] }));
    expect(text).not.toContain("## Public templates");
    expect(text).toContain("## Pages");
  });

  it("puts typed text on one line", () => {
    expect(llmsText("  a\n\tb ]")).toBe("a b \\]");
  });
});
