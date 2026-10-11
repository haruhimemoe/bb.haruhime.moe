/**
 * @file src/components/editor/DraftsBar.tsx
 * @desc The editor's drafts: a menu to switch between them, New, Rename (an inline name field)
 *       and Delete (confirmed in place), and whether this browser is saving them.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, InlineConfirm, Select, TextInput } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DRAFT_NAME_MAX, MAX_DRAFTS } from "@/constants/editor";
import type { DraftsState } from "@/hooks/useDrafts";
import { oldestDraft } from "@/utils/drafts";

type DraftsBarProps = {
  drafts: DraftsState;
};

/**
 * @function DraftsBar
 * @param props {DraftsBarProps} the drafts and their actions (from useDrafts)
 * @returns {JSX.Element} the draft menu, its buttons and the save state
 */
export function DraftsBar({ drafts }: DraftsBarProps) {
  const t = useTranslations("bb.drafts");
  const ui = useTranslations("ui");
  const { store, active, saved } = drafts;
  const [renaming, setRenaming] = useState<string | null>(null);
  if (!store || !active) return <p className="text-c4 text-sm">{t("opening")}</p>;
  const oldest = oldestDraft(store);
  const saveName = () => {
    if (renaming !== null) drafts.rename(active.id, renaming);
    setRenaming(null);
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      {renaming === null ? (
        <Select
          id="bb-draft"
          label={t("draft")}
          value={active.id}
          onChange={(event) => drafts.select(event.target.value)}
          wrapperClassName="min-w-48"
        >
          {store.drafts.map((draft) => (
            <option key={draft.id} value={draft.id}>
              {draft.name}
            </option>
          ))}
        </Select>
      ) : (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveName();
          }}
        >
          <TextInput
            id="bb-draft-name"
            label={t("name")}
            value={renaming}
            maxLength={DRAFT_NAME_MAX}
            onChange={(event) => setRenaming(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRenaming(null);
            }}
            autoFocus
          />
          <Button type="submit">{t("saveName")}</Button>
        </form>
      )}
      <Button variant="secondary" onClick={drafts.create}>
        {t("new")}
      </Button>
      {renaming === null ? (
        <Button variant="secondary" onClick={() => setRenaming(active.name)}>
          {t("rename")}
        </Button>
      ) : null}
      <InlineConfirm
        trigger={t("delete")}
        question={t("deleteQuestion", { name: active.name })}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={ui("actions.cancel")}
        confirmVariant="danger"
        onConfirm={() => drafts.remove(active.id)}
      />
      <p className="ml-auto self-center text-c4 text-xs" role="status">
        {saved ? t("saved") : t("notSaved")}
        {oldest ? (
          <span className="block">{t("full", { max: MAX_DRAFTS, name: oldest.name })}</span>
        ) : null}
      </p>
    </div>
  );
}
