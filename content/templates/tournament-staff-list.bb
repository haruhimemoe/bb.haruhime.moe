---
name: Tournament staff list
kind: tournament
description: Every role on a tournament's staff, each in its own box with the people on it linked to their profiles.
fields:
  - key: tournament
    label: Tournament name
    kind: text
    required: true
  - key: color
    label: Role color
    kind: color
    default: "#ffcc22"
  - key: hosts
    label: Hosts
    kind: users
    required: true
  - key: mappoolers
    label: Mappoolers
    kind: users
  - key: playtesters
    label: Playtesters
    kind: users
  - key: referees
    label: Referees
    kind: users
  - key: streamers
    label: Streamers
    kind: users
  - key: commentators
    label: Commentators
    kind: users
  - key: designers
    label: Graphic designers
    kind: users
  - key: contact
    label: Who to message with questions
    kind: user
---
[centre][size=150][b]{{tournament}} staff[/b][/size][/centre]

[box=Hosts]
{{hosts}}
[/box]
{{#mappoolers|playtesters}}
[box=Mappooling]
{{#mappoolers}}
[color={{color}}][b]Mappoolers[/b][/color]
{{mappoolers}}
{{/mappoolers}}
{{#playtesters}}
[color={{color}}][b]Playtesters[/b][/color]
{{playtesters}}
{{/playtesters}}
[/box]
{{/mappoolers|playtesters}}
{{#referees}}
[box=Referees]
{{referees}}
[/box]
{{/referees}}
{{#streamers|commentators}}
[box=Broadcast]
{{#streamers}}
[color={{color}}][b]Streamers[/b][/color]
{{streamers}}
{{/streamers}}
{{#commentators}}
[color={{color}}][b]Commentators[/b][/color]
{{commentators}}
{{/commentators}}
[/box]
{{/streamers|commentators}}
{{#designers}}
[box=Design]
{{designers}}
[/box]
{{/designers}}
{{#contact}}

[size=85]Questions? Message {{contact}}.[/size]
{{/contact}}
