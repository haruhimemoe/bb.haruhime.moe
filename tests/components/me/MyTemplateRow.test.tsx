/**
 * @file tests/components/me/MyTemplateRow.test.tsx
 * @desc One of your templates on /me: changing who sees it sends the version it started from and
 *       takes the answer (a 409's template too, with a note), and Delete asks in the page first,
 *       then says it's gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyTemplateRow } from "@/components/me/MyTemplateRow";
import { toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

const TEMPLATE = toTemplateView(
  makeTemplate({ _id: "t-mine0001", name: "Mine", visibility: "private", version: 2 }),
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MyTemplateRow", () => {
  it("renders the row as a rounded surface", () => {
    render(<MyTemplateRow template={TEMPLATE} />);
    const row = screen.getByRole("combobox", { name: "Who sees it" }).closest("li");
    expect(row).toHaveClass("rounded-[10px]", "bg-b4", "p-4");
  });

  it("changes who sees it with the version it started from", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ template: { ...TEMPLATE, visibility: "public", version: 3 } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<MyTemplateRow template={TEMPLATE} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Who sees it" }), "public");
    const [url, init] = (fetchMock.mock.calls as unknown as [string, RequestInit][])[0] ?? [];
    expect(url).toBe("/api/templates/t-mine0001");
    expect(JSON.parse(String(init?.body))).toEqual({ baseVersion: 2, visibility: "public" });
    expect(screen.getByRole("combobox", { name: "Who sees it" })).toHaveValue("public");
  });

  it("takes the current template on a 409 and says so", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { template: { ...TEMPLATE, visibility: "unlisted", version: 5 } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<MyTemplateRow template={TEMPLATE} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Who sees it" }), "public");
    expect(await screen.findByText(/It changed elsewhere/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Who sees it" })).toHaveValue("unlisted");
  });

  it("asks before deleting, then says it's gone", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<MyTemplateRow template={TEMPLATE} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Delete Mine? This can't be undone.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/templates/t-mine0001", { method: "DELETE" });
    expect(await screen.findByText("Deleted Mine.")).toBeInTheDocument();
  });
});
