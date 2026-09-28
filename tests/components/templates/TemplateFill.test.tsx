/**
 * @file tests/components/templates/TemplateFill.test.tsx
 * @desc A template's page: the preview follows the fields, "Use" leaves the filled text for the
 *       editor, counts the use and opens the editor, and Fork and Report show only for signed-in
 *       people (Report never on their own or a built-in template).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateFill } from "@/components/templates/TemplateFill";
import { HANDOFF_KEY } from "@/constants/editor";
import type { TemplateView } from "@/schemas/template-view";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const TEMPLATE: TemplateView = {
  id: "t-abcd1234",
  builtIn: false,
  ownerOsuId: 1,
  ownerName: "owner",
  name: "Hello",
  description: "",
  kind: "userpage",
  body: "[b]Hi {{name}}[/b]",
  fields: [{ key: "name", label: "Name", kind: "text", required: true, default: "" }],
  visibility: "public",
  forkOf: null,
  uses: 0,
  hidden: false,
  createdAt: null,
  updatedAt: null,
  version: 1,
};

const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("TemplateFill", () => {
  it("fills the preview and hands the text to the editor on Use", async () => {
    const user = userEvent.setup();
    render(<TemplateFill template={TEMPLATE} signedIn={false} own={false} />);
    await user.type(screen.getByLabelText("Name (required)"), "Haru");
    expect(screen.getByText("Hi Haru").tagName).toBe("STRONG");
    await user.click(screen.getByRole("button", { name: "Use in the editor" }));
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBe("[b]Hi Haru[/b]");
    expect(fetchMock).toHaveBeenCalledWith("/api/templates/t-abcd1234/use", { method: "POST" });
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows Fork and Report only when they apply", () => {
    const { rerender } = render(<TemplateFill template={TEMPLATE} signedIn={false} own={false} />);
    expect(screen.queryByRole("button", { name: "Fork" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Report this template" })).not.toBeInTheDocument();
    rerender(<TemplateFill template={TEMPLATE} signedIn own={false} />);
    expect(screen.getByRole("button", { name: "Fork" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report this template" })).toBeInTheDocument();
    rerender(<TemplateFill template={TEMPLATE} signedIn own />);
    expect(screen.queryByRole("button", { name: "Report this template" })).not.toBeInTheDocument();
    rerender(<TemplateFill template={{ ...TEMPLATE, builtIn: true }} signedIn own={false} />);
    expect(screen.queryByRole("button", { name: "Report this template" })).not.toBeInTheDocument();
  });

  it("sends a report and says thanks", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(Response.json({ hidden: false }));
    render(<TemplateFill template={TEMPLATE} signedIn own={false} />);
    await user.click(screen.getByRole("button", { name: "Report this template" }));
    await user.type(screen.getByLabelText("What's wrong with it?"), "spam links");
    await user.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByText("Thanks. An admin will look at it.")).toBeInTheDocument();
  });
});
