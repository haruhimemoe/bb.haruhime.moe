/**
 * @file src/constants/templates.ts
 * @desc Template limits and vocabularies: kinds, visibilities, field kinds, name, description,
 *       body and field sizes, the per-user cap, the reports that hide a public template, the
 *       id shapes (t-xxxxxxxx for people's templates, bb-<slug> for built-in ones) and the
 *       gallery's page size and sorts.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** What a template is for. */
export const TEMPLATE_KINDS = ["userpage", "tournament", "forum", "beatmap", "other"] as const;
/** One of TEMPLATE_KINDS. */
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

/** Each kind's label. */
export const KIND_LABELS: Record<TemplateKind, string> = {
  userpage: "Userpage",
  tournament: "Tournament",
  forum: "Forum post",
  beatmap: "Beatmap description",
  other: "Other",
};

/** Who sees a template: only its owner, anyone with the link, or everyone (the gallery). */
export const VISIBILITIES = ["private", "unlisted", "public"] as const;
/** One of VISIBILITIES. */
export type Visibility = (typeof VISIBILITIES)[number];

/** Each visibility's label. */
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: "Private",
  unlisted: "Unlisted",
  public: "Public",
};

/** What a template field holds. */
export const FIELD_KINDS = [
  "text",
  "multiline",
  "number",
  "date",
  "url",
  "user",
  "users",
  "country",
  "color",
] as const;
/** One of FIELD_KINDS. */
export type FieldKind = (typeof FIELD_KINDS)[number];

/** Name length, trimmed. */
export const NAME_MIN = 3;
/** Name length, trimmed. */
export const NAME_MAX = 80;
/** Description length, trimmed. */
export const DESCRIPTION_MAX = 280;
/** osu!'s FORUM_POST_MAX_LENGTH: userpages and beatmap descriptions are forum posts too. */
export const BODY_MAX = 60_000;
/** Fields per template. */
export const MAX_FIELDS = 40;
/** A field key: a letter, then letters, digits and underscores. */
export const FIELD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,31}$/;
/** A field label's length. */
export const FIELD_LABEL_MAX = 60;
/** A field default's length. */
export const FIELD_DEFAULT_MAX = 2000;
/** A report's reason length. */
export const REPORT_REASON_MAX = 500;

/** Templates one account may own. */
export const MAX_TEMPLATES_PER_USER = 100;
/** Reports that hide a public template until an admin clears it. */
export const REPORTS_TO_HIDE = 3;

/** A person's template id. */
export const TEMPLATE_ID_PATTERN = /^t-[a-z0-9]{8}$/;
/** A built-in template id: bb- and the file's name. */
export const BUILTIN_ID_PATTERN = /^bb-[a-z0-9-]{1,48}$/;

/** Templates per gallery page. */
export const GALLERY_PAGE_SIZE = 24;
/** The last gallery page anyone can ask for. */
export const GALLERY_MAX_PAGE = 100;
/** A gallery search's longest query. */
export const GALLERY_QUERY_MAX = 100;
/** The gallery's orders. */
export const GALLERY_SORTS = ["newest", "used"] as const;
/** One of GALLERY_SORTS. */
export type GallerySort = (typeof GALLERY_SORTS)[number];
/** Each order's label. */
export const SORT_LABELS: Record<GallerySort, string> = {
  newest: "Newest",
  used: "Most used",
};
