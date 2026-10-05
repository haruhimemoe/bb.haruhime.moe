/**
 * @file tests/components/me/TemplateForm.test.tsx
 * @desc The template form: a new template is POSTed and opens its page; an edit sends only what
 *       changed with its version; a 409 reloads the server's template and says so; undeclared
 *       placeholders can be added as fields in one press.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TemplateForm } from "@/components/me/TemplateForm";
import { toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const bodyOf = (mock: ReturnType<typeof vi.fn>) =>
  JSON.parse(String((mock.mock.calls[0] as [string, RequestInit])[1].body));

describe("TemplateForm", () => {
  it("creates a template, declaring the body's placeholders as fields", async () => {
    const saved = toTemplateView(makeTemplate({ _id: "t-new00001" }));
    const fetchMock = vi.fn(async () => Response.json({ template: saved }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<TemplateForm />);
    await user.type(screen.getByLabelText("Name"), "My page");
    await user.type(screen.getByLabelText(/^Body/), "Hi {{{{team_name}}");
    await user.click(screen.getByRole("button", { name: "Add them as fields" }));
    expect(screen.getByLabelText("Label")).toHaveValue("Team name");
    await user.click(screen.getByRole("button", { name: "Create template" }));
    expect(bodyOf(fetchMock)).toMatchObject({
      name: "My page",
      body: "Hi {{team_name}}",
      visibility: "private",
      fields: [{ key: "team_name", kind: "text" }],
    });
    expect(push).toHaveBeenCalledWith("/t/t-new00001");
  });

  it("offers only placeholders bb can declare, and names the rest", async () => {
    const user = userEvent.setup();
    render(<TemplateForm />);
    await user.type(screen.getByLabelText(/^Body/), "{{{{team}} {{{{1st.place}}");
    await user.click(screen.getByRole("button", { name: "Add them as fields" }));
    expect(screen.getAllByLabelText("Label")).toHaveLength(1);
    expect(screen.getByLabelText("Label")).toHaveValue("Team");
    expect(screen.getByText(/\{\{1st\.place\}\} can't be a field key/)).toBeInTheDocument();
  });

  it("sends only the change with the version, and reloads on 409", async () => {
    const saved = toTemplateView(makeTemplate({ _id: "t-edit0001", name: "Old", version: 2 }));
    const current = { ...saved, name: "Theirs", version: 3 };
    const fetchMock = vi.fn(async () =>
      Response.json({ error: { code: "conflict" }, template: current }, { status: 409 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<TemplateForm saved={saved} />);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Mine");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(bodyOf(fetchMock)).toEqual({ baseVersion: 2, name: "Mine" });
    expect(await screen.findByText(/Someone changed this template first/)).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Theirs");
  });

  it("shows a merge conflict's draft in the form and keeps it editable", async () => {
    const saved = toTemplateView(
      makeTemplate({
        _id: "t-edit0002",
        body: "line one",
        version: 2,
        head: { id: "r1", seq: 1 },
      }),
    );
    const message =
      "This template changed since you opened it, in the same places you changed. Your version is in the form; check it and save again.";
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          error: {
            code: "merge_conflict",
            message,
            conflicts: [],
            draft: { body: "line one OURS" },
          },
          template: saved,
        },
        { status: 409 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<TemplateForm saved={saved} />);
    await user.clear(screen.getByLabelText(/^Body/));
    await user.type(screen.getByLabelText(/^Body/), "line one THEIRS");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Body/)).toHaveValue("line one OURS");
  });
});
