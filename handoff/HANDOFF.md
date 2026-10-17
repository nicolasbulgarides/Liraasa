# Liraasa grammar guide: handoff brief

**For:** Claude Cowork
**From:** the Liraasa Workbench (`songbook-validator` branch), 2026-10-17
**Language edition:** Liraasa 1.1 (all of 1.0, plus the 1.1 vocabulary supplement), with the **1.2 grammar rulings** G24–G31 applied

This folder holds everything needed to write a new, good-looking grammar guide
for Liraasa, and everything needed to rebuild its parser from scratch. This
file is the brief and the grammar. The JSON beside it is the complete lexicon.

---

## 0. The job

Write **an updated Liraasa grammar guide that looks beautiful** and is easy to
learn from. Its readers are:

1. **The author**, a songwriter who writes lyrics in Liraasa and sings them.
2. **Learners** coming from English.
3. **Someone (human or model) rebuilding the parser**: they need the rules
   stated exactly, with the edge cases.

The guide must contain **every grammar ruling and language decision in this
file**. Present them as a teaching guide, not a dump: start with the sound,
then words, then the clause, then the rulings, and end with the parsing
reference.

### Suggested shape

| Part | Contents | Source in this file |
| --- | --- | --- |
| 1. Welcome | What Liraasa is (a language built for singing); how to read the guide | §1 |
| 2. Sound | Letters, syllables, stress, why it sings | §2 |
| 3. Words | The seven forms, the verb rule, suffixes, compounds, motion prefixes | §3 |
| 4. The small words | Pronouns, correlatives, numbers, time, colours, particles | §4, appendices |
| 5. The clause | The 20-slot template, operators, copulas, noun phrases | §5 |
| 6. Patterns | English → Liraasa recipes | §6 |
| 7. Rulings | Every ruling, grouped by topic, with its id | §7 |
| 8. Parsing | How a machine reads a line; the checker's rules | §8 |
| 9. Open questions | What is not decided yet | §9 |
| Appendices | Function words, correlative grid, numbers, colours, time words | Appendices |

### Design notes

- **Liraasa text is set apart:** a serif face, in its own colour, and never
  re-spelled or hyphenated for display. Every example is a Liraasa line with
  its English underneath.
- **Show the slot template as a diagram:** the 20 slots in a row, with the
  verb as the anchor and optional slots visibly lighter.
- **Give each ruling a badge with its edition-qualified id**, such as
  `1.0:G7` or `1.2:G27`, so a reader can trace it.
- **Use two recurring callouts:** **Singing note** (meter, rhyme, where a
  choice is free) and **Parsing note** (how a machine decides).
- **Stay accessible:** WCAG 2.2 AA contrast, nothing conveyed by colour
  alone, and headings in order.
- **Use the canon's own examples.** Every example in §5–§7 and in the JSON's
  `examples` (586 of them) is canon.

### Hard rules (non-negotiable)

1. **Never invent a Liraasa word.** Use only spellings found in the JSON.
   You may build a new sentence from existing words; you may not create a
   word. If a guide needs a word that does not exist, mark it as a gap.
2. **The 6,460 form slots glossed `— (unused)` have no meaning.** Never
   give one a meaning or use one in an example.
3. **Never decide the language.** §9 lists what is open. Present open
   questions as open.
4. **Spelling is sacred.** Keep the characters exact, including the hyphens in
   `eli-krono` and `una-ne`.
5. **Ruling ids are always edition-qualified.** `G1`–`G8` exist in both the
   0.8 and the 1.0 ruling sets with **different content**, so a bare `G7` is
   ambiguous.
6. **Where this file and the JSON disagree, the JSON wins.**

### Files in this folder

| File | What it is |
| --- | --- |
| `HANDOFF.md` | This brief, which also serves as the full grammar reference |
| `liraasa_1_1_complete.json` | The complete lexicon: every 1.0 and 1.1 headword with all seven forms and glosses; every closed class; `grammar`; `rulings_0_8_carried`, `rulings_1_0` and the new `rulings_1_2`; examples (the three revised ones keep their old text in `liraasa_1_1`); rhyme families; legacy and retired roots; the sound ledger; dispositions; and the 1.0 changelog |

Useful JSON keys: `headwords[].forms` and `.glosses` (seven slots each),
`function_words`, `pronouns`, `correlatives`, `numbers`, `time_and_dates`,
`colors`, `discourse_particles`, `grammar.clause_template`, `grammar.slots`,
`grammar.scope_operators`, `grammar.stacking`, `grammar.valency`,
`grammar.noun_phrase`, `morphology`, `phonology`, `motion_prefixes`,
`rulings_*`, `settled_open_questions_0_8`, `examples`, `rhyme_families`.

---

## 1. The language at a glance

Liraasa is a constructed language **built for singing**: open syllables, pure
vowels, penultimate stress and a regular morphology, so lyrics scan and rhyme
predictably.

| | Count |
| --- | --- |
| Headwords | **1,418**: 407 primal roots and 1011 compounds (319 new in 1.1) |
| Word forms | 9,926 (seven per headword), of which 6,460 are `— (unused)` |
| Function words | 149 |
| Pronouns | 8 |
| Correlatives | 36 (a 6 × 6 grid) |
| Time words | 43 rows (40 distinct forms) |
| Colour families | 9 (45 colour words; none is a headword) |
| Discourse particles | 4 |
| Rhyme families | 387 |
| Examples | 586 (581 live, 5 historical) |
| Rulings | 0.8: 20 carried · 1.0: 23 · 1.2: 8 · plus ADR-0011 |

Every headword in canon carries `protected: true`: no canon spelling is ever
regenerated by rule.

---

## 2. Sound

| Aspect | Rule |
| --- | --- |
| Vowels | a e i o u (pure); adjacent vowels are separate syllables |
| Core consonants | l m n r s v y |
| Other consonants | b d p t g h z k c f j (sh, ch only in colour/number words) |
| Stress | penultimate syllable |
| New root template | two syllables, consonant-initial, vowel-final, letters from the inventory, no initial cluster (kr-, tr- grandfathered), no three-consonant cluster, no doubled letter, at least two edits from every active word |
| Function-word template | one to three syllables, vowel-final, no initial cluster; at least two edits from every active word; monosyllables may sit one edit from another monosyllable only if they belong to different syntactic positions (declared list) |
| Protected exceptions | amor, apok, opi→opioa, 36 amor- double-a roots (legacy canon), kr-, tr- initial clusters |
| Declared one-edit pairs | mavo / maivo; lira / zira; peli / eli; somu / somi; pensa / penta; ka / ke; ki / ka; si / su; da / de; po / ko; tu / su |

**Syllable counting, for meter:** every vowel is its own syllable, because
adjacent vowels never merge. So `maivo` is ma-i-vo (three syllables) and
`opioa` is o-pi-o-a (four). Stress falls on the second-to-last syllable.

**A known label error:** `protected_exceptions` says "36 amor- double-a
roots". These are in fact compounds, and 1.0 has **39** of them (20 ending
in `-amor`, 19 beginning with `amor-`). The guide should give the right count.

**Rhyme:** `rhyme_families` groups every headword by its ending (387
families). A rhyming-dictionary appendix would suit the songwriter.

---

## 3. Words

### 3.1 The seven forms

Every headword has exactly seven forms, built by rule from the root `R`:

| # | Slot | Rule | bena | Gloss |
| --- | --- | --- | --- | --- |
| 1 | Root (noun) | R | bena | Good, Moral, Helpful |
| 2 | Ascended (sacred) | R+asa | benaasa | The ultimate good, righteous |
| 3 | Negative | R+na | benana | Wrong, Immoral, Bad, Evil |
| 4 | Verb | VERB | benaba | To do good |
| 5 | Negative adjective | R+nasan | benanasan | bad; unethical |
| 6 | Adjective | R+san | benasan | good; moral |
| 7 | Ascended adjective | R+asasan | benaasasan | supremely righteous |

**Caution:** the `forms` object is stored in two key orders (80 entries put
`verb` second). Read the forms by key, never by position.

### 3.2 The verb rule

| Root | Verb |
| --- | --- |
| opi | opioa |
| n-initial | R+nia |
| s-initial | R+sia |
| vowel-initial | R+a |
| otherwise | R + first consonant + a |

Examples: `lira` → `lirala`, `sabe` → `sabesia`, `nedu` → `nedunia`, and `opi` → `opioa` is the one irregular verb (`opi`, "Hope", is a real
headword). A compound's verb class follows its first letter.

### 3.3 Suffixes and derivations

Order: **ROOT + (one form OR one derivation) + -ti + -ri**. A word takes one form or one derivation, then
`-ti`, then `-ri` (settled question 4).

| Suffix | Meaning |
| --- | --- |
| -ti | diminutive |
| -ri | plural (always last) |
| -yo | agent (on the root) |
| -vu | augmentative (on the root) |
| -pago | place (mavo+pago blocked; mavopago = society only) |

**Lexicalised derivations** (1.0:G20):

| Word | Meaning |
| --- | --- |
| tisebitivu | sword (big knife): tisebiti + -vu |
| tibivu | rope (big thread): tibi + -vu |
| kaldopago | prison (place of confinement): kaldo + -pago |
| zeldoyo | rebel; resister: zeldo + -yo |
| kronopago | anniversary (0.8 canon time word): krono + -pago |

### 3.4 Compounds

MODIFIER+HEAD written together; head rightmost; components must be active 1.0 headwords; a compound's verb class follows its first letter. Every compound has exactly two `components`, and its
spelling is `components.join('')`. One compound is nested: `mudusomubiti` =
`mudu` + `somubiti`. A compound is **one word**, so it is never "two nouns side
by side" (ADR-0011).

### 3.5 Motion prefixes (closed list)

| Prefix | Meaning |
| --- | --- |
| va- | toward the speaker |
| du- | away; giving away |
| taro- | across |
| yave- | together, to meet |
| revo- | back, again (curated metaphors: revo-vimova, revo-lirala) |

