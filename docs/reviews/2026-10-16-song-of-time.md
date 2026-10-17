# Song of Time — audit, verified against the lexicon

An external grammar audit of _Song of Time_ (16 lines) was written without
access to the JSON. This note records what survived checking it against
`data/lexicon/liraasa_1_1.json`, what did not, and what the editor's checker
now catches. **Nothing here decides the language**: the open items at the end
are the author's (SPEC §14).

## Confirmed

- **Tense sits before the verb** (clause template slot 4). A clause-final
  `po` used as English "was" is an error.
- **Verb forms.** `farla` → `farlafa` (to make; to create), `lemu` → `lemula`
  (to learn), `sabe` → `sabesia`, `suru` → `surusia`, `lumi` → `lumila`,
  `tivro` → `tivrota` (to hold).
- **Function-word senses.** `hema` is hesitation ("well…"); `fime` introduces
  a content clause and the demonstrative is `ola`; `pifu` is clause-final and
  "hope to" is `kopi`; `kenvi` is the clause-initial frame "immediately";
  `pago` is the root "Place"; `ala` is "to, toward" and takes a noun phrase.
- **`ki` questions keep statement order** ("sentence-final particle; no
  inversion").
- **Lexicon items.** `pagoasa` = Universe, Existence; `sizosan` = shimmering;
  iridescent; `yanbasan` = old; `farulavrasan` = phoenix-like; `jomrusan` =
  traveling; `maresan` = maternal; `masudevori` = doubts; `vera` is the root
  noun "Truth"; `mavopago` (Society) is a lexicalised compound — only the
  `-pago` _derivation_ on `mavo` is blocked.
- **Gaps.** No word means "about" or "once".

## Corrected

1. **Plain `oro` is "or"** (`miru oro nami`, water or food). Ruling 1.0:G10
   adds the paired either/or; it does not remove the plain one. There is no
   "plain or" gap.
2. **"True" is not `simvosan`.** `simvosan` is "authentic; true to oneself"
   and `simvoasa` is "the true self". The lexicon's "truthful" is `verasan`.
   `simvoasa` is not "sacred truth".
3. **`lordi` is order, not chaos**, and `lordisan` and `lordinasan` are both
   `— (unused)`: they must not be used. The chaos words are `lordina`,
   `melona` and `mavopagona` (Outlaw, Without Society, Chaos).
4. **`kronobio` is the noun "Birth".** "To be born" is `kronobioka`, so "had
   been born" is `po tefa kronobioka`; `po ke kronobio` says "was birth".
5. **`liralavra`, `nimuleto` and `marelore` are not in the lexicon.** They are
   well-formed MODIFIER+HEAD compounds, but they are noncanonical and need
   the author's approval.
6. **`dapa` is worth in coin.** Moral worth is `vardesan` (deserving; worthy).
7. **`yava` is documented**: the hortative "let us" (`Yava lirala!`).

## Decision 1, `de` order, is still open

The canon already puts a non-pronoun owner after the noun far more often than
before it — `de` follows a non-pronoun 49 times and a pronoun 16 times in the
live examples (`li bumre de li cilni`, city bread; `baba buvokova de miru`, a
cup of water). But `pilo de bumre` is glossed "father's bread", a noun owner
first, which the proposed ruling ("pronoun owner first, everything else
after") would make wrong. The ruling has to account for it.

## What the editor's checker now catches

`checkShape` in `editor/index.html`, pinned by `tests/golden/checker.test.ts`:

| Pattern                                       | Severity | Song lines             |
| --------------------------------------------- | -------- | ---------------------- |
| tense with no verb or copula after it         | error    | L2–4, L6, L8, L10, L16 |
| a lexical non-verb straight after the tense   | error    | —                      |
| `raho`/`fime`/`kube`… clause with no verb     | error    | L3, L4, L8, L15        |
| preposition with no noun phrase after it      | error    | L5, L7, L12            |
| `fime` followed by a copula or tense          | error    | L7                     |
| `kenvi`/`zafra`/`finra`/`lanto` mid-clause    | error    | L16                    |
| copula or tense moved to the front of a `ki?` | error    | L14, L15               |
| two bare nouns, first has a glossed adjective | note     | L2, L6–8, L12–16       |
| `hema` not set off by a pause                 | note     | L1                     |

The two-noun rule is a note, not an error, because the canon has
`baba lotero lermi` (another language) beside `loterosan`; it notes that
line, `Lotero silda, …`, and `Maivo melo bena opioa lumi`, an old workbook
example worth the author's look. No live example trips an error or warning
from these rules; a test pins that.

Not caught: a noun in the verb slot after `ata` (`… ata sabe ito`), because
`ata` also joins noun phrases and the two cannot be told apart without a
parser. That waits for Phase 2. A tense mix within a stanza needs stanzas, so
it waits too.

## Open for the author

- `de` order (above).
- "about / concerning"; "once" and "N times".
- Adjectives used as nouns ("the forgotten").
- Whether `-ri` follows numbers and quantifiers: the canon has both
  `dossa veluri` and `dossa cono`, `muya jemlari` and `muya marna`.
- Narrative present against past in verse; vocatives; evidentials in
  questions and in `fime` clauses; relative clauses on prepositional objects;
  word order for give-type verbs.

## Round 2

After the composer fixes the song had 13 errors left. The corrected song,
every word checked against the lexicon and every line clean under the checker
(syllables by the editor's own count):

| #   | Line                                                                                      | Syl | English                                                                       |
| --- | ----------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------- |
| 1   | kube krono po lombila, maivo po lenila taivo de melonulu.                                 | 23  | When time began, I heard your melody.                                         |
| 2   | taivo de valla po ke baba lira de sizosan lumi.                                           | 18  | Your voice was a song of shimmering light.                                    |
| 3   | taivo de manliri po ke li lumiasasan biti raho po farlafa li pagoasa.                     | 28  | Your hands were the holy tool that created the universe.                      |
| 4   | maivo po ke baba melosan lavra raho po lemula sidu lirala taivo de valla.                 | 29  | I was a musical bird who learned to sing your voice.                          |
| 5   | mavopago po lenila maivori de melonulu ata po sabesia fime ito ka vera.                   | 31  | Society heard our melody and knew that it is truth.                           |
| 6   | eli-krono, ola ke baba lumiasasan lumi raho maivori kopi loya, saivori po senosia.        | 35  | Now, that is a holy light we hope to become, they said.                       |
| 7   | saivori po lenila li narvonasan vani de li lumiasasan melonulu raho po lumila.            | 32  | They heard the innocent beauty of the holy melody that shone.                 |
| 8   | yesta li raleri de li sadori de li ramumomvisan po lenila taivo de lira.                  | 28  | Even the echoes of the shadows of the forgotten heard your song.              |
| 9   | li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne gome relsira.        | 32  | The doubts of the society of chaos were forgotten and were not answered.      |
| 10  | mavopagoasa po ke baba cilni raho po kronobioka en taivo de vanisan vilneri.              | 31  | Heaven was a city that was born in your beautiful eyes.                       |
| 11  | lumiasasan lumi po sarbisia lirari kopisa li yanbasan veluri de vera lenila itori.        | 34  | Holy light wrote songs so that the old stars of truth would hear them.        |
| 12  | ata li veluri po sarbisia lirari de li namina de li faru de maivori de farulavrasan amor. | 36  | And the stars wrote songs of the hunger of the fire of our phoenix-like love. |
| 13  | oro maivo ke taivo de kronoasasan jomrusan lavra de lirari eli-krono ata toda-krono ki?   | 35  | Or am I your timeless traveling bird of songs, now and always?                |
| 14  | oro maivo ke li suma raho tivrota taivo de maresan lore ki?                               | 24  | Or am I the warmth that holds your maternal heart?                            |
| 15  | maivo po lenila taivo de yomlasan valla, ata eli po ke maivo de leto de nimu.             | 31  | I heard your honey-sweet voice, and this was my letter of home.               |

L11 has a shorter form, 31 syllables, if the length is the concern:
`… kopisa li yanbasan veluri lenila itori.`

### Where the round-2 instructions met the JSON

- **L9: `lordinasan` is `— (unused)`**, and so is `lordisan`. `lordi` is
  order and `lordina` chaos, so "chaotic" has no adjective; the line uses
  `mavopago de lordina`, society of chaos.
- **`melolavra`, `nimuleto`, `marelore` are not lexicon compounds.** Adding
  one is the author's call, so the lines use `melosan lavra`, `leto de nimu`
  and `maresan lore`.
- **Decision 4 is answered by the data.** `kronoasasan` is glossed "Beyond
  Time, Timeless"; `krononasan` is "Without time, late, running out of time".
  `kronoasasan` stays.
- **`oro` does not have to be paired.** Plain `oro` is "or" in the canon. L13
  takes `oro` anyway, as the default asked, which makes L13–L14 an
  either/or (1.0:G10).
- **`kronobioka`** is glossed "To be born, to give birth (context
  specific)"; "to be born" comes first, so L10 is `raho po kronobioka`.

### Rules added to the checker

| Rule                                                       | Severity | Round-2 lines         |
| ---------------------------------------------------------- | -------- | --------------------- |
| two bare nouns: the first becomes its adjective (ADR-0011) | error    | L4, L9, L12, L14, L15 |
| a second verb or copula in one clause                      | error    | L10                   |
| `sidu` without a verb on each side; `sidu` + copula        | error    | L4, L5, L6            |
| `de` straight after a verb, or with nothing after it       | error    | L12                   |
| `zafra`/`finra`/`lanto`/`kenvi` without its comma          | warn     | —                     |
| a time word (`eli-krono`) without its comma                | note     | L6                    |
| a `-na` form: shows the root's gloss beside its own        | note     | L9, L12               |
| English passive with no `gome` or copula in the line       | note     | L9                    |

Not added: "oro must be paired", because the canon has plain `oro`. A
stranded preposition and a non-verb in the verb slot were caught already.

The two-noun rule was a warning until the author ruled (ADR-0011); it is an
error now. The canon's three noun + noun phrases, `Maivo melo bena opioa
lumi`, `Lotero silda, …` and `baba lotero lermi`, break it; a test pins them
for the author.

### Decisions for the author

Defaults applied, to confirm:

1. **Noun + noun modification**: **ruled by the author** — a noun does not
   modify a noun; the first becomes its adjective (`lirasan lavra`). The rule
   is now an error. See ADR-0011.
2. **`oro … oro` across two questions**: allowed (L13–L14).
3. **"about / concerning"**: no word; the workaround "wrote songs of …"
   (L12).
4. **`kronoasasan`**: kept, and the data supports it (above).
5. **`de` order**: pronoun owners before the noun, all other `de` phrases
   after it (`mavopago de lordina`, `leto de nimu`). `pilo de bumre`,
   "father's bread", is still the counterexample.
6. **L11**: keep `de vera` (34 syllables) or drop it (31)?
