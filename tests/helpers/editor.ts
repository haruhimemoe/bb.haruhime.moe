/**
 * @file tests/helpers/editor.ts
 * @desc Reaching the CodeMirror editor in component tests: wait for it to load (it comes in
 *       through next/dynamic), read its text, select a range, and press a key in it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { EditorView } from "@codemirror/view";
import { fireEvent, waitFor } from "@testing-library/react";
import { expect } from "vitest";

/**
 * @function findEditor
 * @returns {Promise<EditorView>} the page's CodeMirror view, once it has loaded
 */
export const findEditor = async (): Promise<EditorView> => {
  let view: EditorView | null = null;
  await waitFor(() => {
    const dom = document.querySelector<HTMLElement>(".cm-editor");
    view = dom ? EditorView.findFromDOM(dom) : null;
    expect(view).not.toBeNull();
  });
  return view as unknown as EditorView;
};

/**
 * @function editorText
 * @param view {EditorView} the editor
 * @returns {string} its whole text
 */
export const editorText = (view: EditorView): string => view.state.doc.toString();

/**
 * @function selectRange
 * @param view {EditorView} the editor
 * @param from {number} where the selection starts
 * @param to {number} where it ends
 * @returns {void}
 */
export const selectRange = (view: EditorView, from: number, to: number): void => {
  view.dispatch({ selection: { anchor: from, head: to } });
};

/**
 * @function pressInEditor
 * @param view {EditorView} the editor
 * @param key {string} the key, e.g. "b"
 * @param modifiers {{ ctrlKey?: boolean; metaKey?: boolean }} held keys
 * @returns {void}
 */
export const pressInEditor = (
  view: EditorView,
  key: string,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {},
): void => {
  fireEvent.keyDown(view.contentDOM, { key, code: `Key${key.toUpperCase()}`, ...modifiers });
};
