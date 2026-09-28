/**
 * @file tests/components/docs/docs.test.tsx
 * @desc The docs' pieces render from TAGS: every tag's reference shows its facts, forms, a live
 *       example with its preview and its gotchas; the example edits, resets and opens in the
 *       editor; search narrows the index; the navigation marks the page you're on.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocsNav } from "@/components/docs/DocsNav";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { LiveExample } from "@/components/docs/LiveExample";
import { TagReference } from "@/components/docs/TagReference";
import { HANDOFF_KEY } from "@/constants/editor";
import { TAG_DOCS } from "@/constants/tag-docs";
import { docsEntries } from "@/utils/docs";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/docs/tags/box",
}));

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
});

describe("TagReference", () => {
  it.each(TAGS.map((tag) => [tag.name, tag] as const))("renders [%s] from TAGS", (name, tag) => {
    const { container } = render(<TagReference tag={tag} />);
    const docs = TAG_DOCS[name];
    expect(screen.getByText(tag.display === "block" ? "Block" : "Inline")).toBeInTheDocument();
    const forms = [...container.querySelectorAll("pre")].map((pre) => pre.textContent);
    expect(forms).toEqual(expect.arrayContaining([...(docs?.syntax ?? [])]));
    expect(screen.getByLabelText(`[${name}] example (edit me)`)).toHaveValue(
      docs?.example ?? tag.example,
    );
    expect(container.querySelector(".bb")).not.toBeNull();
    for (const line of docs?.gotchas ?? []) expect(screen.getByText(line)).toBeInTheDocument();
  });

  it("names aliases and one-line tags", () => {
    render(<TagReference tag={TAGS.find((tag) => tag.name === "s") ?? (TAGS[0] as never)} />);
    expect(screen.getByText("Also [strike]")).toBeInTheDocument();
  });
});

describe("LiveExample", () => {
  it("previews what's typed, resets, and opens it in the editor", async () => {
    const user = userEvent.setup();
    const { container } = render(<LiveExample source="[b]hi[/b]" />);
    const box = screen.getByLabelText("Example (edit me)");
    expect(within(container).getByText("hi").tagName).toBe("STRONG");
    await user.type(box, " [[i]there[[/i]");
    expect(within(container).getByText("there").tagName).toBe("EM");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(box).toHaveValue("[b]hi[/b]");
    await user.click(screen.getByRole("button", { name: "Open in the editor" }));
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBe("[b]hi[/b]");
    expect(push).toHaveBeenCalledWith("/");
  });
});

describe("DocsSearch", () => {
  it("narrows the guides and tags as it's typed", async () => {
    const user = userEvent.setup();
    render(<DocsSearch entries={docsEntries()} />);
    expect(screen.getByText(`${docsEntries().length} pages.`)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search the docs"), "spoiler box");
    expect(screen.getByText("1 match.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Spoiler box/ })).toHaveAttribute(
      "href",
      "/docs/tags/spoilerbox",
    );
  });
});

describe("DocsNav", () => {
  it("lists the guides and every tag, and marks the current page", () => {
    render(<DocsNav entries={docsEntries()} />);
    const [nav] = screen.getAllByRole("navigation", { name: "Docs", hidden: true });
    const links = within(nav as HTMLElement).getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(docsEntries().length + 1);
    const current = links.find((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveAttribute("href", "/docs/tags/box");
  });
});
