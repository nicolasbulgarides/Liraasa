# Liraasa 1.2: candidate review

Phase 2 of the 1.2 lexicon update. **Nothing here is canon yet.** You choose
every spelling; once you reply, Phase 3 writes the changeset.

- **177 candidate spellings, all checked: 0 ERROR, 0 WARN.** That is 57 roots
  and 2 function words, 3 options each. The candidates are in
  `review/1_2_candidates.json`. To rerun:
  `python scripts/check_sounds.py data/lexicon/liraasa_1_1.json --candidates review/1_2_candidates.json`
- The options for different concepts are all **at least two edits apart**, so
  any combination of picks is safe together. Options for the same concept may
  sit closer, because you will only keep one.
- Each option was also screened by eye for clashes with real words in English
  and the Romance languages. That dropped, among others, `puto`, `culo`,
  `kurva`, `basta`, `servo`, `multa`, `tumba`, `gumbo`, `vulvo` and `valve`.
  Tell me if any surviving option reads badly in a language I missed.
- ✱ marks a draft gloss that goes beyond your brief or beyond 0.8:R2
  predictability. Look twice at those, and strike any you don't want.
- Stress is penultimate. Syllables are written with the stressed one in
  capitals, as in `DUM-do`.

## Outcome (2026-10-17)

The author delegated every pick ("use best judgement, integrate everything").
**Option A of every concept below was integrated into 1.2** (ADR-0013), with
the recommended answer to each of Q1–Q5.

Option A changed for six concepts after this review was first written. The
author's validator (check 18) requires a new word to be two edits from
**reserved** spellings too, not only active ones. These first picks were one
edit from a retired 1.0 root, so they were replaced and the checker was
tightened:

| Concept | Was | Now | Reserved neighbour |
|---|---|---|---|
| by marriage | `vinde` | `rilde` | `vide` |
| horizon | `nalmo` | `lanla` | `nalto` |
| fold | `pelmo` | `filpa` | `selmo` |
| beak | `pelka` | `pirke` | `selka` |
| wet | `luye` | `mulyi` | `duye` |
| ferocity | `rarga` | `gargo` | `rarva` |

Final spellings: female `minva`, male `tarnu`, by marriage `rilde`, kill `karko`, grave `tomnu`, drum `dumdo`, reed `filvi`, horizon `lanla`, veil `velso`, madness `zirki`, pour `lurva`, fold `filpa`, carve `kerti`, wing `nalfa`, feather `pulmi`, tail `vurvi`, claw `kalga`, fur `mulfo`, beak `pirke`, horn `kurno`, scale `zelki`, wet `mulyi`, smooth `nilmi`, thick `burdo`, sour `zeti`, float `lalfo`, sink `nombu`, dig `turgo`, split `kirpa`, weave `tenva`, wipe `sispa`, scratch `girze`, spit `pusti`, ghost `volme`, magic `zirme`, angel `lansi`, spider `tilki`, fox `vurfa`, lion `garvu`, lamb `limli`, mouse `cipi`, sufficiency `bansa`, strangeness `hurvo`, ferocity `gargo`, fame `sirmo`, greed `gerpe`, hollow `holmo`, fragile `felti`, shell `salko`, crystal `cirsi`, mask `vasko`, bareness `lundu`, serve `mervi`, crowd `murta`, victim `nirma`, guess `tinsa`, obey `yorve`, with (instrumental) `yuta`, too (excess) `diba`.

## How to answer (as first asked)

One line per concept is enough: `drum B`, `female A`, or "all A except drum B,
fox C". You can also write your own spelling; I'll run it through the checker
before using it. Please also answer the five design questions marked **Q1–Q5**
below.

## 1. Your decisions, as I've applied them

### Gender and kinship (decision 1)

The lexicon's kinship words are already neutral: `purma` (parent), `famli`
(sibling), `linu` (child), `purmafamli` (aunt or uncle), `purmapurma`
(grandparent), `linulinu` (grandchild). The gendered pair `mare`/`pilo`
(mother/father) already exists. To keep it graceful:

1. **Two new roots:** *female* and *male*. They are a soft pair, not mirror
   images. Neither is the negative of the other: the `-na` slot of each stays
   unused, so "male" is never "not female".
2. **Kinship stays neutral by default.** Gender is something you *add*, in one
   of two ways:
   - **Compounds** for the everyday words. They need two parts and no nesting:
     *daughter / girl* = FEMALE+`linu`, *son / boy* = MALE+`linu`, *sister* =
     FEMALE+`famli`, *brother* = MALE+`famli`.
   - **The adjective** (`-san`, "female; feminine") everywhere else, under
     ADR-0011.
3. **The words you already have are kept, not duplicated.** *Mother* and
   *father* stay `mare` and `pilo`; no FEMALE+`purma` is coined.
4. **Grandmother = `purma`+`mare`** ("the parent's mother"), and grandfather =
   `purma`+`pilo`. This follows the canon's own pattern, `purmafamli` = "the
   parent's sibling", and avoids nesting.
5. **A third root, *by marriage*,** is used as a modifier: mother-in-law =
   BY-MARRIAGE+`mare`, and the same for father, parent, sibling and child. A
   gendered in-law beyond mother and father takes the adjective:
   `minvasan vindefamli`, sister-in-law. `devorivo` (spouse) is unchanged.

**Q1. Aunt and uncle.** Every two-part compound would nest, because
`purmafamli` is itself a compound. Options:

- **(a) Recommended:** an adjective phrase with no new entry. *Aunt* is
  `minvasan purmafamli` and *uncle* is `tarnusan purmafamli`. This is the same
  rule as every other gendered kin word that has no compound.
- **(b)** Nested compounds, `minvapurmafamli` and `tarnupurmafamli`. They are
  six syllables long, and they would be the second nested compound in canon
  after `mudusomubiti`.
