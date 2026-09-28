/**
 * @file tests/components/editor/BbPreview.test.tsx
 * @desc BbPreview: the full preview renders everything; a compact card preview renders only the
 *       start it can show, so a long template costs a gallery page little.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BbPreview } from "@/components/editor/BbPreview";
import { COMPACT_PREVIEW_CHARS } from "@/constants/editor";

const LONG = `[b]start[/b]${"y".repeat(COMPACT_PREVIEW_CHARS)}[i]end[/i]`;

describe("BbPreview", () => {
  it("renders the whole text", () => {
    const { container } = render(<BbPreview source={LONG} />);
    expect(container.querySelector("em")?.textContent).toBe("end");
  });

  it("renders only the start in a compact card", () => {
    const { container } = render(<BbPreview source={LONG} compact />);
    expect(container.querySelector("strong")?.textContent).toBe("start");
    expect(container.querySelector("em")).toBeNull();
    expect(container.textContent?.length).toBeLessThanOrEqual(COMPACT_PREVIEW_CHARS);
  });
});
