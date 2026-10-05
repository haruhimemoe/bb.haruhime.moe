/**
 * @file tests/components/me/UpstreamNotice.test.tsx
 * @desc UpstreamNotice: nothing for a template that isn't a fork or is current, a plain message
 *       when the upstream is gone, and a working "Pull changes" button when it's behind.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamNotice } from "@/components/me/UpstreamNotice";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("UpstreamNotice", () => {
  it("renders nothing for none and current", () => {
    const { container: a } = render(
      <UpstreamNotice templateId="t-1" state={{ state: "none" }} onPulled={() => {}} />,
    );
    expect(a).toBeEmptyDOMElement();
    const { container: b } = render(
      <UpstreamNotice
        templateId="t-1"
        state={{ state: "current", upstream: { id: "t-2", name: "Source" } }}
        onPulled={() => {}}
      />,
    );
    expect(b).toBeEmptyDOMElement();
  });

  it("says the upstream is gone", () => {
    render(<UpstreamNotice templateId="t-1" state={{ state: "gone" }} onPulled={() => {}} />);
    expect(screen.getByText(/isn't available any more/)).toBeInTheDocument();
  });

  it("offers to pull changes and calls onPulled with the result", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ template: { id: "t-1", body: "new" } }, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onPulled = vi.fn();
    const user = userEvent.setup();
    render(
      <UpstreamNotice
        templateId="t-1"
        state={{ state: "behind", upstream: { id: "t-2", name: "Source" }, rev: "r2", changes: 3 }}
        onPulled={onPulled}
      />,
    );
    expect(
      screen.getByText(/Source changed since you copied it \(3 changes\)/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pull changes" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/templates/t-1/pull",
      expect.objectContaining({ method: "POST" }),
    );
    expect(onPulled).toHaveBeenCalledWith({ ok: true, template: { id: "t-1", body: "new" } });
  });
});
