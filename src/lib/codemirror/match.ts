/**
 * @file src/lib/codemirror/match.ts
 * @desc Matching-tag highlight: when the cursor touches a tag osu! pairs, both the opening and
 *       the closing tag get the `cm-bb-match` mark. The text is parsed with @haruhimemoe/bbcode
 *       once per change; moving the cursor reuses that tree. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { type Extension, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { type Document, parse } from "@haruhimemoe/bbcode";
import { matchingTags } from "@/utils/tag-match";

const mark = Decoration.mark({ class: "cm-bb-match" });

/** The parsed text, kept until the text changes. */
const tree = StateField.define<Document>({
  create: (state) => parse(state.doc.toString()),
  update: (value, tr) => (tr.docChanged ? parse(tr.state.doc.toString()) : value),
});

/** The marks on the pair the cursor is on. */
const marks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, tr) => {
    if (!tr.docChanged && !tr.selection) return value;
    const { main } = tr.state.selection;
    if (!main.empty) return Decoration.none;
    const spans = matchingTags(tr.state.field(tree).children, main.head);
    return Decoration.set(spans.map((span) => mark.range(span.from, span.to)));
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * @function tagMatching
 * @returns {Extension} the parsed tree and the matching-tag marks
 */
export const tagMatching = (): Extension => [tree, marks];
