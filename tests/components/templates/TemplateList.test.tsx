/**
 * @file tests/components/templates/TemplateList.test.tsx
 * @desc TemplateList's heading, grid and cards on ui 0.13.0's SectionHeading, CardGrid and
 *       Surface: a three-column grid of `<li>`s, each card a rounded surface, the heading with
 *       room under a sticky header.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TemplateList } from "@/components/templates/TemplateList";
import { toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

const TEMPLATES = [
  toTemplateView(makeTemplate({ _id: "t-list0001", name: "One" })),
  toTemplateView(makeTemplate({ _id: "t-list0002", name: "Two" })),
  toTemplateView(makeTemplate({ _id: "t-list0003", name: "Three" })),
];

describe("TemplateList", () => {
  it("renders a three-column grid of surface cards under a section heading", () => {
    render(<TemplateList heading="Built in" templates={TEMPLATES} empty="None yet." />);
    const heading = screen.getByRole("heading", { name: "Built in" });
    expect(heading).toHaveClass("scroll-mt-20");
    const list = screen.getByRole("list");
    expect(list).toHaveClass("lg:grid-cols-3");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const item of items) expect(item).toHaveClass("flex");
    const item = screen.getByRole("heading", { name: "One" }).closest("li");
    expect(item?.firstElementChild).toHaveClass("rounded-[10px]", "bg-b4", "p-4");
  });

  it("says so when there are none", () => {
    render(<TemplateList heading="Yours" templates={[]} empty="No templates yet." />);
    expect(screen.getByText("No templates yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
