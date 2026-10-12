/**
 * @file src/lib/codemirror/profile-hover.ts
 * @desc Hovering a [profile] pair in the editor shows who it links to: avatar, name, flag, id
 *       and a link to the profile, looked up through src/lib/profile-lookup.ts (or why not:
 *       unknown, too many lookups, osu! down). The card is built with createElement and
 *       textContent, never HTML strings; the avatar and flag load from osu! in the browser, as
 *       the preview's images do. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Extension } from "@codemirror/state";
import { hoverTooltip } from "@codemirror/view";
import { flagUrl } from "@haruhimemoe/bbcode/flags";
import { lookupProfile, type ProfileResult } from "@/lib/profile-lookup";
import { profileAt } from "@/utils/profile-ref";

/** The hover card's words, in the page's language. */
export type ProfileHoverLabels = {
  loading: (name: string) => string;
  notFound: (name: string) => string;
  busy: () => string;
  failed: () => string;
  open: () => string;
  id: (id: number) => string;
};

/** How long the mouse rests on a pair before the card shows (ms). */
const HOVER_MS = 300;

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * @function profileCard
 * @param query {string} who the pair names
 * @param result {ProfileResult | null} the lookup's answer, or null while it runs
 * @param labels {ProfileHoverLabels} the card's words
 * @returns {HTMLElement} the card's content
 */
export const profileCard = (
  query: string,
  result: ProfileResult | null,
  labels: ProfileHoverLabels,
): HTMLElement => {
  const card = element("div", "cm-bb-profile");
  if (result?.kind !== "found") {
    const say =
      result === null
        ? labels.loading(query)
        : result.kind === "missing"
          ? labels.notFound(query)
          : result.kind === "busy"
            ? labels.busy()
            : labels.failed();
    card.append(element("p", "cm-bb-profile-note", say));
    return card;
  }
  const { user } = result;
  const avatar = element("img", "cm-bb-profile-avatar");
  avatar.src = `https://a.ppy.sh/${user.id}`;
  avatar.alt = "";
  avatar.width = 48;
  avatar.height = 48;
  const about = element("div", "cm-bb-profile-about");
  about.append(element("strong", "cm-bb-profile-name", user.username));
  const meta = element("p", "cm-bb-profile-meta");
  if (user.countryCode) {
    const flag = element("img", "cm-bb-profile-flag");
    flag.src = flagUrl(user.countryCode, "legacy");
    flag.alt = "";
    meta.append(flag, `${user.countryCode} · `);
  }
  meta.append(labels.id(user.id));
  const link = element("a", "cm-bb-profile-link", labels.open());
  link.href = `https://osu.ppy.sh/users/${user.id}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  about.append(meta, link);
  card.append(avatar, about);
  return card;
};

/**
 * @function profileHover
 * @param labels {() => ProfileHoverLabels} the card's words, read when a card opens
 * @returns {Extension} the hover card on [profile] pairs
 */
export const profileHover = (labels: () => ProfileHoverLabels): Extension =>
  hoverTooltip(
    (view, pos) => {
      const line = view.state.doc.lineAt(pos);
      const ref = profileAt(line.text, pos - line.from);
      if (!ref) return null;
      return {
        pos: line.from + ref.from,
        end: line.from + ref.to,
        above: true,
        create: () => {
          const dom = element("div", "cm-bb-profile-tooltip");
          dom.append(profileCard(ref.query, null, labels()));
          void lookupProfile(ref.query).then((result) =>
            dom.replaceChildren(profileCard(ref.query, result, labels())),
          );
          return { dom };
        },
      };
    },
    { hoverTime: HOVER_MS },
  );
