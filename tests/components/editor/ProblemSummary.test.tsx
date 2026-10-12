/**
 * @file tests/components/editor/ProblemSummary.test.tsx
 * @desc The problem summary under the editor: no problems, counts of errors and warnings, Show
 *       opens the list, and Fix all appears only with fixes and reports what it fixed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProblemSummary } from "@/components/editor/ProblemSummary";

const setup = (text: string, fixed = 0) => {
  const user = userEvent.setup();
  const onShow = vi.fn();
  const onFixAll = vi.fn(() => fixed);
  render(<ProblemSummary text={text} onShow={onShow} onFixAll={onFixAll} />);
  return { user, onShow, onFixAll };
};

describe("ProblemSummary", () => {
  it("says when there are no problems", () => {
    setup("[b]fine[/b]");
    expect(screen.getByText("No problems")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Fix all/ })).not.toBeInTheDocument();
  });

  it("counts errors and warnings and opens the list", async () => {
    const { user, onShow } = setup("[b]x [center]y[/center]");
    expect(screen.getByText("1 error, 2 warnings")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show problems" }));
    expect(onShow).toHaveBeenCalledOnce();
  });

  it("fixes everything it can and says how many", async () => {
    const { user, onFixAll } = setup("[b]x [center]y[/center]", 3);
    await user.click(screen.getByRole("button", { name: "Fix all (3)" }));
    expect(onFixAll).toHaveBeenCalledOnce();
    expect(await screen.findByText("Fixed 3 problems.")).toBeInTheDocument();
  });
});
