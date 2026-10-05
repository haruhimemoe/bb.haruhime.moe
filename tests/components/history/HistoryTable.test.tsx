/**
 * @file tests/components/history/HistoryTable.test.tsx
 * @desc HistoryTable: lists every revision with a link to its changes, marks the one being
 *       shown, and offers an older-versions link only when the page is full.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { RevisionMeta } from "@haruhimemoe/vcs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryTable } from "@/components/history/HistoryTable";

const revision = (overrides: Partial<RevisionMeta> = {}): RevisionMeta => ({
  id: "r1",
  docId: "t-abcd1234",
  seq: 0,
  kind: "root",
  valueHash: "h",
  authorId: "10",
  authorName: "owner",
  message: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("HistoryTable", () => {
  it("links each revision's changes and marks the selected row", () => {
    const revisions = [revision({ id: "r2", seq: 1, kind: "save" }), revision()];
    render(
      <HistoryTable templateId="t-abcd1234" revisions={revisions} selected="r2" older={null} />,
    );
    const links = screen.getAllByRole("link", { name: "Changes" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/t/t-abcd1234/history?rev=r2");
    expect(links[0]).toHaveAttribute("aria-current", "true");
    expect(links[1]).not.toHaveAttribute("aria-current");
  });

  it("offers older versions only when a cursor is given", () => {
    const { rerender } = render(
      <HistoryTable templateId="t-abcd1234" revisions={[revision()]} older={null} />,
    );
    expect(screen.queryByText("Older versions")).not.toBeInTheDocument();
    rerender(<HistoryTable templateId="t-abcd1234" revisions={[revision()]} older={5} />);
    expect(screen.getByRole("link", { name: "Older versions" })).toHaveAttribute(
      "href",
      "/t/t-abcd1234/history?before=5",
    );
  });
});
