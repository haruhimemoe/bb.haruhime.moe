/**
 * @file src/components/collab/RegionList.tsx
 * @desc The collab maker's regions in [imagemap] order (a later region sits on top of an earlier
 *       one where they overlap), each a row inside a ui SortableList: drag a region by its
 *       handle (mouse, touch or keyboard) or use Up and Down; focusing a row selects its region
 *       on the image.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import type { ImagemapProblem } from "@haruhimemoe/bbcode/imagemap";
import { cx, SortableList, Text } from "@haruhimemoe/ui";
import { RegionRow } from "@/components/collab/RegionRow";
import { type CollabAction, type CollabRegion, type CollabState, problemFor } from "@/utils/collab";

type RegionListProps = {
  state: CollabState;
  dispatch: (action: CollabAction) => void;
  problems: readonly ImagemapProblem[];
};

/**
 * @function RegionList
 * @param props {RegionListProps} the collab state, its dispatch and the check's problems
 * @returns {JSX.Element} the list, or a line saying there are no regions yet
 */
export function RegionList({ state, dispatch, problems }: RegionListProps) {
  const count = state.regions.length;
  const numbers = new Map(state.regions.map((region, i) => [region.id, i + 1]));
  const numberOf = (region: CollabRegion) => numbers.get(region.id) ?? 0;
  return (
    <section aria-labelledby="collab-regions" className="flex min-w-0 flex-col gap-2">
      <h2 id="collab-regions" className="font-bold text-c1 text-lg">
        Regions{count > 0 ? ` (${count})` : ""}
      </h2>
      {count === 0 ? (
        <Text tone="muted">No regions yet. Draw one on the image.</Text>
      ) : (
        <SortableList
          items={state.regions}
          getId={(region) => region.id}
          getLabel={(region) => `region ${numberOf(region)}`}
          label="Regions"
          onMove={({ id, to }) => dispatch({ type: "move", id, to: to.index })}
          className="gap-2 [--sortable-gap:0.5rem]"
          itemProps={(region) => ({
            "aria-label": `Region ${numberOf(region)}`,
            // Focusing anything in a row, its handle included, selects its region on the image.
            onFocusCapture: () => dispatch({ type: "select", id: region.id }),
            className: cx(
              "flex flex-col gap-2 rounded-md border-2 bg-b4 p-3",
              state.selected === region.id ? "border-h1" : "border-transparent",
            ),
          })}
        >
          {(region, { index, handle, moveButtons }) => (
            <RegionRow
              region={region}
              number={index + 1}
              handle={handle}
              moveButtons={moveButtons}
              dispatch={dispatch}
              errors={{
                href: problemFor(problems, `regions.${index}.href`),
                title: problemFor(problems, `regions.${index}.title`),
              }}
            />
          )}
        </SortableList>
      )}
    </section>
  );
}
