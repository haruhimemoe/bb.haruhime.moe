/**
 * @file src/lib/codemirror/theme.ts
 * @desc The editor's look on the site's dark osu!-web palette (the ui theme's CSS variables):
 *       monospace text, a quiet gutter, the matching-tag mark, and tooltips and panels (lint,
 *       autocomplete, search) that match the rest of the page. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/** The editor theme. */
export const editorTheme: Extension = EditorView.theme(
  {
    "&": {
      color: "var(--color-c2)",
      backgroundColor: "var(--color-b6)",
      borderRadius: "6px",
      fontSize: "14px",
      height: "100%",
    },
    "&.cm-focused": { outline: "2px solid var(--color-h1)", outlineOffset: "2px" },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      lineHeight: "1.55",
    },
    ".cm-content": { caretColor: "var(--color-h1)", padding: "8px 0" },
    ".cm-cursor": { borderLeftColor: "var(--color-h1)" },
    ".cm-gutters": {
      backgroundColor: "var(--color-b6)",
      color: "var(--color-c4)",
      border: "none",
    },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgb(255 255 255 / 0.04)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "rgb(160 120 255 / 0.35)",
    },
    ".cm-bb-match": {
      backgroundColor: "rgb(255 142 198 / 0.18)",
      outline: "1px solid rgb(255 142 198 / 0.5)",
      borderRadius: "2px",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--color-b4)",
      color: "var(--color-c2)",
      border: "1px solid var(--color-b2)",
      borderRadius: "6px",
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "var(--color-h2)",
      color: "var(--color-c1)",
    },
    ".cm-completionInfo": { maxWidth: "20rem" },
    ".cm-diagnostic": { padding: "4px 8px" },
    ".cm-diagnosticAction": {
      backgroundColor: "var(--color-h2)",
      color: "var(--color-c1)",
      borderRadius: "999px",
      padding: "0 10px",
    },
    ".cm-panels": { backgroundColor: "var(--color-b4)", color: "var(--color-c2)" },
    ".cm-panels input, .cm-panels button": { color: "inherit" },
    ".cm-placeholder": { color: "var(--color-c4)" },
  },
  { dark: true },
);
