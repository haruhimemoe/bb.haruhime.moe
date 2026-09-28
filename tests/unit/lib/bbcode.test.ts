/**
 * @file tests/unit/lib/bbcode.test.ts
 * @desc The render seam: osu! BBCode becomes the package's HTML, nothing a post holds becomes
 *       live markup, and the count is in code points.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { countBbcode, renderBbcode } from "@/lib/bbcode";

describe("the render seam", () => {
  it("renders osu! BBCode", () => {
    expect(renderBbcode("[b]hi[/b]")).toBe('<div class="bb"><strong>hi</strong></div>');
    expect(renderBbcode("[center]x[/center]")).toContain("[center]x[/center]");
  });

  it("never lets markup or scripts through", () => {
    const html = renderBbcode(
      '<script>alert("x")</script> [url=javascript:alert(1)]x[/url] [img]"><img onerror=a>[/img]',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain('href="javascript');
    expect(html).not.toMatch(/<img[^>]*onerror/);
  });

  it("shows text too deeply nested to render as escaped text instead of throwing", () => {
    const deep = `${"[quote]".repeat(4000)}<b>x${"[/quote]".repeat(4000)}`;
    const html = renderBbcode(deep);
    expect(html.startsWith('<div class="bb">[quote][quote]')).toBe(true);
    expect(html).toContain("&lt;b&gt;x");
    expect(html).not.toContain("<b>");
  });

  it("counts code points", () => {
    expect(countBbcode("abc")).toBe(3);
    expect(countBbcode("🎵")).toBe(1);
  });
});
