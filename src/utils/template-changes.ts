/**
 * @file src/utils/template-changes.ts
 * @desc A template revision's changes as lines people read ("Renamed to My userpage", "Added the
 *       field Team name"), built from @haruhimemoe/vcs's structured diff. The body's line diff is
 *       kept apart (as a TextDiff) so BodyDiff can render it as inserted and deleted lines rather
 *       than a one-line summary. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { Change } from "@haruhimemoe/vcs";
import type { TextDiff } from "@haruhimemoe/vcs/text";
import { KIND_LABELS, type TemplateKind } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";

/** One line of a change view, or the body's line diff for BodyDiff. */
export type TemplateChangeLine = { kind: "text"; text: string } | { kind: "body"; diff: TextDiff };

const DETAIL_LABELS: Record<string, (to: unknown) => string> = {
  name: (to) => `Renamed to ${String(to ?? "none")}`,
  description: () => "Changed the description",
  kind: (to) => `Changed what it's for to ${KIND_LABELS[to as TemplateKind] ?? String(to)}`,
};

/**
 * @function templateChangeLines
 * @param changes {readonly Change[]} diffValue(before, after, TEMPLATE_CODEC)
 * @returns {TemplateChangeLine[]} what changed, in document order
 */
export const templateChangeLines = (changes: readonly Change[]): TemplateChangeLine[] => {
  const seenMoves = new Set<string>();
  const lines: TemplateChangeLine[] = [];
  for (const change of changes) {
    const [top, item] = change.segments;
    if (top === "body" && change.op === "text") {
      lines.push({ kind: "body", diff: change.diff });
    } else if (top === "fields" && change.segments.length === 1) {
      if (change.op === "add" || change.op === "remove") {
        const added = change.op === "add";
        const value = change.value as TemplateField;
        lines.push({
          kind: "text",
          text: `${added ? "Added" : "Removed"} the field ${value.label}`,
        });
      } else if (change.op === "move" && !seenMoves.has(change.key)) {
        seenMoves.add(change.key);
        lines.push({ kind: "text", text: "Reordered fields" });
      }
    } else if (top === "fields" && typeof item === "object") {
      lines.push({ kind: "text", text: `Changed the field ${item.key}` });
    } else if (typeof top === "string" && change.op === "set") {
      const label = DETAIL_LABELS[top];
      if (label) lines.push({ kind: "text", text: label(change.to) });
    }
  }
  return lines;
};
