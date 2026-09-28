/**
 * @file src/lib/codemirror/lint.ts
 * @desc Lint marks from @haruhimemoe/bbcode's lint: each diagnostic underlines its range with its
 *       severity and message, and one with an obvious fix gets a "Fix" action that applies it.
 *       Also the pure mapping the tests check. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { type Diagnostic, linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { type Diagnostic as BbDiagnostic, lint } from "@haruhimemoe/bbcode";

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

/** lint, or nothing for text nested too deep for its recursion (the preview says so too). */
const safeLint = (text: string, limit: number): BbDiagnostic[] => {
  try {
    return lint(text, { limit });
  } catch (error) {
    if (error instanceof RangeError) return [];
    throw error;
  }
};

/**
 * @function bbcodeLint
 * @param limit {number} the post target's character limit
 * @returns {Extension} the linter, run as the text changes
 */
export const bbcodeLint = (limit: number): Extension =>
  linter((view) => safeLint(view.state.doc.toString(), limit).map(toDiagnostic), {
    delay: LINT_DELAY_MS,
  });
