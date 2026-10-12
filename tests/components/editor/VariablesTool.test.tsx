/**
 * @file tests/components/editor/VariablesTool.test.tsx
 * @desc The Variables tool: a field per key in the draft, values reported as they're typed, Fill
 *       in writes the values into the text, and a draft with no keys says how to start.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VariablesTool } from "@/components/editor/VariablesTool";
import { replaceAll } from "@/utils/text-edit";

describe("VariablesTool", () => {
  it("has a field per key and reports values", async () => {
    const user = userEvent.setup();
    const onVars = vi.fn();
    render(
      <VariablesTool
        keys={["name", "link"]}
        vars={{ name: "pep" }}
        onVars={onVars}
        onEdit={vi.fn()}
        document={() => "hi {{name}}"}
      />,
    );
    expect(screen.getByLabelText("name")).toHaveValue("pep");
    await user.type(screen.getByLabelText("link"), "x");
    expect(onVars).toHaveBeenLastCalledWith({ name: "pep", link: "x" });
  });

  it("fills the values into the text", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <VariablesTool
        keys={["name"]}
        vars={{ name: "peppy" }}
        onVars={vi.fn()}
        onEdit={onEdit}
        document={() => "hi {{name}} {{other}}"}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Fill in" }));
    expect(onEdit).toHaveBeenCalledWith(replaceAll("hi peppy {{other}}"));
  });

  it("says how to start when the draft has no keys", () => {
    render(
      <VariablesTool keys={[]} vars={{}} onVars={vi.fn()} onEdit={vi.fn()} document={() => ""} />,
    );
    expect(screen.getByText(/No variables in this draft yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fill in" })).not.toBeInTheDocument();
  });
});
