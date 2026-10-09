/**
 * @file tests/components/account/ApiKeySection.test.tsx
 * @desc /account's API key card: creating shows the key once on a CopyField that copies it,
 *       "I've saved it" moves to the summary, and Regenerate and Revoke ask first.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { ApiKeyInfo } from "@haruhimemoe/next-kit/api-keys";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeySection } from "@/components/account/ApiKeySection";

let original: PropertyDescriptor | undefined;

beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
});

afterEach(() => {
  if (original) Object.defineProperty(navigator, "clipboard", original);
  else Reflect.deleteProperty(navigator, "clipboard");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const clipboard = () => {
  const writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  return writeText;
};

const EXISTING: ApiKeyInfo = {
  prefix: "hbb_abcd",
  createdAt: "2026-09-01T00:00:00Z",
  lastUsedAt: null,
  scopes: ["*"],
};

describe("ApiKeySection", () => {
  it("creates a key, shows it once on a copyable field, then saves it away", async () => {
    const user = userEvent.setup();
    const writeText = clipboard();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ apiKey: EXISTING, key: "hbb_abcdefghijklmnop" })),
    );
    render(<ApiKeySection initial={null} />);
    await user.click(screen.getByRole("button", { name: "Create API key" }));
    const field = await screen.findByRole("textbox", { name: "Your new API key" });
    expect(field).toHaveValue("hbb_abcdefghijklmnop");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("hbb_abcdefghijklmnop");
    expect(screen.getByText("Key copied.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "I've saved it" }));
    expect(screen.queryByRole("textbox", { name: "Your new API key" })).not.toBeInTheDocument();
    expect(screen.getByText(/hbb_abcd/)).toBeInTheDocument();
  });

  it("asks before regenerating or revoking an existing key", async () => {
    const user = userEvent.setup();
    render(<ApiKeySection initial={EXISTING} />);
    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(
      screen.getByText("Revoke this key? Anything using it stops working right away."),
    ).toBeInTheDocument();
  });
});
