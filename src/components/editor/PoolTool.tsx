/**
 * @file src/components/editor/PoolTool.tsx
 * @desc The toolbar's pool import: a pools.haruhime.moe pool id or link, checked here first
 *       (past pools and junk are refused with a message), then GET /api/pools/<id>, and the
 *       mappool section is inserted: the pool's name as a heading, then each bucket in a box or
 *       under a heading, one line per slot with its map and stars under the bucket's mods.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, ChoiceChips, Notice, Surface, TextInput } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { POOL_LAYOUTS } from "@/constants/osu";
import { poolImportSchema } from "@/schemas/pool-import";
import { errorMessageOf } from "@/utils/api-client";
import { type PoolLayout, poolBbcode } from "@/utils/pool-import";
import { parsePoolRef } from "@/utils/pool-ref";
import { insert, type TextEdit } from "@/utils/text-edit";

type PoolToolProps = {
  onEdit: (edit: TextEdit) => void;
};

type Status = { tone: "info" | "warning" | "error"; text: string } | null;

/**
 * @function PoolTool
 * @param props {PoolToolProps} the edit handler
 * @returns {JSX.Element} the pool field, the layout choice, Import and its status
 */
export function PoolTool({ onEdit }: PoolToolProps) {
  const t = useTranslations("bb.pool");
  const [text, setText] = useState("");
  const [layout, setLayout] = useState<PoolLayout>("boxes");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ref = parsePoolRef(text);
    if (!ref.ok) {
      setStatus({ tone: "error", text: t(`ref.${ref.reason}`) });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/pools/${ref.id}`);
      if (!response.ok) {
        setStatus({ tone: "error", text: await errorMessageOf(response, t("failed")) });
        return;
      }
      const parsed = poolImportSchema.safeParse(
        ((await response.json()) as { pool?: unknown }).pool,
      );
      if (!parsed.success) {
        setStatus({ tone: "error", text: t("unreadable") });
        return;
      }
      onEdit(insert(poolBbcode(parsed.data, layout)));
      setStatus(
        parsed.data.complete
          ? { tone: "info", text: t("inserted", { name: parsed.data.name }) }
          : { tone: "warning", text: t("partial", { name: parsed.data.name }) },
      );
    } catch {
      setStatus({ tone: "error", text: t("offline") });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Surface as="form" aria-label={t("label")} onSubmit={run} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          id="bb-pool"
          label={t("field")}
          placeholder="https://pools.haruhime.moe/pools/b-abcd1234"
          value={text}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
          wrapperClassName="min-w-0 flex-1 basis-64"
        />
        <ChoiceChips
          label={t("layout")}
          options={POOL_LAYOUTS.map((option) => ({
            ...option,
            label: t(`layouts.${option.value}`),
          }))}
          value={layout}
          onChange={setLayout}
        />
      </div>
      <p className="text-c3 text-xs">{t("note")}</p>
      <div>
        <Button type="submit" disabled={busy || text.trim() === ""}>
          {busy ? t("importing") : t("import")}
        </Button>
      </div>
      <Notice tone={status?.tone ?? "info"} live>
        {status?.text ?? ""}
      </Notice>
    </Surface>
  );
}
