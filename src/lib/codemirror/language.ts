/**
 * @file src/lib/codemirror/language.ts
 * @desc A small CodeMirror stream language for osu! BBCode: a tag osu! knows (a name or alias in
 *       @haruhimemoe/bbcode's TAGS, lowercase) is split into its brackets, its name and its
 *       argument; `{{key}}` template placeholders stand out; everything else is text. It only
 *       colors; what pairs and what osu! refuses is the linter's job. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import {
  HighlightStyle,
  StreamLanguage,
  type StringStream,
  syntaxHighlighting,
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { TAGS } from "@haruhimemoe/bbcode";
import { tags } from "@lezer/highlight";

/** Every tag name osu! reads, aliases included. */
const NAMES = new Set(TAGS.flatMap((tag) => [tag.name, ...tag.aliases]));

/** An opening or closing tag at the stream's position: `[`, `/`, name, `=arg`, `]`. */
const TAG = /^\[(\/?)([a-z*]+)(=[^\]\n]*)?\]/;
const PLACEHOLDER = /^\{\{\s*[A-Za-z0-9_.-]+\s*\}\}/;

/** Where the tokenizer is inside a tag. */
type State = { part: "text" | "name" | "arg" | "end"; name: string; arg: boolean };

const token = (stream: StringStream, state: State): string | null => {
  if (state.part === "name") {
    stream.match(state.name);
    state.part = state.arg ? "arg" : "end";
    return "tagName";
  }
  if (state.part === "arg") {
    stream.match(/^=[^\]\n]*/);
    state.part = "end";
    return "attributeValue";
  }
  if (state.part === "end") {
    stream.next();
    state.part = "text";
    return "bracket";
  }
  const tag = stream.match(TAG, false);
  if (Array.isArray(tag) && NAMES.has(tag[2] ?? "") && !(tag[1] && tag[3])) {
    stream.match(tag[1] ? "[/" : "[");
    Object.assign(state, { part: "name", name: tag[2], arg: tag[3] !== undefined });
    return "bracket";
  }
  if (stream.match(PLACEHOLDER)) return "variableName";
  stream.next();
  // Stop before the next thing that could start a tag or a placeholder.
  stream.eatWhile(/[^[{]/);
  return null;
};

/** The BBCode stream language. */
export const bbcodeLanguage = StreamLanguage.define<State>({
  name: "bbcode",
  startState: () => ({ part: "text", name: "", arg: false }),
  copyState: (state) => ({ ...state }),
  token,
});

/** Colors for the language's tokens, on the editor's dark background. */
const style = HighlightStyle.define([
  { tag: tags.bracket, color: "#a59fb0" },
  { tag: tags.tagName, color: "#ff8ec6", fontWeight: "700" },
  { tag: tags.attributeValue, color: "#8fd3ff" },
  { tag: tags.variableName, color: "#ffd479", fontStyle: "italic" },
]);

/**
 * @function bbcode
 * @returns {Extension} the language and its highlighting
 */
export const bbcode = (): Extension => [bbcodeLanguage, syntaxHighlighting(style)];
