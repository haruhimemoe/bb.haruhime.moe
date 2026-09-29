/**
 * @file tests/unit/utils/docs-markdown.test.ts
 * @desc The docs as Markdown: live examples become bbcode fences, site links become absolute,
 *       and every tag gets a reference page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { readFileSync } from "node:fs";
import { TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { GUIDE_SLUGS } from "@/constants/guides";
import { tagBySlug } from "@/utils/docs";
import { faqMarkdown, mdxToMarkdown, tagMarkdown, tagMarkdownTitle } from "@/utils/docs-markdown";

describe("docs markdown", () => {
  it("fences examples and makes links absolute", () => {
    const text = mdxToMarkdown(
      'See [flags](/docs/guides/flags).\n\n<Example source={"[b]hi[/b]\\n[i]\\"x\\"[/i]"} />',
    );
    expect(text).toBe(
      'See [flags](https://bb.haruhime.moe/docs/guides/flags).\n\n```bbcode\n[b]hi[/b]\n[i]"x"[/i]\n```',
    );
  });

  it.each(GUIDE_SLUGS)("leaves no JSX in the %s guide", (slug) => {
    const text = mdxToMarkdown(readFileSync(`content/guides/${slug}.mdx`, "utf8"));
    expect(text).not.toMatch(/<[A-Z]/);
  });

  it("writes a tag's reference", () => {
    const tag = tagBySlug("s");
    if (!tag) throw new Error("no [s] tag");
    const text = tagMarkdown(tag);
    expect(tagMarkdownTitle(tag)).toBe("The osu! BBCode [s] tag (Strikethrough)");
    expect(text).toContain("also written [strike]");
    expect(text).toContain("## Syntax\n\n```bbcode\n[s]text[/s]\n```\n\n```bbcode\n[strike]");
    expect(text).toContain("```bbcode\n");
    expect(text).toContain("## Good to know");
    for (const each of TAGS) expect(tagMarkdown(each)).toContain("## Example");
  });

  it("writes the questions as headings", () => {
    expect(faqMarkdown(DOCS_FAQ)).toContain("### How long can an osu! userpage be?\n\n60,000");
  });
});
