# Changelog

All notable changes to bb.haruhime.moe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- The app: Next.js 16 on `@haruhimemoe/next-kit` and `@haruhimemoe/ui`, the bb brand (hue 265), osu! sign-in, security headers with a CSP that lets previews show images from any https host, robots, sitemap, `/llms.txt` and security.txt.
- The editor shell: BBCode source beside a preview, the count against osu!'s 60,000 characters, copy, and the draft autosaved in the browser.
- Templates: BBCode with `{{key}}` fields (text, multi-line, number, date, URL, player, players, country, color), a fill-in form and "Use in the editor".
- Six built-in templates: userpage (simple), userpage (sections), tournament forum post, tournament staff list, feature request or bug report, beatmap description.
- The public gallery with search, kind filter, newest or most used, and pages.
- Your templates at `/me`: create, edit (versioned, a stale edit is refused and reloaded), delete, visibility, fork. At most 100 per account and 30 writes a minute.
- Reports: one per person per template; a public template with 3 reports is hidden until an admin clears it at `/admin`.
- Account deletion with every template, confirmed by typing your username.
- Privacy and terms pages.
