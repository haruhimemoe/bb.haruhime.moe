/**
 * @file src/hooks/useFitZoom.ts
 * @desc Watches a pane's width (ResizeObserver) and gives the zoom that fits osu!'s width into it
 *       (fitZoom: at most 1). Without ResizeObserver, or before the first measure, it's 1.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { fitZoom } from "@/utils/preview-scale";

/**
 * @function useFitZoom
 * @param width {number} osu!'s width for the post in px
 * @returns {{ ref: RefObject<HTMLDivElement | null>; zoom: number }} the ref for the pane to
 *          measure, and the zoom that fits `width` into it
 */
export const useFitZoom = (
  width: number,
): { ref: RefObject<HTMLDivElement | null>; zoom: number } => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState(0);
  useLayoutEffect(() => {
    const pane = ref.current;
    if (!pane || typeof ResizeObserver === "undefined") return;
    setAvailable(pane.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setAvailable(entry.contentRect.width);
    });
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);
  return { ref, zoom: fitZoom(available, width) };
};
