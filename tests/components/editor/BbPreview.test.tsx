/**
 * @file tests/components/editor/BbPreview.test.tsx
 * @desc BbPreview: the full preview renders everything, laid out at osu!'s width for its target
 *       and zoomed to fit the pane, with a remembered "Fit to pane / Actual size" choice; a
 *       compact card preview renders only the start it can show, so a long template costs a
 *       gallery page little.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { OSU_WIDTHS } from "@haruhimemoe/bbcode";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BbPreview } from "@/components/editor/BbPreview";
import { COMPACT_PREVIEW_CHARS, PREVIEW_SCALE_KEY } from "@/constants/editor";

const LONG = `[b]start[/b]${"y".repeat(COMPACT_PREVIEW_CHARS)}[i]end[/i]`;

/** A ResizeObserver that reports every pane `width` px wide. */
const paneWidth = (width: number) => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        const entry = { target, contentRect: { width } } as unknown as ResizeObserverEntry;
        this.callback([entry], this as unknown as ResizeObserver);
      }
      disconnect() {}
      unobserve() {}
    },
  );
};

/** The fixed-width canvas the rendered HTML sits in. */
const canvas = (container: HTMLElement) =>
  container.querySelector(".bb")?.parentElement?.parentElement as HTMLElement;

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("BbPreview", () => {
  it("renders the whole text", () => {
    const { container } = render(<BbPreview source={LONG} />);
    expect(container.querySelector("em")?.textContent).toBe("end");
  });

  it("renders only the start in a compact card", () => {
    const { container } = render(<BbPreview source={LONG} compact />);
    expect(container.querySelector("strong")?.textContent).toBe("start");
    expect(container.querySelector("em")).toBeNull();
    expect(container.textContent?.length).toBeLessThanOrEqual(COMPACT_PREVIEW_CHARS);
  });

  it("makes a compact card inert, so a clipped link is neither read nor reachable", () => {
    const { container } = render(
      <BbPreview source="[url=https://osu.ppy.sh]osu![/url] and more" compact />,
    );
    const preview = container.querySelector(".bb-preview") as HTMLElement;
    expect(preview).toHaveAttribute("inert");
    expect(preview).not.toHaveAttribute("aria-hidden");
    expect(container.querySelector("a")).not.toBeNull();
  });

  it("keeps a full preview reachable", () => {
    const { container } = render(<BbPreview source="[url=https://osu.ppy.sh]osu![/url]" fluid />);
    expect(container.querySelector(".bb-preview")).not.toHaveAttribute("inert");
  });

  it("lays the preview out at osu!'s width for its target", () => {
    const userpage = render(<BbPreview source="[b]x[/b]" />);
    expect(canvas(userpage.container).style.width).toBe(`${OSU_WIDTHS.userpage}px`);
    expect(canvas(userpage.container).style.fontSize).toBe("14px");
    const beatmap = render(<BbPreview source="[b]x[/b]" target="beatmap" />);
    expect(canvas(beatmap.container).style.width).toBe(`${OSU_WIDTHS.beatmap}px`);
    expect(canvas(beatmap.container).style.fontSize).toBe("12px");
  });

  it("zooms down to fit a narrow pane and offers the actual size", () => {
    paneWidth(445);
    const { container } = render(<BbPreview source="[b]x[/b]" />);
    expect(canvas(container).style.zoom).toBe("0.5");
    expect(screen.getByRole("button", { name: /Fit to pane \(50%\)/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers no toggle when osu!'s width fits", () => {
    paneWidth(1200);
    const { container } = render(<BbPreview source="[b]x[/b]" />);
    expect(canvas(container).style.zoom).toBe("1");
    expect(screen.queryByRole("button", { name: /Actual size/ })).toBeNull();
  });

  it("remembers Actual size, which scrolls sideways at zoom 1", async () => {
    paneWidth(445);
    const user = userEvent.setup();
    const first = render(<BbPreview source="[b]x[/b]" />);
    await user.click(screen.getByRole("button", { name: "Actual size" }));
    expect(window.localStorage.getItem(PREVIEW_SCALE_KEY)).toBe("actual");
    expect(canvas(first.container).style.zoom).toBe("1");
    first.unmount();
    const again = render(<BbPreview source="[b]x[/b]" />);
    expect(canvas(again.container).style.zoom).toBe("1");
    expect(canvas(again.container).parentElement).toHaveClass("overflow-x-auto");
    await user.click(screen.getByRole("button", { name: /Fit to pane/ }));
    expect(window.localStorage.getItem(PREVIEW_SCALE_KEY)).toBe("fit");
    expect(canvas(again.container).style.zoom).toBe("0.5");
  });

  it("flows a fluid sample in the room it has", () => {
    const { container } = render(<BbPreview source="[b]x[/b]" fluid />);
    expect(container.querySelector("[style*='width']")).toBeNull();
  });
});
