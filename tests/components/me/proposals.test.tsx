/**
 * @file tests/components/me/proposals.test.tsx
 * @desc The proposal pieces of the template form, against msw's routes: a fork's owner proposes
 *       with a note; the original's owner sees each proposal's changes, merges one (the template
 *       comes back, or a conflict's draft and the proposal to close) or declines one.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { diffValue } from "@haruhimemoe/vcs/json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ProposalList } from "@/components/me/ProposalList";
import { ProposeForm } from "@/components/me/ProposeForm";
import type { ProposalView } from "@/schemas/proposal";
import { TEMPLATE_CODEC } from "@/utils/template-snapshot";

const server = setupMsw();

const PROPOSAL: ProposalView = {
  id: "p-abcdefgh",
  templateId: "t-source01",
  fromId: "t-forkfork",
  proposer: { osuId: 2, username: "peppy" },
  message: "Bold the title",
  status: "open",
  updatedAt: "2026-10-11T10:00:00.000Z",
  changes: diffValue({ body: "a\n" }, { body: "[b]a[/b]\n" }, TEMPLATE_CODEC),
};

describe("ProposeForm", () => {
  it("sends the note and says it went", async () => {
    let sent: unknown = null;
    server.use(
      http.post("*/api/templates/t-forkfork/propose", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ proposal: PROPOSAL });
      }),
    );
    const user = userEvent.setup();
    render(<ProposeForm templateId="t-forkfork" upstreamName="Source" />);
    await user.type(screen.getByLabelText("A note for them (optional)"), "Bold the title");
    await user.click(screen.getByRole("button", { name: "Propose" }));
    expect(
      await screen.findByText("Proposed. The owner of Source can merge it now."),
    ).toBeInTheDocument();
    expect(sent).toEqual({ message: "Bold the title" });
  });

  it("says what the server refused", async () => {
    server.use(
      http.post("*/api/templates/t-forkfork/propose", () =>
        HttpResponse.json(
          { error: { code: "no_changes", message: "Your copy has no changes." } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ProposeForm templateId="t-forkfork" upstreamName="Source" />);
    await user.click(screen.getByRole("button", { name: "Propose" }));
    expect(await screen.findByText("Your copy has no changes.")).toBeInTheDocument();
  });

  it("withdraws the open proposal", async () => {
    server.use(
      http.delete(
        "*/api/templates/t-forkfork/proposals/p-abcdefgh",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<ProposeForm templateId="t-forkfork" upstreamName="Source" proposalId="p-abcdefgh" />);
    expect(
      screen.getByText("Your proposal to Source is open. Proposing again replaces it."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Withdraw it" }));
    expect(await screen.findByText("Withdrawn.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Withdraw it" })).not.toBeInTheDocument();
  });
});

describe("ProposalList", () => {
  it("shows who proposed what, with the body's diff", () => {
    render(<ProposalList templateId="t-source01" proposals={[PROPOSAL]} onMerged={vi.fn()} />);
    expect(screen.getByText("peppy proposed")).toBeInTheDocument();
    expect(screen.getByText("Bold the title")).toBeInTheDocument();
    expect(screen.getByText(/\[b\]a\[\/b\]/)).toBeInTheDocument();
  });

  it("merges and hands the template back", async () => {
    const template = { id: "t-source01", body: "[b]a[/b]\n" };
    server.use(
      http.post("*/api/templates/t-source01/proposals/p-abcdefgh/merge", () =>
        HttpResponse.json({ template }),
      ),
    );
    const user = userEvent.setup();
    const onMerged = vi.fn();
    render(<ProposalList templateId="t-source01" proposals={[PROPOSAL]} onMerged={onMerged} />);
    await user.click(screen.getByRole("button", { name: "Merge" }));
    expect(onMerged).toHaveBeenCalledWith({ ok: true, template, name: "peppy" });
    expect(screen.queryByText("peppy proposed")).not.toBeInTheDocument();
  });

  it("hands a conflict's draft back with the proposal to close", async () => {
    server.use(
      http.post("*/api/templates/t-source01/proposals/p-abcdefgh/merge", () =>
        HttpResponse.json(
          {
            error: {
              code: "proposal_conflict",
              message: "They clash.",
              draft: { body: "merged" },
              merged: "p-abcdefgh",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    const onMerged = vi.fn();
    render(<ProposalList templateId="t-source01" proposals={[PROPOSAL]} onMerged={onMerged} />);
    await user.click(screen.getByRole("button", { name: "Merge" }));
    expect(onMerged).toHaveBeenCalledWith({
      ok: false,
      message: "They clash.",
      draft: { body: "merged" },
      merged: "p-abcdefgh",
    });
  });

  it("declines and drops it from the list", async () => {
    server.use(
      http.post(
        "*/api/templates/t-source01/proposals/p-abcdefgh/decline",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<ProposalList templateId="t-source01" proposals={[PROPOSAL]} onMerged={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(await screen.findByText("Declined peppy's proposal.")).toBeInTheDocument();
    expect(screen.queryByText("peppy proposed")).not.toBeInTheDocument();
  });
});