closed list; only on motion verbs and the listed metaphors; not productive. Retired: `lu-` → keleka (climb, rise); `nu-` → nevra (descend); `mi-` → turna (enter); `so-` → duvla (exit) / sudeseno (announce).

### 3.6 Registers

- **Entries** are `everyday` or `poetic` only. There is no sacred word list
  (0.8:R10).
- **Texts** are `everyday`, `poetic` or `sacred`. Sacred is a property of the
  form (`-asa`, `-asasan`), not of the entry.
- `irreverent` is an optional tone flag on a text, never on a lexicon entry.

### 3.7 Retired spellings

63 roots were retired and 7 respelled in 1.0. Retired spellings are
**reserved until 2.0**; see `legacy` and `sound_ledger`. A pre-1.0 text is
read with the 0.8 lexicon (1.0:G19). A parser warns on a pre-1.0 spelling and
names its replacement.

---

## 4. The small words

Full tables are in the appendices. The core:

### 4.1 Pronouns

| Form | Person | Number | Possessive | Reflexive |
| --- | --- | --- | --- | --- |
| maivo | First person | Singular | maivo de lira (my song) | maivo sela (myself) |
| taivo | Second person | Singular | taivo de lira | taivo sela |
| saivo | Third person | Singular human / person | saivo de lira | saivo sela |
| maivori | First person | Plural | maivori de lira | maivori sela |
| taivori | Second person | Plural | taivori de lira | taivori sela |
| saivori | Third person | Plural people | saivori de lira | saivori sela |
| ito | Third person | Singular inanimate | ito de nole | ito sela |
| itori | Third person | Plural inanimate | itori de nole | itori sela |

### 4.2 Correlatives: determiner + concept

|  | coda | pago | krono | nela | modo | kasa |
| --- | --- | --- | --- | --- | --- | --- |
| ki | ki-coda (what) | ki-pago (where) | ki-krono (when) | ki-nela (who) | ki-modo (how) | ki-kasa (why) |
| eli | eli-coda (this thing) | eli-pago (here) | eli-krono (now) | eli-nela (this person) | eli-modo (in this way) | eli-kasa (for this reason) |
| ola | ola-coda (that thing) | ola-pago (there) | ola-krono (then) | ola-nela (that person) | ola-modo (in that way) | ola-kasa (for that reason) |
| toda | toda-coda (everything) | toda-pago (everywhere) | toda-krono (always) | toda-nela (everyone) | toda-modo (in every way) | toda-kasa (for every reason) |
| nuna | nuna-coda (nothing) | nuna-pago (nowhere) | nuna-krono (never) | nuna-nela (no one) | nuna-modo (in no way) | nuna-kasa (for no reason) |
| somi | somi-coda (something) | somi-pago (somewhere) | somi-krono (sometime) | somi-nela (someone) | somi-modo (somehow) | somi-kasa (for some reason) |

Correlatives of place, time, manner and cause (`-pago`, `-krono`, `-modo`,
`-kasa`) work as adverbials. Those of thing and person (`-coda`, `-nela`) work
as nouns.

### 4.3 Numbers

Digits `zira una dossa tressa cuara penta sesa seta ocha niva` (0–9). Ten is
`unzira`, and tens are contracted (`dozira`, `trezira`, `cuazira`,
`penzira`…). Join a unit with a hyphen: `dozira-cuara`, 24. Ordinals take
`-ne` (`una-ne`, first). Fractions are `NUMBER de NUMBER` (`tressa de cuara`,
three quarters; `una-de-dossa`, one half). A `ne` after a number is never
negation (settled question 6). `numbers.lookup_0_999` lists every number from
0 to 999.

### 4.4 Colours

Nine families, each with a base and four derived shades (`+narvo` dark,
`+bio` life, `+juba` gem, `+lumi` light): `rubi`, `rubinarvo`, `rubibio`,
`rubijuba`, `rubilumi`. They form a closed class of their own; no colour is a
headword. They are the only words that use `sh` and `ch`.

---

## 5. The clause

### 5.1 The 20-slot template

```
[FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]
```

Every slot except SUBJECT and VERB is optional. **The order is fixed.**

| # | Slot | Words | Notes |
| --- | --- | --- | --- |
| 1 | FRAME | time words, correlatives of time, zafra, finra, lanto, kenvi | clause-initial; followed by a pause |
| 2 | TOPIC | NP + hozi | optional; at most one per clause except paired contrastive topics in parallel clauses |
| 3 | SUBJECT | noun phrase, pronoun | obligatory except in commands, hortatives and permitted ellipsis |
| 4 | TENSE | po, futu, pressa | none = present |
| 5 | REALITY | noma | counterfactual |
| 6 | NEGATION | ne | floats: may also stand before any later operator or the verb, negating what follows |
| 7 | MODAL | povi, nosi, dagi, musi, suvi, viki, kopi | one per clause |
| 8 | APPROACH | tavki, fututi | almost / about to |
| 9 | PHASE | hiro, teki | begin / stop |
| 10 | EFFORT | telvo, vazdi, fesmo | try / manage / try and fail |
| 11 | ASPECT | roni, tefa, sahi | progressive / completed / habitual |
| 12 | ITERATION | bodu, reve, loki | already / again / still; reve and loki may instead close the clause |
| 13 | EVIDENTIAL | yehu, gesu, bisu, vuda, buyu, tosu | one per clause |
| 14 | VERB | any verb form, copulas ke ka kapoki loya miyo, valency operators vaku lesvu tekvu (+ ACTOR + embedded verb), gome (+ verb) |  |
| 15 | OBJECT | noun phrase |  |
| 16 | ADJUNCTS | prepositional phrases, la + adjective, vobi NP, sabri NP, korsi NP |  |
| 17 | RECIPROCAL | fuyi |  |
| 18 | STATUS | hoyo, yasmo | mirative / shared knowledge |
| 19 | ATTITUDE | seye, mufe, poye, pifu, zoke | zoke excludes the other four |
| 20 | QUESTION | ki | last word of its clause |

**Note:** SPEC §5.4 quotes an older 10-slot template. The 20-slot template
above is the canon.

### 5.2 Scope operators

`ne doli tu yesta pendi vinto`: immediately before the constituent they scope over (noun phrase, verb, adjective, number, clause-introducer such as si).
Scope runs left over right (1.0:G1). `ne` negates everything to its right, up
to the verb.

### 5.3 Stacking

One word per slot. These pairs **cannot share a clause**:

`hiro` + `roni`, `hiro` + `tefa`, `teki` + `roni`, `teki` + `tefa`, `telvo` + `tefa`, `vazdi` + `tefa`, `fesmo` + `tefa`, `zoke` + `seye`, `zoke` + `mufe`, `zoke` + `poye`, `zoke` + `pifu`, `tavki` + `fututi`, `hoyo` + `yasmo`.

At most 4 pre-verbal operators are recommended. left scopes over right (G1); ne negates everything to its right up to the verb.

### 5.4 Copulas and the verb slot

| Word | Meaning | Position |
| --- | --- | --- |
| ke | temporary is / are | copula for state or location now |
| ka | enduring is / are | copula for stable quality |
| kapoki | previously was | historical copula; po + ka is also regular |
| loya | become | Subject + [tense] loya + noun/adjective/state |
| miyo | existential there is / are | miyo + noun phrase (+ location); agreement invariant |
| gome | passive voice | PATIENT + [TENSE] + gome + TRANSITIVE VERB + [gagu AGENT] |

- **`ke` vs `ka`:** `ke` is a temporary state or a location now (`li nela ke
  benasan`, the person is good right now). `ka` is permanent identity or
  quality.
- **A copula with no verb at all:** the guide also writes predicate
  adjectives bare, as in `Lira benasan`.
- **Transitivity is usage-based** (settled question 5). `gome` can make any
  verb passive that is used with an object; there is no transitive flag.
- **Valency operators** (`vaku` make, `lesvu` let, `tekvu` prevent) follow
  the pattern `CAUSER [TENSE…] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]` (1.0:G14).

### 5.5 The noun phrase (1.0:G7)

```
[QUANTIFIER] [li|eli|ola|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]
```

- **Order:** quantifier, then article or owner, then number, then
  adjectives, then the noun, then `-ti` and `-ri`, then the `de` phrase, then
  the relative clause.
- **Adjectives come before the noun.**
- **A noun does not modify a noun** (ADR-0011, §7.4).
- **`toda N`** is every N; **`toda li N`** is all the N.

### 5.6 Linking clauses

A clause with its own verb is opened by a linker. Two verbs in one clause
with no linker is an error.

| Word | Meaning | Position |
| --- | --- | --- |
| ata | and | connect equal constituents \| v0.5: author correction |
| nara | but / however | contrast two clauses |
| oro | or | choose among alternatives \| v0.5: author correction |
| si | if | introduces condition |
| fime | complementizer: that | introduces a finite content clause; distinct from relative marker |
| raho | who / that / which (relative) | relative clause marker \| v0.5: author correction |
| kopisa | so that / in order to | purpose clause |
| sidu | infinitive / chaining | Between first lexical verb and bare second verb |
| kube | when (subordinate) | Before time clause, not a question |
| sige | since (time) | Introduces beginning point / since-event clause |
| nevi | although | concessive subordinate clause |
| kureli | as soon as | Introduces immediately-following time relation |
| kasa | because | introduces cause clause \| v0.5: author correction |
| sina | unless | negative condition |
| nayo | while (subordinate time) | Introduces simultaneous event clause \| v0.5: author correction |
| tuni | until | Introduces endpoint time clause |

- **`fime`** introduces a content clause, "that…" (`Maivo sabesia fime taivo
  lirala`). The demonstrative "that" is `ola`.
- **`raho`** opens a relative clause. If the relative clause does not end the
  sentence, a comma closes it (1.0:G21).
