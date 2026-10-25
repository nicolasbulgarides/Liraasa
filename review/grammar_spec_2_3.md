# Liraasa 2.3: an axiomatized grammar specification and audit

**Language version:** Liraasa 2.3 (`title`: "Liraasa 2.3: the complete grammar and dictionary, for language models"; `source`: generated from `data/lexicon/liraasa_2_3.json`, built 2026-10-19T18:00:00Z).
**Document date:** 2026-10-21.
**Companion:** `review/grammar_spec_2_3_parses.md`, the parse test line by line, every example in the JSON.

## 1. Scope

This document describes the grammar of Liraasa 2.3 as it stands in `handoff/liraasa_2_3_llm.json` (the "grammar JSON": the generated, complete reference for language models; its grammar content mirrors the canonical `data/lexicon/liraasa_2_3.json`). Every section of that file was read: `read_me_first`, `hard_rules`, `how_to_translate`, `sound`, `word_building` (with `image_compounds` and `lexicalised_derivations`), `clause`, `recipes`, all 107 `rulings`, `settled_questions`, `self_check`, `open_questions_do_not_resolve`, `small_words`, `examples` (581 sentences) and `album` (13 tracks, 275 lines). The `dictionary` is used only where a lexical entry touches the grammar: a root homophonous with a closed-class word, a form that collides with a suffix, a verb whose class decides a construction. The document **describes and diagnoses; it does not repair**. Where two parts of the JSON disagree, both readings are given and an issue is logged; no axiom picks a side. Superseded rulings are described as superseded (2.3:G84 keeps them grammatical in old text); the current rule is the one the JSON marks as standing. Paths are JSON paths into the grammar JSON; `rulings[ID]` names a ruling by its `id` rather than its array index.

## 2. Notation and glossing

**Rewrite rules** are EBNF-style: `Clause ::= Subject Verb Object?`. `( )` optional, `{ }` zero or more, `|` alternation, `+` morpheme boundary, `#` word boundary. A **morphological template** is a slot sequence: `[ROOT]+[FORM|DERIVATION]+[-ti]+[-ri]`. A **clause template slot** is cited as `slot n NAME` (the numbering of `clause.slots`). A **component** in the registry (§5) is cited as `C:form`, for example `C:po`, `C:-ri`, `C:va-`.

**Statuses.** EXPLICIT: the JSON states the rule. IMPLICIT: not stated, but every relevant example in the JSON shows it (the examples are cited). INFERRED: reasoning beyond the text, with the reason given. UNDEFINED: the grammar needs a rule here and the JSON gives none; the missing rule is named, never supplied.

**CONSTRUCTED** marks a probe sentence built for this audit from forms that are in the JSON. Constructed sentences test rules; they are not offered as Liraasa usage.

**Interlinear glosses** follow the Leipzig Glossing Rules. Custom abbreviations:

| Abbrev. | Meaning | Form |
| --- | --- | --- |
| 1, 2, 3 | person | pronouns |
| SG, PL | singular, plural (`-ri`) | |
| HUM, INAN | human, inanimate (third person) | `saivo`, `ito` |
| DEF, INDF | definite, indefinite article | `li`, `baba` |
| PROX, DIST | near, far demonstrative | `eli`, `ola` |
| DE | the linker `de` (possession, "of", "about", partitive, fraction) | `de` |
| V | verb-forming ending (the verb form of the seven) | `-la`, `-sia`, `-nia`, `-a` … |
| ADJ | adjective form | `-san` |
| ASC, ASC.ADJ | ascended noun, ascended adjective | `-asa`, `-asasan` |
| PRIV, PRIV.ADJ | negative ("opposite or absence") noun, adjective | `-na`, `-nasan` |
| DIM, AUG, AGT, PLACE | diminutive, augmentative, agent, place derivation | `-ti`, `-vu`, `-yo`, `-pago` |
| ORD | ordinal | `-ne` |
| PST, FUT, PRS | tense | `po`, `futu`, `pressa` |
| CF | counterfactual | `noma` |
| NEG | sentence or constituent negation | `ne` |
| ABIL, POSB, PERM, OBLG, SHOULD, WOULD, HOPE | modals | `povi`, `nosi`, `dagi`, `musi`, `suvi`, `viki`, `kopi` |
| ALMOST, PROSP | approach | `tavki`, `fututi` |
| INCEP, CESS | phase | `hiro`, `teki` |
| TRY, MANAGE, TRYFAIL | effort | `telvo`, `vazdi`, `fesmo` |
| PROG, COMPL, HAB | aspect | `roni`, `tefa`, `sahi` |
| ALREADY, AGAIN, STILL | iteration | `bodu`, `reve`, `loki` |
| WIT, AUD, FELT, DREAM, REP, INFR | evidentials | `yehu`, `gesu`, `bisu`, `vuda`, `buyu`, `tosu` |
| CERT, PROB, MAYBE, WISH, IRON | attitude | `seye`, `mufe`, `poye`, `pifu`, `zoke` |
| MIR, SHARED | status | `hoyo`, `yasmo` |
| RECP, REFL | reciprocal, reflexive | `fuyi`, `sela` |
| CAUS, PERMV, PREV | valency operators | `vaku`, `lesvu`, `tekvu` |
| PASS, AGT.BY | passive, passive agent | `gome`, `gagu` |
| COP.T, COP.P, COP.PST | copulas: temporary, permanent, former | `ke`, `ka`, `kapoki` |
| BECOME, EXIST | | `loya`, `miyo` |
| Q | question particle | `ki` |
| COMP, REL, INF | complementizer, relative marker, verb chainer | `fime`, `raho`, `sidu` |
| ADVZ | adverbializer | `la` |
| TOP, FOC, ADD, EVEN, EXACT, ONLY | topic, narrow focus, "also", "even", "exactly", "only" | `hozi`, `vinto`, `tu`, `yesta`, `pendi`, `doli` |
| HORT, PLEASE | hortative, softener | `yava`, `fisa` |
| VEN, AND, TRANS, SOC, RE | motion prefixes: toward speaker, away, across, together, back | `va-`, `du-`, `taro-`, `yave-`, `revo-` |
| WH | the `ki-` interrogative correlative prefix | `ki-` |

## 3. Executive summary

**131 axioms** in nine layers (L0 11, L1 20, L2 12, L3 22, L4 23, L5 13, L6 7, L7 16, L8 7).

| Status | Axioms |
| --- | --- |
| EXPLICIT | 122 |
| IMPLICIT | 2 |
| INFERRED | 0 |
| UNDEFINED | 7 |

**55 issues.**

| Severity | Issues |
| --- | --- |
| CRITICAL | 2 |
| MAJOR | 22 |
| MINOR | 31 |

| Category | Issues |
| --- | --- |
| CONTRADICTION | 12 |
| UNDERSPECIFICATION | 11 |
| STRUCTURAL AMBIGUITY | 10 |
| GAP | 6 |
| TERMINOLOGY DRIFT | 5 |
| HOMOPHONY COLLISION | 3 |
| REDUNDANCY | 3 |
| ORDERING CONFLICT | 2 |
| SCOPE AMBIGUITY | 1 |
| ORPHAN | 1 |
| SEGMENTATION AMBIGUITY | 1 |

**Every CRITICAL issue.**

- **I-01, A ki-word question without `ki` looks like a statement with an embedded question.** Since 2.2:G60 made the final `ki` optional on ki-word questions, a statement ending in an embedded ki-word (`Maivo po masuma li talirivo ki-kasa.`) and a direct question have the same words; only `?` separates them, and song has none.
- **I-02, Question formation is stated in three incompatible ways in live text.** Three live texts (`hard_rules[4]`, `clause.questions`, `recipes[6]` with 2.2:G60) give incompatible rules for questions and exclamations, and the two read first restate superseded rulings 2.1:G46/G47.

