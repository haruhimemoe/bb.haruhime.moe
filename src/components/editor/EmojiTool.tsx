/**
 * @file src/components/editor/EmojiTool.tsx
 * @desc The toolbar's emoji picker: search by English words, or browse a group; the emoji used
 *       last come first. A click inserts the emoji at the cursor and leaves the picker open. osu!
 *       shows emoji as text in the reader's font, so the emoji itself is what goes in. The list
 *       (src/constants/emoji.ts) loads with this panel only (ToolPanel imports it dynamically).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Notice, Surface, Tabs, Text, TextInput, tabId, tabPanelId } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RECENT_EMOJI_KEY, RECENT_EMOJI_MAX } from "@/constants/editor";
import { EMOJI } from "@/constants/emoji";
import { EMOJI_GROUPS, type EmojiEntry, type EmojiGroup } from "@/constants/emoji-types";
import { searchEmoji } from "@/utils/emoji-search";
import { loadRecents, pushRecent, saveRecents } from "@/utils/recents";
import { insert, type TextEdit } from "@/utils/text-edit";

type EmojiToolProps = {
  onEdit: (edit: TextEdit) => void;
};

/** Every emoji's search words, for naming recent ones. */
const WORDS = new Map(Object.values(EMOJI).flatMap((group) => group.map(([e, w]) => [e, w])));

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1";

/**
 * @function EmojiTool
 * @param props {EmojiToolProps} the edit handler
 * @returns {JSX.Element} the search, the groups, recent emoji and the grid
 */
export function EmojiTool({ onEdit }: EmojiToolProps) {
  const t = useTranslations("bb.emoji");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<EmojiGroup>("smileys");
  const [recent, setRecent] = useState(() => loadRecents(RECENT_EMOJI_KEY, RECENT_EMOJI_MAX));
  const [inserted, setInserted] = useState("");
  const searching = query.trim() !== "";
  const shown = searching ? searchEmoji(query) : EMOJI[group];
  const pick = (emoji: string) => {
    onEdit(insert(emoji));
    const next = pushRecent(recent, emoji, RECENT_EMOJI_MAX);
    setRecent(next);
    saveRecents(RECENT_EMOJI_KEY, next);
    setInserted(t("inserted", { emoji }));
  };
  const grid = (entries: readonly EmojiEntry[], label?: string) => (
    <ul aria-label={label} className={GRID}>
      {entries.map(([emoji, words]) => (
        <li key={emoji}>
          <button
            type="button"
            aria-label={words.split(" ")[0]}
            title={words}
            onClick={() => pick(emoji)}
            className="coarse:h-11 h-10 w-full rounded-md bg-b5 text-xl hover:bg-b3"
          >
            {emoji}
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      <TextInput
        id="bb-emoji-search"
        label={t("search")}
        type="search"
        placeholder={t("placeholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {!searching && recent.length > 0
        ? grid(
            recent.map((emoji) => [emoji, WORDS.get(emoji) ?? emoji] as const),
            t("recent"),
          )
        : null}
      {searching ? null : (
        <Tabs
          label={t("label")}
          idPrefix="bb-emoji"
          tabs={EMOJI_GROUPS.map((id) => ({ id, label: t(`groups.${id}`) }))}
          value={group}
          onChange={setGroup}
        />
      )}
      {searching && shown.length === 0 ? (
        <Text tone="muted">{t("none", { query: query.trim() })}</Text>
      ) : null}
      {searching ? (
        <div className="max-h-64 overflow-y-auto">{grid(shown)}</div>
      ) : (
        <div
          id={tabPanelId("bb-emoji", group)}
          role="tabpanel"
          aria-labelledby={tabId("bb-emoji", group)}
          className="max-h-64 overflow-y-auto"
        >
          {grid(shown)}
        </div>
      )}
      <Notice live>{inserted}</Notice>
    </Surface>
  );
}
