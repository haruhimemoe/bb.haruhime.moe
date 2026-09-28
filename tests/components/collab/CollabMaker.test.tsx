/**
 * @file tests/components/collab/CollabMaker.test.tsx
 * @desc The collab maker end to end in jsdom: loading an image (http(s) only), drawing, moving
 *       and resizing regions with fired pointer events, keyboard nudges, editing, reordering and
 *       deleting regions, the output, importing an existing imagemap, and linking players.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { CollabMaker } from "@/components/collab/CollabMaker";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const IMAGE = "https://i.example.com/collab.png";

/** Renders the maker with an image loaded, the overlay 400 by 200 at the page's corner. */
const setup = async () => {
  const user = userEvent.setup();
  render(<CollabMaker />);
  await user.type(screen.getByLabelText("Image URL"), IMAGE);
  await user.click(screen.getByRole("button", { name: "Load image" }));
  const overlay = screen.getByTestId("collab-overlay");
  overlay.getBoundingClientRect = () => new DOMRect(0, 0, 400, 200);
  return { user, overlay };
};

const drag = (from: Element, to: Element, a: [number, number], b: [number, number]) => {
  fireEvent.pointerDown(from, { button: 0, pointerId: 1, clientX: a[0], clientY: a[1] });
  fireEvent.pointerMove(to, { pointerId: 1, clientX: b[0], clientY: b[1] });
  fireEvent.pointerUp(to, { pointerId: 1, clientX: b[0], clientY: b[1] });
};

const output = () => (screen.getByLabelText("Your imagemap") as HTMLTextAreaElement).value;

