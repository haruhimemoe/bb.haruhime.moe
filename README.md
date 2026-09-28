<p align="center"><a href="https://bb.haruhime.moe"><picture><source media="(prefers-color-scheme: light)" srcset="https://www.haruhime.moe/brand/repos/bb.haruhime.moe-banner-on-light.svg"><img alt="bb.haruhime.moe" src="https://www.haruhime.moe/brand/repos/bb.haruhime.moe-banner.svg" width="640"></picture></a></p>

# bb.haruhime.moe

Write osu! BBCode at **https://bb.haruhime.moe**: your userpage, a tournament forum post or a beatmap description, with a preview beside it. Start from a template (built-in ones, your own, or ones other players share), fill in its fields and open it in the editor.

bb never hosts images. Pictures, audio and videos in a preview load in your browser straight from wherever they're hosted.

## Features

- **Editor:** the BBCode source beside its preview (in tabs on phones), with tag colors, autocomplete after `[`, the matching tag marked, and wavy underlines wherever osu! would show something other than you meant, with a Fix when it's obvious. The toolbar wraps the selection in bold, italic, underline, strike, spoiler, a size, centre, left, right, heading, box, spoiler box, notice, quote, list, code, a link, an image or a profile link (Ctrl or Cmd with B, I and U). The count follows what you're writing (userpage, forum post or beatmap description) and Copy warns when it's over. Keep as many named drafts as you like; they stay in your browser and nothing is sent anywhere.
- **Colors, gradients and flags:** a color picker that warns when a color is hard to read on osu!'s dark background, a gradient tool (two to four colors) that shows how many characters the colors add, and a flag picker that searches countries and inserts the current flag or the old one.
- **Docs:** every tag osu! reads at `/docs`, each with its forms, an example you can edit and what to watch for, plus guides: getting started, userpages, tournament forum posts, flags, colors and gradients, imagemaps and collabs, and limits and gotchas.
- **Templates:** a template is BBCode with fields: put `{{key}}` in the body where a value goes, and declare the field with a label, a kind (text, multi-line text, number, date, URL, player, list of players, country or color), whether it's required and a default. Fill the fields on a template's page, see the preview, and "Use in the editor" opens the result as a new draft.
- **Built-in templates:** a simple userpage, a userpage with sections, a tournament forum post (information, schedule, rules, prizes, staff, mappools and links), a tournament staff list, a feature request or bug report, and a beatmap description. Anyone can use or fork them.
- **Gallery:** search public templates by name and description, filter by kind (userpage, tournament, forum post, beatmap description, other) and sort by newest or most used.
- **Your templates:** sign in with osu! to make templates, edit them, fork anyone's, and choose who sees each one: only you, anyone with the link, or everyone in the gallery. You can keep up to 100. If a template changed in another tab while you edited it, the editor reloads it and tells you your change wasn't saved.
- **Reports:** anyone signed in can report a template. A public template with three reports is hidden until an admin looks at it.
- **Accounts:** your account page deletes your account and every template you own, once you type your username.

The collab maker, the player list and mappool import from pools.haruhime.moe are on their way.

## Setup

To run your own copy you need Bun 1.4+, Node 24+ and a MongoDB database. Copy `.env.example` to `.env.local` and fill it in: every variable has a comment there. [CONTRIBUTING.md](CONTRIBUTING.md) has the rest.

## Stack

Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS v4 and MDX, on Bun. The editor is CodeMirror 6. MongoDB with Mongoose and zod, and better-auth with osu! sign-in for everyone (admins are listed by osu! ID). The server plumbing is `@haruhimemoe/next-kit`, which packs and pools use too, and the interface is built from `@haruhimemoe/ui`. Tests run on Vitest, lint and format on Biome.

## Packages

bb uses these shared haruhime.moe packages:

- [`@haruhimemoe/bbcode`](https://www.npmjs.com/package/@haruhimemoe/bbcode): parsing, the preview's HTML and stylesheet (`/styles.css`), lint and the character count, the tag list the toolbar, autocomplete and docs are built from, gradients and colors (`/helpers`), country flags (`/flags`) and template fields (`/template`).
- [`@haruhimemoe/next-kit`](https://www.npmjs.com/package/@haruhimemoe/next-kit): JSON route helpers and rate limits in MongoDB (`/server`), env parsing (`/env`), the MongoDB client and its indexes (`/mongo`), osu! sign-in (`/auth`) with the signed-in marker and account store for the browser (`/auth-react`), and the fake env and in-memory MongoDB the tests use (`/testing`).
- [`@haruhimemoe/ui`](https://www.npmjs.com/package/@haruhimemoe/ui): the theme, buttons, cards, form fields, confirmations, badges, notices, pagination, the account menu, and the site header, footer and page frame.
- [`@haruhimemoe/pool`](https://www.npmjs.com/package/@haruhimemoe/pool): the content filter (`/content-filter`) every template's text goes through.
- [`@haruhimemoe/osu`](https://www.npmjs.com/package/@haruhimemoe/osu): osu! profile links and the sign-in settings (`/shapes`).
- [`@haruhimemoe/brand`](https://www.npmjs.com/package/@haruhimemoe/brand): the wordmark, icons and link preview image.

## License

MIT. See [LICENSE](LICENSE). Not affiliated with or endorsed by ppy Pty Ltd. osu! is a trademark of ppy Pty Ltd.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report a vulnerability through GitHub's [private vulnerability reporting](https://github.com/haruhimemoe/bb.haruhime.moe/security/advisories/new), or by email as [SECURITY.md](SECURITY.md) describes.
