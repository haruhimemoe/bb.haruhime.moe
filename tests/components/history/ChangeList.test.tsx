/**
 * @file tests/components/history/ChangeList.test.tsx
 * @desc ChangeList: the root reads as the first saved version, an empty change set shows the
 *       empty-state message, and text and body lines render.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { RevisionMeta } from "@haruhimemoe/vcs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChangeList } from "@/components/history/ChangeList";

const revision: RevisionMeta = {
  id: "r1",
  docId: "t-abcd1234",
  seq: 1,
  kind: "save",
  valueHash: "h",
  authorId: "10",
  authorName: "owner",
  message: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("ChangeList", () => {
  it("reads the root as the first saved version", () => {
    render(<ChangeList revision={{ ...revision, seq: 0, kind: "root" }} lines={null} />);
    expect(screen.getByText("The first saved version.")).toBeInTheDocument();
  });

  it("shows the empty-state message for no visible changes", () => {
    render(<ChangeList revision={revision} lines={[]} />);
    expect(screen.getByText("No changes since history started.")).toBeInTheDocument();
  });

  it("renders text and body change lines", () => {
    render(
      <ChangeList
        revision={revision}
        lines={[
          { kind: "text", text: "Renamed to New name" },
          { kind: "body", diff: [{ op: "insert", lines: ["new line\n"] }] },
        ]}
      />,
    );
    expect(screen.getByText("Renamed to New name")).toBeInTheDocument();
    expect(screen.getByText("+ new line")).toBeInTheDocument();
  });
});
