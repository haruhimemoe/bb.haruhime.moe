/**
 * @file src/components/editor/ImportTool.tsx
 * @desc The toolbar's import tool: an osu! forum link, profile link or username, checked here
 *       first, then GET /api/osu/import. The post or userpage shows with its source, its count
 *       and a preview, and Insert or Replace all (which asks first when the post has text) puts
 *       its BBCode in the editor. A failed fetch shows why and changes nothing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, ConfirmDialog, Notice, Surface, TextInput } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { countBbcode } from "@/lib/bbcode";
import { type ForumImportAnswer, forumImportSchema } from "@/schemas/forum-import";
import { errorMessageOf } from "@/utils/api-client";
import { parseImportRef } from "@/utils/import-ref";
import { insert, replaceAll, type TextEdit } from "@/utils/text-edit";

type ImportToolProps = {
  onEdit: (edit: TextEdit) => void;
  /** The editor's whole text. */
  document: () => string;
};

/**
 * @function ImportTool
 * @param props {ImportToolProps} the edit handler and the text reader
 * @returns {JSX.Element} the field, Fetch, and the fetched post with Insert and Replace all
 */
export function ImportTool({ onEdit, document }: ImportToolProps) {
  const t = useTranslations("bb.import");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<ForumImportAnswer | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fail = (message: string) => {
    setFound(null);
    setError(message);
  };
  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (parseImportRef(text).kind === "invalid") return fail(t("invalid"));
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/osu/import?ref=${encodeURIComponent(text.trim())}`);
      if (!response.ok) return fail(await errorMessageOf(response, t("failed")));
      const parsed = forumImportSchema.safeParse(await response.json());
      if (!parsed.success) return fail(t("unreadable"));
      setFound(parsed.data);
    } catch {
      fail(t("offline"));
    } finally {
      setBusy(false);
    }
  };
  const replace = () => {
    if (found) onEdit(replaceAll(found.bbcode));
  };
  return (
    <Surface as="form" aria-label={t("label")} onSubmit={run} className="flex flex-col gap-3">
      <TextInput
        id="bb-import"
        label={t("field")}
        placeholder="https://osu.ppy.sh/community/forums/topics/…"
        value={text}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
      />
      <p className="text-c3 text-xs">{t("note")}</p>
      <div>
        <Button type="submit" disabled={busy || text.trim() === ""}>
          {busy ? t("fetching") : t("fetch")}
        </Button>
      </div>
      <Notice tone="error" live>
        {error ?? ""}
      </Notice>
      {found ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <a href={found.source.url} target="_blank" rel="noreferrer" className="text-h1">
              {found.source.title}
            </a>{" "}
            <span className="text-c3">{t("chars", { count: countBbcode(found.bbcode) })}</span>
          </p>
          <div className="max-h-96 overflow-auto rounded-md">
            <BbPreview
              source={found.bbcode}
              target={found.source.kind === "post" ? "forum" : "userpage"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => onEdit(insert(found.bbcode))}>
              {t("insert")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => (document().trim() === "" ? replace() : setConfirming(true))}
            >
              {t("replace")}
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("confirmTitle")}
        description={t("confirmBody")}
        confirmLabel={t("confirm")}
        tone="destructive"
        onConfirm={replace}
      />
    </Surface>
  );
}
