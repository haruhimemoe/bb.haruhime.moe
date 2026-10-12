/**
 * @file tests/unit/lib/codemirror-typing.test.ts
 * @desc Typing in the editor, on an EditorState (the unit project has no page): `]` closes the
 *       tag it opens and types through an auto-closed tag, Enter splits a block pair and carries
 *       list items on, the settings turn both off, and `[/` offers the innermost open tag first.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { CompletionContext } from "@codemirror/autocomplete";
import { EditorSelection, EditorState, type TransactionSpec } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { completeTags } from "@/lib/codemirror/complete";
import { enterSpec, typedSpec } from "@/lib/codemirror/typing";

const ON = { autoClose: true, listContinue: true };
const OFF = { autoClose: false, listContinue: false };

/** The text with `|` as the cursor. */
const at = (marked: string): EditorState => {
  const cursor = marked.indexOf("|");
  return EditorState.create({
    doc: marked.replace("|", ""),
    selection: EditorSelection.cursor(cursor),
  });
};

const show = (state: EditorState, spec: TransactionSpec | null): string | null => {
  if (!spec) return null;
  const next = state.update(spec).state;
  const head = next.selection.main.head;
  const text = next.doc.toString();
  return `${text.slice(0, head)}|${text.slice(head)}`;
};

const type = (marked: string, text: string, options = ON) => {
  const state = at(marked);
  const { from, to } = state.selection.main;
  return show(state, typedSpec(state, from, to, text, options));
};

const enter = (marked: string, options = ON) => {
  const state = at(marked);
  return show(state, enterSpec(state, options));
};

describe("typing ]", () => {
  it("closes the tag it opens", () => {
    expect(type("x [color=#ff66aa|", "]")).toBe("x [color=#ff66aa]|[/color]");
    expect(type("[box=Title|", "]")).toBe("[box=Title]|[/box]");
  });

  it("types through the closing tag it added", () => {
    expect(type("[b]x[/b|[/b]", "]")).toBe("[b]x[/b]|");
  });

  it("leaves list items, unknown tags and closed pairs alone", () => {
    expect(type("[*|", "]")).toBeNull();
    expect(type("[font|", "]")).toBeNull();
    expect(type("[b|[/b]", "]")).toBeNull();
    expect(type("x|", "a")).toBeNull();
  });

  it("does nothing when auto-close is off", () => {
    expect(type("[b|", "]", OFF)).toBeNull();
    expect(type("[b]x[/b|[/b]", "]", OFF)).toBeNull();
  });
});

describe("Enter", () => {
  it("splits a block tag pair around an empty line", () => {
    expect(enter("[box=Title]|[/box]")).toBe("[box=Title]\n|\n[/box]");
    expect(enter("  [centre]|[/centre]")).toBe("  [centre]\n  |\n  [/centre]");
  });

  it("continues a list item and leaves the list from an empty one", () => {
    expect(enter("[list]\n[*] one|")).toBe("[list]\n[*] one\n[*] |");
    expect(enter("[list]\n[*] one\n[*] |")).toBe("[list]\n[*] one\n|");
  });

  it("is a plain newline everywhere else, and with list continuation off", () => {
    expect(enter("[b]|[/b]")).toBeNull();
    expect(enter("[*] one| two")).toBeNull();
    expect(enter("[*] one|", OFF)).toBeNull();
    expect(enter("plain|")).toBeNull();
  });

  it("leaves a selection to the default Enter", () => {
    const state = EditorState.create({
      doc: "[box=a][/box]",
      selection: EditorSelection.range(0, 7),
    });
    expect(enterSpec(state, ON)).toBeNull();
  });
});

describe("closing-tag autocomplete", () => {
  it("puts the innermost open tag first", () => {
    const text = "[b][i]x[/";
    const state = EditorState.create({ doc: text });
    const result = completeTags(new CompletionContext(state, text.length, true));
    const best = result?.options.find((option) => option.boost);
    expect(best?.label).toBe("i");
  });
});
