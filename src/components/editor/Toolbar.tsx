/**
 * @file src/components/editor/Toolbar.tsx
 * @desc The editor's toolbar: one button per TOOLBAR_GROUPS entry (its tooltip is the tag's
 *       description from @haruhimemoe/bbcode's TAGS, plus its shortcut) and the size menu, then
 *       the tools in labelled groups (TOOL_GROUPS: Insert, Bring in, Editor), which open one at a
 *       time in a panel under the buttons (ToolPanel). Every button edits the current selection
 *       through `onEdit`.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { findTag } from "@haruhimemoe/bbcode";
import type { Loss } from "@haruhimemoe/bbcode/markdown";
import { cx } from "@haruhimemoe/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ToolPanel } from "@/components/editor/ToolPanel";
import {
  SIZE_PRESETS,
  sizeEdit,
  TOOL_GROUPS,
  TOOLBAR_GROUPS,
  type Tool,
  type ToolbarItem,
} from "@/constants/toolbar";
import { tagDescription } from "@/utils/docs";
import { DEFAULT_EDITOR_SETTINGS, type EditorSettings } from "@/utils/editor-settings";
import type { TextEdit } from "@/utils/text-edit";
import type { DraftVars } from "@/utils/variables";

type ToolbarProps = {
  onEdit: (edit: TextEdit) => void;
  /** The selected text, read when a tool opens. */
  selection: () => string;
  /** The whole text, read by Copy as markdown. */
  document?: () => string;
  /** Marks Copy as markdown's losses in the editor. */
  onMarks?: (lost: readonly Loss[]) => void;
  /** The editor's settings, for the Settings panel. */
  settings?: EditorSettings;
  onSettings?: (next: EditorSettings) => void;
  /** The draft's variable keys and values, for the Variables panel. */
  variables?: { keys: readonly string[]; vars: DraftVars; onVars: (vars: DraftVars) => void };
  disabled?: boolean;
};

const NO_VARIABLES = { keys: [], vars: {}, onVars: () => {} };

const BUTTON =
  "h-8 min-w-8 rounded-md bg-b4 px-2.5 text-c2 coarse:h-11 coarse:min-w-11 text-sm transition-colors hover:bg-b3 hover:text-c1 disabled:opacity-50";

const GLYPH_STYLE: Readonly<Record<string, string>> = {
  bold: "font-extrabold",
  italic: "italic",
  underline: "underline",
  strike: "line-through",
  "inline-code": "font-mono",
};

const titleOf = (
  item: ToolbarItem,
  t: ReturnType<typeof useTranslations>,
  english: boolean,
): string => {
  const tag = findTag(item.tag);
  // The tag docs are English; in another language the button's own name says it.
  const about = tag && english ? tagDescription(tag) : t(`items.${item.id}`);
  const key = item.shortcut?.replace("Mod-", "").toUpperCase();
  return key ? t("shortcut", { about, key }) : about;
};

/**
 * @function Toolbar
 * @param props {ToolbarProps} the edit handler, the selection reader and whether it's off
 * @returns {JSX.Element} the buttons, the size menu, the tool groups and the open tool
 */
export function Toolbar({
  onEdit,
  selection,
  document = () => "",
  onMarks = () => {},
  settings = DEFAULT_EDITOR_SETTINGS,
  onSettings = () => {},
  variables = NO_VARIABLES,
  disabled = false,
}: ToolbarProps) {
  const t = useTranslations("bb.toolbar");
  const english = useLocale() === "en";
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
        <legend className="sr-only">{t("formatting")}</legend>
        {TOOLBAR_GROUPS.map((group) => (
          <div key={group[0]?.id} className="flex flex-wrap gap-1">
            {group.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={t(`items.${item.id}`)}
                title={titleOf(item, t, english)}
                disabled={disabled}
                onClick={() => onEdit(item.edit)}
                className={cx(BUTTON, GLYPH_STYLE[item.id])}
              >
                {item.glyph}
              </button>
            ))}
          </div>
        ))}
        <select
          aria-label={t("size")}
          value=""
          disabled={disabled}
          onChange={(event) => onEdit(sizeEdit(Number(event.target.value)))}
          className={cx(BUTTON, "pr-1")}
        >
          <option value="" disabled>
            {t("size")}
          </option>
          {SIZE_PRESETS.map((size) => (
            <option key={size} value={size}>
              {size}%
            </option>
          ))}
        </select>
      </fieldset>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {TOOL_GROUPS.map((group) => (
          <fieldset key={group.id} className="flex min-w-0 flex-wrap items-center gap-1">
            <legend className="sr-only">{t(`groups.${group.id}`)}</legend>
            <span aria-hidden="true" className="mr-1 text-c4 text-xs">
              {t(`groups.${group.id}`)}
            </span>
            {group.tools.map((id) => (
              <button
                key={id}
                type="button"
                aria-expanded={tool === id}
                aria-controls="bb-tool-panel"
                disabled={disabled}
                onClick={() => toggle(id)}
                className={cx(BUTTON, tool === id && "bg-h2 text-c1 hover:bg-h2")}
              >
                {t(`tools.${id}`)}
              </button>
            ))}
          </fieldset>
        ))}
      </div>
      <div id="bb-tool-panel" hidden={tool === null}>
        {tool ? (
          <ToolPanel
            tool={tool}
            onEdit={onEdit}
            done={done}
            selected={selected}
            selection={selection}
            document={document}
            onMarks={onMarks}
            settings={settings}
            onSettings={onSettings}
            variables={variables}
          />
        ) : null}
      </div>
    </div>
  );
}
