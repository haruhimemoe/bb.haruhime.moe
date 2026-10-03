/**
 * @file tests/components/layout/Footer.test.tsx
 * @desc The footer: bb's own columns with ui's "haruhime tools" column second, linking packs,
 *       pools and all tools but not bb itself.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/layout/Footer";
import { FOOTER_COLUMNS } from "@/constants/site";

describe("Footer", () => {
  it("puts haruhime tools after the bb column and leaves bb out of it", () => {
    render(<Footer />);
    // One Footer nav; each column is a region named by its heading.
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    const nav = screen.getByRole("navigation", { name: "Footer" });
    const names = within(nav)
      .getAllByRole("region")
      .map((column) => document.getElementById(column.getAttribute("aria-labelledby") ?? ""))
      .map((heading) => heading?.textContent);
    const own = FOOTER_COLUMNS.map((column) => column.title);
    expect(names).toEqual([own[0], "haruhime tools", ...own.slice(1)]);
    const tools = screen.getByRole("region", { name: "haruhime tools" });
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
