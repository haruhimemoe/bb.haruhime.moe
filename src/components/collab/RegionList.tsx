/**
 * @file src/components/collab/RegionList.tsx
 * @desc The collab maker's regions in [imagemap] order (a later region sits on top of an earlier
 *       one where they overlap), each a RegionRow with the imagemap check's messages.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

"use client";

import type { ImagemapProblem } from "@haruhimemoe/bbcode/imagemap";
import { Text } from "@haruhimemoe/ui";
import { RegionRow } from "@/components/collab/RegionRow";
import { type CollabAction, type CollabState, problemFor } from "@/utils/collab";

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
  return (
    <section aria-labelledby="collab-regions" className="flex min-w-0 flex-col gap-2">
      <h2 id="collab-regions" className="font-bold text-c1 text-lg">
        Regions{count > 0 ? ` (${count})` : ""}
      </h2>
      {count === 0 ? (
        <Text tone="muted">No regions yet. Draw one on the image.</Text>
      ) : (
        <ol className="flex flex-col gap-2">
          {state.regions.map((region, i) => (
            <RegionRow
              key={region.id}
              region={region}
              number={i + 1}
              count={count}
              selected={state.selected === region.id}
              dispatch={dispatch}
              errors={{
                href: problemFor(problems, `regions.${i}.href`),
                title: problemFor(problems, `regions.${i}.title`),
              }}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
