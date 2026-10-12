/**
 * @file src/components/history/ChangeList.tsx
 * @desc One revision's changes (ChangeLines: text lines in a plain list, the body's change as a
 *       line diff) and a revert action under them. Server-safe.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

import { EmptyState, SectionHeading, Surface } from "@haruhimemoe/ui";
import type { RevisionMeta } from "@haruhimemoe/vcs";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ChangeLines } from "@/components/history/ChangeLines";
import { formatShortDate } from "@/utils/date";
import type { TemplateChangeLine } from "@/utils/template-changes";

type ChangeListProps = {
  revision: RevisionMeta;
  /** null for the root (nothing to compare against). */
  lines: TemplateChangeLine[] | null;
  action?: ReactNode;
};

/**
 * @function ChangeList
 * @param props {ChangeListProps} the revision, its change lines (null for the root), and an
 *        optional revert action
 * @returns {JSX.Element} the change view
 */
export function ChangeList({ revision, lines, action }: ChangeListProps) {
  const t = useTranslations("bb");
  const locale = useLocale();
  return (
    <Surface padding="md" className="flex flex-col gap-3">
      <SectionHeading level={3} detail={formatShortDate(revision.createdAt, locale)}>
        {t("history.inThisVersion")}
      </SectionHeading>
      {lines === null ? (
        <p>{t("history.first")}</p>
      ) : lines.length === 0 ? (
        <EmptyState size="sm">{t("history.empty")}</EmptyState>
      ) : (
        <ChangeLines lines={lines} />
      )}
      {action}
    </Surface>
  );
}
