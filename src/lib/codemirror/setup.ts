/**
 * @file src/lib/codemirror/setup.ts
 * @desc Everything the BBCode source editor is made of: line numbers, history, search, typing
 *       help (auto-closed tags, Enter in pairs and lists, matching brackets) under the editor
 *       settings, the BBCode language, tag autocomplete, lint marks, copy-as-markdown marks, the
 *       profile hover card,
 *       matching tags, the theme, soft wrapping, the toolbar's keyboard shortcuts (Ctrl or Cmd
 *       with B, I, U), Fix all (Ctrl or Cmd Shift .), and `applyEdit`, which makes a toolbar
 *       edit on the current selection. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, type Extension } from "@codemirror/state";
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
import { bbcodeLint, fixAllIn } from "@/lib/codemirror/lint";
import { markdownMarks } from "@/lib/codemirror/markdown-marks";
import { tagMatching } from "@/lib/codemirror/match";
import { type ProfileHoverLabels, profileHover } from "@/lib/codemirror/profile-hover";
import { editorFont, editorTheme } from "@/lib/codemirror/theme";
import { typing } from "@/lib/codemirror/typing";
import type { EditorSettings } from "@/utils/editor-settings";
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

/** Where the settings' extensions sit, so a change swaps them without a new editor. */
const settingsSlot = new Compartment();

const fromSettings = (settings: EditorSettings): Extension => [
  editorFont(settings.font, settings.size),
  typing({ autoClose: settings.autoClose, listContinue: settings.listContinue }),
];

/**
 * @function applySettings
 * @param view {EditorView} the editor
 * @param settings {EditorSettings} the new settings
 * @returns {void} swaps the font, size and typing help in place (undo history kept)
 */
export const applySettings = (view: EditorView, settings: EditorSettings): void => {
  view.dispatch({ effects: settingsSlot.reconfigure(fromSettings(settings)) });
};

/** What the editor needs from its host. */
export type EditorOptions = {
  /** The editable area's accessible name. */
  label: string;
  /** Called with the whole text after every change. */
  onChange: (text: string) => void;
  /** The profile hover card's words, read when a card opens. */
  hoverLabels: () => ProfileHoverLabels;
  /** The settings it starts with (applySettings changes them later). */
  settings: EditorSettings;
};

/**
 * @function editorExtensions
 * @param options {EditorOptions} the label, the change handler, the hover card's words and the
 *        settings
 * @returns {Extension} the whole editor setup
 */
export const editorExtensions = ({
  label,
  onChange,
  hoverLabels,
  settings,
}: EditorOptions): Extension => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  history(),
  drawSelection(),
  EditorView.lineWrapping,
  bbcode(),
  tagMatching(),
  settingsSlot.of(fromSettings(settings)),
  autocompletion({ override: [completeTags], icons: false }),
  bbcodeLint(POST_LIMIT),
  markdownMarks(),
  profileHover(hoverLabels),
  highlightSelectionMatches(),
  placeholder("[b]Hello[/b], osu!"),
  shortcuts,
  keymap.of([{ key: "Mod-Shift-.", run: (view) => fixAllIn(view, POST_LIMIT) > 0 }]),
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
