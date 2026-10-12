---
name: Tournament rules (1v1)
kind: tournament
description: A full ruleset for a 1v1 tournament: eligibility, matches, conduct. Every number is a field, so it reads like your rules, not a copy.
fields:
  - key: tournament
    label: Tournament name
    kind: text
    required: true
  - key: format
    label: Format
    kind: text
    required: true
    default: 1v1, double elimination
  - key: rank_range
    label: Rank range
    kind: text
    required: true
    default: "#10,000 to #100,000"
  - key: bws
    label: Badge-weighted seeding formula, if you use one
    kind: text
  - key: registration_close
    label: Registrations close
    kind: date
    required: true
  - key: timezone
    label: Time zone for every time
    kind: text
    required: true
    default: UTC
  - key: late_minutes
    label: Minutes late that count as a forfeit
    kind: number
    required: true
    default: "10"
  - key: warmup_minutes
    label: Longest warmup, in minutes
    kind: number
    required: true
    default: "5"
  - key: disconnect_seconds
    label: Disconnect replays allowed in the first ... seconds of a map
    kind: number
    required: true
    default: "30"
  - key: tiebreaker
    label: The tiebreaker
    kind: text
    required: true
    default: the map in the tiebreaker slot
  - key: bans
    label: Bans per player
    kind: number
    required: true
    default: "1"
  - key: reschedule_hours
    label: Hours of notice a reschedule needs
    kind: number
    required: true
    default: "24"
  - key: extra
    label: More rules, one per line, each starting with [*]
    kind: multiline
---
[heading]{{tournament}} rules[/heading]

[box=Eligibility]
[list=1]
[*]Players must be ranked {{rank_range}} when registrations close on {{registration_close}}{{#bws}}, after badge-weighted seeding ({{bws}}){{/bws}}.
[*]One account per player. Multi-accounting means disqualification.
[/list]
[/box]
[box=Matches]
[list=1]
[*]The format is {{format}}. Every time is in {{timezone}}.
[*]Matches are played in a multiplayer room made by a referee. Be in the room on time: {{late_minutes}} minutes late counts as a forfeit.
[*]Warmups are allowed if both players agree, and must be shorter than {{warmup_minutes}} minutes.
[*]Bans per player: {{bans}}. After the bans, picks alternate, starting with the winner of the roll.
[*]Each player gets one disconnect replay per match, used in the first {{disconnect_seconds}} seconds of a map.
[*]At match point for both players, the tiebreaker is {{tiebreaker}}.
[/list]
[/box]
[box=Conduct]
[list=1]
[*]Score manipulation, cheating and abuse of staff or players mean disqualification.
[*]Rescheduling needs both players and a referee to agree, at least {{reschedule_hours}} hours before the match.
[*]The hosts have the final say on anything these rules don't cover.
[/list]
[/box]
{{#extra}}
[box=More rules]
[list=1]
{{extra}}
[/list]
[/box]
{{/extra}}
