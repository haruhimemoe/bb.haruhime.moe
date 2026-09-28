/**
 * @file tests/unit/lib/codemirror.test.ts
 * @desc The editor's BBCode pieces without a page: the stream language splits known tags into
 *       brackets, names and arguments (and leaves unknown ones as text), autocomplete offers
 *       TAGS after `[` and `[/`, and the package's diagnostics become CodeMirror ones with Fix.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { lint, TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it, vi } from "vitest";
import { completeTags } from "@/lib/codemirror/complete";
import { bbcodeLanguage } from "@/lib/codemirror/language";
import { toDiagnostic } from "@/lib/codemirror/lint";

const tokens = (text: string): string[] => {
  const out: string[] = [];
  bbcodeLanguage.parser.parse(text).iterate({
    enter: (node) => {
      if (node.type.name !== "Document" && node.from < node.to) {
        out.push(`${node.type.name}:${text.slice(node.from, node.to)}`);
      }
    },
  });
  return out;
};

const complete = (text: string) =>
  completeTags(new CompletionContext(EditorState.create({ doc: text }), text.length, true));

describe("the BBCode language", () => {
  it("splits known tags and marks placeholders", () => {
    expect(tokens("[color=#fff]hi {{name}}[/color]")).toEqual([
      "bracket:[",
      "tagName:color",
      "attributeValue:=#fff",
      "bracket:]",
      "variableName:{{name}}",
      "bracket:[/",
      "tagName:color",
      "bracket:]",
    ]);
  });

  it("leaves unknown, wrong-case and argument-carrying closing tags as text", () => {
    expect(tokens("[FC] [B]x [center] [/b=1]")).toEqual([]);
    expect(tokens("[*]")).toEqual(["bracket:[", "tagName:*", "bracket:]"]);
  });
});

describe("tag autocomplete", () => {
  it("offers every tag and alias after [", () => {
    const result = complete("x [");
    expect(result?.from).toBe(3);
    const labels = result?.options.map((option) => option.label);
    expect(labels).toEqual(TAGS.flatMap((tag) => [tag.name, ...tag.aliases]));
    const color = result?.options.find((option) => option.label === "color");
    expect(color?.info).toBe("Colored text: #rrggbb or a color name.");
    expect(color?.detail).toBe("needs =");
  });

  it("offers closing tags after [/, and nothing elsewhere", () => {
    const result = complete("[b]x[/b");
    expect(result?.from).toBe(6);
    expect(result?.options.find((option) => option.label === "b")?.apply).toBe("b]");
    expect(result?.options.some((option) => option.label === "*")).toBe(false);
    expect(complete("plain text")).toBeNull();
  });
});

describe("lint diagnostics", () => {
  it("keep the range, severity and message, with Fix when there is one", () => {
    const [found] = lint("[center]x[/centre]");
    if (!found) throw new Error("expected a diagnostic");
    const diagnostic = toDiagnostic(found);
    expect(diagnostic).toMatchObject({
      from: 0,
      to: 8,
      severity: "warning",
      source: "unknown-tag",
      message: found.message,
    });
    const dispatch = vi.fn();
    diagnostic.actions?.[0]?.apply({ dispatch } as never, 0, 8);
    expect(dispatch).toHaveBeenCalledWith({ changes: { from: 0, to: 8, insert: "[centre]" } });
    const [unclosed] = lint("[b]x");
    expect(unclosed && toDiagnostic(unclosed).actions).toEqual([]);
  });
});
