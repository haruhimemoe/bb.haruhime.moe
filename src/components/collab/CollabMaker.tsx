/**
 * @file src/components/collab/CollabMaker.tsx
 * @desc /collab's maker: the image URL, the canvas to draw regions on, the region list, the
 *       player lookup that links regions, the import box and the result. State lives in one reducer (src/utils/collab.ts); nothing
 *       leaves the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { useReducer, useRef } from "react";
import { CollabOutput } from "@/components/collab/CollabOutput";
import { ImagemapImport } from "@/components/collab/ImagemapImport";
import { ImageUrlForm } from "@/components/collab/ImageUrlForm";
import { PlayerLinks } from "@/components/collab/PlayerLinks";
import { RegionCanvas } from "@/components/collab/RegionCanvas";
import { RegionList } from "@/components/collab/RegionList";
import { collabOutput, collabReducer, EMPTY_COLLAB } from "@/utils/collab";

/**
 * @function CollabMaker
 * @returns {JSX.Element} the whole collab maker
 */
export function CollabMaker() {
  const [state, dispatch] = useReducer(collabReducer, EMPTY_COLLAB);
  const counter = useRef(0);
  const newId = () => {
    counter.current += 1;
    return `r${counter.current}`;
  };
  const output = collabOutput(state);
  return (
    <div className="flex flex-col gap-6">
      <ImageUrlForm
        key={state.image}
        image={state.image}
        onImage={(image) => dispatch({ type: "image", image })}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
        <RegionCanvas state={state} dispatch={dispatch} newId={newId} />
        <RegionList state={state} dispatch={dispatch} problems={output.problems} />
      </div>
      <PlayerLinks
        regionCount={state.regions.length}
        onLinks={(links) => dispatch({ type: "links", links })}
      />
      <ImagemapImport
        newId={newId}
        onLoad={(loaded) => dispatch({ type: "load", state: loaded })}
      />
      <section aria-labelledby="collab-result" className="flex flex-col gap-2">
        <h2 id="collab-result" className="font-bold text-c1 text-lg">
          Result
        </h2>
        <CollabOutput output={output} />
      </section>
    </div>
  );
}
