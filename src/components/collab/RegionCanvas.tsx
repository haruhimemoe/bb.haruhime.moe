/**
 * @file src/components/collab/RegionCanvas.tsx
 * @desc The collab image with its regions drawn over it. The image loads straight from its host
 *       in the browser (never through bb). An overlay the size of the image takes every pointer
 *       event (useRegionPointer); touch-action none keeps a finger's drag from scrolling the page.
 *       Says when the image is missing or failed to load.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { EmptyState, Notice } from "@haruhimemoe/ui";
import { useRef, useState } from "react";
import { RegionBox } from "@/components/collab/RegionBox";
import { CANVAS_HINT, DRAW_HINT, IMAGE_FAILED } from "@/constants/collab";
import { useRegionPointer } from "@/hooks/useRegionPointer";
import type { CollabAction, CollabState } from "@/utils/collab";

type RegionCanvasProps = {
  state: CollabState;
  dispatch: (action: CollabAction) => void;
  newId: () => string;
};

/**
 * @function RegionCanvas
 * @param props {RegionCanvasProps} the collab state, its dispatch and an id maker
 * @returns {JSX.Element} the image with its regions, or a hint while there's no image
 */
export function RegionCanvas({ state, dispatch, newId }: RegionCanvasProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pointer = useRegionPointer({ overlay, regions: state.regions, dispatch, newId });
  if (state.image === "") {
    return <EmptyState className="min-h-48">{CANVAS_HINT}</EmptyState>;
  }
  const { draft } = pointer;
  return (
    <div className="flex flex-col gap-2">
      {failed === state.image ? <Notice tone="warning">{IMAGE_FAILED}</Notice> : null}
      <div className="relative w-fit max-w-full select-none self-center">
        {/* biome-ignore lint/performance/noImgElement: the person's own image, loaded from its host as is. */}
        <img
          key={state.image}
          src={state.image}
          alt="Your collab"
          draggable={false}
          referrerPolicy="no-referrer"
          onLoad={() => setFailed(null)}
          onError={() => setFailed(state.image)}
          className="block h-auto max-h-[70vh] max-w-full"
        />
        <div
          ref={overlay}
          data-testid="collab-overlay"
          className="absolute inset-0 cursor-crosshair touch-none"
          onPointerDown={pointer.onPointerDown}
          onPointerMove={pointer.onPointerMove}
          onPointerUp={pointer.onPointerUp}
          onPointerCancel={pointer.onPointerCancel}
        >
          {state.regions.map((region, i) => (
            <RegionBox
              key={region.id}
              region={region}
              number={i + 1}
              selected={state.selected === region.id}
              dispatch={dispatch}
            />
          ))}
          {draft ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-h1 border-dashed bg-h1/20"
              style={{
                left: `${draft.x}%`,
                top: `${draft.y}%`,
                width: `${draft.w}%`,
                height: `${draft.h}%`,
              }}
            />
          ) : null}
        </div>
      </div>
      <p className="text-c3 text-xs">{DRAW_HINT}</p>
    </div>
  );
}
