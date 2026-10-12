/**
 * @file src/lib/codemirror/typing.ts
 * @desc How the editor helps as you type: a `]` that finishes an opening tag osu! knows writes
 *       its closing tag after the cursor, and typing that closing tag yourself types over it;
 *       Enter between a block tag and its closing tag puts each on its own line around an empty
 *       one, and Enter at the end of a `[*]` item starts the next (or leaves the list from an
 *       empty one). Never adds indentation: spaces count against osu!'s limit. Brackets match.
 *       Each step is one undo. The settings switch auto-close and list continuation off. The
 *       plans (`typedSpec`, `enterSpec`) are pure, for the tests. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { completionStatus } from "@codemirror/autocomplete";
import { bracketMatching } from "@codemirror/language";
import { type EditorState, type Extension, Prec, type TransactionSpec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { autoCloseName, listContinuation, splitsPair } from "@/utils/tag-typing";

/** Which typing helpers are on. */
export type TypingOptions = {
  /** `]` writes the closing tag. */
  autoClose: boolean;
  /** Enter on a `[*]` item starts the next one. */
  listContinue: boolean;
};

const CLOSING_BEFORE = /\[\/([a-z*]+)$/;

/**
 * @function typedSpec
 * @param state {EditorState} the editor's state
 * @param from {number} where the typed text goes
 * @param to {number} the end of what it replaces
 * @param text {string} what was typed
 * @param options {TypingOptions} which helpers are on
 * @returns {TransactionSpec | null} the edit to make instead, or null to type as usual
 */
export const typedSpec = (
  state: EditorState,
  from: number,
  to: number,
  text: string,
  options: TypingOptions,
): TransactionSpec | null => {
  if (!options.autoClose || text !== "]") return null;
  const line = state.doc.lineAt(from);
  if (to > line.to) return null;
  const before = state.sliceDoc(line.from, from);
  const after = state.sliceDoc(to, line.to);
  const closing = CLOSING_BEFORE.exec(before)?.[1];
  if (closing && after.startsWith(`[/${closing}]`)) {
    const end = to + closing.length + 3;
    return { changes: { from, to: end, insert: "]" }, selection: { anchor: from + 1 } };
  }
  const name = autoCloseName(before, after);
  if (!name) return null;
  return {
    changes: { from, to, insert: `][/${name}]` },
    selection: { anchor: from + 1 },
    userEvent: "input.type",
  };
};

/**
 * @function enterSpec
 * @param state {EditorState} the editor's state
 * @param options {TypingOptions} which helpers are on
 * @returns {TransactionSpec | null} the split pair or the next list item, or null for the
 *          default Enter
 */
export const enterSpec = (state: EditorState, options: TypingOptions): TransactionSpec | null => {
  const { ranges, main } = state.selection;
  if (ranges.length !== 1 || !main.empty) return null;
  const pos = main.head;
  const line = state.doc.lineAt(pos);
  const before = state.sliceDoc(line.from, pos);
  const after = state.sliceDoc(pos, line.to);
  const indent = /^[ \t]*/.exec(line.text)?.[0] ?? "";
  if (splitsPair(before, after)) {
    return {
      changes: { from: pos, insert: `\n${indent}\n${indent}` },
      selection: { anchor: pos + 1 + indent.length },
      userEvent: "input",
    };
  }
  if (!options.listContinue || after !== "") return null;
  const next = listContinuation(line.text);
  if (!next) return null;
  if (next.kind === "continue") {
    return {
      changes: { from: pos, insert: next.insert },
      selection: { anchor: pos + next.insert.length },
      userEvent: "input",
    };
  }
  return {
    changes: { from: line.from, to: line.to, insert: next.line },
    selection: { anchor: line.from + next.line.length },
    userEvent: "input",
  };
};

/**
 * @function typing
 * @param options {TypingOptions} which helpers are on
 * @returns {Extension} bracket matching, the `]` handler and the Enter key
 */
export const typing = (options: TypingOptions): Extension => [
  bracketMatching(),
  EditorView.inputHandler.of((view, from, to, text) => {
    if (view.composing) return false;
    const spec = typedSpec(view.state, from, to, text, options);
    if (spec) view.dispatch(spec);
    return spec !== null;
  }),
  Prec.high(
    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          // An open autocomplete list takes Enter for itself.
          if (completionStatus(view.state) === "active") return false;
          const spec = enterSpec(view.state, options);
          if (spec) view.dispatch({ ...spec, scrollIntoView: true });
          return spec !== null;
        },
      },
    ]),
  ),
];
