/**
 * @file src/components/editor/TableTool.tsx
 * @desc The toolbar's table builder. osu! has no table tag, so the rows (pasted from a
 *       spreadsheet, a markdown table or CSV; src/utils/table.ts) are laid out in monospace with
 *       ASCII, line or no borders, previewed with their length, and inserted in [code]. Up to
 *       TABLE_MAX_ROWS rows and TABLE_MAX_COLUMNS columns.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import {
  Button,
  Checkbox,
  ChoiceChips,
  Notice,
  Surface,
  Textarea,
  textClasses,
} from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TABLE_MAX_COLUMNS, TABLE_MAX_ROWS } from "@/constants/editor";
import { countBbcode } from "@/lib/bbcode";
import { layoutTable, parseTable, type TableStyle } from "@/utils/table";
import { insert, type TextEdit } from "@/utils/text-edit";

type TableToolProps = {
  onEdit: (edit: TextEdit) => void;
};

const STYLES: readonly TableStyle[] = ["ascii", "unicode", "none"];

/**
 * @function TableTool
 * @param props {TableToolProps} the edit handler
 * @returns {JSX.Element} the rows field, border and header choices, the preview and Insert
 */
export function TableTool({ onEdit }: TableToolProps) {
  const t = useTranslations("bb.table");
  const [text, setText] = useState("");
  const [style, setStyle] = useState<TableStyle>("ascii");
  const [header, setHeader] = useState(true);
  const table = parseTable(text);
  const tooBig = table.rows.length > TABLE_MAX_ROWS || table.align.length > TABLE_MAX_COLUMNS;
  const empty = table.rows.length === 0;
  const block =
    empty || tooBig ? "" : `[code]\n${layoutTable(table, { style, header }).join("\n")}\n[/code]`;
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      <Textarea
        id="bb-table-rows"
        label={t("field")}
        hint={t("hint")}
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-sm"
      />
      <div className="flex flex-wrap items-end gap-4">
        <ChoiceChips
          label={t("style")}
          options={STYLES.map((value) => ({ value, label: t(`styles.${value}`) }))}
          value={style}
          onChange={setStyle}
        />
        <Checkbox
          id="bb-table-header"
          label={t("header")}
          checked={header}
          onChange={(event) => setHeader(event.target.checked)}
        />
      </div>
      {tooBig ? (
        <Notice tone="warning">
          {t("tooMany", { rows: TABLE_MAX_ROWS, columns: TABLE_MAX_COLUMNS })}
        </Notice>
      ) : null}
      {block ? (
        <figure aria-label={t("preview")} className="flex flex-col gap-1">
          <pre className="overflow-x-auto rounded-md bg-b6 p-3 font-mono text-c2 text-sm leading-tight">
            {block.slice("[code]\n".length, -"\n[/code]".length)}
          </pre>
          <figcaption className={textClasses({ tone: "muted", size: "xs" })}>
            {t("count", { count: countBbcode(block) })}
          </figcaption>
        </figure>
      ) : null}
      <div>
        <Button type="button" disabled={!block} onClick={() => onEdit(insert(block))}>
          {t("insert")}
        </Button>
      </div>
    </Surface>
  );
}
