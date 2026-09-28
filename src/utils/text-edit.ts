/**
 * @file src/utils/text-edit.ts
 * @desc What a toolbar button or shortcut does to the source, as plain data: wrap the selection
 *       in an opening and closing tag (or unwrap it when those tags already sit around it), or
 *       replace the selection with text. `planEdit` turns one into the change and the selection
 *       after it, so the CodeMirror adapter only applies it. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** Wrap the selection (or a placeholder when nothing is selected) in `open` and `close`. */
export type WrapEdit = { kind: "wrap"; open: string; close: string; placeholder: string };
/** Replace the selection with `text`; the cursor lands after it. */
export type InsertEdit = { kind: "insert"; text: string };
/** A toolbar or shortcut edit. */
export type TextEdit = WrapEdit | InsertEdit;

/** One change to the text and the selection after it. */
export type EditPlan = {
  from: number;
  to: number;
  insert: string;
  anchor: number;
  head: number;
};

/**
 * @function wrap
 * @param open {string} the opening tag, e.g. "[b]"
 * @param close {string} the closing tag, e.g. "[/b]"
 * @param placeholder {string} what goes between them when nothing is selected
 * @returns {WrapEdit} the edit
 */
export const wrap = (open: string, close: string, placeholder = "text"): WrapEdit => ({
  kind: "wrap",
  open,
  close,
  placeholder,
});

/**
 * @function insert
 * @param text {string} what replaces the selection
 * @returns {InsertEdit} the edit
 */
export const insert = (text: string): InsertEdit => ({ kind: "insert", text });

/**
 * @function planEdit
 * @param doc {string} the whole text
 * @param from {number} where the selection starts
 * @param to {number} where it ends (from when nothing is selected)
 * @param edit {TextEdit} what to do
 * @returns {EditPlan} the change and the selection after it: the wrapped text (or placeholder)
 *          stays selected; an unwrap removes the tags and keeps the inner text selected
 */
export const planEdit = (doc: string, from: number, to: number, edit: TextEdit): EditPlan => {
  if (edit.kind === "insert") {
    const end = from + edit.text.length;
    return { from, to, insert: edit.text, anchor: end, head: end };
  }
  const { open, close } = edit;
  const inner = doc.slice(from, to);
  const wrapped =
    from >= open.length &&
    doc.slice(from - open.length, from) === open &&
    doc.slice(to, to + close.length) === close;
  if (wrapped) {
    const start = from - open.length;
    return {
      from: start,
      to: to + close.length,
      insert: inner,
      anchor: start,
      head: start + inner.length,
    };
  }
  const body = inner === "" ? edit.placeholder : inner;
  const start = from + open.length;
  return { from, to, insert: `${open}${body}${close}`, anchor: start, head: start + body.length };
};
