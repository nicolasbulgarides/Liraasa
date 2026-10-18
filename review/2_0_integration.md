# Liraasa 2.0 integration: findings for the author

Built 2026-10-18 from `liraasa_2_0_patch.json` (ADR-0016). Nothing here is
resolved by the tool: each item is yours to keep, change or veto.

## Your decisions, as recorded

| Question                                       | Decision                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `amorna`: canon fix vs. its dictionary line    | Canon fix: "lovelessness; the absence of love". The "enemy" sense is archived.            |
| `bumreasasan` in the `zoke` example            | Rewritten: "Ola ka bumresan, zoke." — "That is baked. (Oh, sure.)"                        |
| 15 nested compounds (harp, throne, swan, cow…) | Allowed by a new ruling, 2.0:G42.                                                         |
| 4 compounds that make words read two ways      | Kept. Reported as warnings (validate.py check 17, the sound audit).                       |

Note on `bumresan`: in 1.2 (and 2.0) it means "baked", not "bready", so the
English of the rewritten example says "baked". The question put to you said
"bready"; the data says "baked".

## Kept ambiguities (warnings, by your decision)

| Word       | Existing word that now reads two ways | Its two readings                           |
| ---------- | ------------------------------------- | ------------------------------------------ |
| benamavo   | benamavopago (ethical society)         | bena + mavopago · benamavo + -pago         |
| kronosarbi | kronosarbisenru (calendar)             | krono + sarbisenru · kronosarbi + senru    |
| ralelira   | ralelirapatu (refrain)                 | rale + lirapatu · ralelira + patu          |
| sevulumi   | sevulumibiti (lighthouse, new in 2.0)  | sevu + lumibiti · sevulumi + biti          |

Under 2.0:G41 a listed word's meaning overrides the default reading of a
derivation, so `benamavopago` still means "ethical society".

## Other findings

- **Two listings equal their productive build.** `larbopagoti` (grove) and
  `lavbupagoti` (chapel) are lexicalised derivations that also spell what
  `-pago` + `-ti` builds productively. That is what listing is for (2.0:G41);
  reported by the sound audit as collisions.
- **The patch's directions say "three rule_changes"; it lists five.** All five
  are integrated (2.0:G37–G41), plus your nesting ruling (2.0:G42).
- **`rivla` is reused.** It was retired in 1.0 (replaced by `mirunulu`) and
  reserved until 2.0; 2.0 reuses it for "flow; current". 0.8 texts that say
  `rivla` still resolve to `mirunulu` through the legacy table.
- **A regression-song expectation is superseded.** Line 2 of your regression
  song used `mareasasan` for "A mother star"; the checker flagged gloss drift.
  2.0 reglosses `mareasasan` as "mothering all generations", which now matches
  the English, so the drift is no longer visible. Recorded in the fixture as
  superseded in 2.0, with the reason; the fixed line, `maresan`, still passes.
- **Five canon findings are mended** by the patch's canon fixes (`cupa`,
  `pamlonasan`, `lallesan`, `vaniasasan`, `bumreasasan`). Three remain from
  before: `sola` (twice; not a headword) and the instrumental `ko` in a 1.0
  example written before `yuta` existed.
- **The noun-phrase template has no indefinite article** (unchanged from 1.2;
  see TRAINING_DECISIONS D31): `baba` is a function word but not in
  `[li|eli|ola|OWNER de]`.
- **Register of new words.** The patch gives none. Words from the Poetry &
  feeling, Devotional, Spiritual and Cosmos & light domains are filed
  `poetic`, the rest `everyday`. Domains are the patch's suggested ones (18
  new domain names alongside 1.2's).
- **Attested image-compound glosses are kept verbatim from 1.2**, including a
  few templated ones that leave the modifier untranslated (for example
  `follumanli`: "follu hands; hands marked by follu").

## Numbers

| | 1.2 | 2.0 |
| --- | ---: | ---: |
| Headwords | 1497 | 1462 |
| Primal roots | 464 | 474 |
| Compounds | 1033 | 988 |
| Meaningful forms (headwords) | 3666 | 4032 |
| Lexicalised derivations | 29 | 106 |
| Image compounds (attested / possible) | — | 391 / 1,767 |
| Rulings | 56 | 62 |
| validate.py | 24/24 + 25 | 23 PASS, 2 WARN |
