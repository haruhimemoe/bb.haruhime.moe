/**
 * @file src/components/players/LookupReport.tsx
 * @desc What a player lookup couldn't place, said out loud: the lines osu! has no user for, and
 *       the ones left unchecked because the osu! budget ran out. Nothing is dropped silently.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { Notice } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("bb.lookup");
  const notFound = answer?.notFound ?? [];
  const unchecked = answer?.unchecked ?? [];
  const bad = error !== null || notFound.length > 0 || unchecked.length > 0;
  return (
    <Notice tone={bad ? "warning" : "info"} live as="div">
      {error ? <p>{error}</p> : null}
      {answer && !bad ? <p>{t("foundAll", { count: answer.users.length })}</p> : null}
      {notFound.length > 0 ? (
        <p>
          {t.rich("notFound", {
            count: notFound.length,
            names: () => <span className="font-mono">{notFound.join(", ")}</span>,
          })}
        </p>
      ) : null}
      {unchecked.length > 0 ? (
        <p>
          {t.rich("unchecked", {
            names: () => <span className="font-mono">{unchecked.join(", ")}</span>,
          })}
        </p>
      ) : null}
    </Notice>
  );
}
