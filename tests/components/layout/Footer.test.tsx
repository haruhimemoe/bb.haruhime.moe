/**
 * @file tests/components/layout/Footer.test.tsx
 * @desc The footer: bb's own columns with ui's "haruhime tools" column second, linking packs,
 *       pools and all tools but not bb itself.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/layout/Footer";
import { FOOTER_COLUMNS } from "@/constants/site";

describe("Footer", () => {
  it("puts haruhime tools after the bb column and leaves bb out of it", () => {
    render(<Footer />);
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    const own = FOOTER_COLUMNS.map((column) => column.title);
    expect(names).toEqual([own[0], "haruhime tools", ...own.slice(1)]);
    const tools = screen.getByRole("navigation", { name: "haruhime tools" });
    expect(
      within(tools)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "https://packs.haruhime.moe",
      "https://pools.haruhime.moe",
      "https://www.haruhime.moe",
    ]);
  });
});
