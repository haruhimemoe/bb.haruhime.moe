/**
 * @file src/components/editor/SnippetsTool.tsx
 * @desc The toolbar's Snippets tool: your snippets and the public ones others share (templates
 *       of kind `snippet`, so each has history, forks and proposals on its template page). A
 *       click inserts one at the cursor, its `{{key}}`s ready for Variables; Copy file puts it
 *       on the clipboard as a `haruhime.snippet/1` file (or shows it to copy by hand when the
 *       clipboard refuses). Signed in, you can save the selection
 *       as a snippet or import a file (SnippetSaveForm).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Notice, Surface, Text, Textarea, textClasses } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SnippetSaveForm } from "@/components/editor/SnippetSaveForm";
import { useSnippets } from "@/hooks/useSnippets";
import type { SnippetItem } from "@/services/snippets";
import { toSnippetDoc } from "@/utils/snippet-format";
import { insert, type TextEdit } from "@/utils/text-edit";

type SnippetsToolProps = {
  onEdit: (edit: TextEdit) => void;
  /** The selection now (read when saving). */
  selection: () => string;
  /** The whole text, saved when nothing is selected. */
  document: () => string;
};

/**
 * @function SnippetsTool
 * @param props {SnippetsToolProps} the edit handler, the selection and the text
 * @returns {JSX.Element} the lists, and the save and import forms when signed in
 */
export function SnippetsTool({ onEdit, selection, document }: SnippetsToolProps) {
  const t = useTranslations("bb.snippets");
  const { lists, error, reload } = useSnippets();
  const [said, setSaid] = useState("");
  // The file to copy by hand when the clipboard refuses.
  const [fallback, setFallback] = useState<string | null>(null);
  const copy = async (snippet: SnippetItem) => {
    const doc = toSnippetDoc(snippet);
    try {
      await navigator.clipboard.writeText(doc);
      setFallback(null);
      setSaid(t("copied", { name: snippet.name }));
    } catch {
      setFallback(doc);
      setSaid(t("copyFailed"));
    }
  };
  const list = (title: string, items: readonly SnippetItem[], shared: boolean) => (
    <section className="flex flex-col gap-2">
      <h3 className="font-bold text-c2 text-sm">{title}</h3>
      {items.length === 0 ? <Text tone="muted">{t("none")}</Text> : null}
      <ul className="flex flex-col gap-1.5">
        {items.map((snippet) => (
          <li
            key={snippet.id}
            className="flex flex-wrap items-center gap-2 rounded-md bg-b5 px-2 py-1.5"
          >
            <span className="min-w-0 flex-1 truncate text-c1 text-sm">{snippet.name}</span>
            {shared ? (
              <span className={textClasses({ tone: "muted", size: "xs" })}>
                {t("by", { name: snippet.ownerName })}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              aria-label={t("insert", { name: snippet.name })}
              onClick={() => onEdit(insert(snippet.body))}
            >
              {t("insertButton")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label={t("copyNamed", { name: snippet.name })}
              onClick={() => void copy(snippet)}
            >
              {t("copy")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!lists && !error ? <Text tone="muted">{t("loading")}</Text> : null}
      {lists?.signedIn ? list(t("mine"), lists.mine, false) : null}
      {lists ? list(t("shared"), lists.shared, true) : null}
      {lists && !lists.signedIn ? <Text tone="muted">{t("signIn")}</Text> : null}
      {lists?.signedIn ? (
        <SnippetSaveForm
          text={() => {
            const selected = selection();
            return selected === "" ? document() : selected;
          }}
          onSaved={reload}
        />
      ) : null}
      <Notice live>{said}</Notice>
      {fallback !== null ? (
        <Textarea
          id="bb-snippet-copy"
          label={t("copyField")}
          value={fallback}
          readOnly
          rows={6}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-xs"
        />
      ) : null}
    </Surface>
  );
}
