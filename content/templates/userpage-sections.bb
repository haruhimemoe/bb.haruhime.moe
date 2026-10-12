---
name: Userpage (sections)
kind: userpage
description: A fuller "me!" page with a banner, collapsible sections for your setup, goals, favourite maps and friends.
fields:
  - key: name
    label: Your name
    kind: text
    required: true
  - key: banner
    label: Banner image URL (hosted elsewhere)
    kind: url
  - key: color
    label: Heading color
    kind: color
    default: "#66ccff"
  - key: about
    label: About you
    kind: multiline
    default: I've been clicking circles for a while. I like tech maps, farm maps on bad days, and tournaments with friends.
  - key: tablet
    label: Tablet
    kind: text
    default: Wacom CTL-472
  - key: keyboard
    label: Keyboard
    kind: text
    default: 60% with red switches
  - key: goals
    label: Goals, one per line
    kind: multiline
    default: "[*]Reach 5 digits\n[*]FC a 7* map\n[*]Play a tournament final"
  - key: favourite_map
    label: A favourite beatmap (link)
    kind: url
  - key: friends
    label: Friends to shout out, one per line
    kind: users
---
[centre]{{#banner}}[img]{{banner}}[/img]

{{/banner}}[size=150][color={{color}}][b]{{name}}[/b][/color][/size][/centre]
{{#about}}

[box=About me]
{{about}}
[/box]
{{/about}}
{{#tablet|keyboard}}
[box=Setup]
[list]
{{#tablet}}
[*][b]Tablet:[/b] {{tablet}}
{{/tablet}}
{{#keyboard}}
[*][b]Keyboard:[/b] {{keyboard}}
{{/keyboard}}
[/list]
[/box]
{{/tablet|keyboard}}
{{#goals}}
[box=Goals]
[list=1]
{{goals}}
[/list]
[/box]
{{/goals}}
{{#favourite_map}}
[box=Favourite map]
[url={{favourite_map}}]Go play it[/url]
[/box]
{{/favourite_map}}
{{#friends}}
[spoilerbox]
[heading]Friends[/heading]
{{friends}}
[/spoilerbox]
{{/friends}}

[centre][size=50]Made with bb.haruhime.moe[/size][/centre]
