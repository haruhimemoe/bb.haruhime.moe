# Changelog

All notable changes to bb.haruhime.moe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `@haruhimemoe/next-kit` 0.7.0 and `@haruhimemoe/vcs` 0.1.0 for template history.
- Two tabs saving a template at once no longer silently lose one's change when they touched different parts: saves merge, and only a same-line conflict reloads (with the merge in the form to check and save again).
- Guides moved from `/docs/guides/<guide>` to `/guides/<guide>`, with a `/guides` index; their Markdown copies are at `/guides/<guide>.md`. The old addresses are gone (no redirects).
- Docs, guides and legal pages share the haruhime.moe content pages: one registry (`src/constants/content.ts`) drives the section nav, search, "Copy as Markdown", the `.md` mirrors, the sitemap and both llms files. The docs nav lists the API page and every tag page. `@haruhimemoe/next-kit` 0.6.1, `@haruhimemoe/ui` 0.11.0, `@haruhimemoe/brand` 0.7.0.
- The API docs are Markdown now (`content/docs/api.mdx`), with a copy at `/docs/api.md`.
- `/llms.txt` lists Docs (with every tag), Guides, API and Legal first, each linking its `.md` copy.
- `@haruhimemoe/ui` 0.11.1: decorative alt on brand page previews.
- `@haruhimemoe/ui` 0.11.2: Copy as Markdown works on Safari and iOS.
- Depends on `@haruhimemoe/ui` 0.12.0: buttons and form fields are 44px tall on touch screens, motion stops when your system asks for reduced motion, colors get stronger when it asks for more contrast, template names on the gallery and admin page are bold links, and the sign-in page's privacy link uses the accent color.
- Depends on `@haruhimemoe/ui` 0.13.0: template cards, editor tool panels, the docs and legal index cards and empty previews have rounder corners, the preview size switch is a bit bigger and works with arrow keys, and tag pages show previous and next as two-line links.
- Depends on `@haruhimemoe/ui` 0.14.0 and `@haruhimemoe/next-kit` 0.8.0: deleting your account opens a dialog where you type your osu! username, and the confirm buttons for clearing a collab, deleting a template or a draft, and regenerating or revoking an API key are red.
- Depends on `@haruhimemoe/ui` 0.15.0: regions in the collab maker drag up and down the list by their handle with a mouse, a finger or the keyboard, each step read out, beside the Up and Down buttons.
- Depends on `@haruhimemoe/ui` 0.16.0. Nothing changes on bb's pages.
- Depends on `@haruhimemoe/ui` 0.17.0: guides get an "On this page" list, keyboard shortcuts in the getting-started guide look like keys, and dates on guides, docs and legal pages read like Oct 4, 2026.

### Added

- `/brand`: the bb name, logos, colors and type to download, and the haruhime contact address.
- `/legal`, an index of the legal pages, and Markdown copies of each at `/legal/<page>.md`.
- Version history: every save of a template is kept. `/t/<id>/history` lists the versions and shows what changed in one (with a line-by-line diff of the body); the owner can restore any of them, and make the history public so anyone who can see the template can see it too. Forks record the version they copied and can pull in whatever the original saved since.

## [0.1.0] - 2026-10-04

### Added

- API keys: make an `hbb_` key on your account page and call `/api/v1/me` with it. The API docs page lists the endpoints. Keys and the `/api/v1` guard come from `@haruhimemoe/next-kit` 0.5.0, shared with packs and pools.
- Listed templates, guides and tag pages have their own link preview: the name with the kind and owner, or the guide's or tag's summary (`<page>/og.png`, drawn by `@haruhimemoe/brand` 0.6.0). Private, unlisted and hidden templates keep the site's image.
- A long template title ends in "· bb" instead of "· bb.haruhime.moe", so search results show it whole (`@haruhimemoe/next-kit` 0.4.0). The 404 page is titled "Page not found".
- The footer's tools column is now ui 0.6.0's shared "haruhime tools" column (packs, pools, All tools), the same on every haruhime.moe site.

- `/docs` opens with what osu! BBCode is and ends with eight common questions (the 60,000 character limit, tags that show as text, flags, collab banners, gradients, drafts, sharing templates), also sent as FAQPage JSON-LD.
- JSON-LD on every public page: the haruhime.moe Organization, WebSite with template search and WebApplication on the home page, TechArticle with its last update and breadcrumbs on each guide and tag page, CreativeWork on listed templates (never private, unlisted or hidden ones), ItemList on the gallery, and WebApplication and HowTo on the collab maker.
- Guides and tag pages show when they were last updated.
- The collab maker explains itself in three steps under the tool.
- Every guide and tag page has a Markdown copy at its URL plus `.md`, and `/llms-full.txt` holds all of the docs. `/llms.txt` gains notes on how osu! BBCode and bb behave, template descriptions, and an Elsewhere section.
- The footer links packs and pools; the tournament post guide points at pools and packs, and the userpage guide at the sections template.

