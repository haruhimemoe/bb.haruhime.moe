/**
 * @file src/components/editor/ArtTool.tsx
 * @desc The toolbar's Art tool: kaomoji by mood (a click inserts one inline and the tool stays
 *       open), a banner (text drawn in the block font, src/utils/banner.ts, inserted in [code]
 *       so it lines up) and a few small pieces, also in [code].
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Notice, Surface, Tabs, TextInput, tabId, tabPanelId } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ART_PIECES, KAOMOJI, KAOMOJI_GROUPS, type KaomojiGroup } from "@/constants/ascii";
import { BANNER_MAX_CHARS } from "@/constants/editor";
import { banner } from "@/utils/banner";
import { insert, type TextEdit } from "@/utils/text-edit";

type ArtToolProps = {
  onEdit: (edit: TextEdit) => void;
};

type Tab = "kaomoji" | "banner" | "pieces";

const TABS: readonly Tab[] = ["kaomoji", "banner", "pieces"];

const PRE = "overflow-x-auto rounded-md bg-b6 p-3 font-mono text-c2 text-sm leading-tight";

const codeBlock = (text: string): TextEdit => insert(`[code]\n${text}\n[/code]`);

/**
 * @function ArtTool
 * @param props {ArtToolProps} the edit handler
 * @returns {JSX.Element} the kaomoji, banner and pieces tabs
 */
export function ArtTool({ onEdit }: ArtToolProps) {
  const t = useTranslations("bb.art");
  const [tab, setTab] = useState<Tab>("kaomoji");
  const [mood, setMood] = useState<KaomojiGroup>("happy");
  const [text, setText] = useState("");
  const [inserted, setInserted] = useState("");
  const drawn = banner(text);
  const put = (edit: TextEdit, what: string) => {
    onEdit(edit);
    setInserted(t("inserted", { what }));
  };
  const panel = (id: string, value: string) => ({
    id: tabPanelId(id, value),
    role: "tabpanel",
    "aria-labelledby": tabId(id, value),
  });
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      <Tabs
        label={t("label")}
        idPrefix="bb-art"
        tabs={TABS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
        value={tab}
        onChange={setTab}
      />
      <div {...panel("bb-art", tab)} className="flex flex-col gap-3">
        {tab === "kaomoji" ? (
          <>
            <Tabs
              label={t("tabs.kaomoji")}
              idPrefix="bb-kaomoji"
              tabs={KAOMOJI_GROUPS.map((id) => ({ id, label: t(`kaomoji.${id}`) }))}
              value={mood}
              onChange={setMood}
            />
            <ul {...panel("bb-kaomoji", mood)} className="flex flex-wrap gap-1.5">
              {KAOMOJI[mood].map((face) => (
                <li key={face}>
                  <button
                    type="button"
                    onClick={() => put(insert(face), face)}
                    className="rounded-md bg-b5 px-2.5 py-1.5 text-c2 text-sm hover:bg-b3 hover:text-c1"
                  >
                    {face}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {tab === "banner" ? (
          <>
            <TextInput
              id="bb-art-banner"
              label={t("banner")}
              hint={t("bannerHint", { max: BANNER_MAX_CHARS })}
              value={text}
              maxLength={BANNER_MAX_CHARS}
              onChange={(event) => setText(event.target.value)}
              autoComplete="off"
            />
            {drawn.missing.length > 0 ? (
              <Notice tone="warning">{t("missing", { chars: drawn.missing.join(" ") })}</Notice>
            ) : null}
            {drawn.lines.length > 0 ? <pre className={PRE}>{drawn.lines.join("\n")}</pre> : null}
            <div>
              <Button
                type="button"
                disabled={drawn.lines.length === 0}
                onClick={() => put(codeBlock(drawn.lines.join("\n")), text.trim())}
              >
                {t("insertBanner")}
              </Button>
            </div>
          </>
        ) : null}
        {tab === "pieces" ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
            {ART_PIECES.map((piece) => {
              const name = t(`pieces.${piece.id}`);
              return (
                <li key={piece.id} className="flex flex-col gap-2">
                  <pre className={PRE}>{piece.art}</pre>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => put(codeBlock(piece.art), name)}
                  >
                    {t("insertPiece", { name })}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <Notice live>{inserted}</Notice>
    </Surface>
  );
}
