/**
 * @file src/components/editor/Toolbar.tsx
 * @desc The editor's toolbar: one button per TOOLBAR_GROUPS entry (its tooltip is the tag's
 *       description from @haruhimemoe/bbcode's TAGS, plus its shortcut), the size menu, and the
 *       color, gradient and flag tools, which open one at a time in a panel under the buttons.
 *       Every button edits the current selection through `onEdit`.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { findTag } from "@haruhimemoe/bbcode";
import { cx } from "@haruhimemoe/ui";
import { useState } from "react";
import { ColorTool } from "@/components/editor/ColorTool";
import { FlagPicker } from "@/components/editor/FlagPicker";
import { GradientTool } from "@/components/editor/GradientTool";
import { SIZE_PRESETS, sizeEdit, TOOLBAR_GROUPS, type ToolbarItem } from "@/constants/toolbar";
import type { TextEdit } from "@/utils/text-edit";

type ToolbarProps = {
  onEdit: (edit: TextEdit) => void;
  /** The selected text, read when a tool opens. */
  selection: () => string;
  disabled?: boolean;
};

type Tool = "color" | "gradient" | "flag";

const TOOLS: readonly { id: Tool; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "gradient", label: "Gradient" },
  { id: "flag", label: "Flag" },
];

const BUTTON =
  "h-8 rounded-md bg-b4 px-2.5 text-c2 text-sm transition-colors hover:bg-b3 hover:text-c1 disabled:opacity-50";

const GLYPH_STYLE: Readonly<Record<string, string>> = {
  bold: "font-extrabold",
  italic: "italic",
  underline: "underline",
  strike: "line-through",
  "inline-code": "font-mono",
};

const titleOf = (item: ToolbarItem): string => {
  const about = findTag(item.tag)?.description ?? item.label;
  const key = item.shortcut?.replace("Mod-", "").toUpperCase();
  return key ? `${about} (Ctrl+${key} or Cmd+${key})` : about;
};

/**
 * @function Toolbar
 * @param props {ToolbarProps} the edit handler, the selection reader and whether it's off
 * @returns {JSX.Element} the buttons, the size menu, the tool toggles and the open tool
 */
export function Toolbar({ onEdit, selection, disabled = false }: ToolbarProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [selected, setSelected] = useState("");
  const toggle = (id: Tool) => {
    setSelected(selection());
    setTool((open) => (open === id ? null : id));
  };
  const done = (edit: TextEdit) => {
    onEdit(edit);
    setTool(null);
  };
  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <legend className="sr-only">Formatting</legend>
        {TOOLBAR_GROUPS.map((group) => (
          <div key={group[0]?.id} className="flex flex-wrap gap-1">
            {group.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                title={titleOf(item)}
                disabled={disabled}
                onClick={() => onEdit(item.edit)}
                className={cx(BUTTON, GLYPH_STYLE[item.id])}
              >
                {item.glyph}
              </button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-1">
          <select
            aria-label="Size"
            value=""
            disabled={disabled}
            onChange={(event) => onEdit(sizeEdit(Number(event.target.value)))}
            className={cx(BUTTON, "pr-1")}
          >
            <option value="" disabled>
              Size
            </option>
            {SIZE_PRESETS.map((size) => (
              <option key={size} value={size}>
                {size}%
              </option>
            ))}
          </select>
          {TOOLS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-expanded={tool === id}
              aria-controls="bb-tool-panel"
              disabled={disabled}
              onClick={() => toggle(id)}
              className={cx(BUTTON, tool === id && "bg-h2 text-c1 hover:bg-h2")}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div id="bb-tool-panel" hidden={tool === null}>
        {tool === "color" ? <ColorTool onEdit={done} /> : null}
        {tool === "gradient" ? <GradientTool initialText={selected} onEdit={done} /> : null}
        {tool === "flag" ? <FlagPicker onEdit={done} /> : null}
      </div>
    </div>
  );
}
