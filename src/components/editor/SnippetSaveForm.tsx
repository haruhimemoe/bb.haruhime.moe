/**
 * @file src/components/editor/SnippetSaveForm.tsx
 * @desc The Snippets tool's saving side: save the selection (or the whole draft when nothing is
 *       selected) as a private snippet under a name, or import a `haruhime.snippet/1` file
 *       (src/utils/snippet-format.ts). Both POST /api/templates as kind `snippet`, then reload
 *       the lists.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Notice, Textarea, TextInput, textClasses } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { NAME_MAX, NAME_MIN } from "@/constants/templates";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { parseSnippetDoc, type Snippet } from "@/utils/snippet-format";

type SnippetSaveFormProps = {
  /** What's saved: the selection, or the whole draft. */
  text: () => string;
  /** Called after a snippet is saved or imported. */
  onSaved: () => void;
};

/**
 * @function SnippetSaveForm
 * @param props {SnippetSaveFormProps} the text to save and the saved callback
 * @returns {JSX.Element} the save and import forms
 */
export function SnippetSaveForm({ text, onSaved }: SnippetSaveFormProps) {
  const t = useTranslations("bb.snippets");
  const [name, setName] = useState("");
  const [file, setFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const create = async (snippet: Snippet, done: string) => {
    setBusy(true);
    try {
      const response = await sendJson("/api/templates", "POST", {
        ...snippet,
        kind: "snippet",
        visibility: "private",
      });
      if (response.ok) {
        setSaid({ tone: "info", text: done });
        setName("");
        onSaved();
      } else {
        const message = await errorMessageOf(response, t("failed", { status: response.status }));
        setSaid({ tone: "error", text: message });
      }
    } catch {
      setSaid({ tone: "error", text: t("offline") });
    }
    setBusy(false);
  };
  const save = () =>
    create(
      { name: name.trim(), description: "", body: text(), fields: [] },
      t("save.saved", { name: name.trim() }),
    );
  const load = () => {
    const parsed = parseSnippetDoc(file);
    if (!parsed.ok) return setSaid({ tone: "error", text: t("import.bad") });
    void create(parsed.value, t("import.imported", { name: parsed.value.name }));
  };
  return (
    <div className="flex flex-col gap-3 border-b4 border-t pt-3">
      <h3 className="font-bold text-c2 text-sm">{t("save.title")}</h3>
      <p className={textClasses({ tone: "muted", size: "xs" })}>{t("save.hint")}</p>
      <div className="flex flex-wrap items-end gap-2">
        <TextInput
          id="bb-snippet-name"
          label={t("save.name")}
          hint={t("save.nameHint")}
          value={name}
          maxLength={NAME_MAX}
          onChange={(event) => setName(event.target.value)}
        />
        <Button
          type="button"
          disabled={busy || name.trim().length < NAME_MIN}
          onClick={() => void save()}
        >
          {t("save.button")}
        </Button>
      </div>
      <h3 className="font-bold text-c2 text-sm">{t("import.title")}</h3>
      <Textarea
        id="bb-snippet-file"
        label={t("import.field")}
        value={file}
        rows={4}
        spellCheck={false}
        onChange={(event) => setFile(event.target.value)}
        className="font-mono text-xs"
      />
      <div>
        <Button type="button" variant="secondary" disabled={busy || !file.trim()} onClick={load}>
          {t("import.button")}
        </Button>
      </div>
      <Notice tone={said?.tone ?? "info"} live>
        {said?.text ?? ""}
      </Notice>
    </div>
  );
}
