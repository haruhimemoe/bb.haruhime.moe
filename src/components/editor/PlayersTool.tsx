/**
 * @file src/components/editor/PlayersTool.tsx
 * @desc The toolbar's player list: paste osu! names, ids or profile links (one per line, 64 at
 *       most), pick a list style and a flag style (small PNG flags by default), and "Insert"
 *       looks them up (POST /api/osu/users) and writes one line per player: the flag and
 *       [profile=id]name[/profile], in the order given. Names osu! doesn't know are listed, not
 *       dropped; when none are found nothing is inserted.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import type { FlagStyle } from "@haruhimemoe/bbcode/flags";
import { Button, ChoiceChips, Surface, Textarea } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LookupReport } from "@/components/players/LookupReport";
import {
  MAX_PLAYER_NAMES,
  PLAYER_FLAG_STYLES,
  PLAYER_LIST_STYLES,
  type PlayerListStyle,
} from "@/constants/osu";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";
import { playerLines, playerListBbcode } from "@/utils/player-names";
import { insert, type TextEdit } from "@/utils/text-edit";

type PlayersToolProps = {
  onEdit: (edit: TextEdit) => void;
};

/**
 * @function PlayersTool
 * @param props {PlayersToolProps} the edit handler
 * @returns {JSX.Element} the names box, the style choices, Insert and the lookup's report
 */
export function PlayersTool({ onEdit }: PlayersToolProps) {
  const t = useTranslations("bb.players");
  const [text, setText] = useState("");
  const [style, setStyle] = useState<PlayerListStyle>("numbered");
  const [flags, setFlags] = useState<FlagStyle | "none">("legacy");
  const { busy, error, answer, lookup } = usePlayerLookup();
  const count = playerLines(text).length;
  const run = async () => {
    const found = await lookup(playerLines(text));
    if (found && found.users.length > 0)
      onEdit(insert(playerListBbcode(found.users, { style, flags })));
  };
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      <Textarea
        id="bb-players"
        label={t("names")}
        hint={t("count", { count, max: MAX_PLAYER_NAMES })}
        value={text}
        rows={5}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-sm"
      />
      <div className="flex flex-wrap gap-3">
        <ChoiceChips
          label={t("list")}
          options={PLAYER_LIST_STYLES.map((o) => ({ ...o, label: t(`listStyles.${o.value}`) }))}
          value={style}
          onChange={setStyle}
        />
        <ChoiceChips
          label={t("flags")}
          options={PLAYER_FLAG_STYLES.map((o) => ({ ...o, label: t(`flagStyles.${o.value}`) }))}
          value={flags}
          onChange={setFlags}
        />
      </div>
      <div>
        <Button disabled={busy || count === 0} onClick={run}>
          {busy ? t("lookingUp") : t("lookUp")}
        </Button>
      </div>
      <LookupReport answer={answer} error={error} />
    </Surface>
  );
}
