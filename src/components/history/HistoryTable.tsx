/**
 * @file src/components/history/HistoryTable.tsx
 * @desc A template's versions: when, who, and what kind of save, each linking that revision's
 *       changes. The row for the revision being shown is marked current. An "Older versions" row
 *       appears when the page is full. Server-safe.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { LinkRow, Table, TBody, Td, TextLink, THead, Th } from "@haruhimemoe/ui";
import type { RevisionMeta } from "@haruhimemoe/vcs";
import { REVISION_LABELS } from "@/constants/history";
import { formatShortDate } from "@/utils/date";

type HistoryTableProps = {
  /** The template id, for building each revision's link. */
  templateId: string;
  revisions: readonly RevisionMeta[];
  /** The revision currently shown (if any). */
  selected?: string | undefined;
  /** The last seq on a full page, for an "Older versions" link. */
  older: number | null;
};

/**
 * @function HistoryTable
 * @param props {HistoryTableProps} the template id, the page of revisions, the selected one, and
 *        an older-page cursor
 * @returns {JSX.Element} the versions table, with an older-versions link when there's more
 */
export function HistoryTable({ templateId, revisions, selected, older }: HistoryTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <Table caption="Versions">
        <THead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>What</Th>
            <Th>
              <span className="sr-only">Changes</span>
            </Th>
          </tr>
        </THead>
        <TBody>
          {revisions.map((revision) => {
            const current = revision.id === selected;
            return (
              <tr key={revision.id}>
                <Td>{formatShortDate(revision.createdAt)}</Td>
                <Td>{revision.authorName}</Td>
                <Td>
                  {REVISION_LABELS[revision.kind]}
                  {revision.message ? ` · ${revision.message}` : ""}
                </Td>
                <Td>
                  <TextLink
                    href={`/t/${templateId}/history?rev=${revision.id}`}
                    aria-current={current ? "true" : undefined}
                  >
                    Changes
                  </TextLink>
                </Td>
              </tr>
            );
          })}
        </TBody>
      </Table>
      {older !== null ? (
        <LinkRow
          items={[{ href: `/t/${templateId}/history?before=${older}`, label: "Older versions" }]}
        />
      ) : null}
    </div>
  );
}
