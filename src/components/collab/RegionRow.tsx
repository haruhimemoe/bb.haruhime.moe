/**
 * @file src/components/collab/RegionRow.tsx
 * @desc One region in the collab maker's list: its number, link and title (with the imagemap
 *       check's message under each), and buttons to move it up or down the list or delete it.
 *       Focusing a row selects its region on the image.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, cx, TextInput } from "@haruhimemoe/ui";
import { LINK_HINT } from "@/constants/collab";
import type { CollabAction, CollabRegion } from "@/utils/collab";

type RegionRowProps = {
  region: CollabRegion;
  /** Its place in the list, from 1. */
  number: number;
  count: number;
  selected: boolean;
  dispatch: (action: CollabAction) => void;
  /** The check's messages for this region's link and title. */
  errors: { href?: string | undefined; title?: string | undefined };
};

/**
 * @function RegionRow
 * @param props {RegionRowProps} the region, its place, whether it's selected, the dispatch and
 *        the check's messages
 * @returns {JSX.Element} the row
 */
export function RegionRow({ region, number, count, selected, dispatch, errors }: RegionRowProps) {
  const field = (name: "href" | "title", value: string) =>
    dispatch({ type: "field", id: region.id, field: name, value });
  return (
    <li
      aria-label={`Region ${number}`}
      onFocusCapture={() => dispatch({ type: "select", id: region.id })}
      className={cx(
        "flex flex-col gap-2 rounded-md border-2 bg-b4 p-3",
        selected ? "border-h1" : "border-transparent",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-c1 text-sm">Region {number}</span>
        <span className="font-mono text-c4 text-xs">
          {region.x} {region.y} {region.w} {region.h}
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            aria-label={`Move region ${number} up`}
            disabled={number === 1}
            onClick={() => dispatch({ type: "reorder", id: region.id, by: -1 })}
          >
            Up
          </Button>
          <Button
            variant="ghost"
            aria-label={`Move region ${number} down`}
            disabled={number === count}
            onClick={() => dispatch({ type: "reorder", id: region.id, by: 1 })}
          >
            Down
          </Button>
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
    </li>
  );
}
