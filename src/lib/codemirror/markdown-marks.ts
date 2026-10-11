/**
 * @file src/lib/codemirror/markdown-marks.ts
 * @desc Copy-as-markdown marks: what toMarkdown couldn't carry over, underlined as info marks
 *       (source "markdown") until the text next changes. The marks live in a state field, set by
 *       an effect and emptied by any change, and reach the screen through a second linter.
 *       Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { type Diagnostic, linter } from "@codemirror/lint";
import { type EditorState, type Extension, StateEffect, StateField } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { Loss } from "@haruhimemoe/bbcode/markdown";
import { lossToDiagnostic } from "@/utils/markdown";

const setMarks = StateEffect.define<readonly Diagnostic[]>();

const marksField = StateField.define<readonly Diagnostic[]>({
  create: () => [],
  update: (marks, tr) => {
    for (const effect of tr.effects) if (effect.is(setMarks)) return effect.value;
    return tr.docChanged ? [] : marks;
  },
});

/**
 * @function markLossesEffect
 * @param lost {readonly Loss[]} toMarkdown's losses for the editor's current text
 * @returns {StateEffect<readonly Diagnostic[]>} the effect that shows them as marks
 */
export const markLossesEffect = (lost: readonly Loss[]): StateEffect<readonly Diagnostic[]> =>
  setMarks.of(lost.map(lossToDiagnostic));

/**
 * @function markdownMarksOf
 * @param state {EditorState} an editor state
 * @returns {readonly Diagnostic[]} the marks now shown (none without markdownMarks())
 */
export const markdownMarksOf = (state: EditorState): readonly Diagnostic[] =>
  state.field(marksField, false) ?? [];

/**
 * @function setMarkdownMarks
 * @param view {EditorView} the editor
 * @param lost {readonly Loss[]} toMarkdown's losses for the editor's current text
 * @returns {void}
 */
export const setMarkdownMarks = (view: EditorView, lost: readonly Loss[]): void => {
  view.dispatch({ effects: markLossesEffect(lost) });
};

/**
 * @function markdownMarks
 * @returns {Extension} the field and the linter that shows it
 */
export const markdownMarks = (): Extension => [
  marksField,
  linter((view) => [...markdownMarksOf(view.state)], {
    delay: 0,
    needsRefresh: (update) =>
      update.docChanged ||
      update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setMarks))),
  }),
];
