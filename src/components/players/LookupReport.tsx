/**
 * @file src/components/players/LookupReport.tsx
 * @desc What a player lookup couldn't place, said out loud: the lines osu! has no user for, and
 *       the ones left unchecked because the osu! budget ran out. Nothing is dropped silently.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Notice } from "@haruhimemoe/ui";
import type { PlayerLookupAnswer } from "@/schemas/osu-users";

type LookupReportProps = {
  answer: PlayerLookupAnswer | null;
  error: string | null;
};

/**
 * @function LookupReport
 * @param props {LookupReportProps} the lookup's answer and error
 * @returns {JSX.Element} a live notice (empty when all went well)
 */
export function LookupReport({ answer, error }: LookupReportProps) {
  const notFound = answer?.notFound ?? [];
  const unchecked = answer?.unchecked ?? [];
  const bad = error !== null || notFound.length > 0 || unchecked.length > 0;
  return (
    <Notice tone={bad ? "warning" : "info"} live as="div">
      {error ? <p>{error}</p> : null}
      {answer && !bad ? <p>Found all {answer.users.length}.</p> : null}
      {notFound.length > 0 ? (
        <p>
          osu! has no user for {notFound.length === 1 ? "this line" : "these lines"}:{" "}
          <span className="font-mono">{notFound.join(", ")}</span>
        </p>
      ) : null}
      {unchecked.length > 0 ? (
        <p>
          Not looked up (bb's osu! lookups are used up for a minute), so left out:{" "}
          <span className="font-mono">{unchecked.join(", ")}</span>. Try them again shortly.
        </p>
      ) : null}
    </Notice>
  );
}
