/**
 * @file tests/components/templates/GalleryFilters.test.tsx
 * @desc The gallery's filters: they show the URL's search, kind and sort; a search goes on
 *       submit, a kind or sort at once, each back to page 1 with the other filters kept.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GalleryFilters } from "@/components/templates/GalleryFilters";
import { DEFAULT_GALLERY } from "@/utils/gallery-params";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("GalleryFilters", () => {
  it("shows the current filters", () => {
    render(<GalleryFilters params={{ q: "cup", kind: "tournament", sort: "used", page: 3 }} />);
    expect(screen.getByRole("searchbox", { name: "Search templates" })).toHaveValue("cup");
    expect(screen.getByRole("combobox", { name: "Kind" })).toHaveValue("tournament");
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("used");
  });

  it("searches on submit, back to page 1", async () => {
    const user = userEvent.setup();
    render(<GalleryFilters params={{ ...DEFAULT_GALLERY, kind: "forum", page: 4 }} />);
    await user.type(
      screen.getByRole("searchbox", { name: "Search templates" }),
      " staff list {Enter}",
    );
    expect(push).toHaveBeenCalledWith("/templates?q=staff+list&kind=forum");
  });

  it("changes kind and sort at once, keeping the rest", async () => {
    const user = userEvent.setup();
    render(<GalleryFilters params={{ ...DEFAULT_GALLERY, q: "cup", page: 2 }} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Kind" }), "userpage");
    expect(push).toHaveBeenLastCalledWith("/templates?q=cup&kind=userpage");
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "used");
    expect(push).toHaveBeenLastCalledWith("/templates?q=cup&sort=used");
    await user.selectOptions(screen.getByRole("combobox", { name: "Kind" }), "");
    expect(push).toHaveBeenLastCalledWith("/templates?q=cup");
  });
});
