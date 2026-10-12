/**
 * @file src/components/editor/ToolPanel.tsx
 * @desc The open tool under the toolbar. Tools that make one thing (color, gradient, table)
 *       close once it's inserted (`done`); pickers and tools that report what they did (flag,
 *       emoji, art, players, pool, markdown, import, snippets, variables) stay open (`onEdit`). The emoji list loads
 *       with its panel only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import type { Loss } from "@haruhimemoe/bbcode/markdown";
import dynamic from "next/dynamic";
import { ArtTool } from "@/components/editor/ArtTool";
import { ColorTool } from "@/components/editor/ColorTool";
import { EditorSettingsTool } from "@/components/editor/EditorSettingsTool";
import { FlagPicker } from "@/components/editor/FlagPicker";
import { GradientTool } from "@/components/editor/GradientTool";
import { ImportTool } from "@/components/editor/ImportTool";
import { MarkdownTool } from "@/components/editor/MarkdownTool";
import { PlayersTool } from "@/components/editor/PlayersTool";
import { PoolTool } from "@/components/editor/PoolTool";
import { SnippetsTool } from "@/components/editor/SnippetsTool";
import { TableTool } from "@/components/editor/TableTool";
import { VariablesTool } from "@/components/editor/VariablesTool";
import type { Tool } from "@/constants/toolbar";
import type { EditorSettings } from "@/utils/editor-settings";
import type { TextEdit } from "@/utils/text-edit";
import type { DraftVars } from "@/utils/variables";

const EmojiTool = dynamic(() =>
  import("@/components/editor/EmojiTool").then((module) => module.EmojiTool),
);

type ToolPanelProps = {
  tool: Tool;
  /** Edits and keeps the tool open. */
  onEdit: (edit: TextEdit) => void;
  /** Edits and closes the tool. */
  done: (edit: TextEdit) => void;
  /** The selection when the tool opened. */
  selected: string;
  /** The selection now. */
  selection: () => string;
  document: () => string;
  onMarks: (lost: readonly Loss[]) => void;
  settings: EditorSettings;
  onSettings: (next: EditorSettings) => void;
  /** The draft's variable keys and values. */
  variables: { keys: readonly string[]; vars: DraftVars; onVars: (vars: DraftVars) => void };
};

/**
 * @function ToolPanel
 * @param props {ToolPanelProps} which tool, the edit handlers and what the tools read
 * @returns {JSX.Element} the tool's panel
 */
export function ToolPanel(props: ToolPanelProps) {
  const { tool, onEdit, done } = props;
  switch (tool) {
    case "color":
      return <ColorTool onEdit={done} />;
    case "gradient":
      return <GradientTool initialText={props.selected} onEdit={done} />;
    case "flag":
      return <FlagPicker onEdit={onEdit} />;
    case "emoji":
      return <EmojiTool onEdit={onEdit} />;
    case "table":
      return <TableTool onEdit={done} />;
    case "art":
      return <ArtTool onEdit={onEdit} />;
    case "players":
      return <PlayersTool onEdit={onEdit} />;
    case "pool":
      return <PoolTool onEdit={onEdit} />;
    case "markdown":
      return <MarkdownTool onEdit={onEdit} document={props.document} onMarks={props.onMarks} />;
    case "import":
      return <ImportTool onEdit={onEdit} document={props.document} />;
    case "snippets":
      return <SnippetsTool onEdit={onEdit} selection={props.selection} document={props.document} />;
    case "variables":
      return <VariablesTool {...props.variables} onEdit={onEdit} document={props.document} />;
    case "settings":
      return <EditorSettingsTool settings={props.settings} onChange={props.onSettings} />;
  }
}
