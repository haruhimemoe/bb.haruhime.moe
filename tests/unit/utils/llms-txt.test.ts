/**
 * @file tests/unit/utils/llms-txt.test.ts
 * @desc The site's llms.txt: notes, sections of links, templates described by their own text,
 *       names on one line with brackets escaped, empty sections dropped, the API section.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { describe, expect, it } from "vitest";
import { buildLlmsTxt, llmsSections } from "@/utils/llms-txt";

describe("llms.txt", () => {
  const text = buildLlmsTxt(
    llmsSections({
      builtIns: [
        {
          id: "bb-userpage-simple",
          name: "Userpage (simple)",
          kind: "userpage",
          description: "A short me! page.",
        },
      ],
      templates: [
        { id: "t-abcd1234", name: "My [cup]\npost", kind: "tournament", description: "" },
      ],
    }),
  );

  it("starts with the title, summary and notes", () => {
    expect(text).toMatch(/^# bb\.haruhime\.moe\n\n> Write osu! BBCode/);
    expect(text).toContain("60,000 characters");
    expect(text).toContain("https://bb.haruhime.moe/docs/tags/imagemap.md");
  });

  it("lists templates with their kind and description", () => {
    expect(text).toContain(
      "- [Userpage (simple)](https://bb.haruhime.moe/t/bb-userpage-simple): Userpage. A short me! page.",
    );
    expect(text).toContain(
      "- [My \\[cup\\] post](https://bb.haruhime.moe/t/t-abcd1234): Tournament",
    );
  });

  it("lists the guides, tags, legal pages and elsewhere", () => {
    expect(text).toContain("## Guides");
    expect(text).toContain(
      "- [Getting started](https://bb.haruhime.moe/docs/guides/getting-started): ",
    );
    expect(text).toContain("- [\\[b\\] Bold](https://bb.haruhime.moe/docs/tags/b): Bold text.");
    expect(text).toContain("(https://bb.haruhime.moe/docs/tags/list-item)");
    expect(text).toContain("- [Privacy](https://bb.haruhime.moe/legal/privacy): What bb");
    expect(text).toContain("## Elsewhere");
    expect(text).toContain("(https://bb.haruhime.moe/llms-full.txt)");
    expect(text).toContain("(https://github.com/haruhimemoe/bb.haruhime.moe)");
  });

  it("lists the API docs and OpenAPI document next to the docs sections", () => {
    expect(text).toContain("## API");
    expect(text).toContain("- [API docs](https://bb.haruhime.moe/docs/api): ");
    expect(text).toContain("- [OpenAPI](https://bb.haruhime.moe/api/v1/openapi.json): ");
  });

  it("leaves out Public templates when there are none", () => {
    const empty = buildLlmsTxt(llmsSections({ builtIns: [], templates: [] }));
    expect(empty).not.toContain("## Public templates");
    expect(empty).not.toContain("## Built-in templates");
    expect(empty).toContain("## Pages");
  });
});
