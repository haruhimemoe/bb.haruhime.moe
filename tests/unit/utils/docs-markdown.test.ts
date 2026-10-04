/**
 * @file tests/unit/utils/docs-markdown.test.ts
 * @desc The docs as Markdown: live examples become bbcode fences, site links become absolute,
 *       and every tag gets a reference page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { readFileSync } from "node:fs";
import { TAGS } from "@haruhimemoe/bbcode";
import { mdxToMarkdown } from "@haruhimemoe/next-kit/docs";
import { describe, expect, it } from "vitest";
import { CONTENT } from "@/constants/content";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { tagBySlug } from "@/utils/docs";
import {
  exampleFences,
  faqMarkdown,
  MARKDOWN_OPTIONS,
  tagMarkdown,
  tagMarkdownTitle,
  tagPart,
} from "@/utils/docs-markdown";

describe("docs markdown", () => {
  it("fences examples, and next-kit makes links absolute with it as a transform", () => {
    const source =
      'See [flags](/guides/flags).\n\n<Example source={"[b]hi[/b]\\n[i]\\"x\\"[/i]"} />';
    expect(exampleFences(source)).toBe(
      'See [flags](/guides/flags).\n\n```bbcode\n[b]hi[/b]\n[i]"x"[/i]\n```',
    );
    expect(mdxToMarkdown(source, { title: "Flags", ...MARKDOWN_OPTIONS })).toBe(
      '# Flags\n\nSee [flags](https://bb.haruhime.moe/guides/flags).\n\n```bbcode\n[b]hi[/b]\n[i]"x"[/i]\n```\n',
    );
  });

  it.each(CONTENT.entries.guides.map((e) => e.slug))("leaves no JSX in the %s guide", (slug) => {
    const text = mdxToMarkdown(readFileSync(`content/guides/${slug}.mdx`, "utf8"), {
      title: slug,
      ...MARKDOWN_OPTIONS,
    });
    expect(text).not.toMatch(/<[A-Z]/);
  });

  it("gives each tag a part at its page URL", () => {
    const tag = tagBySlug("b");
    if (!tag) throw new Error("no [b] tag");
    expect(tagPart(tag)).toMatchObject({ url: "https://bb.haruhime.moe/docs/tags/b" });
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
