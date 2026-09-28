/**
 * @file tests/unit/lib/bbcode.test.ts
 * @desc The render seam's placeholder: the source escaped into a <pre>, so nothing in it becomes
 *       markup, and the count.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { countBbcode, escapeHtml, renderBbcode } from "@/lib/bbcode";

describe("the render seam", () => {
  it("escapes the source into a pre", () => {
    expect(renderBbcode("[b]hi[/b]")).toBe('<pre class="bb-source">[b]hi[/b]</pre>');
    expect(renderBbcode("<script>alert(\"x\")</script> & 'q'")).toBe(
      '<pre class="bb-source">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;</pre>',
    );
    expect(escapeHtml('"><img src=x onerror=alert(1)>')).not.toMatch(/[<>"]/);
  });

  it("counts characters", () => {
    expect(countBbcode("abc")).toBe(3);
  });
});
