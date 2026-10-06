/**
 * @file tests/components/layout/AppPalette.test.tsx
 * @desc AppPalette mounts and opens on Ctrl K; siteCommands' "Go to <page>" rows are there for
 *       the header nav, and bb's own extras (guides, the API doc, and the signed-in-only "New
 *       template" / "My templates" shortcuts) show or hide with the account store's status.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppPalette } from "@/components/layout/AppPalette";

const { push, navigation } = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    navigation: () => ({ useRouter: () => ({ push }), usePathname: () => "/" }),
  };
});
vi.mock("next/navigation", navigation);
// ui's CommandPalette imports the ".js" specifier.
vi.mock("next/navigation.js", navigation);

const account = vi.hoisted(() => ({ status: "signed-out" as "signed-out" | "signed-in" }));
vi.mock("@/lib/account", () => ({
  useAccount: () => (account.status === "signed-in" ? { status: "signed-in" } : account),
}));

beforeEach(() => {
  push.mockClear();
  account.status = "signed-out";
  localStorage.clear();
});

describe("AppPalette", () => {
  it("opens on Ctrl K with bb's nav and a guide/doc command", async () => {
    const user = userEvent.setup();
    render(<AppPalette />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("{Control>}k{/Control}");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(screen.getByRole("option", { name: /Go to Editor/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Go to Getting started/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Go to API/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sign in" })).toBeInTheDocument();
  });

  it("hides the signed-in-only shortcuts while signed out", async () => {
    const user = userEvent.setup();
    render(<AppPalette />);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("option", { name: "New template" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "My templates" })).not.toBeInTheDocument();
  });

  it("shows the signed-in-only shortcuts and no Sign in row once signed in", async () => {
    account.status = "signed-in";
    const user = userEvent.setup();
    render(<AppPalette />);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("option", { name: "New template" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "My templates" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Sign in" })).not.toBeInTheDocument();
  });
});
