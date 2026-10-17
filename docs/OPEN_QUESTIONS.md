# Open questions

Decisions waiting on the author. Each says what is blocked and where the
evidence is. When one is answered, record the answer (an ADR for a language
ruling, a `ChangeRecord` for a data edit) and move it to the settled list.

The validator leaves every open one as it is: a guide example that breaks a
rule is reported and pinned in the tests, never fixed by loosening the rule.

## 1. Language gaps, for when a song needs them

- "Once", "N times".
- A general "to + verb" complement beyond `sidu` and `kopisa`.
- Evidentials: the meaning when absent, whose evidence in a `fime` clause, the
  meaning in a question.
- Relative clauses on a prepositional object.

## 2. _Lira de Kronoasa_

The songbook copy lives in the browser, so these are edits to make there.

| Line | Status                                                                          |
| ---- | ------------------------------------------------------------------------------- |
| L4   | `donuda maivo lavi` is correct now (1.2:G26)                                    |
| L13  | `… eli-krono ata toda-krono ki?` is correct now (1.2:G24)                       |
| L14  | the opening lone `oro` is correct now (1.2:G25)                                 |
| L16  | rewrite proposed below                                                          |
| L11  | keep `de vera` (34 syllables) or drop it (31): the author's choice, by the tune |

L16, "I hope my song is worthy of your ears". The draft fixes all three
findings (`opi` in the verb slot, `ke` as a second verb, `de` after
`vardesan`) by using `vardeva`, "to deserve", and checks clean:

> `maivo opioa fime maivo de lira vardeva taivo de felberi.`
> "I hope that my song deserves your ears."

## 3. Housekeeping

- **Merge** `songbook-validator` into `master`?
- **`Lira de Kronoasa.pdf`** is at the project root. Move exports to
  `data/texts/`?
- **PDF headers:** the date, title and `file:///…` path on the exported pages
  come from Chrome's "Headers and footers" print option. Untick it when saving.

## Settled, for reference

- **Grammar rulings 1.2:G24–G31** (ADR-0012, 2026-10-17): time words open or
  close a clause, with the opening comma optional; a lone `oro` like `ata`; a
  pronoun recipient may stand bare after a give-type verb; the owner follows
  `de` unless a pronoun or name comes first; `-ri` optional after a number;
  an adjective stands as a noun only after an article; "about" is `de`;
  commands, address and narrative present.
- **The three ADR-0011 examples** are revised in
  `data/changes/2026-10-17-grammar-rulings.json`.
- **A noun does not modify a noun**: the first becomes its adjective. ADR-0011.
- **`kronoasasan`** is right for "timeless": it is glossed "Beyond Time,
  Timeless"; `krononasan` is "Without time, late, running out of time".
- **Deleting a piece** asks for `[FOREVER]`, brackets included.
