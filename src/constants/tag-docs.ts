/**
 * @file src/constants/tag-docs.ts
 * @desc What the docs add to each tag in @haruhimemoe/bbcode's TAGS: a plain name, the forms it
 *       takes, what to watch for, and (where the package's example would load a missing file) a
 *       better example. Keyed by the TAGS name; tests check every tag has an entry. Written from
 *       how osu! behaves, in our own words.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** The docs' extra words on one tag. */
export type TagDoc = {
  title: string;
  syntax: readonly string[];
  gotchas: readonly string[];
  /** Replaces the TAGS example in the live example. */
  example?: string;
};

const FLAG = "https://osu.ppy.sh/assets/images/flags/1f1ef-1f1f5.svg";
const OLD_FLAG = "https://assets.ppy.sh/old-flags/JP.png";
const SELF_NEST =
  "The same tag inside itself breaks: the first closing tag ends the outer one and the rest shows as text.";

/** Every tag's docs, by TAGS name. */
export const TAG_DOCS: Readonly<Record<string, TagDoc>> = {
  b: { title: "Bold", syntax: ["[b]text[/b]"], gotchas: [SELF_NEST] },
  i: { title: "Italic", syntax: ["[i]text[/i]"], gotchas: [SELF_NEST] },
  u: { title: "Underline", syntax: ["[u]text[/u]"], gotchas: [SELF_NEST] },
  s: {
    title: "Strikethrough",
    syntax: ["[s]text[/s]", "[strike]text[/strike]"],
    gotchas: [
      "[s] closes only with [/s], and [strike] only with [/strike]. Mixed, both show as text.",
    ],
  },
  spoiler: {
    title: "Spoiler",
    syntax: ["[spoiler]text[/spoiler]"],
    gotchas: ["Hovering shows the text. It still copies and pastes like any other text."],
  },
  color: {
    title: "Color",
    syntax: ["[color=#ff66aa]text[/color]", "[color=red]text[/color]"],
    gotchas: [
      "A hex code needs its #. ff66aa on its own is not a color, and the tag shows as text.",
      "Names are letters only. A name browsers don't know leaves the text uncolored.",
      "Dark colors are hard to read on osu!'s dark background. The editor's color tool warns under 3:1 contrast.",
    ],
  },
  size: {
    title: "Size",
    syntax: ["[size=150]text[/size]"],
    gotchas: [
      "The number is a percentage, without the % sign.",
      "osu! clamps it to 30..200, so [size=300] looks the same as [size=200].",
      "osu!'s own editor offers 50, 85, 100 and 150. Other numbers work; bb's lint points them out.",
    ],
  },
  centre: {
    title: "Centre",
    syntax: ["[centre]text[/centre]"],
    gotchas: [
      "British spelling only. [center] is not a tag and shows as text; bb's lint offers the fix.",
    ],
  },
  left: {
    title: "Left",
    syntax: ["[left]text[/left]"],
    gotchas: ["Text is left-aligned already. [left] is for a part inside a [centre] block."],
  },
  right: {
    title: "Right",
    syntax: ["[right]text[/right]"],
    gotchas: ["Starts a new block, like [centre]."],
  },
  heading: {
    title: "Heading",
    syntax: ["[heading]Title[/heading]"],
    gotchas: [
      "Open and close it on the same line, or it shows as text.",
      "osu! drops the line break right after a heading, so it doesn't leave a gap.",
    ],
  },
  c: {
    title: "Inline code",
    syntax: ["[c]code[/c]"],
    gotchas: ["One line only. For longer code, use [code]."],
  },
  code: {
    title: "Code block",
    syntax: ["[code]\nanything\n[/code]"],
    gotchas: [
      "Tags inside are shown as written, so a code block is the way to show BBCode itself.",
      "Line breaks right inside the tags are dropped, so put the tags on their own lines.",
    ],
    example: "[code]\n[b]This stays as typed[/b]\n[/code]",
  },
  notice: {
    title: "Notice",
    syntax: ["[notice]text[/notice]"],
    gotchas: ["A block: it starts on a new line and takes the full width."],
  },
  box: {
    title: "Box",
    syntax: ["[box=Title]content[/box]"],
    gotchas: [
      "The box starts closed. Readers click the title to open it.",
      "The title can hold inline tags, like [b] or [color].",
      "[box] without a title shows as text. For an untitled box, use [spoilerbox].",
    ],
    example: "[box=Rules]\n1. Be nice.\n2. Have fun.\n[/box]",
  },
  spoilerbox: {
    title: "Spoiler box",
    syntax: ["[spoilerbox]content[/spoilerbox]"],
    gotchas: ["Its label is always SPOILER. For your own label, use [box=Label]."],
    example: "[spoilerbox]\nThe ending was a dream.\n[/spoilerbox]",
  },
  quote: {
    title: "Quote",
    syntax: ["[quote]text[/quote]", '[quote="name"]text[/quote]'],
    gotchas: ["The name needs double quotes. [quote=name] without them is not a quote."],
  },
  list: {
    title: "List",
    syntax: ["[list]\n[*]item\n[/list]", "[list=1]\n[*]first\n[/list]"],
    gotchas: [
      "Any argument makes it numbered, even [list=a].",
      "Text between [list] and the first [*] becomes the list's title.",
      "A list with no [*] items shows no bullets.",
    ],
  },
  "*": {
    title: "List item",
    syntax: ["[*]item"],
    gotchas: [
      "Only works inside [list]. Anywhere else it shows as text.",
      "Items need no closing tag: the next [*] or [/list] ends one.",
    ],
    example: "[list]\n[*]osu!\n[*]taiko\n[*]catch\n[*]mania\n[/list]",
  },
  url: {
    title: "Link",
    syntax: ["[url]https://osu.ppy.sh[/url]", "[url=https://osu.ppy.sh]text[/url]"],
    gotchas: [
      "http, https and ftp links only.",
      "The whole tag has to fit on one line.",
      "Plain https:// and www. addresses become links without any tag.",
    ],
  },
  email: {
    title: "Email",
    syntax: ["[email]name@example.com[/email]", "[email=name@example.com]text[/email]"],
    gotchas: ["The text inside is not read as BBCode.", "One line only."],
  },
  img: {
    title: "Image",
    syntax: ["[img]https://example.com/picture.png[/img]"],
    gotchas: [
      "osu! shows the picture through its own image proxy. bb's preview loads it straight from where it's hosted and never stores it.",
      "http and https only, and the URL can't contain [.",
    ],
    example: `[img]${OLD_FLAG}[/img] Japan`,
  },
  audio: {
    title: "Audio",
    syntax: ["[audio]https://example.com/song.mp3[/audio]"],
    gotchas: ["One line, http or https only."],
  },
  youtube: {
    title: "YouTube",
    syntax: ["[youtube]VIDEO_ID[/youtube]", "[youtube]https://youtu.be/VIDEO_ID[/youtube]"],
    gotchas: [
      "A link with extra parameters, like &t= for a start time, is refused. Use the bare video id.",
      "One line only.",
    ],
  },
  profile: {
    title: "Profile link",
    syntax: ["[profile]username[/profile]", "[profile=2]username[/profile]"],
    gotchas: [
      "With an id, osu! puts in the player's current name when the post is saved, so the link survives name changes.",
      "One line only.",
    ],
  },
  imagemap: {
    title: "Imagemap",
    syntax: ["[imagemap]\nimage URL\nx y width height link title\n[/imagemap]"],
    gotchas: [
      "The image URL goes on the first line, then one line per clickable area.",
      "Positions and sizes are percentages of the image, so the map scales with it.",
      "A link is #, an http(s) URL or a mailto: address. The title is the rest of the line.",
      "One bad line and osu! shows the whole block as text.",
    ],
    example: `[imagemap]\n${FLAG}\n0 0 50 100 https://osu.ppy.sh left half\n50 0 50 100 # right half\n[/imagemap]`,
  },
};