**The MAJOR issues in one line each:** I-05 (Canonical examples put motion prefixes on verbs that are not motion verbs); I-06 ("Motion verb" is never defined); I-03 (The 20-slot template has no place for elements the rulings allow at the clause edges); I-04 (`ka` is used for location although `ke` is "location now"); I-09 (Verbless and subjectless clauses contradict "only SUBJECT and VERB are required"); I-10 (`ke` with a noun-phrase predicate (identity) is unaccounted for); I-20 (A subjectless clause is either a command or an elliptical statement); I-23 (The clause's closing order is stated twice and incompletely); I-27 (FRAME: "one word per slot" vs phrases, and what counts as a "time word"); I-12 (When `pilo` and `mare` are "used as names" is undefined, and `de` flips with it); I-13 (Chains of `de`); I-17 (Time nouns and bare measures after a verb: object or adverbial); I-25 (Manner, means, medium and spirit overlap across `en`, `yuta`, `ko`, `la`); I-28 (The noun-phrase template is incomplete); I-21 (The valency-operator pattern is stated three ways); I-22 (Which verbs passivise is defined circularly; labile verbs are not covered); I-07 (Headless `raho` used as the complementizer "that"); I-08 (The comma that closes a `raho` clause is required, and the canonical examples omit it); I-18 (`fime` + `nosi` after a verb that takes a `fime` complement); I-19 (Clause-initial `tonsi` before an adjective-initial noun phrase); I-32 (Tense inheritance is partly undefined); I-50 (Which clause a final `ki` or attitude word belongs to).

**Parse test.** 1,471 Liraasa strings in the JSON: 937 PASS, 476 PASS with a lexical homophone, 32 MULTIPLE PARSES, 26 FAIL (§6; every string in `review/grammar_spec_2_3_parses.md`).

**What the grammar already does well.** The operator template (slots 4–13), its exclusions and its scope rule are complete and consistent with every example; word formation (seven forms, the verb rule, the suffix order, compounds, derivations, numerals) is stated precisely, and all 126 word-building illustrations parse; possession, partitive and "about" are each pinned to a ruling; superseded rulings are kept and marked rather than rewritten. The problems cluster at the clause edges (questions, frames, closing order), in the copulas, in `de`, and in the gap between the summary sections (`hard_rules`, `clause`) and the rulings that have overtaken them.



## 4. Axioms

### Layer L0: primitives

### A0.1 — Letters and their sounds
Status: EXPLICIT
Depends on: none
Source: `sound.vowels`, `sound.core_consonants`, `sound.other_consonants`, `rulings[2.0:G43]`, `read_me_first[2]`
Rule (formal): `Letter ::= a|e|i|o|u|l|m|n|r|s|v|y|b|d|p|t|g|h|z|k|c|f|j` ; digraphs `sh`, `ch` occur only in colour and number words.
Rule (plain English): Liraasa is written in lowercase with these 23 letters; spelling is phonetic and is never altered. `c` is always "ch", `j` its voiced partner, `r` a tap, `g` hard; `sh` and `ch` appear only in colour and number words (`shada`, `ocha`).
Conditions and constraints: "Never change a spelling" (`read_me_first[2]`). Capitals mark sentence starts and names (A0.7).
Components used: none (orthographic)
Examples: `ocha` (8), `shada` (black), `ca` = "cha" (2.0:G43).
Interactions: A0.2, A0.9, A1.15 (numbers), A1.17 (colours).
Issues: none found

### A0.2 — Syllables and stress
Status: EXPLICIT
Depends on: A0.1
Source: `sound.stress`, `hard_rules[5]`, `rulings[0.8:R8]`, `rulings[2.0:G44]`
Rule (formal): `Syllable ::= C? V` with every written vowel the nucleus of its own syllable; stress on the penultimate syllable.
Rule (plain English): Every vowel is its own syllable (`maivo` is ma-i-vo, `opioa` is o-pi-o-a) and stress falls on the second-to-last syllable. In singing, neighbouring vowels may glide into one note without any change of spelling.
Conditions and constraints: The glide (2.0:G44) is a singing licence, not a spelling or a syllable-count rule for speech. 0.8:R8 keeps `amorliraa`, `amorrinbaa`, `amorvulraa` with each `a` its own syllable.
Components used: none
Examples: `benaasa` sung be-na-a-sa or be-naa-sa (2.0:G44).
Interactions: A1.2 (vowel-initial verbs produce double vowels), A8.6.
Issues: none found

### A0.3 — The written word, hyphens included
Status: IMPLICIT
Depends on: A0.1
Source: `small_words.correlatives`, `small_words.numbers.rules` (B, D–H), `word_building.motion_prefixes`, `rulings[2.1:G49]`, `how_to_translate.how_a_reader_parses_one_word[2]`, `[5]`, `[6]`
Rule (formal): `Word ::= Segment { "-" Segment }`; a hyphenated string is one word.
Rule (plain English): A word is a string between spaces or punctuation. Hyphens join parts of one word: correlatives (`ki-pago`), numerals (`dozira-cuara`), ordinals (`una-ne`), motion-prefixed verbs (`revo-lirala`), N-times words (`dossa-krono`, `ki-muya-krono`).
Conditions and constraints: Never stated as a definition. The reader's steps treat every hyphenated string listed above as one word, and no example separates them. Fractions are the exception: the reader expects `N-de-N` but the JSON writes them with spaces (I-15).
Components used: C:ki-, C:-ne, C:-krono, C:va-, C:du-, C:taro-, C:yave-, C:revo-
Examples: `dozira-cuara lirari` "twenty-four songs" (`examples.sentences[21]`); `Maivo revo-sabesia taivo.` "I recognize you." (`recipes[72]`).
Interactions: A1.13–A1.16, A0.6.
Issues: I-15, I-45

### A0.4 — What counts as a word of Liraasa
Status: EXPLICIT
Depends on: A0.3
Source: `hard_rules[0]`, `hard_rules[1]`, `read_me_first[3]`, `rulings[0.8:R2]`, `how_to_translate.how_a_reader_parses_one_word[9]`
Rule (formal): `ValidWord ::= ListedForm | ClosedWord | Numeral | RuleBuilt(word_building)`; any other string is "not a word of Liraasa".
Rule (plain English): A word is valid only if it is listed in the file or built by a rule of `word_building`. Of a headword's seven possible forms, only the listed ones exist; an unlisted slot "has no meaning and must never be used" (6205 such slots).
Conditions and constraints: An unused form may receive a gloss only by a case-by-case approved change (0.8:R2). Productive patterns that the rules build (derivations, image compounds, compounds, `-ti`, `-ri`, numerals, correlatives) are valid without a listing.
Components used: none
Examples: `lumina` "absence of light" is listed; an unlisted seventh form of the same root is not a word.
Interactions: A1.1 (which forms exist), A1.9, A1.12 (patterns that need no listing), I-36.
Issues: I-36

### A0.5 — Word classes
Status: EXPLICIT
Depends on: A0.4
Source: `word_building.seven_forms`, `dictionary.role_codes`, `small_words.*`, `function_words` column `use`
Rule (formal): `Open ::= Noun | Verb | Adjective` (with the ascended and negative variants of noun and adjective); `Closed ::= Article | Demonstrative | Pronoun | Preposition | Linker | Operator | Particle | Correlative | Numeral | TimeWord | Colour | DiscourseParticle`; `Name`.
Rule (plain English): Open-class words are the seven forms of headwords: noun, ascended noun, negative noun, verb, adjective, ascended adjective, negative adjective. Everything else is a closed class listed in `small_words`, or a name. There is no adverb class: an adverb is `la` + adjective (A4.17).
Conditions and constraints: A spelling may belong to two classes at once (A0.6, I-16, I-17).
Components used: all of §5
Examples: `bena` (noun), `benaba` (verb), `benasan` (adjective), `benana` (negative noun) (`word_building.seven_forms.slots`).
Interactions: A0.6, A1.1, A4.17.
Issues: I-16, I-17

### A0.6 — How a reader segments one word
Status: EXPLICIT
Depends on: A0.4, A0.5
Source: `how_to_translate.how_a_reader_parses_one_word`
Rule (formal): Try in order, stopping at the first success: (1) exact form, all readings kept; (2) closed-class word; (3) numeral, optionally `-ne`; (4) derivation `-yo|-vu|-pago`; (5) if length > 4, strip `-ri`, then `-ti`, the stem being a known form, derivation or closed word; (6) motion prefix on a verb form; (7) fraction `N-de-N`; (8) legacy spelling, warn; (9) name; (10) error.
Rule (plain English): A listed spelling always wins over a decomposition. Suffix stripping is a later resort, and a word that fits no step is an error, never a guess.
Conditions and constraints: Step 1 keeps "every reading", so a spelling in two classes stays ambiguous until syntax decides; yet step 1 precedes step 2, so a spelling that is both lexical and closed (`maivo`) is reported lexically first (I-16).
Components used: C:-yo, C:-vu, C:-pago, C:-ri, C:-ti, C:-ne, motion prefixes
Examples: `lirari` → `lira`+`-ri` "songs"; `navu` (sky) is read whole even though it ends like `-vu`.
Interactions: A1.4 (suffix order), A1.9, I-35.
Issues: I-15, I-16, I-35

### A0.7 — Names
Status: EXPLICIT
Depends on: A0.1, A0.6
Source: `how_to_translate.how_a_reader_parses_one_word[8]`, `rulings[2.0:G45]`, `rulings[0.8:R12]`, `rulings[1.2:G27]`, `rulings[1.2:G32]`
Rule (formal): `Name ::= Capitalised | KnownName`; `Name+ti` is allowed.
Rule (plain English): A name is capitalised or known; foreign names are copied, not translated; the diminutive `-ti` may attach to a personal name as an affectionate or teasing form (`Dorinti`). The kinship nouns `pilo` and `mare` may be "used as a name", which changes how `de` is read.
Conditions and constraints: When `pilo`/`mare` count as names is not stated (I-12).
Components used: C:-ti, C:de
Examples: `Tu Kipo po bumreba.` "Kipo baked too." (`recipes[36]`).
Interactions: A4.8.
Issues: I-12, I-14

### A0.8 — Punctuation that carries grammar
Status: EXPLICIT
Depends on: A0.3
Source: `clause.slots[0].notes`, `rulings[1.2:G24]`, `rulings[1.0:G21]`, `rulings[1.2:G31]`, `function_words` row `hozi`, `rulings[2.3:G83]`, `rulings[0.8:G4]`, `rulings[0.8:R4]`, `clause.linking`
Rule (formal): `Frame4 ::= (zafra|finra|lanto|kenvi) ","`; `TimeFrame ::= TimeWord (",")`; `RelClause ::= raho Clause ("," if the sentence continues)`; `Vocative ::= "," NP | NP ","`; `Topic ::= NP hozi ","`; `Quote ::= VerbOfSaying ":" "“" Sentence "”"`; `FrameTense ::= (Po|Futu) "—"`.
Rule (plain English): Commas follow the four frame words (required) and an opening time word (optional), close a raho clause that does not end the sentence, set off a person addressed, and follow a hozi topic. A direct quotation follows a colon in quotation marks. `?` and `!` mark questions and exclamations; a lone `Po`/`Futu` with a dash opens a paragraph tense frame.
Conditions and constraints: The comma that closes a raho clause is mandatory in writing ("is closed by a comma in writing and a pause in speech"); the canonical examples omit it (I-08). Whether `?` is needed to tell a ki-less question from a statement is not said (I-01).
Components used: C:raho, C:hozi, C:zafra, C:finra, C:lanto, C:kenvi
Examples: `Zafra, li dorbi po lallela.` "Suddenly the door opened." (`recipes[43]`); `Li devi po masuma: “Ki-nela roni lirala ki?”` (2.3:G83).
Interactions: A3.5, A5.11, A7.9, A7.12, A8.1.
Issues: I-01, I-08

### A0.9 — Shape templates for new roots and function words
Status: EXPLICIT
Depends on: A0.1, A0.2
Source: `sound.new_root_template`, `sound.function_word_template`, `sound.declared_one_edit_pairs`, `sound.protected_exceptions`, `rulings[2.1:G57]`, `rulings[2.0:G37]`
Rule (formal): `NewRoot ::= C V C V` (two syllables, consonant-initial, vowel-final, no initial cluster except grandfathered `kr-`, `tr-`, no three-consonant cluster, no doubled letter, distance ≥ 2 from every active word); `FunctionWord ::= 1–3 syllables, vowel-final, no initial cluster, distance ≥ 2, except declared monosyllable pairs in different syntactic positions`.
Rule (plain English): New spellings must be at least two edits from every active word. A monosyllabic function word may be one edit from another only if the pair is declared and the two belong to different syntactic positions. New roots should avoid endings that look like suffixes (`-ti -ri -na -vu -yo -asa`).
Conditions and constraints: Not retroactive (2.1:G57). Thirteen pairs are declared. Fourteen undeclared monosyllable pairs and several polysyllable pairs among closed-class words are one edit apart (I-34).
Components used: all monosyllabic function words
Examples: declared pairs `ka`/`ke`, `ki`/`ka`, `po`/`ko`, `si`/`su`, `da`/`de`, `tu`/`su` (`sound.declared_one_edit_pairs`).
Interactions: A1.9 (suffix-like endings, I-35), §5.
Issues: I-34, I-35

### A0.10 — Which edition's rules read a text
Status: EXPLICIT
Depends on: A0.4
Source: `rulings[1.0:G19]`, `rulings[2.1:G58]`, `rulings[2.3:G69]`, `rulings[2.2:G68]`, `rulings[2.3:G85]`, `album.how_to_use`
Rule (formal): `Read(text) = Grammar(edition(text))`; a respelled root keeps every meaning and empty slot, and all its derived words respell with it.
Rule (plain English): A text is read under the rules and spellings of the edition it was written in. A reader meeting a retired spelling looks it up in the legacy table. The album is canon 2.0 text read with 2.0 spellings; a construction it uses consistently is grammar, and a one-off departure is an "album reading" that keeps its meaning and is not to be imitated.
Conditions and constraints: Applies to spelling and to rules (0.8 texts that used `si` for "whether" are read under 0.8 rules, 1.0:G2).
Components used: none
Examples: `li merasan minva po milobema ala saivo de lenrari.` read today as `… saivo de zarkuri.` (`album.tracks[01].lines[6].current`).
Interactions: A0.11, A8.7.
Issues: none found

### A0.11 — Superseded rulings
Status: EXPLICIT
Depends on: A0.10
Source: `rulings[2.3:G84]`, `status` and `supersedes` fields on rulings (2.1:G46, 2.1:G47, 2.1:G54, 2.1:G59, 2.2:G64, 0.8:G4)
Rule (formal): `Grammatical(c) if c was licensed by some ruling R, even if R is superseded`; `Preferred(c) iff licensed by the superseding ruling`.
Rule (plain English): A superseded ruling stays as written. What it allowed stays grammatical in old text and "is not wrong in new text", but the superseding ruling is the one to follow.
Conditions and constraints: Live prose in the JSON still quotes superseded rulings as current (I-02).
Components used: none
Examples: 2.1:G46 "every direct question ends in ki" (superseded by 2.2:G60) still stands in `clause.questions`.
Interactions: every axiom that cites a superseded ruling: A5.3, A5.6, A5.7, A7.6, A7.9.
Issues: I-02

### Layer L1: word formation

### A1.1 — The seven forms
Status: EXPLICIT
Depends on: A0.4, A0.5
Source: `word_building.seven_forms`
Rule (formal): For a headword R: `noun ::= R`; `ascended noun ::= R+asa`; `negative noun ::= R+na`; `verb ::= R+V` (A1.2); `adjective ::= R+san`; `ascended adjective ::= R+asasan`; `negative adjective ::= R+nasan`. Only listed forms exist (A0.4).
Rule (plain English): Every headword has up to seven forms: the bare root is the noun; `-asa` and `-asasan` are the ascended noun and adjective; `-na` and `-nasan` the negative noun and adjective; `-san` the adjective; the verb follows the verb rule.
Conditions and constraints: The ascended forms are "the sacred, exalted register" in `seven_forms.explanation` but word-dependent in 2.3:G86 (A1.6). The negative forms give "the opposite or the absence" (A1.5).
Components used: C:-asa, C:-na, C:-san, C:-asasan, C:-nasan, C:V
Examples: (verbatim, `seven_forms.slots`) `benaasa` "The ultimate good, righteous; righteousness"; `benana` "Wrong, Immoral, Bad, Evil"; `benaba` "To do good"; `benasan` "good; moral"; `benaasasan` "supremely righteous".
Interactions: A1.2, A1.4, A1.19, A4.6.
Issues: none found

### A1.2 — The verb ending
Status: EXPLICIT
Depends on: A1.1
Source: `word_building.verb_rule`
Rule (formal): `V(R) ::= opioa if R = opi | R+nia if R = n… | R+sia if R = s… | R+a if R = V… | R+C₁+a otherwise`, where C₁ is R's first consonant.
Rule (plain English): Verbs are built from the root by its first letter: `n`-initial roots add `-nia`, `s`-initial `-sia`, vowel-initial `-a`; any other root adds its own first consonant + `a`. `opi` → `opioa` is the one irregular.
Conditions and constraints: Applies to listed verb slots only (A0.4). Derivations take no verb (A1.9).
Components used: C:V
Examples: (verbatim) "lira → lirala (consonant: + l + a), sabe → sabesia (s-initial), nedu → nedunia (n-initial), amor → amora (vowel-initial), opi → opioa (irregular)".
Interactions: A1.3, A0.2 (double vowels in `amorliraa`).
Issues: none found

### A1.3 — A compound's verb follows its first letter
Status: EXPLICIT
Depends on: A1.2, A1.11
Source: `word_building.verb_rule.compounds`, `word_building.compounding`, `rulings[2.1:G58]`
Rule (formal): `V(M+H) ::= V-rule applied to the first letter of M`.
Rule (plain English): A compound takes the verb class of its first letter; after a respelling, a compound's verb follows the new first letter.
Conditions and constraints: Image compounds too (`image_compounds.how_to_use`), though whether they have verbs at all is unclear (I-36).
Components used: C:V
Examples: `lunolumi` would take `-la` by its first letter `l` (CONSTRUCTED application of the stated rule; the form's listing decides whether it exists).
Interactions: A1.12, I-36.
Issues: I-36

### A1.4 — Suffix order
Status: EXPLICIT
Depends on: A1.1
Source: `word_building.suffix_order`, `settled_questions[3]`, `word_building.derivation_defaults.constraints`
Rule (formal): `Word ::= ROOT + (FORM | DERIVATION)? + (-ti)? + (-ri)?`
Rule (plain English): A word takes one form or one derivation (never both), then the diminutive `-ti`, then the plural `-ri`, which is always last. `-yo`, `-vu`, `-pago` do not combine with `-asa` or `-na`.
Conditions and constraints: Which forms may take `-ti` and `-ri` (only nouns, or verbs and adjectives too) is not stated (I-29). `-ti` is both the post-derivation slot here and itself a derivation in 2.0:G41 (I-30).
Components used: C:-ti, C:-ri, C:-yo, C:-vu, C:-pago, the seven-form suffixes
Examples: (verbatim, `inflection_examples`) `lirari` "songs (-ri plural)"; `lirati` "little song (-ti diminutive)"; `liratiri` "little songs (-ti then -ri)".
Interactions: A0.6, A1.7, A1.8, A1.9, I-35.
Issues: I-29, I-30

### A1.5 — Lexical negation `-na` / `-nasan`
Status: EXPLICIT
Depends on: A1.1
Source: `word_building.seven_forms.explanation`, `function_words` row `-na`, `rulings[0.8:G2]`
Rule (formal): `R+na` = "opposite or absence of R" (noun); `R+nasan` = its adjective.
Rule (plain English): `-na` is lexical: it makes the opposite or the absence of the root, inside the seven forms, and is distinct from sentence negation `ne`.
Conditions and constraints: Only listed forms exist. `ne` before a `nuna-` correlative makes a positive (A3.9).
Components used: C:-na, C:-nasan
Examples: `lumina` "absence of light" (`function_words`); `Li talicono ne ka neduna.` (`examples.sentences[313]`).
Interactions: A3.8.
Issues: none found

### A1.6 — Ascended forms and the sacred
Status: EXPLICIT
Depends on: A1.1
Source: `word_building.seven_forms.explanation`, `word_building.registers`, `rulings[2.3:G86]`, `rulings[0.8:R10]`
Rule (formal): `R+asa`, `R+asasan` = the ascended degree of R; `Sacred(R+asa)` depends on R and its gloss.
Rule (plain English): Ascended forms are the exalted or sacred register; whether a given one is sacred or simply the highest degree depends on the word. A sacred text uses the sacred ones. Sacred is a property of the form, not of a word list.
Conditions and constraints: `seven_forms.explanation` states the sacred reading without the 2.3:G86 qualification (a minor wording difference, noted in I-41's family of drifts but not logged separately).
Components used: C:-asa, C:-asasan
Examples: `Li lira ka vaniasasan.` "The song is sublimely / divinely beautiful." (`examples.sentences[19]`).
Interactions: A8.4.
Issues: none found

### A1.7 — Plural `-ri`
Status: EXPLICIT
Depends on: A1.4
Source: `word_building.suffixes["-ri"]`, `rulings[1.2:G28]`, `small_words.numbers.rules` (row I)
Rule (formal): `N+ri` = plural; obligatory on a plural noun with no number or quantifier; optional after one.
Rule (plain English): A plural noun takes `-ri` unless a number or quantifier already says how many, in which case `-ri` is optional, chosen "by sound and meter".
Conditions and constraints: The numbers table says instead "Plural -ri recommended above 1" (I-29). Pronoun plurals are pronoun + `ri` (`maivori`), demonstrative plurals `eliri`, `olari`.
Components used: C:-ri
Examples: `Li dossa veluri lumila.` "The two stars shine."; `Taivo guraga maivo dossa cono.` "You owe me two coins." (1.2:G28).
Interactions: A4.1, A4.11, A4.20.
Issues: I-29

### A1.8 — Diminutive `-ti`
Status: EXPLICIT
Depends on: A1.4
Source: `word_building.suffixes["-ti"]`, `word_building.derivation_defaults["-ti"]`, `rulings[2.0:G41]`, `rulings[2.0:G38]`, `rulings[0.8:R12]`
Rule (formal): `X+ti` = "a little or dear X (also affectionate)", after any form or derivation, before `-ri`.
Rule (plain English): `-ti` makes a diminutive or affectionate word, on roots, compounds and names; a compound may be lexicalised with `-ti`.
Conditions and constraints: Called a suffix of the inflection order in `suffix_order` and a derivation in 2.0:G41 (I-30).
Components used: C:-ti
Examples: `lirati` "little song"; `monruti` "hill (little mountain)" (`lexicalised_derivations`).
Interactions: A1.9, A0.7.
Issues: I-30

### A1.9 — Productive derivations `-yo`, `-vu`, `-pago`
Status: EXPLICIT
Depends on: A1.4
Source: `word_building.derivations_note`, `word_building.derivation_defaults`, `word_building.suffixes`, `rulings[2.0:G41]`, `rulings[1.0:G20]`, `word_building.lexicalised_derivations`
Rule (formal): `R+yo` = one who does R / one devoted to R; `R+vu` = a big or intense R; `R+pago` = the place of R; R any root or compound; no seven forms on the result; a listed derivation's fixed meaning overrides the default.
Rule (plain English): The three derivations attach to the spelling of any root or compound, have predictable default readings, and produce nouns that take no further forms. Prefer a listed derivation where one exists. `mavo+pago` is blocked (`mavopago` = society only).
Conditions and constraints: `pago` is also a root ("Place"), so `R+pago` is spelled the same as the compound R + `pago` (I-35).
Components used: C:-yo, C:-vu, C:-pago
Examples: `lirayo` "singer"; `lemupago` "school (place of learning)"; `tisebitivu` "sword (big knife)" (`lexicalised_derivations`).
Interactions: A1.10, A1.11, I-35.
Issues: I-35

### A1.10 — A retired listed derivation stays buildable
Status: EXPLICIT
Depends on: A1.9, A0.10
Source: `rulings[2.3:G85]`, `rulings[2.3:G70]`
Rule (formal): `Retired(listed X) ⇒ X buildable with default reading`.
Rule (plain English): A listed derivation retired for a headword can still be built with its default reading; an older text reads it through the legacy table.
Conditions and constraints: `mirunululirayo` reads `kerku` (frog) in old text.
Components used: C:-yo
Examples: none in a sentence.
Interactions: A0.10.
Issues: none found

### A1.11 — Compounds
Status: EXPLICIT
Depends on: A0.4
Source: `word_building.compounding`, `rulings[2.0:G38]`, `rulings[2.0:G42]`, `hard_rules[3]`
Rule (formal): `Compound ::= MODIFIER+HEAD`, written as one word; MODIFIER, HEAD ∈ active headwords (a colour base may be MODIFIER; either may itself be a compound); head rightmost.
Rule (plain English): A compound joins exactly two headwords, modifier first and head last. Either part may be a compound, and a colour base may be the modifier. Use listed compounds; a new compound must join two existing headwords and be flagged as new.
Conditions and constraints: Image compounds need no flag (A1.12). `hard_rules[3]` sends a noun+noun meaning to "a compound from the dictionary", i.e. a listed one.
Components used: none (a compounding process)
Examples: `lunolumi` "moon-light" (`compounding`); `larbopago + safa = larbopagosafa` (2.0:G42).
Interactions: A1.3, A1.12, A1.19, A4.7.
Issues: I-35

### A1.12 — Image compounds
Status: EXPLICIT
Depends on: A1.11
Source: `word_building.image_compounds` (`rule`, `how_to_use`, `modifiers`, `heads`, `attested`, `count`), `rulings[2.0:G40]`
Rule (formal): `ImageCompound ::= M+H`, M ∈ 57 listed modifiers, H ∈ 31 listed heads; meaning "<M.as_modifier> <H>", i.e. `<H.template> <M.sense>`.
Rule (plain English): Any listed modifier + any listed head is a valid noun with a predictable meaning and needs no "new" flag; 391 of the 1,767 pairs are attested and their reading is preferred.
Conditions and constraints: "is a valid noun" vs "Its verb class follows its first letter" (I-36).
Components used: none
Examples: "luno + savali = lunosavali, 'moonlit kiss; an intimate kiss recalling moonlight'" (`image_compounds.rule`).
Interactions: A1.3, A0.4.
Issues: I-36

### A1.13 — Motion prefixes
Status: EXPLICIT
Depends on: A1.2
Source: `word_building.motion_prefixes`, `settled_questions[6]`, `rulings[1.2:G35]`, `rulings[2.3:G75]`
Rule (formal): `MotionVerb ::= (va-|du-|taro-|yave-|revo-) + Verb`, Verb ∈ motion verbs ∪ {`revo-vimova`, `revo-lirala`, `revo-sabesia`, `yave-donuda`}.
Rule (plain English): Five prefixes (toward the speaker, away, across, together, back/again) attach with a hyphen to motion verbs and to four curated metaphors only. The list is closed and not productive; `lu-`, `nu-`, `mi-`, `so-` are retired.
Conditions and constraints: "Motion verb" is not defined by a list; `pagopa` had to be ruled one (2.3:G75) (I-06). The canonical examples put `va-` and `revo-` on non-motion verbs (I-05).
Components used: C:va-, C:du-, C:taro-, C:yave-, C:revo-
Examples: `Maivo revo-sabesia taivo.` "I recognize you."; `Yave-donuda li bumre, fisa.` "Share the bread, please." (1.2:G35); `taivo ne taro-pagopa, …` (2.3:G75).
Interactions: A0.3, A0.6.
Issues: I-05, I-06

### A1.14 — Correlatives
Status: EXPLICIT
Depends on: A0.3
Source: `small_words.correlatives`, `rulings[1.2:G34]`, `rulings[2.1:G49]`, `rulings[0.8:G1]`
Rule (formal): `Correlative ::= (ki|eli|ola|toda|nuna|somi) "-" (coda|pago|krono|nela|modo|kasa) | (muya|poka|rada) "-krono" | NUMBER "-krono" | "ki-muya-krono"`.
Rule (plain English): Six determiners × six bases give question words, demonstratives, universals, negatives and indefinites of thing, place, time, person, manner and reason; `muya-`, `poka-`, `rada-` combine only with `krono` (frequency); NUMBER-krono is "N times".
Conditions and constraints: `coda` and `modo` are not words on their own (I-44). `una-krono` never means "formerly" (2.1:G49).
Components used: C:ki-, C:-krono
Examples: `Maivo lirala muya-krono.` "I sing often." (`recipes[40]`); `dossa-krono` "twice" (`recipes[41]`).
Interactions: A3.9 (`nuna-`), A5.4, A4.19.
Issues: I-44

### A1.15 — Cardinal numerals
Status: EXPLICIT
Depends on: A0.3
Source: `small_words.numbers.rules`, `small_words.numbers.examples`
Rule (formal): `Num ::= Digit | Decade ("-" Digit)? | Hundred ("-" Rest)? | Group "-mililumi" … | Group "-megalumi" …`; digits `zira…niva`; decades `unzira, dozira, trezira, cuazira, penzira` (memorised), then digit+`zira`; `centa`, digit+`centa`; `mililumi`, `megalumi`.
Rule (plain English): Numbers are built from fixed digits, memorised or formulaic decades and hundreds, and the scale words `mililumi` (1000) and `megalumi` (1,000,000), read in descending groups with hyphens, zero groups omitted, no "and".
Conditions and constraints: "Keep components joined in writing" sits beside hyphenated examples (I-45). Negative and decimal numbers "await separate policy" (I-45).
Components used: numerals
Examples: (verbatim) `365` = `tressacenta-sesazira-penta`; `24` = `dozira-cuara`.
Interactions: A1.16, A4.11.
Issues: I-45

### A1.16 — Ordinals and fractions
Status: EXPLICIT
Depends on: A1.15
Source: `settled_questions[5]`, `small_words.numbers.rules` (row J), `small_words.numbers.ordinals_and_fractions`, `rulings[2.1:G53]`, `how_to_translate.how_a_reader_parses_one_word[2]`, `[6]`
Rule (formal): `Ordinal ::= NUMBER "-ne"` (before the noun); `Fraction ::= NUMBER de NUMBER`.
Rule (plain English): Ordinals add `-ne` with a hyphen (`una-ne`, first) and stand before the noun; fractions are NUMBER `de` NUMBER (`tressa de cuara`, three quarters). `ne` after a number is never negation.
Conditions and constraints: Fractions are spaced in the text and hyphenated in the reader (I-15). NUMBER `de` X is also the partitive (A4.10), so a fraction and a partitive can share a surface (I-15).
Components used: C:-ne, C:de
Examples: `una-ne krono` "the first time" (2.1:G49).
Interactions: A3.8 (ne precedes what it negates), A4.10.
Issues: I-15

### A1.17 — Colour words
Status: EXPLICIT
Depends on: A0.5
Source: `small_words.colours`, `rulings[2.0:G38]`, `rulings[2.0:G39]`
Rule (formal): `Colour ::= base (+narvo | +bio | +juba | +lumi)`; nine bases.
Rule (plain English): Colours are a closed class of nine families, each with base, dark, vivid, gem and light grades. A colour base may be a compound's modifier. `aurumijuba` (gold) and `vanajuba` (silver) are also headwords.
Conditions and constraints: How a colour word functions in the clause (as adjective before a noun, as a noun, with a copula) is not stated; the examples use it adjectivally and nominally (e.g. `azurijuba` as a noun in `album.tracks[09]`).
Components used: none
Examples: `shadalumi` "grey" (`colours` notes).
Interactions: A1.11, A4.5.
Issues: I-16 (the same lexical/closed double reading affects `aurumijuba`, `vanajuba`)

### A1.18 — Adjective from noun for noun + noun meanings
Status: EXPLICIT
Depends on: A1.1
Source: `rulings[ADR-0011]`, `hard_rules[3]`, `recipes[24]`
Rule (formal): For N₁ modifying N₂: `ADJ(N₁) N₂` where `ADJ(R)=R+san`, `ADJ(R+asa)=R+asasan`, `ADJ(R+na)=R+nasan`, if listed; else a listed compound; else `N₂ de N₁`.
Rule (plain English): A noun never modifies a noun directly. The first noun becomes its adjective, if that form is listed; otherwise use a listed compound of the two, or a `de` phrase.
Conditions and constraints: The recipe carrying it has `"status": "awaiting author review"` (I-52).
Components used: C:-san, C:-asasan, C:-nasan, C:de
Examples: `lirasan lavra` "songbird" (ADR-0011); `lira de lavra` (ADR-0011 fallback).
Interactions: A4.7, A1.11, A4.15 (side nouns), I-53.
Issues: I-52, I-53

### A1.19 — Negative and decimal numbers
Status: UNDEFINED
Depends on: A1.15
Source: `small_words.numbers.rules` (row J: "negative and decimal numbers await separate policy")
Rule (formal): none.
Rule (plain English): Missing rule: how to write a negative number and a non-fraction decimal.
Conditions and constraints: The JSON names the gap itself.
Components used: none
Examples: none.
Interactions: A1.15, A1.16.
Issues: I-45

### A1.20 — The class of motion verbs
Status: UNDEFINED
Depends on: A1.13
Source: `word_building.motion_prefixes.rule`, `rulings[2.3:G75]`
Rule (formal): none (`MotionVerb` is used but not enumerated or characterised).
Rule (plain English): Missing rule: which verbs are motion verbs and so accept the motion prefixes.
Conditions and constraints: 2.3:G75 adds `pagopa` by ruling, which shows the class is open-ended in practice.
Components used: motion prefixes
Examples: `va-nulunia` "go toward while traveling" (`examples.sentences[181]`) is licensed only if `nulunia` is a motion verb.
Interactions: A1.13.
Issues: I-06

### Layer L2: the minimal clause

### A2.1 — The minimal sentence
Status: EXPLICIT
Depends on: A0.5
Source: `clause.explanation`, `clause.template`, `clause.slots[2]`, `clause.slots[13]`
Rule (formal): `Clause ::= SUBJECT VERB` (all other slots optional); `SUBJECT ::= NP | Pronoun`.
Rule (plain English): Only the subject and the verb are required. The subject is obligatory "except in commands, hortatives and permitted ellipsis".
Conditions and constraints: Verbless predicates (`lira benasan`) and the subjectless existential `miyo` are allowed elsewhere in the JSON (I-09).
Components used: none
Examples:
```
Maivo  lira-la.
1SG    song-V
'I sing.'                        (CONSTRUCTED from recipes; cf. "Maivo lirala la molusan.")
Maivo  amora   taivo.
1SG    love.V  2SG
'I love you.'                    (examples.sentences[0])
```
Interactions: A2.2, A2.4, A2.6–A2.8.
Issues: I-09

### A2.2 — Basic word order: S V O, fixed
Status: EXPLICIT
Depends on: A2.1
Source: `hard_rules[2]`, `clause.template`
Rule (formal): `Clause ::= (FRAME) (TOPIC) SUBJECT {Operator} VERB (OBJECT) {ADJUNCT} (fuyi) (hoyo|yasmo) (ATTITUDE) (ki)`.
Rule (plain English): "Word order is fixed: SUBJECT, then preverbal operators, then VERB, then OBJECT, then adjuncts."
Conditions and constraints: Rulings allow material outside this order: a fronted ki-word (2.2:G60), a raho question word (2.3:G74), a line-initial `ata`/`oro`/`nara` (2.3:G72, G78), a closing time word (1.2:G24), a vocative after `ki` (1.2:G31), a post-object duration (2.1:G55). None has a slot (I-03).
Components used: the operator slots (A3.1)
Examples: `Maivo po tefa ramura li nole.` "I had finished remembering the name." (`examples.sentences[17]`).
Interactions: A3.1, A5.3, A7.1, A3.21.
Issues: I-03

### A2.3 — Subject and object are told apart by position
Status: IMPLICIT
Depends on: A2.2
Source: `small_words.pronouns` (one form per pronoun; no case column), `examples.sentences[0]` `Maivo amora taivo.`, `examples.sentences[31]` `Li linu sapusia nami.`
Rule (formal): `NP before VERB = subject; NP after VERB = object`; no case marking.
Rule (plain English): Nouns and pronouns have no case; the subject precedes the verb and the object follows it.
Conditions and constraints: Every example has this order. The rule is never stated as such; `hard_rules[2]` states only the order. After a valency operator the NP after the operator is the actor (A6.3). After a give-type verb a bare pronoun after the verb is the recipient (A2.10).
Components used: none
Examples: `Maivo amora taivo.` "I love you." / `Taivo nedunia miru.` "You need water." (`examples.sentences[28]`).
Interactions: A6.3, A2.10.
Issues: I-20 (when the subject is absent, position alone no longer tells a command from an ellipsis)

### A2.4 — When the subject may be absent
Status: EXPLICIT
Depends on: A2.1
Source: `clause.slots[2].notes`, `rulings[1.2:G31]`, `rulings[2.1:G56]`, `rulings[0.8:G3]`, `function_words` row `yava`, `function_words` row `miyo`
Rule (formal): `SUBJECT = ∅` iff command | hortative (`yava`) | permitted ellipsis (repeated subject in coordination, answers).
Rule (plain English): A clause has no subject only in a command, a hortative, or permitted ellipsis: a repeated subject in coordinated clauses, an answer such as `Po sapusia.`
Conditions and constraints: The existential `miyo` clause has no subject and is not on this list (I-09). Nothing in the clause tells a command from an elliptical statement (I-20).
Components used: C:yava, C:fisa
Examples: `Fisa, lisrola.` "Please stay." (`recipes[12]`); `Taivo po sapusia ki? — … Po sapusia.` (`recipes[10]`).
Interactions: A5.8, A5.9, A8.2.
Issues: I-09, I-20

### A2.5 — Transitivity is usage-based
Status: EXPLICIT
Depends on: A2.2
Source: `settled_questions[4]`
Rule (formal): `Transitive(V, clause) iff V has an OBJECT in that clause`; no lexical flag.
Rule (plain English): Any verb may take an object or not; whether it is transitive is decided by its use in the clause.
Conditions and constraints: The passive test built on this is circular (I-22).
Components used: C:gome
Examples: `Maivo pensapa.` "I think." (`examples.sentences[34]`) vs `Maivo farlafa baba lira.` "I create a song." (`examples.sentences[35]`).
Interactions: A6.4.
Issues: I-22

### A2.6 — Copular clauses with `ke` and `ka`
Status: EXPLICIT
Depends on: A2.1
Source: `clause.copulas`, `clause.slots[13]`, `function_words` rows `ke`, `ka`, `recipes[4]`
Rule (formal): `CopClause ::= SUBJECT {Operator} (ke|ka) Predicate`; `Predicate ::= ADJ | NP | PP`.
Rule (plain English): `ke` is "is" for a temporary state or a location now; `ka` is "is" for a permanent quality or identity. Both fill the verb slot and take the preverbal operators (`po ka`, `ne ka`).
Conditions and constraints: The examples use `ka` for locations (5 times) and `ke` for identity with a noun phrase (often) (I-04, I-10).
Components used: C:ke, C:ka
Examples:
```
Li   nela    ke     bena-san.
DEF  person  COP.T  good-ADJ
'The person is good at the moment.'   (examples.sentences[1])
Li   sora    ka     bena-san.
DEF  friend  COP.P  good-ADJ
'The friend is good by nature.'       (examples.sentences[2])
```
Interactions: A2.7, A2.8, A2.9, A6.5.
Issues: I-04, I-10

### A2.7 — Bare predicate adjective
Status: EXPLICIT
Depends on: A2.6
Source: `clause.copulas` ("A predicate adjective may also stand bare: lira benasan."), `examples.sentences[184]`
Rule (formal): `Clause ::= SUBJECT ADJ` (no verb).
Rule (plain English): An adjective may be predicated of a subject with no copula.
Conditions and constraints: Conflicts with "Only SUBJECT and VERB are required" (a clause needs a verb) and with the self-check error "a second noun phrase but the clause has no verb or copula". Whether a bare predicate takes tense, negation or operators, and whether it means `ke` or `ka`, is not stated (I-09).
Components used: none
Examples: `lira benasan` (`clause.copulas`); `Nela vanisan.` "The person is beautiful." (`examples.sentences[184]`).
Interactions: A2.1, A2.6, A4.6.
Issues: I-09

### A2.8 — Existence: `miyo`
Status: EXPLICIT
Depends on: A2.1
Source: `function_words` row `miyo`, `recipes[16]`
Rule (formal): `ExistClause ::= (Operators) miyo NP (PP)`.
Rule (plain English): "There is / are" is `miyo` + noun phrase, optionally with a location; it does not agree.
Conditions and constraints: No subject, contrary to A2.1 and A2.4 (I-09). The row's own example cells are `null`.
Components used: C:miyo
Examples: `Miyo baba sora en li nimu.` "There is a friend in the home." (`recipes[16]`).
Interactions: A2.1.
Issues: I-09

### A2.9 — Becoming and having been: `loya`, `kapoki`
Status: EXPLICIT
Depends on: A2.6
Source: `function_words` rows `loya`, `kapoki`, `po`; `recipes[17]`; `clause.slots[13]`
Rule (formal): `SUBJECT (TENSE) loya (ADJ|NP)`; `SUBJECT kapoki Predicate`.
Rule (plain English): `loya` is "become"; `kapoki` is the "previously was / no longer is" copula.
Conditions and constraints: The `kapoki` row says "po + ka is also regular" (as if the same), the `po` row says "po ka = was as a trait; kapoki = no longer is" (as if different) (I-11). Whether `kapoki` takes tense or other operators is not stated.
Components used: C:loya, C:kapoki
Examples: `Li nullo po loya sovesan.` "The night became peaceful." (`recipes[17]`); `saivo kapoki benasan` "they were formerly good" (`function_words`).
Interactions: A2.6, A3.4.
Issues: I-11

### A2.10 — Give-type verbs: where the recipient goes
Status: EXPLICIT
Depends on: A2.3
Source: `rulings[1.2:G26]`, `recipes[69]`, `recipes[70]`, `self_check[7]`
Rule (formal): `GiveClause ::= SUBJECT … V THEME ala RECIPIENT | SUBJECT … V PRONOUN THEME`.
Rule (plain English): Verbs of giving (give, lend, send, owe, sell, pay, bring, teach, show) take the theme first and the recipient with `ala`; a pronoun recipient may instead stand bare right after the verb.
Conditions and constraints: The class is given only as English glosses (I-38). Several album lines put `ala` + pronoun + `de` before the theme (AR-07, AR-08, AR-11–13), which the album notes read as possession (I-38).
Components used: C:ala
Examples: `Taivo guraga maivo dossa cono.` "You owe me two coins."; `Fisa, rimara tressa cono ala maivo.` "Please lend me three coins." (1.2:G26).
Interactions: A4.8.
Issues: I-38

### A2.11 — One verb per clause
Status: EXPLICIT
Depends on: A2.1
Source: `how_to_translate.steps[0]`, `self_check[5]`
Rule (formal): `|VERB| = 1` per clause; a second verb requires a linker (`ata`, `sidu`, `fime`, a subordinator, …).
Rule (plain English): Each clause has exactly one verb; a second verb needs a linker word.
Conditions and constraints: Valency operators and `gome` count as the verb slot with an embedded verb (A6.3, A6.4); `sidu` chains are a licensed second verb (A6.1).
Components used: linkers (A7.3)
Examples: `Maivo desida sidu lirala.` "I want to sing." (`recipes[56]`).
Interactions: A6.1, A6.3, A6.4, A7.1.
Issues: none found

### A2.12 — An event as subject of `venreva`
Status: EXPLICIT
Depends on: A2.1
Source: `rulings[1.0:G23]`
Rule (formal): `NP[event] venreva` = "take place, happen".
Rule (plain English): `venreva` ("come") with an event as its subject means the event takes place.
Conditions and constraints: A lexical-grammatical rule for one verb.
Components used: none
Examples: `Li dapadonu po venreva kroti li foji` "the sale took place before winter" (1.0:G23).
Interactions: A4.18 (`kroti`).
Issues: none found


### Layer L3: clause-level modification

### A3.1 — The preverbal operator slots
Status: EXPLICIT
Depends on: A2.2
Source: `clause.template`, `clause.slots[3]`–`clause.slots[12]`
Rule (formal): `Preverbal ::= (TENSE) (noma) (ne) (MODAL) (APPROACH) (PHASE) (EFFORT) (ASPECT) (ITERATION) (EVIDENTIAL)` between SUBJECT and VERB, in this order.
Rule (plain English): Up to ten operator slots stand between subject and verb in a fixed order: tense, counterfactual, negation, modal, approach, phase, effort, aspect, iteration, evidential.
Conditions and constraints: One word per slot (A3.2). `ne` "floats" (A3.8). `reve` and `loki` may instead close the clause (A3.15). An operator after the verb or out of order is an error (`self_check[16]`).
Components used: C:po, C:futu, C:pressa, C:noma, C:ne, the modals, C:tavki, C:fututi, C:hiro, C:teki, C:telvo, C:vazdi, C:fesmo, C:roni, C:tefa, C:sahi, C:bodu, C:reve, C:loki, the evidentials
Examples:
```
Maivo  po   noma  suvi    lira-la.
1SG    PST  CF    SHOULD  song-V
'I should have sung (but I didn't).'   (recipes[49])
```
Interactions: A3.2–A3.16, A6.3.
Issues: none found

### A3.2 — One word per slot; excluded pairs
Status: EXPLICIT
Depends on: A3.1
Source: `clause.stacking.one_per_slot`, `clause.stacking.exclusions`, `rulings[1.0:G16]`, `clause.slots[6].notes`, `clause.slots[12].notes`
Rule (formal): `∀ slot: |words| ≤ 1`; `¬(hiro ∧ roni)`, `¬(hiro ∧ tefa)`, `¬(teki ∧ roni)`, `¬(teki ∧ tefa)`, `¬((telvo|vazdi|fesmo) ∧ tefa)`, `¬(zoke ∧ (seye|mufe|poye|pifu))`, `¬(tavki ∧ fututi)`, `¬(hoyo ∧ yasmo)`; at most one modal and one evidential.
Rule (plain English): Each slot holds one word; thirteen pairs never co-occur.
Conditions and constraints: "One word per slot" collides with FRAME holding several time phrases (2.3:G78) and with phrase-sized slots (I-27).
Components used: as A3.1, plus attitude and status words
Examples: `Maivo po tavki ralnora.` "I almost fell." (`function_words` row `tavki`).
Interactions: A3.11–A3.19, I-27.
Issues: I-27

### A3.3 — Scope by position
Status: EXPLICIT
Depends on: A3.1
Source: `rulings[1.0:G1]`, `clause.stacking.scope`, `clause.scope_operators.rule`
Rule (formal): `Scope(op_i) ⊇ {op_j : j > i} ∪ {VERB}` for preverbal operators.
Rule (plain English): Every preverbal operator scopes over everything to its right.
Conditions and constraints: For `ne`, three wordings differ: "everything to its right up to the verb" (`stacking.scope`), "the single constituent that follows" (1.0:G1), "immediately before the constituent they scope over" (`scope_operators.rule`) (I-33).
Components used: preverbal operators, C:ne
Examples: `po ne vazdi lirala` "didn't manage to sing" vs `po vazdi ne lirala` "managed not to sing" (1.0:G15).
Interactions: A3.8.
Issues: I-33

### A3.4 — Tense
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[3]`, `how_to_translate.steps[2]`, `function_words` rows `po`, `futu`, `pressa`, `recipes[0]`, `recipes[1]`
Rule (formal): `TENSE ::= po | futu | pressa | ∅`; `∅` = present.
Rule (plain English): Past is `po`, future `futu`, after the subject and before the verb. Present needs no marker; `pressa` is an optional, emphatic present ("unmarked present preferred"). Tense is not obligatory.
Conditions and constraints: An unmarked clause may take its tense from a paragraph frame (A3.5), from the main clause (A7.8) or from narrative context in verse (A3.6). `po` and `futu` are also listed as "time words" (I-27).
Components used: C:po, C:futu, C:pressa
Examples:
```
Maivo  po   lira-la.
1SG    PST  song-V
'I sang.'                         (examples.sentences[5])
Maivo  futu  ne   lira-la.
1SG    FUT   NEG  song-V
'I will not sing.'                (examples.sentences[6])
```
Interactions: A3.5, A3.6, A3.7, A7.8.
Issues: I-27, I-32

### A3.5 — Paragraph tense frame
Status: EXPLICIT
Depends on: A3.4
Source: `rulings[0.8:R4]`, `recipes[73]`
Rule (formal): `Paragraph ::= (po|futu) "—" {Clause}`; unmarked main clauses take that tense until another tense word, `pressa`, or the paragraph's end.
Rule (plain English): A lone `Po` or `Futu` opening a paragraph or turn sets the tense of the following unmarked main clauses. Optional. Time words do not set a frame.
Conditions and constraints: A clause-initial `po` that is not alone is ordinary tense; the four-way listing of `po` (tense, time word, frame, "Past") is drift (I-27).
Components used: C:po, C:futu, C:pressa
Examples: `Po — Maivo semnesia ligo li tabu. Maivo pressa loki semnesia eli-pago.` (`recipes[73]`).
Interactions: A3.4, A3.6.
Issues: I-27

### A3.6 — Narrative present in verse
Status: EXPLICIT
Depends on: A3.4
Source: `rulings[1.2:G31]`
Rule (formal): In verse, once time is set, `∅`-tense clauses may narrate past events.
Rule (plain English): In verse, the bare present may narrate the past once the time has been set.
Conditions and constraints: "Once the time has been set" is not defined (by a tense word, a frame, a time word?).
Components used: none
Examples: none given in the ruling.
Interactions: A3.5, A8.4.
Issues: I-32

### A3.7 — Counterfactual `noma`
Status: EXPLICIT
Depends on: A3.4
Source: `clause.slots[4]`, `rulings[1.0:G6]`, `rulings[1.0:G16]`, `function_words` row `noma`, `recipes[49]`, `recipes[50]`, `recipes[9]`
Rule (formal): `noma` in slot 5, after TENSE, before `ne`; requires a tense, modal or `si`-clause context. "should have" = `po noma suvi`; "could have" = `po noma povi`; "would have" = `po viki` (in a consequence clause) or `po noma viki`; `noma … pifu` = "if only".
Rule (plain English): `noma` marks a clause as contrary to fact.
Conditions and constraints: Two forms for "would have" with no stated difference (I-39).
Components used: C:noma, C:suvi, C:povi, C:viki, C:pifu
Examples: `Si maivo po noma masuma, taivo po viki relsira.` "If I had asked, you would have answered." (`recipes[50]`); `Taivo po noma lisrola pifu.` "If only you had stayed." (`recipes[9]`).
Interactions: A3.10, A3.19, A7.4.
Issues: I-39

### A3.8 — Negation `ne`
Status: EXPLICIT
Depends on: A3.1, A3.3
Source: `hard_rules[4]`, `clause.slots[5]`, `clause.scope_operators`, `rulings[0.8:G2]`, `rulings[1.0:G15]`, `recipes[2]`, `recipes[3]`, `settled_questions[5]`
Rule (formal): `ne X`, X ∈ {an operator, VERB, copula, NP, number, fragment, contrasted constituent}; default slot 6.
Rule (plain English): `ne` stands immediately before what it negates. In the clause its default place is after tense and `noma`; it may also stand before any later operator or the verb. Before an operator it negates the operator; after it, the event. It may also negate a noun phrase or fragment (`Ne eli`), or a contrasted constituent (`ne X, nara Y`).
Conditions and constraints: `ne` after a number is never negation (the ordinal `-ne`, hyphenated). Scope wording differs (I-33).
Components used: C:ne
Examples: `Maivo ne povi lirala. / Maivo povi ne lirala.` "I cannot sing. / I am able not to sing." (`recipes[3]`); `Maivo po bumreba ne tressa, nara cuara bumreri.` (`small_words.discourse_particles[1].examples[3]`).
Interactions: A3.9, A5.8, A7.2, A1.16.
Issues: I-33, I-20

### A3.9 — `ne` with a `nuna-` word
Status: EXPLICIT
Depends on: A3.8, A1.14
Source: `rulings[0.8:G2]`, `self_check` (warn 0.8), `examples.sentences[269]`
Rule (formal): `ne … nuna-X` = ¬¬ = positive.
Rule (plain English): Negation is compositional: `ne` with a `nuna-` correlative reads as a positive and is to be avoided.
Conditions and constraints: The example list, described as "canon sentences, all correct. Imitate", includes the avoided sentence (I-40).
Components used: C:ne, C:nuna
Examples: `Maivo ne sabesia nuna-coda.` "It isn't true that I know nothing. (= I know something; avoid)" (`examples.sentences[269]`).
Interactions: A3.8.
Issues: I-40

### A3.10 — Modals
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[6]`, `rulings[1.0:G3]`, `rulings[1.0:G4]`, `rulings[1.0:G5]`, `function_words` rows `povi`, `nosi`, `dagi`, `musi`, `suvi`, `viki`, `kopi`
Rule (formal): `MODAL ::= povi (ability) | nosi (epistemic possibility) | dagi (permission) | musi (obligation, circumstantial necessity) | suvi (advisability) | viki (hypothetical) | kopi (hope to)`; one per clause.
Rule (plain English): One modal per clause, in slot 7. Logical "must" is not `musi` but the evidential `tosu` + `seye` (A3.16); intent is `dorvada sidu VERB`, not `kopi`.
Conditions and constraints: none beyond A3.2.
Components used: C:povi, C:nosi, C:dagi, C:musi, C:suvi, C:viki, C:kopi
Examples: `Taivo dagi lisrola.` "You may stay." (`recipes[46]`); `saivo nosi lirala` "they might sing" (`recipes[45]`).
Interactions: A3.7, A3.8, A3.16, A6.6.
Issues: none found

### A3.11 — Approach: `tavki`, `fututi`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[7]`, `rulings[1.0:G7]`, `function_words` rows `tavki`, `fututi`, `rulings[1.2:G24]`
Rule (formal): `APPROACH ::= tavki ("almost") | fututi ("about to")`; `fututi` clause-initial or clause-final = time word "soon".
Rule (plain English): `tavki` is "almost", `fututi` in the approach slot "about to"; as a clause-edge time word `fututi` means "soon". Position decides.
Conditions and constraints: Mutually exclusive (A3.2).
Components used: C:tavki, C:fututi
Examples: `Maivo po fututi pagopa` "I was about to leave" (1.0:G7); `fututi maivo lirala` "soon I sing" (`function_words`).
Interactions: A3.2, A4.18.
Issues: none found

### A3.12 — Phase: `hiro`, `teki`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[8]`, `function_words` rows `hiro`, `teki`
Rule (formal): `PHASE ::= hiro ("begin to") | teki ("stop")`; excludes `roni`, `tefa`.
Rule (plain English): Inceptive and cessative operators.
Conditions and constraints: A3.2 exclusions.
Components used: C:hiro, C:teki
Examples: `Li veluri po hiro lirala.` "The stars began to sing."; `Kipo po teki resora.` "Kipo stopped laughing." (`function_words`).
Interactions: A3.2, A6.3.
Issues: none found

### A3.13 — Effort: `telvo`, `vazdi`, `fesmo`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[9]`, `function_words` rows `telvo`, `vazdi`, `fesmo`, `rulings[1.0:G15]`
Rule (formal): `EFFORT ::= telvo ("try") | vazdi ("manage") | fesmo ("try and fail")`; excludes `tefa`.
Rule (plain English): Effort operators, negated by position (A3.8).
Conditions and constraints: A3.2.
Components used: C:telvo, C:vazdi, C:fesmo
Examples: `Saivo po vazdi hirnaha.` "They managed to escape." (`function_words`).
Interactions: A3.8, A6.3.
Issues: none found

### A3.14 — Aspect: `roni`, `tefa`, `sahi`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[10]`, `function_words` rows `roni`, `tefa`, `sahi`, `rulings[0.8:G5]`
Rule (formal): `ASPECT ::= roni (progressive) | tefa (completed) | sahi (habitual)`. Inside an inheriting subordinate clause: `tefa` = prior, `nayo`/`roni` = simultaneous, `futu` = subsequent, `sahi` = habitual.
Rule (plain English): Three aspects; in subordinate clauses that inherit tense, aspect words express relative time.
Conditions and constraints: Which clauses inherit is partly open (A7.8).
Components used: C:roni, C:tefa, C:sahi
Examples: `Maivo roni lirala.` "I am singing." (`examples.sentences[4]`); `Maivo po tefa ramura li nole.` (`examples.sentences[17]`).
Interactions: A3.2, A7.8.
Issues: I-32

### A3.15 — Iteration: `bodu`, `reve`, `loki`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[11]`, `function_words` rows `bodu`, `reve`, `loki`, `rulings[1.0:G8]`
Rule (formal): `ITERATION ::= bodu | reve | loki`; `reve`, `loki` may instead be clause-final.
Rule (plain English): "Already", "again", "still / keep on"; `reve` and `loki` may close the clause instead.
Conditions and constraints: Where a clause-final `reve`/`loki` stands relative to adjuncts, `fuyi`, status and attitude words is not stated (I-23).
Components used: C:bodu, C:reve, C:loki
Examples: `Maivo reve lirala.` "I sing again." (`function_words`).
Interactions: A3.21.
Issues: I-23

### A3.16 — Evidentials
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[12]`, `rulings[2.1:G51]`, `rulings[1.0:G4]`, `function_words` rows `yehu`, `gesu`, `bisu`, `vuda`, `buyu`, `tosu`
Rule (formal): `EVIDENTIAL ::= yehu | gesu | bisu | vuda | buyu | tosu`, one per clause, immediately before the verb.
Rule (plain English): Six evidentials (witnessed, heard, felt, dreamed, reported, inferred). No evidential makes no claim about the source. Inside `fime` the evidential reports the main-clause subject's evidence; in a question it asks the listener's. "Must (logically)" is `tosu` + `seye`.
Conditions and constraints: Under a valency operator the evidential belongs to the main clause only (1.0:G14).
Components used: the six evidentials, C:seye
Examples: `Kipo po tosu bumreba seye.` "Kipo must have baked (I can tell from the evidence)." (`recipes[48]`).
Interactions: A3.19, A6.3, A7.10.
Issues: none found

### A3.17 — Reciprocal `fuyi`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[16]`, `function_words` row `fuyi`
Rule (formal): `fuyi` in slot 17, after ADJUNCTS; requires a plural or multiple subject.
Rule (plain English): "Each other" is `fuyi` after the adjuncts, with a plural subject.
Conditions and constraints: Whether `fuyi` replaces the object (examples show no object) is implicit, not stated.
Components used: C:fuyi
Examples: `Maivori amora fuyi.` "We love each other." (`examples.sentences[70]`); `Da ola-krono, maivori lirala fuyi.` (2.3:G79).
Interactions: A3.21.
Issues: I-23

### A3.18 — Status: `hoyo`, `yasmo`
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[17]`, `function_words` rows `hoyo`, `yasmo`
Rule (formal): `STATUS ::= hoyo (mirative) | yasmo (shared knowledge)`, slot 18, "after the predicate, before certainty".
Rule (plain English): Mirative and "as is known" markers follow the predicate and precede the attitude word.
Conditions and constraints: Mutually exclusive.
Components used: C:hoyo, C:yasmo
Examples: `Li dorbi ke lallesan hoyo!` "The door is open — I didn't know!" (`function_words`).
Interactions: A3.19, A3.21.
Issues: I-41

### A3.19 — Attitude words
Status: EXPLICIT
Depends on: A3.1
Source: `clause.slots[18]`, `rulings[1.0:G22]`, `rulings[0.8:R9]`, `rulings[2.1:G48]`, `function_words` rows `seye`, `mufe`, `poye`, `pifu`, `small_words.discourse_particles[3]` (`zoke`)
Rule (formal): `ATTITUDE ::= seye | mufe | poye | pifu | zoke`, clause-final, before `ki`; `zoke` excludes the others.
Rule (plain English): Certainty, probability, possibility, wish/blessing and irony are marked by one clause-final word; these never open a clause ("Perhaps, …" is written with the clause-final `poye`). `pifu` with any subject is the blessing form.
Conditions and constraints: Called "final certainty" (function words), ATTITUDE (template), "certainty marker" (0.8:R9) (I-41). In a sentence of several clauses, the clause it scopes over is not stated (I-50).
Components used: C:seye, C:mufe, C:poye, C:pifu, C:zoke
Examples: `Taivo lirala poye ki?` (0.8:R9); `Li lumi tivrota taivo pifu.` "May the Light hold you." (`recipes[8]`).
Interactions: A3.21, A5.10, A8.3.
Issues: I-41, I-50

### A3.20 — Pre-constituent operators
Status: EXPLICIT
Depends on: A3.3
Source: `clause.scope_operators`, `rulings[1.0:G1]`, `rulings[1.0:G13]`, `rulings[1.0:G18]`, `function_words` rows `doli`, `tu`, `yesta`, `pendi`, `vinto`
Rule (formal): `Op X` with Op ∈ {`ne`, `doli`, `tu`, `yesta`, `pendi`, `vinto`}; X = the single constituent that follows (NP, verb, adjective, number, clause-introducer such as `si`).
Rule (plain English): "Only", "also", "even", "exactly", narrow focus and negation stand immediately before the constituent they scope over, wherever it is.
Conditions and constraints: `hozi` and `vinto` never mark the same constituent (A8.1).
Components used: C:doli, C:tu, C:yesta, C:pendi, C:vinto, C:ne
Examples: `Tu Kipo po bumreba.` "Kipo baked too." (`recipes[36]`); `Kipo po bumreba vinto li bumre.` "Kipo baked the BREAD." (`examples.sentences[418]`); `Yesta si taivo tavreta, maivo futu pagopa.` (`recipes[52]`).
Interactions: A3.8, A7.4, A8.1.
Issues: I-33

### A3.21 — The clause's closing order
Status: EXPLICIT
Depends on: A3.17, A3.18, A3.19
Source: `rulings[2.3:G78]`, `clause.template`, `clause.slots[19]`, `rulings[1.2:G24]`
Rule (formal): `… (ClosingTimeWord) (ATTITUDE) (ki)` per 2.3:G78; `… ADJUNCTS (fuyi) (STATUS) (ATTITUDE) (ki)` per the template.
Rule (plain English): A clause closes in this order: a closing time word, an attitude word, `ki`. `ki` is the last word of its clause.
Conditions and constraints: The two orders are not merged: where a closing time word stands relative to `fuyi` and `hoyo`/`yasmo`, and where clause-final `reve`/`loki` and a duration measure go, is not stated. A vocative may follow `ki` (`recipes[14]`) (I-23).
Components used: C:ki, attitude words, C:fuyi, C:hoyo, C:yasmo
Examples: `Saivori de lira sasvasia taivo toda-krono pifu.` "May their song protect you always." (2.3:G78).
Interactions: A3.15, A4.18, A5.11.
Issues: I-23

### A3.22 — How many operators to stack
Status: EXPLICIT
Depends on: A3.1
Source: `clause.stacking.max_preverbal_operators_recommended`
Rule (formal): `|Preverbal| ≤ 4` (recommended, not required).
Rule (plain English): No more than four preverbal operators is recommended.
Conditions and constraints: A recommendation only.
Components used: preverbal operators
Examples: none.
Interactions: A3.1.
Issues: none found

### Layer L4: phrase expansion

### A4.1 — Noun-phrase order
Status: EXPLICIT
Depends on: A1.4, A1.7
Source: `clause.noun_phrase`, `rulings[0.8:G7]`, `how_to_translate.steps[3]`
Rule (formal): `NP ::= (QUANT) (li | eli | ola | OWNER de) (NUMBER) {ADJ} NOUN(+ti)(+ri) (de NP) (raho Clause)`; `QUANT ::= toda | rada | muya | poka | somi | nuna`.
Rule (plain English): Quantifier, then an article, demonstrative or owner + `de`, then number, adjectives, the noun with its suffixes, a `de` phrase, a raho clause. `toda N` = every N; `toda li N` = all the N; `toda OWNER de N` = all OWNER's N.
Conditions and constraints: The template omits `baba`, `eliri`/`olari`, `ki-eli`, `ki-muya`, degree words before adjectives, ordinals, `sela`, `diba`; the order of several adjectives is not given (I-28). The pre-nominal "OWNER de" is restricted by 1.2:G27 to pronouns and names, which the template does not say (I-28).
Components used: C:li, C:eli, C:ola, C:de, C:raho, quantifiers, C:-ti, C:-ri
Examples: `eliri lirari` "these songs" (`function_words`); `Li dossa veluri lumila.` (1.2:G28).
Interactions: A4.2–A4.13, A7.9.
Issues: I-28

### A4.2 — Articles and when they may drop
Status: EXPLICIT
Depends on: A4.1
Source: `function_words` rows `li`, `baba`, `rulings[0.8:R5]`, `rulings[2.3:G82]`
Rule (formal): `li` (definite), `baba` (indefinite) before the noun phrase; `li` omissible when the referent is obvious, never when ambiguous; `baba` omissible only in verse; an adjective used as a noun keeps its determiner.
Rule (plain English): `li` is "the", `baba` "a". `li` may be dropped in everyday speech and verse when the referent is obvious; `baba` only in verse.
Conditions and constraints: Dropping `li` before a side noun's object brings two nouns together (I-53). "Obvious" is undefined.
Components used: C:li, C:baba
Examples: `Nela vanisan.` "The person is beautiful." (`examples.sentences[184]`, `li` omitted); `Li corvisan lirala.` (2.3:G82).
Interactions: A4.6, A4.15.
Issues: I-28, I-53

### A4.3 — Demonstratives
Status: EXPLICIT
Depends on: A4.1
Source: `function_words` rows `eli`, `ola`, `eliri`, `olari`, `rulings[0.8:G1]`, `clause.linking`, `recipes[18]`
Rule (formal): `DEM ::= eli | ola | eliri | olari`; as determiner before the noun, or standing alone for things, situations and discourse (`ola` = what was just said, `eli` = what follows); people take `eli-nela`/`ola-nela` or `saivo`, except presentational `Eli ka NAME`.
Rule (plain English): `eli` "this", `ola` "that", with plurals `eliri`, `olari`; they may stand alone for things but not for people. `ola` is never the complementizer "that" (`fime`).
Conditions and constraints: Whether a plural demonstrative requires a plural noun (`eliri lirari` both plural) is not stated (I-29).
Components used: C:eli, C:ola, C:eliri, C:olari
Examples: `Maivo desida eli, ne ola.` "I want this, not that." (`recipes[18]`).
Interactions: A7.10.
Issues: I-29

### A4.4 — Quantifiers and excess
Status: EXPLICIT
Depends on: A4.1
Source: `function_words` rows `toda`, `somi`, `nuna`, `muya`, `poka`, `rada`, `diba`, `rulings[0.8:G7]`
Rule (formal): `QUANT ::= toda | rada | muya | poka | somi | nuna`; `diba (QUANT | ADJ)` = excess.
Rule (plain English): Quantifiers open the noun phrase; `diba` before a quantifier or adjective means "too (much)", never additive "too" (`tu`).
Conditions and constraints: Whether `rada` (each) takes a singular noun only is implicit (`rada lira`).
Components used: quantifiers, C:diba
Examples: `diba muya lirari` "too many songs" (`recipes[37]`); `Li vila tovota muya marna.` (1.2:G28).
Interactions: A1.7, A1.14.
Issues: I-28

### A4.5 — Adjectives precede the noun
Status: EXPLICIT
Depends on: A4.1
Source: `hard_rules[2]`, `clause.noun_phrase`, `album.tracks[02].lines[0].album_reading` (AR-02)
Rule (formal): `{ADJ} NOUN`.
Rule (plain English): Adjectives come before the noun.
Conditions and constraints: Order among several adjectives: UNDEFINED (A4.22). The one album line with a post-nominal adjective is an album reading (AR-02).
Components used: C:-san
Examples: `li sevusan ruhe` "the ocean storm" (2.2:G66).
Interactions: A2.7 (a post-nominal adjective is a predicate), A4.22.
Issues: I-28

### A4.6 — An adjective standing as a noun
Status: EXPLICIT
Depends on: A4.2, A4.5
Source: `rulings[1.2:G29]`, `rulings[2.3:G82]`, `recipes[25]`
Rule (formal): `NP ::= (li|eli|ola|baba) ADJ`; never a bare ADJ as NP.
Rule (plain English): An adjective may stand as a noun phrase only after an article or determiner, and keeps it where `li` could otherwise be omitted.
Conditions and constraints: A bare adjective after a subject is a predicate (A2.7).
Components used: C:li, C:eli, C:ola, C:baba
Examples: `li ramumomvisan` "the forgotten" (`recipes[25]`); `Li corvisan lirala.` "The brave one sings." (2.3:G82).
Interactions: A2.7, A4.2.
Issues: none found

### A4.7 — A noun does not modify a noun
Status: EXPLICIT
Depends on: A1.18
Source: `hard_rules[3]`, `rulings[ADR-0011]`, `self_check[8]`
Rule (formal): `¬(NOUN NOUN)` as modification.
Rule (plain English): Two bare nouns side by side are an error; use the adjective, a listed compound, or `de`.
Conditions and constraints: Side nouns as prepositions with `li` dropped produce exactly this sequence (I-53).
Components used: C:de
Examples: `lirasan lavra` "songbird" (ADR-0011).
Interactions: A1.18, A4.15, A4.2.
Issues: I-53

### A4.8 — Possession with `de`: which side owns
Status: EXPLICIT
Depends on: A4.1
Source: `rulings[1.2:G27]`, `rulings[1.2:G32]`, `function_words` row `de`, `recipes[19]`–`recipes[21]`, `small_words.pronouns[*].possessive`
Rule (formal): In `X de Y`: if X is a pronoun → X owns ("X's Y"); else if Y is a pronoun → Y owns; else if X is a personal name (incl. `pilo`, `mare` "used as names") → X owns; else Y owns ("X of Y"). `PRONOUN de PRONOUN` → the right one owns.
Rule (plain English): By default `X de Y` is "X of Y" (Y owns). A pronoun is the owner wherever it stands; a personal name before `de` is the owner. Possessive pronouns are `PRONOUN de N` (`maivo de lira`, my song).
Conditions and constraints: The `function_words` row says "owner + de + possessed noun", the reverse of the default (I-14). When `pilo`/`mare` count as names is undefined (I-12). Two names: undefined (I-14). Chains: open (I-13).
Components used: C:de, pronouns
Examples:
```
Taivo  de  lira  ka     vani-san.
2SG    DE  song  COP.P  beauty-ADJ
'Your song is beautiful.'                   (1.2:G27)
li   bumre  de  li   cilni
DEF  bread  DE  DEF  city
'the bread of the city'                     (1.2:G27)
Pilo    de  maivo  po   lira-la.
father  DE  1SG    PST  song-V
'My father sang.'                           (1.2:G32)
```
Interactions: A4.9, A4.10, A2.10, A1.16.
Issues: I-12, I-13, I-14, I-28

### A4.9 — `de` for "about"
Status: EXPLICIT
Depends on: A4.8
Source: `rulings[1.2:G30]`, `rulings[2.3:G80]`, `recipes[23]`, `self_check[25]`
Rule (formal): "N about X" = `N de X`; "V about X" (saying, hearing, knowing, thinking) = `V N de X` (give the verb an object), not `V su X`.
Rule (plain English): Liraasa has no word for "about": a song about love is a song of love; after a verb of saying, hearing, knowing or thinking, give the verb an object with a `de` phrase.
Conditions and constraints: A ruling example uses `su` after a writing verb (I-26).
Components used: C:de, C:su
Examples: `Li veluri po sarbisia lirari de amor.` "The stars wrote songs of love." (1.2:G30); `Li tarnuregna po lenila li telne de li lirayo.` "The king heard about the singer." (2.3:G80).
Interactions: A4.8.
Issues: I-26

### A4.10 — Partitive `de`
Status: EXPLICIT
Depends on: A4.8
Source: `rulings[2.1:G53]`, `recipes[59]`
Rule (formal): `(NUMBER | QUANT | SUPERLATIVE) de NP` = "of / among"; G27/G32 ownership does not apply.
Rule (plain English): After a number, quantifier or superlative, `de` is partitive. Fractions are the same construction.
Conditions and constraints: "Fractions are the same construction", so `NUMBER de NUMBER` is either a fraction or "N of the M" (I-15).
Components used: C:de
Examples: `Una de maivori futu relnura.` "One of us will return." (`recipes[59]`).
Interactions: A1.16, A4.12.
Issues: I-15

### A4.11 — Number and noun
Status: EXPLICIT
Depends on: A1.7, A1.15
Source: `small_words.numbers.rules` (row I), `rulings[1.2:G28]`, `recipes[38]`
Rule (formal): `NUMBER NOUN(+ri)`; no agreement.
Rule (plain English): The number stands before the noun in English order; `-ri` is optional after it.
Conditions and constraints: "recommended above 1" vs "optional … by sound and meter" (I-29).
Components used: numerals, C:-ri
Examples: `dossa cono` "two coins" (`recipes[38]`); `Dossa lirari.` "Two songs." (`examples.sentences[20]`).
Interactions: A4.1, A4.12.
Issues: I-29

### A4.12 — Quantity limits and degree before a number or an adjective
Status: EXPLICIT
Depends on: A4.11
Source: `rulings[1.0:G9]`, `rulings[2.3:G81]`, `recipes[39]`, `recipes[29]`–`recipes[34]`, `function_words` rows `ruli`, `kasi`, `menu`, `mosa`, `lusu`, `gase`, `tamo`, `pendi`
Rule (formal): Before NUMBER/QUANTITY: `lusu` = at least, `mosa` = at most, `gase` = approximately, `pendi` = exactly. Before ADJ: `ruli` very, `kasi` more, `menu` less, `mosa` most, `lusu` least; `kasi ADJ tamo NP` = more ADJ than NP; `gase ADJ gase NP` = as ADJ as NP.
Rule (plain English): The same words mean a quantity limit before a number and a degree before an adjective.
Conditions and constraints: `gase` + NP alone is "like NP" (A7.13), so `gase` + a number + noun has two readings (I-47).
Components used: C:lusu, C:mosa, C:gase, C:pendi, C:ruli, C:kasi, C:menu, C:tamo
Examples: `Taivo guraga maivo lusu dossa cono.` "You owe me at least two coins."; `Taivo de lira ka mosa vanisan.` "Your song is the most beautiful." (2.3:G81).
Interactions: A7.13, A4.10.
Issues: I-47

### A4.13 — `tonsi` before an adjective
Status: EXPLICIT
Depends on: A4.12
Source: `rulings[2.2:G62]`, `function_words` row `tonsi`, `recipes[60]`
Rule (formal): `tonsi ADJ (… fime Clause)` = "so ADJ (that …)"; clause-initial `tonsi` = "therefore".
Rule (plain English): Directly before an adjective `tonsi` means "so"; a following `fime` clause gives the result. At the start of a clause it means "therefore".
Conditions and constraints: A clause-initial `tonsi` followed by an adjective-initial subject satisfies both (I-19).
Components used: C:tonsi, C:fime
Examples: `taivo ke tonsi corvisan fime taivo viki savalisia maivo ki?` "Are you so brave that you would kiss me?" (`recipes[60]`).
Interactions: A7.6.
Issues: I-19

### A4.14 — Prepositional phrases
Status: EXPLICIT
Depends on: A4.1
Source: `function_words` rows `en`, `su`, `ala`, `da`, `ko`, `vobi`, `intra`, `entre`, `transa`, `ultra`, `hupi`, `tula`, `ligo`, `vofa`, `voyu`, `yuta`, `sabri`, `korsi`, `gagu`; `clause.slots[15]`; `self_check[10]`; `clause.linking`
Rule (formal): `PP ::= P NP`; PPs fill ADJUNCTS (slot 16); a stranded preposition is an error; `ala` is "toward, to", never the infinitive "to".
Rule (plain English): Prepositions precede their noun phrase and stand in the adjunct slot.
Conditions and constraints: A preposition keeps its place with a resumptive pronoun in a relative clause (A7.9). `en`/`intra`, `transa`/`taro-` overlap without a stated difference (I-25).
Components used: the prepositions
Examples: `Miyo baba nela en eli-pago.` "There is a person here." (`examples.sentences[201]`); `ala li nimu` "toward the home" (`function_words`).
Interactions: A4.15, A4.16, A7.9.
Issues: I-25

### A4.15 — Side nouns as prepositions
Status: EXPLICIT
Depends on: A4.14
Source: `rulings[2.2:G67]`, `recipes[65]`
Rule (formal): `(nazru | zavme | silda | cemnu | lizma | rizno) NP` = preposition; after a verb alone = adverb.
Rule (plain English): Six nouns of position may stand bare before a noun phrase as prepositions (behind, in front of, beside, in the middle of, left of, right of), or after a verb as adverbs.
Conditions and constraints: With `li` dropped (A4.2) the result is two bare nouns side by side (A4.7) (I-53).
Components used: none (lexical nouns in a preposition role)
Examples: `Li lavra semnesia nazru li nimu.` "The bird sits behind the home." (2.2:G67).
Interactions: A4.2, A4.7.
Issues: I-53

### A4.16 — Instrument, manner, accompaniment, benefit
Status: EXPLICIT
Depends on: A4.14
Source: `rulings[1.2:G33]`, `rulings[2.3:G73]`, `rulings[1.0:G12]`, `function_words` rows `yuta`, `ko`, `en`, `vobi`
Rule (formal): `yuta NP` = instrument/means; `en NP[abstract]` = manner or medium; `ko NP[feeling]` = the spirit of the act; `ko NP` otherwise = accompaniment; `vobi NP` = for the benefit of.
Rule (plain English): `yuta` is the tool or means and never accompaniment; `en` + an abstract noun is the manner or medium; `ko` + a feeling is the spirit in which a thing is done, otherwise "with" a companion; `vobi` is "for".
Conditions and constraints: "With an abstract noun, choose by meaning" between `yuta` and `en`; "medium" and "means" are not told apart; "feeling" is not defined; `la` + ADJ is a fourth manner device (I-25).
Components used: C:yuta, C:en, C:ko, C:vobi
Examples: `Maivo lallela li dorbi yuta li kemye.` "I open the door with the key." (1.2:G33); `saivo po senosia en baba melosan valla.` "She spoke in a musical voice." (2.3:G73); `Maivo lirala ko saivo.` "I sing with him." (1.2:G33).
Interactions: A4.17.
Issues: I-25

### A4.17 — Adverbs: `la` + adjective
Status: EXPLICIT
Depends on: A1.1
Source: `function_words` row `la`, `recipes[28]`, `rulings[1.0:G5]`, `rulings[1.0:G17]`
Rule (formal): `Adverb ::= la ADJ`, in ADJUNCTS.
Rule (plain English): "-ly" is `la` + adjective; adverbs need no eighth form. `la dorvasan` = deliberately; `la dorvanasan` = accidentally; `la vuzinasan` = unexpectedly.
Conditions and constraints: Only the adjunct slot is given; whether an adverb may precede the verb, and how it is itself modified (`ruli`), is not stated (I-46).
Components used: C:la
Examples: `Maivo lirala la molusan.` "I sing gently." (`recipes[28]`).
Interactions: A4.16.
Issues: I-46

### A4.18 — Time phrases
Status: EXPLICIT
Depends on: A4.14
Source: `rulings[2.1:G55]`, `rulings[2.3:G79]`, `rulings[1.0:G17]`, `rulings[1.2:G24]`, `function_words` rows `kroti`, `krotiapo`
Rule (formal): `Measure ::= (NUMBER | QUANT) Unit`; `kroti Measure` = ago; `krotiapo Measure` = in/after; `kroti (li) N` = before N; `krotiapo (li) N` = after N; bare Measure after the object = duration; `da TimeWord` = since; `tuni NP[time]` = until; `kroti ola` = previously; `nayo ola` = meanwhile.
Rule (plain English): `kroti` and `krotiapo` before a measure are "ago" and "from now"; before a noun, "before" and "after"; a bare measure after the object is a duration; `da` + a time word is "since"; `tuni` + a time noun is "until".
Conditions and constraints: 2.1:G55 says `kroti/krotiapo + li + noun`; 2.3:G79 says `kroti` + "a bare noun" (I-48). Whether a quantifier such as `rada` makes a "measure" is not stated (I-48). The duration measure has no template slot (I-23).
Components used: C:kroti, C:krotiapo, C:da, C:tuni
Examples: `Maivo po venreva kroti dossa deya.` "I came two days ago."; `Li lirayo po sulnosia tuni merno.` "The singer waited until morning." (2.3:G79).
Interactions: A7.7, A3.21, I-17.
Issues: I-17, I-23, I-48

### A4.19 — Frequency and "N times"
Status: EXPLICIT
Depends on: A1.14
Source: `rulings[1.2:G34]`, `rulings[2.1:G49]`, `recipes[40]`, `recipes[41]`
Rule (formal): `(muya|poka|rada)-krono`, `NUMBER-krono`, `ki-muya-krono`; open or close the clause.
Rule (plain English): Frequency adverbials are quantifier-`krono`; "N times" is NUMBER-`krono`; "how many times" is `ki-muya-krono`; `una-ne krono` is "the first time".
Conditions and constraints: Like other `-krono` correlatives they open or close the clause (A3.21).
Components used: C:-krono
Examples: `Rada-krono, li veluri lumila.` "Each time, the stars shine." (1.2:G34).
Interactions: A3.21, A1.16.
Issues: I-23

### A4.20 — Pronouns
Status: EXPLICIT
Depends on: A0.5
Source: `small_words.pronouns`, `function_words` row `sela`, `rulings[0.8:G1]`
Rule (formal): `Pronoun ::= maivo (1SG) | taivo (2SG) | saivo (3SG human) | ito (3SG inanimate) | +ri (PL)`; possessive `PRONOUN de N`; reflexive `PRONOUN sela`.
Rule (plain English): Eight pronouns mark person, number and, in the third person, human vs inanimate. There is no case: the same form is subject, object and owner (with `de`). The reflexive is pronoun + `sela`.
Conditions and constraints: No pronoun for animals, no inclusive/exclusive "we", no stated position or use of `sela` beyond "myself" (I-37). `maivo` is also a noun (I-16).
Components used: pronouns, C:sela, C:de
Examples: `maivo de lira` "my song"; `maivo sela` "myself" (`small_words.pronouns[0]`).
Interactions: A2.3, A4.8.
Issues: I-16, I-37

### A4.21 — Gender in kinship nouns
Status: EXPLICIT
Depends on: A1.11, A4.5
Source: `rulings[1.2:G36]`, `recipes[26]`, `recipes[27]`
Rule (formal): Kin nouns neutral; gender by listed compound with `minva`/`tarnu` or by the adjective `minvasan`/`tarnusan` before the noun; in-laws by compound with `rilde`.
Rule (plain English): Kinship words have no gender; mark it only when it matters, by a listed compound or else an adjective. `mare`, `pilo` stay mother, father.
Conditions and constraints: none.
Components used: none
Examples: `Maivo de minvalinu lirala.` "My daughter sings."; `minvasan purmafamli` "aunt" (1.2:G36).
Interactions: A4.5.
Issues: none found

### A4.22 — Order of several adjectives
Status: UNDEFINED
Depends on: A4.5
Source: `clause.noun_phrase` (`[ADJECTIVES]` plural, unordered)
Rule (formal): none.
Rule (plain English): Missing rule: the order of two or more adjectives before one noun, and whether degree words, colours and ordinals have fixed positions among them.
Conditions and constraints: The album standard form `baba norusan lirasan lavra` (AR-02) puts two adjectives in one order without saying why.
Components used: C:-san
Examples: none ruled.
Interactions: A4.1, A4.5.
Issues: I-28

### A4.23 — Chains of `de`
Status: UNDEFINED
Depends on: A4.8
Source: `open_questions_do_not_resolve[0]`
Rule (formal): none for `X de Y de Z`.
Rule (plain English): Missing rule: how `X de Y de Z` groups and who owns what "when owners of different ranks mix". The JSON names this as open.
Conditions and constraints: 15 album lines and one ruling example contain such chains.
Components used: C:de
Examples: `yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.` (1.2:G29).
Interactions: A4.8.
Issues: I-13


### Layer L5: sentence types

### A5.1 — Statements
Status: EXPLICIT
Depends on: A2.2
Source: `clause.template`, `hard_rules[2]`
Rule (formal): `Statement ::= Clause "."`
Rule (plain English): A statement is a clause in template order, with no final `ki`.
Conditions and constraints: A clause with a ki-word and no final `ki` may be a question (A5.3), which a statement with an embedded ki-word resembles (I-01).
Components used: none
Examples: `Li veluri ka lumisan.` "The stars are bright." (`examples.sentences[22]`).
Interactions: A5.2, A5.3.
Issues: I-01

### A5.2 — Yes/no questions
Status: EXPLICIT
Depends on: A5.1, A3.21
Source: `hard_rules[4]`, `function_words` row `ki`, `clause.slots[19]`, `rulings[2.2:G60]`, `rulings[1.0:G2]` (cited by `recipes[5]`), `self_check[19]`, `self_check[20]`
Rule (formal): `YNQ ::= Clause ki "?"`, statement order, `ki` the last word of its clause.
Rule (plain English): A yes/no question keeps statement order and must end in `ki`; moving the copula or tense to the front is an error.
Conditions and constraints: An attitude word precedes `ki` (0.8:R9). A vocative may follow (A5.11). In a sentence with a final subordinate clause, which clause `ki` closes is not stated (I-50).
Components used: C:ki
Examples:
```
Taivo  lira-la  ki?
2SG    song-V   Q
'Do you sing?'                    (examples.sentences[12])
```
Interactions: A3.19, A5.11, A7.12.
Issues: I-02, I-50

### A5.3 — Content questions
Status: EXPLICIT
Depends on: A5.2
Source: `rulings[2.2:G60]` (supersedes 2.1:G46 and part of 0.8:G4), `rulings[2.3:G76]`, `rulings[2.2:G61]`, `recipes[6]`, `self_check[20]`, `self_check[21]`; contrary live text in `hard_rules[4]` and `clause.questions`
Rule (formal): `WHQ ::= (WH) Clause[with WH in its answer's place, or WH fronted] (ki) "?"`; `ki` obligatory when WH = `ki-eli` N, `ki-muya` N (2.3:G76) or `ki-modo` ADJ (2.2:G61); optional otherwise (2.2:G60).
Rule (plain English): A ki-word may open the clause or stay where its answer would stand; the album fronts it in most questions. A ki-word question may end in `ki` or not, except that `ki-eli` + noun, `ki-muya` + noun and degree `ki-modo` + adjective questions must end in `ki`.
Conditions and constraints: Three live texts state it differently: `hard_rules[4]` ("Questions keep statement order and end with ki"), `clause.questions` ("every direct question ends in ki", citing the superseded 2.1:G46/G47), and `recipes[6]` plus 2.2:G60 ("ki last is optional") (I-02). The fronted position has no template slot (I-03). Without `ki`, an in-situ question has the surface of a statement containing an embedded ki-word (I-01).
Components used: C:ki-, C:ki
Examples: `Ki-pago taivo pagopa ki?` / `Taivo pagopa ki-pago ki?` / `Ki-kasa taivo po amora maivo?` (2.2:G60).
Interactions: A5.4–A5.7, A2.2.
Issues: I-01, I-02, I-03

### A5.4 — Question words
Status: EXPLICIT
Depends on: A1.14
Source: `small_words.correlatives` (ki- row set), `function_words` rows `ki-coda` … `ki-muya`, `ki-eli`, `ki-nela`, `ki-saivo`, `ki-nela de`, `rulings[2.1:G49]`
Rule (formal): `WH ::= ki-coda | ki-pago | ki-krono | ki-nela | ki-modo | ki-kasa | ki-eli N | ki-muya (N) | ki-nela de N | ki-muya-krono`.
Rule (plain English): What, where, when, who, how, why; "which" + noun; "how many"; "whose"; "how many times". `ki-saivo` is historical only; `ki-nela` is preferred.
Conditions and constraints: A ki-word of time may open the clause as a frame (`clause.questions`).
Components used: C:ki-
Examples: `Ki-nela lirala ki?` "Who sings?" (`function_words`); `ki-muya lirari ki?` "how many songs?" (`function_words`).
Interactions: A5.3, A5.6.
Issues: I-44

### A5.5 — A question opened by `raho`
Status: EXPLICIT
Depends on: A5.3, A7.9
Source: `rulings[2.3:G74]` (supersedes a clause of 2.2:G64), `self_check[22]`
Rule (formal): `RahoQ ::= raho Clause[gap] ki "?"`; `ki` obligatory.
Rule (plain English): A direct question may open with `raho` for "who" or "what"; it ends in `ki`. `ki-nela` and `ki-coda` remain the ordinary question words.
Conditions and constraints: Its surface matches a headless relative standing alone with an echo `ki` (I-49).
Components used: C:raho, C:ki
Examples: `raho povi sabesia baba kasi polvasan sove ki?` "Who can know a more powerful peace?" (2.3:G74).
Interactions: A7.9, A8.2.
Issues: I-49

### A5.6 — Exclamations with ki-words
Status: EXPLICIT
Depends on: A5.3
Source: `rulings[2.2:G61]` (supersedes 2.1:G47), `rulings[2.3:G76]`, `rulings[2.3:G83]`, `recipes[7]`, `self_check[21]`; contrary live text in `clause.questions`
Rule (formal): `Excl ::= Clause[ki-modo ADJ | ki-eli N | ki-muya N] "!"`, no final `ki`; past via copula + tense.
Rule (plain English): Only `ki-modo` + adjective ("how …!"), `ki-eli` + noun ("what a …!") and `ki-muya` + noun ("so many …!") make an exclamation, and only without a final `ki`. Any other ki-word clause without `ki` is a question. A past exclamation puts the tense on the copula.
Conditions and constraints: `clause.questions` still says "A main clause with a ki-word and no final ki is an exclamation" (2.1:G47 wording) (I-02).
Components used: C:ki-, copulas
Examples: `Li nullo ka ki-modo vanisan!` "How beautiful the night is!" (`recipes[7]`); `Ki-eli nullo!` (2.2:G61); `Li nullo po ka ki-modo vanisan!` (2.3:G83).
Interactions: A5.3.
Issues: I-02

### A5.7 — Embedded questions
Status: EXPLICIT
Depends on: A5.3, A7.10
Source: `rulings[2.2:G60]`, `rulings[2.3:G77]` (supersedes the `si` clause of 0.8:G4), `rulings[1.0:G2]`, `function_words` row `ki-oro`, `clause.questions`
Rule (formal): `EmbWH ::= (WH) Clause[WH in place or fronted]`, never `ki`; `EmbYN ::= ki-oro Clause`.
Rule (plain English): An embedded content question keeps or fronts its ki-word and never ends in `ki`; an embedded yes/no question opens with `ki-oro` ("whether"), never `si`.
Conditions and constraints: `clause.questions` says embedded questions "keep the word in place with no ki" (the superseded 0.8:G4 clause) (I-02). An embedded question at the end of a statement has the surface of a ki-less direct question (I-01).
Components used: C:ki-, C:ki-oro
Examples: `maivori ne sabesia ki-coda maivori ramura.` (2.2:G60); `Maivo masuma ki-oro taivo futu relnura.` "I ask whether you will return." (2.3:G77).
Interactions: A5.3, A7.10.
Issues: I-01, I-02

### A5.8 — Commands and prohibitions
Status: EXPLICIT
Depends on: A2.4
Source: `rulings[1.2:G31]`, `rulings[2.1:G56]`, `recipes[12]`, `recipes[13]`, `function_words` row `fisa`
Rule (formal): `Command ::= (fisa ",") (ne) VERB (OBJECT) {ADJUNCT} ("," fisa)`.
Rule (plain English): A command has no subject and opens at the verb; `fisa` ("please") softens it; `ne` + command forbids.
Conditions and constraints: Whether a command may carry tense, modal, aspect or other operators, or address a third person, is not stated (I-42). A subjectless clause is also how ellipsis is written (I-20).
Components used: C:fisa, C:ne
Examples: `Fisa, lisrola.` "Please stay." (`recipes[12]`); `Ne senobakosia maivo!` "Don't interrupt me!" (`recipes[13]`).
Interactions: A2.4, A8.2.
Issues: I-20, I-42

### A5.9 — Hortative `yava`
Status: EXPLICIT
Depends on: A5.8
Source: `function_words` row `yava`, `rulings[2.3:G78]`, `rulings[2.1:G56]`, `recipes[11]`
Rule (formal): `Hortative ::= yava (ne) VERB …`; `yava` "stands where the subject would".
Rule (plain English): "Let us" is `yava` + the plain verb, including speaker and listener; `yava ne` is "let us not".
Conditions and constraints: "Sentence-initial particle" (function words) vs "stands where the subject would" (2.3:G78): with a FRAME the two differ (I-42).
Components used: C:yava
Examples: `Yava lirala!` "Let us sing!" (`recipes[11]`); `Yava ne lirala.` "Let us not sing." (2.3:G78).
Interactions: A5.8.
Issues: I-42

### A5.10 — Blessings and wishes
Status: EXPLICIT
Depends on: A3.19, A3.7
Source: `rulings[2.1:G48]`, `recipes[8]`, `recipes[9]`
Rule (formal): `Clause pifu` = blessing; `… noma … pifu` = "if only".
Rule (plain English): `pifu` closing a clause with any subject makes a blessing or wish; with `noma`, an unreal wish.
Conditions and constraints: `pifu` is listed among "final certainty" words (I-41).
Components used: C:pifu, C:noma
Examples: `Li lumi tivrota taivo pifu.` "May the Light hold you." (`recipes[8]`).
Interactions: A3.19.
Issues: I-41

### A5.11 — Address (vocatives)
Status: EXPLICIT
Depends on: A0.8
Source: `rulings[1.2:G31]`, `recipes[14]`, `open_questions_do_not_resolve[1]`
Rule (formal): `Vocative ::= NP` set off by commas, at the start or end of the clause.
Rule (plain English): A person addressed is a noun phrase between commas at either end of the clause; there is no vocative particle (open).
Conditions and constraints: A final vocative follows `ki` although `ki` is "the last word of its clause" (I-23). No template slot (I-03).
Components used: none
Examples: `Taivo viki pagopa ligo maivo ki, maivo de amor?` "Would you come near me, my love?" (`recipes[14]`).
Interactions: A3.21, A5.2.
Issues: I-03, I-23, I-55

### A5.12 — Answers and echoes
Status: EXPLICIT
Depends on: A5.2, A8.2
Source: `recipes[10]`, `function_words` rows `zabo`, `kepi`, `rulings[0.8:G3]`
Rule (formal): `Answer ::= zabo | kepi | (TENSE) VERB … | zabo "," Clause`; `Echo ::= Word ki`.
Rule (plain English): "Yes" is `zabo`, "no" `kepi`; one may also answer with tense + verb, and echo a word with `ki`.
Conditions and constraints: none.
Components used: C:zabo, C:kepi, C:ki
Examples: `Taivo po sapusia ki? — Zabo. / Po sapusia. / Zabo, maivo po sapusia.` (`recipes[10]`).
Interactions: A8.2.
Issues: I-20, I-49

### A5.13 — A vocative particle
Status: UNDEFINED
Depends on: A5.11
Source: `open_questions_do_not_resolve[1]`
Rule (formal): none.
Rule (plain English): Missing rule: whether verse has a vocative particle. Named as open by the JSON.
Conditions and constraints: none.
Components used: none
Examples: none.
Interactions: A5.11.
Issues: I-55

### Layer L6: complex predicates

### A6.1 — Same-subject verb chains: `sidu`
Status: EXPLICIT
Depends on: A2.11
Source: `function_words` row `sidu`, `clause.linking`, `rulings[2.1:G50]`, `recipes[56]`, `self_check[11]`, `open_questions_do_not_resolve[2]`, `open_questions_do_not_resolve[3]`
Rule (formal): `VERB₁ sidu VERB₂ (OBJECT)`, one subject; `sidu` never between non-verbs or before a copula.
Rule (plain English): "Want to sing" is `desida sidu lirala`: the second verb shares the first's subject. A second verb with its own subject goes in a `fime` clause. "To + verb" in general is open; `ke sidu` ("destined to") is held.
Conditions and constraints: The album uses `ke sidu` once (AR-10).
Components used: C:sidu
Examples: `Maivo desida sidu lirala.` "I want to sing." (`recipes[56]`).
Interactions: A6.2, A6.7, A7.11.
Issues: I-55

### A6.2 — Adjective + `sidu` + verb
Status: EXPLICIT
Depends on: A6.1
Source: `rulings[2.2:G65]`, `recipes[63]`
Rule (formal): `ADJ sidu VERB (OBJECT)` = "ADJ to VERB".
Rule (plain English): An adjective may take `sidu` + verb for "easy to …, ready to …"; "The verb's object is what the adjective describes."
Conditions and constraints: The ruling's only example has an overt object and an expletive-like subject, against its own statement (I-24).
Components used: C:sidu
Examples: `ito ke ruli levasan sidu zeldoza trana.` "It is very easy to resist change." (`recipes[63]`).
Interactions: A6.1.
Issues: I-24

### A6.3 — Valency operators: make, let, prevent
Status: EXPLICIT
Depends on: A3.1, A2.11
Source: `rulings[1.0:G14]`, `clause.valency_operators`, `function_words` rows `vaku`, `lesvu`, `tekvu`, `recipes[68]`
Rule (formal): `CAUSER (TENSE) (noma) (ne) (MODAL) … (EVIDENTIAL) (vaku|lesvu|tekvu) ACTOR (ne) (APPROACH)? (PHASE) (EFFORT) VERB (OBJECT)`.
Rule (plain English): `vaku` (make), `lesvu` (let) and `tekvu` (prevent) fill the main verb slot; the actor follows, then the actor's own negation, phase and effort words and verb. Tense, modal and evidential belong to the main clause.
Conditions and constraints: 1.0:G14 gives the actor `[ne] [phase] [effort]`; `clause.valency_operators.pattern` adds `[APPROACH]`. The `vaku` row says "+ intransitive VERB"; the pattern allows `[OBJECT]`. The recipe for `vaku` carries `"status": "awaiting author review"` (I-21).
Components used: C:vaku, C:lesvu, C:tekvu
Examples: `Maivo po lesvu saivo pagopa.` "I let them leave." (`function_words`); `Taivo vaku maivo lirala.` "You make me sing." (`recipes[68]`).
Interactions: A3.1, A6.4.
Issues: I-21

### A6.4 — Passive: `gome` … `gagu`
Status: EXPLICIT
Depends on: A2.5
Source: `function_words` rows `gome`, `gagu`, `settled_questions[4]`, `clause.slots[13]`, `recipes[67]` ("is done by"), `self_check[26]`
Rule (formal): `PassClause ::= PATIENT (TENSE …) gome VERB (gagu AGENT)`.
Rule (plain English): The patient is subject, `gome` stands in the verb slot before the verb, and `gagu` introduces an optional agent.
Conditions and constraints: Which verbs may passivise is defined circularly (I-22). Interaction with valency operators, aspect and evidentials is not stated.
Components used: C:gome, C:gagu
Examples:
```
Li   lira  gome  sarbi-sia  gagu    maivo.
DEF  song  PASS  write-V    AGT.BY  1SG
'The song is written by me.'          (recipes[67])
```
Interactions: A2.5, A6.3.
Issues: I-22

### A6.5 — "To be": identity, attribute, location, existence
Status: EXPLICIT
Depends on: A2.6, A2.7, A2.8, A2.9
Source: `clause.copulas`, `function_words` rows `ke`, `ka`, `kapoki`, `miyo`, `loya`
Rule (formal): attribute = `ke|ka ADJ` or bare ADJ; identity = `ka NP` (and, in the examples, `ke NP`); location = `ke PP` (and, in the examples, `ka PP`); existence = `miyo NP`; change = `loya`.
Rule (plain English): Summary of the copular system as stated, with the example usage that departs from it noted.
Conditions and constraints: I-04 (location with `ka`), I-10 (identity with `ke`), I-09 (verbless and subjectless clauses), I-11 (`kapoki` vs `po ka`).
Components used: C:ke, C:ka, C:kapoki, C:miyo, C:loya
Examples: `Li bitiri de pilo ka su li tabu.` "Father's tools are on the table." (1.2:G27); `Li veluri ke en li vamri.` "The stars are in space." (`examples.sentences[492]`).
Interactions: as listed.
Issues: I-04, I-09, I-10, I-11

### A6.6 — Fixed periphrases: intent, epistemic necessity, having
Status: EXPLICIT
Depends on: A6.1, A3.16
Source: `rulings[1.0:G5]`, `rulings[1.0:G4]`, `recipes[15]`
Rule (formal): intent = `dorvada sidu VERB`; logical "must" = `tosu VERB … seye`; "have" = `tovota OBJECT`.
Rule (plain English): Three meanings are expressed by fixed combinations rather than dedicated operators.
Conditions and constraints: none.
Components used: C:sidu, C:tosu, C:seye
Examples: `Maivo tovota baba lira.` "I have a song." (`recipes[15]`).
Interactions: A3.10.
Issues: none found

### A6.7 — Nominalisation
Status: EXPLICIT
Depends on: A6.1, A7.10
Source: `rulings[0.8:G6]`
Rule (formal): action/thing noun = root (form 1); `NP ::= sidu VP`; `NP ::= fime Clause`.
Rule (plain English): The bare root is the noun of the action; a verb phrase becomes a noun phrase with `sidu`; a clause becomes one with `fime`.
Conditions and constraints: `sidu` + VP as subject and `fime` + clause as subject are allowed (the `self_check` rule "fime followed by a copula or tense" is about what follows `fime` directly, not about a `fime` clause as subject).
Components used: C:sidu, C:fime
Examples: `Sidu lisrola ka livna de taivo`; `Fime taivo po relnura ka baba juba` (0.8:G6).
Interactions: A6.1, A7.10.
Issues: none found

### Layer L7: clause combining

### A7.1 — Coordination: `ata`, `oro`, `nara`
Status: EXPLICIT
Depends on: A2.11
Source: `function_words` rows `ata`, `oro`, `nara`, `rulings[1.0:G13]`, `rulings[1.2:G25]`, `rulings[2.3:G72]`, `rulings[2.3:G78]`, `rulings[0.8:G3]`
Rule (formal): `X ata Y`, `X oro Y` for equal constituents; `Clause nara Clause`; `(ata|oro|nara) Clause` may open a line that continues the previous one; a repeated subject may be omitted.
Rule (plain English): `ata` is "and" only (additive "also" is `tu`); `oro` "or"; `nara` "but". Each may open a continuing line.
Conditions and constraints: The example `Ata?` "So?" uses `ata` otherwise (I-31). No template slot holds a line-initial linker (I-03).
Components used: C:ata, C:oro, C:nara
Examples: `Maivo po bumreba ata po sapusia.` "I baked and ate." (`examples.sentences[273]`); `ata maivori revo-lirala ata relsira!` (2.3:G72).
Interactions: A7.2, A8.2.
Issues: I-03, I-31

### A7.2 — Paired conjunctions
Status: EXPLICIT
Depends on: A7.1, A3.8
Source: `rulings[1.0:G10]`, `rulings[1.2:G25]`, `recipes[52]`
Rule (formal): `oro A oro B` = either/or; `ne A ne B` = neither/nor; `doli si` = only if; `yesta si` = even if; `si …, ata doli si …` = if and only if.
Rule (plain English): Correlative pairs built from existing words.
Conditions and constraints: `ne A` begins like ordinary constituent negation; the second `ne` decides.
Components used: C:oro, C:ne, C:doli, C:yesta, C:si
Examples: `Yesta si taivo tavreta, maivo futu pagopa.` "Even if you refuse, I will go." (`recipes[52]`).
Interactions: A7.4.
Issues: none found

### A7.3 — Subordinators
Status: EXPLICIT
Depends on: A2.11
Source: `function_words` rows `si`, `sina`, `kasa`, `kopisa`, `nevi`, `kube`, `nayo`, `tuni`, `sige`, `kureli`, `kroti`, `krotiapo`, `krotiata`, `fime`, `raho`, `tonsi`, `narli`, `korsi`, `sabri`, `ki-oro`
Rule (formal): `SubClause ::= Sub Clause`; Sub ∈ {si, sina, kasa, kopisa, nevi, kube, nayo, tuni, sige, kureli, kroti, krotiapo, fime, raho, ki-oro}; clause adverbs `tonsi`, `narli`, `korsi`, `krotiata` open a clause.
Rule (plain English): Each linker opens its clause. The subordinate clause may precede the main clause (with a comma) or follow it.
Conditions and constraints: The free order of main and subordinate clause is IMPLICIT (examples both ways, e.g. `Si taivo lirala, maivo rilura.` and `Maivo somusia kasa maivo ke silisan`); no rule states it. No slot for linkers in the template (I-03).
Components used: as listed
Examples: `Kube taivo venreva, maivo lirala.` "When you arrive, I sing." (`function_words`); `Maivo sulnosia tuni taivo venreva.` (`function_words`).
Interactions: A7.4–A7.8.
Issues: I-03

### A7.4 — Conditionals
Status: EXPLICIT
Depends on: A7.3, A3.7
Source: `function_words` rows `si`, `sina`, `rulings[1.0:G2]`, `rulings[1.0:G6]`, `rulings[1.0:G10]`, `recipes[50]`
Rule (formal): `si Clause, Clause`; `sina Clause` = unless; counterfactual `si … po noma …, … po viki …`.
Rule (plain English): `si` means only "if"; `sina` "unless"; counterfactual conditions combine `noma` and `viki`.
Conditions and constraints: Whether a `si` or `sina` clause inherits tense is open (A7.8).
Components used: C:si, C:sina, C:noma, C:viki
Examples: `Si taivo lirala, maivo rilura.` "If you sing, I dance." (`examples.sentences[15]`).
Interactions: A7.8, A3.7.
Issues: I-32, I-39

### A7.5 — Concession
Status: EXPLICIT
Depends on: A7.3
Source: `rulings[1.0:G11]`, `function_words` rows `nevi`, `narli`, `recipes[53]`
Rule (formal): `nevi NP` = despite; `nevi Clause` = although; clause-initial `narli` = nevertheless.
Rule (plain English): `nevi` is "despite" before a noun phrase and "although" before a clause.
Conditions and constraints: Tense inheritance after `nevi` is open (A7.8).
Components used: C:nevi, C:narli
Examples: `nevi li zeldo` "despite the resistance" (`recipes[53]`); `nevi saivo ke silisan` "although they are cold" (`function_words`).
Interactions: A7.8.
Issues: I-32

### A7.6 — Cause, purpose, result
Status: EXPLICIT
Depends on: A7.3, A4.13
Source: `function_words` rows `kasa`, `kopisa`, `tonsi`, `rulings[2.2:G62]` (supersedes 2.1:G54), `rulings[2.2:G63]`, `recipes[60]`, `recipes[61]`
Rule (formal): `kasa Clause` = because; `kopisa Clause` = so that (plain purpose); `MainClause, fime Clause[nosi]` = "in the hope that"; `tonsi ADJ … fime Clause` = so … that; clause-initial `tonsi` = therefore.
Rule (plain English): Causes take `kasa`, purposes `kopisa`, hopeful purposes a `fime` clause whose verb carries `nosi`, results `tonsi` + adjective with a `fime` clause.
Conditions and constraints: A `fime` + `nosi` clause after a verb that takes a `fime` complement is ambiguous (I-18); clause-initial `tonsi` before an adjective-initial subject is ambiguous (I-19).
Components used: C:kasa, C:kopisa, C:fime, C:nosi, C:tonsi
Examples: `maivo futu donuda ito biti de lalfo, fime taivo nosi semnesia ko maivo en moluvaye.` (`recipes[61]`).
Interactions: A4.13, A7.10.
Issues: I-18, I-19

### A7.7 — Time clauses
Status: EXPLICIT
Depends on: A7.3, A4.18
Source: `function_words` rows `kube`, `nayo`, `tuni`, `sige`, `kureli`, `krotiata`, `rulings[2.2:G66]`, `rulings[1.0:G17]`, `recipes[64]`
Rule (formal): `kube` when; `nayo` while; `tuni` until; `sige` since; `kureli` as soon as; `kroti Clause` before; `krotiapo Clause` after; `krotiata` then/next.
Rule (plain English): Temporal linkers open time clauses; `kroti` and `krotiapo` also take a clause (2.2:G66).
Conditions and constraints: `kroti`/`krotiapo` take a measure, a noun or a clause, each with a different meaning (I-48).
Components used: as listed
Examples: `kroti maivo lesvu taivo ke li sevusan ruhe.` "Before I let you be the ocean storm." (`recipes[64]`); `Nayo maivo lirala, taivo rilura.` (`function_words`).
Interactions: A7.8, A4.18.
Issues: I-48

### A7.8 — Tense inheritance
Status: EXPLICIT
Depends on: A7.3, A3.4
Source: `rulings[0.8:R6]`, `rulings[2.1:G50]`, `rulings[2.2:G66]`, `rulings[0.8:G5]`, `open_questions_do_not_resolve[5]`
Rule (formal): `Inherit(fime, raho, kube, nayo, kasa, kopisa, tuni, kroti, krotiapo) = yes`; `Inherit(sige) = no` (always marked); `Inherit(kureli, sina, si, nevi) = open`.
Rule (plain English): Clauses opened by the listed linkers take the main clause's tense when unmarked; `sige` clauses are always marked; four linkers are explicitly left open.
Conditions and constraints: Other clause openers (`tonsi`, `narli`, `korsi`, `krotiata`, `ki-oro`, `sabri` + clause, coordinated `ata` clauses) are not listed either way, and "inherit" is not defined for a clause that marks its own tense (I-32).
Components used: as listed
Examples: `Sige maivo po venreva, saivo ke benasan.` "Since I came, they are well." (`function_words`).
Interactions: A3.14, A3.5.
Issues: I-32

### A7.9 — Relative clauses
Status: EXPLICIT
Depends on: A4.1, A7.3
Source: `function_words` row `raho`, `clause.linking`, `clause.noun_phrase`, `rulings[1.0:G21]`, `rulings[2.1:G52]`, `rulings[2.2:G64]`, `rulings[2.3:G74]`, `recipes[55]`, `recipes[58]`, `recipes[62]` (headless), `open_questions_do_not_resolve[4]`
Rule (formal): `NP ::= … NOUN raho Clause[gap] (",")`; for a prepositional gap: `raho Clause[P resumptive-pronoun]`; headless `raho Clause` = "the one who, that which" as subject, object or complement.
Rule (plain English): `raho` follows its noun and opens a clause with a gap; a raho clause that does not end the sentence is closed by a comma. For a prepositional object the preposition keeps its place with a resumptive pronoun (`ito`, `saivo` …). `raho` with no noun before it means "the one who / that which".
Conditions and constraints: The canonical examples omit the closing comma (I-08). An example uses headless `raho` as "that" (I-07). Relatives on a time or place gap are open (I-54). Relativizing a possessor ("whose") has no rule (I-54).
Components used: C:raho, pronouns
Examples:
```
Li   nimu  raho  maivo  po   lira-la  en  ito,     ka     vani-san.
DEF  home  REL   1SG    PST  song-V   in  3SG.INAN COP.P  beauty-ADJ
'The home in which I sang is beautiful.'        (recipes[58])
```
`Maivo lirala raho taivo amora.` "I sing what you love." (`recipes[62]`, headless).
Interactions: A0.8, A5.5, A7.10.
Issues: I-07, I-08, I-49, I-54

### A7.10 — Complement clauses: `fime`
Status: EXPLICIT
Depends on: A7.3
Source: `function_words` row `fime`, `clause.linking`, `self_check[12]`, `recipes[54]`, `rulings[2.1:G51]`
Rule (formal): `VERB fime Clause` ("that"); `fime` is never directly followed by a copula or tense (the demonstrative "that" is `ola`).
Rule (plain English): `fime` introduces a finite content clause. It inherits tense (A7.8); an evidential inside it reports the main subject's evidence.
Conditions and constraints: A headless `raho` is used as "that" in one example (I-07).
Components used: C:fime
Examples: `Maivo sabesia fime taivo lirala.` "I know that you sing." (`recipes[54]`).
Interactions: A7.11, A7.12, A6.7.
Issues: I-07, I-18

### A7.11 — Different-subject complements
Status: EXPLICIT
Depends on: A7.10, A6.1
Source: `rulings[2.1:G50]`, `recipes[57]`
Rule (formal): `VERB fime SUBJECT VERB` for "want X to …".
Rule (plain English): A second verb with its own subject goes in a `fime` clause; `sidu` stays same-subject.
Conditions and constraints: none.
Components used: C:fime, C:sidu
Examples: `Maivo desida fime taivo lisrola.` "I want you to stay." (`recipes[57]`).
Interactions: A6.1.
Issues: none found

### A7.12 — Reported speech and quotation
Status: EXPLICIT
Depends on: A7.10, A5.2
Source: `rulings[2.3:G83]`, `rulings[0.8:G4]`, `rulings[2.1:G51]`
Rule (formal): direct: `VERB[saying] ":" "“" Sentence "”"`, with the main clause's `ki` before or after the quotation; indirect: `VERB fime Clause`.
Rule (plain English): A direct quotation follows its verb of saying after a colon, in quotation marks; the main clause's `ki` may come before the quotation. Indirect speech is a `fime` clause.
Conditions and constraints: Tense shift in indirect speech is not stated; `fime` inherits tense, which settles some of it.
Components used: C:fime, C:ki
Examples: `Li devi po masuma: “Ki-nela roni lirala ki?”` "The goddess asked: “Who is singing?”" (2.3:G83); `Taivo desida ki, fime maivo senosia: "..."` (0.8:G4).
Interactions: A5.2, A7.8.
Issues: I-50

### A7.13 — Comparison
Status: EXPLICIT
Depends on: A4.12
Source: `rulings[0.8:G8]`, `recipes[29]`–`recipes[35]`, `rulings[2.1:G53]`
Rule (formal): `kasi|menu ADJ tamo NP`; `mosa|lusu ADJ (de NP)`; `gase ADJ gase NP`; `gase NP` = like; `X ka sambasan ko Y` = same as; `X ka sambanasan da Y` = different from; `Lotero silda, …` = on the other hand.
Rule (plain English): Comparatives, superlatives, equatives and similes are built with degree words before adjectives, and `tamo`, `gase`, `ko`, `da`.
Conditions and constraints: Comparing actions or quantities of nouns ("sing more than", "more songs") has no rule (I-43).
Components used: C:kasi, C:menu, C:tamo, C:mosa, C:lusu, C:gase, C:ko, C:da
Examples: `Li lira ka kasi vanisan tamo li seno.` (`recipes[32]`); `Taivo lirala gase pilo.` "You sing like father." (`recipes[34]`).
Interactions: A4.12, A4.10.
Issues: I-43, I-47

### A7.14 — Exception and substitution
Status: EXPLICIT
Depends on: A7.3
Source: `function_words` rows `sabri`, `korsi`
Rule (formal): `sabri (NP | Clause)` = except; `korsi NP` = instead of; clause-initial `korsi` = instead.
Rule (plain English): "Except" and "instead of", before a noun phrase or opening a clause.
Conditions and constraints: Tense inheritance of a `sabri` clause not stated (I-32).
Components used: C:sabri, C:korsi
Examples: `Toda-nela po venreva sabri Dorin.` "Everyone came except Dorin."; `Maivo po sapusia bumre korsi yugenami.` (`function_words`).
Interactions: A7.8.
Issues: I-32

### A7.15 — Tense inheritance after four linkers
Status: UNDEFINED
Depends on: A7.8
Source: `open_questions_do_not_resolve[5]`
Rule (formal): none for `kureli`, `sina`, `si`, `nevi`.
Rule (plain English): Missing rule: whether an unmarked clause after `kureli`, `sina`, `si` or `nevi` takes the main clause's tense.
Conditions and constraints: Named open by the JSON.
Components used: C:kureli, C:sina, C:si, C:nevi
Examples: `Kureli taivo venreva, maivo lirala.` (`function_words`) is present-present and so does not decide it.
Interactions: A7.8.
Issues: I-32

### A7.16 — Relatives on a time or place gap
Status: UNDEFINED
Depends on: A7.9
Source: `open_questions_do_not_resolve[4]`, `album.tracks[01].lines[0]`
Rule (formal): none for `krono raho …` and similar.
Rule (plain English): Missing rule: relative clauses whose gap is a time or a place ("the time when", "the place where").
Conditions and constraints: Held "until a second use".
Components used: C:raho
Examples: `krono raho baba melonulu po hiro farlafa yuta colbi.` (album 01, line 1).
Interactions: A7.9.
Issues: I-54

### Layer L8: discourse and register

### A8.1 — Topic and focus
Status: EXPLICIT
Depends on: A2.2, A3.20
Source: `clause.slots[1]`, `function_words` rows `hozi`, `vinto`, `rulings[1.0:G18]`
Rule (formal): `TOPIC ::= NP hozi ","` (slot 2, after FRAME); at most one per clause except paired contrastive topics in parallel clauses; `vinto X` = narrow focus; ¬(hozi X ∧ vinto X).
Rule (plain English): `hozi` after a clause-initial noun phrase marks the topic ("as for X"); `vinto` before a constituent marks narrow focus. A topic may host a focus elsewhere in the clause, never on the same constituent.
Conditions and constraints: Whether the topic must be resumed by a pronoun in the clause is not stated; both examples resume it (I-51).
Components used: C:hozi, C:vinto
Examples: `Li bumre hozi, Kipo po bumreba ito.` "As for the bread, Kipo baked it."; `Kipo hozi, saivo lirala; Dorin hozi, saivo resora.` (`examples.sentences[419]`, `[420]`).
Interactions: A3.20.
Issues: I-51

### A8.2 — Ellipsis
Status: EXPLICIT
Depends on: A2.4
Source: `rulings[0.8:G3]`
Rule (formal): omit a repeated subject in coordination and answers; omit a repeated predicate after a contrasting subject; answer with tense + verb; echo with `ki`; break off after any particle.
Rule (plain English): Everyday speech may drop repeated material in these places; the listener may complete a broken-off clause.
Conditions and constraints: Ellipsis leaves the same surface as a command (I-20).
Components used: C:ki, C:ne
Examples: `Dorin, ne.`; `Po sapusia.` (0.8:G3).
Interactions: A2.4, A5.8, A5.12.
Issues: I-20

### A8.3 — Discourse particles
Status: EXPLICIT
Depends on: A0.5
Source: `small_words.discourse_particles`
Rule (formal): `hema` (hesitation; initial, between constituents, alone); `nido` (self-repair; after the abandoned item, or clause-initial); `yori` (topic return; initial or alone); `zoke` (irony; clause-final attitude slot, may precede `ki`, alone).
Rule (plain English): Four particles manage the flow of talk; `zoke` doubles as an attitude word.
Conditions and constraints: `zoke` is everyday only; `hema` not sacred.
Components used: C:hema, C:nido, C:yori, C:zoke
Examples: `Maivo po bumreba tressa, nido, cuara bumreri.` "I baked three, I mean, four loaves." (`discourse_particles[1]`).
Interactions: A3.19.
Issues: I-41

### A8.4 — Registers
Status: EXPLICIT
Depends on: A1.6
Source: `word_building.registers`, `rulings[0.8:R10]`, `rulings[2.3:G86]`, `small_words.discourse_particles[*].register`
Rule (formal): entry register ∈ {everyday, poetic}; text register ∈ {everyday, poetic, sacred}; sacred is a property of `-asa`/`-asasan` forms.
Rule (plain English): Entries are everyday or poetic; texts may also be sacred, which is a matter of the ascended forms used, not of a word list.
Conditions and constraints: Which ascended forms are sacred depends on the word (A1.6).
Components used: C:-asa, C:-asasan
Examples: `Maivo de noru ka amorasasan.` "My dream is divinely loving." (`examples.sentences[23]`).
Interactions: A1.6, A8.5.
Issues: none found

### A8.5 — Verse licences
Status: EXPLICIT
Depends on: A4.2, A3.6, A0.2
Source: `rulings[0.8:R5]`, `rulings[1.2:G31]`, `rulings[2.0:G44]`, `rulings[1.2:G28]`
Rule (formal): in verse: `baba` omissible; bare present may narrate the past; vowels may glide; `-ri` after a number chosen by meter.
Rule (plain English): Verse may drop `baba`, narrate in the present once time is set, glide neighbouring vowels, and choose `-ri` after a number by sound.
Conditions and constraints: none further.
Components used: C:baba, C:-ri
Examples: none beyond those cited.
Interactions: A4.2, A3.6, A1.7.
Issues: none found

### A8.6 — The album as reference
Status: EXPLICIT
Depends on: A0.10
Source: `rulings[2.2:G68]`, `album.how_to_use`, `album.tracks[*].lines[*].album_reading`
Rule (formal): `Consistent(album, c) ⇒ Grammatical(c)`; `AlbumReading(line) ⇒ ¬Model(line)`.
Rule (plain English): A construction the album uses consistently is grammar; a line that departs once is an album reading, listed with its standard form, not to be imitated.
Conditions and constraints: Fifteen lines are album readings (AR-01–AR-15); AR-16 was resolved into 2.3:G74.
Components used: none
Examples: `maivo po ke baba lirasan lavra norusan.` (AR-02, adjective after the noun; standard form `maivo po ke baba norusan lirasan lavra.`).
Interactions: A0.10, A7.1 (line-initial `ata` came from the album, 2.3:G72).
Issues: none found

### A8.7 — Formulae of politeness
Status: EXPLICIT
Depends on: A0.5
Source: `function_words` rows `fisa`, `yade`, `yeko`, `voge`, `lorejuba`, `lorejuba ala taivo`, `zabo`, `kepi`
Rule (formal): fixed expressions; `lorejuba ala NP` = formal thanks to NP.
Rule (plain English): Please, sorry, hello, goodbye, thank you, yes, no.
Conditions and constraints: `lorejuba ala taivo` is listed as one function word though it is a phrase (I-44).
Components used: C:fisa, C:yade, C:yeko, C:voge, C:lorejuba, C:zabo, C:kepi
Examples: `yeko, sora` "hello, friend" (`function_words`).
Interactions: A5.11.
Issues: I-44


## 5. Component registry

Every grammatical morpheme and function word of the JSON: all 149 rows of `small_words.function_words` in their order, then the pronouns, the discourse particles, the bound morphemes the function-word table does not list, and the closed classes treated as wholes. "Function" quotes the JSON's own meaning and use. A component is cited elsewhere as `C:form`.

| ID | Form | Allomorphs/variants | Type | Position | Function | Scope | Obligatory? | Combines with | Cannot combine with | Axioms | Source path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C:li | li | — | article | NP: after QUANT, before NUMBER/ADJ/NOUN | the; definite article | NP | li: optional when obvious (0.8:R5); baba: omissible only in verse | quantifiers (toda li N), numbers, adjectives | another determiner or OWNER de in the same slot | A4.1, A4.2, A4.6 | small_words.function_words.rows[0] |
| C:baba | baba | — (omissible in verse) | article | NP: after QUANT, before NUMBER/ADJ/NOUN | a / an; indefinite article, any gender/vowel | NP | li: optional when obvious (0.8:R5); baba: omissible only in verse | quantifiers (toda li N), numbers, adjectives | another determiner or OWNER de in the same slot | A4.1, A4.2, A4.6 | small_words.function_words.rows[1] |
| C:eli | eli | eliri (PL) | demonstrative (determiner / pronoun) | NP determiner slot, or alone as NP | this; near demonstrative | NP | no | nouns, adjectives, numbers | li/baba in the same slot; alone for people (use eli-nela, ola-nela) | A4.1, A4.3 | small_words.function_words.rows[2] |
| C:ola | ola | olari (PL) | demonstrative (determiner / pronoun) | NP determiner slot, or alone as NP | that; far demonstrative | NP | no | nouns, adjectives, numbers | li/baba in the same slot; alone for people (use eli-nela, ola-nela) | A4.1, A4.3 | small_words.function_words.rows[3] |
| C:eliri | eliri | — | demonstrative (determiner / pronoun) | NP determiner slot, or alone as NP | these; plural demonstrative | NP | no | nouns, adjectives, numbers | li/baba in the same slot; alone for people (use eli-nela, ola-nela) | A4.1, A4.3 | small_words.function_words.rows[4] |
| C:olari | olari | — | demonstrative (determiner / pronoun) | NP determiner slot, or alone as NP | those; plural demonstrative | NP | no | nouns, adjectives, numbers | li/baba in the same slot; alone for people (use eli-nela, ola-nela) | A4.1, A4.3 | small_words.function_words.rows[5] |
| C:de | de | — | linker | between two NPs; after a number, quantifier or superlative | of / belonging to; owner + de + possessed noun | NP | no | NPs, pronouns, names, numbers | after a verb or adjective; with nothing after it (self_check[9]) | A4.8, A4.9, A4.10, A1.16 | small_words.function_words.rows[6] |
| C:sela | sela | — | reflexive particle | after a pronoun | oneself / reflexive; pronoun + sela | pronoun | no (required for a reflexive object, AR-06) | pronouns | — | A4.20 | small_words.function_words.rows[7] |
| C:-na | -na | — | suffix (form) | ROOT + na | lexical negation; suffix within seven-form root system | word | no | -ti, -ri | derivations (-yo, -vu, -pago) | A1.1, A1.5 | small_words.function_words.rows[8] |
| C:ne | ne | -ne (ordinal suffix, not negation) | negation particle | slot 6 by default; floats before any later operator, the verb, an NP, number or fragment | not (sentence/action); put immediately before scope of negation | what follows it (I-33) | no | every operator; ne A ne B | a nuna- word (reads as positive, avoid) | A3.8, A3.9, A7.2 | small_words.function_words.rows[9] |
| C:ke | ke | — | copula | slot 14 VERB | temporary is / are; copula for state or location now | clause predicate | one per clause (or a verb) | tense, noma, ne and other preverbal operators; ADJ, NP, PP predicates | sidu after it (self_check[11]); fime directly before it | A2.6, A2.9, A6.5 | small_words.function_words.rows[10] |
| C:ka | ka | — | copula | slot 14 VERB | enduring is / are; copula for stable quality | clause predicate | one per clause (or a verb) | tense, noma, ne and other preverbal operators; ADJ, NP, PP predicates | sidu after it (self_check[11]); fime directly before it | A2.6, A2.9, A6.5 | small_words.function_words.rows[11] |
| C:kapoki | kapoki | — | copula | slot 14 VERB | previously was; historical copula; po + ka is also regular | clause predicate | one per clause (or a verb) | tense, noma, ne and other preverbal operators; ADJ, NP, PP predicates | sidu after it (self_check[11]); fime directly before it | A2.6, A2.9, A6.5 | small_words.function_words.rows[12] |
| C:po | po | kapoki (with ka, I-11) | tense particle | slot 4 TENSE (after SUBJECT) | past marker (preverbal); Preverbal tense. po ka = was as a trait; kapoki = no longer is. | clause, everything to its right (1.0:G1) | no (none = present) | every later operator; copulas; valency operators | another tense in the same clause; position after the verb | A3.1, A3.4, A3.5 | small_words.function_words.rows[13] |
| C:pressa | pressa | — | tense particle | slot 4 TENSE (after SUBJECT) | present (optional); unmarked present preferred \| v0.5: author correction | clause, everything to its right (1.0:G1) | no (none = present) | every later operator; copulas; valency operators | another tense in the same clause; position after the verb | A3.1, A3.4, A3.5 | small_words.function_words.rows[14] |
| C:futu | futu | — | tense particle | slot 4 TENSE (after SUBJECT) | future; tense before verb/predicate | clause, everything to its right (1.0:G1) | no (none = present) | every later operator; copulas; valency operators | another tense in the same clause; position after the verb | A3.1, A3.4, A3.5 | small_words.function_words.rows[15] |
| C:roni | roni | — | aspect particle | slot 11 ASPECT | in progress; progressive aspect, before verb | verb | no | tense, modal, evidential | hiro/teki (roni, tefa); telvo/vazdi/fesmo (tefa) | A3.1, A3.2, A3.14 | small_words.function_words.rows[16] |
| C:tefa | tefa | — | aspect particle | slot 11 ASPECT | completed; completed aspect, before verb | verb | no | tense, modal, evidential | hiro/teki (roni, tefa); telvo/vazdi/fesmo (tefa) | A3.1, A3.2, A3.14 | small_words.function_words.rows[17] |
| C:sahi | sahi | — | aspect particle | slot 11 ASPECT | habitually; habitual aspect, before verb | verb | no | tense, modal, evidential | hiro/teki (roni, tefa); telvo/vazdi/fesmo (tefa) | A3.1, A3.2, A3.14 | small_words.function_words.rows[18] |
| C:kopi | kopi | — | modal particle | slot 7 MODAL | hope to; aspirational modality, not plain future \| v0.5: author correction | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[19] |
| C:povi | povi | — | modal particle | slot 7 MODAL | can / be able; ability modality before verb | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[20] |
| C:nosi | nosi | — | modal particle | slot 7 MODAL | might (epistemic possibility); uncertain possibility modality | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[21] |
| C:musi | musi | — | modal particle | slot 7 MODAL | must (obligation / circumstantial necessity); necessity/obligation modality | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[22] |
| C:suvi | suvi | — | modal particle | slot 7 MODAL | should; advisability modality | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[23] |
| C:viki | viki | — | modal particle | slot 7 MODAL | would; hypothetical modality | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[24] |
| C:ata | ata | — | coordinator | between equal constituents or clauses; may open a continuing line | and; connect equal constituents \| v0.5: author correction | constituent or clause | no | any constituent of the same kind | — | A7.1, A7.2 | small_words.function_words.rows[25] |
| C:nara | nara | — | coordinator | between equal constituents or clauses; may open a continuing line | but / however; contrast two clauses | constituent or clause | no | any constituent of the same kind | — | A7.1, A7.2 | small_words.function_words.rows[26] |
| C:oro | oro | — | coordinator | between equal constituents or clauses; may open a continuing line | or; choose among alternatives \| v0.5: author correction | constituent or clause | no | any constituent of the same kind | — | A7.1, A7.2 | small_words.function_words.rows[27] |
| C:si | si | — | subordinator | opens its clause | if; introduces condition | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[28] |
| C:sina | sina | — | subordinator | opens its clause | unless; negative condition | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[29] |
| C:kasa | kasa | — | subordinator | opens its clause | because; introduces cause clause \| v0.5: author correction | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[30] |
| C:kopisa | kopisa | — | subordinator | opens its clause | so that / in order to; purpose clause | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[31] |
| C:nevi | nevi | — | subordinator | opens its clause | although; concessive subordinate clause | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[32] |
| C:raho | raho | — | relative marker | after its noun; or headless; or opening a question (2.3:G74) | who / that / which (relative); relative clause marker \| v0.5: author correction | clause | no | a clause with a gap; a resumptive pronoun after a preposition | a following main verb without the closing comma (1.0:G21) | A7.9, A5.5 | small_words.function_words.rows[33] |
| C:kroti | kroti | kroti ola (previously) | preposition / subordinator / time word | before a measure, NP or clause; time word | before; temporal relation \| v0.5: author correction | NP or clause | no | measures, NPs, clauses, ola | — | A4.18, A7.7 | small_words.function_words.rows[34] |
| C:krotiata | krotiata | — | clause adverb / linker | clause-initial (or before an NP: sabri, korsi) | then / next; sequence marker; original compound | clause or NP | no | a clause | — | A7.3, A7.14 | small_words.function_words.rows[35] |
| C:krotiapo | krotiapo | — | preposition / subordinator | before a measure, NP or clause | after; temporal relation; lexicalized existing compound | NP or clause | no | measures, NPs, clauses | — | A4.18, A7.7 | small_words.function_words.rows[36] |
| C:en | en | — | preposition | before its NP; PP in slot 16 ADJUNCTS | in / inside; location \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[37] |
| C:su | su | — | preposition | before its NP; PP in slot 16 ADJUNCTS | on / upon; surface location \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[38] |
| C:ala | ala | — | preposition | before its NP; PP in slot 16 ADJUNCTS | to / toward; goal and direction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[39] |
| C:da | da | — | preposition | before its NP; PP in slot 16 ADJUNCTS | from; source \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[40] |
| C:ko | ko | — | preposition | before its NP; PP in slot 16 ADJUNCTS | with / alongside; accompaniment \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[41] |
| C:vobi | vobi | — | preposition | before its NP; PP in slot 16 ADJUNCTS | for / on behalf of; benefactive purpose \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[42] |
| C:intra | intra | — | preposition | before its NP; PP in slot 16 ADJUNCTS | within; internal relation \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[43] |
| C:entre | entre | — | preposition | before its NP; PP in slot 16 ADJUNCTS | between; between two entities \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[44] |
| C:transa | transa | — | preposition | before its NP; PP in slot 16 ADJUNCTS | through / across; passage \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[45] |
| C:ultra | ultra | — | preposition | before its NP; PP in slot 16 ADJUNCTS | beyond; beyond a limit \| v0.5: author correction | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[46] |
| C:hupi | hupi | — | preposition | before its NP; PP in slot 16 ADJUNCTS | above; vertical relation | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[47] |
| C:tula | tula | — | preposition | before its NP; PP in slot 16 ADJUNCTS | below; vertical relation | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[48] |
| C:ligo | ligo | — | preposition | before its NP; PP in slot 16 ADJUNCTS | near; proximity | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[49] |
| C:vofa | vofa | — | preposition | before its NP; PP in slot 16 ADJUNCTS | far from; distance | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[50] |
| C:voyu | voyu | — | preposition | before its NP; PP in slot 16 ADJUNCTS | without; prepositional absence | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[51] |
| C:ki | ki | — | question particle | slot 20, last word of its clause | yes/no question; sentence-final particle; no inversion | clause | yes in a yes/no question; per 2.2:G60/G61, 2.3:G74/G76 with ki-words | attitude words before it; a vocative after it | embedded questions | A5.2, A5.3, A5.5, A5.12 | small_words.function_words.rows[52] |
| C:ki-coda | ki-coda | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | what; ki- + thing | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[53] |
| C:ki-pago | ki-pago | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | where; ki- + place | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[54] |
| C:ki-krono | ki-krono | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | when; ki- + time | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[55] |
| C:ki-kasa | ki-kasa | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | why; ki- + cause | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[56] |
| C:ki-saivo | ki-saivo | ki-nela (preferred) | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | who; HISTORICAL ONLY; preferred productive interrogative ki-nela. | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[57] |
| C:ki-modo | ki-modo | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | how; ki- + manner | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[58] |
| C:ki-nela de | ki-nela de | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | whose; interrogative person (ki-nela) + possession; ki-saivo de is historical | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[59] |
| C:ki-muya | ki-muya | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | how many; question + quantity | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[60] |
| C:la | la | — | adverbializer | before an adjective, in ADJUNCTS | adverbial particle; la + adjective; adverbs do not need an eighth form | adjective | no | adjectives | — | A4.17 | small_words.function_words.rows[61] |
| C:ruli | ruli | — | degree word | immediately before an adjective (or number / quantifier) | very / intensely; degree intensifier | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[62] |
| C:doli | doli | — | pre-constituent operator | immediately before its constituent | only; restrictive focus | the single constituent that follows (1.0:G1) | no | NP, verb, adjective, number, clause-introducer (si) | hozi on the same constituent (vinto) | A3.20 | small_words.function_words.rows[63] |
| C:kasi | kasi | — | degree word | immediately before an adjective (or number / quantifier) | more; comparative marker before adjective | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[64] |
| C:menu | menu | — | degree word | immediately before an adjective (or number / quantifier) | less; comparative marker before adjective | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[65] |
| C:tamo | tamo | — | comparison marker | after kasi/menu ADJ | than; comparison reference marker | NP | with kasi/menu | NP | — | A4.12, A7.13 | small_words.function_words.rows[66] |
| C:mosa | mosa | — | degree word | immediately before an adjective (or number / quantifier) | most; superlative marker | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[67] |
| C:lusu | lusu | — | degree word | immediately before an adjective (or number / quantifier) | least; minimum superlative | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[68] |
| C:gase | gase | — | degree word | immediately before an adjective (or number / quantifier) | as (comparison); comparative equality | adjective, number or quantifier | no | adjectives; tamo, gase (comparison) | — | A4.12, A7.13 | small_words.function_words.rows[69] |
| C:toda | toda | — | quantifier | NP-initial (slot QUANTIFIER) | all / every; universal quantifier | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[70] |
| C:somi | somi | — | quantifier | NP-initial (slot QUANTIFIER) | some; indefinite quantity | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[71] |
| C:nuna | nuna | — | quantifier | NP-initial (slot QUANTIFIER) | none / no; zero quantity | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[72] |
| C:muya | muya | — | quantifier | NP-initial (slot QUANTIFIER) | many; large quantity | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[73] |
| C:poka | poka | — | quantifier | NP-initial (slot QUANTIFIER) | few; small quantity | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[74] |
| C:rada | rada | — | quantifier | NP-initial (slot QUANTIFIER) | each; distributive quantity | NP | no | li (toda li N), OWNER de, -krono (muya, poka, rada) | other correlative bases (muya, poka, rada: krono only) | A4.1, A4.4, A1.14 | small_words.function_words.rows[75] |
| C:-ti | -ti | — | suffix (diminutive) | after a form or derivation, before -ri | little / diminutive; suffix after lexical form, before plural | word | no | roots, compounds, derivations, names | — | A1.4, A1.8 | small_words.function_words.rows[76] |
| C:-ri | -ri | — | suffix (plural) | word-final, always last | plurality; suffix after lexical form / -ti | word | on a plural noun without a number or quantifier | -ti before it | anything after it | A1.4, A1.7, A4.11 | small_words.function_words.rows[77] |
| C:zabo | zabo | — | interjection / formula | standalone or clause-initial with a comma | yes / affirmative; affirmative response \| v0.5: author correction | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[78] |
| C:kepi | kepi | — | interjection / formula | standalone or clause-initial with a comma | no; negative response | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[79] |
| C:fisa | fisa | — | softener | clause-initial or clause-final with a comma, in a command | please; request softener | command | no | commands | — | A5.8 | small_words.function_words.rows[80] |
| C:yade | yade | — | interjection / formula | standalone or clause-initial with a comma | sorry / pardon; apology \| v0.5: author correction | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[81] |
| C:yeko | yeko | — | interjection / formula | standalone or clause-initial with a comma | hello; greeting | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[82] |
| C:voge | voge | — | interjection / formula | standalone or clause-initial with a comma | goodbye / parting; farewell \| v0.5: author correction | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[83] |
| C:futupago | futupago | — | time word | clause-initial (comma optional) or clause-final (1.2:G24) | sometime in the future; established time-place metaphor | clause | no | other time phrases in FRAME, wider first (2.3:G78) | — | A3.21, A4.18, I-27 | small_words.function_words.rows[84] |
| C:fututi | fututi | — | time word / approach particle | clause edge (soon) or slot 8 APPROACH (about to) | soon; futu + diminutive ti | clause / verb | no | tense (in slot 8) | tavki | A3.11, A4.18 | small_words.function_words.rows[85] |
| C:deyapressa | deyapressa | — | time word | clause-initial (comma optional) or clause-final (1.2:G24) | today; day + present | clause | no | other time phrases in FRAME, wider first (2.3:G78) | — | A3.21, A4.18, I-27 | small_words.function_words.rows[86] |
| C:deyaapo | deyaapo | — | time word | clause-initial (comma optional) or clause-final (1.2:G24) | yesterday; day + past | clause | no | other time phrases in FRAME, wider first (2.3:G78) | — | A3.21, A4.18, I-27 | small_words.function_words.rows[87] |
| C:deyafutu | deyafutu | — | time word | clause-initial (comma optional) or clause-final (1.2:G24) | tomorrow; day + future | clause | no | other time phrases in FRAME, wider first (2.3:G78) | — | A3.21, A4.18, I-27 | small_words.function_words.rows[88] |
| C:sidu | sidu | — | verb chainer | between a verb (or adjective) and a bare second verb; or opening a nominalised VP | infinitive / chaining; Between first lexical verb and bare second verb | verb phrase | no | verbs, adjectives (2.2:G65) | a copula after it; non-verbs on both sides (self_check[11]) | A6.1, A6.2, A6.7 | small_words.function_words.rows[89] |
| C:kube | kube | — | subordinator | opens its clause | when (subordinate); Before time clause, not a question | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[90] |
| C:nayo | nayo | — | subordinator | opens its clause | while (subordinate time); Introduces simultaneous event clause \| v0.5: author correction | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[91] |
| C:tuni | tuni | — | subordinator | opens its clause | until; Introduces endpoint time clause | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[92] |
| C:sige | sige | — | subordinator | opens its clause | since (time); Introduces beginning point / since-event clause | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[93] |
| C:kureli | kureli | — | subordinator | opens its clause | as soon as; Introduces immediately-following time relation | clause | no | a full clause | — | A7.3 | small_words.function_words.rows[94] |
| C:yava | yava | — | hortative particle | in the subject position, opening the clause | let us (hortative); Sentence-initial particle + plain verb; includes speaker and listener | clause | no | ne, a plain verb | a subject | A5.9 | small_words.function_words.rows[95] |
| C:vaku | vaku | — | valency operator | slot 14 VERB, followed by ACTOR + embedded verb | causative; Approved productive causative. CAUSER + vaku + ACTOR/PATIENT + intransitive VERB; patient/actor retains position after vaku. | clause | no | main-clause tense, modal, evidential; actor's ne, phase, effort | main-clause operators inside the embedded part | A6.3 | small_words.function_words.rows[96] |
| C:gome | gome | — | passive auxiliary | slot 14, before the verb | passive voice; PATIENT + [TENSE] + gome + TRANSITIVE VERB + [gagu AGENT] | clause | no | tense; gagu | a verb never used with an object (I-22) | A6.4 | small_words.function_words.rows[97] |
| C:gagu | gagu | — | passive agent preposition | after the passive verb | passive agent: by; Introduces optional external actor after passive verb | NP | no | gome | a clause without gome | A6.4 | small_words.function_words.rows[98] |
| C:miyo | miyo | — | existential | clause-initial (VERB slot, no subject) | existential there is / are; miyo + noun phrase (+ location); agreement invariant | clause | no | NP, location PP | — | A2.8 | small_words.function_words.rows[99] |
| C:loya | loya | — | copula (become) | slot 14 VERB | become; Subject + [tense] loya + noun/adjective/state | clause | no | tense; ADJ or NP | — | A2.9 | small_words.function_words.rows[100] |
| C:fuyi | fuyi | — | reciprocal particle | slot 17, after ADJUNCTS | each other / reciprocal; After mutually directed verb; requires plural/multiple actors | clause | no | plural subjects | singular subjects | A3.17 | small_words.function_words.rows[101] |
| C:ki-eli | ki-eli | — | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | which? + noun; Interrogative determiner immediately before noun | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[102] |
| C:ki-nela | ki-nela | ki-saivo (historical) | interrogative correlative | in the answer's place, or clause-initial (2.2:G60) | who? preferred; Interrogative person; old ki-saivo allowed historically | clause (question) | no | final ki (optional / required per 2.2:G61, 2.3:G76) | ki in an embedded question | A5.3, A5.4 | small_words.function_words.rows[103] |
| C:-yo | -yo | — | suffix (derivation, agent) | ROOT\|COMPOUND + yo | agentive derivation; Attach to the ROOT: ROOT + yo = agent/doer (lira → lirayo); no seven-form expansion | word | no | -ti, -ri | seven-form suffixes; a second derivation | A1.9 | small_words.function_words.rows[104] |
| C:-pago | -pago | — | suffix (derivation, place) | ROOT\|COMPOUND + pago | place derivation; Attach to root: R + pago = place associated with root | word | no | -ti, -ri | seven-form suffixes; mavo (mavopago = society only) | A1.9 | small_words.function_words.rows[105] |
| C:-vu | -vu | — | suffix (derivation, augmentative) | ROOT\|COMPOUND + vu | augmentative derivation; Attach to the ROOT: ROOT + vu (lira → liravu); ordinary large/intense, not sacred | word | no | -ti, -ri | seven-form suffixes; a second derivation | A1.9 | small_words.function_words.rows[106] |
| C:fime | fime | — | complementizer | opens a content clause | complementizer: that; introduces a finite content clause; distinct from relative marker | clause | no | a full clause; nosi (2.2:G63); tonsi ADJ … fime (2.2:G62) | a copula or tense directly after it (self_check[12]) | A7.10, A7.11, A6.7 | small_words.function_words.rows[107] |
| C:lorejuba | lorejuba | — | interjection / formula | standalone or clause-initial with a comma | thank you (short, native); everyday standalone heart-gift thanks | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[108] |
| C:lorejuba ala taivo | lorejuba ala taivo | — | interjection / formula | standalone or clause-initial with a comma | thank you (formal); heart-gift + to + listener; can address another pronoun/name | utterance | no | vocatives | — | A8.7, A5.12 | small_words.function_words.rows[109] |
| C:reve | reve | — | iteration particle | slot 12 ITERATION (reve, loki also clause-final) | again; repeated event; independent temporal adverb, preceding verb or final in clause | verb | no | tense, aspect, evidential | another iteration word | A3.1, A3.15 | small_words.function_words.rows[110] |
| C:loki | loki | — | iteration particle | slot 12 ITERATION (reve, loki also clause-final) | still; continuing; independent temporal adverb, preceding verb or final in clause | verb | no | tense, aspect, evidential | another iteration word | A3.1, A3.15 | small_words.function_words.rows[111] |
| C:bodu | bodu | — | iteration particle | slot 12 ITERATION (reve, loki also clause-final) | already; before expected time; before predicate, following tense; distinct from perfective | verb | no | tense, aspect, evidential | another iteration word | A3.1, A3.15 | small_words.function_words.rows[112] |
| C:yehu | yehu | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | evidential: witnessed; Immediately before lexical verb, after tense/aspect: speaker saw it | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[113] |
| C:gesu | gesu | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | evidential: heard; Immediately before lexical verb, after tense/aspect: speaker heard it | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[114] |
| C:bisu | bisu | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | evidential: felt; Immediately before lexical verb, after tense/aspect: introspective feeling | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[115] |
| C:vuda | vuda | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | evidential: dreamed / imagined; Immediately before lexical verb, after tense/aspect: dream or imagination \| v0.5: author correction | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[116] |
| C:buyu | buyu | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | evidential: reported; Immediately before lexical verb, after tense/aspect: learned from others | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[117] |
| C:seye | seye | — | attitude particle | slot 19 ATTITUDE, clause-final, before ki | final certainty: certain; Sentence-final, before punctuation / after predicate | clause | no | ki after it; any subject (pifu) | zoke with seye/mufe/poye/pifu; clause-initial position (1.0:G22) | A3.19, A5.10 | small_words.function_words.rows[118] |
| C:mufe | mufe | — | attitude particle | slot 19 ATTITUDE, clause-final, before ki | final certainty: probable; Sentence-final, before punctuation / after predicate | clause | no | ki after it; any subject (pifu) | zoke with seye/mufe/poye/pifu; clause-initial position (1.0:G22) | A3.19, A5.10 | small_words.function_words.rows[119] |
| C:poye | poye | — | attitude particle | slot 19 ATTITUDE, clause-final, before ki | final certainty: maybe; Sentence-final, before punctuation / after predicate | clause | no | ki after it; any subject (pifu) | zoke with seye/mufe/poye/pifu; clause-initial position (1.0:G22) | A3.19, A5.10 | small_words.function_words.rows[120] |
| C:pifu | pifu | — | attitude particle | slot 19 ATTITUDE, clause-final, before ki | final certainty: wish / hope; Sentence-final, before punctuation / after predicate | clause | no | ki after it; any subject (pifu) | zoke with seye/mufe/poye/pifu; clause-initial position (1.0:G22) | A3.19, A5.10 | small_words.function_words.rows[121] |
| C:tu | tu | — | pre-constituent operator | immediately before its constituent | also; too (additive focus); before its constituent | the single constituent that follows (1.0:G1) | no | NP, verb, adjective, number, clause-introducer (si) | hozi on the same constituent (vinto) | A3.20 | small_words.function_words.rows[122] |
| C:yesta | yesta | — | pre-constituent operator | immediately before its constituent | even (scalar focus: the least expected member); before its constituent | the single constituent that follows (1.0:G1) | no | NP, verb, adjective, number, clause-introducer (si) | hozi on the same constituent (vinto) | A3.20 | small_words.function_words.rows[123] |
| C:pendi | pendi | — | pre-constituent operator | immediately before its constituent | exactly; precisely; before its constituent | the single constituent that follows (1.0:G1) | no | NP, verb, adjective, number, clause-introducer (si) | hozi on the same constituent (vinto) | A3.20 | small_words.function_words.rows[124] |
| C:vinto | vinto | — | pre-constituent operator | immediately before its constituent | narrow focus: it is X (and not something else) that…; before its constituent | the single constituent that follows (1.0:G1) | no | NP, verb, adjective, number, clause-introducer (si) | hozi on the same constituent (vinto) | A3.20 | small_words.function_words.rows[125] |
| C:hozi | hozi | — | topic marker | after a clause-initial NP, then a comma (slot 2) | topic: as for X; two parallel hozi-phrases mark contrastive topics; after a clause-initial noun phrase, followed by a pause | NP | no | vinto elsewhere in the clause | vinto on the same constituent | A8.1 | small_words.function_words.rows[126] |
| C:sabri | sabri | — | clause adverb / linker | clause-initial (or before an NP: sabri, korsi) | except; excluding; except that; before a noun phrase or clause | clause or NP | no | a clause | — | A7.3, A7.14 | small_words.function_words.rows[127] |
| C:korsi | korsi | — | clause adverb / linker | clause-initial (or before an NP: sabri, korsi) | instead of; rather than; instead; before a noun phrase; or clause-initial | clause or NP | no | a clause | — | A7.3, A7.14 | small_words.function_words.rows[128] |
| C:tonsi | tonsi | — | clause adverb / degree word | clause-initial (therefore) or before an adjective (so) | therefore; so (logical consequence); clause-initial | clause or adjective | no | fime (result) | — | A4.13, A7.6 | small_words.function_words.rows[129] |
| C:narli | narli | — | clause adverb / linker | clause-initial (or before an NP: sabri, korsi) | nevertheless; even so; clause-initial | clause or NP | no | a clause | — | A7.3, A7.14 | small_words.function_words.rows[130] |
| C:ki-oro | ki-oro | — | complementizer (whether) | opens an embedded yes/no clause | whether (or not); introduces an embedded yes/no question | clause | no | a full clause | ki | A5.7 | small_words.function_words.rows[131] |
| C:dagi | dagi | — | modal particle | slot 7 MODAL | be allowed to; may (permission); modal slot | verb and operators to its right | no; one per clause | tense, noma, ne (either side) | a second modal | A3.1, A3.10 | small_words.function_words.rows[132] |
| C:noma | noma | — | counterfactual particle | slot 5, after TENSE, before ne | counterfactual: the clause is contrary to fact; right after tense, before ne | clause | no | a tense, modal or si-clause context (1.0:G16); pifu | — | A3.7 | small_words.function_words.rows[133] |
| C:tosu | tosu | — | evidential particle | slot 13 EVIDENTIAL, immediately before the verb | inferred from evidence; evidential slot | clause (source of information) | no; one per clause | tense, aspect; seye (tosu) | a second evidential | A3.1, A3.16 | small_words.function_words.rows[134] |
| C:tavki | tavki | — | approach particle | slot 8 APPROACH | almost; nearly (the event came close but did not happen); approach slot | verb | no | tense | tavki with fututi | A3.1, A3.11 | small_words.function_words.rows[135] |
| C:hiro | hiro | — | phase particle | slot 9 PHASE | begin to (inceptive); phase slot | verb | no | tense, effort | roni, tefa | A3.1, A3.12 | small_words.function_words.rows[136] |
| C:teki | teki | — | phase particle | slot 9 PHASE | stop; cease doing (cessative); phase slot | verb | no | tense, effort | roni, tefa | A3.1, A3.12 | small_words.function_words.rows[137] |
| C:telvo | telvo | — | effort particle | slot 10 EFFORT | try to (outcome open); effort slot | verb | no | tense, ne (either side) | tefa | A3.1, A3.13 | small_words.function_words.rows[138] |
| C:vazdi | vazdi | — | effort particle | slot 10 EFFORT | manage to; succeed in; effort slot | verb | no | tense, ne (either side) | tefa | A3.1, A3.13 | small_words.function_words.rows[139] |
| C:fesmo | fesmo | — | effort particle | slot 10 EFFORT | try and fail to; effort slot | verb | no | tense, ne (either side) | tefa | A3.1, A3.13 | small_words.function_words.rows[140] |
| C:lesvu | lesvu | — | valency operator | slot 14 VERB, followed by ACTOR + embedded verb | let; allow (permissive); verb slot: CAUSER lesvu ACTOR VERB | clause | no | main-clause tense, modal, evidential; actor's ne, phase, effort | main-clause operators inside the embedded part | A6.3 | small_words.function_words.rows[141] |
| C:tekvu | tekvu | — | valency operator | slot 14 VERB, followed by ACTOR + embedded verb | prevent from; stop someone doing; verb slot: CAUSER tekvu ACTOR VERB | clause | no | main-clause tense, modal, evidential; actor's ne, phase, effort | main-clause operators inside the embedded part | A6.3 | small_words.function_words.rows[142] |
| C:hoyo | hoyo | — | status particle | slot 18 STATUS, after the predicate | mirative: newly discovered or surprising to the speaker; after the predicate, before certainty | clause | no | attitude words after it | hoyo with yasmo | A3.18 | small_words.function_words.rows[143] |
| C:yasmo | yasmo | — | status particle | slot 18 STATUS, after the predicate | as is known; shared knowledge; after the predicate, before certainty | clause | no | attitude words after it | hoyo with yasmo | A3.18 | small_words.function_words.rows[144] |
| C:zafra | zafra | — | frame adverb | slot 1 FRAME, clause-initial, comma required | suddenly (abrupt onset); clause-initial frame slot | clause | no | a following clause | any non-initial position (self_check[13]) | A0.8, A2.2 | small_words.function_words.rows[145] |
| C:finra | finra | — | frame adverb | slot 1 FRAME, clause-initial, comma required | finally; at last (after delay or effort); clause-initial frame slot | clause | no | a following clause | any non-initial position (self_check[13]) | A0.8, A2.2 | small_words.function_words.rows[146] |
| C:lanto | lanto | — | frame adverb | slot 1 FRAME, clause-initial, comma required | eventually (after time has passed); clause-initial frame slot | clause | no | a following clause | any non-initial position (self_check[13]) | A0.8, A2.2 | small_words.function_words.rows[147] |
| C:kenvi | kenvi | — | frame adverb | slot 1 FRAME, clause-initial, comma required | immediately; at once; clause-initial frame slot | clause | no | a following clause | any non-initial position (self_check[13]) | A0.8, A2.2 | small_words.function_words.rows[148] |
| C:yuta | yuta | — | preposition | before its NP; PP in slot 16 ADJUNCTS | with; using; by means of; instrument: the tool or means of an action, in the ADJUNCTS slot; never accompaniment, which is ko | NP | no | NP | stranding (self_check[10]) | A4.14 | small_words.function_words.rows[149] |
| C:diba | diba | — | degree word (excess) | before a quantifier or adjective | too; excessively; degree word before an adjective or quantifier: excess; never additive, which is tu | quantifier or adjective | no | quantifiers, adjectives | — | A4.4 | small_words.function_words.rows[150] |
| C:maivo | maivo | maivori (PL) | pronoun | any NP position; before de as owner; before sela | First person, Singular | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[0] |
| C:taivo | taivo | taivori (PL) | pronoun | any NP position; before de as owner; before sela | Second person, Singular | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[1] |
| C:saivo | saivo | saivori (PL) | pronoun | any NP position; before de as owner; before sela | Third person, Singular human / person | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[2] |
| C:maivori | maivori | — | pronoun | any NP position; before de as owner; before sela | First person, Plural | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[3] |
| C:taivori | taivori | — | pronoun | any NP position; before de as owner; before sela | Second person, Plural | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[4] |
| C:saivori | saivori | — | pronoun | any NP position; before de as owner; before sela | Third person, Plural people | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[5] |
| C:ito | ito | itori (PL) | pronoun | any NP position; before de as owner; before sela | Third person, Singular inanimate | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[6] |
| C:itori | itori | — | pronoun | any NP position; before de as owner; before sela | Third person, Plural inanimate | NP | no | de, sela, -ri | de-less possession | A4.20, A4.8 | small_words.pronouns[7] |
| C:hema | hema | — | discourse particle | clause-initial; between constituents; standalone | hesitation; holding the floor ("well…", "um") | utterance | no | — | — | A8.3 | small_words.discourse_particles[0] |
| C:nido | nido | — | discourse particle | immediately after the abandoned item and before its replacement; or clause-initial to reformulate a whole previous utterance | self-repair: cancels the speaker's own preceding word, phrase or clause and replaces it ("I mean", "rather", "no —") | utterance | no | — | — | A8.3 | small_words.discourse_particles[1] |
| C:yori | yori | — | discourse particle | clause-initial; standalone | topic return / closure ("anyway", "at any rate"); with a possessive seno phrase, resumption ("as I was saying") | utterance | no | — | — | A8.3 | small_words.discourse_particles[2] |
| C:zoke | zoke | — | discourse particle / attitude | clause-final, in the attitude slot (instead of seye/mufe/poye/pifu); may precede ki; standalone | irony / sarcasm: the speaker does not endorse, or mocks, the proposition | utterance | no | ki after it | seye, mufe, poye, pifu | A8.3, A3.19 | small_words.discourse_particles[3] |
| C:-asa | -asa | — | suffix (form) | ROOT + asa | ascended noun (sacred or highest degree, 2.3:G86) | word | no (listed forms only) | -ti, -ri | derivations | A1.1, A1.6 | word_building.seven_forms.slots[1] |
| C:-san | -san | — | suffix (form) | ROOT + san | adjective | word | no | -ti, -ri (I-29) | derivations | A1.1, A1.18 | word_building.seven_forms.slots[5] |
| C:-asasan | -asasan | — | suffix (form) | ROOT + asasan | ascended adjective | word | no | — | derivations | A1.1, A1.6 | word_building.seven_forms.slots[6] |
| C:-nasan | -nasan | — | suffix (form) | ROOT + nasan | negative adjective | word | no | — | derivations | A1.1, A1.5 | word_building.seven_forms.slots[4] |
| C:V | -Ca / -nia / -sia / -a | opioa (irregular) | suffix (verb form) | ROOT + ending by first letter | verb | word | no (listed forms only) | motion prefixes | derivations; -ri, -ti (I-29) | A1.2, A1.3 | word_building.verb_rule |
| C:-ne | -ne | — | suffix (ordinal) | NUMBER-ne, hyphenated, before the noun | ordinal | number | no | numbers | reading as negation | A1.16 | small_words.numbers.rules[J] |
| C:-krono | -krono | — | correlative base / suffix | QUANT-krono, NUMBER-krono, DET-krono | time / frequency / N times | word | no | muya, poka, rada, numbers, ki-muya, the six determiners | other quantifiers with other bases | A1.14, A4.19 | small_words.correlatives; rulings[1.2:G34]; rulings[2.1:G49] |
| C:ki- | ki- | — | prefix (interrogative) | ki-BASE | question word | word | no | coda, pago, krono, nela, modo, kasa, eli, muya, oro | — | A1.14, A5.4 | small_words.correlatives |
| C:va- | va- | — | prefix (motion) | on a motion verb, hyphenated | toward the speaker | verb | no | motion verbs (I-06) | non-motion verbs (I-05) | A1.13 | word_building.motion_prefixes.canon |
| C:du- | du- | — | prefix (motion) | on a motion verb, hyphenated | away; giving away | verb | no | motion verbs | non-motion verbs | A1.13 | word_building.motion_prefixes.canon |
| C:taro- | taro- | — | prefix (motion) | on a motion verb, hyphenated | across | verb | no | motion verbs; pagopa (2.3:G75) | non-motion verbs | A1.13 | word_building.motion_prefixes.canon |
| C:yave- | yave- | — | prefix (motion) | on a motion verb, hyphenated | together, to meet (yave-donuda) | verb | no | motion verbs; donuda (curated) | non-motion verbs | A1.13 | word_building.motion_prefixes.canon |
| C:revo- | revo- | — | prefix (motion) | on a motion verb, hyphenated | back, again (revo-vimova, revo-lirala, revo-sabesia) | verb | no | motion verbs; three curated verbs | non-motion verbs | A1.13 | word_building.motion_prefixes.canon |
| C:NUM | numerals | see A1.15 | closed class | before the noun (after a determiner) | cardinal numbers | NP | no | -ri (optional), -ne, -krono, de (fraction, partitive) | — | A1.15, A4.11 | small_words.numbers |
| C:TIME | time words | see table | closed class | clause edge (1.2:G24) | time adverbials | clause | no | FRAME | — | A4.18, I-27 | small_words.time_words |
| C:COLOUR | colour words | base, -narvo, -bio, -juba, -lumi | closed class | adjective or noun position; compound modifier | colours | NP | no | compounds (2.0:G38) | — | A1.17 | small_words.colours |
| C:CORREL | correlatives | 36 + 3 | closed class | NP or adverbial positions; -krono ones at clause edges | what/this/that/every/no/some × thing/place/time/person/manner/reason | NP or clause | no | — | other bases with muya, poka, rada | A1.14 | small_words.correlatives |


## 6. Parse test

**Coverage.** Every Liraasa string in the JSON was parsed: 1,471 strings from `examples.sentences` (581), `recipes` (79 after splitting alternatives such as `A / B` and dialogue turns), ruling examples (73), examples quoted inside ruling text (45), `clause` (3), function-word examples (149), pronoun possessives and reflexives (16), correlatives (39), number examples and ordinal/fraction forms (23), time words (43), discourse-particle examples (19), `word_building` illustrations (126) and the album (275 lines, read in their current spelling where the JSON gives one, as 2.1:G58 directs). The full table, with each string's source path, morph segmentation, slot assignment and verdict, is in **`review/grammar_spec_2_3_parses.md`**.

**Method.** Each string was segmented by the editor's reader, which follows `how_to_translate.how_a_reader_parses_one_word` (A0.6), and placed in the 20-slot template by the editor's slot placer. Its rules (the `self_check` list) were run too. That is a mechanical implementation of axioms A0.6, A2.2, A3.1 and A4.1; it is not the grammar. Three layers were added by hand from this specification: (1) the lines the JSON itself marks as album readings fail, whether or not the placer notices; (2) the structural ambiguities in the issue log are applied to every string that contains them; (3) strings that break a stated rule the placer does not check (the comma of 1.0:G21, the closed list of motion prefixes, `ata` as "so") fail. The reader always prefers a lexical reading, so homophones it hides (I-16, I-17) are reported as a separate verdict.

**Verdicts.**

| Verdict | Count | Meaning |
| --- | --- | --- |
| PASS | 937 | exactly one parse |
| PASS (lexical homophone) | 476 | one structure, but a word has two readings with nearly the same meaning: `maivo(ri)` pronoun or the noun "Self" (I-16); `nullo`/`merno`/`vesno`/`mambi`/`lornu` noun or time word (I-17); `aurumijuba`/`vanajuba` noun or colour |
| MULTIPLE PARSES | 32 | two structures, or a licence that depends on an undefined rule |
| FAIL | 26 | an unknown word, a rule violation, or a line the JSON marks as departing from the grammar |

By source: examples 563 pass / 8 multiple / 10 fail; recipes 75 / 3 / 1; ruling examples 69 / 4 / 0; examples inside ruling text 44 / 1 / 0; album 244 / 16 / 15; every other table passes.

**FAIL (26).**

| ID | Source | Liraasa | Why |
| --- | --- | --- | --- |
| E-015, R-060 | `examples.sentences[14]`, `recipes[55]` | `Li nela raho lirala ka benasan.` | raho clause not closed by the comma 1.0:G21 requires (I-08) |
| E-025 | `examples.sentences[24]` | `Li noru raho maivo po norunia ka vanisan.` | same (I-08) |
| E-174 | `examples.sentences[173]` | `va-lirala` | motion prefix on a non-motion verb, not a curated metaphor (I-05) |
| E-176 | `examples.sentences[175]` | `va-miruma` | same (I-05) |
| E-177 | `examples.sentences[176]` | `revo-miruma` | same (I-05) |
| E-180 | `examples.sentences[179]` | `va-vimova` | same; only `revo-vimova` is curated (I-05) |
| E-204 | `examples.sentences[203]` | `lira + yo = lirayo` | a morphological equation, not a sentence: `yo` is "not a word of Liraasa", and two noun phrases stand with no verb (I-40) |
| E-205 | `examples.sentences[204]` | `lira + vu = liravu` | same (I-40) |
| E-206 | `examples.sentences[205]` | `lemu + pago = lemupago` | same; also `lemu pago` reads as two bare nouns (ADR-0011) (I-40) |
| E-237 | `examples.sentences[236]` | `Ata?` | `ata` as "so?"; 1.0:G13 says `ata` is "and" only, and a yes/no question ends in `ki` (I-31) |
| A-010 | album 01, line 10 | `lanto, saivo po veseva fime raho saivo viki ke saivo de devorivo.` | AR-01: "fime + headless raho has no predicate for the raho-phrase." |
| A-017 | album 02, line 1 | `maivo po ke baba lirasan lavra norusan.` | AR-02: "Adjective after the noun (0.8:G7 order)." |
| A-024 | album 02, line 8 | `maivo mambivimoma ala li ata masuma lanla ata po milobema.` | AR-04: "li followed directly by ata; the phrase does not parse." |
| A-032 | album 02, line 16 | `li linu raho navdinia sabesia baba bio de milno.` | AR-03: "Relative clause not closed by a comma (1.0:G21)." |
| A-073 | album 05, line 9 | `kube ito futu ke salrusan maivo ata donuda ala ito baba biti vobi demro.` | AR-05: "Appears to be a draft of the next line" |
| A-084 | album 05, line 20 | `voyu taivo de navu maivo ne povi navdinia maivo.` | AR-06: "Reflexive object needs sela." |
| A-150 | album 08, line 1 | `maivo futu senosia ala taivo de baba gargonasan colbi.` | AR-07: pronoun + `de` reads as owner; recipient order (1.2:G26) |
| A-151 | album 08, line 2 | `maivo futu veseva ala taivo de li vera de damruna.` | AR-08: same; also a `de` chain (I-13) |
| A-162 | album 08, line 13 | `li sabeasasan nelari raho pensapa peburalno en milno ki?` | AR-09: noun for verb; relative needs a closing comma |
| A-164 | album 08, line 15 | `si maivo ke sidu daigoda, maivo kopi daigoda en saivo de varori.` | AR-10: "sidu never follows a copula" |
| A-184 | album 10, line 3 | `maivo po silbesia saivo de vaye raho po jubaja baba nonmori.` | AR-11: pronoun + `de` reads as owner |
| A-187 | album 10, line 6 | `tonsi maivo po silbesia saivo de baba pagonasan folni.` | AR-12: same; recipient order |
| A-194 | album 10, line 13 | `maivo po veseva ala saivo de li krotiata lirasarbi.` | AR-13: same |
| A-196 | album 10, line 15 | `saivo po farufasbifa kube saivo ramusan raho maivo po ke.` | AR-14: adjective for verb |
| A-197 | album 10, line 16 | `maivo toda-krono po ke saivo de devorivo.` | AR-15: time word between subject and tense |

Of the 15 album readings, the editor's checker itself flags only AR-10 (`ke sidu`); the other 14 pass its rules. That is a finding about the checker, not about the grammar, and it is recorded here for the author's tool work.

**MULTIPLE PARSES (32).**

| ID | Source | Liraasa | The parses |
| --- | --- | --- | --- |
| E-525 | `examples.sentences[524]` | `Maivo po masuma li talirivo ki-kasa.` | statement with an embedded question / direct question without `ki` (I-01) |
| E-211 | `examples.sentences[210]` | `Maivo po vimova raho taivo pagopa.` | headless relative (no gap) / `raho` as complementizer, the English (I-07) |
| E-301, R-040, G-047 | `examples.sentences[300]`, `recipes[35]`, 1.2:G27 | `Eli bumre ka sambasan ko pilo de bumre.` | `pilo` a name (father's bread) / a noun (the bread's father) (I-12) |
| E-360 | `examples.sentences[359]` | `Pilo de cemocuza ka helvisan.` | same (I-12) |
| R-025, T-038 | `recipes[20]`, 1.2:G27 text | `pilo de bumre` | same (I-12) |
| E-178, E-179 | `examples.sentences[177]`, `[178]` | `va-rivora`, `revo-rivora` | licensed only if `rivora` (accompany) is a motion verb (I-06) |
| E-182, E-183 | `examples.sentences[181]`, `[182]` | `va-nulunia`, `revo-nulunia` | licensed only if `nulunia` (travel along a path) is a motion verb (I-06) |
| R-068, G-033 | `recipes[63]`, 2.2:G65 | `ito ke ruli levasan sidu zeldoza trana.` | gap reading per the rule / dummy-subject reading per the example (I-24) |
| G-004, A-144 | 2.3:G73 example; album 07, line 11 | `ata li veluri po sarbisia ko bapi su li doza de farulavrasan amor.` | `su` "on the strength of" (unlicensed) / `su` "about" (forbidden by 1.2:G30) (I-26) |
| G-054, A-140 | 1.2:G29 example; album 07, line 7 | `yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.` | `de` chain, left or right grouping (I-13) |
| A-023 | album 02, line 7 | `taivo ke li rivo de li mare de mavopagoasa ki?` | `de` chain (I-13) |
| A-025 | album 02, line 9 | `li colbiri de maivo de pulmiri po donuda li vera ki?` | `de` chain (I-13) |
| A-046 | album 03, line 14 | `taivo po ke gonbihemlusan ala li suma de maivo de yuge.` | `de` chain (I-13) |
| A-094 | album 05, line 30 | `tuni taivo de kemye po navdinia baba nimu en li dorbi de maivo de lore.` | `de` chain (I-13) |
| A-099 | album 06, line 5 | `Taivo kronoka mambiri, la mavosan, la silisan,` | `mambiri` object / time adverbial (I-17) |
| A-147 | album 07, line 14 | `maivo lenila li yumli de taivo de yomlasan valla.` | `de` chain (I-13) |
| A-152 | album 08, line 3 | `ke tivrosan en li varori de li mare de yomla.` | `de` chain (I-13) |
| A-155 | album 08, line 6 | `taivo lenila li gargonasan melonulu de saivo de somulira ki?` | `de` chain (I-13) |
| A-163 | album 08, line 14 | `oro li pagoasa ceresenoca saivo de silromasu de merasan vani ki?` | `de` chain (I-13) |
| A-172 | album 09, line 7 | `rada lira sudesia baba sambanasan fasbi de saivo de lumisan soloasa.` | `de` chain (I-13) |
| A-203 | album 11, line 6 | `maivo povi lovula taivo de kronovimo de vio ki?` | `de` chain (I-13) |
| A-211 | album 11, line 14 | `maivo futu sabesia li mavopagoasa de taivo de linukova.` | `de` chain (I-13) |
| A-213 | album 11, line 16 | `lesvu taivo de lumiasasan pagoasa ke maivo de pago de somuasa.` | `de` chain (I-13) |
| A-269 | album 05alt, line 27 | `taivo ka li yugemeyiyo de maivo de lore.` | `de` chain (I-13) |

**What passes and should be read with care.** Sentences that pass the template but contradict a stated rule without breaking parsing are listed in the issue log rather than failed: `ka` with a location (5 examples, I-04), `ke` with a noun-phrase predicate (43 strings, 39 of them album lines, I-10), `ko` for a means (`Maivo po helnaha li linu ko li helna.`, I-25), and `Maivo ne sabesia nuna-coda.`, which the JSON marks "avoid" (I-40).


## 7. Issue log

Sorted by severity, then by layer. Issue numbers are stable identifiers (the axioms and the parse companion cite them), so they are not in numeric order here.

### CRITICAL

### I-01 — A ki-word question without `ki` looks like a statement with an embedded question
Category: STRUCTURAL AMBIGUITY
Severity: CRITICAL
Location: A5.3, A5.7, A5.1, A0.8; `rulings[2.2:G60]`, `rulings[2.3:G76]`, `rulings[2.2:G61]`
Evidence: 2.2:G60: "A question with a ki-word may end in ki or not. Embedded wh-questions may also front the ki-word and never end in ki." `examples.sentences[524]`: `Maivo po masuma li talirivo ki-kasa.` "I asked my colleague why." `rulings[2.2:G60].examples[2]`: `Ki-kasa taivo po amora maivo?` (a direct question with no `ki`).
Demonstration: `Maivo po masuma li talirivo ki-kasa.` (a) Statement with an embedded (sluiced) question: "I asked my colleague why." (b) Direct question, ki-word in its answer's place, no final `ki` (allowed by 2.2:G60): "Why did I ask my colleague?" Only the final `.` or `?` tells them apart, and the grammar never says punctuation decides; in song there is no punctuation. Likewise CONSTRUCTED `Taivo sabesia ki-pago maivo pagopa` is "you know where I go" or, with `ki-pago` in place and no `ki`, a question about where.
Why it matters: The question/statement distinction is basic, and the rules that make `ki` optional remove the one marker that told them apart. A singer or a model cannot tell from the words whether a line asks.
Resolution options: (1) Make `ki` obligatory on every direct question again, as 2.1:G46 had it. This disambiguates fully, but the album's ki-less questions become album readings, which contradicts 2.2:G68's "consistent usage is grammar". (2) Allow a ki-less question only when the ki-word is fronted to clause-initial position. Embedded questions follow their verb, so the two never coincide, and most album questions already front. In-situ questions without `ki` would then be disallowed. (3) Keep the rule and declare intonation or punctuation decisive. This adds no words, but writing or singing without `?` stays ambiguous.

### I-02 — Question formation is stated in three incompatible ways in live text
Category: CONTRADICTION
Severity: CRITICAL
Location: A5.2, A5.3, A5.6, A5.7, A0.11; `hard_rules[4]`, `clause.questions`, `recipes[6]`, `rulings[2.2:G60]`, `rulings[2.2:G61]`, `function_words` row `ki-saivo`
Evidence: `hard_rules[4]`: "Questions keep statement order and end with ki." `clause.questions`: "Keep statement order: a question word stands where its answer would stand, and every direct question ends in ki … Embedded questions keep the word in place with no ki. A main clause with a ki-word and no final ki is an exclamation (2.1:G46, 2.1:G47)." `recipes[6]`: "the question word first or in its answer’s place; ki last is optional" (2.2:G60). 2.2:G61: "Any other ki-word clause without ki is a question." 2.1:G46 and 2.1:G47 carry `"status": "SUPERSEDED …: do not follow"`.
Demonstration: `Taivo pagopa ki-pago.` (a) Under `clause.questions` (2.1:G47 wording): a main clause with a ki-word and no final `ki` is an exclamation, a reading with no sense here. (b) Under 2.2:G60/G61: a question, "Where are you going?" `Ki-pago taivo pagopa ki?` (a) Under `hard_rules[4]` ("keep statement order"): ill-formed. (b) Under 2.2:G60: well-formed, and the album's usual order.
Why it matters: `read_me_first[1]` tells a reader to take `hard_rules` and `clause` before `rulings`. A model following that order writes and judges questions by superseded rules, against the rulings that stand.
Resolution options: (1) Rewrite `hard_rules[4]` and `clause.questions` from 2.2:G60/G61/2.3:G76. The prose then agrees, but it must be kept in sync with every future ruling. (2) Have `hard_rules` and `clause` cite ruling ids only, with no restatement. Nothing can drift, but these sections become less useful to a first reader. (3) Add an explicit precedence statement ("rulings override the summaries") to `read_me_first`. This is cheap, but the stale text stays and invites error.

### MAJOR

### I-05 — Canonical examples put motion prefixes on verbs that are not motion verbs
Category: CONTRADICTION
Severity: MAJOR
Location: A1.13; `word_building.motion_prefixes.rule`, `settled_questions[6]`, `rulings[1.2:G35]`, `examples.sentences[173]`, `[175]`, `[176]`, `[179]`
Evidence: `motion_prefixes.rule`: "closed list; only on motion verbs and the listed metaphors; not productive." `settled_questions[6]`: "Should motion prefixes become productive? No." `examples.sentences[173]`: `va-lirala` "go toward while singing"; `[175]` `va-miruma` "go toward while watering"; `[176]` `revo-miruma` "repeat or do watering back"; `[179]` `va-vimova` "go toward while watching". `examples.how_to_use`: "Canon sentences, all correct. Imitate their word order and choice of forms."
Demonstration: `va-lirala`. (a) Ill-formed: `lirala` (sing) is not a motion verb and `va-lirala` is not a curated metaphor. (b) Well-formed, canon by the example list: "go toward while singing". The same examples also give `revo-` a productive "repeat or do back" sense, while the curated `revo-lirala` is a metaphor.
Why it matters: The example list is presented as the model to imitate, so it teaches a productive use the rules forbid.
Resolution options: (1) Remove or archive the example rows, keeping the closed list. (2) Rule that `va-` and `revo-` are productive on any verb with these compositional readings. This revisits `settled_questions[6]` and frees the other three prefixes too, unless they are limited. (3) Keep the rows as historical, marked like `ki-saivo`. The data stays, but it still sits in an "imitate" list.

### I-06 — "Motion verb" is never defined
Category: UNDERSPECIFICATION
Severity: MAJOR
Location: A1.13, A1.20; `word_building.motion_prefixes.rule`, `rulings[2.3:G75]`, `examples.sentences[177]`, `[178]`, `[181]`, `[182]`
Evidence: The rule licenses prefixes "only on motion verbs"; 2.3:G75 had to rule that "pagopa (to go) is a motion verb". The examples include `va-rivora` "go toward while accompanying" and `va-nulunia` "go toward while traveling".
Demonstration: `va-nulunia` (`nulunia` "to travel along a path"). (a) Licensed if `nulunia` counts as a motion verb. (b) Unlicensed if only verbs ruled one (`pagopa`, by 2.3:G75) count. The same holds for `valmiva` (walk), `venreva` (come), `keleka` (climb), `rivora` (accompany).
Why it matters: A closed-list rule whose domain is open cannot be applied; each new motion verb needs a ruling.
Resolution options: (1) List the motion verbs by id, as data. This is exact, but it needs upkeep. (2) Define the class semantically ("verbs whose meaning is change of location of the subject"). It is general, but judging membership needs the gloss. (3) Mark motion verbs in the dictionary with a role flag. This sits with the entry, but it conflicts with the policy of no lexical verb flags (`settled_questions[4]` uses the same reasoning for transitivity).

### I-03 — The 20-slot template has no place for elements the rulings allow at the clause edges
Category: ORDERING CONFLICT
Severity: MAJOR
Location: A2.2, A5.3, A5.5, A5.9, A5.11, A7.1, A7.3, A3.21, A4.18; `clause.explanation`, `clause.template`, `clause.slots[0]`, `hard_rules[2]`
Evidence: `clause.explanation`: "Twenty slots in fixed order." `hard_rules[2]`: "Word order is fixed: SUBJECT, then preverbal operators, then VERB, then OBJECT, then adjuncts." Slot 1 FRAME admits "time words, correlatives of time, zafra, finra, lanto, kenvi". Rulings place other material outside these slots: a fronted ki-word (2.2:G60), `raho` opening a question (2.3:G74), line-initial `ata`/`oro`/`nara` (2.3:G72, 1.2:G25, 2.3:G78), hortative `yava` "where the subject would" (2.3:G78), a closing time word (1.2:G24), a vocative at the end, after `ki` (1.2:G31, `recipes[14]`), a bare duration "after the object" (2.1:G55), a side noun "after a verb as adverbs" (2.2:G67), `ki` before an appended quotation (0.8:G4). The subordinators (`fime`, `kasa`, `si`, …) have no slot either. `self_check[3]` makes "a token that cannot be placed in the slot template" an error.
Demonstration: `Ki-kasa taivo po amora maivo?` (2.2:G60). (a) By the template: `ki-kasa` is not a FRAME word, not a TOPIC (no `hozi`) and not the SUBJECT, so it cannot be placed: an error under `self_check[3]`. (b) By 2.2:G60: a well-formed question.
Why it matters: The template is presented as the complete clause grammar, and every ruling-sanctioned edge element falls outside it. Generation and checking from the template alone reject canon sentences.
Resolution options: (1) Add explicit edge slots (LINKER, FRONTED-WH, VOCATIVE, CLOSING-TIME, DURATION) to the template. This makes it complete again, but it grows. (2) Declare the template to cover only the core clause and list the edge positions separately, with their order. The core stays simple and the edges are rules of their own. (3) Fold fronted ki-words and `raho` questions into FRAME by redefining it as "clause-initial adverbial or question word". This is smaller, but FRAME's comma conventions then need restating.

### I-04 — `ka` is used for location although `ke` is "location now"
Category: CONTRADICTION
Severity: MAJOR
Location: A2.6, A6.5; `clause.copulas`, `function_words` rows `ke`, `ka`, `rulings[1.2:G27].examples[1]`, `examples.sentences[328]`, `[352]`, `[353]`, `[364]`
Evidence: `clause.copulas`: "ke = is (temporary state or location now); ka = is (permanent quality or identity)." `function_words` row `ke`: "copula for state or location now"; `ka`: "copula for stable quality". With `ka`: `Li bitiri de pilo ka su li tabu.` "Father's tools are on the table." (1.2:G27; `examples.sentences[352]`); `Li kronocuza de li bumrepago ka su li tabu.`; `Li marnapusa ka en li kova.`; `Li kavbikova ka su li tabu.` With `ke`: `Li veluri ke en li vamri.`, `Li rupu ke en li rupupago.` and two more examples, plus three album lines.
Demonstration: `Li kavbikova ka su li tabu.` (a) By `clause.copulas`: ill-formed or marked, since location takes `ke` and `ka` is a permanent quality or identity. Read with `ka`'s sense, "the basket is permanently / by nature on the table". (b) By the English given: an ordinary present location, "The basket is on the table."
Why it matters: Locations are among the commonest predicates, and the stated rule and a ruling's own example disagree.
Resolution options: (1) Keep the rule and correct the five examples to `ke`. The data becomes consistent, but a ruling example (1.2:G27) is edited. (2) Restate `ke`/`ka` as an aspectual contrast (temporary vs lasting) that applies to locations too, so `ka` + location means a lasting place. This keeps the examples, but their English glosses would need the "lasting" sense. (3) Make location neutral (either copula), with `ke` preferred. This is permissive, but the copula carries less information.

### I-09 — Verbless and subjectless clauses contradict "only SUBJECT and VERB are required"
Category: CONTRADICTION
Severity: MAJOR
Location: A2.1, A2.4, A2.7, A2.8; `clause.explanation`, `clause.slots[2].notes`, `clause.copulas`, `self_check[6]`, `function_words` row `miyo`
Evidence: `clause.explanation`: "Only SUBJECT and VERB are required (a command has no subject)." `clause.copulas`: "A predicate adjective may also stand bare: lira benasan." `self_check[6]`: error "a second noun phrase but the clause has no verb or copula". `clause.slots[2].notes`: subject "obligatory except in commands, hortatives and permitted ellipsis". `miyo`: "miyo + noun phrase (+ location)", with no subject (`Miyo baba sora en li nimu.`).
Demonstration: `Nela vanisan.` "The person is beautiful." (`examples.sentences[184]`). (a) By `clause.explanation`: not a clause (no VERB). (b) By `clause.copulas`: a clause with a bare predicate. CONSTRUCTED `Li nela po vanisan.`: whether a bare predicate takes tense, and whether it reads as `ke` or `ka`, is undefined. `Miyo baba sora en li nimu.`: a clause with no subject outside the three listed exceptions.
Why it matters: The minimal-clause definition is wrong for two common types, and the bare predicate's tense and copula meaning are unspecified.
Resolution options: (1) Redefine the minimal clause as SUBJECT + PREDICATE (verb, copula + complement, or bare adjective) and add existentials to the subjectless list. This is accurate, but the bare predicate's operators still need a rule. (2) Treat the bare predicate as an elided `ke`/`ka`, with the operators that copula takes. This gives a clear tense rule, but which copula is elided must be chosen. (3) Restrict bare predicates to verse or to the present with no operators. This is simple, but it limits a construction already in the examples.

### I-10 — `ke` with a noun-phrase predicate (identity) is unaccounted for
Category: UNDERSPECIFICATION
Severity: MAJOR
Location: A2.6, A6.5; `clause.copulas`, `rulings[1.2:G25].examples[1]`, `rulings[2.2:G66].examples[0]`, `examples.sentences[284]`, album (39 lines)
Evidence: `clause.copulas` assigns identity to `ka`; `ke` is "temporary state or location now". Live examples: `oro maivo ke li suma ki?` "Or am I the one…?" (1.2:G25); `kroti maivo lesvu taivo ke li sevusan ruhe.` "Before I let you be the ocean storm." (2.2:G66); `Velina senosia eli-coda rada merno, sige maivo po ke linuti.` "…since I was a child." (`examples.sentences[284]`); album `maivo po ke baba lirasan lavra …`, `taivo ke li rivo de li mare de mavopagoasa ki?`.
Demonstration: `Maivo po ke linuti.` (a) A temporary identity, "I was (for a time) a little child", if `ke` + NP is a temporary identity. (b) Ill-formed, since `ke` covers only states and locations and identity is `ka`. (c) The state "childlike", which would be the adjective `linusan`.
Why it matters: Identity statements with nouns are frequent in the songs, and the rule does not cover the dominant usage.
Resolution options: (1) Extend `ke` to "temporary identity or role" explicitly. This matches the usage, but the `ke`/`ka` contrast on nouns becomes aspectual. (2) Require `ka` for every NP predicate and treat the `ke` lines as album readings. This is clean, but it overrides consistent album usage (2.2:G68). (3) Let either copula take an NP, with the stated temporal contrast. This is flexible and needs one sentence of rule.

### I-20 — A subjectless clause is either a command or an elliptical statement
Category: STRUCTURAL AMBIGUITY
Severity: MAJOR
Location: A2.4, A5.8, A8.2, A5.12; `rulings[1.2:G31]`, `rulings[2.1:G56]`, `rulings[0.8:G3]`, `clause.slots[2].notes`
Evidence: 1.2:G31: "A command has no subject: the clause opens at the verb". 0.8:G3: "Everyday speech may omit a repeated subject in coordinated clauses and in answers … answer with tense + verb (Po sapusia.)". 2.1:G56: "ne + command, no subject".
Demonstration: CONSTRUCTED `Ne lirala.` (a) Prohibition: "Don't sing!" (2.1:G56). (b) Elliptical answer, present tense being unmarked: "(I) don't sing." (0.8:G3). CONSTRUCTED `Taivo lirala ki? — Lirala.` (a) "Sing!" (b) "(I) sing." Only a past or future answer (`Po sapusia.`) is unambiguous, because commands carry no tense, and even that is only implied (I-42).
Why it matters: Commands and short answers are both everyday speech, and nothing in the words separates them in the present.
Resolution options: (1) Require `fisa` or `!` on commands. This marks them, but `fisa` is a softener, not a mood marker. (2) Require answers to keep their subject or tense, or `zabo`/`kepi`. Commands stay bare, but ellipsis is lost. (3) Accept context-dependence and say so. This is honest and cheap, but the ambiguity remains.

### I-23 — The clause's closing order is stated twice and incompletely
Category: ORDERING CONFLICT
Severity: MAJOR
Location: A3.15, A3.17, A3.18, A3.19, A3.21, A4.18, A4.19, A5.11; `rulings[2.3:G78]`, `clause.template`, `clause.slots[11].notes`, `clause.slots[19]`, `rulings[2.1:G55]`, `recipes[14]`
Evidence: 2.3:G78: "A clause closes in this order: a closing time word, an attitude word, ki." Template: `… [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]`. Slot 12: "reve and loki may instead close the clause". 2.1:G55: "Bare measure after the object = duration". Slot 20: `ki` "last word of its clause"; `recipes[14]`: `Taivo viki pagopa ligo maivo ki, maivo de amor?`
Demonstration: CONSTRUCTED from listed words: `Maivori lirala toda-krono fuyi hoyo poye ki?` vs `Maivori lirala fuyi hoyo toda-krono poye ki?` The template forbids nothing after STATUS but ATTITUDE and `ki`, which favours the first if the time word is an adjunct. 2.3:G78 puts the closing time word directly before the attitude word, which favours the second. Where `loki` (clause-final) and a duration `dossa deya` go relative to `fuyi` is undefined.
Why it matters: Clause endings are where songs put their weight, and the stated orders do not compose.
Resolution options: (1) Extend the template with an explicit CLOSING-TIME slot (and duration and `reve`/`loki`) at a fixed point. This is complete, but it needs a decision on that point. (2) Declare all clause-final non-operator elements to be ADJUNCTS in free order, keeping only fuyi < STATUS < ATTITUDE < ki fixed. This is flexible, but G78's order must then be relaxed. (3) State that vocatives stand outside the clause and so do not breach "ki last". This fixes one case only.

### I-27 — FRAME: "one word per slot" vs phrases, and what counts as a "time word"
Category: TERMINOLOGY DRIFT
Severity: MAJOR
Location: A3.2, A3.4, A3.5, A4.18, A0.8; `clause.explanation`, `clause.slots[0]`, `rulings[2.3:G78]`, `rulings[1.2:G24]`, `small_words.time_words`
Evidence: `clause.explanation`: "One word per slot." 2.3:G78: "A frame may hold more than one time phrase, the wider first." Frames in examples: `Da ola-krono, maivori lirala fuyi.` (2.3:G79), `Nullo de deyaapo, maivo po ne somusia.` (1.2:G27). 1.2:G24: "A time word or time correlative … may open its clause or close it." `small_words.time_words` lists among "time words" `po`, `futu`, `pressa`, `kroti`, `krotiapo`, `reve`, `loki`, `bodu`, `eli-pago` ("Here"), `ola-pago` ("There"), and lists `eli-krono`, `toda-krono`, `nuna-krono` twice.
Demonstration: CONSTRUCTED `Maivo lirala po.` (a) By 1.2:G24 with `po` a listed time word: a closing time word, "I sing, (in the) past". (b) By `self_check[16]`: an error, a tense after the verb. CONSTRUCTED `Eli-pago, maivo lirala.` is licensed only because a place word sits in the time-word table.
Why it matters: FRAME membership and the closing-time-word rule both point at a table that mixes operators, places and times.
Resolution options: (1) Split `time_words` into time nouns, time adverbials and tense or operator words, and let 1.2:G24 name only the adverbials. This is precise, but the table must be restructured. (2) Restate FRAME as phrase-sized ("one adverbial phrase, or several time phrases wider first"). This matches 2.3:G78, but "one word per slot" must be qualified for every slot. (3) Leave the table and add exclusions ("tense words and iteration words are not frame words"). This is minimal, but it is patchy.

### I-12 — When `pilo` and `mare` are "used as names" is undefined, and `de` flips with it
Category: STRUCTURAL AMBIGUITY
Severity: MAJOR
Location: A4.8, A0.7; `rulings[1.2:G27]`, `rulings[1.2:G32]`, `recipes[20]`
Evidence: 1.2:G27: "a pronoun or a personal name (pilo, father, used as a name included) standing before de is the owner … pilo de bumre, father's bread." 1.2:G32: "a personal name (pilo, mare used as names included)". Default: "In X de Y the owner is Y".
Demonstration: `pilo de bumre` (`recipes[20]`). (a) `pilo` as a name: "father's bread". (b) `pilo` as the common noun "a father", default rule: "the father of the bread". CONSTRUCTED `pilo de linu`: (a) "father's child" (b) "the child's father". No capitalisation, article or other cue is given; the examples write `pilo` lowercase in both roles.
Why it matters: Kinship possession is common in lyrics, and the owner reverses depending on an unmarked property.
Resolution options: (1) Make "used as a name" mean capitalised (`Pilo de bumre`). This is visible in writing but not in song. (2) Make it mean "without an article": `pilo` bare is the name, `li pilo` the noun. This is audible and cheap, and it interacts with article omission (0.8:R5). (3) Drop the name exception for kin nouns and use `de` order only. This is regular, but "father's bread" becomes `li bumre de pilo`.

### I-13 — Chains of `de`
Category: STRUCTURAL AMBIGUITY
Severity: MAJOR
Location: A4.8, A4.23; `open_questions_do_not_resolve[0]`, `rulings[1.2:G29].examples[0]`, 15 album lines (§6)
Evidence: Open question: "Chains of de: how X de Y de Z resolves when owners of different ranks mix." Example: `yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.` (1.2:G29).
Demonstration: Album `taivo po ke gonbihemlusan ala li suma de maivo de yuge.` (a) `li suma de [maivo de yuge]`: "the warmth of my body". (b) `[li suma de maivo] de yuge`: "my warmth, of the body" (`maivo` as owner of `suma` by 1.2:G27's "a pronoun is the owner wherever it stands", then `de yuge` attached to the whole). 1.2:G32's precedence ranks owners in a pair, not in a chain.
Why it matters: Possession chains are frequent in the album (15 lines) and in a ruling example, and the JSON explicitly leaves them open.
Resolution options: (1) Right-branching default: `X de (Y de Z)`, with pronouns owning only their immediate neighbour. This is predictable and matches most glosses. (2) Left-branching: `(X de Y) de Z`. Also predictable, but it fits fewer album glosses. (3) Forbid chains of three in new text and resolve the album lines one by one as readings. This is safe, but it is restrictive for verse.

### I-17 — Time nouns and bare measures after a verb: object or adverbial
Category: HOMOPHONY COLLISION
Severity: MAJOR
Location: A4.18, A4.19, A0.5, A0.6; `small_words.time_words`, `rulings[1.2:G24]`, `rulings[2.1:G55]`, dictionary entries `nullo`, `merno`, `vesno`, `mambi`, `lornu`
Evidence: `nullo`, `merno`, `vesno`, `mambi`, `lornu` are both dictionary nouns (night, morning, evening, moment, hour) and `time_words`. 1.2:G24: a time word "may open its clause or close it". 2.1:G55: "Bare measure after the object = duration". Transitivity is usage-based (`settled_questions[4]`).
Demonstration: CONSTRUCTED `Maivo vimova merno.` (a) Object: "I see the morning." (b) Closing time word: "I see in the morning." CONSTRUCTED `Maivo vimova dossa deya.` (a) Object: "I see two days." (b) Duration, the verb used intransitively: "I look for two days." Album `Taivo kronoka mambiri, la mavosan, la silisan,` (track 06): `mambiri` is object ("you count the moments") or time.
Why it matters: Time expressions are everywhere in songs, and with no case and usage-based transitivity, position cannot decide.
Resolution options: (1) Require an adverbial time noun to be preceded by a preposition or `en` ("in the morning" = `en merno`). This is unambiguous, but some brevity is lost. (2) Restrict bare closing time words to correlatives (`-krono` words) and compounds like `mernopressa`. This is precise, and simple nouns become objects. (3) Require a comma before a closing time word. This is visible, but singing has no comma.

### I-25 — Manner, means, medium and spirit overlap across `en`, `yuta`, `ko`, `la`
Category: REDUNDANCY
Severity: MAJOR
Location: A4.16, A4.17, A4.14; `rulings[1.2:G33]`, `rulings[2.3:G73]`, `examples.sentences[470]`
Evidence: 1.2:G33: "yuta + noun phrase names the instrument or means … It never means accompaniment: 'with a friend' stays ko." Its example: `Li lirayo po yugemeyiya saivo yuta melo.` "The singer healed him with music." 2.3:G73: "en + an abstract noun names the manner or medium … ko + a feeling names the spirit … yuta stays the tool or means; with an abstract noun, choose by meaning." `examples.sentences[470]`: `Maivo po helnaha li linu ko li helna.` "I treated the child with the medicine." Also `en`/`intra` ("in"/"within") and `transa`/`taro-` ("across") are listed with no stated difference.
Demonstration: CONSTRUCTED `Maivo lirala en melo.` / `Maivo lirala yuta melo.` / `Maivo lirala ko melo.` / `Maivo lirala la melosan.` With an abstract noun, all four are licensed: manner or medium (2.3:G73), means (1.2:G33's own `yuta melo`), the spirit of the act (if music counts as a "feeling", which is undefined), and adverb. No contrast is stated except "choose by meaning". `ko li helna` uses the accompaniment word for a substance used as a means, against 1.2:G33.
Why it matters: Manner phrases are a lyric staple, and four devices with overlapping, undefined domains invite inconsistency.
Resolution options: (1) Define each by test: `yuta` = an object handled or consumed, `en` = a medium or state one is in, `ko` = companion or accompanying emotion, `la` = quality of the action. This is clear and needs one ruling. (2) Merge manner into `en` and `la` only, and limit `ko` to companions. This is simple, but it overrides 2.3:G73's `ko amor`. (3) Leave the choice free and say all are synonyms with abstract nouns. Honest, but redundant.

### I-28 — The noun-phrase template is incomplete
Category: GAP
Severity: MAJOR
Location: A4.1, A4.2, A4.4, A4.5, A4.8, A4.22; `clause.noun_phrase`, `rulings[0.8:G7]`, `rulings[1.2:G29]`, `function_words` rows `baba`, `eliri`, `olari`, `ki-eli`, `ki-muya`, `ruli`, `kasi`, `menu`, `mosa`, `lusu`, `gase`, `diba`, `tonsi`, `sela`, `de`, `small_words.numbers.rules` (row J)
Evidence: `clause.noun_phrase`: "[QUANTIFIER] [li|eli|ola|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]". 1.2:G29 lists determiners "li, eli, ola, baba". Ordinals stand "before the noun" (`numbers.rules` J). The `de` row says "owner + de + possessed noun"; 1.2:G27's default is the opposite (`X de Y`, Y owns), and only pronouns and names stand before `de` as owner.
Demonstration: CONSTRUCTED `baba ruli vanisan una-ne lira`: no slot for `baba`, for `ruli`, or for the ordinal relative to the adjective; the template cannot say whether `una-ne` precedes or follows `ruli vanisan`. CONSTRUCTED `li bumre de li cilni` fits the template's `[OWNER de]` with `li bumre` as owner, the opposite of 1.2:G27.
Why it matters: The template is the noun-phrase grammar the JSON points to (`how_to_translate.steps[3]`), and it misses the indefinite article, plural demonstratives, interrogative determiners, degree words, ordinals and adjective order.
Resolution options: (1) Rewrite the template to include every determiner and modifier, with the adjective-order rule. This is complete, but adjective order needs a decision. (2) Keep the template and add a list of "also in this slot" words. This is quicker, but order questions remain. (3) Split into determiner, modifier and head sub-templates with their own orders. Clearer, but larger.

### I-21 — The valency-operator pattern is stated three ways
Category: CONTRADICTION
Severity: MAJOR
Location: A6.3; `rulings[1.0:G14]`, `clause.valency_operators.pattern`, `function_words` row `vaku`, `recipes[68]`
Evidence: 1.0:G14: "the actor follows, then the actor's own [ne] [phase] [effort] verb." `clause.valency_operators.pattern`: "CAUSER [TENSE…] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]". `vaku` row: "CAUSER + vaku + ACTOR/PATIENT + intransitive VERB". `recipes[68]` (`Taivo vaku maivo lirala.`) has `"status": "awaiting author review"`.
Demonstration: CONSTRUCTED `Maivo vaku saivo sapusia li nami.` (a) Licensed by the pattern's `[OBJECT]`: "I make him eat the food." (b) Excluded by the `vaku` row ("intransitive VERB"). CONSTRUCTED `Maivo po lesvu saivo fututi pagopa.` (a) Licensed by the pattern's `[APPROACH]`. (b) Not licensed by 1.0:G14's list.
Why it matters: The only causative construction has no agreed shape, and its recipe is marked unreviewed.
Resolution options: (1) Adopt the `clause` pattern (APPROACH and OBJECT allowed) and correct the `vaku` row. This is the most permissive, and the actor's `[MODAL]` stays excluded. (2) Adopt 1.0:G14 strictly and remove APPROACH and OBJECT. This is the most conservative and drops "make someone eat X". (3) Allow OBJECT for `lesvu`/`tekvu` but keep `vaku` intransitive. This matches the row but is irregular.

### I-22 — Which verbs passivise is defined circularly; labile verbs are not covered
Category: CONTRADICTION
Severity: MAJOR
Location: A6.4, A2.5; `settled_questions[4]`, `function_words` row `gome`, `self_check[26]`, `examples.sentences[572]`
Evidence: `settled_questions[4]`: "gome may passivise any verb that is used with an object in the clause; a verb used without an object cannot take gome. No lexical flag is needed." `gome` row: "PATIENT + [TENSE] + gome + TRANSITIVE VERB + [gagu AGENT]". `examples.sentences[572]`: `Li yalmu de li divmabiti po momvima.` "The machine's energy was lost." (`momvima` "to lose", no `gome`).
Demonstration: `Li lira gome sarbisia gagu maivo.` (a) Read literally, "used with an object in the clause" fails: in a passive clause the verb has no object, so the rule forbids every passive. (b) Read as "a verb that can take an object elsewhere", the passive is fine, but that is the lexical transitivity the settled question rejects. `Li yalmu … po momvima.` (a) Active with an omitted object: "the energy lost (something)". (b) Anticausative: "the energy was lost", a reading no rule licenses.
Why it matters: Passives and anticausatives are common in narrative, and the licensing condition cannot be applied as written.
Resolution options: (1) Reword: "gome may passivise any verb that is attested with an object". This makes transitivity corpus-based, but it needs a corpus check. (2) Allow `gome` on any verb whose meaning has an affected participant. It is semantic and general, and judging that needs the gloss. (3) Also rule on anticausatives: a patient subject with no `gome` reads as anticausative only for listed change-of-state verbs, which would need a list.

### I-07 — Headless `raho` used as the complementizer "that"
Category: CONTRADICTION
Severity: MAJOR
Location: A7.9, A7.10; `function_words` rows `raho`, `fime`, `rulings[2.2:G64]`, `examples.sentences[210]`, `album.tracks[01].lines[9]` (AR-01)
Evidence: `fime`: "complementizer: that … introduces a finite content clause; distinct from relative marker". 2.2:G64: "raho with no noun before it means 'the one who, that which'". `examples.sentences[210]`: `Maivo po vimova raho taivo pagopa.` "I saw that you went."
Demonstration: `Maivo po vimova raho taivo pagopa.` (a) Headless relative: "I saw what you went". `pagopa` is intransitive here and the clause has no gap, so this reading fails. (b) Complement clause: "I saw that you went". This is the gloss, but no rule licenses `raho` as complementizer. The album's `fime raho` line (AR-01) is an album reading for a related confusion.
Why it matters: It blurs the one contrast the JSON draws sharply (`fime` vs `raho`), in a sentence offered as canon to imitate.
Resolution options: (1) Correct the example to `fime`. The rule stands and the example list is cleaned. (2) Rule that a headless `raho` clause with no gap after a perception verb is a complement ("saw that"). This creates a perception-complement construction but blurs `fime`/`raho`. (3) Mark the example as an album-style reading. The data is kept, but it is still in the imitate list.

### I-08 — The comma that closes a `raho` clause is required, and the canonical examples omit it
Category: CONTRADICTION
Severity: MAJOR
Location: A7.9, A0.8; `rulings[1.0:G21]`, `clause.linking`, `examples.sentences[14]`, `[24]`, `recipes[55]`, album AR-03
Evidence: 1.0:G21: "A raho-clause that does not end the sentence is closed by a comma in writing and a pause in speech … (Found in stress-testing: without the pause the main verb is read inside the relative clause.)" `examples.sentences[14]` and `recipes[55]`: `Li nela raho lirala ka benasan.`; `examples.sentences[24]`: `Li noru raho maivo po norunia ka vanisan.` The album line with the same omission is an album reading (AR-03).
Demonstration: 1.0:G21's own sentence without its comma: `Li sabeyo raho vismava eli ne yehu vimova li vordu.` (a) `[Li sabeyo raho vismava eli], ne yehu vimova li vordu`: "The sage who studies this did not witness the word." (b) The main verb taken into the relative clause, as G21 warns, which leaves the sentence without a main verb. The recipe teaches the comma-less form.
Why it matters: The ruling exists to prevent a misparse, and the recipe and the examples model the misparse-prone form.
Resolution options: (1) Add the comma to the three examples. This is consistent with G21. (2) Relax G21 to "when the relative clause contains its own object or adjunct". That keeps the short examples but makes the rule conditional. (3) Treat the examples as album-style readings. The data is kept, but it is still in the imitate list.

### I-18 — `fime` + `nosi` after a verb that takes a `fime` complement
Category: STRUCTURAL AMBIGUITY
Severity: MAJOR
Location: A7.6, A7.10; `rulings[2.2:G63]`, `function_words` row `fime`, `rulings[1.0:G3]`
Evidence: 2.2:G63: "After a main clause, a fime clause whose verb carries nosi means 'in the hope that, so that perhaps'." `fime`: "introduces a finite content clause". `nosi` is the ordinary epistemic modal "might" (1.0:G3).
Demonstration: CONSTRUCTED `Maivo sabesia fime taivo nosi lirala.` (a) Complement: "I know that you might sing." (b) Hopeful purpose (2.2:G63): "I know [it], so that perhaps you may sing." 2.2:G63's own example follows `donuda` (give), which takes no `fime` complement, so the ruling never meets the conflict.
Why it matters: Verbs of knowing, saying and wanting take `fime` complements constantly, and `nosi` is an ordinary modal inside them.
Resolution options: (1) Limit 2.2:G63 to main verbs that do not take a `fime` complement. This is unambiguous, but it needs the class of complement-taking verbs. (2) Require a comma before the purpose `fime`. This is visible, but there is no comma in song. (3) Use `kopisa … nosi` for the hopeful purpose instead, so 2.2:G63 is no longer needed.

### I-19 — Clause-initial `tonsi` before an adjective-initial noun phrase
Category: STRUCTURAL AMBIGUITY
Severity: MAJOR
Location: A4.13, A7.6, A4.2; `rulings[2.2:G62]`, `function_words` row `tonsi`, `rulings[0.8:R5]`
Evidence: 2.2:G62: "tonsi directly before an adjective means 'so' … Clause-initial tonsi keeps its meaning 'therefore'." Adjectives precede nouns (`hard_rules[2]`); `li` may be omitted (0.8:R5). The examples write `tonsi, li cemopago …` with a comma and `tonsi maivo po lemula ito` without one.
Demonstration: CONSTRUCTED `Tonsi corvisan nela lirala.` (`li` omitted). (a) "Therefore a/the brave person sings." (b) "So brave a person sings." Both readings satisfy 2.2:G62 as written.
Why it matters: Narrative verse uses "therefore" freely, and article omission is common in verse.
Resolution options: (1) Require a comma after clause-initial "therefore" `tonsi`. This makes writing unambiguous, but speech still depends on the pause. (2) Forbid article omission after clause-initial `tonsi`. This is narrow and works. (3) Allow "so + adjective" `tonsi` only in predicate position (after a copula), as both G62 examples have it. This is clean and loses attributive "so brave a …".

### I-32 — Tense inheritance is partly undefined
Category: UNDERSPECIFICATION
Severity: MAJOR
Location: A7.8, A7.15, A3.4, A3.6, A3.14, A7.4, A7.5, A7.14; `rulings[0.8:R6]`, `rulings[2.1:G50]`, `rulings[2.2:G66]`, `open_questions_do_not_resolve[5]`, `rulings[1.2:G31]`
Evidence: 0.8:R6: "sige clauses never inherit tense … Tense inheritance applies to fime, raho, kube, nayo, kasa, kopisa and tuni." Open question: "Tense inheritance after kureli, sina, si and nevi". Unlisted: `tonsi`, `narli`, `korsi`, `sabri` + clause, `krotiata`, `ki-oro`, coordinated `ata`/`nara` clauses. 1.2:G31: narrative present "once the time has been set" (undefined).
Demonstration: CONSTRUCTED `Kureli taivo venreva, maivo po lirala.` (a) Inherited: "As soon as you came, I sang." (b) Not inherited: "As soon as you come (present), I sang." CONSTRUCTED `Maivo po masuma ki-oro taivo relnura.` (a) "I asked whether you returned" (inherits). (b) "… whether you return" (present).
Why it matters: Past narrative is the main song mode, and the time of half the subordinate clauses is undetermined.
Resolution options: (1) A default: every subordinate clause inherits unless marked, with `sige` the listed exception. This is simple and covers all linkers. (2) A default of no inheritance except the listed linkers. It is conservative and needs more tense words. (3) Decide per linker, extending R6's list. Precise, but long.

### I-50 — Which clause a final `ki` or attitude word belongs to
Category: SCOPE AMBIGUITY
Severity: MAJOR
Location: A3.19, A3.21, A5.2, A7.12; `clause.slots[19]`, `rulings[1.0:G22]`, `rulings[0.8:G4]`, `rulings[2.3:G83]`
Evidence: Slot 20: `ki` "last word of its clause". 1.0:G22: attitude words are "clause-final only". 0.8:G4: "ki may close the main clause before an appended direct quotation (Taivo desida ki, fime maivo senosia: "...") as well as after it". Embedded yes/no questions use `ki-oro`, not `ki` (2.3:G77).
Demonstration: CONSTRUCTED `Taivo sabesia fime maivo lirala poye.` (a) `poye` closes the `fime` clause: "You know that perhaps I sing." (b) `poye` closes the sentence: "Perhaps you know that I sing." CONSTRUCTED `Taivo sabesia fime maivo lirala ki?` (a) `ki` closes the main clause from the sentence end: "Do you know that I sing?", though it is not the last word of its own clause. (b) `ki` closes the `fime` clause, making an embedded yes/no question with `ki`, which 2.3:G77 forbids. Only quotations have the `ki`-before option (0.8:G4).
Why it matters: Questions and attitudes over complex sentences are frequent, and "last word of its clause" cannot be satisfied by a main-clause `ki` when a subordinate clause follows.
Resolution options: (1) Rule that sentence-final `ki` and attitude words scope over the main clause unless the subordinate clause is fronted. This is simple and clear, and a speaker who wants "perhaps" on the embedded clause must use a modal (`nosi`). (2) Extend 0.8:G4's "ki before the appended clause" to every final subordinate clause. This is explicit and audible. (3) Let them scope over the nearest clause, so main-clause scope needs fronting. This is consistent with "its clause", but it changes the usual question form.

### MINOR

### I-34 — Undeclared one-edit pairs among closed-class words
Category: HOMOPHONY COLLISION
Severity: MINOR
Location: A0.9, §5; `sound.function_word_template`, `sound.declared_one_edit_pairs`
Evidence: The template allows a monosyllable one edit from another "only if they belong to different syntactic positions (declared list)". Thirteen pairs are declared. Undeclared monosyllable pairs at one edit: `li`/`si`, `li`/`ki`, `li`/`la`, `de`/`ne`, `de`/`ke`, `ne`/`ke`, `ke`/`ko`, `ke`/`ki`, `ka`/`da`, `ka`/`ko`, `ka`/`la`, `si`/`ki`, `ko`/`ki`, `da`/`la`. Polysyllables at one edit, though the template asks for two: `kopi`/`kepi`, `kasa`/`kasi`, `ata`/`ala`, `ola`/`ala`, `ola`/`la`, `ala`/`la`, `li`/`eli`, and the pronoun family `maivo`/`taivo`/`saivo` (and plurals), which is deliberate.
Demonstration: `li` and `la` share a position, before an adjective: `Maivo lirala la molusan.` "I sing gently." vs CONSTRUCTED `Maivo lirala li molusan.` "I sing the gentle one" (an adjective as noun after `li`, 1.2:G29). One vowel separates two well-formed sentences with different structures. `ka`/`ko` share the position before a noun phrase in `X ka sambasan ko Y`.
Why it matters: In song, vowel colour is the least stable cue, and the undeclared pairs are not all in different positions.
Resolution options: (1) Declare the pairs that do occupy different positions and audit the rest. This is cheap and documents the risk. (2) Respell the riskiest (`la` vs `li`), which is costly in a mature lexicon. (3) Restate the template as "not retroactive for pre-2.1 function words", which is honest but leaves the risk.

### I-44 — Orphans and leftovers in the closed-class tables
Category: ORPHAN
Severity: MINOR
Location: A1.14, A5.4, A8.7; `small_words.correlatives`, `function_words` rows `ki-saivo`, `ki-nela de`, `lorejuba ala taivo`, `small_words.numbers.rules` (comments on `seta`, `niva`)
Evidence: Correlatives are "built from" `coda`, `modo`, `kasa`, `pago`, `krono`, `nela`; `coda` and `modo` are not words of the file on their own, and `kasa` is the linker "because". `ki-saivo`: "HISTORICAL ONLY". `lorejuba ala taivo` is a phrase in a word list. `numbers.rules` digit 7: "no longer a homograph of the reflexive particle", which is now `sela`; digit 9: "no longer a homograph of 'while'", which is now `nayo`.
Demonstration: `ki-coda` is segmented `ki` + `coda`, and `coda` has no entry, so the parts cannot be glossed separately.
Why it matters: It is cosmetic for use, but it confuses a reader building the grammar from the tables.
Resolution options: (1) Mark correlative bases as bound and give them a gloss. (2) Move historical and phrase rows into a separate "historical / formulae" table. (3) Delete the obsolete comments, or move them to `legacy.archived_text` as the 2.3 review did for other stale text.

### I-15 — NUMBER `de` X is either a fraction or a partitive, and fractions are spelled two ways
Category: STRUCTURAL AMBIGUITY
Severity: MINOR
Location: A1.16, A4.10, A0.3, A0.6; `settled_questions[5]`, `small_words.numbers.rules` (row J), `rulings[2.1:G53]`, `how_to_translate.how_a_reader_parses_one_word[6]`
Evidence: Fractions: "NUMBER de NUMBER (tressa de cuara)". 2.1:G53: "After a number … de means of/among … Fractions are the same construction." The reader: "A fraction, N-de-N." (hyphenated).
Demonstration: CONSTRUCTED `Una de dossa futu relnura.` (a) Partitive: "One of the two will return." (b) Fraction: "One half will return." In writing, `una de dossa` (spaced) is the fraction by the numbers table, while the reader recognises only `una-de-dossa`.
Why it matters: It is an edge case, but the two spellings will drift in texts and tools.
Resolution options: (1) Hyphenate fractions (`tressa-de-cuara`), separating them from the partitive. (2) Keep spaces and require an article or noun for the partitive (`una de li dossa`). (3) Accept the ambiguity and resolve by context.

### I-29 — Which words take `-ri` and `-ti`, and how plural agrees
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A1.4, A1.7, A4.3, A4.11; `word_building.suffix_order`, `rulings[1.2:G28]`, `small_words.numbers.rules` (row I), `function_words` rows `eliri`, `olari`
Evidence: Suffix order: "ROOT + (one form OR one derivation) + -ti + -ri", with no restriction to nouns. 1.2:G28: after a number `-ri` is optional, "Choose by sound and meter". Numbers row I: "Plural -ri recommended above 1". `eliri lirari` "these songs" pluralises both.
Demonstration: CONSTRUCTED `benasanri` (adjective + `-ri`) fits the suffix order, but its meaning is undefined: "good ones"? CONSTRUCTED `eliri lira` / `eli lirari`: whether a plural demonstrative requires a plural noun, or a singular demonstrative excludes one, is not stated.
Why it matters: Minor in practice, but generators will produce these forms.
Resolution options: (1) Restrict `-ti`/`-ri` to nouns, pronouns and demonstratives. (2) Allow `-ri` on adjectives standing as nouns only (after a determiner). (3) Align the numbers table's wording with 1.2:G28, and state demonstrative agreement.

### I-30 — `-ti`: inflection slot or derivation?
Category: TERMINOLOGY DRIFT
Severity: MINOR
Location: A1.4, A1.8, A1.9; `word_building.suffix_order`, `word_building.derivation_defaults`, `rulings[2.0:G41]`, `word_building.lexicalised_derivations`
Evidence: Suffix order puts `-ti` after "one form OR one derivation". 2.0:G41 lists "R+ti = a little or dear R" among the derivations, and `lexicalised_derivations` contains `monruti`, `mirunuluti`, `kezumiruti`, `soloti`, `larbopagoti`, `lavbupagoti`.
Demonstration: CONSTRUCTED `lirayoti` "little singer". (a) Licensed: derivation `-yo`, then the `-ti` slot. (b) Unlicensed if `-ti` is itself "the one derivation", since a word takes only one.
Why it matters: The suffix count decides which stacks are words.
Resolution options: (1) Call `-ti` an inflection-like suffix everywhere and move its lexicalised items to a "lexicalised diminutives" list. (2) Call it a derivation and allow exactly one derivation plus one diminutive. (3) State both: `-ti` is a derivation that may also follow another derivation.

### I-35 — `-pago` derivation and compounds with the root `pago`
Category: SEGMENTATION AMBIGUITY
Severity: MINOR
Location: A1.9, A1.11, A0.6, A0.9; `word_building.suffixes["-pago"]`, `rulings[2.1:G59]`, dictionary `pago`, `kezupago`, `larbopago`, `lazupago`
Evidence: `pago` is a root ("Place"); `R+pago` is "the place of R" (derivation); compounds MODIFIER + `pago` mean the same and are spelled the same. 2.1:G59 had to state "Compound reading of kezupago is canon." The new-root rule warns against suffix-like endings.
Demonstration: `lemupago` "school". (a) Derivation: `lemu` + `-pago`, "place of learning", which takes no seven forms. (b) Compound: `lemu` + `pago`, which as a compound could have listed forms and a verb by its first letter. The choice decides whether `lemupagopa`-type forms exist. A similar shape arises for X + `navu` image compounds vs (X + `-na`) + `-vu`, but the suffix order (no form + derivation) excludes the second.
Why it matters: It decides whether a word takes forms; meaning is unaffected.
Resolution options: (1) Rule that a final `pago` is always the derivation unless listed as a compound. (2) The reverse. (3) Rule that the two are the same word and either analysis gives the same (empty) form set.

### I-36 — Do unattested image compounds have verbs and adjectives?
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A1.12, A1.3, A0.4; `word_building.image_compounds.how_to_use`, `word_building.image_compounds.rule`, `hard_rules[1]`
Evidence: `how_to_use`: "is a valid noun with a predictable meaning … Its verb class follows its first letter, as for every compound." `hard_rules[1]`: "only the forms listed on its dictionary line exist".
Demonstration: CONSTRUCTED `lunosavalila` (the verb by `l`). (a) A word: a verb class is assigned, so a verb exists. (b) Not a word: no listed verb slot exists for an unattested pair.
Why it matters: It decides the size of the verb inventory; rare in practice.
Resolution options: (1) Image compounds are nouns only; delete the verb-class sentence. (2) They have all seven forms with predictable meanings. (3) Only the adjective (`-san`), for ADR-0011's noun-to-adjective rule.

### I-45 — Number gaps and the hyphen wording
Category: GAP
Severity: MINOR
Location: A1.15, A1.19, A0.3; `small_words.numbers.rules` (rows B, J)
Evidence: Row J: "negative and decimal numbers await separate policy". Row B: "hyphen separates spoken components … Keep components joined in writing".
Demonstration: CONSTRUCTED "minus two", "2.5": no rule. Row B's "joined" can be read as hyphenated (as the examples are) or as solid (`dossacenta` is solid, `centa-una` hyphenated).
Why it matters: Rarely needed in songs.
Resolution options: (1) Rule on negatives and decimals. (2) Declare them outside the language's scope. (3) Reword row B to "joined by hyphens, except digit + `zira`/`centa`".

### I-11 — `kapoki` and `po ka`: the same or different?
Category: REDUNDANCY
Severity: MINOR
Location: A2.9, A6.5; `function_words` rows `kapoki`, `po`
Evidence: `kapoki`: "historical copula; po + ka is also regular". `po`: "po ka = was as a trait; kapoki = no longer is."
Demonstration: CONSTRUCTED `Saivo po ka benasan.` vs `saivo kapoki benasan` (`function_words`). (a) Synonyms: "they were good". (b) Different: "they were good by nature (and may still be)" vs "they were good and no longer are".
Why it matters: A tense contrast in the copula system.
Resolution options: (1) State the difference (the `po` row) in the `kapoki` row too. (2) State that they are synonyms. (3) Retire `kapoki`.

### I-38 — Give-type verbs are a class defined in English
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A2.10; `rulings[1.2:G26]`, `self_check[7]`, album AR-07, AR-08, AR-11, AR-12, AR-13
Evidence: 1.2:G26: "A verb of giving (give, lend, send, owe, sell, pay, bring, teach, show)". Five album lines put the recipient as `ala` + PRONOUN + `de` … before the theme and are read as possession.
Demonstration: CONSTRUCTED `Maivo lirala taivo baba lira.` "I sing you a song". (a) Licensed if `lirala` counts as a give-type verb (by meaning: a performance given). (b) Unlicensed: `lirala` is not on the English list, so `taivo baba lira` is two noun phrases after a verb with no linker.
Why it matters: Double-object order is easy to get wrong (five album readings).
Resolution options: (1) List the give-type verbs by id. (2) Allow the bare pronoun recipient after any verb with a recipient-like meaning. (3) Require `ala` everywhere and drop the bare-pronoun variant.

### I-33 — Three wordings of `ne`'s scope
Category: TERMINOLOGY DRIFT
Severity: MINOR
Location: A3.3, A3.8, A3.20; `clause.stacking.scope`, `rulings[1.0:G1]`, `clause.scope_operators.rule`, `rulings[0.8:G2]`
Evidence: `stacking.scope`: "ne negates everything to its right up to the verb". 1.0:G1: "Pre-constituent operators (ne, …) scope over the single constituent that follows them." `scope_operators.rule`: "immediately before the constituent they scope over".
Demonstration: CONSTRUCTED `Maivo ne telvo lirala li lira.` (a) By `stacking.scope`: `ne` negates `telvo lirala` ("I don't try to sing the song"). (b) By 1.0:G1 read strictly: `ne` negates only the single following constituent `telvo`, and `lirala` is outside its scope. The meanings converge here but the formal scopes differ; for `ne` before the subject (`Ne Kipo po bumreba.`, CONSTRUCTED) only 1.0:G1 applies.
Why it matters: Formal parsers need one definition.
Resolution options: (1) Define a preverbal `ne` as scoping to the verb and a non-clausal `ne` as constituent scope. (2) Adopt 1.0:G1's wording everywhere. (3) Adopt `stacking.scope` for every position.

### I-39 — Two forms for "would have"
Category: REDUNDANCY
Severity: MINOR
Location: A3.7, A7.4; `rulings[1.0:G6]`, `rulings[1.0:G16]`
Evidence: 1.0:G6: "'would have' = po viki (in a consequence clause) or po noma viki". 1.0:G16: "noma requires a tense, modal or si-clause context."
Demonstration: CONSTRUCTED `Taivo po viki relsira.` vs `Taivo po noma viki relsira.`: both "you would have answered", with no stated difference outside a consequence clause.
Why it matters: Minor; free variation is fine if declared.
Resolution options: (1) Declare free variation. (2) Restrict `po viki` to consequence clauses explicitly. (3) Require `noma` always.

### I-41 — Attitude, certainty, status: one set of words, several names
Category: TERMINOLOGY DRIFT
Severity: MINOR
Location: A3.18, A3.19, A5.10, A8.3; `function_words` rows `seye`, `mufe`, `poye`, `pifu`; `clause.slots[18]` (ATTITUDE), `clause.slots[17]` (STATUS); `rulings[0.8:R9]`; `small_words.discourse_particles[3]`
Evidence: The function words call `seye`, `mufe`, `poye`, `pifu` "final certainty" (`pifu`: "final certainty: wish / hope"); the template calls the slot ATTITUDE; 0.8:R9 calls them "certainty marker (or zoke)"; `hoyo`/`yasmo` are placed "before certainty"; `zoke` is both a discourse particle and an attitude word.
Demonstration: `Li lumi tivrota taivo pifu.` "May the Light hold you." (a blessing, not a degree of certainty) is classed as "final certainty".
Why it matters: A naming issue only.
Resolution options: (1) Use ATTITUDE everywhere. (2) Split certainty (`seye`, `mufe`, `poye`) from wish (`pifu`) and irony (`zoke`) within one slot. (3) Leave the names and add a glossary line.

### I-14 — Possession between two names, and the `de` row's direction
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A4.8, A0.7; `rulings[1.2:G27]`, `rulings[1.2:G32]`, `function_words` row `de`
Evidence: 1.2:G27: "a pronoun or a personal name … standing before de is the owner". 1.2:G32: "a pronoun, then a personal name …, then the default". The `de` row: "owner + de + possessed noun" (example `taivo de lira`), stated without the default's opposite direction.
Demonstration: CONSTRUCTED `Kipo de Dorin`. (a) By 1.2:G27, a name before `de` owns: "Kipo's Dorin". (b) By 1.2:G32, the names tie in rank and the default applies, Y owns: "Dorin's Kipo".
Why it matters: Names appear in songs; rare otherwise.
Resolution options: (1) Rule that the left name owns (1.2:G27's exception). (2) Rule that a tie goes to the default. (3) Correct the `de` row to state both directions.

### I-16 — `maivo` is both the pronoun "I" and the noun "Self"
Category: HOMOPHONY COLLISION
Severity: MINOR
Location: A4.20, A0.6; `small_words.pronouns[0]`, dictionary `maivo` ("Self, I, Myself, Me, My"), `maivori`, `maivosan`, `maivona`, `maivoasa`
Evidence: `maivo` is pronoun `pn_maivo_0001` and a headword whose forms include `maivosan` "self-focused; selfish", `maivoasa` "the ultimate self", `maivona`. `maivori` is the pronoun plural and also `maivo` + `-ri`. The reader takes the lexical reading first (A0.6). `aurumijuba` and `vanajuba` are likewise both colour words and nouns (2.0:G39). 180 of the 581 example sentences contain `maivo`.
Demonstration: CONSTRUCTED `Maivo ka vanisan.` (a) "I am beautiful." (b) "The Self is beautiful." `maivori`: "we" or "selves". Article omission (0.8:R5) removes the `li` that would mark the noun.
Why it matters: The meanings are close, but the pronoun takes `sela`, `de` precedence (1.2:G32) and person, while the noun does not.
Resolution options: (1) Declare that bare `maivo` is always the pronoun and the noun needs a determiner (`li maivo`). (2) Accept the overlap as deliberate and say so. (3) Respell the noun (costly; its forms are canon).

### I-26 — `su` after a writing verb, in a ruling example
Category: CONTRADICTION
Severity: MINOR
Location: A4.9, A4.16; `rulings[1.2:G30]`, `rulings[2.3:G73].examples[1]`, `self_check[25]`
Evidence: 1.2:G30: "After a verb of saying, give the verb an object rather than su". 2.3:G73 example: `ata li veluri po sarbisia ko bapi su li doza de farulavrasan amor.` "And the stars wrote in surprise on the strength of phoenix-like love."
Demonstration: (a) `su li doza …` as "on (the strength of)", a figurative ground or basis that no rule licenses. (b) `su` as "about", the reading 1.2:G30 forbids after saying or writing verbs. The English gloss is "on the strength of"; no rule gives `su` that sense.
Why it matters: A model example sits on a forbidden path.
Resolution options: (1) Add a ruling for `su` = "on the basis of". (2) Mark the line (an album line) as an album reading. (3) Replace the ruling's example with another album line.

### I-37 — Pronoun gaps
Category: GAP
Severity: MINOR
Location: A4.20; `small_words.pronouns`, `function_words` row `sela`, album AR-06
Evidence: Third person: `saivo` "Singular human / person", `ito` "Singular inanimate". `sela`: "pronoun + sela … myself". AR-06's standard form `… navdinia maivo sela` is the only `sela` in a clause.
Demonstration: CONSTRUCTED `Li lavra lirala; saivo / ito ka vanisan.` "The bird sings; it is beautiful": the pronoun for an animal is undefined. CONSTRUCTED `Maivo sela lirala.`: (a) emphatic "I myself sing"; (b) ill-formed (reflexive needs an antecedent). `maivori`: inclusive or exclusive "we" is not stated (only `yava` is said to include the listener).
Why it matters: Animals are frequent in the songs (birds, wolves); reflexives are rarer.
Resolution options: (1) Rule that animals take `saivo` (or `ito`). (2) Define `sela` as reflexive object only, or as both reflexive and intensifier. (3) Declare `maivori` unmarked for inclusivity.

### I-46 — Where adverbs go
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A4.17; `function_words` row `la`, `clause.slots[15]`
Evidence: `la`: "la + adjective; adverbs do not need an eighth form". Slot 16 ADJUNCTS lists "la + adjective". Nothing says whether `la ADJ` may precede the verb, open the clause, or be modified (`ruli`).
Demonstration: CONSTRUCTED `Maivo la molusan lirala.` (a) Ill-formed: an adjunct before the verb. (b) Allowed as a stylistic variant (no rule forbids it explicitly). CONSTRUCTED `la ruli molusan` vs `ruli la molusan`: no rule.
Why it matters: Minor, and verse wants flexibility.
Resolution options: (1) ADJUNCTS only. (2) Also allow a clause-initial adverb with a comma, like a frame. (3) State `la ruli ADJ` as the modified form.

### I-47 — `gase` + number + noun: "about" or "like"
Category: STRUCTURAL AMBIGUITY
Severity: MINOR
Location: A4.12, A7.13; `rulings[1.0:G9]`, `rulings[0.8:G8]`
Evidence: 1.0:G9: "Before a number or quantity … gase = approximately". 0.8:G8: "gase NP alone = like NP (simile)".
Demonstration: CONSTRUCTED `Maivo tovota gase dossa cono.` (a) "I have about two coins." (b) "I have [something] like two coins." The same holds for `lusu`/`mosa` before a quantifier + adjective noun phrase.
Why it matters: Rare, but both readings are well-formed.
Resolution options: (1) `gase` + a number is always "about". (2) The simile requires an article (`gase li dossa cono`). (3) Leave it to context.

### I-48 — `kroti`: a measure, a noun, a clause
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A4.18, A7.7; `rulings[2.1:G55]`, `rulings[2.3:G79]`, `rulings[2.2:G66]`, `rulings[1.0:G17]`, `function_words` row `kroti`
Evidence: 2.1:G55: "kroti/krotiapo + li + noun = before/after it". 2.3:G79: "kroti + a bare noun is 'before' it (kroti deya)". "A measure is a number or a quantifier with a unit". 2.2:G66: `kroti` + clause = "before …". 1.0:G17: `kroti ola` = previously.
Demonstration: CONSTRUCTED `kroti rada deya`. (a) A measure (quantifier + unit): "each day ago"? (b) "before each day". CONSTRUCTED `kroti li nela lirala`: (a) clause, "before the person sings"; (b) `kroti li nela` + a stray verb (ill-formed). Only (a) parses, but the reader must look ahead.
Why it matters: Minor.
Resolution options: (1) A measure is a number + unit only. (2) List the quantifiers that make measures. (3) Align 2.1:G55 and 2.3:G79 on "li + noun" vs "bare noun".

### I-53 — Side nouns as prepositions meet "a noun never modifies a noun"
Category: STRUCTURAL AMBIGUITY
Severity: MINOR
Location: A4.15, A4.7, A4.2, A1.18; `rulings[2.2:G67]`, `rulings[ADR-0011]`, `rulings[0.8:R5]`, `self_check[8]`
Evidence: 2.2:G67: side nouns "may stand bare before a noun phrase as prepositions". 0.8:R5: `li` may be omitted when obvious. `self_check[8]`: "two bare nouns side by side → adjective, compound or de phrase" (error).
Demonstration: CONSTRUCTED `Li lavra semnesia nazru nimu.` (a) "The bird sits behind [the] home" (2.2:G67 + 0.8:R5). (b) An error under ADR-0011: `nazru nimu` is two bare nouns side by side.
Why it matters: Minor; article omission is common in verse.
Resolution options: (1) Forbid article omission after a side-noun preposition. (2) Exempt side nouns from ADR-0011 explicitly. (3) Accept (a) by precedence of the more specific ruling.

### I-42 — Commands and hortatives: which operators they take
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A5.8, A5.9; `rulings[1.2:G31]`, `rulings[2.1:G56]`, `rulings[2.3:G78]`, `function_words` row `yava`
Evidence: Commands: "no subject … opens at the verb". `yava`: "Sentence-initial particle + plain verb"; 2.3:G78: "Hortative yava stands where the subject would, opening the clause."
Demonstration: CONSTRUCTED `Telvo lirala!` "Try to sing!": (a) licensed (`ne` precedes the verb in prohibitions, so operators may); (b) not licensed ("opens at the verb"). CONSTRUCTED `Eli-krono, yava lirala!`: (a) licensed by 2.3:G78 (the subject position follows FRAME); (b) unlicensed by the `yava` row ("sentence-initial"). Third-person commands ("let him go") have no rule beyond `lesvu`.
Why it matters: Minor.
Resolution options: (1) Commands take the operators of slots 6–13. (2) Commands take `ne` only. (3) Align the `yava` row with 2.3:G78.

### I-49 — A `raho` question vs a headless relative with an echo `ki`
Category: STRUCTURAL AMBIGUITY
Severity: MINOR
Location: A5.5, A7.9, A5.12; `rulings[2.3:G74]`, `rulings[2.2:G64]`, `rulings[0.8:G3]`
Evidence: 2.3:G74: "A direct question may open with raho for 'who' or 'what' and ends in ki". 2.2:G64: headless `raho` = "the one who". 0.8:G3: one may "echo a word with ki".
Demonstration: CONSTRUCTED `Raho lirala ki?` (a) "Who sings?" (2.3:G74). (b) An echoed fragment, "The one who sings?" (headless relative + echo `ki`).
Why it matters: Minor; context usually decides.
Resolution options: (1) Let echo `ki` attach only to a single word or a bare noun phrase, so that `raho` + clause + `ki` is always a question. (2) Keep `ki-nela`/`ki-coda` for new text and treat the `raho` question as album usage only, which narrows 2.3:G74. (3) Accept the ambiguity and leave it to context.

### I-24 — Adjective + `sidu` + verb: the rule and its example disagree
Category: CONTRADICTION
Severity: MINOR
Location: A6.2; `rulings[2.2:G65]`, `recipes[63]`
Evidence: 2.2:G65: "The verb’s object is what the adjective describes." Example: `ito ke ruli levasan sidu zeldoza trana.` "It is very easy to resist change."
Demonstration: (a) By the rule, the object of `zeldoza` is the thing described, which is the subject `ito`, so the object position should be empty: `ito ke ruli levasan sidu zeldoza` "it is very easy to resist". (b) By the example, `trana` (change) is an overt object and `ito` is a dummy "it".
Why it matters: It is unclear whether a "tough" construction (gap) or an extraposition (dummy subject) is meant.
Resolution options: (1) Keep the rule and change the example to `trana ke ruli levasan sidu zeldoza`. (2) Keep the example and restate the rule ("ito + ADJ + sidu VP = it is ADJ to VP"). (3) Allow both, with the dummy `ito` stated.

### I-31 — `Ata?` "So?"
Category: CONTRADICTION
Severity: MINOR
Location: A7.1, A5.2; `rulings[1.0:G13]`, `rulings[2.2:G60]`, `examples.sentences[236]`
Evidence: 1.0:G13: "ata is 'and' only". 2.2:G60: "A yes/no question must end in ki." `examples.sentences[236]`: `Ata?` "So?"
Demonstration: `Ata?` (a) "And?", a fragment question without `ki`. (b) "So?", a discourse particle, which no rule gives `ata`.
Why it matters: Minor.
Resolution options: (1) Gloss it "And?" and allow fragment questions without `ki`. (2) Remove the example. (3) Rule that a lone linker may be a fragment question.

### I-43 — Comparing actions and quantities
Category: GAP
Severity: MINOR
Location: A7.13, A4.12; `recipes[32]`–`recipes[35]`, `rulings[0.8:G8]`
Evidence: Comparison is defined only for adjectives (`kasi ADJ tamo NP`), similes (`gase NP`) and sameness.
Demonstration: CONSTRUCTED "I sing more than you", "more songs than stars": `Maivo lirala kasi tamo taivo`? `kasi lirari tamo veluri`? No rule licenses either.
Why it matters: Lyrics compare actions often ("love you more than…").
Resolution options: (1) `kasi` + adverb (`la` ADJ) or + noun, with `tamo`. (2) `kasi` as a bare adverb in ADJUNCTS. (3) Route through adjectives (`kasi muya lirari tamo …`).

### I-54 — Relative-clause gaps not covered
Category: GAP
Severity: MINOR
Location: A7.9, A7.16; `open_questions_do_not_resolve[4]`, `rulings[2.1:G52]`
Evidence: Relatives with a time or place gap are open ("hold until a second use"); 2.1:G52 covers prepositional objects with a resumptive pronoun; possessor relatives ("whose") have no rule.
Demonstration: CONSTRUCTED "the singer whose song I love": `li lirayo raho maivo amora saivo de lira`? (a resumptive possessor by analogy with 2.1:G52), or not licensed.
Why it matters: Minor.
Resolution options: (1) Extend 2.1:G52's resumptive strategy to possessors and to time and place (`en ito`, `en ola-krono`). (2) Use `ola-krono`, `ola-pago` correlatives for time and place relatives. (3) Keep them open.

### I-40 — The example list is called "all correct" but is not
Category: CONTRADICTION
Severity: MINOR
Location: A3.9, A1.13, A7.9, A7.10; `examples.how_to_use`, `examples.sentences[203]`–`[205]`, `[269]`, `[173]`–`[182]`, `[14]`, `[24]`, `[210]`, `[236]`
Evidence: `examples.how_to_use`: "Canon sentences, all correct. Imitate their word order and choice of forms." The list contains morphological equations (`lira + yo = lirayo`, `lira + vu = liravu`, `lemu + pago = lemupago`), a sentence marked "(= I know something; avoid)" (`Maivo ne sabesia nuna-coda.`), bare words and correlatives, and sentences at odds with stated rules (I-05, I-07, I-08, I-31).
Demonstration: `lira + yo = lirayo` parsed as a sentence: `yo` is "not a word of Liraasa", and `lira … lirayo` is two noun phrases with no verb.
Why it matters: A model told to imitate will imitate the errors.
Resolution options: (1) Split the list into sentences, word-formation illustrations and "avoid" contrasts. (2) Move the non-sentences to `word_building`. (3) Change the description to "illustrations, including contrasts to avoid".

### I-51 — Must a `hozi` topic be resumed?
Category: UNDERSPECIFICATION
Severity: MINOR
Location: A8.1; `function_words` row `hozi`, `clause.slots[1]`
Evidence: Both examples resume the topic: `Li bumre hozi, Kipo po bumreba ito.`; `Kipo hozi, saivo lirala; Dorin hozi, saivo resora.`
Demonstration: CONSTRUCTED `Li bumre hozi, Kipo po bumreba.` (a) Licensed (topic with a gap: "As for the bread, Kipo baked [it]"). (b) Unlicensed (resumption required, as in every example).
Why it matters: Minor.
Resolution options: (1) Require a resumptive pronoun. (2) Make it optional. (3) Require it only for subjects.

### I-52 — Unreviewed recipes and stray citations
Category: TERMINOLOGY DRIFT
Severity: MINOR
Location: A1.18, A6.3, A5.2; `recipes[24]`, `recipes[68]`, `recipes[5]`, `small_words.time_words`, `small_words.correlatives`, `function_words`
Evidence: `recipes[24]` (songbird, ADR-0011) and `recipes[68]` (`vaku`) carry `"status": "awaiting author review"`. `recipes[5]` ("do you …?") cites `1.0:G2`, which is "si and whether". `time_words` lists `eli-krono`, `toda-krono`, `nuna-krono` twice each; `ki-krono` stands in three tables (correlatives, function words, time words).
Demonstration: none needed; data hygiene.
Why it matters: A reader cannot tell which recipes are settled.
Resolution options: (1) Review and clear the two statuses. (2) Correct the citation to 2.2:G60. (3) Deduplicate the time-word table.

### I-55 — Open questions the JSON itself lists
Category: GAP
Severity: MINOR
Location: A5.11, A5.13, A6.1; `open_questions_do_not_resolve[1]`, `[2]`, `[3]`
Evidence: "A vocative particle for verse."; "'To + verb' in general …: the general case remains open."; "`ke sidu` VERB as 'destined to' (album 08): hold until a second use." (De chains, time/place relatives and tense inheritance are logged as I-13, I-54, I-32.)
Demonstration: CONSTRUCTED "I came here to sing" (purpose with the same subject): `sidu` (A6.1) is a chain after a verb of wanting, `kopisa` a purpose clause with a subject; whether `Maivo po venreva eli-pago sidu lirala` is grammatical is the open general case.
Why it matters: Recorded by the author as open; listed here for completeness.
Resolution options: (1) Rule `kopisa` + bare verb for same-subject purpose. (2) Extend `sidu` to purpose. (3) Keep open.


## 8. Coverage checklist

| Question | Answer | Where |
| --- | --- | --- |
| How is a basic statement formed? | PARTIAL | A2.1, A2.2, A5.1; the minimal-clause definition misses verbless and subjectless clauses (I-09) |
| What is the default word order, and is it fixed or flexible? | PARTIAL | A2.2 (SVO, "fixed"), A3.1; rulings allow fronted ki-words, line-initial linkers, closing time words and vocatives with no slot (I-03, I-23) |
| How are subject and object distinguished? | ANSWERED | A2.3 (position; IMPLICIT), A6.3 (actor after a valency operator), A2.10 (bare pronoun recipient) |
| How is a sentence negated? | ANSWERED (scope wording PARTIAL) | A3.8, A3.9, A3.20; I-33 |
| How are yes/no questions formed? | PARTIAL | A5.2; contradictory live statements (I-02); `ki` placement in complex sentences (I-50) |
| How are content questions formed? | PARTIAL | A5.3–A5.5; I-01, I-02, I-03, I-49 |
| How are commands formed? | PARTIAL | A5.8, A5.9; operators in commands (I-42); confusable with ellipsis (I-20) |
| How is past, present and future expressed? | ANSWERED | A3.4, A3.5, A3.6 |
| Is tense obligatory? | ANSWERED (no) / PARTIAL for subordinate clauses | A3.4; inheritance partly open (A7.8, A7.15, I-32) |
| How is plurality marked? | PARTIAL | A1.7, A4.11; which words take `-ri`, agreement of demonstratives, number-table wording (I-29) |
| How is possession marked? | PARTIAL | A4.8, A4.20; `pilo`/`mare` as names (I-12), chains (I-13, A4.23), two names (I-14) |
| How are adjectives attached, and in which order? | PARTIAL | A4.5, A4.6, A1.18; order of several adjectives UNDEFINED (A4.22, I-28) |
| How are adverbs attached? | PARTIAL | A4.17, A4.16; position and modification (I-46); overlapping manner devices (I-25) |
| How is "to be" expressed (identity, attribute, location, existence)? | PARTIAL | A2.6–A2.9, A6.5; location with `ka` (I-04), identity with `ke` (I-10), bare predicate and `miyo` (I-09), `kapoki` (I-11) |
| How are two clauses joined with "and", "but", "or"? | ANSWERED | A7.1, A7.2 (minor: I-31) |
| How are "because", "if", "when", "although" expressed? | ANSWERED (tense PARTIAL) | A7.4, A7.5, A7.6, A7.7; tense inheritance after `si`, `nevi` open (I-32) |
| How are relative clauses formed? | PARTIAL | A7.9; comma rule vs examples (I-08); `raho` as "that" (I-07); time/place and possessor gaps (A7.16, I-54) |
| How are reported speech and "that"-clauses formed? | PARTIAL | A7.10, A7.11, A7.12; ki/attitude scope (I-50); `fime` + `nosi` (I-18) |
| How are comparisons formed? | PARTIAL | A7.13, A4.12; actions and quantities (I-43); `gase` + number (I-47) |
| How are pronouns marked for person, number and case? | PARTIAL | A4.20 (person, number, human/inanimate; no case); animals, inclusive "we", `sela` (I-37); `maivo` homophony (I-16) |
| How are compounds formed and how is their head determined? | ANSWERED | A1.11 (head rightmost), A1.12, A1.3; minor: `-pago` (I-35), image-compound forms (I-36) |
| How are numbers and counting expressed? | ANSWERED (negatives, decimals UNDEFINED) | A1.15, A1.16, A4.11, A4.19; A1.19, I-45, I-15 |
| *Added:* How are verbs formed from roots, and which forms exist? | ANSWERED | A1.1, A1.2, A0.4 |
| *Added:* Is there a passive? | PARTIAL | A6.4; licensing condition circular, anticausatives undefined (I-22) |
| *Added:* How are causatives formed? | PARTIAL | A6.3; three statements of the pattern (I-21) |
| *Added:* How are aspect, modality and evidentiality marked, and in what order? | ANSWERED | A3.1, A3.2, A3.10–A3.16 |
| *Added:* How does a clause end (attitude, status, reciprocal, time, `ki`)? | PARTIAL | A3.17–A3.21; I-23 |
| *Added:* Are motion prefixes productive? | PARTIAL | A1.13 (no); class of motion verbs UNDEFINED (A1.20, I-06); contrary examples (I-05) |
| *Added:* How are wishes and blessings expressed? | ANSWERED | A5.10 |
| *Added:* How are topic and focus marked? | ANSWERED | A8.1, A3.20 (minor: I-51) |
| *Added:* Which edition's grammar reads a text, and what of superseded rulings? | ANSWERED | A0.10, A0.11, A8.6 |
| *Added:* How is the sacred register expressed? | ANSWERED | A1.6, A8.4 |
| *Added:* How is "to + verb" expressed? | PARTIAL | A6.1, A6.2, A7.11; general case open (I-55) |
| *Added:* How are "ago", "since", "until", durations expressed? | PARTIAL | A4.18; I-17, I-48 |


## 9. Dependency map

For each axiom, the axioms that list it under "Depends on" (direct dependants), then the full set reached transitively: a fix to the axiom on the left can ripple to everything on the right.

| Axiom | Direct dependants | All dependants (transitive) |
| --- | --- | --- |
| A0.1 Letters and their sounds | A0.2, A0.3, A0.7, A0.9 | 130 axioms: A0.2, A0.3, A0.4, A0.5, A0.6, A0.7, A0.8, A0.9, A0.10, A0.11, A1.1, A1.2, A1.3, A1.4, A1.5, A1.6, A1.7, A1.8, A1.9, A1.10, A1.11, A1.12, A1.13, A1.14, A1.15, A1.16, A1.17, A1.18, A1.19, A1.20, A2.1, A2.2, A2.3, A2.4, A2.5, A2.6, A2.7, A2.8, A2.9, A2.10, A2.11, A2.12, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.7, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.17, A4.18, A4.19, A4.20, A4.21, A4.22, A4.23, A5.1, A5.2, A5.3, A5.4, A5.5, A5.6, A5.7, A5.8, A5.9, A5.10, A5.11, A5.12, A5.13, A6.1, A6.2, A6.3, A6.4, A6.5, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.13, A7.14, A7.15, A7.16, A8.1, A8.2, A8.3, A8.4, A8.5, A8.6, A8.7 |
| A0.2 Syllables and stress | A0.9, A8.5 | A0.9, A8.5 |
| A0.3 The written word, hyphens included | A0.4, A0.8, A1.14, A1.15 | 127 axioms: A0.4, A0.5, A0.6, A0.7, A0.8, A0.10, A0.11, A1.1, A1.2, A1.3, A1.4, A1.5, A1.6, A1.7, A1.8, A1.9, A1.10, A1.11, A1.12, A1.13, A1.14, A1.15, A1.16, A1.17, A1.18, A1.19, A1.20, A2.1, A2.2, A2.3, A2.4, A2.5, A2.6, A2.7, A2.8, A2.9, A2.10, A2.11, A2.12, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.7, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.17, A4.18, A4.19, A4.20, A4.21, A4.22, A4.23, A5.1, A5.2, A5.3, A5.4, A5.5, A5.6, A5.7, A5.8, A5.9, A5.10, A5.11, A5.12, A5.13, A6.1, A6.2, A6.3, A6.4, A6.5, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.13, A7.14, A7.15, A7.16, A8.1, A8.2, A8.3, A8.4, A8.5, A8.6, A8.7 |
| A0.4 What counts as a word of Liraasa | A0.5, A0.6, A0.10, A1.1, A1.11 | 117 axioms: A0.5, A0.6, A0.7, A0.10, A0.11, A1.1, A1.2, A1.3, A1.4, A1.5, A1.6, A1.7, A1.8, A1.9, A1.10, A1.11, A1.12, A1.13, A1.17, A1.18, A1.20, A2.1, A2.2, A2.3, A2.4, A2.5, A2.6, A2.7, A2.8, A2.9, A2.10, A2.11, A2.12, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.7, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.17, A4.18, A4.20, A4.21, A4.22, A4.23, A5.1, A5.2, A5.3, A5.5, A5.6, A5.7, A5.8, A5.9, A5.10, A5.12, A6.1, A6.2, A6.3, A6.4, A6.5, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.13, A7.14, A7.15, A7.16, A8.1, A8.2, A8.3, A8.4, A8.5, A8.6, A8.7 |
| A0.5 Word classes | A0.6, A1.1, A1.17, A2.1, A4.20, A8.3, A8.7 | 111 axioms: A0.6, A0.7, A1.1, A1.2, A1.3, A1.4, A1.5, A1.6, A1.7, A1.8, A1.9, A1.10, A1.13, A1.17, A1.18, A1.20, A2.1, A2.2, A2.3, A2.4, A2.5, A2.6, A2.7, A2.8, A2.9, A2.10, A2.11, A2.12, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.7, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.17, A4.18, A4.20, A4.21, A4.22, A4.23, A5.1, A5.2, A5.3, A5.5, A5.6, A5.7, A5.8, A5.9, A5.10, A5.12, A6.1, A6.2, A6.3, A6.4, A6.5, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.13, A7.14, A7.15, A7.16, A8.1, A8.2, A8.3, A8.4, A8.5, A8.7 |
| A0.6 How a reader segments one word | A0.7 | A0.7 |
| A0.7 Names | — | — |
| A0.8 Punctuation that carries grammar | A5.11 | A5.11, A5.13 |
| A0.9 Shape templates for new roots and function words | — | — |
| A0.10 Which edition's rules read a text | A0.11, A1.10, A8.6 | A0.11, A1.10, A8.6 |
| A0.11 Superseded rulings | — | — |
| A1.1 The seven forms | A1.2, A1.4, A1.5, A1.6, A1.18, A4.17 | 41 axioms: A1.2, A1.3, A1.4, A1.5, A1.6, A1.7, A1.8, A1.9, A1.10, A1.13, A1.18, A1.20, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.7, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.17, A4.18, A4.21, A4.22, A4.23, A5.5, A7.6, A7.7, A7.9, A7.13, A7.16, A8.4, A8.5 |
| A1.2 The verb ending | A1.3, A1.13 | A1.3, A1.13, A1.20 |
| A1.3 A compound's verb follows its first letter | — | — |
| A1.4 Suffix order | A1.7, A1.8, A1.9, A4.1 | 30 axioms: A1.7, A1.8, A1.9, A1.10, A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.18, A4.21, A4.22, A4.23, A5.5, A7.6, A7.7, A7.9, A7.13, A7.16, A8.5 |
| A1.5 Lexical negation `-na` / `-nasan` | — | — |
| A1.6 Ascended forms and the sacred | A8.4 | A8.4 |
| A1.7 Plural `-ri` | A4.1, A4.11 | 26 axioms: A4.1, A4.2, A4.3, A4.4, A4.5, A4.6, A4.8, A4.9, A4.10, A4.11, A4.12, A4.13, A4.14, A4.15, A4.16, A4.18, A4.21, A4.22, A4.23, A5.5, A7.6, A7.7, A7.9, A7.13, A7.16, A8.5 |
| A1.8 Diminutive `-ti` | — | — |
| A1.9 Productive derivations `-yo`, `-vu`, `-pago` | A1.10 | A1.10 |
| A1.10 A retired listed derivation stays buildable | — | — |
| A1.11 Compounds | A1.3, A1.12, A4.21 | A1.3, A1.12, A4.21 |
| A1.12 Image compounds | — | — |
| A1.13 Motion prefixes | A1.20 | A1.20 |
| A1.14 Correlatives | A3.9, A4.19, A5.4 | A3.9, A4.19, A5.4 |
| A1.15 Cardinal numerals | A1.16, A1.19, A4.11 | A1.16, A1.19, A4.11, A4.12, A4.13, A7.6, A7.13 |
| A1.16 Ordinals and fractions | — | — |
| A1.17 Colour words | — | — |
| A1.18 Adjective from noun for noun + noun meanings | A4.7 | A4.7 |
| A1.19 Negative and decimal numbers | — | — |
| A1.20 The class of motion verbs | — | — |
| A2.1 The minimal sentence | A2.2, A2.4, A2.6, A2.8, A2.11, A2.12 | 68 axioms: A2.2, A2.3, A2.4, A2.5, A2.6, A2.7, A2.8, A2.9, A2.10, A2.11, A2.12, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A5.1, A5.2, A5.3, A5.5, A5.6, A5.7, A5.8, A5.9, A5.10, A5.12, A6.1, A6.2, A6.3, A6.4, A6.5, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.14, A7.15, A7.16, A8.1, A8.2, A8.5 |
| A2.2 Basic word order: S V O, fixed | A2.3, A2.5, A3.1, A5.1, A8.1 | 43 axioms: A2.3, A2.5, A2.10, A3.1, A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A5.1, A5.2, A5.3, A5.5, A5.6, A5.7, A5.10, A5.12, A6.3, A6.4, A6.6, A7.2, A7.4, A7.8, A7.12, A7.15, A8.1, A8.5 |
| A2.3 Subject and object are told apart by position | A2.10 | A2.10 |
| A2.4 When the subject may be absent | A5.8, A8.2 | A5.8, A5.9, A5.12, A8.2 |
| A2.5 Transitivity is usage-based | A6.4 | A6.4 |
| A2.6 Copular clauses with `ke` and `ka` | A2.7, A2.9, A6.5 | A2.7, A2.9, A6.5 |
| A2.7 Bare predicate adjective | A6.5 | A6.5 |
| A2.8 Existence: `miyo` | A6.5 | A6.5 |
| A2.9 Becoming and having been: `loya`, `kapoki` | A6.5 | A6.5 |
| A2.10 Give-type verbs: where the recipient goes | — | — |
| A2.11 One verb per clause | A6.1, A6.3, A7.1, A7.3 | A5.5, A5.7, A6.1, A6.2, A6.3, A6.6, A6.7, A7.1, A7.2, A7.3, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.14, A7.15, A7.16 |
| A2.12 An event as subject of `venreva` | — | — |
| A3.1 The preverbal operator slots | A3.2, A3.3, A3.4, A3.8, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.22, A6.3 | 37 axioms: A3.2, A3.3, A3.4, A3.5, A3.6, A3.7, A3.8, A3.9, A3.10, A3.11, A3.12, A3.13, A3.14, A3.15, A3.16, A3.17, A3.18, A3.19, A3.20, A3.21, A3.22, A5.2, A5.3, A5.5, A5.6, A5.7, A5.10, A5.12, A6.3, A6.6, A7.2, A7.4, A7.8, A7.12, A7.15, A8.1, A8.5 |
| A3.2 One word per slot; excluded pairs | — | — |
| A3.3 Scope by position | A3.8, A3.20 | A3.8, A3.9, A3.20, A7.2, A8.1 |
| A3.4 Tense | A3.5, A3.6, A3.7, A7.8 | A3.5, A3.6, A3.7, A5.10, A7.4, A7.8, A7.15, A8.5 |
| A3.5 Paragraph tense frame | — | — |
| A3.6 Narrative present in verse | A8.5 | A8.5 |
| A3.7 Counterfactual `noma` | A5.10, A7.4 | A5.10, A7.4 |
| A3.8 Negation `ne` | A3.9, A7.2 | A3.9, A7.2 |
| A3.9 `ne` with a `nuna-` word | — | — |
| A3.10 Modals | — | — |
| A3.11 Approach: `tavki`, `fututi` | — | — |
| A3.12 Phase: `hiro`, `teki` | — | — |
| A3.13 Effort: `telvo`, `vazdi`, `fesmo` | — | — |
| A3.14 Aspect: `roni`, `tefa`, `sahi` | — | — |
| A3.15 Iteration: `bodu`, `reve`, `loki` | — | — |
| A3.16 Evidentials | A6.6 | A6.6 |
| A3.17 Reciprocal `fuyi` | A3.21 | A3.21, A5.2, A5.3, A5.5, A5.6, A5.7, A5.12, A7.12 |
| A3.18 Status: `hoyo`, `yasmo` | A3.21 | A3.21, A5.2, A5.3, A5.5, A5.6, A5.7, A5.12, A7.12 |
| A3.19 Attitude words | A3.21, A5.10 | A3.21, A5.2, A5.3, A5.5, A5.6, A5.7, A5.10, A5.12, A7.12 |
| A3.20 Pre-constituent operators | A8.1 | A8.1 |
| A3.21 The clause's closing order | A5.2 | A5.2, A5.3, A5.5, A5.6, A5.7, A5.12, A7.12 |
| A3.22 How many operators to stack | — | — |
| A4.1 Noun-phrase order | A4.2, A4.3, A4.4, A4.5, A4.8, A4.14, A7.9 | A4.2, A4.3, A4.4, A4.5, A4.6, A4.8, A4.9, A4.10, A4.14, A4.15, A4.16, A4.18, A4.21, A4.22, A4.23, A5.5, A7.7, A7.9, A7.16, A8.5 |
| A4.2 Articles and when they may drop | A4.6, A8.5 | A4.6, A8.5 |
| A4.3 Demonstratives | — | — |
| A4.4 Quantifiers and excess | — | — |
| A4.5 Adjectives precede the noun | A4.6, A4.21, A4.22 | A4.6, A4.21, A4.22 |
| A4.6 An adjective standing as a noun | — | — |
| A4.7 A noun does not modify a noun | — | — |
| A4.8 Possession with `de`: which side owns | A4.9, A4.10, A4.23 | A4.9, A4.10, A4.23 |
| A4.9 `de` for "about" | — | — |
| A4.10 Partitive `de` | — | — |
| A4.11 Number and noun | A4.12 | A4.12, A4.13, A7.6, A7.13 |
| A4.12 Quantity limits and degree before a number or an adjective | A4.13, A7.13 | A4.13, A7.6, A7.13 |
| A4.13 `tonsi` before an adjective | A7.6 | A7.6 |
| A4.14 Prepositional phrases | A4.15, A4.16, A4.18 | A4.15, A4.16, A4.18, A7.7 |
| A4.15 Side nouns as prepositions | — | — |
| A4.16 Instrument, manner, accompaniment, benefit | — | — |
| A4.17 Adverbs: `la` + adjective | — | — |
| A4.18 Time phrases | A7.7 | A7.7 |
| A4.19 Frequency and "N times" | — | — |
| A4.20 Pronouns | — | — |
| A4.21 Gender in kinship nouns | — | — |
| A4.22 Order of several adjectives | — | — |
| A4.23 Chains of `de` | — | — |
| A5.1 Statements | A5.2 | A5.2, A5.3, A5.5, A5.6, A5.7, A5.12, A7.12 |
| A5.2 Yes/no questions | A5.3, A5.12, A7.12 | A5.3, A5.5, A5.6, A5.7, A5.12, A7.12 |
| A5.3 Content questions | A5.5, A5.6, A5.7 | A5.5, A5.6, A5.7 |
| A5.4 Question words | — | — |
| A5.5 A question opened by `raho` | — | — |
| A5.6 Exclamations with ki-words | — | — |
| A5.7 Embedded questions | — | — |
| A5.8 Commands and prohibitions | A5.9 | A5.9 |
| A5.9 Hortative `yava` | — | — |
| A5.10 Blessings and wishes | — | — |
| A5.11 Address (vocatives) | A5.13 | A5.13 |
| A5.12 Answers and echoes | — | — |
| A5.13 A vocative particle | — | — |
| A6.1 Same-subject verb chains: `sidu` | A6.2, A6.6, A6.7, A7.11 | A6.2, A6.6, A6.7, A7.11 |
| A6.2 Adjective + `sidu` + verb | — | — |
| A6.3 Valency operators: make, let, prevent | — | — |
| A6.4 Passive: `gome` … `gagu` | — | — |
| A6.5 "To be": identity, attribute, location, existence | — | — |
| A6.6 Fixed periphrases: intent, epistemic necessity, having | — | — |
| A6.7 Nominalisation | — | — |
| A7.1 Coordination: `ata`, `oro`, `nara` | A7.2 | A7.2 |
| A7.2 Paired conjunctions | — | — |
| A7.3 Subordinators | A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.14 | A5.5, A5.7, A6.7, A7.4, A7.5, A7.6, A7.7, A7.8, A7.9, A7.10, A7.11, A7.12, A7.14, A7.15, A7.16 |
| A7.4 Conditionals | — | — |
| A7.5 Concession | — | — |
| A7.6 Cause, purpose, result | — | — |
| A7.7 Time clauses | — | — |
| A7.8 Tense inheritance | A7.15 | A7.15 |
| A7.9 Relative clauses | A5.5, A7.16 | A5.5, A7.16 |
| A7.10 Complement clauses: `fime` | A5.7, A6.7, A7.11, A7.12 | A5.7, A6.7, A7.11, A7.12 |
| A7.11 Different-subject complements | — | — |
| A7.12 Reported speech and quotation | — | — |
| A7.13 Comparison | — | — |
| A7.14 Exception and substitution | — | — |
| A7.15 Tense inheritance after four linkers | — | — |
| A7.16 Relatives on a time or place gap | — | — |
| A8.1 Topic and focus | — | — |
| A8.2 Ellipsis | A5.12 | A5.12 |
| A8.3 Discourse particles | — | — |
| A8.4 Registers | — | — |
| A8.5 Verse licences | — | — |
| A8.6 The album as reference | — | — |
| A8.7 Formulae of politeness | — | — |

## 10. Final self-check

| Check | Result |
| --- | --- |
| Every grammatical element of the inventory is in the registry and in at least one axiom, or logged as an orphan | Pass. The registry has every `function_words` row (149), the 8 pronouns, the 4 discourse particles, the 13 bound morphemes and prefixes the table omits, and the four closed classes. Each row names its axioms. Leftovers are logged in I-44. |
| Every axiom has a status tag and a source path, or is UNDEFINED with an issue | Pass (checked mechanically: 131 axioms, 7 UNDEFINED, each with an issue). |
| Every JSON example appears in the parse test | Pass: 1,471 strings, every source table (§6 and the companion file). The dictionary's inline phrases were not treated as examples. |
| No axiom silently resolves a contradiction | Pass. Where sources disagree the axiom states both and cites the issue (A2.6, A2.7, A2.9, A5.3, A5.6, A5.7, A6.3, A6.4, A7.9). |
| No morpheme or example was invented without a CONSTRUCTED label | Pass. Every probe sentence is marked CONSTRUCTED and built from forms in the JSON. Two forms are built by the stated rules to test them and are named as such: `lunosavalila` (I-36, the verb rule applied to an image compound) and `benasanri` (I-29, the suffix order applied to an adjective). Neither is offered as a word. |
| Every CRITICAL issue appears in the executive summary | Pass (I-01, I-02). |
| Cross-references resolve | Pass: every axiom and issue id cited exists; every issue is cited by at least one axiom. |

**Limits of this audit.** The parse test segments and places words with the editor's checker, an implementation of the template. Its PASS means "one parse under the implemented template plus the hand-applied issues of §7", not a proof that no other parse exists. The human layer covered every ruling and recipe example and every pattern named in the issue log, but the 581 example sentences and 275 album lines were not each re-parsed by hand. Glosses (the English) were read only to decide between parses, never to judge meaning.
