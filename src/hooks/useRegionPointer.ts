/**
 * @file src/hooks/useRegionPointer.ts
 * @desc The collab canvas's pointer handling (mouse, pen and touch alike, through pointer events
 *       captured by the overlay): a drag on the empty image draws a new region, a drag on a region
 *       moves it, a drag on one of its handles resizes it. Regions and handles are found by their
 *       data-region-id and data-handle attributes, so every event is handled here, in one place.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { type PointerEvent, type RefObject, useRef, useState } from "react";
import type { CollabAction, CollabRegion } from "@/utils/collab";
import {
  HANDLES,
  type Handle,
  isBigEnough,
  moveRect,
  type Point,
  pointIn,
  type Rect,
  rectFromPoints,
  resizeRect,
} from "@/utils/region-geometry";

/** What a drag in progress is doing. */
type Drag =
  | { kind: "draw"; start: Point }
  | { kind: "move"; id: string; start: Point; from: Rect }
  | { kind: "resize"; id: string; handle: Handle; from: Rect };

type Options = {
  overlay: RefObject<HTMLDivElement | null>;
  regions: readonly CollabRegion[];
  dispatch: (action: CollabAction) => void;
  newId: () => string;
};

/** What useRegionPointer returns: the overlay's handlers and the region being drawn. */
export type RegionPointer = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  /** The rectangle being drawn, shown until the pointer lifts. */
  draft: Rect | null;
};

const isHandle = (value: string | undefined): value is Handle =>
  HANDLES.some((handle) => handle === value);

/**
 * @function useRegionPointer
 * @param options {Options} the overlay element, the regions, the dispatch and an id maker
 * @returns {RegionPointer} pointer handlers for the overlay, and the draft rectangle
 */
export function useRegionPointer({ overlay, regions, dispatch, newId }: Options): RegionPointer {
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);

  const pointOf = (event: PointerEvent<HTMLDivElement>): Point | null => {
    const element = overlay.current;
    return element ? pointIn(event.clientX, event.clientY, element.getBoundingClientRect()) : null;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const point = pointOf(event);
    if (!point) return;
    const target = event.target instanceof Element ? event.target : null;
    const handle = target?.closest<HTMLElement>("[data-handle]")?.dataset.handle;
    const id = target?.closest<HTMLElement>("[data-region-id]")?.dataset.regionId;
    const region = regions.find((one) => one.id === id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (region) {
      event.preventDefault();
      dispatch({ type: "select", id: region.id });
      drag.current = isHandle(handle)
        ? { kind: "resize", id: region.id, handle, from: region }
        : { kind: "move", id: region.id, start: point, from: region };
      return;
    }
    dispatch({ type: "select", id: null });
    drag.current = { kind: "draw", start: point };
    setDraft(rectFromPoints(point, point));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const now = drag.current;
    const point = now ? pointOf(event) : null;
    if (!now || !point) return;
    if (now.kind === "draw") setDraft(rectFromPoints(now.start, point));
    else if (now.kind === "move") {
      const rect = moveRect(now.from, point.x - now.start.x, point.y - now.start.y);
      dispatch({ type: "rect", id: now.id, rect });
    } else dispatch({ type: "rect", id: now.id, rect: resizeRect(now.from, now.handle, point) });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const now = drag.current;
    drag.current = null;
    setDraft(null);
    if (now?.kind !== "draw") return;
    const point = pointOf(event);
    const rect = point ? rectFromPoints(now.start, point) : null;
    if (rect && isBigEnough(rect)) dispatch({ type: "add", id: newId(), rect });
  };

  const onPointerCancel = () => {
    drag.current = null;
    setDraft(null);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, draft };
}
