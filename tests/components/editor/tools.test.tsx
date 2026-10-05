/**
 * @file tests/components/editor/tools.test.tsx
 * @desc The toolbar's tools: the color tool checks what's typed, warns under 3:1 contrast on the
 *       preview's background and wraps in [color]; the gradient tool takes 2 to 4 stops, skips
 *       spaces or not, and shows its cost; the flag picker searches by name or code and inserts
 *       the legacy (default) or modern flag.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { gradient } from "@haruhimemoe/bbcode/helpers";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorTool } from "@/components/editor/ColorTool";
import { FlagPicker } from "@/components/editor/FlagPicker";
import { GradientTool } from "@/components/editor/GradientTool";
import { insert, wrap } from "@/utils/text-edit";

describe("ColorTool", () => {
  it("renders its panel as a surface", () => {
    render(<ColorTool onEdit={vi.fn()} />);
    const panel = screen.getByRole("region", { name: "Color" });
    expect(panel).toHaveClass("rounded-[10px]", "bg-b4", "p-3");
    expect(panel).not.toHaveClass("rounded-md");
  });

  it("wraps the selection in the typed color, normalized", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ColorTool onEdit={onEdit} />);
    const field = screen.getByLabelText("Hex code or color name");
    await user.clear(field);
    await user.type(field, "#ABC");
    await user.click(screen.getByRole("button", { name: "Color the selection" }));
    expect(onEdit).toHaveBeenCalledWith(wrap("[color=#aabbcc]", "[/color]", "text"));
  });

  it("warns when the color is hard to read on the dark background", async () => {
    const user = userEvent.setup();
    render(<ColorTool onEdit={vi.fn()} />);
    expect(screen.getByText(/^Contrast .*:1 on osu!'s dark background/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "black" }));
    expect(screen.getByText(/Hard to read on osu!'s dark background/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "black" })).toHaveAttribute("aria-pressed", "true");
  });

  it("refuses what osu! wouldn't read, and says when it can't check a name", async () => {
    const user = userEvent.setup();
    render(<ColorTool onEdit={vi.fn()} />);
    const field = screen.getByLabelText("Hex code or color name");
    await user.clear(field);
    await user.type(field, "#12");
    expect(screen.getByText(/Use #rrggbb, #rgb or a color name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Color the selection" })).toBeDisabled();
    await user.clear(field);
    await user.type(field, "tomato");
    expect(screen.getByText(/can't check this name's contrast/)).toBeInTheDocument();
  });
});

describe("GradientTool", () => {
  it("renders its panel as a surface", () => {
    render(<GradientTool initialText="" onEdit={vi.fn()} />);
    const panel = screen.getByRole("region", { name: "Gradient" });
    expect(panel).toHaveClass("rounded-[10px]", "bg-b4", "p-3");
    expect(panel).not.toHaveClass("rounded-md");
  });

  it("starts from the selection and inserts the gradient with its cost shown", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<GradientTool initialText="Hi there" onEdit={onEdit} />);
    const expected = gradient("Hi there", ["#ff66aa", "#66ccff"]);
    expect(screen.getByText(`The colors add ${expected.cost} characters.`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Insert gradient" }));
    expect(onEdit).toHaveBeenCalledWith(insert(expected.bbcode));
  });

  it("takes two to four colors and can color spaces too", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<GradientTool initialText="a b" onEdit={onEdit} />);
    const add = screen.getByRole("button", { name: "Add color" });
    const remove = screen.getByRole("button", { name: "Remove last" });
    expect(remove).toBeDisabled();
    await user.click(add);
    await user.click(add);
    expect(screen.getAllByLabelText(/^Color \d$/)).toHaveLength(4);
    expect(add).toBeDisabled();
    await user.click(remove);
    await user.click(remove);
    await user.click(screen.getByLabelText(/Skip spaces/));
    await user.click(screen.getByRole("button", { name: "Insert gradient" }));
    const { bbcode } = gradient("a b", ["#ff66aa", "#66ccff"], { skipSpaces: false });
    expect(onEdit).toHaveBeenCalledWith(insert(bbcode));
  });
});

describe("FlagPicker", () => {
  it("renders its panel as a surface", () => {
    render(<FlagPicker onEdit={vi.fn()} />);
    const panel = screen.getByRole("region", { name: "Flag" });
    expect(panel).toHaveClass("rounded-[10px]", "bg-b4", "p-3");
    expect(panel).not.toHaveClass("rounded-md");
  });

  it("finds countries by name or code and inserts the small PNG flag by default", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<FlagPicker onEdit={onEdit} />);
    expect(screen.queryByText(/fill the width/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Country"), "jp");
    await user.click(screen.getByRole("button", { name: /Japan/ }));
    expect(onEdit).toHaveBeenCalledWith(
      insert("[img]https://assets.ppy.sh/old-flags/JP.png[/img]"),
    );
  });

  it("inserts the SVG flag when asked, says it fills the width, and says when nothing matches", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<FlagPicker onEdit={onEdit} />);
    await user.click(screen.getByRole("radio", { name: "Current (SVG)" }));
    expect(screen.getByText(/fill the width/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Country"), "Japan");
    await user.click(screen.getByRole("button", { name: /Japan/ }));
    expect(onEdit).toHaveBeenCalledWith(
      insert("[img]https://osu.ppy.sh/assets/images/flags/1f1ef-1f1f5.svg[/img]"),
    );
    await user.clear(screen.getByLabelText("Country"));
    await user.type(screen.getByLabelText("Country"), "Atlantis");
    expect(screen.getByText('No country matches "Atlantis".')).toBeInTheDocument();
  });
});
