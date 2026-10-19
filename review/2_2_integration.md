# Liraasa 2.2 integration: findings for the author

Built 2026-10-19 from `data/proposals/liraasa_2_2_patch.json` and its brief
(ADR-0018). Nothing here is resolved by the tool.

## Preflight (brief, step 0)

- 2.1 is applied: rulings 2.1:G46–G59 exist, and `puzu` (secret) stood where
  2.0 had `silro`.
- 2.1:G46, G47 and G54 in the project are word for word the 2.1 patch's text,
  so they were superseded without asking.
- 0.8:G4 holds both clauses: only its embedded wh-question clause is marked
  superseded, and its quotation clause stands.
- `soloasa` ("the living stone; a jewel of countless faces") and
  `tarnulinusan` ("boyish; like a son") were confirmed by you on 2026-10-19
  before being written.

## Results

| | |
| --- | --- |
| Rulings added | 2.2:G60–G68 |
| Rulings superseded | 2.1:G46 → G60, 2.1:G47 → G61, 2.1:G54 → G62, 0.8:G4 (embedded wh-word clause only) → G60 |
| `silro` restored | 1 root (7 forms), 12 compounds, 8 attested image compounds, and the image-engine modifier; all under their original ids |
| Retired | `puzu` and every form built on it, readable through `legacy.migration_forms` |
| Filled | `soloasa`, `tarnulinusan` |
| Counts | 1462 headwords; meaningful forms 4032 → 4034 |
| Album | 13 texts (12 tracks and the alternate 05), 275 lines, recorded text untouched; 16 album readings placed on their lines |
| `spelling_2_2` recomputed | identical to the patch on every line: 0 differences |
| Validation | `npm run validate:2.2`: 23 PASS, 2 WARN (the kept 2.0 ambiguities and `kezupagolelde`) |

## Album readings awaiting you (`author_confirm`)

Listed, not filled in:

| Id | Track:line | Recorded | Proposed standard form |
| --- | --- | --- | --- |
| AR-01 | 01:10 | lanto, saivo po veseva fime raho saivo viki ke saivo de devorivo. | tentative: drop `raho` |
| AR-04 | 02:8 | maivo mambivimoma ala li ata masuma lanla ata po milobema. | none: please supply the intended line |
| AR-05 | 05:9 | kube ito futu ke salrusan maivo ata donuda ala ito baba biti vobi demro. | none: is this line in the recorded vocal? |
| AR-11 | 10:3 | maivo po silbesia saivo de vaye raho po jubaja baba nonmori. | tentative: only if "her" is the recipient |

## Other notes

- **Small-words question examples.** No fronted example was left to keep. Since
  2.1 they read with the question word in place and a final `ki`, and both are
  valid under G60. The album fronts most questions; if you want the table to
  show the fronted order again, say so.
- **"To + verb".** 2.1 had closed it as an open question through 2.1:G50. As the
  2.2 brief asks, the entry is back as an updated open question: `sidu`, `fime`
  (2.1:G50) and adjective + `sidu` (2.2:G65) cover the known cases, and the
  general case remains open.
- **English.** The patch gives no English for the 2.2 ruling examples or the
  album, and the data invents none. The guide shows a placeholder for the
  album. Any English the guide writes for a ruling example is composed from
  lexicon glosses and listed in `review/Liraasa_2_2_Reference_Grammar_review.md`
  for your approval.
- **Learn.** The album is not yet one of Learn's reading texts. It is 2.0 text,
  and Learn teaches current spellings. Say if you want it added through its
  current spellings.

## From the guide and the checker

- **Album title words.** Four words in the titles do not read as live words:
  `amorlavi` and `melominvaasa` are not words, and `leldeasa` and
  `lunosavaliasa` are unused slots. The titles are shown as recorded. Should
  these become lexicon words, or stay as titles only?
- **English for the G60–G68 examples.** The guide composed it from lexicon
  glosses; it awaits your review in
  `review/Liraasa_2_2_Reference_Grammar_review.md`. Some readings are
  uncertain: "tool of floating", "I will not rise", and the G66 sentence, which
  is a fragment.
- **The checker.**
  - Of the 16 album readings, it flags only AR-10 (`ke sidu`, now an error
    pending the open question) and AR-16 (`raho` as a question word). The
    other departures pass unflagged: adjective after the noun, the missing
    relative comma, pronoun + `de` as recipient.
  - `Ki-saivo lirala?` is no longer a finding: under G60, a ki-word question
    may end without `ki`.
