/**
 * @file src/lib/codemirror/lint.ts
 * @desc Lint marks from @haruhimemoe/bbcode's lint: each diagnostic underlines its range with its
 *       severity and message, and one with an obvious fix gets a "Fix" action that applies it.
 *       `fixAllIn` applies every fix as one undo step (Ctrl or Cmd Shift .). Also the pure mapping
 *       the tests check. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { type Diagnostic, linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { Diagnostic as BbDiagnostic } from "@haruhimemoe/bbcode";
import { lintBbcode } from "@/lib/bbcode";
import { fixAllChanges } from "@/utils/lint-fixes";

/** How long typing must pause before the text is linted again (ms). */
const LINT_DELAY_MS = 300;

/**
 * @function toDiagnostic
 * @param found {BbDiagnostic} one of the package's diagnostics
 * @returns {Diagnostic} the same problem as a CodeMirror diagnostic, with a Fix action when the
 *          package has one
 */
export const toDiagnostic = (found: BbDiagnostic): Diagnostic => {
  const { fix } = found;
  return {
    from: found.start,
    to: found.end,
    severity: found.severity,
    source: found.code,
    message: found.message,
    actions: fix
      ? [
          {
            name: "Fix",
            apply: (view: EditorView) =>
              view.dispatch({ changes: { from: fix.start, to: fix.end, insert: fix.text } }),
          },
        ]
      : [],
  };
};

/**
 * @function bbcodeLint
 * @param limit {number} the post target's character limit
 * @returns {Extension} the linter, run as the text changes
 */
export const bbcodeLint = (limit: number): Extension =>
  linter((view) => lintBbcode(view.state.doc.toString(), limit).map(toDiagnostic), {
    delay: LINT_DELAY_MS,
  });

/**
 * @function fixAllIn
 * @param view {EditorView} the editor
 * @param limit {number} the post target's character limit
 * @returns {number} how many fixes were applied (one undo step); 0 changes nothing
 */
export const fixAllIn = (view: EditorView, limit: number): number => {
  const changes = fixAllChanges(lintBbcode(view.state.doc.toString(), limit));
  if (changes.length > 0) view.dispatch({ changes, userEvent: "input.fix" });
  return changes.length;
};
