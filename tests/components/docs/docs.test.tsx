/**
 * @file tests/components/docs/docs.test.tsx
 * @desc The docs' pieces render from TAGS: every tag's reference shows its facts, forms, a live
 *       example with its preview and its gotchas; the example edits, resets and opens in the
 *       editor; /docs search narrows the pages and tags; the docs nav lists API and every tag and marks
 *       the page you're on.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocsLayout from "@/app/docs/layout";
import DocsPage from "@/app/docs/page";
import TagPage from "@/app/docs/tags/[tag]/page";
import { LiveExample } from "@/components/docs/LiveExample";
import { TagReference } from "@/components/docs/TagReference";
import { CONTENT } from "@/constants/content";
import { HANDOFF_KEY } from "@/constants/editor";
import { TAG_DOCS } from "@/constants/tag-docs";
import { tagSlug, tagTitle } from "@/utils/docs";

const { push, navigation } = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    navigation: () => ({ useRouter: () => ({ push }), usePathname: () => "/docs/tags/box" }),
  };
});
vi.mock("next/navigation", navigation);
// ui's ContentNav imports the ".js" specifier.
vi.mock("next/navigation.js", navigation);

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
  it("renders its box as a rounded surface", () => {
    const { container } = render(<LiveExample source="[b]hi[/b]" />);
    expect(container.firstElementChild).toHaveClass("rounded-[10px]", "bg-b4", "p-3");
  });

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

describe("/docs search", () => {
  it("narrows the docs pages and tags as it's typed, by tag name too", async () => {
    const user = userEvent.setup();
    render(<DocsPage />);
    const total = CONTENT.entries.docs.length + CONTENT.extra.docs.length;
    expect(screen.getByText(`${total} pages.`)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search the docs"), "spoiler box");
    expect(screen.getByText("1 match.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Spoiler box/ })).toHaveAttribute(
      "href",
      "/docs/tags/spoilerbox",
    );
    await user.clear(screen.getByLabelText("Search the docs"));
    await user.type(screen.getByLabelText("Search the docs"), "center");
    expect(screen.getByRole("link", { name: /Centre/ })).toHaveAttribute(
      "href",
      "/docs/tags/centre",
    );
  });
});

describe("tag page prev/next", () => {
  it("links to the tag before and after, titled and bold", async () => {
    const at = 1;
    const tag = TAGS[at] as (typeof TAGS)[number];
    const before = TAGS[at - 1] as (typeof TAGS)[number];
    const after = TAGS[at + 1] as (typeof TAGS)[number];
    render(await TagPage({ params: Promise.resolve({ tag: tagSlug(tag.name) }) }));
    const nav = screen.getByRole("navigation", { name: "More tags" });
    const prevLink = within(nav).getByRole("link", { name: new RegExp(tagTitle(before)) });
    expect(prevLink.lastElementChild).toHaveClass("font-bold");
    const nextLink = within(nav).getByRole("link", { name: new RegExp(tagTitle(after)) });
    expect(nextLink).toHaveClass("sm:ml-auto");
  });

  it("shows only Next on the first tag's page", async () => {
    const first = TAGS[0] as (typeof TAGS)[number];
    render(await TagPage({ params: Promise.resolve({ tag: tagSlug(first.name) }) }));
    const nav = screen.getByRole("navigation", { name: "More tags" });
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
    expect(within(nav).getByRole("link")).toHaveClass("sm:ml-auto");
  });
});

describe("/docs nav", () => {
  it("lists API under Docs, every tag under Tags, and marks the current page", () => {
    render(
      <DocsLayout>
        <p>page</p>
      </DocsLayout>,
    );
    const [nav] = screen.getAllByRole("navigation", { name: "Docs", hidden: true });
    const links = within(nav as HTMLElement).getAllByRole("link", { hidden: true });
    expect(links.map((link) => link.getAttribute("href"))).toContain("/docs/api");
    expect(within(nav as HTMLElement).getByText("API")).toBeInTheDocument();
    expect(within(nav as HTMLElement).getByText("Tags")).toBeInTheDocument();
    expect(links).toHaveLength(1 + CONTENT.entries.docs.length + TAGS.length);
    const current = links.find((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveAttribute("href", "/docs/tags/box");
  });
});
