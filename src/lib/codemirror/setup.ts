/**
 * @file src/lib/codemirror/setup.ts
 * @desc Everything the BBCode source editor is made of: line numbers, history, search, bracket
 *       closing, the BBCode language, tag autocomplete, lint marks, matching tags, the theme,
 *       soft wrapping, the toolbar's keyboard shortcuts (Ctrl or Cmd with B, I, U), and
 *       `applyEdit`, which makes a toolbar edit on the current selection. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import type { Extension } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { POST_LIMIT } from "@/constants/editor";
import { TOOLBAR_ITEMS } from "@/constants/toolbar";
import { completeTags } from "@/lib/codemirror/complete";
import { bbcode } from "@/lib/codemirror/language";
import { bbcodeLint } from "@/lib/codemirror/lint";
import { tagMatching } from "@/lib/codemirror/match";
import { editorTheme } from "@/lib/codemirror/theme";
import { planEdit, type TextEdit } from "@/utils/text-edit";

/**
 * @function applyEdit
 * @param view {EditorView} the editor
 * @param edit {TextEdit} what to do to the main selection
 * @returns {boolean} true (a key binding that ran)
 */
export const applyEdit = (view: EditorView, edit: TextEdit): boolean => {
  const { from, to } = view.state.selection.main;
  const plan = planEdit(view.state.doc.toString(), from, to, edit);
  view.dispatch({
    changes: { from: plan.from, to: plan.to, insert: plan.insert },
    selection: { anchor: plan.anchor, head: plan.head },
    scrollIntoView: true,
    userEvent: "input",
  });
  view.focus();
  return true;
};

/** The toolbar's shortcuts, as key bindings. */
const shortcuts = keymap.of(
  TOOLBAR_ITEMS.flatMap((item) =>
    item.shortcut
      ? [{ key: item.shortcut, run: (view: EditorView) => applyEdit(view, item.edit) }]
      : [],
  ),
);

/** What the editor needs from its host. */
export type EditorOptions = {
  /** The editable area's accessible name. */
  label: string;
  /** Called with the whole text after every change. */
  onChange: (text: string) => void;
};

/**
 * @function editorExtensions
 * @param options {EditorOptions} the label and the change handler
 * @returns {Extension} the whole editor setup
 */
export const editorExtensions = ({ label, onChange }: EditorOptions): Extension => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  history(),
  drawSelection(),
  EditorView.lineWrapping,
  bbcode(),
  tagMatching(),
  autocompletion({ override: [completeTags], icons: false }),
  bbcodeLint(POST_LIMIT),
  highlightSelectionMatches(),
  placeholder("[b]Hello[/b], osu!"),
  shortcuts,
  keymap.of([
    ...completionKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...searchKeymap,
    ...lintKeymap,
  ]),
  editorTheme,
  EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false" }),
  EditorView.updateListener.of((update) => {
    if (update.docChanged) onChange(update.state.doc.toString());
  }),
];
