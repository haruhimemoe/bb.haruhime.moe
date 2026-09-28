/**
 * @file src/components/collab/PlayerLinks.tsx
 * @desc The collab maker's player lookup: paste osu! names or ids in the order the regions were
 *       drawn, and each region in turn gets that player's profile link and name as its title
 *       (the same lookup as the editor's Players tool). Unknown names are listed and skipped, so
 *       the next player moves up a region; the report says so.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { userUrl } from "@haruhimemoe/osu/shapes";
import { Button, Disclosure, Textarea } from "@haruhimemoe/ui";
import { useState } from "react";
import { LookupReport } from "@/components/players/LookupReport";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";
import type { RegionLink } from "@/utils/collab";
import { playerLines } from "@/utils/player-names";

type PlayerLinksProps = {
  regionCount: number;
  onLinks: (links: RegionLink[]) => void;
};

/**
 * @function PlayerLinks
 * @param props {PlayerLinksProps} how many regions there are and what to do with the links
 * @returns {JSX.Element} a disclosure with the names box, its button and the report
 */
export function PlayerLinks({ regionCount, onLinks }: PlayerLinksProps) {
  const [text, setText] = useState("");
  const { busy, error, answer, lookup } = usePlayerLookup();
  const count = playerLines(text).length;
  const run = async () => {
    const found = await lookup(playerLines(text));
    if (!found) return;
    onLinks(found.users.map((user) => ({ href: userUrl(user.id), title: user.username })));
  };
  return (
    <Disclosure summary="Link players to regions" panelClassName="flex flex-col gap-2 pt-2">
      <Textarea
        id="collab-players"
        label="osu! names or ids, one per line, in region order"
        hint={`Region 1 gets the first player found, region 2 the next. ${count} names for ${regionCount} regions.`}
        value={text}
        rows={5}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-sm"
      />
      <div>
        <Button
          variant="secondary"
          disabled={busy || count === 0 || regionCount === 0}
          onClick={run}
        >
          {busy ? "Looking up..." : "Link players"}
        </Button>
      </div>
      <LookupReport answer={answer} error={error} />
    </Disclosure>
  );
}