- **(c)** Side-of-family compounds, `marefamli` (the mother's sibling) and
  `pilofamli` (the father's sibling). These record maternal and paternal
  rather than gender. They can be added alongside (a).

The spellings above use option A for each root. All three options of every
root were checked in every compound, and all are clean.

### Kill (decision 2)

Kill gets **its own root, with hard consonants**, separate from `daigo`
(death) and from the negative of `yugemeyi` (healing). Its adjective, "deadly;
lethal", takes over the sense that B1 removes from `daigosan`. A *killer* is
ROOT+`-yo`; `karkoyo`, `zurkayo` and `galkuyo` are all clean.

### Grave (decision 3)

**Its own root.** Its verb is "to bury" and its adjective "buried". A
graveyard can be ROOT+`-pago`; ask if you want it.

### Priest and prophet (decision 4)

Both are compounds on `nela` (person):

- **Priest = `luminela`**, `lumi` (light) + `nela`: "person of light".
- **Q2. Prophet,** "person of future light". There is no future root to
  compound with, because `futu` is a tense particle and not a headword.
  Options:
  - **(a) Recommended: `mernonela`**, `merno` (morning) + `nela`: one who
    stands where the light is coming. It has two parts and no nesting.
  - **(b) `nerponela`**, `nerpo` (expectation) + `nela`: "person of
    anticipation". It is more literal and less luminous.
  - **(c) `mernoluminela`**, `mernolumi` (dawn) + `nela`. This is the closest
    to your wording, but it nests.

### Widowhood (decision 5)

**Q3.** A widow is the companion who remains, so the compound is built on
`rivo` (companion). Spouse can't be used, because `devorivo` is already a
compound and would nest. Both options are neutral between widow and widower:

- **(a) Recommended: `nemerivo`**, `neme` (sorrow) + `rivo`: "a companion
  in sorrow". Its adjective `nemerivosan` would be "widowed".
- **(b) `ramurivo`**, `ramu` (memory) + `rivo`: "the companion who remembers".

B3 then narrows `devorivona` to divorce only, so widowhood is never described
as a bond "severed".

### Tiers (decision 6: my judgement)

**I included all three tiers,** but did not coin a root where the lexicon
already has the word. Instead:

| Brief asked for | Already in the lexicon | Proposal |
|---|---|---|
| confusion; clarity; bewildered | `cere` clarity, `cerena` confusion | No root. |
| ponder; thoughtful; contemplation | `pensa` thought, `pensapa` to think, `pensasan` thoughtful | No root. **Q4:** activate `pensaasa` = "contemplation" (0.8:R2)? |
| pregnancy; to carry; expectant | `linufule` pregnancy | No root. **Q4:** activate `linufulela` = "to be with child" and `linufulesan` = "expectant; with child"? |
| ripe; unripe | `hunra` maturity; `hunraha` "to mature; ripen"; `hunranasan` "immature" | No root. Add "ripe", "unripe" and "raw" to `hunra`'s synonyms (`edit_metadata`). |
| hero | `corvi` courage, the only courage root | Hero = `corviyo` (section 8). |

Kept as roots although something nearby exists:

- **strangeness:** `loteronela` means "stranger", that is, another person.
- **veil:** `nibevimosan` means "hazy; veiled", but it is an adjective only.
- **wet:** `mirusan` means "watery; fluid".
- **sink:** `nevra` means "descent", not going under.

King and queen are not in your decision 1 list. They could be FEMALE / MALE +
`lirbu` (leader) later.

## 2. Section A: rulings and function words

New ruling ids continue from 1.2:G31.

- **1.2:G32, possession precedence** (refines 1.2:G27). The owner is decided
  in this order: a pronoun, then a personal name, then the default (in X `de`
  Y, Y is the owner). `Pilo de maivo` = my father. In PRONOUN `de` PRONOUN the
  right-hand pronoun is the owner: `taivo de maivo` = "you of mine".
- **1.2:G33, the instrumental preposition.** It takes a noun phrase and fills
  the ADJUNCTS slot. "With" as accompaniment stays `ko`. Spellings are in
  section 5.
- **1.2:G34, frequency correlatives.** A quantifier plus `-krono`:
  `muya-krono` (often), `poka-krono` (rarely), `rada-krono` (each time). The
  ruling covers `krono` only. These are the first correlatives built on a
  quantifier; the existing determiners are `eli ki nuna ola somi toda`. All
  three pass the checker.
- **1.2:G35, curated motion metaphors.** `revo-sabesia` (recognize; "know
  again") and `yave-donuda` (share; "give together") join `revo-vimova` and
  `revo-lirala`. The parser already reads both as prefix + verb, the intended
  reading. The prefixes stay non-productive.
- **1.2:G36, gender in kinship (new, from decision 1).** Kinship words are
  neutral. Gender is marked with a FEMALE / MALE compound where one exists, and
  otherwise with the adjective. *By marriage* compounds the same way.

**Example sentences.** These use existing words and the first-choice
instrumental. They are drafts; Phase 3 runs every example through the editor's
checker before it is stored.

| Liraasa | English |
|---|---|
| `Maivo lallela li dorbi yuta li kemye.` | I open the door with the key. |
| `Li lirayo po yugemeyiya saivo yuta melo.` | The singer healed him with music. |
| `Saivori po ka vazranasan yuta benamolu.` | They were defeated with kindness. |

There is **no verb "to defeat"**. The nearest words are `vazra` (success),
`vazrana` (defeat) and `vazranasan` (defeated), so the third gloss becomes a
passive. "Defeat" could be a later root.

## 3. Section B: reglosses

| Item | Form | Now | Proposed |
|---|---|---|---|
| B1 | `daigosan` (`daigo` adj.) | Murderous, perilous | dead; mortal. The old sense goes to `legacy.archived_senses`. |
| B2 | `noruna` (`noru` neg.) | wakefulness (the same as `somuna`) | disillusionment; waking from a dream |
| B3 | `devorivona` (`devorivo` neg.) | a severed marriage bond | divorce; a marriage bond severed by choice |
| B4 | `sabeasa` | — (unused) | wisdom |
| B4 | `sabeasasan` | — (unused) | wise |
| B4 | `monrunasan` | — (unused) | flat (`monruna` is already "flatland") |
| B4 | `menhanasan` | — (unused) | **Skipped.** `menha` is "jaw", so "loose" isn't predictable from it. |

## 4. New roots

### 4.1 From your decisions

#### female · People

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **minva** | MIN-va | `minvama` | `finra` 2, `melva` 2, `menha` 2, `milra` 2 | pass; new rhyme -inva |
| B | **yile** | YI-le | `yileya` | `bire` 2, `filse` 2, `fime` 2, `fule` 2 | pass; new rhyme -yile |
| C | **linva** | LIN-va | `linvala` | `finra` 2, `lanve` 2, `lenra` 2, `leva` 2 | pass; new rhyme -inva |

Draft glosses, shown on option A (`minva`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `minva` | woman; the feminine |
| R+asa | `minvaasa` | the divine feminine ✱ |
| R+na | `minvana` | — (unused) |
| VERB | `minvama` | — (unused) |
| R+nasan | `minvanasan` | — (unused) |
| R+san | `minvasan` | female; feminine |
| R+asasan | `minvaasasan` | — (unused) |

#### male · People

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **tarnu** | TAR-nu | `tarnuta` | `banu` 2, `barni` 2, `darno` 2, `faru` 2 | pass; new rhyme -arnu |
| B | **dalbo** | DAL-bo | `dalboda` | `balbu` 2, `daigo` 2, `dalu` 2, `darno` 2 | pass; new rhyme -albo |
| C | **tondu** | TON-du | `tonduta` | `bodu` 2, `dendu` 2, `donu` 2, `monru` 2 | pass; new rhyme -ondu |

Draft glosses, shown on option A (`tarnu`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `tarnu` | man; the masculine |
| R+asa | `tarnuasa` | the divine masculine ✱ |
| R+na | `tarnuna` | — (unused) |
| VERB | `tarnuta` | — (unused) |
| R+nasan | `tarnunasan` | — (unused) |
| R+san | `tarnusan` | male; masculine |
| R+asasan | `tarnuasasan` | — (unused) |

#### by marriage · Family & society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **rilde** | RIL-de | `rildera` | `filse` 2, `lelde` 2, `milve` 2, `rale` 2 | pass; new rhyme -ilde |
| B | **nilde** | NIL-de | `nildenia` | `filse` 2, `lelde` 2, `milve` 2, `nibe` 2 | pass; new rhyme -ilde |
| C | **rinde** | RIN-de | `rindera` | `kende` 2, `ranbe` 2, `rinba` 2, `bimne` 3 | pass; new rhyme -inde |

Draft glosses, shown on option A (`rilde`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `rilde` | kinship by marriage; affinity |
| R+asa | `rildeasa` | the joining of two families ✱ |
| R+na | `rildena` | — (unused) |
| VERB | `rildera` | to become kin by marriage ✱ |
| R+nasan | `rildenasan` | — (unused) |
| R+san | `rildesan` | related by marriage; in-law |
| R+asasan | `rildeasasan` | — (unused) |

#### kill · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **karko** | KAR-ko | `karkoka` | `darno` 2, `kaldo` 2, `larbo` 2, `narvo` 2 | pass; new rhyme -arko |
| B | **zurka** | ZUR-ka | `zurkaza` | `gura` 2, `luka` 2, `purma` 2, `turna` 2 | pass; new rhyme -urka |
| C | **galku** | GAL-ku | `galkuga` | `balbu` 2, `dalu` 2, `gagu` 2, `galsa` 2 | pass; new rhyme -alku |

Draft glosses, shown on option A (`karko`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `karko` | killing; slaying |
| R+asa | `karkoasa` | — (unused) |
| R+na | `karkona` | sparing; a life spared ✱ |
| VERB | `karkoka` | to kill; to slay |
| R+nasan | `karkonasan` | — (unused) |
| R+san | `karkosan` | deadly; lethal |
| R+asasan | `karkoasasan` | — (unused) |

#### grave · Storytelling

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **tomnu** | TOM-nu | `tomnuta` | `cemnu` 2, `domlu` 2, `donu` 2, `jomru` 2 | pass; new rhyme -omnu |
| B | **dulmo** | DUL-mo | `dulmoda` | `gulma` 2, `nullo` 2, `numo` 2, `sulme` 2 | pass; new rhyme -ulmo |
| C | **bumno** | BUM-no | `bumnoba` | `bimne` 2, `bumre` 2, `buvo` 2, `luno` 2 | pass; new rhyme -umno |

Draft glosses, shown on option A (`tomnu`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `tomnu` | grave; tomb; burial place |
| R+asa | `tomnuasa` | the resting place of all who have lived ✱ |
| R+na | `tomnuna` | — (unused) |
| VERB | `tomnuta` | to bury; to inter |
| R+nasan | `tomnunasan` | — (unused) |
| R+san | `tomnusan` | buried; entombed |
| R+asasan | `tomnuasasan` | — (unused) |

### 4.2 Tier 1

#### drum · Music & storytelling

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **dumdo** | DUM-do | `dumdoda` | `demro` 2, `numo` 2, `bumre` 3, `buvo` 3 | pass; new rhyme -umdo |
| B | **kumda** | KUM-da | `kumdaka` | `kulpa` 2, `lumra` 2, `suma` 2, `vuda` 2 | pass; new rhyme -umda |
| C | **bumba** | BUM-ba | `bumbaba` | `baba` 2, `bemya` 2, `bioba` 2, `bumre` 2 | pass; new rhyme -umba |

Draft glosses, shown on option A (`dumdo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `dumdo` | drum |
| R+asa | `dumdoasa` | the heartbeat of the world |
| R+na | `dumdona` | — (unused) |
| VERB | `dumdoda` | to drum; to beat |
| R+nasan | `dumdonasan` | — (unused) |
| R+san | `dumdosan` | pounding; rhythmic |
| R+asasan | `dumdoasasan` | — (unused) |

#### reed · Flowers & Plants

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **filvi** | FIL-vi | `filvifa` | `cilni` 2, `farvi` 2, `filse` 2, `fini` 2 | pass; new rhyme -ilvi |
| B | **pilfe** | PIL-fe | `pilfepa` | `filse` 2, `milve` 2, `pifu` 2, `pilo` 2 | pass; new rhyme -ilfe |
| C | **virle** | VIR-le | `virleva` | `bire` 2, `sirla` 2, `vamle` 2, `varde` 2 | pass; new rhyme -irle |

Draft glosses, shown on option A (`filvi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `filvi` | reed |
| R+asa | `filviasa` | — (unused) |
| R+na | `filvina` | — (unused) |
| VERB | `filvifa` | to pipe |
| R+nasan | `filvinasan` | — (unused) |
| R+san | `filvisan` | reedy; thin-voiced |
| R+asasan | `filviasasan` | — (unused) |

#### horizon · Space & orientation

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **lanla** | LAN-la | `lanlala` | `ala` 2, `farla` 2, `lalle` 2, `lalnila` 2 | pass; new rhyme -anla |
| B | **nanlo** | NAN-lo | `nanlonia` | `lanto` 2, `lavlo` 2, `malo` 2, `manli` 2 | pass; new rhyme -anlo |
| C | **lonla** | LON-la | `lonlala` | `lenila` 2, `lenra` 2, `linula` 2, `lomola` 2 | pass; new rhyme -onla |

Draft glosses, shown on option A (`lanla`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `lanla` | horizon |
| R+asa | `lanlaasa` | the edge of the world |
| R+na | `lanlana` | — (unused) |
| VERB | `lanlala` | — (unused) |
| R+nasan | `lanlanasan` | — (unused) |
| R+san | `lanlasan` | far-reaching |
| R+asasan | `lanlaasasan` | — (unused) |

#### veil · Home & objects

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **velso** | VEL-so | `velsova` | `lelko` 2, `lelsu` 2, `melo` 2, `menso` 2 | pass; new rhyme -elso |
| B | **hilsa** | HIL-sa | `hilsaha` | `filse` 2, `fisa` 2, `galsa` 2, `halra` 2 | pass; new rhyme -ilsa |
| C | **hilva** | HIL-va | `hilvaha` | `halra` 2, `helna` 2, `helvi` 2, `hifa` 2 | pass; new rhyme -ilva |

Draft glosses, shown on option A (`velso`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `velso` | veil |
| R+asa | `velsoasa` | the veil between worlds |
| R+na | `velsona` | unveiling; revelation |
| VERB | `velsova` | to veil |
| R+nasan | `velsonasan` | — (unused) |
| R+san | `velsosan` | veiled |
| R+asasan | `velsoasasan` | — (unused) |

#### madness · Mind & dreams

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **zirki** | ZIR-ki | `zirkiza` | `viki` 2, `zira` 2, `azuri` 3, `barni` 3 | pass; new rhyme -irki |
| B | **hirzi** | HIR-zi | `hirziha` | `hirna` 2, `hiro` 2, `hozi` 2, `rizi` 2 | pass; new rhyme -irzi |
| C | **jirka** | JIR-ka | `jirkaja` | `hirna` 2, `lira` 2, `sirla` 2, `zira` 2 | pass; new rhyme -irka |

Draft glosses, shown on option A (`zirki`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `zirki` | madness |
| R+asa | `zirkiasa` | divine frenzy |
| R+na | `zirkina` | sanity |
| VERB | `zirkiza` | — (unused) |
| R+nasan | `zirkinasan` | sane |
| R+san | `zirkisan` | mad |
| R+asasan | `zirkiasasan` | — (unused) |

#### pour · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **lurva** | LUR-va | `lurvala` | `dorva` 2, `gura` 2, `larda` 2, `leva` 2 | pass; new rhyme -urva |
| B | **rulvo** | RUL-vo | `rulvora` | `buvo` 2, `nullo` 2, `nulva` 2, `ralno` 2 | pass; new rhyme -ulvo |
| C | **yurva** | YUR-va | `yurvaya` | `dorva` 2, `gura` 2, `musva` 2, `nulva` 2 | pass; new rhyme -urva |

Draft glosses, shown on option A (`lurva`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `lurva` | pouring |
| R+asa | `lurvaasa` | outpouring |
| R+na | `lurvana` | — (unused) |
| VERB | `lurvala` | to pour |
| R+nasan | `lurvanasan` | — (unused) |
| R+san | `lurvasan` | — (unused) |
| R+asasan | `lurvaasasan` | — (unused) |

#### fold · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **filpa** | FIL-pa | `filpafa` | `felra` 2, `filse` 2, `finra` 2, `fisa` 2 | pass; new rhyme -ilpa |
| B | **belpo** | BEL-po | `belpoba` | `belda` 2, `belfi` 2, `belru` 2, `lelko` 2 | pass; new rhyme -elpo |
| C | **pelpo** | PEL-po | `pelpopa` | `lelko` 2, `melo` 2, `nerpo` 2, `peli` 2 | pass; new rhyme -elpo |

Draft glosses, shown on option A (`filpa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `filpa` | fold |
| R+asa | `filpaasa` | — (unused) |
| R+na | `filpana` | unfolding |
| VERB | `filpafa` | to fold |
| R+nasan | `filpanasan` | — (unused) |
| R+san | `filpasan` | folded |
| R+asasan | `filpaasasan` | — (unused) |

#### carve · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **kerti** | KER-ti | `kertika` | `derdi` 2, `erta` 2, `kenvi` 2, `kepi` 2 | pass; new rhyme -erti |
| B | **girta** | GIR-ta | `girtaga` | `erta` 2, `germa` 2, `gura` 2, `hirna` 2 | pass; new rhyme -irta |
| C | **kerda** | KER-da | `kerdaka` | `belda` 2, `derdi` 2, `erta` 2, `germa` 2 | pass; new rhyme -erda |

Draft glosses, shown on option A (`kerti`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `kerti` | carving; engraving |
| R+asa | `kertiasa` | — (unused) |
| R+na | `kertina` | — (unused) |
| VERB | `kertika` | to carve; to engrave |
| R+nasan | `kertinasan` | — (unused) |
| R+san | `kertisan` | carved; engraved |
| R+asasan | `kertiasasan` | — (unused) |

#### wing · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **nalfa** | NAL-fa | `nalfania` | `ala` 2, `galsa` 2, `halra` 2, `lulfa` 2 | pass; new rhyme -alfa |
| B | **salfi** | SAL-fi | `salfisia` | `belfi` 2, `lalni` 2, `palvi` 2, `sabri` 2 | pass; new rhyme -alfi |
| C | **falfa** | FAL-fa | `falfafa` | `ala` 2, `falne` 2, `falnefa` 2, `fama` 2 | pass; new rhyme -alfa |

Draft glosses, shown on option A (`nalfa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `nalfa` | wing |
| R+asa | `nalfaasa` | — (unused) |
| R+na | `nalfana` | — (unused) |
| VERB | `nalfania` | — (unused) |
| R+nasan | `nalfanasan` | — (unused) |
| R+san | `nalfasan` | winged |
| R+asasan | `nalfaasasan` | — (unused) |

#### feather · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **pulmi** | PUL-mi | `pulmipa` | `bulli` 2, `gulma` 2, `lolmi` 2, `lumi` 2 | pass; new rhyme -ulmi |
| B | **hulmi** | HUL-mi | `hulmiha` | `bulli` 2, `gulma` 2, `helvi` 2, `hume` 2 | pass; new rhyme -ulmi |
| C | **fulmi** | FUL-mi | `fulmifa` | `bulli` 2, `folni` 2, `fule` 2, `fuyi` 2 | pass; new rhyme -ulmi |

Draft glosses, shown on option A (`pulmi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `pulmi` | feather |
| R+asa | `pulmiasa` | — (unused) |
| R+na | `pulmina` | — (unused) |
| VERB | `pulmipa` | — (unused) |
| R+nasan | `pulminasan` | — (unused) |
| R+san | `pulmisan` | feathered; feathery |
| R+asasan | `pulmiasasan` | — (unused) |

### 4.3 Tier 2

#### tail · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **vurvi** | VUR-vi | `vurviva` | `corvi` 2, `farvi` 2, `jurevi` 2, `nurmi` 2 | pass; new rhyme -urvi |
| B | **surli** | SUR-li | `surlisia` | `bulli` 2, `kureli` 2, `narli` 2, `nurmi` 2 | pass; new rhyme -urli |
| C | **nurve** | NUR-ve | `nurvenia` | `narvo` 2, `nulva` 2, `nuravu` 2, `nurmi` 2 | pass; new rhyme -urve |

Draft glosses, shown on option A (`vurvi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `vurvi` | tail |
| R+asa | `vurviasa` | — (unused) |
| R+na | `vurvina` | — (unused) |
| VERB | `vurviva` | — (unused) |
| R+nasan | `vurvinasan` | — (unused) |
| R+san | `vurvisan` | tailed |
| R+asasan | `vurviasasan` | — (unused) |

#### claw · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **kalga** | KAL-ga | `kalgaka` | `ala` 2, `galsa` 2, `halra` 2, `kaldo` 2 | pass; new rhyme -alga |
| B | **garki** | GAR-ki | `garkiga` | `barni` 2, `farvi` 2, `narli` 2, `pari` 2 | pass; new rhyme -arki |
| C | **garka** | GAR-ka | `garkaga` | `farla` 2, `galsa` 2, `germa` 2, `gura` 2 | pass; new rhyme -arka |

Draft glosses, shown on option A (`kalga`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `kalga` | claw; talon |
| R+asa | `kalgaasa` | — (unused) |
| R+na | `kalgana` | — (unused) |
| VERB | `kalgaka` | to claw |
| R+nasan | `kalganasan` | — (unused) |
| R+san | `kalgasan` | clawed |
| R+asasan | `kalgaasasan` | — (unused) |

#### fur · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **mulfo** | MUL-fo | `mulfoma` | `lulfa` 2, `malo` 2, `melo` 2, `milno` 2 | pass; new rhyme -ulfo |
| B | **fofu** | FO-fu | `fofufa` | `bodu` 2, `donu` 2, `faru` 2, `fefe` 2 | pass; new rhyme -fofu |
| C | **fulfo** | FUL-fo | `fulfofa` | `fule` 2, `fulefa` 2, `furo` 2, `lulfa` 2 | pass; new rhyme -ulfo |

Draft glosses, shown on option A (`mulfo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `mulfo` | fur; pelt |
| R+asa | `mulfoasa` | — (unused) |
| R+na | `mulfona` | — (unused) |
| VERB | `mulfoma` | — (unused) |
| R+nasan | `mulfonasan` | — (unused) |
| R+san | `mulfosan` | furred; furry |
| R+asasan | `mulfoasasan` | — (unused) |

#### beak · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **pirke** | PIR-ke | `pirkepa` | `bire` 2, `bimne` 3, `cere` 3, `filse` 3 | pass; new rhyme -irke |
| B | **bilke** | BIL-ke | `bilkeba` | `bimne` 2, `bire` 2, `filse` 2, `milve` 2 | pass; new rhyme -ilke |
| C | **pite** | PI-te | `pitepa` | `bire` 2, `biti` 2, `bote` 2, `fime` 2 | pass; new rhyme -pite |

Draft glosses, shown on option A (`pirke`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `pirke` | beak |
| R+asa | `pirkeasa` | — (unused) |
| R+na | `pirkena` | — (unused) |
| VERB | `pirkepa` | to peck |
| R+nasan | `pirkenasan` | — (unused) |
| R+san | `pirkesan` | beaked |
| R+asasan | `pirkeasasan` | — (unused) |

#### horn · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **kurno** | KUR-no | `kurnoka` | `darno` 2, `furo` 2, `krono` 2, `luno` 2 | pass; new rhyme -urno |
| B | **gurmo** | GUR-mo | `gurmoga` | `furo` 2, `germa` 2, `gulma` 2, `gura` 2 | pass; new rhyme -urmo |
| C | **korna** | KOR-na | `kornaka` | `amorna` 2, `dorva` 2, `hirna` 2, `korsi` 2 | pass; new rhyme -orna |

Draft glosses, shown on option A (`kurno`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `kurno` | horn |
| R+asa | `kurnoasa` | — (unused) |
| R+na | `kurnona` | — (unused) |
| VERB | `kurnoka` | — (unused) |
| R+nasan | `kurnonasan` | — (unused) |
| R+san | `kurnosan` | horned |
| R+asasan | `kurnoasasan` | — (unused) |

#### scale · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **zelki** | ZEL-ki | `zelkiza` | `belfi` 2, `eli` 2, `helvi` 2, `lelhi` 2 | pass; new rhyme -elki |
| B | **zilka** | ZIL-ka | `zilkaza` | `milra` 2, `ralka` 2, `silda` 2, `tilma` 2 | pass; new rhyme -ilka |
| C | **tika** | TI-ka | `tikata` | `fisa` 2, `hifa` 2, `ka` 2, `lira` 2 | pass; new rhyme -tika |

Draft glosses, shown on option A (`zelki`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `zelki` | scale (of a fish or serpent) |
| R+asa | `zelkiasa` | — (unused) |
| R+na | `zelkina` | — (unused) |
| VERB | `zelkiza` | — (unused) |
| R+nasan | `zelkinasan` | — (unused) |
| R+san | `zelkisan` | scaled; scaly |
| R+asasan | `zelkiasasan` | — (unused) |

#### wet · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **mulyi** | MUL-yi | `mulyima` | `bulli` 2, `fuyi` 2, `melli` 2, `meyi` 2 | pass; new rhyme -ulyi |
| B | **nulye** | NUL-ye | `nulyenia` | `fule` 2, `nole` 2, `nullo` 2, `nulu` 2 | pass; new rhyme -ulye |
| C | **lulyi** | LUL-yi | `lulyila` | `bulli` 2, `fuyi` 2, `lalni` 2, `lelhi` 2 | pass; new rhyme -ulyi |

Draft glosses, shown on option A (`mulyi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `mulyi` | wetness |
| R+asa | `mulyiasa` | — (unused) |
| R+na | `mulyina` | — (unused) |
| VERB | `mulyima` | to wet |
| R+nasan | `mulyinasan` | — (unused) |
| R+san | `mulyisan` | wet |
| R+asasan | `mulyiasasan` | — (unused) |

#### smooth · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **nilmi** | NIL-mi | `nilminia` | `cilni` 2, `lolmi` 2, `nami` 2, `nilvu` 2 | pass; new rhyme -ilmi |
| B | **lulne** | LUL-ne | `lulnela` | `falne` 2, `fule` 2, `lalle` 2, `lalni` 2 | pass; new rhyme -ulne |
| C | **lilme** | LIL-me | `lilmela` | `filse` 2, `fime` 2, `lalle` 2, `lelde` 2 | pass; new rhyme -ilme |

Draft glosses, shown on option A (`nilmi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `nilmi` | smoothness |
| R+asa | `nilmiasa` | — (unused) |
| R+na | `nilmina` | — (unused) |
| VERB | `nilminia` | to smooth |
| R+nasan | `nilminasan` | rough |
| R+san | `nilmisan` | smooth |
| R+asasan | `nilmiasasan` | — (unused) |

#### thick · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **burdo** | BUR-do | `burdoba` | `buvo` 2, `furo` 2, `vurlo` 2, `yordo` 2 | pass; new rhyme -urdo |
| B | **donba** | DON-ba | `donbada` | `donu` 2, `donuda` 2, `donuna` 2, `dorbi` 2 | pass; new rhyme -onba |
| C | **domba** | DOM-ba | `dombada` | `damva` 2, `domlu` 2, `dorbi` 2, `dorva` 2 | pass; new rhyme -omba |

Draft glosses, shown on option A (`burdo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `burdo` | thickness |
| R+asa | `burdoasa` | — (unused) |
| R+na | `burdona` | — (unused) |
| VERB | `burdoba` | — (unused) |
| R+nasan | `burdonasan` | thin |
| R+san | `burdosan` | thick |
| R+asasan | `burdoasasan` | — (unused) |

#### sour · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **zeti** | ZE-ti | `zetiza` | `biti` 2, `eli` 2, `kepi` 2, `leni` 2 | pass; new rhyme -zeti |
| B | **zinta** | ZIN-ta | `zintaza` | `centa` 2, `finra` 2, `intra` 2, `minota` 2 | pass; new rhyme -inta |
| C | **kita** | KI-ta | `kitaka` | `ata` 2, `biti` 2, `erta` 2, `fisa` 2 | pass; new rhyme -kita |

Draft glosses, shown on option A (`zeti`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `zeti` | sourness |
| R+asa | `zetiasa` | — (unused) |
| R+na | `zetina` | — (unused) |
| VERB | `zetiza` | — (unused) |
| R+nasan | `zetinasan` | — (unused) |
| R+san | `zetisan` | sour |
| R+asasan | `zetiasasan` | — (unused) |

#### float · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **lalfo** | LAL-fo | `lalfola` | `kaldo` 2, `lalle` 2, `lalni` 2, `lalvu` 2 | pass; new rhyme -alfo |
| B | **fona** | FO-na | `fonafa` | `bena` 2, `biona` 2, `coda` 2, `cono` 2 | pass; new rhyme -fona |
| C | **nelfo** | NEL-fo | `nelfonia` | `belfi` 2, `lelko` 2, `melo` 2, `nela` 2 | pass; new rhyme -elfo |

Draft glosses, shown on option A (`lalfo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `lalfo` | floating |
| R+asa | `lalfoasa` | — (unused) |
| R+na | `lalfona` | — (unused) |
| VERB | `lalfola` | to float |
| R+nasan | `lalfonasan` | — (unused) |
| R+san | `lalfosan` | floating; buoyant |
| R+asasan | `lalfoasasan` | — (unused) |

#### sink · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **nombu** | NOM-bu | `nombunia` | `domlu` 2, `jomru` 2, `lombi` 2, `nimu` 2 | pass; new rhyme -ombu |
| B | **nurbo** | NUR-bo | `nurbonia` | `furo` 2, `larbo` 2, `mubo` 2, `narvo` 2 | pass; new rhyme -urbo |
| C | **nomdu** | NOM-du | `nomdunia` | `bodu` 2, `domlu` 2, `jomru` 2, `nedu` 2 | pass; new rhyme -omdu |

Draft glosses, shown on option A (`nombu`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `nombu` | sinking |
| R+asa | `nombuasa` | — (unused) |
| R+na | `nombuna` | — (unused) |
| VERB | `nombunia` | to sink |
| R+nasan | `nombunasan` | — (unused) |
| R+san | `nombusan` | sunken |
| R+asasan | `nombuasasan` | — (unused) |

#### dig · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **turgo** | TUR-go | `turgota` | `furo` 2, `lorgo` 2, `turna` 2, `vurlo` 2 | pass; new rhyme -urgo |
| B | **dulga** | DUL-ga | `dulgada` | `duvla` 2, `gulma` 2, `kulpa` 2, `lelga` 2 | pass; new rhyme -ulga |
| C | **kurga** | KUR-ga | `kurgaka` | `gura` 2, `guraga` 2, `kulpa` 2, `purma` 2 | pass; new rhyme -urga |

Draft glosses, shown on option A (`turgo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `turgo` | digging |
| R+asa | `turgoasa` | — (unused) |
| R+na | `turgona` | — (unused) |
| VERB | `turgota` | to dig |
| R+nasan | `turgonasan` | — (unused) |
| R+san | `turgosan` | dug |
| R+asasan | `turgoasasan` | — (unused) |

#### split · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **kirpa** | KIR-pa | `kirpaka` | `hirna` 2, `kulpa` 2, `lira` 2, `sirla` 2 | pass; new rhyme -irpa |
| B | **tirpe** | TIR-pe | `tirpeta` | `bire` 2, `tise` 2, `bimne` 3, `cere` 3 | pass; new rhyme -irpe |
| C | **cirpe** | CIR-pe | `cirpeca` | `bire` 2, `cere` 2, `bimne` 3, `cilni` 3 | pass; new rhyme -irpe |

Draft glosses, shown on option A (`kirpa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `kirpa` | split; cleft |
| R+asa | `kirpaasa` | — (unused) |
| R+na | `kirpana` | — (unused) |
| VERB | `kirpaka` | to split |
| R+nasan | `kirpanasan` | — (unused) |
| R+san | `kirpasan` | split; cloven |
| R+asasan | `kirpaasasan` | — (unused) |

#### weave · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **tenva** | TEN-va | `tenvata` | `bena` 2, `centa` 2, `kenvi` 2, `lenra` 2 | pass; new rhyme -enva |
| B | **yenva** | YEN-va | `yenvaya` | `bena` 2, `centa` 2, `kenvi` 2, `lenra` 2 | pass; new rhyme -enva |
| C | **terva** | TER-va | `tervata` | `dorva` 2, `erta` 2, `germa` 2, `leva` 2 | pass; new rhyme -erva |

Draft glosses, shown on option A (`tenva`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `tenva` | weaving |
| R+asa | `tenvaasa` | — (unused) |
| R+na | `tenvana` | — (unused) |
| VERB | `tenvata` | to weave |
| R+nasan | `tenvanasan` | — (unused) |
| R+san | `tenvasan` | woven |
| R+asasan | `tenvaasasan` | — (unused) |

#### wipe · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **sispa** | SIS-pa | `sispasia` | `fisa` 2, `sasva` 2, `sesa` 2, `silda` 2 | pass; new rhyme -ispa |
| B | **fespa** | FES-pa | `fespafa` | `felra` 2, `fesmo` 2, `fisa` 2, `lesma` 2 | pass; new rhyme -espa |
| C | **faspo** | FAS-po | `faspofa` | `fasbi` 2, `fato` 2, `favro` 2, `fesmo` 2 | pass; new rhyme -aspo |

Draft glosses, shown on option A (`sispa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `sispa` | wiping |
| R+asa | `sispaasa` | — (unused) |
| R+na | `sispana` | — (unused) |
| VERB | `sispasia` | to wipe |
| R+nasan | `sispanasan` | — (unused) |
| R+san | `sispasan` | wiped |
| R+asasan | `sispaasasan` | — (unused) |

#### scratch · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **girze** | GIR-ze | `girzega` | `bire` 2, `bimne` 3, `cere` 3, `filse` 3 | pass; new rhyme -irze |
| B | **kirze** | KIR-ze | `kirzeka` | `bire` 2, `bimne` 3, `cere` 3, `filse` 3 | pass; new rhyme -irze |
| C | **cirza** | CIR-za | `cirzaca` | `hirna` 2, `lira` 2, `morza` 2, `sirla` 2 | pass; new rhyme -irza |

Draft glosses, shown on option A (`girze`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `girze` | scratch |
| R+asa | `girzeasa` | — (unused) |
| R+na | `girzena` | — (unused) |
| VERB | `girzega` | to scratch |
| R+nasan | `girzenasan` | — (unused) |
| R+san | `girzesan` | scratched |
| R+asasan | `girzeasasan` | — (unused) |

#### spit · Actions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **pusti** | PUS-ti | `pustipa` | `musi` 2, `pesbi` 2, `pusa` 2, `biti` 3 | pass; new rhyme -usti |
| B | **tupo** | TU-po | `tupota` | `supo` 1, `buvo` 2, `furo` 2, `hupi` 2 | pass; new rhyme -tupo |
| C | **pufti** | PUF-ti | `puftipa` | `biti` 3, `bulli` 3, `futu` 3, `fututi` 3 | pass; new rhyme -ufti |

Draft glosses, shown on option A (`pusti`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `pusti` | spit; spittle |
| R+asa | `pustiasa` | — (unused) |
| R+na | `pustina` | — (unused) |
| VERB | `pustipa` | to spit |
| R+nasan | `pustinasan` | — (unused) |
| R+san | `pustisan` | — (unused) |
| R+asasan | `pustiasasan` | — (unused) |

#### ghost · Storytelling

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **volme** | VOL-me | `volmeva` | `gome` 2, `lolmi` 2, `lolte` 2, `nole` 2 | pass; new rhyme -olme |
| B | **folme** | FOL-me | `folmefa` | `falne` 2, `felbe` 2, `filse` 2, `fime` 2 | pass; new rhyme -olme |
| C | **folve** | FOL-ve | `folvefa` | `falne` 2, `felbe` 2, `filse` 2, `fohe` 2 | pass; new rhyme -olve |

Draft glosses, shown on option A (`volme`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `volme` | ghost; spirit of the dead |
| R+asa | `volmeasa` | — (unused) |
| R+na | `volmena` | — (unused) |
| VERB | `volmeva` | — (unused) |
| R+nasan | `volmenasan` | — (unused) |
| R+san | `volmesan` | ghostly |
| R+asasan | `volmeasasan` | — (unused) |

#### magic · Storytelling

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **zirme** | ZIR-me | `zirmeza` | `bire` 2, `fime` 2, `zarmo` 2, `zavme` 2 | pass; new rhyme -irme |
| B | **mirme** | MIR-me | `mirmema` | `bire` 2, `fime` 2, `mare` 2, `menme` 2 | pass; new rhyme -irme |
| C | **marmi** | MAR-mi | `marmima` | `barni` 2, `farvi` 2, `lermi` 2, `madi` 2 | pass; new rhyme -armi |

Draft glosses, shown on option A (`zirme`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `zirme` | magic |
| R+asa | `zirmeasa` | — (unused) |
| R+na | `zirmena` | — (unused) |
| VERB | `zirmeza` | to work magic; to enchant ✱ |
| R+nasan | `zirmenasan` | — (unused) |
| R+san | `zirmesan` | magical |
| R+asasan | `zirmeasasan` | — (unused) |

#### angel · Storytelling

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **lansi** | LAN-si | `lansila` | `kasi` 2, `lalni` 2, `lamsa` 2, `lanto` 2 | pass; new rhyme -ansi |
| B | **linle** | LIN-le | `linlela` | `lalle` 2, `lanve` 2, `linu` 2, `linula` 2 | pass; new rhyme -inle |
| C | **lenle** | LEN-le | `lenlela` | `kele` 2, `kende` 2, `lalle` 2, `lanve` 2 | pass; new rhyme -enle |

Draft glosses, shown on option A (`lansi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `lansi` | angel |
| R+asa | `lansiasa` | — (unused) |
| R+na | `lansina` | — (unused) |
| VERB | `lansila` | — (unused) |
| R+nasan | `lansinasan` | — (unused) |
| R+san | `lansisan` | angelic |
| R+asasan | `lansiasasan` | — (unused) |

#### spider · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **tilki** | TIL-ki | `tilkita` | `cilni` 2, `rilli` 2, `sili` 2, `tali` 2 | pass; new rhyme -ilki |
| B | **kilki** | KIL-ki | `kilkika` | `cilni` 2, `rilli` 2, `sili` 2, `viki` 2 | pass; new rhyme -ilki |
| C | **tilti** | TIL-ti | `tiltita` | `biti` 2, `cilni` 2, `rilli` 2, `sili` 2 | pass; new rhyme -ilti |

Draft glosses, shown on option A (`tilki`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `tilki` | spider |
| R+asa | `tilkiasa` | — (unused) |
| R+na | `tilkina` | — (unused) |
| VERB | `tilkita` | — (unused) |
| R+nasan | `tilkinasan` | — (unused) |
| R+san | `tilkisan` | — (unused) |
| R+asasan | `tilkiasasan` | — (unused) |

#### fox · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **vurfa** | VUR-fa | `vurfava` | `furofa` 2, `gura` 2, `lulfa` 2, `purma` 2 | pass; new rhyme -urfa |
| B | **rorfi** | ROR-fi | `rorfira` | `corvi` 2, `dorbi` 2, `korsi` 2, `lordi` 2 | pass; new rhyme -orfi |
| C | **rorfa** | ROR-fa | `rorfara` | `dorva` 2, `molfa` 2, `morza` 2, `ranfa` 2 | pass; new rhyme -orfa |

Draft glosses, shown on option A (`vurfa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `vurfa` | fox |
| R+asa | `vurfaasa` | — (unused) |
| R+na | `vurfana` | — (unused) |
| VERB | `vurfava` | — (unused) |
| R+nasan | `vurfanasan` | — (unused) |
| R+san | `vurfasan` | foxlike ✱ |
| R+asasan | `vurfaasasan` | — (unused) |

#### lion · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **garvu** | GAR-vu | `garvuga` | `danvu` 2, `faru` 2, `farvi` 2, `gagu` 2 | pass; new rhyme -arvu |
| B | **borma** | BOR-ma | `bormaba` | `dorva` 2, `germa` 2, `morza` 2, `noma` 2 | pass; new rhyme -orma |
| C | **lerba** | LER-ba | `lerbala` | `erta` 2, `germa` 2, `larbo` 2, `larda` 2 | pass; new rhyme -erba |

Draft glosses, shown on option A (`garvu`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `garvu` | lion |
| R+asa | `garvuasa` | — (unused) |
| R+na | `garvuna` | — (unused) |
| VERB | `garvuga` | — (unused) |
| R+nasan | `garvunasan` | — (unused) |
| R+san | `garvusan` | leonine |
| R+asasan | `garvuasasan` | — (unused) |

#### lamb · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **limli** | LIM-li | `limlila` | `famli` 2, `lisi` 2, `lombi` 2, `lumi` 2 | pass; new rhyme -imli |
| B | **yimi** | YI-mi | `yimiya` | `biti` 2, `fime` 2, `fini` 2, `lisi` 2 | pass; new rhyme -yimi |
| C | **nimli** | NIM-li | `nimlinia` | `famli` 2, `nami` 2, `narli` 2, `nimu` 2 | pass; new rhyme -imli |

Draft glosses, shown on option A (`limli`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `limli` | lamb |
| R+asa | `limliasa` | — (unused) |
| R+na | `limlina` | — (unused) |
| VERB | `limlila` | — (unused) |
| R+nasan | `limlinasan` | — (unused) |
| R+san | `limlisan` | lamblike ✱ |
| R+asasan | `limliasasan` | — (unused) |

#### mouse · Animals

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **cipi** | CI-pi | `cipica` | `biti` 2, `cilni` 2, `fini` 2, `hupi` 2 | pass; new rhyme -cipi |
| B | **tute** | TU-te | `tuteta` | `bote` 2, `fule` 2, `futu` 2, `hume` 2 | pass; new rhyme -tute |
| C | **misti** | MIS-ti | `mistima` | `biti` 2, `lisi` 2, `mivi` 2, `musi` 2 | pass; new rhyme -isti |

Draft glosses, shown on option A (`cipi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `cipi` | mouse |
| R+asa | `cipiasa` | — (unused) |
| R+na | `cipina` | — (unused) |
| VERB | `cipica` | — (unused) |
| R+nasan | `cipinasan` | — (unused) |
| R+san | `cipisan` | — (unused) |
| R+asasan | `cipiasasan` | — (unused) |

#### sufficiency · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **bansa** | BAN-sa | `bansaba` | `baba` 2, `banu` 2, `banuasa` 2, `banuba` 2 | pass; new rhyme -ansa |
| B | **saste** | SAS-te | `sastesia` | `gase` 2, `sabe` 2, `salta` 2, `salye` 2 | pass; new rhyme -aste |
| C | **dasta** | DAS-ta | `dastada` | `ata` 2, `damva` 2, `dapa` 2, `dossa` 2 | pass; new rhyme -asta |

Draft glosses, shown on option A (`bansa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `bansa` | sufficiency; enough |
| R+asa | `bansaasa` | abundance |
| R+na | `bansana` | — (unused) |
| VERB | `bansaba` | to suffice ✱ |
| R+nasan | `bansanasan` | insufficient |
| R+san | `bansasan` | enough; sufficient |
| R+asasan | `bansaasasan` | — (unused) |

### 4.4 Tier 3

#### strangeness · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **hurvo** | HUR-vo | `hurvoha` | `buvo` 2, `furo` 2, `hiro` 2, `huvu` 2 | pass; new rhyme -urvo |
| B | **zorvu** | ZOR-vu | `zorvuza` | `corvi` 2, `dorva` 2, `lornu` 2, `lovu` 2 | pass; new rhyme -orvu |
| C | **zurvo** | ZUR-vo | `zurvoza` | `buvo` 2, `furo` 2, `narvo` 2, `vurlo` 2 | pass; new rhyme -urvo |

Draft glosses, shown on option A (`hurvo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `hurvo` | strangeness |
| R+asa | `hurvoasa` | the uncanny |
| R+na | `hurvona` | — (unused) |
| VERB | `hurvoha` | — (unused) |
| R+nasan | `hurvonasan` | — (unused) |
| R+san | `hurvosan` | strange |
| R+asasan | `hurvoasasan` | — (unused) |

#### ferocity · Emotions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **gargo** | GAR-go | `gargoga` | `daigo` 2, `darno` 2, `gagu` 2, `larbo` 2 | pass; new rhyme -argo |
| B | **darga** | DAR-ga | `dargada` | `dagi` 2, `daigo` 2, `damva` 2, `dapa` 2 | pass; new rhyme -arga |
| C | **garzo** | GAR-zo | `garzoga` | `darno` 2, `larbo` 2, `narvo` 2, `varo` 2 | pass; new rhyme -arzo |

Draft glosses, shown on option A (`gargo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `gargo` | ferocity |
| R+asa | `gargoasa` | — (unused) |
| R+na | `gargona` | — (unused) |
| VERB | `gargoga` | — (unused) |
| R+nasan | `gargonasan` | tame; gentle |
| R+san | `gargosan` | fierce |
| R+asasan | `gargoasasan` | — (unused) |

#### fame · Society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **sirmo** | SIR-mo | `sirmosia` | `hiro` 2, `silro` 2, `simvo` 2, `sirla` 2 | pass; new rhyme -irmo |
| B | **farme** | FAR-me | `farmefa` | `falne` 2, `fama` 2, `farla` 2, `faru` 2 | pass; new rhyme -arme |
| C | **rarme** | RAR-me | `rarmera` | `larne` 2, `mare` 2, `rale` 2, `ramu` 2 | pass; new rhyme -arme |

Draft glosses, shown on option A (`sirmo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `sirmo` | fame; renown |
| R+asa | `sirmoasa` | legend |
| R+na | `sirmona` | obscurity |
| VERB | `sirmosia` | — (unused) |
| R+nasan | `sirmonasan` | — (unused) |
| R+san | `sirmosan` | famous |
| R+asasan | `sirmoasasan` | — (unused) |

#### greed · Emotions

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **gerpe** | GER-pe | `gerpega` | `cere` 2, `germa` 2, `nerpo` 2, `verde` 2 | pass; new rhyme -erpe |
| B | **geri** | GE-ri | `geriga` | `cere` 2, `derdi` 2, `eli` 2, `germa` 2 | pass; new rhyme -geri |
| C | **gelpe** | GEL-pe | `gelpega` | `felbe` 2, `kele` 2, `lelde` 2, `selve` 2 | pass; new rhyme -elpe |

Draft glosses, shown on option A (`gerpe`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `gerpe` | greed |
| R+asa | `gerpeasa` | — (unused) |
| R+na | `gerpena` | contentment |
| VERB | `gerpega` | — (unused) |
| R+nasan | `gerpenasan` | — (unused) |
| R+san | `gerpesan` | greedy |
| R+asasan | `gerpeasasan` | — (unused) |

#### hollow · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **holmo** | HOL-mo | `holmoha` | `holba` 2, `hoyo` 2, `lolmi` 2, `lomo` 2 | pass; new rhyme -olmo |
| B | **homlo** | HOM-lo | `homloha` | `domlu` 2, `hemlu` 2, `hoyo` 2, `lomo` 2 | pass; new rhyme -omlo |
| C | **holvo** | HOL-vo | `holvoha` | `helvi` 2, `holba` 2, `hoyo` 2, `nosvo` 2 | pass; new rhyme -olvo |

Draft glosses, shown on option A (`holmo`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `holmo` | hollow; hollowness |
| R+asa | `holmoasa` | — (unused) |
| R+na | `holmona` | solidity |
| VERB | `holmoha` | — (unused) |
| R+nasan | `holmonasan` | — (unused) |
| R+san | `holmosan` | hollow |
| R+asasan | `holmoasasan` | — (unused) |

#### fragile · Qualities

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **felti** | FEL-ti | `feltifa` | `belfi` 2, `eli` 2, `felbe` 2, `felra` 2 | pass; new rhyme -elti |
| B | **firte** | FIR-te | `firtefa` | `bire` 2, `filse` 2, `fime` 2, `bimne` 3 | pass; new rhyme -irte |
| C | **firti** | FIR-ti | `firtifa` | `biti` 2, `farvi` 2, `fini` 2, `barni` 3 | pass; new rhyme -irti |

Draft glosses, shown on option A (`felti`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `felti` | fragility |
| R+asa | `feltiasa` | — (unused) |
| R+na | `feltina` | — (unused) |
| VERB | `feltifa` | — (unused) |
| R+nasan | `feltinasan` | sturdy |
| R+san | `feltisan` | fragile |
| R+asasan | `feltiasasan` | — (unused) |

#### shell · Nature

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **salko** | SAL-ko | `salkosia` | `kaldo` 2, `lelko` 2, `malo` 2, `ralka` 2 | pass; new rhyme -alko |
| B | **kolka** | KOL-ka | `kolkaka` | `holba` 2, `keleka` 2, `kova` 2, `kovaka` 2 | pass; new rhyme -olka |
| C | **colka** | COL-ka | `colkaca` | `coda` 2, `colbi` 2, `holba` 2, `molfa` 2 | pass; new rhyme -olka |

Draft glosses, shown on option A (`salko`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `salko` | shell |
| R+asa | `salkoasa` | pearl |
| R+na | `salkona` | — (unused) |
| VERB | `salkosia` | — (unused) |
| R+nasan | `salkonasan` | — (unused) |
| R+san | `salkosan` | guarded ✱ |
| R+asasan | `salkoasasan` | — (unused) |

#### crystal · Materials & physics

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **cirsi** | CIR-si | `cirsica` | `cilni` 2, `corvi` 2, `korsi` 2, `lisi` 2 | pass; new rhyme -irsi |
| B | **cirli** | CIR-li | `cirlica` | `cilni` 2, `corvi` 2, `narli` 2, `rilli` 2 | pass; new rhyme -irli |
| C | **sirsi** | SIR-si | `sirsisia` | `korsi` 2, `lisi` 2, `sarbi` 2, `sili` 2 | pass; new rhyme -irsi |

Draft glosses, shown on option A (`cirsi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `cirsi` | crystal |
| R+asa | `cirsiasa` | — (unused) |
| R+na | `cirsina` | — (unused) |
| VERB | `cirsica` | to crystallize |
| R+nasan | `cirsinasan` | — (unused) |
| R+san | `cirsisan` | crystalline |
| R+asasan | `cirsiasasan` | — (unused) |

#### mask · Home & objects

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **vasko** | VAS-ko | `vaskova` | `laso` 2, `maska` 2, `vaku` 2, `varo` 2 | pass; new rhyme -asko |
| B | **naspa** | NAS-pa | `naspania` | `dapa` 2, `kasa` 2, `maska` 2, `nara` 2 | pass; new rhyme -aspa |
| C | **vaspa** | VAS-pa | `vaspava` | `dapa` 2, `kasa` 2, `maska` 2, `sasva` 2 | pass; new rhyme -aspa |

Draft glosses, shown on option A (`vasko`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `vasko` | mask |
| R+asa | `vaskoasa` | — (unused) |
| R+na | `vaskona` | unmasking |
| VERB | `vaskova` | to mask |
| R+nasan | `vaskonasan` | — (unused) |
| R+san | `vaskosan` | masked |
| R+asasan | `vaskoasasan` | — (unused) |

#### bareness · Body

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **lundu** | LUN-du | `lundula` | `cunu` 2, `dendu` 2, `lenbu` 2, `linu` 2 | pass; new rhyme -undu |
| B | **vundu** | VUN-du | `vunduva` | `cunu` 2, `dendu` 2, `mudu` 2, `vamdu` 2 | pass; new rhyme -undu |
| C | **nundu** | NUN-du | `nundunia` | `cunu` 2, `dendu` 2, `mudu` 2, `nedu` 2 | pass; new rhyme -undu |

Draft glosses, shown on option A (`lundu`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `lundu` | bareness; nakedness |
| R+asa | `lunduasa` | — (unused) |
| R+na | `lunduna` | — (unused) |
| VERB | `lundula` | to lay bare |
| R+nasan | `lundunasan` | — (unused) |
| R+san | `lundusan` | naked; bare |
| R+asasan | `lunduasasan` | — (unused) |

#### serve · Society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **mervi** | MER-vi | `mervima` | `corvi` 2, `derdi` 2, `farvi` 2, `helvi` 2 | pass; new rhyme -ervi |
| B | **delvu** | DEL-vu | `delvuda` | `belru` 2, `dalu` 2, `danvu` 2, `dendu` 2 | pass; new rhyme -elvu |
| C | **sarve** | SAR-ve | `sarvesia` | `farvi` 2, `lanve` 2, `larne` 2, `mare` 2 | pass; new rhyme -arve |

Draft glosses, shown on option A (`mervi`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `mervi` | service |
| R+asa | `merviasa` | — (unused) |
| R+na | `mervina` | — (unused) |
| VERB | `mervima` | to serve |
| R+nasan | `mervinasan` | — (unused) |
| R+san | `mervisan` | serving; of service ✱ |
| R+asasan | `merviasasan` | — (unused) |

#### crowd · Society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **murta** | MUR-ta | `murtama` | `erta` 2, `gura` 2, `marna` 2, `mera` 2 | pass; new rhyme -urta |
| B | **tunto** | TUN-to | `tuntota` | `lanto` 2, `luno` 2, `tino` 2, `tuni` 2 | pass; new rhyme -unto |
| C | **munto** | MUN-to | `muntoma` | `lanto` 2, `luno` 2, `menso` 2, `monta` 2 | pass; new rhyme -unto |

Draft glosses, shown on option A (`murta`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `murta` | crowd; throng |
| R+asa | `murtaasa` | — (unused) |
| R+na | `murtana` | — (unused) |
| VERB | `murtama` | to crowd; to throng ✱ |
| R+nasan | `murtanasan` | — (unused) |
| R+san | `murtasan` | crowded |
| R+asasan | `murtaasasan` | — (unused) |

#### victim · Society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **nirma** | NIR-ma | `nirmania` | `divma` 2, `germa` 2, `hirna` 2, `lira` 2 | pass; new rhyme -irma |
| B | **nalme** | NAL-me | `nalmenia` | `falne` 2, `lalle` 2, `nafe` 2, `nami` 2 | pass; new rhyme -alme |
| C | **nalve** | NAL-ve | `nalvenia` | `falne` 2, `lalle` 2, `lalvu` 2, `lanve` 2 | pass; new rhyme -alve |

Draft glosses, shown on option A (`nirma`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `nirma` | victim |
| R+asa | `nirmaasa` | — (unused) |
| R+na | `nirmana` | — (unused) |
| VERB | `nirmania` | — (unused) |
| R+nasan | `nirmanasan` | — (unused) |
| R+san | `nirmasan` | — (unused) |
| R+asasan | `nirmaasasan` | — (unused) |

#### guess · Speech & mind

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **tinsa** | TIN-sa | `tinsata` | `finra` 2, `fisa` 2, `pensa` 2, `rinba` 2 | pass; new rhyme -insa |
| B | **gesti** | GES-ti | `gestiga` | `gesu` 2, `pesbi` 2, `yesta` 2, `belfi` 3 | pass; new rhyme -esti |
| C | **dilta** | DIL-ta | `diltada` | `divma` 2, `milra` 2, `salta` 2, `silda` 2 | pass; new rhyme -ilta |

Draft glosses, shown on option A (`tinsa`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `tinsa` | guess |
| R+asa | `tinsaasa` | — (unused) |
| R+na | `tinsana` | — (unused) |
| VERB | `tinsata` | to guess |
| R+nasan | `tinsanasan` | — (unused) |
| R+san | `tinsasan` | — (unused) |
| R+asasan | `tinsaasasan` | — (unused) |

#### obey · Society

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **yorve** | YOR-ve | `yorveya` | `corvi` 2, `dorva` 2, `lore` 2, `sove` 2 | pass; new rhyme -orve |
| B | **yone** | YO-ne | `yoneya` | `bote` 2, `cono` 2, `donu` 2, `fohe` 2 | pass; new rhyme -yone |
| C | **yervo** | YER-vo | `yervoya` | `devo` 2, `lemvo` 2, `merno` 2, `narvo` 2 | pass; new rhyme -ervo |

Draft glosses, shown on option A (`yorve`). The forms change with the spelling you pick; the glosses do not.

| Slot | Form | Draft gloss |
|---|---|---|
| R | `yorve` | obedience |
| R+asa | `yorveasa` | — (unused) |
| R+na | `yorvena` | disobedience |
| VERB | `yorveya` | to obey |
| R+nasan | `yorvenasan` | disobedient |
| R+san | `yorvesan` | obedient |
| R+asasan | `yorveasasan` | — (unused) |

## 5. New function words

Both use `function_word_template` and have two syllables. Each is at least two
edits from every active word, `ko` and `tu` included.

#### with (instrumental): with; using; by means of

Position: instrumental preposition (ADJUNCTS slot); never accompaniment, which stays ko.

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **yuta** | YU-ta |  | `ata` 2, `erta` 2, `futu` 2, `gura` 2 | pass |
| B | **buta** | BU-ta |  | `ata` 2, `baba` 2, `bena` 2, `biti` 2 | pass |
| C | **duto** | DU-to |  | `buvo` 2, `devo` 2, `fato` 2, `furo` 2 | pass |

#### too (excess): too; excessively (too much, too many)

Position: degree word before an adjective or quantifier, like ruli; never additive, which stays tu.

| | Spelling | Syllables | Verb | Nearest existing words (edits) | Checker |
|---|---|---|---|---|---|
| A | **diba** | DI-ba |  | `baba` 2, `bioba` 2, `da` 2, `dapa` 2 | pass |
| B | **yazi** | YA-zi |  | `dagi` 2, `hozi` 2, `kasi` 2, `lavi` 2 | pass |
| C | **tane** | TA-ne |  | `banu` 2, `falne` 2, `ganre` 2, `gase` 2 | pass |

## 6. Kinship and role compounds

Spelled here with option A of each new root. The compounds change with your
pick, and every option has been checked.

| Concept | Compound | Components | Note |
|---|---|---|---|
| daughter; girl | `minvalinu` | FEMALE + `linu` (child) | |
| son; boy | `tarnulinu` | MALE + `linu` | |
| sister | `minvafamli` | FEMALE + `famli` (sibling) | |
| brother | `tarnufamli` | MALE + `famli` | |
| grandmother | `purmamare` | `purma` (parent) + `mare` (mother) | "the parent's mother", after `purmafamli` |
| grandfather | `purmapilo` | `purma` + `pilo` (father) | |
| aunt / uncle | see Q1 | | |
| mother-in-law | `vindemare` | BY-MARRIAGE + `mare` | |
| father-in-law | `vindepilo` | BY-MARRIAGE + `pilo` | |
| parent-in-law | `vindepurma` | BY-MARRIAGE + `purma` | |
| sibling-in-law | `vindefamli` | BY-MARRIAGE + `famli` | add `minvasan`/`tarnusan` for sister/brother-in-law |
| child-in-law | `vindelinu` | BY-MARRIAGE + `linu` | add the adjective for son/daughter-in-law |
| priest | `luminela` | `lumi` (light) + `nela` (person) | |
| prophet | see Q2 | | |
| widow; widower | see Q3 | | |

All of these pass the checker for every option of the new roots.

## 7. Section D: compounds

Each one has exactly two active headword components, and none nests. I
checked each component's meaning against its 1.1 gloss.

| Concept | Compound | Components (their 1.1 root gloss) | Syllables | Verb | Checker |
|---|---|---|---|---|---|
| noon | **sulbacemnu** | `sulba` (sun) + `cemnu` (center) | sul-ba-CEM-nu | `sulbacemnusia` | pass |
| midnight (recommended) | **nullocemnu** | `nullo` (night) + `cemnu` (center) | nul-lo-CEM-nu | `nullocemnunia` | pass |
| midnight (alt.) | **lunocemnu** | `luno` (moon) + `cemnu` (center) | lu-no-CEM-nu | `lunocemnula` | pass |
| string (musical) | **melotibi** | `melo` (Music) + `tibi` (thread) | me-lo-TI-bi | `melotibima` | pass |
| flute | **filvibiti** | `filvi` (new: reed) + `biti` (tool; implement) | fil-vi-BI-ti | `filvibitifa` | pass |
| east | **mernodarno** | `merno` (morning) + `darno` (direction) | mer-no-DAR-no | `mernodarnoma` | pass |
| west | **vesnodarno** | `vesno` (evening) + `darno` (direction) | ves-no-DAR-no | `vesnodarnova` | pass |
| north (recommended) | **veludarno** | `velu` (star) + `darno` (direction) | ve-lu-DAR-no | `veludarnova` | pass |
| north (alt.) | **nilvudarno** | `nilvu` (winter) + `darno` (direction) | nil-vu-DAR-no | `nilvudarnonia` | pass |
| south (recommended) | **sulbadarno** | `sulba` (sun) + `darno` (direction) | sul-ba-DAR-no | `sulbadarnosia` | pass |
| south (alt.) | **sumbidarno** | `sumbi` (summer) + `darno` (direction) | sum-bi-DAR-no | `sumbidarnosia` | pass |

**Q5. North and south.** Liraasa has no compass words. Options:

- **(a) Recommended:** sky landmarks. North is `veludarno`, "toward the
  stars", where the fixed stars turn. South is `sulbadarno`, "toward the sun",
  where the noon sun stands in the north.
- **(b)** Seasons. North is `nilvudarno` (winter) and south is `sumbidarno`
  (summer).

East and west are `mernodarno` and `vesnodarno`, from the morning and evening
roots, as you suggested.

For midnight I recommend `nullocemnu` (night) over `lunocemnu` (moon), because
the moon is not always up at midnight.

## 8. Section C: derivations

| Gloss | Derivation | Base and suffix | Syllables | Checker |
|---|---|---|---|---|
| school | **lemupago** | `lemu` (Learning; primal root) -pago | le-mu-PA-go | pass |
| student | **lemuyo** | `lemu` (Learning; primal root) -yo | le-MU-yo | pass |
| teacher | **lemudonuyo** | `lemudonu` (Teaching; compound lemu+donu) -yo | le-mu-do-NU-yo | pass |
| soldier | **vanruyo** | `vanru` (war; primal root) -yo | van-RU-yo | pass |
| farm | **marnapago** | `marna` (grain; cereal; primal root) -pago | mar-na-PA-go | pass |
| farmer | **marnayo** | `marna` (grain; cereal; primal root) -yo | mar-NA-yo | pass |
| hill | **monruti** | `monru` (mountain; primal root) -ti | mon-RU-ti | pass |
| healer; doctor | **yugemeyiyo** | `yugemeyi` (healing; recovery; compound yuge+meyi) -yo | yu-ge-me-YI-yo | WARN: yugemeyiyo [derivation] is one edit from ACTIVE yugemeyiya |
| merchant | **dapadonuyo** | `dapadonu` (sale; selling; compound dapa+donu) -yo | da-pa-do-NU-yo | pass |
| judge | **juseyo** | `juse` (justice; primal root) -yo | ju-SE-yo | pass |
| traitor | **devobalbuyo** | `devobalbu` (betrayal; compound devo+balbu) -yo | de-vo-bal-BU-yo | pass |
| sailor | **sevuyo** | `sevu` (Sea; primal root) -yo | se-VU-yo | pass |
| messenger | **mambiletoyo** | `mambileto` (note; short written message; compound mambi+leto) -yo | mam-bi-le-TO-yo | pass |
| fisher | **filseyo** | `filse` (fish; primal root) -yo | fil-SE-yo | pass |
| spy | **helviyo** | `helvi` (hide; primal root) -yo | hel-VI-yo | pass |
| temple | **lavbupago** | `lavbu` (pray; primal root) -pago | lav-bu-PA-go | pass |
| stream | **mirunuluti** | `mirunulu` (river; compound miru+nulu) -ti | mi-ru-nu-LU-ti | pass |
| pond | **tamramiruti** | `tamramiru` (lake; compound tamra+miru) -ti | tam-ra-mi-RU-ti | WARN: tamramiruti [derivation] is one edit from ACTIVE tamramiruta |
| pebble | **soloti** | `solo` (Stone; primal root) -ti | so-LO-ti | pass |
| boulder | **solovu** | `solo` (Stone; primal root) -vu | so-LO-vu | WARN: solovu [derivation] is one edit from ACTIVE molovu |
| hero | **corviyo** | `corvi` (courage; primal root) -yo | cor-VI-yo | pass |

- **Derivation on compounds is allowed.** `tisebitivu` = `tisebiti` + `-vu`
  is already canon, and the morphology says only "on the root", which a
  compound's spelling is. Six of these bases are compounds.
- **Suffix order holds for all 21.** Each suffix attaches to a headword's
  root spelling, never to one of its forms.
- **Four are `-ti` diminutives** with a lexicalised meaning (hill, stream,
  pond, pebble). By the parse they already read as base + `-ti`; lexicalising
  fixes the meaning. They go in `morphology.lexicalised_derivations`, beside
  `tibivu` and `kaldopago`.
- **The three WARNs:** `solovu` (boulder) is one edit from `molovu`, a
  genuine near neighbour to keep in mind when singing it. `yugemeyiyo` and
  `tamramiruti` are each one edit from their own base's verb form, which is
  harmless.

## 9. Checker notes

- **Pre-existing audit of 1.1,** unchanged from Phase 1 and in
  `review/sound_audit_1_1.json`: 42 template, 1 collision (`maivori`), 17
  distance pairs, 0 parse and 0 segmentation.
- **Changes to the checker since Phase 1:**
  - New roots must be two edits from *each other*, unless they are options
    for the same concept.
  - A declared pair now also covers forms built on it with the same suffix.
  - A derivation no longer collides with its own base.
