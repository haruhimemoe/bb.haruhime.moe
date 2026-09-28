/**
 * @file src/components/editor/SourceEditor.tsx
 * @desc The CodeMirror 6 source editor (src/lib/codemirror/setup.ts). It reports every change,
 *       takes a new `value` from outside (a draft switch, a template) without losing its own
 *       undo history for its own typing, and hands its host an EditorHandle for the toolbar and
 *       tools. Loaded with next/dynamic and ssr: false, so the page itself stays static.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { applyEdit, editorExtensions } from "@/lib/codemirror/setup";
import type { TextEdit } from "@/utils/text-edit";

/** What the toolbar and tools can do to the editor. */
export type EditorHandle = {
  /** Makes an edit on the current selection. */
  apply: (edit: TextEdit) => void;
  /** The selected text ("" when nothing is selected). */
  selection: () => string;
};

type SourceEditorProps = {
  value: string;
  onChange: (text: string) => void;
  /** Called once the editor exists, and with null when it goes away. */
  onReady: (handle: EditorHandle | null) => void;
  /** The editable area's accessible name. */
  label: string;
};

/**
 * @function SourceEditor
 * @param props {SourceEditorProps} the text, the change handler, the handle callback and label
 * @returns {JSX.Element} the element CodeMirror mounts into
 */
export function SourceEditor({ value, onChange, onReady, label }: SourceEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ onChange, value });
  latest.current = { onChange, value };
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: latest.current.value,
        extensions: editorExtensions({ label, onChange: (text) => latest.current.onChange(text) }),
      }),
    });
    view.current = editor;
    onReady({
      apply: (edit) => applyEdit(editor, edit),
      selection: () => {
        const { from, to } = editor.state.selection.main;
        return editor.state.sliceDoc(from, to);
      },
    });
    return () => {
      onReady(null);
      editor.destroy();
      view.current = null;
    };
  }, [label, onReady]);
  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);
  return <div ref={host} className="h-full min-h-[24rem]" data-testid="source-editor" />;
}
