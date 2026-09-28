# Changelog

All notable changes to bb.haruhime.moe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Depends on `@haruhimemoe/bbcode` 0.2.0 (tags nested past 100 levels render as text, linear-time parsing on hostile input) and `@haruhimemoe/next-kit` 0.2.1.

### Added

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

- Sign in, sign out, the account menu and Delete my account come from `@haruhimemoe/next-kit/auth-react` 0.2.0 (`createAuthComponents`, `osuAvatarSrc`), and the character counter, the editor's tabs, the visibility selects and the report form from `@haruhimemoe/ui` 0.5.0 (`CharCounter`, `Tabs`, `VisibilitySelect`, `ReportDisclosure`), instead of bb's own copies. The report reason is now a multi-line field, and the header menu's avatar is a plain image.
- osu! user lookups use `@haruhimemoe/osu` 0.4.0's `getUsers` and `getUser` on the shared client (its token, timeout and 401 retry) instead of bb's own token module; the budget and the `osu_users` cache are unchanged. A user osu! sends in a shape we can't read is left unchecked instead of "not found".
