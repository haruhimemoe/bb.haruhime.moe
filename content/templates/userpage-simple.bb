---
name: Userpage (simple)
kind: userpage
description: A short, centred "me!" page: a greeting, a few lines about you and where to find you.
fields:
  - key: name
    label: What people call you
    kind: text
    required: true
  - key: color
    label: Accent color
    kind: color
    default: "#ff66aa"
  - key: about
    label: A few lines about you
    kind: multiline
    default: I play mostly standard, map sometimes, and I'm always up for a multi lobby.
  - key: country
    label: Where you're from
    kind: text
  - key: playing_since
    label: Playing since
    kind: number
  - key: contact
    label: Where to reach you
    kind: text
---
[centre][size=150][color={{color}}][b]Hi, I'm {{name}}![/b][/color][/size]
{{#about}}

{{about}}
{{/about}}
{{#country|playing_since}}

[size=85]{{#country}}From {{country}}{{/country}}{{#playing_since}}{{#country}} · {{/country}}playing since {{playing_since}}{{/playing_since}}[/size]
{{/country|playing_since}}
{{#contact}}

[b]Contact:[/b] {{contact}}
{{/contact}}
[/centre]
