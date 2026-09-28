/**
 * @file tests/components/account/DeleteAccountForm.test.tsx
 * @desc "Delete my account" asks for the osu! username typed in the page (no confirm() dialog):
 *       the button stays off until it matches, then one DELETE goes out with it; on success the
 *       header shows signed out, the page says so (no form to press again) and goes home; a
 *       refusal or no answer is said out loud and nothing changes.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";

const { push, markSignedOut } = vi.hoisted(() => ({ push: vi.fn(), markSignedOut: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/account", () => ({ markSignedOut }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const setup = (templateCount = 3) => {
  const user = userEvent.setup();
  render(<DeleteAccountForm username="peppy" templateCount={templateCount} />);
  const field = screen.getByLabelText("Type peppy to confirm");
  const button = screen.getByRole("button", { name: "Delete my account" });
  return { user, field, button };
};

describe("DeleteAccountForm", () => {
  it("says what goes", () => {
    setup(3);
    expect(screen.getByText(/all 3 of your templates/)).toBeInTheDocument();
  });

  it("stays off until the username is typed exactly, then deletes and goes home", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { user, field, button } = setup();
    expect(button).toBeDisabled();
    await user.type(field, "Peppy");
    expect(button).toBeDisabled();
    await user.clear(field);
    await user.type(field, "peppy");
    expect(button).toBeEnabled();
    await user.click(button);
    const [url, init] = (fetchMock.mock.calls as unknown as [string, RequestInit][])[0] ?? [];
    expect(url).toBe("/api/account");
    expect(init?.method).toBe("DELETE");
    expect(JSON.parse(String(init?.body))).toEqual({ username: "peppy" });
    expect(markSignedOut).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/");
    expect(await screen.findByRole("status")).toHaveTextContent("Your account is deleted.");
    expect(screen.queryByRole("button", { name: "Delete my account" })).not.toBeInTheDocument();
  });

  it("says a refusal and keeps the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: { message: "Too many requests." } }, { status: 429 }),
      ),
    );
    const { user, field, button } = setup(1);
    await user.type(field, "peppy");
    await user.click(button);
    expect(await screen.findByText("Too many requests.")).toBeInTheDocument();
    expect(markSignedOut).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete my account" })).toBeInTheDocument();
  });

  it("says when bb can't be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    const { user, field, button } = setup(0);
    await user.type(field, "peppy");
    await user.click(button);
    expect(
      await screen.findByText("Couldn't reach bb. Your account is still there."),
    ).toBeVisible();
  });
});