- **`sidu`** joins two verbs that share a subject (`Maivo vurlova sidu
  lirala`). At the start of a clause it turns a verb phrase into a noun
  (0.8:G6). It never takes a copula: "hope to become" is `kopi loya`.
- **`kopisa`** introduces purpose, "in order to".
- **`ala`** means "toward", **never** the infinitive "to".

### 5.7 Questions

A question keeps **statement order** and adds `ki` as the last word of the
clause. Question words are `ki-` correlatives that stay in place (`ki-coda`,
`ki-nela`), and an embedded yes/no question uses `si` (0.8:G4). The copula is
**never** moved to the front: `ke maivo … ki?` is wrong.

---

## 6. English → Liraasa: recipes

These are the patterns a translator, or a person, follows. All examples are
canon.

| English | Liraasa pattern | Example | Ruling |
| --- | --- | --- | --- |
| my / your X | PRONOUN de X | taivo de lira, your song | 1.2:G27 |
| Father's X, Velina's X | NAME de X | pilo de bumre | 1.2:G27 |
| the X of the Y; the Y's X | li X de li Y | li bumre de li cilni | 1.2:G27 |
| a song about / of love | li lira de amor (de phrase) | li lira de amor | 1.2:G30 |
| songbird (noun + noun) | first noun → its adjective | lirasan lavra | ADR-0011 |
| two stars / two coins | NUMBER NOUN, -ri optional | dossa veluri; dossa cono | 1.2:G28 |
| the forgotten | article + adjective | li ramumomvisan | 1.2:G29 |
| owe me two coins | VERB PRONOUN THEME | guraga maivo dossa cono | 1.2:G26 |
| lend three coins to someone | VERB THEME ala RECIPIENT | rimara tressa cono ala maivo | 1.2:G26 |
| now I sing; I sing now | time word first or last | Eli-krono, maivo lirala. / … eli-krono. | 1.2:G24 |
| suddenly, … | frame word first, with a comma | Zafra, li dorbi po lallela. | slot 1 |
| water or food | A oro B | miru oro nami | 1.2:G25 |
| either A or B | oro A oro B |  | 1.0:G10, 1.2:G25 |
| did / -ed | po + verb | Saivo po venreva. | slot 4 |
| will | futu + verb | Taivo futu relnura ki? | slot 4 |
| not | ne before what it negates | Maivo po ne somusia. | 1.0:G1 |
| is (now) / is (always) | ke / ka | li nela ke benasan | copulas |
| was V-ed (passive) | gome + verb, or ke/ka + -san adjective |  | settled q. 5 |
| I know that … | fime + clause | Maivo sabesia fime taivo lirala. |  |
| the person who sings | raho + clause | Li nela raho lirala ka benasan. | 1.0:G21 |
| want to sing | VERB sidu VERB | Maivo vurlova sidu lirala. | 0.8:G6 |
| question | statement order + ki | Taivo futu relnura ki? | slot 20 |
| command | no subject; fisa = please | Vulravelmava maivo de yendo, fisa. | 1.2:G31 |
| addressing someone | set off by commas | …ki, maivo de amor? | 1.2:G31 |
| perhaps / certainly … | attitude word at the clause end | … ka benasan seye. | 1.0:G22 |

---

## 7. Every ruling

These are verbatim from the JSON. The 1.2 rulings are new, from the
open-questions review of 2026-10-17 (ADR-0012).

### 7.1 Rulings 1.2 (new: G24–G31)

#### 1.2:G24: Time words: opening or closing

