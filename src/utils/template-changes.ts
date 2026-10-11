/**
 * @file src/utils/template-changes.ts
 * @desc A template revision's changes as lines people read ("Renamed to My userpage", "Added the
 *       field Team name"), built from @haruhimemoe/vcs's structured diff. The body's line diff is
 *       kept apart (as a TextDiff) so BodyDiff can render it as inserted and deleted lines rather
 *       than a one-line summary. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Change } from "@haruhimemoe/vcs";
import type { TextDiff } from "@haruhimemoe/vcs/text";
import type { TemplateField } from "@/schemas/template-field";

/** What a text line says: a key under "bb.history.lines" and its values. */
export type ChangeKey =
  | "renamed"
  | "description"
  | "kind"
  | "fieldAdded"
  | "fieldRemoved"
  | "reordered"
  | "fieldChanged";

/** One line of a change view (words chosen by the page), or the body's line diff for BodyDiff. */
export type TemplateChangeLine =
  | { kind: "text"; key: ChangeKey; values: Record<string, string> }
  | { kind: "body"; diff: TextDiff };

const DETAIL_LINES: Record<string, (to: unknown) => TemplateChangeLine> = {
  name: (to) => ({ kind: "text", key: "renamed", values: { name: String(to ?? "") } }),
  description: () => ({ kind: "text", key: "description", values: {} }),
  kind: (to) => ({ kind: "text", key: "kind", values: { kind: String(to) } }),
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
          key: added ? "fieldAdded" : "fieldRemoved",
          values: { label: value.label },
        });
      } else if (change.op === "move" && !seenMoves.has(change.key)) {
        seenMoves.add(change.key);
        lines.push({ kind: "text", key: "reordered", values: {} });
      }
    } else if (top === "fields" && typeof item === "object") {
      lines.push({ kind: "text", key: "fieldChanged", values: { key: item.key } });
    } else if (typeof top === "string" && change.op === "set") {
      const line = DETAIL_LINES[top];
      if (line) lines.push(line(change.to));
    }
  }
  return lines;
};