describe("CollabMaker", () => {
  it("refuses an image URL that isn't http(s)", async () => {
    const user = userEvent.setup();
    render(<CollabMaker />);
    await user.type(screen.getByLabelText("Image URL"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "Load image" }));
    expect(screen.getByText(/Use an http:\/\/ or https:\/\/ link/)).toBeInTheDocument();
    expect(screen.queryByTestId("collab-overlay")).not.toBeInTheDocument();
  });

  it("draws a region in percent and writes the imagemap", async () => {
    const { overlay } = await setup();
    expect(screen.getByAltText("Your collab")).toHaveAttribute("src", IMAGE);
    drag(overlay, overlay, [40, 20], [240, 120]);
    expect(output()).toBe(`[imagemap]\n${IMAGE}\n10 10 50 50 #\n[/imagemap]`);
  });

  it("treats a tiny drag as a click, not a region", async () => {
    const { overlay } = await setup();
    drag(overlay, overlay, [40, 20], [41, 21]);
    expect(screen.getByText("No regions yet. Draw one on the image.")).toBeInTheDocument();
  });

  it("moves a region by dragging it and resizes it by a handle", async () => {
    const { overlay } = await setup();
    drag(overlay, overlay, [0, 0], [100, 100]);
    const box = screen.getByRole("button", { name: /^Region 1:/ });
    drag(box, overlay, [50, 50], [90, 70]);
    expect(output()).toContain("\n10 10 25 50 #\n");
    const handle = box.querySelector('[data-handle="se"]') as Element;
    drag(handle, overlay, [140, 120], [200, 200]);
    expect(output()).toContain("\n10 10 40 90 #\n");
  });

  it("nudges the focused region with the arrow keys", async () => {
    const { user, overlay } = await setup();
    drag(overlay, overlay, [40, 20], [240, 120]);
    screen.getByRole("button", { name: /^Region 1:/ }).focus();
    await user.keyboard("{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
    expect(output()).toContain("\n10.5 15 50 50 #\n");
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(output()).toContain("\n10.5 15 49.5 50 #\n");
    await user.keyboard("{Delete}");
    expect(screen.getByText("No regions yet. Draw one on the image.")).toBeInTheDocument();
  });

  it("edits, reorders and deletes regions from the list", async () => {
    const { user, overlay } = await setup();
    drag(overlay, overlay, [0, 0], [40, 20]);
    drag(overlay, overlay, [200, 100], [400, 200]);
    const first = screen.getByRole("listitem", { name: "Region 1" });
    await user.clear(within(first).getByLabelText("Link"));
    await user.type(within(first).getByLabelText("Link"), "https://osu.ppy.sh/users/2");
    await user.type(within(first).getByLabelText(/Title/), "peppy");
    expect(output()).toContain("\n0 0 10 10 https://osu.ppy.sh/users/2 peppy\n50 50 50 50 #\n");
    await user.click(screen.getByRole("button", { name: "Move region 2 up" }));
    expect(output()).toContain("\n50 50 50 50 #\n0 0 10 10 https://osu.ppy.sh/users/2 peppy\n");
    await user.click(screen.getByRole("button", { name: "Delete region 1" }));
    expect(screen.getAllByRole("listitem", { name: /^Region/ })).toHaveLength(1);
  });

  it("marks a bad link on its region and holds the output back", async () => {
    const { user, overlay } = await setup();
    drag(overlay, overlay, [0, 0], [40, 20]);
    await user.clear(screen.getByLabelText("Link"));
    await user.type(screen.getByLabelText("Link"), "ftp://x");
    expect(screen.getByText("Use #, an http(s) URL or mailto:.")).toBeInTheDocument();
    expect(screen.getByText("Fix the regions marked in the list.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your imagemap")).not.toBeInTheDocument();
  });

  it("imports an existing imagemap, and opens the result in the editor", async () => {
    const user = userEvent.setup();
    render(<CollabMaker />);
    await user.click(screen.getByRole("button", { name: /Edit an imagemap you already have/ }));
    const block = `[imagemap]\n${IMAGE}\n0 0 50 100 https://osu.ppy.sh/users/2 left\n[/imagemap]`;
    fireEvent.change(screen.getByLabelText(/Paste the whole/), { target: { value: block } });
    await user.click(screen.getByRole("button", { name: "Edit this imagemap" }));
    expect(screen.getByLabelText("Image URL")).toHaveValue(IMAGE);
    expect(output()).toBe(block);
    await user.click(screen.getByRole("button", { name: "Open in the editor" }));
    expect(window.localStorage.getItem("bb:handoff")).toBe(block);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("lists what osu! would refuse in a pasted imagemap", async () => {
    const user = userEvent.setup();
    render(<CollabMaker />);
    await user.click(screen.getByRole("button", { name: /Edit an imagemap you already have/ }));
    fireEvent.change(screen.getByLabelText(/Paste the whole/), {
      target: { value: "[imagemap]\nnope\n[/imagemap]" },
    });
    await user.click(screen.getByRole("button", { name: "Edit this imagemap" }));
    expect(screen.getByText("osu! wouldn't accept this imagemap:")).toBeInTheDocument();
  });
});

describe("CollabMaker player links", () => {
  const server = setupMsw();

  it("links regions to players in order", async () => {
    server.use(
      http.post("*/api/osu/users", () =>
        HttpResponse.json({
          users: [{ id: 2, username: "peppy", countryCode: "AU" }],
          notFound: ["ghost"],
          unchecked: [],
        }),
      ),
    );
    const { user, overlay } = await setup();
    drag(overlay, overlay, [0, 0], [40, 20]);
    drag(overlay, overlay, [200, 100], [400, 200]);
    await user.click(screen.getByRole("button", { name: /Link players to regions/ }));
    await user.type(screen.getByLabelText(/in region order/), "ghost{Enter}peppy");
    await user.click(screen.getByRole("button", { name: "Link players" }));
    expect(await screen.findByText("ghost", { selector: "span" })).toBeInTheDocument();
    expect(output()).toContain("\n0 0 10 10 https://osu.ppy.sh/users/2 peppy\n50 50 50 50 #\n");
  });
});
