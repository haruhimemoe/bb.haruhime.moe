/**
 * @file src/utils/lint-fixes.ts
 * @desc Fix all and the problem counts for @haruhimemoe/bbcode's lint. Fix all turns every
 *       diagnostic's fix into one change set: sorted by where the fix goes, the later-opened tag
 *       first where several closings insert at one spot (so `[i][b]x` gets `[/b][/i]`), and a
 *       fix that overlaps one already taken dropped (lint again for the rest). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Diagnostic } from "@haruhimemoe/bbcode";

/** One change for CodeMirror: replace `from..to` with `insert`. */
export type FixChange = { from: number; to: number; insert: string };

/** How many errors and warnings there are, and how many of them have a fix. */
export type ProblemCount = { errors: number; warnings: number; fixable: number };

/**
 * @function fixAllChanges
 * @param diagnostics {readonly Diagnostic[]} lint's diagnostics for the text
 * @returns {FixChange[]} every fix that doesn't overlap an earlier one, in order
 */
export const fixAllChanges = (diagnostics: readonly Diagnostic[]): FixChange[] => {
  const fixable = diagnostics.flatMap((found) => (found.fix ? [{ found, fix: found.fix }] : []));
  fixable.sort((a, b) => a.fix.start - b.fix.start || b.found.start - a.found.start);
  const changes: FixChange[] = [];
  let reach = 0;
  for (const { fix } of fixable) {
    if (fix.start < reach) continue;
    changes.push({ from: fix.start, to: fix.end, insert: fix.text });
    reach = fix.end;
  }
  return changes;
};

/**
 * @function countProblems
 * @param diagnostics {readonly Diagnostic[]} lint's diagnostics
 * @returns {ProblemCount} errors, warnings and how many carry a fix (info doesn't count)
 */
export const countProblems = (diagnostics: readonly Diagnostic[]): ProblemCount => {
  const count: ProblemCount = { errors: 0, warnings: 0, fixable: 0 };
  for (const found of diagnostics) {
    if (found.severity === "info") continue;
    if (found.severity === "error") count.errors++;
    else count.warnings++;
    if (found.fix) count.fixable++;
  }
  return count;
};
