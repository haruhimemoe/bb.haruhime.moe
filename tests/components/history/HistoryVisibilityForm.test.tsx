/**
 * @file tests/components/history/HistoryVisibilityForm.test.tsx
 * @desc HistoryVisibilityForm: PUTs the chosen value and rolls the control back on a refusal.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoryVisibilityForm } from "@/components/history/HistoryVisibilityForm";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("HistoryVisibilityForm", () => {
  it("PUTs the new value and says it saved", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<HistoryVisibilityForm templateId="t-abcd1234" historyPublic={false} />);
    await user.click(screen.getByRole("radio", { name: "Anyone who can see the template" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/templates/t-abcd1234/history",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ historyPublic: true }) }),
    );
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("rolls back and shows the error on a 403", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "Only the owner can do that." } }), {
          status: 403,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<HistoryVisibilityForm templateId="t-abcd1234" historyPublic={false} />);
    await user.click(screen.getByRole("radio", { name: "Anyone who can see the template" }));
    expect(await screen.findByText("Only the owner can do that.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Only me" })).toBeChecked();
  });
});
