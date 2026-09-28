/**
 * @file src/constants/toolbar.ts
 * @desc The editor toolbar's buttons, in groups: each names the osu! tag it writes (checked
 *       against @haruhimemoe/bbcode's TAGS in tests, and its tooltip is that tag's description),
 *       the edit it makes, and its keyboard shortcut if it has one. The size menu's presets come
 *       from the package's LIMITS. Color, gradient and flag open their own tools.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { LIMITS } from "@haruhimemoe/bbcode";
import { type TextEdit, wrap } from "@/utils/text-edit";

/** One toolbar button. */
export type ToolbarItem = {
  id: string;
  /** Its accessible name. */
  label: string;
  /** What the button shows. */
  glyph: string;
  /** The osu! tag it writes (a TAGS name). */
  tag: string;
  edit: TextEdit;
  /** A CodeMirror key, "Mod-b" (Ctrl on Windows and Linux, Cmd on a Mac). */
  shortcut?: string;
};

const pair = (tag: string, placeholder: string, arg = ""): TextEdit =>
  wrap(`[${tag}${arg}]`, `[/${tag}]`, placeholder);

const block = (open: string, close: string, placeholder: string): TextEdit =>
  wrap(`${open}\n`, `\n${close}`, placeholder);

/** The toolbar's buttons, in groups shown with a gap between them. */
export const TOOLBAR_GROUPS: readonly (readonly ToolbarItem[])[] = [
  [
    { id: "bold", label: "Bold", glyph: "B", tag: "b", edit: pair("b", "bold"), shortcut: "Mod-b" },
    {
      id: "italic",
      label: "Italic",
      glyph: "I",
      tag: "i",
      edit: pair("i", "italic"),
      shortcut: "Mod-i",
    },
    {
      id: "underline",
      label: "Underline",
      glyph: "U",
      tag: "u",
      edit: pair("u", "underlined"),
      shortcut: "Mod-u",
    },
    { id: "strike", label: "Strikethrough", glyph: "S", tag: "s", edit: pair("s", "struck") },
    {
      id: "spoiler",
      label: "Spoiler",
      glyph: "Spoiler",
      tag: "spoiler",
      edit: pair("spoiler", "secret"),
    },
  ],
  [
    {
      id: "centre",
      label: "Align centre",
      glyph: "Centre",
      tag: "centre",
      edit: pair("centre", "centred"),
    },
    { id: "left", label: "Align left", glyph: "Left", tag: "left", edit: pair("left", "left") },
    {
      id: "right",
      label: "Align right",
      glyph: "Right",
      tag: "right",
      edit: pair("right", "right"),
    },
    {
      id: "heading",
      label: "Heading",
      glyph: "Heading",
      tag: "heading",
      edit: pair("heading", "Heading"),
    },
  ],
  [
    {
      id: "box",
      label: "Box",
      glyph: "Box",
      tag: "box",
      edit: block("[box=Title]", "[/box]", "Inside the box"),
    },
    {
      id: "spoilerbox",
      label: "Spoiler box",
      glyph: "Spoilerbox",
      tag: "spoilerbox",
      edit: block("[spoilerbox]", "[/spoilerbox]", "Hidden"),
    },
    {
      id: "notice",
      label: "Notice",
      glyph: "Notice",
      tag: "notice",
      edit: block("[notice]", "[/notice]", "Notice"),
    },
    {
      id: "quote",
      label: "Quote",
      glyph: "Quote",
      tag: "quote",
      edit: block("[quote]", "[/quote]", "Quoted text"),
    },
    {
      id: "list",
      label: "List",
      glyph: "List",
      tag: "list",
      edit: wrap("[list]\n[*]", "\n[*]\n[/list]", "First item"),
    },
    {
      id: "code",
      label: "Code block",
      glyph: "Code",
      tag: "code",
      edit: block("[code]", "[/code]", "code"),
    },
    { id: "inline-code", label: "Inline code", glyph: "c", tag: "c", edit: pair("c", "code") },
  ],
  [
    {
      id: "link",
      label: "Link",
      glyph: "Link",
      tag: "url",
      edit: pair("url", "link text", "=https://"),
    },
    { id: "image", label: "Image", glyph: "Image", tag: "img", edit: pair("img", "https://") },
    {
      id: "profile",
      label: "Profile link",
      glyph: "Profile",
      tag: "profile",
      edit: pair("profile", "username"),
    },
  ],
];

/** Every button, in toolbar order. */
export const TOOLBAR_ITEMS: readonly ToolbarItem[] = TOOLBAR_GROUPS.flat();

/** The size menu's choices: osu!'s own editor offers these percentages. */
export const SIZE_PRESETS: readonly number[] = LIMITS.sizePresets;

/**
 * @function sizeEdit
 * @param size {number} a percentage
 * @returns {TextEdit} wraps the selection in [size=N]
 */
export const sizeEdit = (size: number): TextEdit => pair("size", "text", `=${size}`);

/**
 * @function colorEdit
 * @param value {string} a normalized color
 * @returns {TextEdit} wraps the selection in [color=value]
 */
export const colorEdit = (value: string): TextEdit => pair("color", "text", `=${value}`);