- The app: Next.js 16 on `@haruhimemoe/next-kit` and `@haruhimemoe/ui`, the bb brand (hue 265), osu! sign-in, security headers with a CSP that lets previews show images from any https host, robots, sitemap, `/llms.txt` and security.txt.
- The editor: CodeMirror 6 with a BBCode language, tag autocomplete, lint marks with fixes and matching tags from `@haruhimemoe/bbcode`; a toolbar that wraps the selection (Ctrl or Cmd with B, I and U); source and preview side by side or in tabs on phones; the count against a userpage, forum post or beatmap description; copy with an over-limit warning; several named drafts in the browser (the single stage 1 draft moves in).
- Color (with a contrast warning), gradient (with its character cost) and flag (small PNG by default, current SVG as an option) tools.
- The collab maker at `/collab`: draw, move, resize and nudge `[imagemap]` regions over an image loaded from its own host, link them (or fill them from a player list), copy the result or open it in the editor, and import an existing imagemap.
- The Players tool: 1 to 64 osu! names, ids or profile links become a flag and profile link per player (numbered, bullets or lines), through `POST /api/osu/users` (client credentials, a shared osu! call budget, answers kept a day in `osu_users`, 20 lookups a minute per IP).
- The Pool tool: a pools.haruhime.moe built pool (public or unlisted) becomes a mappool section with stars under each bucket's mods, through `GET /api/pools/<id>` (`POOLS_URL`, maps and ratings kept a week in `osu_beatmaps`, 20 imports a minute per IP).
- Docs at `/docs`: a page per tag from `@haruhimemoe/bbcode`'s TAGS with an editable example, and seven guides, all in the sitemap and `/llms.txt`.
- Previews, counts and template fills come from `@haruhimemoe/bbcode`.
- Templates: BBCode with `{{key}}` fields (text, multi-line, number, date, URL, player, players, country, color), a fill-in form and "Use in the editor", which opens the result as a new draft.
- Six built-in templates: userpage (simple), userpage (sections), tournament forum post, tournament staff list, feature request or bug report, beatmap description.
- The public gallery with search, kind filter, newest or most used, and pages.
- Your templates at `/me`: create, edit (versioned, a stale edit is refused and reloaded), delete, visibility, fork. At most 100 per account and 30 writes a minute.
- Reports: one per person per template; a public template with 3 reports is hidden until an admin clears it at `/admin`.
- Account deletion with every template, confirmed by typing your username.
- Privacy and terms pages.
- The collab maker keeps its image and regions in your browser and brings them back on the next visit; "Clear" starts over.

### Changed

- Legal pages and guides render through `@haruhimemoe/ui` 0.9.0's shared MDX components: links, headings (now with `#` anchors), tables and callouts all come from `mdxComponents` instead of bb's own `a` override, which is removed.
- Titles say what each page is for: the home page is "osu! BBCode editor and templates", guides read like the questions they answer ("How to make an osu! userpage (me! page)"), tag pages are "osu! [tag] tag: syntax and examples". Every indexable page has a canonical URL, og:url and a 140 to 160 character description; tag and template descriptions are written from their data when the typed one is short.
- A filtered, sorted or later gallery page is noindex, with /templates as its canonical URL.
- The sitemap carries real last-modified dates for guides, tag pages, legal pages and templates, and robots.txt lists the AI crawlers explicitly (all still allowed).
- Metadata, robots.txt, the sitemap, JSON-LD and llms.txt are built with `@haruhimemoe/next-kit` 0.3.0's `/seo`; depends on `@haruhimemoe/ui` 0.5.1.

- The preview is laid out at the width osu! shows the post at (890px for a userpage, 750px for a forum post, 430px for a beatmap description, from `@haruhimemoe/bbcode` 0.2.2's `OSU_WIDTHS`, with osu!'s font size) and zoomed down to fit the pane, so lines and collab rows wrap where they do on osu! instead of breaking early in a narrow pane. "Fit to pane / Actual size" switches to osu!'s own size, scrolling sideways; the choice is remembered in the browser. The editor follows its target picker, a template's preview its kind; the gallery's card previews and the tools' samples are unchanged. Boxes are spaced as on osu!.
- Depends on `@haruhimemoe/bbcode` 0.2.1: images in the preview stay inline, so collab rows written side by side no longer stack.

- Depends on `@haruhimemoe/bbcode` 0.2.0 (tags nested past 100 levels render as text, linear-time parsing on hostile input) and `@haruhimemoe/next-kit` 0.2.1.

- Sign in, sign out, the account menu and Delete my account come from `@haruhimemoe/next-kit/auth-react` 0.2.0 (`createAuthComponents`, `osuAvatarSrc`), and the character counter, the editor's tabs, the visibility selects and the report form from `@haruhimemoe/ui` 0.5.0 (`CharCounter`, `Tabs`, `VisibilitySelect`, `ReportDisclosure`), instead of bb's own copies. The report reason is now a multi-line field, and the header menu's avatar is a plain image.
- osu! user lookups use `@haruhimemoe/osu` 0.4.0's `getUsers` and `getUser` on the shared client (its token, timeout and 401 retry) instead of bb's own token module; the budget and the `osu_users` cache are unchanged. A user osu! sends in a shape we can't read is left unchecked instead of "not found".

### Fixed

- Accessibility: the gallery's clipped card previews are inert, so a link cut off inside one is neither read out nor reachable by Tab. Depends on `@haruhimemoe/ui` 0.7.0 (its accessibility release): one footer nav with headed columns, lighter accent links that clear 4.5:1 at bb's violet hue, a visible focus ring on fields.

[unreleased]: https://github.com/haruhimemoe/bb.haruhime.moe/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/haruhimemoe/bb.haruhime.moe/releases/tag/v0.1.0
