/**
 * @file tests/components/editor/PostStatus.test.tsx
 * @desc The counter under the editor: code points against the chosen target's limit, the target
 *       picker, Copy, and the warning once the text is over.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PostStatus } from "@/components/editor/PostStatus";

describe("PostStatus", () => {
  it("counts code points against the target's limit", () => {
    render(<PostStatus text="[b]🎵[/b]" target="userpage" onTarget={vi.fn()} />);
    expect(screen.getByText("8 / 60,000 characters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy BBCode" })).toBeEnabled();
    expect(screen.queryByText(/over the/)).not.toBeInTheDocument();
  });

  it("offers the three targets", async () => {
    const user = userEvent.setup();
    const onTarget = vi.fn();
    render(<PostStatus text="" target="userpage" onTarget={onTarget} />);
    expect(screen.getByRole("button", { name: "Copy BBCode" })).toBeDisabled();
    const picker = screen.getByLabelText("For");
    expect([...picker.querySelectorAll("option")].map((o) => o.textContent)).toEqual([
      "Userpage (me!)",
      "Forum post",
      "Beatmap description",
    ]);
    await user.selectOptions(picker, "Beatmap description");
    expect(onTarget).toHaveBeenCalledWith("beatmap");
  });

  it("warns once the text is over the limit", () => {
    render(<PostStatus text={"x".repeat(60_005)} target="forum" onTarget={vi.fn()} />);
    expect(screen.getByText("60,005 / 60,000 characters: 5 over the limit")).toBeInTheDocument();
    expect(
      screen.getByText(/This is 5 characters over the 60,000 a forum post holds\./),
    ).toHaveAttribute("role", "status");
  });
});
