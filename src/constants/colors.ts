/**
 * @file src/constants/colors.ts
 * @desc The color tool's swatches: color names osu! accepts in [color=name] (letters only, and
 *       ones every browser knows), with their hex values so the tool can check their contrast,
 *       plus osu!'s pink as a hex value. Also the contrast the tool asks for.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** One swatch: what goes in [color=...] and its hex value. */
export type Swatch = { value: string; hex: string; label: string };

/** The swatches, light to dark roughly by hue. */
export const SWATCHES: readonly Swatch[] = [
  { value: "#ff66aa", hex: "#ff66aa", label: "osu! pink" },
  { value: "red", hex: "#ff0000", label: "red" },
  { value: "orange", hex: "#ffa500", label: "orange" },
  { value: "gold", hex: "#ffd700", label: "gold" },
  { value: "yellow", hex: "#ffff00", label: "yellow" },
  { value: "lime", hex: "#00ff00", label: "lime" },
  { value: "green", hex: "#008000", label: "green" },
  { value: "cyan", hex: "#00ffff", label: "cyan" },
  { value: "deepskyblue", hex: "#00bfff", label: "deepskyblue" },
  { value: "dodgerblue", hex: "#1e90ff", label: "dodgerblue" },
  { value: "blue", hex: "#0000ff", label: "blue" },
  { value: "violet", hex: "#ee82ee", label: "violet" },
  { value: "hotpink", hex: "#ff69b4", label: "hotpink" },
  { value: "pink", hex: "#ffc0cb", label: "pink" },
  { value: "white", hex: "#ffffff", label: "white" },
  { value: "silver", hex: "#c0c0c0", label: "silver" },
  { value: "gray", hex: "#808080", label: "gray" },
  { value: "black", hex: "#000000", label: "black" },
];

/** Below this WCAG contrast ratio against the preview's background, the tool warns. */
export const MIN_CONTRAST = 3;

/** The gradient tool's starting stops. */
export const DEFAULT_STOPS: readonly string[] = ["#ff66aa", "#66ccff"];
/** The fewest and most stops the gradient tool takes. */
export const STOPS_MIN = 2;
/** The most stops the gradient tool takes. */
export const STOPS_MAX = 4;
