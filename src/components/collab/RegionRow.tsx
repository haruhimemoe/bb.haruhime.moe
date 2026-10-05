/**
 * @file src/components/collab/RegionRow.tsx
 * @desc One region's row contents: its handle, number and box, Up and Down (SortableList's) and
 *       Delete, link and title (with the imagemap check's message under each). The row itself is
 *       SortableList's li.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { Button, TextInput } from "@haruhimemoe/ui";
import type { ReactNode } from "react";
import { LINK_HINT } from "@/constants/collab";
import type { CollabAction, CollabRegion } from "@/utils/collab";

type RegionRowProps = {
  region: CollabRegion;
  /** Its place in the list, from 1. */
  number: number;
  /** SortableList's handle and Up and Down buttons for this row. */
  handle: ReactNode;
  moveButtons: ReactNode;
  dispatch: (action: CollabAction) => void;
  /** The check's messages for this region's link and title. */
  errors: { href?: string | undefined; title?: string | undefined };
};

/**
 * @function RegionRow
 * @param props {RegionRowProps} the region, its place, its handle and move buttons, the dispatch
 *        and the check's messages
 * @returns {JSX.Element} the row's contents: handle, number and box, Up, Down and Delete, link
 *          and title
 */
export function RegionRow({
  region,
  number,
  handle,
  moveButtons,
  dispatch,
  errors,
}: RegionRowProps) {
  const field = (name: "href" | "title", value: string) =>
    dispatch({ type: "field", id: region.id, field: name, value });
  return (
    <>
      <div className="flex items-center gap-2">
        {handle}
        <div className="flex min-w-0 flex-col">
          <span className="whitespace-nowrap font-bold text-c1 text-sm">Region {number}</span>
          <span className="whitespace-nowrap font-mono text-c4 text-xs">
            {region.x} {region.y} {region.w} {region.h}
          </span>
        </div>
        <div className="ml-auto flex gap-1">
          {moveButtons}
          <Button
            variant="ghost"
            aria-label={`Delete region ${number}`}
            onClick={() => dispatch({ type: "remove", id: region.id })}
          >
            Delete
          </Button>
        </div>
      </div>
      <TextInput
        id={`region-${region.id}-href`}
        label="Link"
        value={region.href}
        hint={LINK_HINT}
        error={errors.href}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => field("href", event.target.value)}
      />
      <TextInput
        id={`region-${region.id}-title`}
        label="Title (shown on hover)"
        value={region.title}
        error={errors.title}
        autoComplete="off"
        onChange={(event) => field("title", event.target.value)}
      />
    </>
  );
}
