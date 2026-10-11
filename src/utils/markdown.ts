/**
 * @file src/utils/markdown.ts
 * @desc The markdown tool's helpers over @haruhimemoe/bbcode/markdown: what a conversion lost,
 *       counted per code in LOSS_CODES order for the panel's summary, and one loss as an info
 *       mark for the editor. Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Diagnostic } from "@codemirror/lint";
import { LOSS_CODES, type Loss, type LossCode } from "@haruhimemoe/bbcode/markdown";

/**
 * @function summarizeLosses
 * @param lost {readonly Loss[]} a conversion's losses
 * @returns {{ code: LossCode; count: number }[]} one entry per code that occurs, in LOSS_CODES
 *          order
 */
export const summarizeLosses = (lost: readonly Loss[]): { code: LossCode; count: number }[] =>
  LOSS_CODES.map((code) => ({
    code,
    count: lost.filter((one) => one.code === code).length,
  })).filter((one) => one.count > 0);

/**
 * @function lossToDiagnostic
 * @param loss {Loss} one loss from toMarkdown, its offsets into the editor's text
 * @returns {Diagnostic} an info mark over its range, sourced "markdown"
 */
export const lossToDiagnostic = (loss: Loss): Diagnostic => ({
  from: loss.start,
  to: loss.end,
  severity: "info",
  source: "markdown",
  message: loss.message,
});
