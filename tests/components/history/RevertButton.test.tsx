/**
 * @file tests/components/history/RevertButton.test.tsx
 * @desc RevertButton: confirms, POSTs the revert route and navigates to the editor on success;
 *       shows the server's message on a refusal.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevertButton } from "@/components/history/RevertButton";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("RevertButton", () => {
  it("confirms, posts the revert route and navigates to the editor", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RevertButton templateId="t-abcd1234" revisionId="r1" />);
    await user.click(screen.getByRole("button", { name: "Restore this version" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/templates/t-abcd1234/history/r1/revert",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith("/me/t-abcd1234/edit");
  });

  it("shows the server's message on a refusal and doesn't navigate", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "That fails the content filter." } }), {
          status: 400,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RevertButton templateId="t-abcd1234" revisionId="r1" />);
    await user.click(screen.getByRole("button", { name: "Restore this version" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("That fails the content filter.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