A time word or time correlative (eli-krono, deyapressa, fututi, ki-krono's answers…) may open its clause or close it. When it opens the clause, the comma after it is optional. Only the four frame words zafra, finra, lanto and kenvi are opening-only, and they keep their comma. *Refines 1.0 slot 1 FRAME.*

- `Eli-krono, maivo lirala.`: Now I sing.
- `Eli-krono maivo lirala.`: Now I sing.
- `Saivo po venreva pendi eli-krono.`: They arrived exactly now.
- `Zafra, li dorbi po lallela.`: Suddenly the door opened.

#### 1.2:G25: oro, alone and paired

A single oro joins two equal constituents, exactly as ata does: miru oro nami, water or food. It may also open a clause or line that continues the one before ("Or …"). The pair oro A oro B is the emphatic "either A or B". *Refines 1.0:G10.*

- `miru oro nami`: water or food
- `oro maivo ke li suma ki?`: Or am I the one…?

#### 1.2:G26: Give-type verbs: where the recipient goes

A verb of giving (give, lend, send, owe, sell, pay, bring, teach, show) takes VERB THEME ala RECIPIENT. When the recipient is a pronoun it may instead stand bare straight after the verb: VERB PRONOUN THEME. Any other recipient takes ala.

- `Taivo guraga maivo dossa cono.`: You owe me two coins.
- `Fisa, rimara tressa cono ala maivo.`: Please lend me three coins.

#### 1.2:G27: Which side of de is the owner

In X de Y the owner is Y, read as English "X of Y": li bumre de li cilni, the bread of the city; li lira de amor, the song of love. One exception: a pronoun or a personal name (pilo, father, used as a name included) standing before de is the owner, read as English "X's Y": maivo de lira, my song; pilo de bumre, father's bread. A pronoun is the owner wherever it stands: li purma de maivo, my parent. Fractions (tressa de cuara) are their own construction. *Refines 1.0:G7.*

- `Taivo de lira ka vanisan.`: Your song is beautiful.
- `Li bitiri de pilo ka su li tabu.`: Father's tools are on the table.
- `Eli bumre ka sambasan ko pilo de bumre.`: This bread is the same as father's bread.
- `Li bumre de li cilni ka sambanasan da eli bumre.`: City bread is different from this bread.
- `Nullo de deyaapo, maivo po ne somusia.`: Last night, I didn't sleep.

#### 1.2:G28: -ri after a number or quantifier

After a number or a quantifier the plural -ri is optional: the number already says how many. Choose by sound and meter. Without a number or quantifier, a plural noun takes -ri. *Refines 1.0:G7.*

- `Li dossa veluri lumila.`: The two stars shine.
- `Taivo guraga maivo dossa cono.`: You owe me two coins.
- `Maivo po vimova muya jemlari en li folni.`: I saw many insects on the flower.
- `Li vila tovota muya marna.`: The village has much grain.

#### 1.2:G29: An adjective standing as a noun

An adjective may stand as a noun phrase on its own only after an article or determiner (li, eli, ola, baba): li ramumomvisan, the forgotten. Without one, an adjective needs its noun. *Refines 1.0:G7.*

- `yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.`: even the echoes of the sorrows of the forgotten heard our song

#### 1.2:G30: "About" is de

Liraasa has no word for "about / concerning". A song, story or word about something is a de phrase under G27: li lira de amor, the song of (about) love. After a verb of saying, give the verb an object rather than su: po sarbisia lirari de amor, wrote songs of love.

- `Li ralelirapatu de li lira ka melosan.`: The song's refrain is musical.
- `Li veluri po sarbisia lirari de amor.`: The stars wrote songs of love.

#### 1.2:G31: Commands, address and narrative present

A command has no subject: the clause opens at the verb (slot 3 notes), softened with fisa. A person addressed is a noun phrase set off by commas, at the start or end of the clause. In verse, once the time has been set, the bare present may narrate past events.

- `Vulravelmava maivo de yendo, fisa.`: Bandage my palm, please.
- `Taivo viki pagopa ligo maivo ki, maivo de amor?`: Would you come near me, my love?

### 7.2 Rulings 1.0 (G1–G23)

| Id | Topic | Ruling |
| --- | --- | --- |
| 1.0:G1 | Scope by position | Every preverbal operator scopes over everything to its right. Pre-constituent operators (ne, doli, tu, yesta, pendi, vinto) scope over the single constituent that follows them. |
| 1.0:G2 | si and whether | si means only 'if'. 'whether' is ki-oro. 0.8 texts that used si for 'whether' are read under 0.8 rules. |
| 1.0:G3 | Permission vs possibility vs ability | povi = ability; nosi = epistemic possibility (might); dagi = permission (may, be allowed). 0.8's double use of nosi is split. |
| 1.0:G4 | Epistemic necessity | 'must (logically)' = inferential evidential tosu + seye; musi is only obligation or circumstantial necessity. |
| 1.0:G5 | Intention | Intent is the verb chain 'dorvada sidu VERB' (intend to); kopi is only 'hope to'. Deliberately = la dorvasan; accidentally = la dorvanasan. |
| 1.0:G6 | Counterfactual | noma marks a clause as contrary to fact. 'should have' = po noma suvi; 'could have' = po noma povi; 'would have' = po viki (in a consequence clause) or po noma viki. |
| 1.0:G7 | Imminence | fututi in the approach slot means 'about to': Maivo po fututi pagopa = I was about to leave. As a clause-initial time word it still means 'soon'. |
| 1.0:G8 | Continuation | loki covers both 'still' and 'keep on'; no separate continuative is added. |
| 1.0:G9 | Quantity limits | Before a number or quantity, lusu = at least, mosa = at most, gase = approximately; pendi = exactly. |
| 1.0:G10 | Paired conjunctions | oro A oro B = either A or B; ne A ne B = neither A nor B; doli si = only if; yesta si = even if; 'si …, ata doli si …' = if and only if. |
| 1.0:G11 | Despite | nevi + noun phrase = despite: nevi li zeldo, despite the resistance. nevi + clause = although. |
| 1.0:G12 | Benefactive | vobi + noun phrase = for the benefit of / on behalf of (unchanged), and combines with any operator. |
| 1.0:G13 | ata | ata is 'and' only; additive 'also' is tu. |
| 1.0:G14 | Valency operators | vaku (make), lesvu (let) and tekvu (prevent) fill the verb slot of the main clause; the actor follows, then the actor's own [ne] [phase] [effort] verb. Tense, modal and evidential belong to the main clause only. |
| 1.0:G15 | Negation and operators | ne before an operator negates the operator; ne after it negates the event: po ne vazdi lirala = didn't manage to sing; po vazdi ne lirala = managed not to sing. |
| 1.0:G16 | Exclusions | At most one word per slot. hiro/teki do not combine with roni or tefa. tavki excludes fututi (same slot). The effort slot (telvo, vazdi, fesmo) excludes tefa. noma requires a tense, modal or si-clause context. |
| 1.0:G17 | Unexpectedly / previously / simultaneously | la nerponasan = unexpectedly; kroti ola = previously; nayo ola = meanwhile/simultaneously; krotiapo = subsequently. No new words. |
| 1.0:G18 | Topic and focus together | A hozi-topic opens the clause; vinto may then mark a focus inside it. hozi and vinto never mark the same constituent. |
| 1.0:G19 | Version gating | Texts dated before 1.0 are interpreted with the 0.8 lexicon and rules. A 1.0 reader meeting a retired spelling looks it up in legacy.retired and reads the 1.0 replacement. |
| 1.0:G20 | Lexicalised derivations | tisebitivu (sword), tibivu (rope), kaldopago (prison) and zeldoyo (rebel) are fixed meanings of regular derivations. |
| 1.0:G21 | Closing a relative clause | A raho-clause that does not end the sentence is closed by a comma in writing and a pause in speech: Li sabeyo raho vismava eli, ne yehu vimova li vordu. (Found in stress-testing: without the pause the main verb is read inside the relative clause.) |
| 1.0:G22 | Attitude words are clause-final only | seye, mufe, poye, pifu and zoke never open a clause. 'Perhaps, …' at the start of a sentence is written with the clause-final poye. (Found in stress-testing.) |
| 1.0:G23 | Events taking place | venreva (come) with an event as subject means 'take place, happen': Li dapadonu po venreva kroti li nilvu, the sale took place before winter. |

### 7.3 Rulings carried from 0.8

| Id | Topic | Ruling |
| --- | --- | --- |
| 0.8:R1 | Source of truth and name | The JSON is authoritative; the workbook is generated. Language field and files are named Liraasa. |
| 0.8:R2 | Predictable unused slots | An unused form may receive a gloss only when its compositional meaning is predictable, approved case by case, and recorded in authorized_changes. |
| 0.8:R3 | Root Review queue | Frozen for 0.8. No canonical root is respelled; the 40-root queue carries forward unchanged. |
| 0.8:R4 | Frame tense | A standalone tense particle opening a paragraph or turn (Po — / Futu —) sets a frame: following unmarked main clauses take that tense until another tense particle, pressa, or the end of the paragraph. Optional. Time words do not set a frame, so 0.7 texts keep their meaning. |
| 0.8:R5 | Article omission | li may be omitted in everyday speech as well as verse when the referent is obvious; never when ambiguous. baba may be omitted only in verse. |
| 0.8:R6 | sige | sige clauses never inherit tense; they are always marked. Tense inheritance applies to fime, raho, kube, nayo, kasa, kopisa and tuni. |
| 0.8:R7 | Yesterday evening | deyaapo is kept as a fossil (it retains the retired past marker apo). apo is not used in new compounds; say vesno de deyaapo. |
| 0.8:R8 | Double -a verbs | amorliraa, amorrinbaa and amorvulraa are correct; each a is its own syllable. |
| 0.8:R9 | ki with certainty | A certainty marker (or zoke) precedes ki: Taivo lirala poye ki? |
| 0.8:R10 | Sacred register | Registers are defined in the grammar guide. The lexicon keeps everyday and poetic labels; sacred is added only to headwords whose root meaning is inherently sacred, after review. |
| 0.8:R11 | Headword target | New vocabulary is sized by genuine gaps, not by the 120-150 target. |
| 0.8:R12 | -ti on names | The diminutive -ti may attach to personal names as an affectionate or teasing form (Dorinti). |
| 0.8:G1 | Demonstratives as pronouns | eli/ola (and eliri/olari) stand alone for things, situations and discourse (ola = what was just said; eli = what follows). For people use eli-nela/ola-nela or saivo, except presentational Eli ka NAME. |
| 0.8:G2 | Negation scope | ne precedes what it negates: verb or modal (after tense), copula (ne ka), noun phrase or fragment (Ne eli), or a contrasted constituent (ne X, nara Y). Negation is compositional: ne + nuna- is a positive (avoid). |
| 0.8:G3 | Ellipsis | Everyday speech may omit a repeated subject in coordinated clauses and in answers, omit a repeated predicate after a contrasting subject (Dorin, ne.), answer with tense + verb (Po sapusia.), and echo a word with ki. Speech may break off after any particle; the listener may complete it. |
| 0.8:G4 | Quotation and embedded questions | ki may close the main clause before an appended direct quotation (Taivo vurlova ki, fime maivo senosia: "...") as well as after it (0.7 order). Embedded wh-questions keep the wh-word in place with no ki; embedded yes/no questions use si (whether). |
| 0.8:G5 | Relative time in subordinate clauses | Inside an inheriting clause: tefa marks prior action, nayo/roni simultaneous, futu subsequent (future-in-past), sahi habitual. |
| 0.8:G6 | Nominalization | The root (form 1) is the noun of action or thing (juba, donu, tali). A verb phrase becomes a noun phrase with sidu (Sidu lisrola ka livna de taivo) or a clause with fime (Fime taivo po relnura ka baba juba). |
| 0.8:G7 | Noun-phrase order | [toda\|rada\|muya\|poka\|somi\|nuna] [li\|eli\|ola\|OWNER de] [NUMBER] [ADJ...] NOUN[-ti][-ri] [de ...] [raho ...]. toda N = every N; toda li N = all the N; toda OWNER de N = all OWNER's N. |
| 0.8:G8 | Sameness, difference, similarity | X ka sambasan ko Y (same as); X ka sambanasan da Y (different from); gase NP alone = like NP (simile); gase ADJ gase NP = as ADJ as NP. Lotero silda, ... = on the other hand. |

### 7.4 ADR-0011: a noun does not modify a noun

Of two nouns side by side, the first becomes its adjective, and that
adjective describes the second: `lira` + `lavra` → `lirasan lavra`, a
songbird. The adjective depends on the form of the first noun:

| Noun form | Adjective | Example |
| --- | --- | --- |
| root | `-san` | `sizo` → `sizosan` |
| ascended `-asa` | `-asasan` | `mavopagoasa` → `mavopagoasasan` |
| negative `-na` | `-nasan` | `melona` → `melonasan` |

If that adjective slot is `— (unused)`, it cannot be used. Then take the
lexicon's compound of the two nouns if one exists, or else a `de` phrase:
`lavra lira` → `lira de lavra`. Compounds are untouched by this rule.

### 7.5 Settled questions from 0.8

| Question | Answer |
| --- | --- |
| Meanings of nevlosolo, kronobelda, marelirbu | REDEFINE with literal 1.0 meanings; 0.5 senses archived as unknown. |
| Veto any 0.8 addition? | No. All 81 0.8 headwords, the nine new sacred meanings, yugelotero, yebana and mebanena are 1.0 canon. |
| Root Review queue | Closed: 23 KEEP, 10 retired by compound, 7 respelled (see dispositions.root_review). |
| Can -yo/-vu/-pago combine with -asa or -na? | No. A word takes one form OR one derivation, then -ti, then -ri. |
| Which verbs are transitive? | Usage-based: gome may passivise any verb that is used with an object in the clause; a verb used without an object cannot take gome. No lexical flag is needed. |
| Are ordinals and fractions canon? | Yes: NUMBER-ne (una-ne, first) before the noun; fractions NUMBER de NUMBER (tressa de cuara). ne after a number is never negation, because ne precedes what it negates. |
| Should motion prefixes become productive? | No. Closed list va-, du-, taro-, yave-, revo-; lu-, nu-, mi-, so- retired in favour of the roots keleka, nevra, turna, duvla. |
| Should canon spellings carry a protected flag? | Yes. Every 1.0 headword carries protected: true; tools may never regenerate a canon spelling by rule. |

### 7.6 Revised examples

These three canon examples broke ADR-0011 and are revised in 1.2. The JSON
keeps the old text in `liraasa_1_1`.

| Before | After | English |
| --- | --- | --- |
| Maivo melo bena opioa lumi | Maivo de benasan melo opioa lumi. | My good music hopes for light |
| Lotero silda, li cilni ka lasona. | Loterosan silda, li cilni ka lasona. | On the other hand, the city is noise. |
| Maivo po lemula baba lotero lermi. | Maivo po lemula baba loterosan lermi. | I learned another language. |

---

## 8. Parsing: how to rebuild the parser

The reference implementation is the checker in the Workbench's
`editor/index.html` (functions `parseWord`, `splitClauses`, `placeClause`,
`checkLine`, `backTranslate`). It runs over the whole canon and is pinned by
regression tests. Its port to TypeScript is Phase 2 of the Workbench. This
section specifies it.

### 8.1 Data the parser builds from the lexicon

- **Form index:** spelling → **list** of `{root, slot}`. 32 spellings belong
  to more than one namespace (`maivo` is both a pronoun and a root), so a
  spelling never maps to just one entry.
- **Closed-class table:** function words, correlatives, time words, discourse
  particles, pronouns, colours (base + `narvo` / `bio` / `juba` / `lumi`) and
  numerals.
- **Derivations:** root + `yo` / `vu` / `pago` (`mavo` + `pago` is blocked;
  `mavopago` means only "society").
- **Legacy table:** pre-1.0 spelling → its replacement. Note that
  `migration_forms.kind` has five values, and for `archived-phrase` the
  target is a phrase, not a form.
- **English index:** every glossed slot and every synonym. A synonym that is
  already some slot's gloss stays with that slot.

### 8.2 Tokenising

Tokens are runs of letters, with internal hyphens and apostrophes kept:
`eli-krono`, `una-ne` and `dozira-cuara` are one token each. Punctuation
splits phrases. A comma is a pause, which matters for frames (slot 1), for
closing a relative clause (1.0:G21) and for address (1.2:G31).

### 8.3 Reading one word, in order

**Lexicon first:** many roots end in letters that look like suffixes (`navu`,
`sevu`, `trana`, `pago`), so a known spelling always beats a decomposition.
Try each step in turn and stop at the first match:

1. Exact form in the form index → **lexical** (every reading kept).
2. A closed-class word → its class.
3. A numeral, plain or hyphenated, optionally with `-ne` (ordinal).
4. A derivation (`-yo`, `-vu`, `-pago`).
5. Suffix stripping (word length over 4): strip `-ri`, then `-ti` if what
   remains is not known. The stem must be a known form, derivation or closed
   word.
6. A motion prefix (`va-`, `du-`, `taro-`, `yave-`, `revo-`) on a
   **verb** form.
7. A fraction, `N-de-N`.
8. A legacy spelling → warn, naming the replacement.
9. A name: capitalised, or in the known-name list.
10. Otherwise: **"not a word of Liraasa"**, an error. Never guess a meaning.

### 8.4 Roles

Each token gets the set of roles it could fill:

- **From the word itself:** tense, operator, copula, valency, det(erminer),
  quant(ifier), degree, focus, prep(osition), free, placed (attitude, status
  and frame words, `ki`, `fuyi`).
- **Lexical readings:** slot 3 → **verb**; slots 0–2 → **noun**; slots 4–6 →
  **adj**.
- **Pronouns, names, derivations and fractions** → noun.
- **`-pago` / `-krono` / `-modo` / `-kasa` correlatives** → adverb; the
  others → noun.
- **Time words** → adverb or noun.

### 8.5 Splitting clauses

A new clause starts at a linker:
`ata nara oro si sina kasa kopisa nevi raho fime kube nayo tuni sige kureli sidu tonsi narli korsi krotiata yava gome ki-oro sabri`,
and at any `ki-` question word. A coordinated clause (`ata`, `nara`, `oro`, …)
has its own single verb. An embedded clause (`raho`, `fime`, `kube`, …) runs on
into the main predicate, so its verb is not counted as a second verb.

### 8.6 Placing tokens in slots

The parser is a state machine, `start → subject → verb → post`, walking the
clause left to right:

- **Skipped:** focus words (`tu yesta pendi vinto doli ne`) stand before
  their constituent; free and placed words are skipped.
- **Tense and operators** move the state to *verb*. A time adverb at the
  start frames the clause.
- **A preposition** consumes the noun phrase after it. `la` + adjective is
  an adjunct.
- **A time word** opens or closes the clause freely (1.2:G24). After `de`,
  it is a noun (`vesno de deyaapo`).
- **The verb slot** takes a verb form, a copula, a valency operator or
  `gome`. A second verb in the same clause with no linker is an error, unless
  the clause is embedded or a valency operator's actor is taking its own
  verb.
- **A noun phrase** follows the 1.0:G7 template, with any `de NP` chained
  after it. Before the verb it is the subject; after the verb it is the
  object or the complement.
- **Give-type verbs** (glossed give / lend / send / owe / sell / pay / bring /
  teach / show): two bare noun phrases after the verb are allowed only when
  the first is a **pronoun** (1.2:G26). Otherwise warn, and suggest
  `VERB THEME ala RECIPIENT`.
- **An adjective after a copula** is its complement. With no verb at all, the
  adjective is the predicate.
- **Anything left over** is an error naming the token and the slot that was
  expected there.

### 8.7 Reading `de` (1.2:G27)

In `X de Y`, Y is the owner, "X of Y", **unless** X is a pronoun or personal
name, in which case X is the owner, "X's Y". A pronoun is the owner on either
side. `NUMBER de NUMBER` is a fraction. `de` needs a noun phrase on both
sides: `de` after a verb or an adjective is an error.

### 8.8 The checker's rule catalogue

| Severity | Rule | Id |
| --- | --- | --- |
| error | unknown word: "not a word of Liraasa" | never invent |
| warn | a form whose slot is "— (unused)" | 0.8:R2 |
| warn | a pre-1.0 spelling, with its replacement | 1.0:G19 |
| error | a token that cannot be placed in the slot template | slot |
| error | a non-verb in the verb slot (with a hint naming its verb form) | slot |
| error | a second verb in one clause with no linker | slot |
| error | a second noun phrase but the clause has no verb or copula | slot |
| warn | a give-type verb with a bare non-pronoun recipient | 1.2:G26 |
| error | two bare nouns side by side → adjective, compound or de phrase | ADR-0011 |
| error | de after a verb or adjective; de with nothing after it | noun phrase |
| error | a stranded preposition; ala used as the infinitive "to" | noun phrase |
| error | sidu between non-verbs, or followed by a copula | sidu |
| error | fime followed by a copula or tense (the demonstrative "that" is ola) | fime |
| error | zafra / finra / lanto / kenvi not opening its clause | slot 1 |
| warn | one of those four frame words without its comma | slot 1 |
| note | a time word opening a clause: the comma is optional | 1.2:G24 |
| error | a tense or operator out of slot order, or after the verb | 1.0:G1 |
| error | excluded pairs in one clause; two evidentials | 1.0:G16 |
| error | ki not last; attitude words not clause-final | 1.0:G22 |
| error | a question with the copula or tense moved to the front | ki |
| warn | a saying-verb + su read as "about" | 1.2:G30 |
| warn | English gloss is passive but the line has no gome | passive |
| note | -na direction; hema as hesitation |  |

### 8.9 Back-translation

Back-translation is mechanical and judges nothing. Each word gets its first
sense. A pronoun before `de` becomes a possessive ("my"), and a pronoun after
`de` becomes an object ("of me"). `-ri` adds "s", and `-ti` adds "little".
The result is shown beside the writer's English so that drift is visible.

### 8.10 Generated text is untrusted

Every machine-generated Liraasa line, including any example an LLM writes for
the guide, must be tokenised, parsed and checked before it is shown. **An
example the checker flags does not go in the guide.**

---

## 9. Open questions: present these as open

- **"Once", "N times":** no construction yet.
- **"To + verb":** a general complement beyond `sidu` (shared subject) and
  `kopisa` (purpose).
- **Evidentials:** the meaning when absent, whose evidence counts inside a
  `fime` clause, and the meaning in a question.
- **Relative clauses on a prepositional object:** "the house in which…".
- **The `phonology.protected_exceptions` label:** it says 36 amor- roots
  where 1.0 has 39 compounds; scheduled for repair.
- **Restore `lalma` / `sanlu` (needed for *Bumrepago*), and possibly `rohu`,
  `sabire`, `sonsa`:** deferred to the author.

---

## Appendix A: Function words

| Form | Meaning | Position | Class | Example | Since |
| --- | --- | --- | --- | --- | --- |
| li | the | definite article |  | li nela (the person) | ≤0.8 |
| baba | a / an | indefinite article, any gender/vowel |  | baba sora (a friend) | ≤0.8 |
| eli | this | near demonstrative |  | eli lira (this song) | ≤0.8 |
| ola | that | far demonstrative |  | ola lira (that song) | ≤0.8 |
| eliri | these | plural demonstrative |  | eliri lirari (these songs) | ≤0.8 |
| olari | those | plural demonstrative |  | olari lirari (those songs) | ≤0.8 |
| de | of / belonging to | owner + de + possessed noun |  | taivo de lira (your song) | ≤0.8 |
| sela | oneself / reflexive | pronoun + sela |  | maivo sela (myself) | ≤0.8 |
| -na | lexical negation | suffix within seven-form root system |  | lumina (absence of light) | ≤0.8 |
| ne | not (sentence/action) | put immediately before scope of negation |  | maivo ne lirala (I do not sing) | ≤0.8 |
| ke | temporary is / are | copula for state or location now |  | li nela ke benasan (the person is good right now) | ≤0.8 |
| ka | enduring is / are | copula for stable quality |  | li nela ka benasan (the person is good by nature) | ≤0.8 |
| kapoki | previously was | historical copula; po + ka is also regular |  | saivo kapoki benasan (they were formerly good) | ≤0.8 |
| po | past marker (preverbal) | Preverbal tense. po ka = was as a trait; kapoki = no longer is. |  | maivo po lirala (I sang) | ≤0.8 |
| pressa | present (optional) | unmarked present preferred \| v0.5: author correction |  | maivo pressa lirala (I sing now) | ≤0.8 |
| futu | future | tense before verb/predicate |  | maivo futu lirala (I will sing) | ≤0.8 |
| roni | in progress | progressive aspect, before verb |  | maivo roni lirala (I am singing) | ≤0.8 |
| tefa | completed | completed aspect, before verb |  | maivo po tefa lirala (I had sung / completed singing) | ≤0.8 |
| sahi | habitually | habitual aspect, before verb |  | maivo sahi lirala (I sing habitually) | ≤0.8 |
| kopi | hope to | aspirational modality, not plain future \| v0.5: author correction |  | maivo kopi lirala (I hope to sing) | ≤0.8 |
| povi | can / be able | ability modality before verb |  | maivo povi lirala (I can sing) | ≤0.8 |
| nosi | might (epistemic possibility) | uncertain possibility modality |  | saivo nosi lirala (they might sing) | ≤0.8 |
| musi | must (obligation / circumstantial necessity) | necessity/obligation modality |  | maivo musi pagopa (I must go) | ≤0.8 |
| suvi | should | advisability modality |  | taivo suvi somusia (you should rest [see note]) | ≤0.8 |
| viki | would | hypothetical modality |  | maivo viki lirala (I would sing) | ≤0.8 |
| ata | and | connect equal constituents \| v0.5: author correction |  | lira ata melo (song and music) | ≤0.8 |
| nara | but / however | contrast two clauses |  | maivo lirala nara saivo ne lirala (I sing but they do not) | ≤0.8 |
| oro | or | choose among alternatives \| v0.5: author correction |  | miru oro nami (water or food) | ≤0.8 |
| si | if | introduces condition |  | si taivo lirala, maivo rilura (if you sing, I dance [see note]) | ≤0.8 |
| sina | unless | negative condition |  | sina taivo pagopa (unless you go) | ≤0.8 |
| kasa | because | introduces cause clause \| v0.5: author correction |  | maivo somusia kasa maivo ke silisan (I rest because I'm cold [see note]) | ≤0.8 |
| kopisa | so that / in order to | purpose clause |  | maivo talita kopisa benaba (I work to do good [see note]) | ≤0.8 |
| nevi | although | concessive subordinate clause |  | nevi saivo ke silisan (although they are cold) | ≤0.8 |
| raho | who / that / which (relative) | relative clause marker \| v0.5: author correction |  | li nela raho lirala (the person who sings) | ≤0.8 |
| kroti | before | temporal relation \| v0.5: author correction |  | kroti deya (before the day) | ≤0.8 |
| krotiata | then / next | sequence marker; original compound |  | krotiata maivo lirala (then I sing) | ≤0.8 |
| krotiapo | after | temporal relation; lexicalized existing compound |  | krotiapo deya (after the day) | ≤0.8 |
| en | in / inside | location \| v0.5: author correction |  | en li nimu (in the home) | ≤0.8 |
| su | on / upon | surface location \| v0.5: author correction |  | su li solo (on the stone) | ≤0.8 |
| ala | to / toward | goal and direction |  | ala li nimu (toward the home) | ≤0.8 |
| da | from | source \| v0.5: author correction |  | da li nimu (from the home) | ≤0.8 |
| ko | with / alongside | accompaniment \| v0.5: author correction |  | ko saivo (with them) | ≤0.8 |
| vobi | for / on behalf of | benefactive purpose \| v0.5: author correction |  | vobi taivo (for you) | ≤0.8 |
| intra | within | internal relation \| v0.5: author correction |  | intra li nimu (within the home) | ≤0.8 |
| entre | between | between two entities \| v0.5: author correction |  | entre luno ata sulba (between moon and sun) | ≤0.8 |
| transa | through / across | passage \| v0.5: author correction |  | transa li sevu (across the sea) | ≤0.8 |
| ultra | beyond | beyond a limit \| v0.5: author correction |  | ultra li navu (beyond the sky) | ≤0.8 |
| hupi | above | vertical relation |  | hupi li nimu (above the home) | ≤0.8 |
| tula | below | vertical relation |  | tula li nimu (below the home) | ≤0.8 |
| ligo | near | proximity |  | ligo li nimu (near home) | ≤0.8 |
| vofa | far from | distance |  | vofa li nimu (far from home) | ≤0.8 |
| voyu | without | prepositional absence |  | voyu miru (without water) | ≤0.8 |
| ki | yes/no question | sentence-final particle; no inversion |  | taivo lirala ki? (do you sing?) | ≤0.8 |
| ki-coda | what | ki- + thing |  | ki-coda taivo vimova? (what do you see? [see note]) | ≤0.8 |
| ki-pago | where | ki- + place |  | ki-pago taivo pagopa? (where are you going?) | ≤0.8 |
| ki-krono | when | ki- + time |  | ki-krono maivo lirala? (when do I sing?) | ≤0.8 |
| ki-kasa | why | ki- + cause |  | ki-kasa taivo somusia? (why are you sleeping?) | ≤0.8 |
| ki-saivo | who | HISTORICAL ONLY; preferred productive interrogative ki-nela. |  | Ki-saivo lirala? (historical) (who is singing?) | ≤0.8 |
| ki-modo | how | ki- + manner |  | ki-modo taivo lirala? (how do you sing?) | ≤0.8 |
| ki-nela de | whose | interrogative person (ki-nela) + possession; ki-saivo de is historical |  | ki-nela de lira? (whose song?) | ≤0.8 |
| ki-muya | how many | question + quantity |  | ki-muya lirari? (how many songs?) | ≤0.8 |
| la | adverbial particle | la + adjective; adverbs do not need an eighth form |  | la molusan (gently) | ≤0.8 |
| ruli | very / intensely | degree intensifier |  | ruli vanisan (very beautiful) | ≤0.8 |
| doli | only | restrictive focus |  | doli taivo (only you) | ≤0.8 |
| kasi | more | comparative marker before adjective |  | kasi vanisan (more beautiful) | ≤0.8 |
| menu | less | comparative marker before adjective |  | menu vanisan (less beautiful) | ≤0.8 |
| tamo | than | comparison reference marker |  | kasi vanisan tamo saivo (more beautiful than them) | ≤0.8 |
| mosa | most | superlative marker |  | mosa vanisan (most beautiful) | ≤0.8 |
| lusu | least | minimum superlative |  | lusu vanisan (least beautiful) | ≤0.8 |
| gase | as (comparison) | comparative equality |  | gase vanisan gase taivo (as beautiful as you) | ≤0.8 |
| toda | all / every | universal quantifier |  | toda lirari (all songs) | ≤0.8 |
| somi | some | indefinite quantity |  | somi lirari (some songs) | ≤0.8 |
| nuna | none / no | zero quantity |  | nuna lirari (no songs) | ≤0.8 |
| muya | many | large quantity |  | muya lirari (many songs) | ≤0.8 |
| poka | few | small quantity |  | poka lirari (few songs) | ≤0.8 |
| rada | each | distributive quantity |  | rada lira (each song) | ≤0.8 |
| -ti | little / diminutive | suffix after lexical form, before plural |  | nelati (little person) | ≤0.8 |
| -ri | plurality | suffix after lexical form / -ti |  | nelari (people) | ≤0.8 |
| zabo | yes / affirmative | affirmative response \| v0.5: author correction |  | zabo (yes) | ≤0.8 |
| kepi | no | negative response |  | kepi (no) | ≤0.8 |
| fisa | please | request softener |  | fisa, lirala (please sing) | ≤0.8 |
| yade | sorry / pardon | apology \| v0.5: author correction |  | yade, taivo (I'm sorry) | ≤0.8 |
| yeko | hello | greeting |  | yeko, sora (hello, friend) | ≤0.8 |
| voge | goodbye / parting | farewell \| v0.5: author correction |  | voge, sora (goodbye, friend) | ≤0.8 |
| futupago | sometime in the future | established time-place metaphor |  | futupago maivo lirala (one day I will sing) | ≤0.8 |
| fututi | soon | futu + diminutive ti |  | fututi maivo lirala (soon I sing) | ≤0.8 |
| deyapressa | today | day + present |  | deyapressa (today) | ≤0.8 |
| deyaapo | yesterday | day + past |  | deyaapo (yesterday) | ≤0.8 |
| deyafutu | tomorrow | day + future |  | deyafutu (tomorrow) | ≤0.8 |
| sidu | infinitive / chaining | Between first lexical verb and bare second verb |  | Maivo vurlova sidu lirala. (I want to sing.) | ≤0.8 |
| kube | when (subordinate) | Before time clause, not a question |  | Kube taivo venreva, maivo lirala. (When you arrive, I sing.) | ≤0.8 |
| nayo | while (subordinate time) | Introduces simultaneous event clause \| v0.5: author correction |  | Nayo maivo lirala, taivo rilura. (While I sing, you dance.) | ≤0.8 |
| tuni | until | Introduces endpoint time clause |  | Maivo sulnosia tuni taivo venreva. (I wait until you arrive.) | ≤0.8 |
| sige | since (time) | Introduces beginning point / since-event clause |  | Sige maivo po venreva, saivo ke benasan. (Since I came, they are well.) | ≤0.8 |
| kureli | as soon as | Introduces immediately-following time relation |  | Kureli taivo venreva, maivo lirala. (As soon as you arrive, I sing.) | ≤0.8 |
| yava | let us (hortative) | Sentence-initial particle + plain verb; includes speaker and listener |  | Yava lirala! (Let us sing!) | ≤0.8 |
| vaku | causative | Approved productive causative. CAUSER + vaku + ACTOR/PATIENT + intransitive VERB; patient/actor retains position after vaku. |  | Maivo vaku li nela daigoda. (I cause the person to die; I kill the person.) | ≤0.8 |
| gome | passive voice | PATIENT + [TENSE] + gome + TRANSITIVE VERB + [gagu AGENT] |  | Li dorbi gome sevresia gagu li sora. (The door is closed by the friend.) | ≤0.8 |
| gagu | passive agent: by | Introduces optional external actor after passive verb |  | Li dorbi gome sevresia gagu maivo. (The door is closed by me.) | ≤0.8 |
| miyo | existential there is / are | miyo + noun phrase (+ location); agreement invariant |  | Miyo baba sola. (There is solitude.) | ≤0.8 |
| loya | become | Subject + [tense] loya + noun/adjective/state |  | Li sola loya benasan. (The solitude becomes good.) | ≤0.8 |
| fuyi | each other / reciprocal | After mutually directed verb; requires plural/multiple actors |  | Maivori amora fuyi. (We love each other.) | ≤0.8 |
| ki-eli | which? + noun | Interrogative determiner immediately before noun |  | Ki-eli lira taivo amora? (Which song do you love?) | ≤0.8 |
| ki-nela | who? preferred | Interrogative person; old ki-saivo allowed historically |  | Ki-nela lirala? (Who sings?) | ≤0.8 |
| -yo | agentive derivation | Attach to the ROOT: ROOT + yo = agent/doer (lira → lirayo); no seven-form expansion |  | lirayo (singer) | ≤0.8 |
| -pago | place derivation | Attach to root: R + pago = place associated with root |  | lemupago (school / place of learning) | ≤0.8 |
| -vu | augmentative derivation | Attach to the ROOT: ROOT + vu (lira → liravu); ordinary large/intense, not sacred |  | liravu (great/big song) | ≤0.8 |
| fime | complementizer: that | introduces a finite content clause; distinct from relative marker |  | Maivo sabesia fime taivo lirala. (I know that you sing.) | ≤0.8 |
| lorejuba | thank you (short, native) | everyday standalone heart-gift thanks |  | Lorejuba! (Thank you!) | ≤0.8 |
| lorejuba ala taivo | thank you (formal) | heart-gift + to + listener; can address another pronoun/name |  | Lorejuba ala taivo. (Thank you (full formal form).) | ≤0.8 |
| reve | again; repeated event | independent temporal adverb, preceding verb or final in clause |  | Maivo reve lirala. (I sing again.) | ≤0.8 |
| loki | still; continuing | independent temporal adverb, preceding verb or final in clause |  | Maivo loki lirala. (I am still singing.) | ≤0.8 |
| bodu | already; before expected time | before predicate, following tense; distinct from perfective |  | Maivo bodu lirala. (I have already sung.) | ≤0.8 |
| yehu | evidential: witnessed | Immediately before lexical verb, after tense/aspect: speaker saw it |  | Maivo yehu lirala. (I sing, as witnessed.) | ≤0.8 |
| gesu | evidential: heard | Immediately before lexical verb, after tense/aspect: speaker heard it |  | Maivo gesu lirala. (I sing, as heard.) | ≤0.8 |
| bisu | evidential: felt | Immediately before lexical verb, after tense/aspect: introspective feeling |  | Maivo bisu amora taivo. (I love you (felt inwardly).) | ≤0.8 |
| vuda | evidential: dreamed / imagined | Immediately before lexical verb, after tense/aspect: dream or imagination \| v0.5: author correction |  | Maivo vuda lirala. (I sing (in a dream).) | ≤0.8 |
| buyu | evidential: reported | Immediately before lexical verb, after tense/aspect: learned from others |  | Saivo buyu lirala. (They sing (reportedly).) | ≤0.8 |
| seye | final certainty: certain | Sentence-final, before punctuation / after predicate |  | Maivo lirala seye. (I sing, certainly.) | ≤0.8 |
| mufe | final certainty: probable | Sentence-final, before punctuation / after predicate |  | Maivo lirala mufe. (I probably sing.) | ≤0.8 |
| poye | final certainty: maybe | Sentence-final, before punctuation / after predicate |  | Maivo lirala poye. (Perhaps I sing.) | ≤0.8 |
| pifu | final certainty: wish / hope | Sentence-final, before punctuation / after predicate |  | Maivo futu lirala pifu. (May I sing in the future / I hope so.) | ≤0.8 |
| tu | also; too (additive focus) | before its constituent | scope | Tu Kipo po bumreba. (Kipo baked too.) | 1.0 |
| yesta | even (scalar focus: the least expected member) | before its constituent | scope | Yesta Dorin po resora. (Even Dorin laughed.) | 1.0 |
| pendi | exactly; precisely | before its constituent | scope | Taivo guraga maivo pendi dossa cono. (You owe me exactly two coins.) | 1.0 |
| vinto | narrow focus: it is X (and not something else) that… | before its constituent | scope | Vinto Kipo po bumreba li bumre. (It was KIPO who baked the bread.) | 1.0 |
| hozi | topic: as for X; two parallel hozi-phrases mark contrastive topics | after a clause-initial noun phrase, followed by a pause | topic | Li bumre hozi, Kipo po bumreba ito. (As for the bread, Kipo baked it.) | 1.0 |
| sabri | except; excluding; except that | before a noun phrase or clause | preposition / conjunction | Toda-nela po venreva sabri Dorin. (Everyone came except Dorin.) | 1.0 |
| korsi | instead of; rather than; instead | before a noun phrase; or clause-initial | preposition / conjunction | Maivo po sapusia bumre korsi yugenami. (I ate bread instead of meat.) | 1.0 |
| tonsi | therefore; so (logical consequence) | clause-initial | connector | Li bumre farufa; tonsi, li cemopago ke sumasan. (The bread is burning; therefore the kitchen is hot.) | 1.0 |
| narli | nevertheless; even so | clause-initial | connector | Saivo po tavreta. Narli, maivo po lisrola. (They refused. Nevertheless, I stayed.) | 1.0 |
| ki-oro | whether (or not) | introduces an embedded yes/no question | complementizer | Maivo masuma ki-oro taivo futu relnura. (I'm asking whether you'll come back.) | 1.0 |
| dagi | be allowed to; may (permission) | modal slot | modal | Taivo dagi lisrola. (You may stay (you are allowed to).) | 1.0 |
| noma | counterfactual: the clause is contrary to fact | right after tense, before ne | reality | Maivo po noma suvi lirala. (I should have sung (but I didn't).) | 1.0 |
| tosu | inferred from evidence | evidential slot | evidential | Kipo po tosu bumreba seye. (Kipo must have baked (I can tell from the evidence).) | 1.0 |
| tavki | almost; nearly (the event came close but did not happen) | approach slot | approach | Maivo po tavki ralnora. (I almost fell.) | 1.0 |
| hiro | begin to (inceptive) | phase slot | phase | Li veluri po hiro lirala. (The stars began to sing.) | 1.0 |
| teki | stop; cease doing (cessative) | phase slot | phase | Kipo po teki resora. (Kipo stopped laughing.) | 1.0 |
| telvo | try to (outcome open) | effort slot | effort | Maivo po telvo lirala. (I tried to sing.) | 1.0 |
| vazdi | manage to; succeed in | effort slot | effort | Saivo po vazdi hirnaha. (They managed to escape.) | 1.0 |
| fesmo | try and fail to | effort slot | effort | Maivo po fesmo relsira. (I tried to answer but couldn't.) | 1.0 |
| lesvu | let; allow (permissive) | verb slot: CAUSER lesvu ACTOR VERB | valency | Maivo po lesvu saivo pagopa. (I let them leave.) | 1.0 |
| tekvu | prevent from; stop someone doing | verb slot: CAUSER tekvu ACTOR VERB | valency | Maivo po tekvu saivo pagopa. (I prevented them from leaving.) | 1.0 |
| hoyo | mirative: newly discovered or surprising to the speaker | after the predicate, before certainty | discourse status | Li dorbi ke lallesan hoyo! (The door is open — I didn't know!) | 1.0 |
| yasmo | as is known; shared knowledge | after the predicate, before certainty | discourse status | Kipo ne bumreba yasmo. (Kipo doesn't bake, as we all know.) | 1.0 |
| zafra | suddenly (abrupt onset) | clause-initial frame slot | frame | Zafra, li dorbi po lallela. (Suddenly the door opened.) | 1.0 |
| finra | finally; at last (after delay or effort) | clause-initial frame slot | frame | Finra, saivo po relnura. (At last they came back.) | 1.0 |
| lanto | eventually (after time has passed) | clause-initial frame slot | frame | Lanto, li renli po teki renlira. (Eventually the rain stopped.) | 1.0 |
| kenvi | immediately; at once | clause-initial frame slot | frame | Kenvi, Kipo po duvlada. (Kipo left at once.) | 1.0 |

## Appendix B: Time and dates

| Form | English |
| --- | --- |
| futu | Future |
| po | Past |
| pressa | Present |
| seca | Second |
| minota | Minute |
| deya | Day |
| deyafama | Week |
| monta | Month |
| montafama | Year |
| codamontafama | Calendar |
| kronopago | Anniversary |
| deyapressa | Today |
| deyaapo | Yesterday |
| deyafutu | Tomorrow |
| fututi | Soon |
| futupago | Sometime in future |
| kroti | Before |
| krotiapo | After |
| nullo | Night |
| merno | Morning |
| vesno | Evening |
| eli-krono | Now |
| eli-pago | Here |
| ola-pago | There |
| toda-krono | Always |
| nuna-krono | Never |
| reve | Again |
| loki | Still |
| bodu | Already |
| mambi | Moment |
| lornu | Hour |
| eli-krono | now |
| ola-krono | then |
| toda-krono | always |
| nuna-krono | never |
| somi-krono | sometime |
| ki-krono | when? |
| mernopressa | This morning |
| vesnopressa | This evening |
| nullopressa | Tonight |
| mernofutu | Tomorrow morning |
| vesnofutu | Tomorrow evening |
| nullofutu | Tomorrow night |

## Appendix C: Numbers, the construction rules

| Group | Value | Liraasa | Construction rule | English interpretation | Usage / comment |
| --- | --- | --- | --- | --- | --- |
| Digit | 0 | zira | fixed base form | zero | Ten is unzira, not una-zira. |
| Digit | 1 | una | fixed base form | one | Ten is unzira, not una-zira. |
| Digit | 2 | dossa | fixed base form | two | Ten is unzira, not una-zira. |
| Digit | 3 | tressa | fixed base form | three | Ten is unzira, not una-zira. |
| Digit | 4 | cuara | fixed base form | four | Ten is unzira, not una-zira. |
| Digit | 5 | penta | fixed base form | five | Ten is unzira, not una-zira. |
| Digit | 6 | sesa | fixed base form | six | Ten is unzira, not una-zira. |
| Digit | 7 | seta | fixed base form | seven | Restored in 0.7: no longer a homograph of the reflexive particle; matches setazira / setacenta. |
| Digit | 8 | ocha | fixed base form | eight | Ten is unzira, not una-zira. |
| Digit | 9 | niva | fixed base form | nine | Restored in 0.7: no longer a homograph of "while"; matches nivazira / nivacenta. |
| Decade | 10 | unzira | memorize the contracted form; followed by a hyphen + unit for 21-99 | 10 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 20 | dozira | memorize the contracted form; followed by a hyphen + unit for 21-99 | 20 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 30 | trezira | memorize the contracted form; followed by a hyphen + unit for 21-99 | 30 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 40 | cuazira | memorize the contracted form; followed by a hyphen + unit for 21-99 | 40 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 50 | penzira | memorize the contracted form; followed by a hyphen + unit for 21-99 | 50 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 60 | sesazira | digit + zira (formula); 10–50 are memorised contractions | 60 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 70 | setazira | digit + zira (formula); 10–50 are memorised contractions | 70 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 80 | ochazira | digit + zira (formula); 10–50 are memorised contractions | 80 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Decade | 90 | nivazira | digit + zira (formula); 10–50 are memorised contractions | 90 | dozira, trezira, cuazira, penzira are deliberate contractions. |
| Hundreds | 100 | centa | exactly one hundred is centa (not unacenta) | 100 | 2xx to 9xx: full digit + centa |
| Hundreds | 200 | dossacenta | digit + centa (formula) | 200 | Regular for 2..9. |
| Hundreds | 300 | tressacenta | digit + centa (formula) | 300 | Regular for 2..9. |
| Hundreds | 400 | cuaracenta | digit + centa (formula) | 400 | Regular for 2..9. |
| Hundreds | 500 | pentacenta | digit + centa (formula) | 500 | Regular for 2..9. |
| Hundreds | 600 | sesacenta | digit + centa (formula) | 600 | Regular for 2..9. |
| Hundreds | 700 | setacenta | digit + centa (formula) | 700 | Regular for 2..9. |
| Hundreds | 800 | ochacenta | digit + centa (formula) | 800 | Regular for 2..9. |
| Hundreds | 900 | nivacenta | digit + centa (formula) | 900 | Regular for 2..9. |
| Scale | 1000 | mililumi | 1 × 1,000 = mililumi | one thousand | Coined with Spanish-ish mil + lumi ('light'); retained original. |
| Scale | 1000000 | megalumi | 1 × 1,000,000 = megalumi | one million | Retained original; groups can each contain 1 to 999. |
| Order | A | million GROUP → thousand GROUP → final GROUP | read in descending 10^6, 10^3, 10^0 groups | English-style place-value order | No word for 'and' inside cardinal numbers. |
| Hyphen | B | - | hyphen separates spoken components | 21 = dozira-una | Keep components joined in writing; normal speech can flow across them. |
| Omit zero groups | C | ∅ | do not pronounce absent 000 triplets | 1,005 = mililumi-penta | 0 by itself stays zira. |
| Teen forms | D | unzira-[digit] | 11..19 = 10 + unit | 11 = unzira-una | No unique Spanish teen irregularity is needed. |
| Mixed tens | E | [decade]-[digit] | 21..99 = decade + unit, unless unit 0 | 42 = cuazira-dossa | Preserve fixed decades from uploaded file. |
| Mixed hundreds | F | [hundred]-[remainder] | 101..999 = hundred + 1..99 remainder | 215 = dossacenta-unzira-penta | Exact 100 omits any remainder. |
| Thousands | G | [1..999]-mililumi | exactly 1000: mililumi; larger groups prefixed | 2001 = dossa-mililumi-una | Prefix form is 3-digit group, not each digit separately. |
| Millions | H | [1..999]-megalumi | exactly 1,000,000: megalumi; larger groups prefixed | 2,000,000 = dossa-megalumi | Supports 0..999,999,999 in Number Builder. |
| Count noun | I | NUMBER + noun(+ri) | English order, no gender agreement | dossa lirari = two songs | Plural -ri recommended above 1; numeral identifies count. |
| Non-integers | J | not defined in 0.2 | negative, decimal, ordinal, fractions await separate policy | e.g., -3 / 2.5 / third | Avoid inventing unwritten rules. |

## Appendix D: Colours

| Family | Base color | Dark + narvo | Life + bio | Gem + juba | Light + lumi | Example meanings / notes |
| --- | --- | --- | --- | --- | --- | --- |
| Red | rubi | rubinarvo | rubibio | rubijuba | rubilumi | Red; rubinarvo dark red; rubibio blood red; rubijuba ruby red; rubilumi pink. |
| Orange | ojo | ojonarvo | ojobio | ojojuba | ojolumi | Orange; ojonarvo dark orange; ojobio fresh orange; ojojuba citrine; ojolumi light orange. |
| Yellow | aurumi | auruminarvo | aurumibio | aurumijuba | aurumilumi | Yellow; auruminarvo dark yellow; aurumibio 'urine yellow' in source; aurumijuba gold; aurumilumi light yellow. |
| Blue | azuri | azurinarvo | azuribio | azurijuba | azurilumi | Blue; azurinarvo dark blue; azuribio ocean blue; azurijuba sapphire; azurilumi light blue. |
| Green | verde | verdenarvo | verdebio | verdejuba | verdelumi | Green; verdenarvo dark green; verdebio forest green; verdejuba emerald; verdelumi light green. |
| Violet | vio | vionarvo | viobio | viojuba | violumi | Violet; vionarvo dark purple; viobio fuchsia; viojuba amethyst; violumi light purple. |
| Black | shada | shadanarvo | shadabio | shadajuba | shadalumi | Black; shadanarvo very dark black; shadabio black of death; shadajuba onyx; shadalumi grey. |
| White | vana | vananarvo | vanabio | vanajuba | vanalumi | White; vananarvo grayish-white; vanabio vanilla white; vanajuba silver; vanalumi pale white. |
| Brown | erta | ertanarvo | ertabio | ertajuba | ertalumi | Brown; ertanarvo dark brown; ertabio earthy biological brown; ertajuba shiny brown; ertalumi light brown. |

## Appendix E: Discourse particles

### `hema`

hesitation; holding the floor ("well…", "um"). **Where:** clause-initial; between constituents; standalone. **Register:** everyday (also poetic for hesitant speech; not sacred).

- `Hema… maivo ne sabesia.`: Well… I don't know.
- `Taivo futu relnura ki? — Hema. Poye.`: Will you come back? — Well. Maybe.
- `Maivo vurlova, hema, baba cupa de miru.`: I'd like, um, a cup of water.
- `Hema, hema… li bumre ne keleka.`: Well, well… the bread isn't rising.

### `nido`

self-repair: cancels the speaker's own preceding word, phrase or clause and replaces it ("I mean", "rather", "no —"). **Where:** immediately after the abandoned item and before its replacement; or clause-initial to reformulate a whole previous utterance. **Register:** everyday; poetic (escalating correctio).

- `Maivo po bumreba tressa, nido, cuara bumreri.`: I baked three, I mean, four loaves.
- `Taivo ka benasan. Nido, taivo ka ruli benasan.`: You're good. I mean, you're very good.
- `Maivo amora taivo, nido, maivo devoda taivo.`: I love you, no, I pledge myself to you.
- `Maivo po bumreba ne tressa, nara cuara bumreri.`: I baked not three but four loaves. (corrective negation, for contrast)

### `yori`

topic return / closure ("anyway", "at any rate"); with a possessive seno phrase, resumption ("as I was saying"). **Where:** clause-initial; standalone. **Register:** everyday.

- `Yori. Li bumre keleka ki?`: Anyway. Is the bread rising?
- `Yori, maivo de seno: li bumrepago nedunia cono.`: As I was saying: the bakery needs coins.
- `Yori, taivo de seno. Taivo po senosia fime pilo po lenila maivo.`: Back to what you were saying. You said father heard me.
- `Yori.`: Whatever. / Anyway.

### `zoke`

irony / sarcasm: the speaker does not endorse, or mocks, the proposition. **Where:** clause-final, in the attitude slot (instead of seye/mufe/poye/pifu); may precede ki; standalone. **Register:** everyday only.

- `Dorin milobema toda-krono, zoke.`: Dorin smiles all the time. (Sure he does.)
- `Ola ka li bumreasasan, zoke.`: That is divinely bready. (Oh, sure.)
- `Zoke.`: Oh, sure. (eye-roll)
- `Taivo po bumreba eli, zoke ki?`: YOU baked this, did you?
- `Taivo ka ruli pamlonasan, zoke. — Ne zoke. Vera.`: You're very impatient, sure. — Not sure. True.

## Appendix F: Correlatives

| Form | Determiner | Concept | Gloss |
| --- | --- | --- | --- |
| ki-coda | ki | coda | what |
| ki-pago | ki | pago | where |
| ki-krono | ki | krono | when |
| ki-nela | ki | nela | who |
| ki-modo | ki | modo | how |
| ki-kasa | ki | kasa | why |
| eli-coda | eli | coda | this thing |
| eli-pago | eli | pago | here |
| eli-krono | eli | krono | now |
| eli-nela | eli | nela | this person |
| eli-modo | eli | modo | in this way |
| eli-kasa | eli | kasa | for this reason |
| ola-coda | ola | coda | that thing |
| ola-pago | ola | pago | there |
| ola-krono | ola | krono | then |
| ola-nela | ola | nela | that person |
| ola-modo | ola | modo | in that way |
| ola-kasa | ola | kasa | for that reason |
| toda-coda | toda | coda | everything |
| toda-pago | toda | pago | everywhere |
| toda-krono | toda | krono | always |
| toda-nela | toda | nela | everyone |
| toda-modo | toda | modo | in every way |
| toda-kasa | toda | kasa | for every reason |
| nuna-coda | nuna | coda | nothing |
| nuna-pago | nuna | pago | nowhere |
| nuna-krono | nuna | krono | never |
| nuna-nela | nuna | nela | no one |
| nuna-modo | nuna | modo | in no way |
| nuna-kasa | nuna | kasa | for no reason |
| somi-coda | somi | coda | something |
| somi-pago | somi | pago | somewhere |
| somi-krono | somi | krono | sometime |
| somi-nela | somi | nela | someone |
| somi-modo | somi | modo | somehow |
| somi-kasa | somi | kasa | for some reason |
