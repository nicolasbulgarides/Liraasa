# Liraasa grammar audit: the editor against the 2.3 spec

The audit was run first with nothing changed; the fixes and rulings approved on 2026-10-19 followed, and every figure below is a rerun on the fixed editor. Each issue carries its status. The spec is `data/lexicon/liraasa_2_3.json` (its `grammar`, `morphology`, `phonology` sections and every ruling of every edition, verbatim in `handoff/Liraasa_2_3_Rulings.md`) and the 2.3 Reference Grammar. "The editor" is the songbook editor in `editor/`: its grammar checker (`editor/checker/`), its Compose tab (English → Liraasa, `editor/index.html`) and its back-translation (Liraasa → English).

Rerun everything after a patch:

```sh
npx tsx tests/audit/run.ts        # Phase 4 rule tests (checker + composer; needs Edge or Chrome)
npx tsx tests/audit/lexicon.ts    # Phase 3 lexicon integrity
npx tsx tests/audit/album.ts      # Phase 6 album regression
npx tsx tests/audit/myth.ts       # Phase 5 myth
PYTHONUTF8=1 python tests/audit/make_rules.py   # Phase 1 inventory (after an edition)
PYTHONUTF8=1 python tests/audit/report.py      # this report
```

## Summary

| | high | medium | low | total |
| --- | --- | --- | --- | --- |
| CODE BUG | 4 | 21 | 8 | 33 |
| SPEC BUG | 0 | 3 | 1 | 4 |
| SPEC GAP | 1 | 4 | 6 | 11 |
| LEXICON ISSUE | 0 | 1 | 3 | 4 |

- **Phase 1.** 121 rules: 85 of clause grammar, the rest morphology, phonology, lexicon and project rules; 14 carry a contradiction or underspecification flag.
- **Phase 2, checker.** ACCEPTS 47, IMPLEMENTED 42, N/A 20, PARTIAL 5, UNTESTED 2, SUPERSEDED 2, DIVERGENT 1, MISSING 1, SPEC GAP 1. IMPLEMENTED: violations are caught under the rule. ACCEPTS: the spec's sentences pass, but no violation was tested or none is checkable without meaning. UNTESTED: a grammar rule with no case (paragraph-level, or reading older texts).
- **Phase 2, composer.** 86 of 89 English sentences composed exactly as the spec writes them (case and spacing ignored, every spec-allowed variant accepted).
- **Phase 3.** 1679 Liraasa texts read word by word: 6 words not readable, all explained (L02, S04, L04). No duplicate roots, no compound with a missing part; 3 shared senses, 16 near-homophone root pairs.
- **Phase 4.** 145 test cases: 145 of 145 spec sentences check clean; 62 of 64 rule-breaking sentences are flagged.
- **Phase 5.** 20 myth sentences: the editor composes 16 exactly as the spec does and leaves English gaps in 3; all 20 spec translations check clean.
- **Phase 6.** 275 album lines: 1 findings on 1 lines, 1 of them on documented album readings.

- **Status.** 29 fixed, 14 decided, 3 withdrawn, 3 fixed in part, 1 not changed, 1 left open, 1 open (of 52 issues).

## Decisions for you, most blocking first

None left: every decision is in the next section. Still open for the author: C15 (ke or ka before a noun phrase), L01 (the corpus labels), the two 'birth' senses (L04) and tense inheritance (G04).

## Decided (2026-10-19)

- **Lock the album's consistent usage into the grammar?** Yes: rulings 2.3:G72–G75 (data/changes/2026-10-19-lexicon-2-3-audit.json); 2.3:G74 supersedes the 'raho is never a question word' clause of 2.2:G64, and album reading AR-16 is resolved.
- **Which subordinators inherit tense?** Undecided: left open (the guide's open questions).
- **Without a final ki, is a ki-eli / ki-muya clause a question or an exclamation?** The editor's judgement, as asked: an exclamation; the question ends in ki (2.3:G76).
- **Is -asa 'sacred' or 'the exalted degree'?** It depends on the word: no blanket rule, no data change.
- **Is a superseded construction wrong in new text, or only not preferred?** The editor's judgement, as asked: Superseded constructions stay grammatical; new text prefers the current ruling (2.3:G84).
- **Confirm that 0.8:G4's 'si (whether)' clause is superseded.** The editor's judgement, as asked: Yes: 2.3:G77 supersedes the clause in part; embedded yes/no questions use ki-oro.
- **Ordinals: NUMBER-ne for any noun, or only -krono?** The editor's judgement, as asked: Withdrawn: ordinals were already settled (NUMBER-ne).
- **0.8:R8: historical, or gloss the three verbs?** The editor's judgement, as asked: R8 stays as written; the three verbs read as unused slots until the author glosses them.
- **Bumrepago's unused slots: gloss them, or mark them as the play's coinages?** The editor's judgement, as asked: The play's coinages: no gloss is invented.
- **Is a retired listed derivation still a word?** The editor's judgement, as asked: A retired listed derivation stays buildable (2.3:G85).
- **The smaller gaps, one ruling each: 'about' after perception verbs, 'since then', closing order of time and attitude words, yava's slot, the give-type verbs, kroti + noun, li before an adjective noun, lusu/mosa, two time phrases in FRAME, quotations, past exclamatives, tuni + NP, motion verbs.** The editor's judgement, as asked: One ruling each: 2.3:G78-G83.
- **Which near-homophones and duplicate senses to act on.** The editor's judgement, as asked: No respelling; ki-saivo's example and daigozayu's note fixed; the two "birth" senses left to the author.

## Issues

### CODE BUG (33)

#### C01 · high · English progressive becomes copula + noun

- **Area:** composer
- **Rules:** R01 grammar.clause_template
- **Where:** editor/index.html MARKERS (≈2099) has no progressive entry; rewriteEnglish (2509)
- **Evidence:** #3 'We were singing.' → 'maivori po ke lira.' (were + song); #123 'Where are you going?' → 'ki-pago ke taivo [going] ki?'; M4 'he was singing about the sea' → 'po ke lira'; M6 'Who is singing?' → 'po ke lira'.
- **Proposed fix:** Add a marker: BE + V-ing → roni before the verb (past: po roni). Never read -ing after a form of 'be' as a noun when the stem has a verb slot.
- **Status:** FIXED 2026-10-19: be + V-ing is roni before the verb (po roni in the past), with no copula; ne stays before it.

#### C02 · high · Number words are never composed

- **Area:** composer
- **Rules:** R73 1.2:G28, R54 1.0:G9, R94 2.1:G49, R98 2.1:G53, R100 2.1:G55
- **Where:** editor/index.html buildIndex (1854): addEn(n, …) indexes each numeral by its digit string ('2'), so the English word 'two' never matches
- **Evidence:** #28, #66, #90, #93, #117-119: [two], [three], [one]; M3 [one], M10 [three], M12 [seven], M16 [hundred].
- **Proposed fix:** Index the English number words (one … ten, hundred, thousand, and compounds) against numbers.lookup_0_999.
- **Status:** FIXED 2026-10-19: number words 0-99, hundred, ordinals (una-ne …), once/twice, N times (N-krono) and "how many times" (ki-muya-krono).

#### C03 · high · Listed derivations are not in the composer's index

- **Area:** composer
- **Rules:** R65 1.0:G20, R86 2.0:G41
- **Where:** editor/index.html buildIndex (1854) indexes headwords and closed classes only, not morphology.lexicalised_derivations
- **Evidence:** #81 'The rebel left.' → 'li zeldo [left] po' (zeldo = resistance, not zeldoyo); M4, M9, M11, M13, M14 [singer] (lirayo); M12 [soldiers] [swords] (dokrayo, tisebitivu).
- **Proposed fix:** Index each listed derivation's gloss, as a headword slot is indexed.
- **Status:** FIXED 2026-10-19: the listed derivations are indexed by their glosses (singer = lirayo).

#### C04 · high · 'want X to do' uses sidu, which 2.1:G50 forbids

- **Area:** composer
- **Rules:** R95 2.1:G50
- **Where:** editor/index.html rewriteEnglish (2509): every 'to' + verb becomes to+verb → sidu
- **Evidence:** #114 'I want you to stay.' → 'maivo desida taivo sidu lisrola.' The editor's own checker flags this draft (error, sidu).
- **Proposed fix:** When a noun phrase or object pronoun stands between the verb and 'to', write fime + that subject + the verb (Maivo desida fime taivo lisrola).
- **Status:** FIXED 2026-10-19: "want X to V" opens a fime clause with its own subject (2.1:G50).

#### C05 · medium · Counterfactuals lose noma; 'if only' becomes 'only if'

- **Area:** composer
- **Rules:** R51 1.0:G6, R93 2.1:G48
- **Where:** editor/index.html MARKERS (≈2099): no entry for should/could/would have or the pluperfect of a si-clause
- **Evidence:** #62-63 'I should have sung.' → 'maivo [have] suvi lirala.'; M13 'If the moon had not warned him, the singer would have died.' → 'si li luno po ne nengania saivo, li [singer] [have] [died] viki.' (a real condition, not a counterfactual); #111 'If only you had stayed.' → 'si doli taivo po lisrola.' (only if).
- **Proposed fix:** Markers: should have → po noma suvi; could have → po noma povi; would have → po viki; had + participle in an if-clause → po noma; 'if only' → noma … pifu.
- **Status:** FIXED 2026-10-19: should have = po noma suvi, could have = po noma povi, would have = po viki; a pluperfect if-clause takes noma; "if only" = noma … pifu.

#### C06 · medium · Blessings ('May …') become permission

- **Area:** composer
- **Rules:** R93 2.1:G48
- **Where:** editor/index.html MARKERS: 'may' → dagi only
- **Evidence:** #110 'May the light hold you.' → 'li lumi dagi tivrota taivo.'; M20 'May their song protect you always.' → '… dagi sasvasia taivo toda-krono.' (is allowed to protect).
- **Proposed fix:** Sentence-initial 'May' + subject + verb → the clause with a final pifu (2.1:G48); keep dagi for 'may' after the subject.
- **Status:** FIXED 2026-10-19: a sentence-initial "May" + subject is a blessing with a final pifu (2.1:G48).

#### C07 · medium · Questions with 'who' use raho; headless 'what' uses ki-coda

- **Area:** composer
- **Rules:** R109 2.2:G64
- **Where:** editor/index.html composeClause (2593) / lookupEnglish (2416)
- **Evidence:** M6 '"Who is singing?"' → 'raho po ke lira masuma li devi.'; #132 'I sing what you love.' → 'maivo lirala ki-coda taivo amor.' (should be raho, and the verb amora).
- **Proposed fix:** In a question, who → ki-nela and what → ki-coda; in a statement, 'what' meaning 'that which' → raho (2.2:G64).
- **Status:** FIXED 2026-10-19: a question-initial who is ki-nela, which + noun is ki-eli; a headless "what" in a statement is raho (except after knowing and asking verbs).

#### C08 · medium · Exclamations are composed as statements

- **Area:** composer
- **Rules:** R106 2.2:G61
- **Where:** editor/index.html composeSentence/draftText (2837, ≈2933): only '?' is kept; '!' becomes '.'; no exclamative template
- **Evidence:** #127 'How beautiful the night is!' → 'ki-modo vanisan li nullo ke.'; #128 'What a night!' → 'ki-coda baba nullo.'; M17 → 'ki-coda baba vanisan nullo ito po ke.'; #120 'Do not go!' → 'ne pagopa.'
- **Proposed fix:** Keep '!'; 'How ADJ …!' → SUBJECT COPULA ki-modo ADJ!; 'What a N!' → ki-eli N!
- **Status:** FIXED 2026-10-19: "!" is kept; "How ADJ the N is!" and "What a (ADJ) N!" compose with ki-modo and ki-eli (2.2:G61).

#### C09 · medium · 'Let us' becomes the permissive valency operator

- **Area:** composer
- **Rules:** R101 2.1:G56, R02 grammar.slots[3]
- **Where:** editor/index.html MARKERS / lookupEnglish: 'let' → lesvu
- **Evidence:** #6 'Let us sing!' → 'lesvu maivori lirala.'; #121 'Let us not sing.' → 'lesvu maivori ne lirala.'
- **Proposed fix:** 'Let us' + verb → yava + verb, no subject; 'let us not' → yava ne.
- **Status:** FIXED 2026-10-19: "let us" is yava, with no subject (2.1:G56).

#### C10 · medium · A non-pronoun recipient stands bare

- **Area:** composer
- **Rules:** R71 1.2:G26
- **Where:** editor/index.html composeClause (2593)
- **Evidence:** M9 'She gave the singer a silver ring' → 'saivo po donuda li [singer] baba vanajubasan rinba'. Only a pronoun recipient may stand bare; any other takes ala after the theme. (#89, with 'to the child', composes correctly.)
- **Proposed fix:** With two bare noun phrases after a give-type verb, put the first after the second with ala unless it is a pronoun.
- **Status:** FIXED 2026-10-19: a give-type verb with two noun phrases is reordered to THEME ala RECIPIENT (1.2:G26).

#### C11 · medium · Duration, 'ago' and 'in N days' are mistranslated

- **Area:** composer
- **Rules:** R100 2.1:G55
- **Where:** editor/index.html MARKERS: 'ago' → po (tense) only; 'for' → vobi; 'in' → en
- **Evidence:** #118 'I came two days ago.' → 'maivo po venreva [two] deya.' (no kroti); #119 'in three days' → 'en [three] deya'; M16 'for a hundred years' → 'vobi baba [hundred] montafama' (benefactive).
- **Proposed fix:** 'N UNIT ago' → kroti + measure; 'in N UNIT' → krotiapo + measure; 'for N UNIT' → the bare measure after the object.
- **Status:** FIXED 2026-10-19: N UNIT ago = kroti + measure, in N UNIT = krotiapo + measure, for N UNIT = the bare measure (2.1:G55); "long ago" = kroti muya montafama.

#### C12 · medium · 'make / prevent someone do' does not use the valency operators

- **Area:** composer
- **Rules:** R59 1.0:G14, R14 grammar.valency
- **Where:** editor/index.html MARKERS / lookupEnglish
- **Evidence:** M16 'made the king sleep' → 'po farlafa li tarnuregna somu' (farlafa = to create; somu = sleep, the noun); #27 'I prevented him from going.' → 'maivo [prevented] saivo da [going] po.'
- **Proposed fix:** make/let/prevent + object + verb → vaku/lesvu/tekvu ACTOR VERB.
- **Status:** FIXED 2026-10-19: make / let / prevent + actor + verb use vaku / lesvu / tekvu, with the actor's verb in its verb form (1.0:G14).

#### C13 · medium · Tense placement: stranded, doubled or moved to the wrong clause

- **Area:** composer
- **Rules:** R01 grammar.clause_template, R46 1.0:G1
- **Where:** editor/index.html clauseLine (2862): when no verb is identified the operator stack is appended at the end
- **Evidence:** #25 'Kipo also baked bread.' → 'tu [kipo] bumresan bumre po.'; #81 '… [left] po.'; M1 '… li vemi po po ke narvosan …' (po twice); M5 '[weep] po hiro' (operators after the verb, and a tense inside a fime clause that inherits); #55 'I ask whether you will return.' → 'maivo futu masuma ki-oro taivo relnu.' (the future moved to the main clause; relnu is the noun).
- **Proposed fix:** Never emit operators after the clause's last word: when no verb is found, mark the clause as needing one. Keep each tense in the clause whose English verb carries it.
- **Status:** FIXED 2026-10-19: with no verb the operators go after the subject, never at the end; one word per slot; "whether" opens a ki-oro clause.

#### C14 · medium · Names in the attested list are not recognised

- **Area:** composer
- **Rules:** R37 0.8:R12
- **Where:** editor/index.html: the composer's lookupEnglish ignores NAMES (1918), which only the interlinear reader uses
- **Evidence:** #25 '[kipo]'; #42 'This is Dorin.' → 'eli ke [dorin].'; M4, M10 [dorin].
- **Proposed fix:** Pass a capitalised token that is in names (or not in the English index) through unchanged, as a name.
- **Status:** FIXED 2026-10-19: the attested names pass through, capitalised.

#### C15 · medium · Identity and lasting qualities get the temporary copula ke

- **Area:** composer
- **Rules:** grammar.slots[14], R72 1.2:G27
- **Where:** editor/index.html COPULA_EN / composeClause: 'is' → ke by default
- **Evidence:** #42 'This is Dorin.' → 'eli ke [dorin].' (identity is ka); #29, #91, #92 'All the songs are beautiful' / 'Your song is beautiful' / '… is different from …' → ke, where the spec's own examples (1.2:G27) use ka.
- **Proposed fix:** Default to ka before a noun phrase (identity); offer ke and ka side by side for adjectives instead of choosing ke.
- **Status:** NOT CHANGED: the default stays ke before a noun phrase, because the author's reviewed Song of Time drafts write "ke baba lira" (tests/golden/composer.test.ts pins them). ka is the second choice on every copula. An open point for the author: #42 "This is Dorin" composes as "eli ke Dorin".

#### K01 · medium · ne before the tense is not flagged

- **Area:** checker
- **Rules:** R07 grammar.slots[6], R39 0.8:G2
- **Where:** editor/checker/slots.js:166 records ne without a slot number, so rules/order.js never compares it with the tense
- **Evidence:** #16 'Maivo ne po lirala.' passes clean. The template is [TENSE] [noma] [ne] and ne floats only rightward ('before any later operator').
- **Proposed fix:** Give ne slot 6 when it stands among the operators, so the order rule (1.0:G1) reports ne before the tense.
- **Status:** FIXED 2026-10-19: ne before the tense is an error (1.0:G1).

#### K02 · medium · 'Poye, …' (attitude word opening with a comma) is not flagged

- **Area:** checker
- **Rules:** R67 1.0:G22, R12 grammar.slots[19]
- **Where:** editor/checker/rules/order.js:113 checks only words after a final; clauses.js lets a comma after a verbless opening stand as a vocative
- **Evidence:** #23 'Poye, maivo lirala.' passes; 'Poye maivo lirala.' is flagged. 1.0:G22 names exactly this case: 'Perhaps, …' is written with the clause-final poye.
- **Proposed fix:** Report an attitude word (seye, mufe, poye, pifu, zoke) that opens a line, with or without a comma, and offer the clause-final position.
- **Status:** FIXED 2026-10-19: an attitude word opening a clause is an error (1.0:G22) when other words follow; the album's "— seye, seye!" stays clean.

#### K03 · medium · gase opening a sentence is not flagged; gase + NP + raho is

- **Area:** checker
- **Rules:** R45 0.8:G8
- **Where:** editor/checker/clauses.js starts a 'gase' clause only after earlier material; rules/semantic.js:191 reads clause.kind
- **Evidence:** #54 'Gase maivo lirala, taivo rilura.' passes, while 'Maivo rilura gase taivo lirala.' is flagged. Conversely album 12:14 '… revo-lirala gase raleri raho ne ravmira.' (like echoes that do not fade) is flagged though gase + NP is a simile.
- **Proposed fix:** Treat a line-initial gase + subject + verb as a gase clause; do not start a clause at gase when a noun phrase follows it, even if a raho clause follows the noun.
- **Status:** FIXED 2026-10-19: gase + noun + raho reads as a simile, and a line-opening gase opens its own clause and is flagged.

#### K04 · medium · Double negative caught only when ne is directly before nuna-

- **Area:** checker
- **Rules:** R39 0.8:G2
- **Where:** editor/checker/rules/negation.js:50 tests W[k + 1] only
- **Evidence:** #44 'Maivo ne vimova nuna-coda.' passes; #45 'Maivo vimova ne nuna-coda.' is flagged.
- **Proposed fix:** Warn when a clause has ne and any nuna- word in its scope.
- **Status:** FIXED 2026-10-19: ne … nuna- anywhere in the scope warns (0.8:G2). Canon "Maivo ne sabesia nuna-coda." is now a known canon finding.

#### K05 · medium · 'su' for 'about' caught only directly after the verb

- **Area:** checker
- **Rules:** R75 1.2:G30
- **Where:** editor/checker/rules/order.js:333 tests W[v.i + 1] only
- **Evidence:** #96 'Li veluri po sarbisia lirari su amor.' passes (with its English 'about').
- **Proposed fix:** After a saying verb, flag su anywhere in the clause's adjuncts, not only right after the verb.
- **Status:** WITHDRAWN: the album writes VERB OBJECT su NP three times, which 2.2:G68 makes usage; the check stays on su directly after a saying verb.

#### K06 · medium · ko with a concrete instrument is not flagged

- **Area:** checker
- **Rules:** R78 1.2:G33
- **Where:** editor/checker/rules/semantic.js:80-94 fires for substance and abstract nouns only; data/checker/lexicon_flags.json noun_class has no tool class
- **Evidence:** #99 'Maivo lallela li dorbi ko li kemye.' (with the key) passes; #101 'ko melo' (abstract) is flagged.
- **Proposed fix:** Data, not code: add a tool/instrument class to the overlay's noun_class (kemye, biti, tisebiti …) and include it in the rule.
- **Status:** FIXED 2026-10-19: ko + a substance warns, ko + a tool is a note offering yuta (1.2:G33); ko/en + an abstract noun is a note (2.3:G73).

#### K07 · medium · Rules with no check at all

- **Area:** checker
- **Rules:** R31 0.8:R6, R51 1.0:G6, R58 1.0:G13, R63 1.0:G18, R10 grammar.slots[2], R13 grammar.scope_operators, R105 2.2:G60
- **Where:** no rule in editor/checker/rules/*.js
- **Evidence:** All pass clean: #38 'Sige maivo venreva, …' (sige never inherits tense); #62 'Maivo noma lirala.' (noma with no tense, modal or si); #73 'Maivo ata lirala.' (ata as 'also'); #78 'Vinto li bumre hozi, …' (hozi and vinto on one constituent); #21 two hozi topics in one clause; #25 'Kipo po bumreba doli.' (a scope operator with nothing to scope over); #126 'Maivori ne sabesia ki-coda maivori ramura ki.' (an embedded wh-question never ends in ki).
- **Proposed fix:** One check each; all are structural and need no English.
- **Status:** FIXED 2026-10-19: sige without a tense warns (0.8:R6); noma with no context is a note (canon "Maivori noma pilopa yasmo." has its context in an earlier line); ata between subject and verb is an error (1.0:G13); vinto on hozi and two hozi are flagged (1.0:G16, G18); a stranded scope word is an error unless a clause opener follows (1.0:G1, G10); ki closing a statement is an error (2.2:G60).

#### K09 · medium · False positives on fragments, word lists and existential miyo

- **Area:** checker
- **Rules:** R40 0.8:G3, R55 1.0:G10, grammar.slots[14]
- **Where:** editor/checker/rules/verbslot.js, rules/order.js:155-165 and :372
- **Evidence:** Album 06:32 'Ne codana, ne kronona — ola ka veraasa!' (neither … nor fragment) → error slot; 06:35 'Yehu, gesu, bisu, vuda — …' (the evidentials named, not used) → 3× 1.0:G16; 05alt:15 'miyo baba kasi sovesan sonbu ki?' (is there a …?) → error ki ('miyo is not moved to the front'), but existential miyo has no subject and always opens its clause.
- **Proposed fix:** Allow ne A ne B as a fragment (1.0:G10, 0.8:G3); do not slot words in a comma or dash list with no verb; treat miyo as clause-initial.
- **Status:** FIXED with the album decision: ne A ne B fragments, verbless lists of operator words and existential miyo questions now read clean.

#### K13 · medium · A new edition's respellings never reach stored writings

- **Area:** editor
- **Rules:** R103 2.1:G58, R114 2.3:G69
- **Where:** editor/index.html loadStore (≈3304) returns saved text as is; the 'liraasa:lexicon-changed' handler (4793) corrects every writing only for a rename made in Learn's roots tool
- **Evidence:** A journal written under 2.2 keeps lenra, kupa, jemla … after 2.3 loads; the checker flags each line (1.0:G19, with the fix), and nothing offers to correct the songbook at once.
- **Proposed fix:** Store the edition with the songbook; when the loaded lexicon is newer, offer (never silently apply) the same correctText migration the corpus gets.
- **Status:** FIXED 2026-10-19: the songbook offers to correct its spellings retired since the edition it was written in (the "Update spellings" button), and records the new edition.

#### K15 · medium · 'Reading older texts' gives retired replacements

- **Area:** guide
- **Rules:** R64 1.0:G19
- **Where:** scripts/grammar_guide (rulings file and guide), built from legacy rows' old → new without following later respellings
- **Evidence:** handoff/Liraasa_2_3_Rulings.md: barni → kupa (now ruko), velbi → vugo (now vizu), volda → larbopagobudi (now farvibudi), nalsi → velbivaye (now vizuvaye), zella → velbilavi (now vizulavi), yulve → yelfateyo (now bojidento), nolmu → folnimege (now folniyumli).
- **Proposed fix:** Print each old spelling with its current replacement (legacy.migration_forms already chains them).
- **Status:** FIXED 2026-10-19: "Reading older texts" gives the current replacement.

#### C16 · low · Closed-class words the composer cannot find

- **Area:** composer
- **Rules:** R56 1.0:G11, R112 2.2:G67, R75 1.2:G30, R94 2.1:G49, R50 1.0:G5, R62 1.0:G17, R80 1.2:G35, grammar.slots[17]
- **Where:** editor/index.html English index (closed classes, MARKERS)
- **Evidence:** despite (#70) → [despite], not nevi; behind/beside (#135-136, M14) → gaps, not nazru/silda; about (#96, M11) → [about], not de; once (#112) → [once], not una-krono; 'How many times' (#113) → 'ki-modo muya kronori'; deliberately/unexpectedly (#61, #77) → gaps, not la + adjective; recognize (#103) → gap, not revo-sabesia; each other (M18) → 'rada lotero', not fuyi; 'came down' (M8) → venreva, not nevrania.
- **Proposed fix:** Add these to the English index: nevi, the six side nouns, de for about (with an object), NUMBER-krono / ki-muya-krono, la + ADJ for -ly adverbs, the curated motion metaphors, fuyi, phrasal verbs.
- **Status:** FIXED 2026-10-19: despite/although = nevi, behind = nazru, beside = silda, in front of = zavme, more/less/most/least, each other = fuyi (after the adjuncts), -ly = la + adjective, -er = kasi + adjective, recognize = revo-sabesia, share = yave-donuda, come/go down = descend, reflexives = PRONOUN sela, X's = X de, "songs about love" = de, with + a tool or substance = yuta.

#### C17 · low · Quotations, word choice and scope

- **Area:** composer
- **Rules:** R41 0.8:G4, R46 1.0:G1
- **Where:** editor/index.html composeSentence (2837)
- **Evidence:** M6, M7, M9: quotation marks dropped and the quoted clause merged into the reporting clause; M7 'Only a child…' → 'doli li luno …' (doli moved onto the moon); M9 'every night' → 'toda nullo' (all night), not rada nullo; M10 'grew smaller' → 'kersoka [smaller]' (to increase).
- **Proposed fix:** Keep a quoted span as its own clause after the reporting verb (0.8:G4); attach only/also/even to the constituent that follows them in the English; every → rada before a singular noun.
- **Status:** FIXED 2026-10-19: a quotation is composed separately and joined after a colon (2.3:G83), with English inversion undone; only/even stay before what they mark. The "every → rada" part is withdrawn: 0.8:G7 allows toda nullo.

#### K08 · low · Rules that need the English and are not checked

- **Area:** checker
- **Rules:** R47 1.0:G2, R73 1.2:G28
- **Where:** editor/checker/rules/english.js
- **Evidence:** #55 'Maivo masuma si taivo futu relnura.' with English 'whether' passes (si is only 'if'); #94 'Li velu lumila.' with English 'The stars shine.' passes (a plural without a number takes -ri).
- **Proposed fix:** With English beside the line: 'whether' + si → ki-oro; an English plural with no number or quantifier and no -ri → warn.
- **Status:** FIXED IN PART: English "whether" beside a si clause is a calque (1.0:G2, 2.3:G77). The plural check (an English plural with no number and no -ri) is not implemented: #94 still passes.

#### K10 · low · Weak or generic diagnoses

- **Area:** checker
- **Rules:** R66 1.0:G21, R44 0.8:G7, R74 1.2:G29
- **Where:** editor/checker/rules/order.js:282, verbslot.js
- **Evidence:** #82 an unclosed relative is a note, though 1.0:G21 says it 'is closed by a comma'; #28-30 noun-phrase order errors and #95 a bare adjective as subject are reported as 'cannot be placed: expected the VERB/SUBJECT', not as the noun-phrase rule they break.
- **Proposed fix:** Raise 1.0:G21 to a warning; name 0.8:G7 / 1.2:G29 in those messages with the reordered phrase as the fix.
- **Status:** FIXED IN PART: the unplaced-word messages name 0.8:G7 or 1.2:G29. 1.0:G21 stays a note, because the album leaves out that comma on five lines.

#### K11 · low · An attested image compound's empty form reads as 'not a word'

- **Area:** checker
- **Rules:** R27 0.8:R2, R85 2.0:G40
- **Where:** editor/checker/lexicon.js unlisted index (headwords only)
- **Evidence:** #39 'amorliraa' (the verb of the attested amorlira, glossed '— (unused)') → 'error never invent: not a word of Liraasa', where a headword's empty form gives the unused-slot warning (0.8:R2).
- **Proposed fix:** Build the unused-slot index from image_compounds.attested too.
- **Status:** FIXED 2026-10-19: the unused-slot index covers image compounds, so amorliraa reads as an unused slot (0.8:R2), not as "not a word".

#### K12 · low · Back-translation ignores several rulings

- **Area:** back-translation
- **Rules:** R107 2.2:G62, R100 2.1:G55, R112 2.2:G67, R73 1.2:G28
- **Where:** editor/checker/gloss.js
- **Evidence:** M5 tonsi + adjective → 'therefore' (2.2:G62: 'so'); M1 kroti + measure → 'before many year' (2.1:G55: 'ago'); M14, M4 nazru/silda → 'rear', 'side' (2.2:G67 prepositions); numbers → '#una', '#seta', '#centa'; M6 ki-nela → 'who? preferred' (gloss text leaks).
- **Proposed fix:** Gloss these constructions as the rulings read them, and numbers by value.
- **Status:** FIXED 2026-10-19: tonsi + adjective = "so", kroti/krotiapo + measure = "ago"/"from now", side nouns as prepositions, numbers by value, and gloss text after "?" no longer leaks.

#### K14 · low · The interlinear reader calls every old spelling 'pre-1.0'

- **Area:** editor
- **Rules:** R64 1.0:G19, R103 2.1:G58
- **Where:** editor/index.html glossFor (≈2003) and the reader (1985)
- **Evidence:** 'kupa' (retired in 2.3) is glossed 'pre-1.0 → ruko'; an old spelling with -ri (lenrari) is not read at all (the checker now reads both).
- **Proposed fix:** Show the edition that retired it (D.legacy carries it via the checker's extra data) and strip -ri/-ti as the checker does.
- **Status:** FIXED 2026-10-19: the reader names the edition an old spelling was retired in ("before 2.3 → …").

#### K16 · low · The corrected protected-exception list keeps retired spellings

- **Area:** core
- **Rules:** R24 phonology.new_root_template
- **Where:** src/core/config/phonology.ts (used by src/core/integrate/audit.ts)
- **Evidence:** sulbaamor, nilvuamor, veboamor, vorbaamor and amorvorba: their roots were respelled in 2.1 (sola, foji, faji, duha).
- **Proposed fix:** Derive the list from the live lexicon instead of a hand list.
- **Status:** WITHDRAWN: src/core/config/phonology.ts documents 1.0 on purpose.

### SPEC BUG (4)

#### S01 · medium · 0.8:G4 still says embedded yes/no questions use si

- **Rules:** R41 0.8:G4, R47 1.0:G2, R105 2.2:G60
- **Where:** rulings_0_8_carried G4 (superseded_in_part covers only the wh-word clause)
- **Evidence:** 1.0:G2: si means only 'if'; 'whether' is ki-oro. 2.2:G60: embedded yes/no questions use ki-oro. The clause of 0.8:G4 that says si is marked as standing.
- **Proposed fix:** Mark that clause superseded too (op supersede_ruling, by 1.0:G2 or 2.2:G60).
- **Status:** RESOLVED 2026-10-19: 2.3:G77, embedded yes/no questions use ki-oro; 0.8:G4's si (whether) clause is marked superseded in part. Canon example 555 now reads "Maivo ne sabesia ki-oro li lazu nurminia."

#### S02 · medium · Questions with ki-eli / ki-muya and no ki read both ways

- **Rules:** R105 2.2:G60, R106 2.2:G61
- **Where:** rulings_2_2 G60, G61
- **Evidence:** G60: a question with a ki-word may end without ki. G61: ki-eli + noun and ki-muya + noun without final ki are exclamations. 'Ki-eli lira taivo amora' is both 'which song do you love' and 'what a song you love'. G61 settles only ki-modo + adjective (must end in ki).
- **Proposed fix:** Decision D3.
- **Status:** RESOLVED 2026-10-19 on the editor's judgement: 2.3:G76, a ki-eli / ki-muya + noun question ends in ki.

#### S03 · medium · 0.8:R8's own examples are dead forms

- **Rules:** R33 0.8:R8, R85 2.0:G40
- **Where:** rulings_0_8_carried R8
- **Evidence:** amorliraa, amorrinbaa and amorvulraa are 'correct', but since 2.0 their compounds are attested image compounds whose verb slots are '— (unused)': the words have no meaning.
- **Proposed fix:** Mark R8 as reading older texts, or rule on glosses for the three verbs (0.8:R2).
- **Status:** DECIDED 2026-10-19: 0.8:R8 stays as written (rulings are never reworded). The checker reads amorliraa, amorrinbaa and amorvulraa as unused slots; glossing them is the author's (0.8:R2), so none is invented.

#### S04 · low · Stale text in the lexicon's morphology and numbers sections

- **Rules:** R19 morphology.compounding, R20 morphology.derivation_defaults, R83 2.0:G38, R86 2.0:G41, R87 2.0:G42, R94 2.1:G49, R98 2.1:G53
- **Where:** morphology.compounding, morphology.suffixes, numbers.rules (group J)
- **Evidence:** 'components must be active 1.0 headwords' (2.0:G38, G42 and every post-1.0 compound contradict it); '-yo / -vu (on the root)' (2.0:G41: any root or compound); numbers rule J: 'ordinal, fractions await separate policy … avoid inventing', but 1.2:G27 and 2.1:G53 rule on fractions and 2.1:G49 uses una-ne.
- **Proposed fix:** Reword these three texts in the next changeset.
- **Status:** FIXED 2026-10-19: the three texts reworded by edit_text ops in the audit changeset (morphology.compounding, the -yo/-vu suffixes, numbers rule 39).

### SPEC GAP (11)

#### G01 · high · Is the album's consistent usage grammar now?

- **Rules:** R113 2.2:G68, R70 1.2:G25, R78 1.2:G33, R109 2.2:G64, R80 1.2:G35
- **Where:** album (Phase 6)
- **Evidence:** 2.2:G68 says a construction the album uses consistently is grammar, but the checker still questions: line-initial ata (12 lines), en for manner ('en baba melosan valla', 2 lines; 1.2:G33 says the means is yuta), ko amor (1 line), raho opening a question at 05:22 (AR-16 records only 11:12), taro-pagopa (05alt:13).
- **Status:** RESOLVED 2026-10-19: the album's usage is grammar, as 2.3:G72 (ata), G73 (manner with en and ko), G74 (raho question) and G75 (taro-pagopa). Line-initial nara (G07) was decided separately, as 2.3:G78.
- **Options (not chosen):** (a) Lock them in: each becomes a ruling (ata may continue the line before, like oro; en may mark manner; …). (b) Record each as an album reading (AR-17 …) with its standard form.

#### G02 · medium · What does 'superseded' make the old construction?

- **Rules:** R91 2.1:G46, R92 2.1:G47, R99 2.1:G54
- **Where:** supersede_ruling (2.2)
- **Evidence:** #122 'Taivo ke ola-modo vanisan fime li veluri lasola.' (2.1:G54's result clause) passes; no ruling says whether it is now wrong or only not preferred.
- **Status:** DECIDED 2026-10-19: 2.3:G84, a superseded construction stays grammatical; new text prefers the current ruling.
- **Options (not chosen):** (a) Ungrammatical in new text: the checker flags it with the superseding ruling as the fix. (b) Still grammatical, not preferred: a note.

#### G03 · medium · What is the ascended (-asa) form: sacred, or exalted?

- **Rules:** R35 0.8:R10, R16 morphology.seven_forms
- **Where:** word_building.registers: 'sacred is a property of the -asa / -asasan forms'
- **Evidence:** 93 used -asa glosses read nothing sacred: folluasa 'terror that eclipses reason', larneramuasa 'a resentment that survives generations', mirudaigoasa 'the drowning of a lost city', corviasa 'bravery before the impossible'. 23 sacred concepts have an empty -asa slot (luminela priest, lavbulira hymn, lumimiru holy water, sasvalansi guardian angel …). The checker notes every -asa form outside a sacred text (0.8:R10).
- **Status:** DECIDED 2026-10-19: it depends on the word. No blanket rule and no data change; each ascended gloss stands on its own.
- **Options (not chosen):** (a) -asa is 'the ultimate / exalted' degree; a text is sacred by its subject, and the register note goes. (b) -asa is sacred: review the 93 glosses and consider the 23 empty slots (0.8:R2).

#### G04 · medium · Tense inheritance for kureli, sina, si, nevi

- **Rules:** R31 0.8:R6, R111 2.2:G66
- **Where:** 0.8:R6
- **Evidence:** Inheritance is listed for fime, raho, kube, nayo, kasa, kopisa, tuni (and kroti/krotiapo); kureli (as soon as), sina (unless), si (if) and nevi (although) are not listed either way.
- **Status:** LEFT OPEN by the author (2026-10-19); recorded in the guide's open questions.
- **Options (not chosen):** (a) All subordinators inherit except sige. (b) Only those listed inherit; the others are always marked.

#### G05 · medium · Ordinals

- **Rules:** R94 2.1:G49
- **Where:** numbers.rules J; 2.1:G49
- **Evidence:** M1 'the first song' needs an ordinal. The only attested one is una-ne krono (the first time).
- **Status:** WITHDRAWN: ordinals are already settled in settled_open_questions_0_8 (NUMBER-ne).
- **Options (not chosen):** (a) NUMBER-ne is the ordinal of any noun (una-ne lira, dossa-ne deya). (b) Ordinals stay limited to -krono; 'first' is a word of its own.

#### G06 · low · A retired listed derivation is still buildable

- **Rules:** R115 2.3:G70, R86 2.0:G41
- **Where:** 2.3:G70
- **Evidence:** G70 retires mirunululirayo; G41 makes every R + yo a word with its default reading, so it still reads as 'one devoted to river-song', and the checker accepts it.
- **Status:** DECIDED 2026-10-19: 2.3:G85, a retired listed derivation stays buildable by rule; it is no longer listed.
- **Options (not chosen):** (a) It stays a word with its default reading (old texts read 'frog' through the legacy table). (b) It is retired outright: the checker flags it as an old spelling of kerku.

#### G07 · low · Line-opening nara

- **Rules:** R70 1.2:G25
- **Where:** 1.2:G25 covers oro only
- **Evidence:** M8 'Nara li devi po ne lenila …' (But the goddess …). Same question as line-initial ata (G01).
- **Status:** DECIDED 2026-10-19: 2.3:G78, a line may open with nara.
- **Options (not chosen):** (a) nara may open a sentence that continues the one before, like oro. (b) Sentence-initially, 'but' is narli (nevertheless).

#### G08 · low · 'hear / know / think about X'

- **Rules:** R75 1.2:G30
- **Where:** 1.2:G30 covers verbs of saying
- **Evidence:** M11 'heard about the singer' needs an object the English does not have (li telne de li lirayo, the story of the singer).
- **Status:** DECIDED 2026-10-19: 2.3:G80, after hearing and knowing verbs "about X" is li telne de X; the composer does this.
- **Options (not chosen):** (a) Extend G30: after verbs of perceiving and knowing, give the verb an object. (b) Allow VERB de NP directly after these verbs.

#### G09 · low · 'since then'

- **Rules:** R31 0.8:R6
- **Where:** sige takes a clause only
- **Evidence:** M18 'Since then, …' was written 'Da ola-krono, …' (from then).
- **Status:** DECIDED 2026-10-19: 2.3:G79, "since then" is da ola-krono; the composer does this.
- **Options (not chosen):** (a) da + time correlative (da ola-krono). (b) sige + time correlative (sige ola-krono).

#### G10 · low · Clause-closing order: time word and attitude word

- **Rules:** R69 1.2:G24, R67 1.0:G22
- **Where:** clause template
- **Evidence:** M20: a time word may close its clause, and an attitude word must; '… taivo toda-krono pifu' vs '… taivo pifu toda-krono' is not ruled (the myth avoids it by opening with the time word).
- **Status:** DECIDED 2026-10-19: 2.3:G78, a clause closes time → attitude → ki.
- **Options (not chosen):** (a) TIME before ATTITUDE before ki. (b) A closing time word is not allowed with an attitude word.

#### G11 · low · Smaller gaps met in the tests and the myth

- **Rules:** R101 2.1:G56, R71 1.2:G26, R100 2.1:G55, R30 0.8:R5, R54 1.0:G9, R09 grammar.slots[1], R41 0.8:G4, R106 2.2:G61, R80 1.2:G35
- **Where:** various
- **Evidence:** No slot for yava in the template (2.1:G56); give-type verbs named in English only (1.2:G26); 'kroti deya' (the function-word example of kroti) reads as 'a day ago' under 2.1:G55; whether li may be omitted before an adjective used as a noun (0.8:R5 vs 1.2:G29); lusu/mosa as 'at least/most' and as superlatives (1.0:G9); two time phrases in the one FRAME slot (M1); quotation punctuation (0.8:G4); a past exclamative cannot use ki-eli + noun, which has no verb (M17); tuni before a noun phrase (M14); which verbs are motion verbs for the prefixes (album 05alt:13).
- **Status:** DECIDED 2026-10-19: yava opens the clause (2.3:G78); time phrases, kroti + noun and tuni + noun phrase (2.3:G79); lusu and mosa (2.3:G81); li before an adjective noun (2.3:G82); quotations and past exclamations (2.3:G83); motion verbs are listed in the checker overlay (pagopa, 2.3:G75). Give-type verbs stay named in English only (1.2:G26), and the composer reads them from a list.
- **Options (not chosen):** (a) Rule on each. (b) Leave them to the guide's prose as advice.

### LEXICON ISSUE (4)

#### L01 · medium · Liraasa lines mislabelled as English keep retired spellings

- **Rules:** R103 2.1:G58, R114 2.3:G69
- **Where:** data/corpus/bumrepago_2_3/bumrepago.txt:28; data/corpus/songs_2_3/song_VI_kicoda.txt:33 (and the 5 + 10 blocks the Learn report lists)
- **Evidence:** '# EN: … toda-nela sapusia li yordo' (yordo → puku); '# EN: Daigo ka dorbi, ne vabale …' (vabale → tobra). migrate_corpus.ts skips comment lines, so they were never respelled, and Learn teaches such blocks as Liraasa lines.
- **Proposed fix:** Relabel the extraction errors in the 1.0 corpus, then rerun npx tsx scripts/migrate_corpus.ts.
- **Status:** OPEN: not done in this pass. Relabelling the corpus extraction errors means editing the 1.0 corpus and rerunning migrate_corpus.ts.

#### L02 · low · Bumrepago uses four unused slots

- **Rules:** R27 0.8:R2
- **Where:** data/corpus/bumrepago_2_3/bumrepago.txt:54, 113, 118, 162, 164, 377, 455, 457
- **Evidence:** bumrena ×4 ('no-bread', the play's joke), bumreasa ×2, bumreasasan ×2, tabuasa ×1: all '— (unused)' in 2.3.
- **Proposed fix:** Approve glosses for them (0.8:R2), or record them as the play's coinages.
- **Status:** DECIDED 2026-10-19: recorded as the play's coinages; no gloss is invented (0.8:R2 leaves glosses to the author).

#### L03 · low · Near-homophones among the roots

- **Rules:** R24 phonology.new_root_template, R102 2.1:G57
- **Where:** data/lexicon/liraasa_2_3.json headwords
- **Evidence:** 16 root pairs one edit apart. Closest in song: sora/sola (friend/sun, l/r). Others: foji/faji/boji/fojo (winter/spring/ice/…), sola/solo/solma/sovla, malo/mavo/melo, haza/hata, mera/vera, doza/goza, buza/cuza, desi/devi; maivo/mavo and devo/devi are declared pairs.
- **Proposed fix:** Author's call which matter; 2.1:G57 is not retroactive.
- **Status:** DECIDED 2026-10-19: no change, as with the 2.3 sound pass (the author: "its okay if a couple sounds are similar").

#### L04 · low · Duplicate meanings and stray text

- **Rules:** R27 0.8:R2
- **Where:** headwords; function_words
- **Evidence:** kronobio 'Birth (Time of Life)' and linuvenre 'birth' share a sense (faji/mirufonte 'spring' and fonte/sernafonte 'source' are distinct senses). The function word ki-saivo is still active with the example 'Ki-saivo lirala? (historical)', English inside a Liraasa field, beside ki-nela 'who? preferred'. daigozayu's note still says 'daigozirmeyo = necromancer' (zirme is zayu since 2.1).
- **Proposed fix:** Narrow one 'birth' gloss; retire or mark ki-saivo; archive the stale note (archive_text).
- **Status:** FIXED IN PART 2026-10-19: ki-saivo's example now reads "Ki-saivo lirala?" and daigozayu's stale note is archived (archive_text). The two "birth" senses are left to the author.

## The myth: The Goddess and the Singer

English, the editor's Compose draft (a gap the composer could not fill is in [brackets]), and the translation made by hand from the spec, with the rules behind each choice. Back-translations are the editor's own (Liraasa → English).

**1. Long ago, before the first song, the world was dark and silent.**

- Editor: *kroti muya montafama kroti li una-ne lira li vemi po ke narvosan ata lasosan.*
- Spec: *Kroti muya montafama, kroti li una-ne lira, li vemi po ka narvosan ata lasosan.*
- Rules: 2.1:G55 kroti + measure, no article = ago (muya montafama, many years ago); 1.2:G28 no -ri needed after a quantifier; 1.2:G24 a time phrase opens the clause, comma; 2.2:G66 / 2.1:G55 kroti + li + noun = before it; 2.1:G49 una-ne for 'first' (extrapolated from una-ne krono); grammar.clause_template SUBJECT TENSE VERB; copula ka: an enduring state; 1.0:G13 ata = and
- The checker on the editor's draft: error slot: “li” cannot be placed in the clause template: expected the VERB.; error slot: “li” cannot be placed in the clause template: expected the VERB.
- Back-translation of the spec version: ago: many year before the 1st song the world PAST is dark and silent
- Back-translation of the editor's draft: ago: many year before the 1st song the world PAST is(now) dark and silent
- Spec gaps: Ordinals: numbers rule J says ordinals 'await separate policy', but 2.1:G49 uses una-ne krono; una-ne lira extends that one example. Two time phrases open the clause; FRAME is one slot and 1.0:G16 says one word per slot.

**2. The goddess of light lived beyond the stars, and she was very lonely.**

- Editor: *li devi de lumi po bioba ultra li veluri, ata saivo po ke ruli pagonasan.*
- Spec: *Li devi de lumi po bioba ultra li veluri, ata saivo po ke ruli pagonasan.*
- Rules: 1.2:G27 X de Y: the goddess of light; grammar.slots[16] ADJUNCTS: ultra + NP; 1.0:G13 ata joins two clauses; copula ke: a temporary state; ruli = very
- Back-translation of the spec version: the goddess of light PAST live beyond the star.PL and he/she PAST is(now) very without a place
- Back-translation of the editor's draft: the goddess of light PAST live beyond the star.PL and he/she PAST is(now) very without a place
- Spec gaps: 'lonely' has no exact word: pagonasan is glossed 'without a place, homeless, family-less, lonely'.

**3. One night she saw a small fire on a mountain.**

- Editor: *una nullo saivo po vimova baba mellinasan faru su baba monru.*
- Spec: *Una nullo, saivo po vimova baba mellinasan faru su baba monru.*
- Rules: 1.2:G27 example 'Nullo de deyaapo, maivo po ne somusia': a noun phrase of time may open the clause; 1.2:G24 comma after an opening time phrase; 0.8:G7 ADJ before NOUN; su = on
- The checker on the editor's draft: error slot: “saivo” cannot be placed in the clause template: expected the VERB.
- Back-translation of the spec version: 1 night he/she PAST see a small fire on a mountain
- Back-translation of the editor's draft: 1 night he/she PAST see a small fire on a mountain

**4. Beside the fire sat a young singer named Dorin, and he was singing about the sea.**

- Editor: *silda li faru po semnesia baba yanbanasan lirayo nolesan Dorin, ata saivo po roni lirala [about] li sevu.*
- Spec: *Baba yanbanasan lirayo raho gome nolenia Dorin, po semnesia silda li faru, ata saivo po roni lirala lirari de li sevu.*
- Rules: 0.8:G7 NP [ADJ] NOUN [raho CLAUSE]; 1.0:G21 a raho clause that does not end the sentence is closed by a comma; grammar.slots[14] gome (+ verb): passive, 'who is named'; 0.8:R6 raho inherits the main tense; 2.2:G67 silda as a bare preposition; grammar.slots[11] roni: progressive; 1.2:G30 'about' is de, with an object after the verb (lirari de li sevu)
- The checker on the editor's draft: error 1.2:G26: “semnesia” is followed by two bare noun phrases (“baba yanbanasan lirayo”, “nolesan Dorin”), but only give-type verbs take two. Join them with a preposition, or make one a de phrase.
- Back-translation of the spec version: a young singer who PASS name Dorin PAST sit beside the fire and he/she PAST PROG sing song.PL of the sea
- Back-translation of the editor's draft: beside the fire PAST sit a young singer named Dorin and he/she PAST PROG sing the sea
- Spec gaps: English locative inversion ('Beside the fire sat …') has no Liraasa counterpart; the clause keeps SUBJECT … VERB order.

**5. His song was so beautiful that the stars began to weep.**

- Editor: *saivo de lira po ke tonsi vanisan fime li veluri po hiro [weep].*
- Spec: *Saivo de lira po ka tonsi vanisan fime li veluri hiro timruta.*
- Rules: 1.2:G27 a pronoun before de is the owner; 2.2:G62 tonsi + adjective … fime clause = so … that; 0.8:R6 fime inherits the tense: no po; grammar.slots[9] hiro: begin
- The checker on the editor's draft: error slot: “fime” opens a clause, and the clause has no verb (“veluri” is not a verb form; its verb is veluva).
- Back-translation of the spec version: his/her song PAST is so beautiful that the star.PL begin to shed tears
- Back-translation of the editor's draft: his/her song PAST is(now) so beautiful that the star.PL PAST begin to

**6. "Who is singing?" asked the goddess.**

- Editor: *li devi po masuma: “ki-nela roni lirala ki?”*
- Spec: *Li devi po masuma: “Ki-nela roni lirala ki?”*
- Rules: 0.8:G4 an appended direct quotation; 2.2:G60 a ki-word may open the question; it may end in ki; 2.2:G64 questions use ki-nela (who); grammar.slots[11] roni
- Back-translation of the spec version: the goddess PAST ask who PROG sing Q
- Back-translation of the editor's draft: the goddess PAST ask who PROG sing Q
- Spec gaps: How a quotation is punctuated (colon, quotation marks) is shown in 0.8:G4's example but not stated.

**7. The moon answered, "Only a child of the village; do not go to him."**

- Editor: *li luno po relsira: “doli baba linu de li vila. ne pagopa ala saivo.”*
- Spec: *Li luno po relsira: “Doli baba linu de li vila. Ne pagopa ala saivo!”*
- Rules: 0.8:G4 quotation; 0.8:G3 an answer may be a fragment; 1.0:G1 doli scopes over the constituent that follows; 1.2:G27 de; 2.1:G56 prohibition: ne + command, no subject; ala = to
- Back-translation of the spec version: the moon PAST answer only a child of the village NOT go to he/she
- Back-translation of the editor's draft: the moon PAST answer only a child of the village NOT go to he/she

**8. But the goddess did not listen, and she came down to the mountain.**

- Editor: *nara li devi po ne lenila, ata saivo po nevrania ala li monru.*
- Spec: *Nara li devi po ne lenila, ata saivo po nevrania ala li monru.*
- Rules: nara = but; 0.8:G2 ne after the tense, before the verb; 1.0:G13 ata
- Back-translation of the spec version: but the goddess PAST NOT hear and he/she PAST descend to the mountain
- Back-translation of the editor's draft: but the goddess PAST NOT hear and he/she PAST descend to the mountain
- Spec gaps: Can nara open a sentence that continues the one before? 1.2:G25 settles this only for oro (and the checker asks the same of ata). Options: (a) allow nara, like oro; (b) require narli (nevertheless) sentence-initially.

**9. She gave the singer a silver ring and said, "Sing for me every night."**

- Editor: *saivo po donuda baba vanajubasan rinba ala li lirayo ata po senosia: “lirala vobi maivo toda nullo.”*
- Spec: *Saivo po donuda baba vanajubasan rinba ala li lirayo ata po senosia: “Lirala vobi maivo rada nullo.”*
- Rules: 1.2:G26 give: VERB THEME ala RECIPIENT; 0.8:G3 a repeated subject may be omitted in coordinated clauses; 1.2:G31 a command has no subject; 1.0:G12 vobi = for the benefit of; rada = each (quantifier) before a noun; 2.0:G39 vanajuba is a headword: its adjective vanajubasan
- Back-translation of the spec version: he/she PAST give a silvery ring to the singer and PAST speak sing for I each night
- Back-translation of the editor's draft: he/she PAST give a silvery ring to the singer and PAST speak sing for I all night

**10. Dorin sang for her three times, and each time the darkness grew smaller.**

- Editor: *Dorin po lirala vobi saivo tressa-krono, ata rada-krono li narvo po loya kasi mellinasan.*
- Spec: *Dorin po lirala vobi saivo tressa-krono, ata rada-krono li narvo po loya kasi mellinasan.*
- Rules: 2.1:G49 NUMBER-krono = N times; 1.2:G34 rada-krono = each time; it may open its clause; grammar.slots[14] loya: become; kasi + adjective = more …
- Back-translation of the spec version: Dorin PAST sing for he/she tressa times and each time the darkness PAST become more small
- Back-translation of the editor's draft: Dorin PAST sing for he/she tressa times and each time the darkness PAST become more small

**11. The king of the city heard about the singer and wanted the ring for himself.**

- Editor: *li tarnuregna de li cilni po lenila li telne de li lirayo ata po desida li rinba vobi saivo sela.*
- Spec: *Li tarnuregna de li cilni po lenila li telne de li lirayo ata po desida li rinba vobi saivo sela.*
- Rules: 1.2:G27 de; 1.2:G30 'about' is de with an object after the verb; 0.8:G3 subject omitted; 1.0:G12 vobi; pronouns: saivo sela = himself
- Back-translation of the spec version: the king of the city PAST hear the story of the singer and PAST want the ring for he/she oneself
- Back-translation of the editor's draft: the king of the city PAST hear the story of the singer and PAST want the ring for he/she oneself
- Spec gaps: 'hear about X' needs an object noun the English does not have (telne, story, is supplied). 1.2:G30 covers verbs of saying only. Options: (a) extend G30 to verbs of perceiving and knowing (hear, know, think) with a stock object; (b) allow VERB de NP directly after these verbs.

**12. He sent seven soldiers with swords to the mountain.**

- Editor: *saivo po silbesia seta dokrayori ko tisebitivuri ala li monru.*
- Spec: *Saivo po silbesia seta dokrayori ko tisebitivuri ala li monru.*
- Rules: 1.2:G28 -ri optional after a number (kept here); 1.0:G20 tisebitivu (sword) is a listed derivation; dokrayo (soldier) is listed (2.3); 1.2:G33 ko = accompaniment, not the instrument; ala = toward (a place, not a recipient: 1.2:G26 does not apply)
- Back-translation of the spec version: he/she PAST send 7 soldier.PL with sword.PL to the mountain
- Back-translation of the editor's draft: he/she PAST send 7 soldier.PL with sword.PL to the mountain

**13. If the moon had not warned him, the singer would have died.**

- Editor: *si li luno po noma ne nengania saivo, li lirayo po viki daigoda.*
- Spec: *Si li luno po noma ne nengania saivo, li lirayo po viki daigoda.*
- Rules: 1.0:G6 noma = contrary to fact; 'would have' = po viki in a consequence clause; grammar.clause_template TENSE noma ne VERB; 1.0:G16 noma has its tense context
- Back-translation of the spec version: if the moon PAST COUNTERFACT NOT warn him/her the singer PAST would die
- Back-translation of the editor's draft: if the moon PAST COUNTERFACT NOT warn him/her the singer PAST would die

**14. The singer hid behind a great tree and waited until morning.**

- Editor: *li lirayo po helviha nazru baba [great] larbo ata po sulnosia tuni merno.*
- Spec: *Li lirayo po helviha nazru baba mellisan larbo ata po sulnosia tuni li merno venreva.*
- Rules: 2.2:G67 nazru as a bare preposition; 0.8:G3 subject omitted; 0.8:R6 tuni inherits the tense; tuni + clause ('until the morning came')
- Back-translation of the spec version: the singer PAST hide behind a large tree and PAST wait until the morning come
- Back-translation of the editor's draft: the singer PAST hide behind a tree and PAST wait until morning
- Spec gaps: tuni is shown only before a clause; whether 'tuni li merno' (until morning) is grammar is not said.

**15. The soldiers could not find him, because the forest protected him.**

- Editor: *li dokrayori ne povi navdinia saivo, kasa li larbopago po sasvasia saivo.*
- Spec: *Li dokrayori po ne povi navdinia saivo, kasa li larbopago sasvasia saivo.*
- Rules: 0.8:G2 / 1.0:G15 ne before the modal negates the ability; 1.0:G3 povi = ability; 0.8:R6 kasa inherits the tense: no po
- Back-translation of the spec version: the soldier.PL PAST NOT can find him/her because the forest protect him/her
- Back-translation of the editor's draft: the soldier.PL NOT can find him/her because the forest PAST protect him/her

**16. Then the goddess made the king sleep for a hundred years.**

- Editor: *krotiata li devi po vaku li tarnuregna somusia centa montafama.*
- Spec: *Krotiata li devi po vaku li tarnuregna somusia centa montafama.*
- Rules: krotiata = then, next; 1.0:G14 vaku ACTOR VERB; tense belongs to the main clause only; 2.1:G55 a bare measure after the object = duration; 1.2:G28 -ri optional after a number
- Back-translation of the spec version: then the goddess PAST CAUSE the king sleep 100 year
- Back-translation of the editor's draft: then the goddess PAST CAUSE the king sleep 100 year

**17. What a beautiful night it was!**

- Editor: *li nullo po ke ki-modo vanisan!*
- Spec: *Li nullo po ka ki-modo vanisan!*
- Rules: 2.2:G61 ki-modo + adjective without final ki = an exclamation; copula ka with po keeps the past tense
- Back-translation of the spec version: the night PAST is how beautiful
- Back-translation of the editor's draft: the night PAST is(now) how beautiful
- Spec gaps: 2.2:G61's ki-eli + noun ('Ki-eli vanisan nullo!', what a beautiful night) has no verb, so it cannot carry 'it was': past exclamatives must use ki-modo with a copula.

**18. Since then, the singer and the goddess sing to each other across the sky.**

- Editor: *da ola-krono li lirayo ata li devi lirala transa li navu fuyi.*
- Spec: *Da ola-krono, li lirayo ata li devi lirala transa li navu fuyi.*
- Rules: da = from, before the correlative ola-krono (then); grammar.clause_template [ADJUNCTS] [fuyi]: the reciprocal follows the adjuncts; 1.0:G13 ata joins the two subjects
- Back-translation of the spec version: from then the singer and the goddess sing through the sky each other
- Back-translation of the editor's draft: from then the singer and the goddess sing through the sky each other
- Spec gaps: 'since then': sige (since) takes only a clause, and no ruling gives 'since + time word'. Options: (a) da + correlative (from then), as used here; (b) sige + correlative (sige ola-krono).

**19. Perhaps you can hear them when the moon is full.**

- Editor: *taivo povi lenila saivori poye kube li luno ke fulesan.*
- Spec: *Kube li luno ke fulesan, taivo povi lenila saivori poye.*
- Rules: kube = when (subordinate), opening with a comma; 1.0:G3 povi; 1.0:G22 'Perhaps, …' is written with the clause-final poye; copula ke: the full moon is a passing state
- Back-translation of the spec version: when the moon is(now) full you can hear them maybe
- Back-translation of the editor's draft: you can hear them maybe when the moon is(now) full

**20. May their song protect you always.**

- Editor: *saivori de lira sasvasia taivo toda-krono pifu.*
- Spec: *Toda-krono, saivori de lira sasvasia taivo pifu.*
- Rules: 2.1:G48 pifu with any subject is the blessing form; 1.2:G24 a time correlative opens its clause; 1.2:G27 a pronoun before de is the owner; 1.0:G22 pifu is clause-final
- Back-translation of the spec version: always their song protect you wish
- Back-translation of the editor's draft: their song protect you always wish
- Spec gaps: A time word may close its clause (1.2:G24) and an attitude word must close it (1.0:G22): their order when both close a clause ('… taivo toda-krono pifu') is not stated.

## Phase 1 and 2: rule inventory and implementation map

Status: the checker's, from the Phase 4 cases (overrides from reading the code are marked †). Composer: spec-exact drafts / English cases.

| ID | Source | Rule | Kind | Spec status | Checker | Composer | Where | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | grammar.clause_template | clause_template: Clause order: [FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo\|yasmo] [ATTITUDE] [ki]. | grammar | live | IMPLEMENTED | 4/4 | checker: slots.js placeClause; rules/order.js (1.0:G1). composer: index.html clauseLine (PRE_ORDER) |  |
| R02 | grammar.slots[3] | slots[3]: The subject is obligatory except in commands, hortatives and permitted ellipsis. | grammar | live | ACCEPTS | 2/2 | checker: slots.js (command after fisa); composer: none for yava |  |
| R03 | grammar.slots[4] | slots[4]: Tense is po (past), futu (future) or pressa (present); no tense word = present. | grammar | live | IMPLEMENTED | 1/1 | checker: rules/order.js (1.0:G16 one per slot); composer: MARKERS (po/futu) |  |
| R04 | grammar.stacking.one_per_slot | one_per_slot: At most one word per operator slot (one modal, one evidential, one tense…). | grammar | live | IMPLEMENTED |  | rules/order.js:58 |  |
| R05 | grammar.stacking.exclusions | exclusions: Excluded pairs: hiro/teki with roni/tefa; telvo/vazdi/fesmo with tefa; zoke with seye/mufe/poye/pifu; tavki with fututi; hoyo with yasmo. | grammar | live | IMPLEMENTED | 1/1 | rules/order.js:94 |  |
| R06 | grammar.stacking.max_preverbal_operators_recommended | max_preverbal_operators_recommended: No more than four preverbal operators are recommended. | grammar | live | IMPLEMENTED |  | rules/order.js:107 (note) |  |
| R07 | grammar.slots[6] | slots[6]: ne floats: it may stand before any later operator or the verb, negating what follows. | grammar | live | IMPLEMENTED | 1/1 | slots.js:166 (ne recorded without a slot); rules/negation.js |  |
| R08 | grammar.slots[12] | slots[12]: reve and loki may close the clause instead of standing in the iteration slot. | grammar | live | ACCEPTS | 2/2 | slots.js (operators) |  |
| R09 | grammar.slots[1] | slots[1]: FRAME words are clause-initial and followed by a pause (comma). | grammar | live | IMPLEMENTED | 1/1 | rules/order.js:155-165 |  |
| R10 | grammar.slots[2] | slots[2]: At most one hozi topic per clause, except paired contrastive topics in parallel clauses. | grammar | live | IMPLEMENTED |  | slots.js:251 (topic); no count check |  |
| R11 | grammar.slots[20] | slots[20]: ki is the last word of its clause. | grammar | live | IMPLEMENTED | 1/1 | rules/order.js:134 (1.0:G22) |  |
| R12 | grammar.slots[19] | slots[19]: Attitude words close the clause, before ki; zoke excludes the other four. | grammar | live | IMPLEMENTED | 1/1 | rules/order.js:113-134 |  |
| R13 | grammar.scope_operators | scope_operators: ne, doli, tu, yesta, pendi, vinto stand immediately before the constituent they scope over. | grammar | live | IMPLEMENTED | 2/2 | slots.js:171 (skipped, never checked) |  |
| R14 | grammar.valency | valency: CAUSER [TENSE…] vaku\|lesvu\|tekvu ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]. | grammar | live | IMPLEMENTED | 2/2 | slots.js (actor); rules/semantic.js:136 |  |
| R15 | grammar.noun_phrase | noun_phrase: Noun phrase: [QUANTIFIER] [li\|eli\|ola\|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]. | grammar | live | IMPLEMENTED | 2/2 | slots.js noun phrases; rules/nounphrase.js; misplaced words reported by rules/verbslot.js |  |
| R16 | morphology.seven_forms | seven_forms: Every headword has seven forms: R, R+asa, R+na, VERB, R+nasan, R+san, R+asasan. | morphology | live | N/A |  | checker/lexicon.js forms index; src/core/morphology/sevenForms.ts |  |
| R17 | morphology.verb_rule | verb_rule: Verb: opi→opioa; n-initial R+nia; s-initial R+sia; vowel-initial R+a; otherwise R + first consonant + a. | morphology | live | IMPLEMENTED |  | src/core/morphology/sevenForms.ts verbOf; checker reads only listed forms |  |
| R18 | morphology.suffix_order | suffix_order: ROOT + (one form OR one derivation) + -ti + -ri; -ri is always last. | morphology | live | IMPLEMENTED | 1/1 | checker/reader.js readStripped (-ti, -ri) |  |
| R19 | morphology.compounding | compounding: MODIFIER+HEAD written together, head rightmost; a compound's verb class follows its first letter. | morphology | live | N/A |  | validator check 7; checker reads listed compounds only | STALE: the lexicon's text says components must be active 1.0 headwords. 2.0:G38 (colour bases as modifiers), 2.0:G42 (nested compounds) and every compound built on a post-1.0 headword contradict it. |
| R20 | morphology.derivation_defaults | derivation_defaults: Default readings: -yo one who does/is devoted to R; -vu big or intense R; -pago place of R; -ti little or dear R; a listed derivation overrides. | morphology | live | ACCEPTS |  | checker/reader.js readDerivation | STALE: morphology.suffixes still says -yo and -vu attach 'on the root'; 2.0:G41 says derivations attach to any root or compound. |
| R21 | morphology.suffixes.-pago | -pago: mavo + -pago is blocked: mavopago means society only. | morphology | live | N/A |  | index.html buildIndex (mavo+pago skipped) |  |
| R22 | motion_prefixes | motion_prefixes: Motion prefixes va- du- taro- yave- revo- are a closed, non-productive list, on motion verbs and the curated metaphors only. | morphology | live | IMPLEMENTED |  | rules/words.js:125 (1.2:G35) |  |
| R23 | phonology.stress | stress: Stress falls on the penultimate syllable; adjacent vowels are separate syllables. | phonology | live | N/A |  | src/core/phonetics/g2p.ts (MFA export, Learn); not an editor check |  |
| R24 | phonology.new_root_template | new_root_template: New roots: two syllables, consonant-initial, vowel-final, inventory letters, no initial cluster but kr- tr-, no three-consonant cluster, no doubled letter, two edits from every active word. | phonology | live | N/A |  | src/core/change/respell.ts rootTemplateProblems; scripts/check_sounds.py |  |
| R25 | phonology.function_word_template | function_word_template: Function words: one to three syllables, vowel-final, no initial cluster, two edits from every active word except declared monosyllable pairs. | phonology | live | N/A |  | scripts/check_sounds.py |  |
| R26 | 0.8:R1 | Source of truth and name: The JSON is authoritative; the workbook is generated. Language field and files are named Liraasa. | process | live | N/A |  | a project rule: not checked in text |  |
| R27 | 0.8:R2 | Predictable unused slots: An unused form may receive a gloss only when its compositional meaning is predictable, approved case by case, and recorded in authorized_changes. | lexicon | live | IMPLEMENTED |  | editor/checker/rules/words.js:66 |  |
| R28 | 0.8:R3 | Root Review queue: Frozen for 0.8. No canonical root is respelled; the 40-root queue carries forward unchanged. | process | live | N/A |  | a project rule: not checked in text |  |
| R29 | 0.8:R4 | Frame tense: A standalone tense particle opening a paragraph or turn (Po — / Futu —) sets a frame: | grammar | live | UNTESTED |  | no dedicated check: the parser accepts the construction |  |
| R30 | 0.8:R5 | Article omission: li may be omitted in everyday speech as well as verse when the referent is obvious; | grammar | live | UNTESTED |  | no dedicated check: the parser accepts the construction | INTERACTION with 1.2:G29: li may be omitted when the referent is obvious, but an adjective may stand as a noun only after a determiner. Whether li can be omitted before an adjective used as a noun is not said. |
| R31 | 0.8:R6 | sige: sige clauses never inherit tense; they are always marked. Tense inheritance applies to fime, raho, kube, nayo, kasa, kopisa and tuni. | grammar | live | IMPLEMENTED |  | editor/checker/rules/order.js:222 | UNDERSPECIFIED: tense inheritance is listed for fime, raho, kube, nayo, kasa, kopisa, tuni (and kroti/krotiapo by 2.2:G66). kureli (as soon as), sina (unless), si (if) and nevi (although) are not listed either way. |
| R32 | 0.8:R7 | Yesterday evening: deyaapo is kept as a fossil (it retains the retired past marker apo). | reading | live | N/A |  | checker rules/words.js (1.0:G19) |  |
| R33 | 0.8:R8 | Double -a verbs: amorliraa, amorrinbaa and amorvulraa are correct; | morphology | live | DIVERGENT † |  | no check of its own; its cases are caught under 0.8:R2; † the ruling's example words are unused slots since 2.0; the checker calls them not words (S03, K11) |  |
| R34 | 0.8:R9 | ki with certainty: A certainty marker (or zoke) precedes ki: | grammar | live | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under 1.0:G22 |  |
| R35 | 0.8:R10 | Sacred register: Registers are defined in the grammar guide. | register | live | N/A |  | editor/checker/rules/register.js:25 |  |
| R36 | 0.8:R11 | Headword target: New vocabulary is sized by genuine gaps, not by the 120-150 target. | process | live | N/A |  | a project rule: not checked in text |  |
| R37 | 0.8:R12 | -ti on names: The diminutive -ti may attach to personal names as an affectionate or teasing form (Dorinti). | morphology | live | ACCEPTS |  |  |  |
| R38 | 0.8:G1 | Demonstratives as pronouns: eli/ola (and eliri/olari) stand alone for things, situations and discourse (ola = what was just said; | grammar | live | ACCEPTS | 1/2 | no dedicated check: the parser accepts the construction |  |
| R39 | 0.8:G2 | Negation scope: ne precedes what it negates: verb or modal (after tense), copula (ne ka), noun phrase or fragment (Ne eli), or a contrasted constituent (ne X, nara Y). Negation is compositional: ne + nuna- is a positive (avoid). | grammar | live | PARTIAL † |  | editor/checker/rules/negation.js:38, editor/checker/rules/negation.js:57; † ne with nothing after it, and ne directly before nuna-, are caught; ne … nuna- across the verb is not (K04) |  |
| R40 | 0.8:G3 | Ellipsis: Everyday speech may omit a repeated subject in coordinated clauses and in answers, omit a repeated predicate after a contrasting subject (Dorin, ne.), answer with tense + verb (Po sapusia.), and echo a word with ki. | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R41 | 0.8:G4 | Quotation and embedded questions: ki may close the main clause before an appended direct quotation (Taivo desida ki, fime maivo senosia: | grammar | in part superseded by 2.2:G60 | ACCEPTS |  | no dedicated check: the parser accepts the construction | CONTRADICTION: the clause left standing after 2.2:G60's partial supersession says embedded yes/no questions use si (whether). 1.0:G2 says si means only 'if' and 'whether' is ki-oro, and 2.2:G60 itself says embedded yes/no questions use ki-oro. The supersession marked only the wh-word clause. |
| R42 | 0.8:G5 | Relative time in subordinate clauses: Inside an inheriting clause: tefa marks prior action, nayo/roni simultaneous, futu subsequent (future-in-past), sahi habitual. | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R43 | 0.8:G6 | Nominalization: The root (form 1) is the noun of action or thing (juba, donu, tali). | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R44 | 0.8:G7 | Noun-phrase order: [toda\|rada\|muya\|poka\|somi\|nuna] [li\|eli\|ola\|OWNER de] [NUMBER] [ADJ...] NOUN[-ti][-ri] [de ...] [raho ...]. | grammar | live | IMPLEMENTED (as R15) | 2/2 | editor/checker/rules/order.js:444 |  |
| R45 | 0.8:G8 | Sameness, difference, similarity: X ka sambasan ko Y (same as); X ka sambanasan da Y (different from); gase NP alone = like NP (simile); gase ADJ gase NP = as ADJ as NP. Lotero silda, ... = on the other hand. | grammar | live | IMPLEMENTED | 1/1 | editor/checker/rules/semantic.js:233 |  |
| R46 | 1.0:G1 | Scope by position: Every preverbal operator scopes over everything to its right. | grammar | live | IMPLEMENTED (as R01) | 4/4 | editor/checker/rules/order.js:161, editor/checker/rules/order.js:242, editor/checker/rules/order.js:51, editor/checker/rules/order.js:80 |  |
| R47 | 1.0:G2 | si and whether: si means only 'if'. 'whether' is ki-oro. 0.8 texts that used si for 'whether' are read under 0.8 rules. | grammar | live | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under calque |  |
| R48 | 1.0:G3 | Permission vs possibility vs ability: povi = ability; nosi = epistemic possibility (might); dagi = permission (may, be allowed). 0.8's double use of nosi is split. | grammar | live | ACCEPTS | 3/3 | no dedicated check: the parser accepts the construction |  |
| R49 | 1.0:G4 | Epistemic necessity: 'must (logically)' = inferential evidential tosu + seye; | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R50 | 1.0:G5 | Intention: Intent is the verb chain 'dorvada sidu VERB' (intend to); | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R51 | 1.0:G6 | Counterfactual: noma marks a clause as contrary to fact. 'should have' = po noma suvi; 'could have' = po noma povi; 'would have' = po viki (in a consequence clause) or po noma viki. | grammar | live | IMPLEMENTED | 2/2 | no check of its own; its cases are caught under 1.0:G16 |  |
| R52 | 1.0:G7 | Imminence: fututi in the approach slot means 'about to': | grammar | live | IMPLEMENTED | 0/1 | no check of its own; its cases are caught under 1.0:G16 |  |
| R53 | 1.0:G8 | Continuation: loki covers both 'still' and 'keep on'; no separate continuative is added. | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R54 | 1.0:G9 | Quantity limits: Before a number or quantity, lusu = at least, mosa = at most, gase = approximately; | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction | UNDERSPECIFIED: lusu/mosa are 'at least/at most' before a number, but the function-word table glosses them 'least'/'most' (superlatives: mosa vanisan). The two uses are not stated together. |
| R55 | 1.0:G10 | Paired conjunctions: oro A oro B = either A or B; ne A ne B = neither A nor B; doli si = only if; yesta si = even if; 'si …, ata doli si …' = if and only if. | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R56 | 1.0:G11 | Despite: nevi + noun phrase = despite: nevi li zeldo, despite the resistance. nevi + clause = although. | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R57 | 1.0:G12 | Benefactive: vobi + noun phrase = for the benefit of / on behalf of (unchanged), and combines with any operator. | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R58 | 1.0:G13 | ata: ata is 'and' only; additive 'also' is tu. | grammar | live | IMPLEMENTED | 1/1 | editor/checker/rules/order.js:542 |  |
| R59 | 1.0:G14 | Valency operators: vaku (make), lesvu (let) and tekvu (prevent) fill the verb slot of the main clause; | grammar | live | IMPLEMENTED |  | editor/checker/rules/semantic.js:172 |  |
| R60 | 1.0:G15 | Negation and operators: ne before an operator negates the operator; | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R61 | 1.0:G16 | Exclusions: At most one word per slot. hiro/teki do not combine with roni or tefa. tavki excludes fututi (same slot). The effort slot (telvo, vazdi, fesmo) excludes tefa. noma requires a tense, modal or si-clause context. | grammar | live | PARTIAL † |  | editor/checker/rules/order.js:104, editor/checker/rules/order.js:117, editor/checker/rules/order.js:179, editor/checker/rules/order.js:210, editor/checker/rules/order.js:68; † one word per slot and the excluded pairs are caught (as R04, R05); noma with no tense, modal or si is not (K07) |  |
| R62 | 1.0:G17 | Unexpectedly / previously / simultaneously: la vuzinasan = unexpectedly; kroti ola = previously; nayo ola = meanwhile/simultaneously; krotiapo = subsequently. No new words. | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R63 | 1.0:G18 | Topic and focus together: A hozi-topic opens the clause; vinto may then mark a focus inside it. hozi and vinto never mark the same constituent. | grammar | live | IMPLEMENTED |  | editor/checker/rules/order.js:191 |  |
| R64 | 1.0:G19 | Version gating: Texts dated before 1.0 are interpreted with the 0.8 lexicon and rules. | reading | live | IMPLEMENTED | 1/1 | editor/checker/rules/words.js:84 | DOC: the guide's 'Reading older texts' list (handoff/Liraasa_2_3_Rulings.md) gives replacements that later editions retired: barni → kupa (now ruko), velbi → vugo (now vizu), volda → larbopagobudi (now farvibudi), nalsi → velbivaye (now vizuvaye), zella → velbilavi (now vizulavi), yulve → yelfateyo (now bojidento), nolmu → folnimege (now folniyumli). |
| R65 | 1.0:G20 | Lexicalised derivations: tisebitivu (sword), tibivu (rope), kaldopago (prison) and zeldoyo (rebel) are fixed meanings of regular derivations. | lexicon | live | ACCEPTS | 0/1 | the build and the validators (data, not text) |  |
| R66 | 1.0:G21 | Closing a relative clause: A raho-clause that does not end the sentence is closed by a comma in writing and a pause in speech: | grammar | live | PARTIAL † |  | editor/checker/rules/nounphrase.js:101, editor/checker/rules/order.js:413; † a note, where the ruling says the clause is closed by a comma (K10) |  |
| R67 | 1.0:G22 | Attitude words are clause-final only: seye, mufe, poye, pifu and zoke never open a clause. | grammar | live | IMPLEMENTED |  | editor/checker/rules/order.js:144, editor/checker/rules/order.js:295 |  |
| R68 | 1.0:G23 | Events taking place: venreva (come) with an event as subject means 'take place, happen': | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R69 | 1.2:G24 | Time words: opening or closing: A time word or time correlative (eli-krono, deyapressa, fututi, ki-krono's answers…) may open its clause or close it. | grammar | live | ACCEPTS | 1/1 | editor/checker/rules/order.js:316 |  |
| R70 | 1.2:G25 | oro, alone and paired: A single oro joins two equal constituents, exactly as ata does: | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R71 | 1.2:G26 | Give-type verbs: where the recipient goes: A verb of giving (give, lend, send, owe, sell, pay, bring, teach, show) takes VERB THEME ala RECIPIENT. | grammar | live | IMPLEMENTED | 2/2 | editor/checker/rules/valency.js:38, editor/checker/rules/valency.js:60 | UNDERSPECIFIED: the give-type verbs are named in English only (give, lend, send, owe, sell, pay, bring, teach, show); which Liraasa verbs count is decided by the checker's overlay, not the spec. |
| R72 | 1.2:G27 | Which side of de is the owner: In X de Y the owner is Y, read as English "X of Y": | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R73 | 1.2:G28 | -ri after a number or quantifier: After a number or a quantifier the plural -ri is optional: | grammar | live | MISSING | 2/2 | no dedicated check: the parser accepts the construction |  |
| R74 | 1.2:G29 | An adjective standing as a noun: An adjective may stand as a noun phrase on its own only after an article or determiner (li, eli, ola, baba): | grammar | live | IMPLEMENTED | 1/1 | editor/checker/rules/order.js:444 |  |
| R75 | 1.2:G30 | "About" is de: Liraasa has no word for "about / concerning". | grammar | live | PARTIAL † | 1/1 | editor/checker/rules/order.js:481; † rules/order.js:333 catches su only right after a saying verb (K05) |  |
| R76 | 1.2:G31 | Commands, address and narrative present: A command has no subject: the clause opens at the verb (slot 3 notes), softened with fisa. A person addressed is a noun phrase set off by commas, at the start or end of the clause. In verse, once the time has been set… | grammar | live | ACCEPTS |  | editor/checker/rules/english.js:207 |  |
| R77 | 1.2:G32 | Possession precedence: When de joins two candidates for owner, the owner is decided in this order: | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R78 | 1.2:G33 | yuta: the instrument: yuta + noun phrase names the instrument or means of an action: | grammar | live | PARTIAL † | 3/3 | editor/checker/rules/semantic.js:114, editor/checker/rules/semantic.js:95; † fires for substance and abstract nouns only (K06) |  |
| R79 | 1.2:G34 | Frequency correlatives: A quantifier joined to krono with a hyphen gives a frequency adverbial: | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R80 | 1.2:G35 | Two more curated motion metaphors: revo-sabesia (know again: recognize) and yave-donuda (give together: share) join revo-vimova and revo-lirala as curated metaphors. The motion prefixes otherwise stay non-productive. | grammar | live | ACCEPTS | 1/1 | editor/checker/rules/words.js:125 |  |
| R81 | 1.2:G36 | Gender in kinship: Kinship words are neutral: purma parent, famli sibling, linu child, purmafamli aunt or uncle. Gender is marked only when it matters, by a compound with minva (female) or tarnu (male) where the lexicon has one (minvali… | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R82 | 2.0:G37 | Two declared one-edit pairs: Declare devo / devi and nevi / devi as permitted one-edit pairs. | phonology | live | N/A |  | scripts/check_sounds.py, the validators, g2p |  |
| R83 | 2.0:G38 | Colour bases in compounds; compounds lexicalised with -ti: Colour bases may act as the modifier in a dictionary compound, and a compound may be lexicalised with -ti. | morphology | live | ACCEPTS |  |  |  |
| R84 | 2.0:G39 | Gold and silver as headwords: aurumijuba and vanajuba become dictionary headwords as well as colour words. | lexicon | live | N/A |  | the build and the validators (data, not text) |  |
| R85 | 2.0:G40 | Image compounds: Image compounds: any listed modifier + any listed head is a valid word with a predictable meaning, no 'new' flag needed (see pattern_compounds). | morphology | live | ACCEPTS |  |  |  |
| R86 | 2.0:G41 | Productive derivations: Derivations are fully productive with default readings: | morphology | live | ACCEPTS |  |  |  |
| R87 | 2.0:G42 | Nested compounds: A compound may take a compound as one of its two parts: | morphology | live | ACCEPTS |  |  |  |
| R88 | 2.0:G43 | Consonant values: Vowels are pure, as in Spanish or Italian. | phonology | live | N/A |  | scripts/check_sounds.py, the validators, g2p |  |
| R89 | 2.0:G44 | Neighbouring vowels in song: Every written vowel is its own syllable (0.8:R8), but in singing neighbouring vowels may glide into one note: | phonology | live | N/A |  | scripts/check_sounds.py, the validators, g2p |  |
| R90 | 2.0:G45 | Foreign names: A foreign name is not translated. It is copied as closely as Liraasa letters allow, choosing among near spellings by how the name sounds and sings. | lexicon | live | N/A |  | the build and the validators (data, not text) |  |
| R91 | 2.1:G46 | Questions keep every word in place: A question word stands where its answer would stand; | grammar | superseded by 2.2:G60 | SUPERSEDED |  | no dedicated check: the parser accepts the construction |  |
| R92 | 2.1:G47 | Exclamatives: A main clause with a ki-word and no final ki is an exclamation (!). | grammar | superseded by 2.2:G61 | SUPERSEDED |  | no dedicated check: the parser accepts the construction |  |
| R93 | 2.1:G48 | Blessings and wishes: pifu with any subject is the blessing form: | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R94 | 2.1:G49 | Once and N times: NUMBER-krono = N times (una-krono once, dossa-krono twice); | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R95 | 2.1:G50 | Different-subject complements: A second verb with its own subject goes in a fime clause: | grammar | live | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under sidu |  |
| R96 | 2.1:G51 | Evidentials: No evidential = no claim about source. Inside fime, the evidential reports the main-clause subject's evidence. In a question it asks the listener's source. | grammar | live | IMPLEMENTED |  | no check of its own; its cases are caught under 1.0:G16 |  |
| R97 | 2.1:G52 | Relatives on a prepositional object: raho opens the clause; the preposition keeps its place with a resumptive pronoun (ito/itori, saivo/saivori): Li nimu raho maivo po lirala en ito, ka vanisan. | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R98 | 2.1:G53 | Partitive de: After a number, quantifier, or superlative, de means of/among and G27/G32 ownership does not apply: | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R99 | 2.1:G54 | Result clauses: ola-modo + ADJ ... fime CLAUSE = so ADJ that: Taivo ke ola-modo vanisan fime li veluri lasola. | grammar | superseded by 2.2:G62 | SPEC GAP |  | no dedicated check: the parser accepts the construction | UNDERSPECIFIED: superseded by 2.2:G62, but no ruling says whether the superseded construction (ola-modo + ADJ … fime) is now wrong or merely not preferred. The same question applies to 2.1:G46 and 2.1:G47. |
| R100 | 2.1:G55 | Duration, ago, from now: Bare measure after the object = duration; | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction | UNDERSPECIFIED: 'kroti + measure (no article) = ago', but the function-word table's own example of kroti ('before') is 'kroti deya', a bare noun, which reads as 'a day ago' under G55. What counts as a measure is not defined. |
| R101 | 2.1:G56 | Prohibitions: ne + command, no subject; fisa softens; yava ne + verb = let us not. | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction | UNDERSPECIFIED: 'yava ne + verb = let us not', but the clause template has no slot for yava (slot 3 only says hortatives may lack a subject). |
| R102 | 2.1:G57 | Sound follows meaning: Guidance for new and respelled roots: prefer CVCV; l m n r v for sacred/tender/lyrical; b d g k p t z h for bodily/everyday/harsh; playful b c p for beloved small creatures; related meanings may share a consonant fram… | phonology | live | N/A |  | scripts/check_sounds.py, the validators, g2p |  |
| R103 | 2.1:G58 | Respelling: A respelled root keeps every meaning and empty slot; | lexicon | live | N/A |  | the build and the validators (data, not text) |  |
| R104 | 2.1:G59 | Roots replaced by compounds: volda -> larbopagobudi (larbopago + budi); | lexicon | in part superseded by 2.3:G71 | N/A |  | the build and the validators (data, not text) |  |
| R105 | 2.2:G60 | Question-word position: A ki-word may open the clause or stay where its answer would stand; | grammar | live | IMPLEMENTED | 3/3 | editor/checker/rules/order.js:609, editor/checker/rules/order.js:683 | RESOLVED by 2.3:G76 (2026-10-19): a ki-eli / ki-muya + noun question ends in ki; without ki it is an exclamation. |
| R106 | 2.2:G61 | Exclamatives, narrowed: Only ki-modo + adjective, ki-eli + noun and ki-muya + noun make an exclamation, and only when the clause does not end in ki. | grammar | live | IMPLEMENTED | 2/2 | editor/checker/rules/order.js:676, editor/checker/rules/order.js:695 | See 2.3:G76. |
| R107 | 2.2:G62 | So … that: tonsi + adjective: tonsi directly before an adjective means “so”; | grammar | live | ACCEPTS | 1/1 | no dedicated check: the parser accepts the construction |  |
| R108 | 2.2:G63 | Hopeful purpose: fime + nosi: After a main clause, a fime clause whose verb carries nosi means “in the hope that, so that perhaps”. | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R109 | 2.2:G64 | Headless raho: raho with no noun before it means “the one who, that which”, as subject, object or complement. | grammar | in part superseded by 2.3:G74 | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under 2.3:G74 |  |
| R110 | 2.2:G65 | Adjective + sidu + verb: An adjective may take sidu + verb for “easy to …, ready to …”. | grammar | live | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under sidu |  |
| R111 | 2.2:G66 | kroti and krotiapo before a clause: kroti and krotiapo may introduce a clause: | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R112 | 2.2:G67 | Side nouns as prepositions: nazru (behind), zavme (in front of), silda (beside), cemnu (in the middle of), lizma (left of) and rizno (right of) may stand bare before a noun phrase as prepositions, or after a verb as adverbs. | grammar | live | ACCEPTS | 2/2 | no dedicated check: the parser accepts the construction |  |
| R113 | 2.2:G68 | The album as reference corpus: The album (twelve songs and the alternate 05) is canon 2.0 text, read with 2.0 spellings under 2.1:G58. | process | live | N/A |  | a project rule: not checked in text |  |
| R114 | 2.3:G69 | Second respelling pass: Thirteen roots are respelled: lenra -> zarku; vanru -> dokra; voho -> kezdo; vabale -> tobra; teyo -> dento; mege -> yumli; kupa -> ruko; jemla -> zimzi; pesbi -> bondo; menha -> gamdo; vugo -> vizu; salye -> bapi; se… | lexicon | live | ACCEPTS | 1/1 | the build and the validators (data, not text) |  |
| R115 | 2.3:G70 | Roots for common animals: bumbo (bear), murmu (cow; cattle) and kerku (frog) are new roots. They replace larbopagoregna, maremirulazu and the listed derivation mirunululirayo, which are retired; kerku takes the verb kerkuka, to croak. mirunulu… | lexicon | live | ACCEPTS | 2/2 | the build and the validators (data, not text) | INTERACTION with 2.0:G41: G70 retires mirunululirayo, but G41 makes every R+yo a valid word with a default reading, so mirunululirayo stays buildable ('one devoted to river-song'). The ruling does not say whether a retired listed derivation is still a word. |
| R116 | 2.3:G71 | Wolf: larbopagobudi -> farvibudi (farvi + budi), 'wild dog', read like farvilazu (wild animal); | lexicon | live | IMPLEMENTED | 1/1 | no check of its own; its cases are caught under 1.0:G19 |  |
| R117 | 2.3:G72 | A line that continues: ata: ata may open a line or clause that continues the one before, as oro may (1.2:G25): | grammar | live | ACCEPTS |  | no dedicated check: the parser accepts the construction |  |
| R118 | 2.3:G73 | Manner with en and ko: en + an abstract noun names the manner or medium of an act: | grammar | live | ACCEPTS | 1/1 | editor/checker/rules/semantic.js:134 |  |
| R119 | 2.3:G74 | raho opening a question: A direct question may open with raho for 'who' or 'what' and ends in ki, as the album asks twice (05:22, 11:12). | grammar | live | IMPLEMENTED | 1/1 | editor/checker/rules/order.js:648 |  |
| R120 | 2.3:G75 | pagopa takes the motion prefixes: pagopa (to go) is a motion verb: the motion prefixes attach to it, as in taro-pagopa, to go across (album 05alt). The prefixes stay a closed list, on the motion verbs and the curated metaphors only (1.2:G35). | grammar | live | IMPLEMENTED |  | no check of its own; its cases are caught under 1.2:G35 |  |
| R121 | 2.3:G76 | Questions with ki-eli and ki-muya: A question with ki-eli + noun or ki-muya + noun ends in ki; | grammar | live | IMPLEMENTED | 1/1 | editor/checker/rules/order.js:665 |  |

## Phase 4: rule tests

Every case, from `tests/audit/cases.json`. Spec: the expected sentence checks clean. Break: the rule-breaking sentence is flagged (✓ citing the rule, ~ under another rule or as a note, ✗ not flagged). Composer: the editor's draft of the English.

| # | Rule | English | Expected (spec) | Spec | Break | Composer draft |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R01 grammar.clause_template | I sang. | Maivo po lirala. | ✓ | ✓ Maivo lirala po. | ✓ maivo po lirala. |
| 2 | R01 grammar.clause_template | I will sing. | Maivo futu lirala. | ✓ |  | ✓ maivo futu lirala. |
| 3 | R01 grammar.clause_template | We were singing. | Maivori po roni lirala. | ✓ | ✓ Maivori po lirala roni. | ✓ maivori po roni lirala. |
| 4 | R01 grammar.clause_template | I was able to sing. | Maivo po povi lirala. | ✓ | ✓ Maivo po roni povi lirala. | ✓ maivo po povi lirala. |
| 5 | R02 grammar.slots[3] | Sing, please. | Lirala, fisa. | ✓ |  | ✓ lirala fisa. |
| 6 | R02 grammar.slots[3] | Let us sing! | Yava lirala! | ✓ |  | ✓ yava lirala! |
| 7 | R03 grammar.slots[4] | I sing. | Maivo lirala. | ✓ |  | ✓ maivo lirala. |
| 8 | R03 grammar.slots[4] |  | Maivo pressa lirala. | ✓ | ✓ Maivo po futu lirala. |  |
| 9 | R04 grammar.stacking.one_per_slot |  | Saivo nosi lirala. | ✓ | ✓ Saivo nosi povi lirala. |  |
| 10 | R04 grammar.stacking.one_per_slot |  | Maivo yehu lirala. | ✓ | ✓ Maivo yehu gesu lirala. |  |
| 11 | R05 grammar.stacking.exclusions | I began to sing. | Maivo po hiro lirala. | ✓ | ✓ Maivo po hiro roni lirala. | ✓ maivo po hiro lirala. |
| 12 | R05 grammar.stacking.exclusions |  | Maivo po vazdi lirala. | ✓ | ✓ Maivo po vazdi tefa lirala. |  |
| 13 | R05 grammar.stacking.exclusions |  | Maivo lirala seye. | ✓ | ✓ Maivo lirala seye zoke. |  |
| 14 | R05 grammar.stacking.exclusions |  | Li dorbi ke lallesan hoyo! | ✓ | ✓ Li dorbi ke lallesan hoyo yasmo! |  |
| 15 | R06 grammar.stacking.max_preverbal_operators_recommended |  | Maivo po povi lirala. | ✓ | ✓ Maivo po ne povi hiro telvo reve yehu lirala. |  |
| 16 | R07 grammar.slots[6] | I did not sing. | Maivo po ne lirala. | ✓ | ✓ Maivo ne po lirala. | ✓ maivo po ne lirala. |
| 17 | R08 grammar.slots[12] | I still sing. | Maivo loki lirala. | ✓ |  | ✓ maivo loki lirala. |
| 18 | R08 grammar.slots[12] | I sing again. | Maivo reve lirala. | ✓ |  | ✓ maivo reve lirala. |
| 19 | R09 grammar.slots[1] | Suddenly the door opened. | Zafra, li dorbi po lallela. | ✓ | ✓ Li dorbi po lallela zafra. | ✓ zafra, li dorbi po lallela. |
| 20 | R09 grammar.slots[1] |  | Finra, saivo po relnura. | ✓ | ✓ Finra saivo po relnura. |  |
| 21 | R10 grammar.slots[2] |  | Li bumre hozi, Kipo po bumreba ito. | ✓ | ✓ Li bumre hozi, li lira hozi, Kipo po bumreba ito. |  |
| 22 | R11 grammar.slots[20] | Do you sing? | Taivo lirala ki? | ✓ | ✓ Taivo ki lirala? | ✓ taivo lirala ki? |
| 23 | R12 grammar.slots[19] | Maybe I sing. | Maivo lirala poye. | ✓ | ✓ Poye, maivo lirala. | ✓ maivo nosi lirala. |
| 24 | R13 grammar.scope_operators | Only you sing. | Doli taivo lirala. | ✓ |  | ✓ doli taivo lirala. |
| 25 | R13 grammar.scope_operators | Kipo also baked bread. | Tu Kipo po bumreba. | ✓ | ✓ Kipo po bumreba doli. | ✓ tu Kipo po bumreba. |
| 26 | R14 grammar.valency | I let him go. | Maivo po lesvu saivo pagopa. | ✓ | ✓ Maivo po lesvu saivo po pagopa. | ✓ maivo lesvu saivo pagopa. |
| 27 | R14 grammar.valency | I prevented him from going. | Maivo po tekvu saivo pagopa. | ✓ |  | ✓ maivo po tekvu saivo pagopa. |
| 28 | R15 grammar.noun_phrase | The two beautiful stars shine. | Li dossa vanisan veluri lumila. | ✓ | ✓ Li veluri vanisan lumila. | ✓ li dossa vanisan veluri lumila. |
| 29 | R15 grammar.noun_phrase | All the songs are beautiful. | Toda li lirari ka vanisan. | ✓ | ✓ Li toda lirari ka vanisan. | ✓ toda li lirari ke vanisan. |
| 30 | R15 grammar.noun_phrase |  | Li dossa veluri lumila. | ✓ | ✓ Li veluri dossa lumila. |  |
| 31 | R17 morphology.verb_rule |  | Li navu nullonia. | ✓ | ✓ Maivo lirasia. |  |
| 32 | R17 morphology.verb_rule |  | Maivo opioa. | ✓ | ✓ Maivo opipa. |  |
| 33 | R18 morphology.suffix_order | the little songs | li liratiri | ✓ | ✓ li lirariti | ✓ li mellinasan lirari. |
| 34 | R18 morphology.suffix_order |  | Li lirayo lirala. | ✓ | ✓ Li liraasayo lirala. |  |
| 35 | R20 morphology.derivation_defaults |  | Li monruyo pagopa. | ✓ |  |  |
| 36 | R22 motion_prefixes |  | Maivo revo-sabesia taivo. | ✓ | ✓ Maivo revo-lenila taivo. |  |
| 37 | R27 0.8:R2 |  | Li luno lumila. | ✓ | ✓ Li lavraasa lirala. |  |
| 38 | R31 0.8:R6 |  | Sige maivo po venreva, saivo ke benasan. | ✓ | ✓ Sige maivo venreva, saivo ke benasan. |  |
| 39 | R33 0.8:R8 |  | Li amorlira ka vanisan. | ✓ | ✓ amorliraa |  |
| 40 | R34 0.8:R9 | Maybe you sing? | Taivo lirala poye ki? | ✓ | ✓ Taivo lirala ki poye? | ✓ taivo nosi lirala ki? |
| 41 | R37 0.8:R12 |  | Dorinti lirala. | ✓ |  |  |
| 42 | R38 0.8:G1 | This is Dorin. | Eli ka Dorin. | ✓ |  | ✗ eli ke Dorin. |
| 43 | R38 0.8:G1 | This person sings. | Eli-nela lirala. | ✓ |  | ✓ eli nela lirala. |
| 44 | R39 0.8:G2 |  | Maivo vimova nuna-coda. | ✓ | ✓ Maivo ne vimova nuna-coda. |  |
| 45 | R39 0.8:G2 |  | Maivo vimova nuna-coda. | ✓ | ✓ Maivo vimova ne nuna-coda. |  |
| 46 | R39 0.8:G2 |  | Maivo ne lirala. | ✓ | ✓ Maivo lirala ne. |  |
| 47 | R40 0.8:G3 |  | Po sapusia. | ✓ |  |  |
| 48 | R40 0.8:G3 |  | Dorin, ne. | ✓ |  |  |
| 49 | R41 0.8:G4 |  | Taivo desida ki, fime maivo senosia. | ✓ |  |  |
| 50 | R42 0.8:G5 |  | Maivo po sabesia fime saivo tefa pagopa. | ✓ |  |  |
| 51 | R43 0.8:G6 |  | Sidu lisrola ka livna de taivo. | ✓ |  |  |
| 52 | R43 0.8:G6 |  | Fime taivo po relnura ka baba juba. | ✓ |  |  |
| 53 | R45 0.8:G8 | This bread is the same as father's bread. | Eli bumre ka sambasan ko pilo de bumre. | ✓ |  | ✓ eli bumre ke sambasan ko pilo de bumre. |
| 54 | R45 0.8:G8 |  | Saivo ke gase vanisan gase taivo. | ✓ | ✓ Gase maivo lirala, taivo rilura. |  |
| 55 | R47 1.0:G2 | I ask whether you will return. | Maivo masuma ki-oro taivo futu relnura. | ✓ | ✓ Maivo masuma si taivo futu relnura. | ✓ maivo masuma ki-oro taivo futu relnura. |
| 56 | R48 1.0:G3 | You may stay. | Taivo dagi lisrola. | ✓ |  | ✓ taivo dagi lisrola. |
| 57 | R48 1.0:G3 | He might sing. | Saivo nosi lirala. | ✓ |  | ✓ saivo nosi lirala. |
| 58 | R48 1.0:G3 | I can sing. | Maivo povi lirala. | ✓ |  | ✓ maivo povi lirala. |
| 59 | R49 1.0:G4 |  | Kipo po tosu bumreba seye. | ✓ |  |  |
| 60 | R50 1.0:G5 | I intend to sing. | Maivo dorvada sidu lirala. | ✓ |  | ✓ maivo dorvada sidu lirala. |
| 61 | R50 1.0:G5 | I sang deliberately. | Maivo po lirala la dorvasan. | ✓ |  | ✓ maivo po lirala la dorvasan. |
| 62 | R51 1.0:G6 | I should have sung. | Maivo po noma suvi lirala. | ✓ | ✓ Maivo noma lirala. | ✓ maivo po noma suvi lirala. |
| 63 | R51 1.0:G6 | I could have sung. | Maivo po noma povi lirala. | ✓ |  | ✓ maivo po noma povi lirala. |
| 64 | R52 1.0:G7 | I was about to leave. | Maivo po fututi pagopa. | ✓ | ✓ Maivo po tavki fututi pagopa. | ✗ maivo po fututi [leave]. |
| 65 | R53 1.0:G8 | I keep on singing. | Maivo loki lirala. | ✓ |  | ✓ maivo loki lirala. |
| 66 | R54 1.0:G9 | You owe me exactly two coins. | Taivo guraga maivo pendi dossa cono. | ✓ |  | ✓ taivo guraga maivo pendi dossa conori. |
| 67 | R54 1.0:G9 |  | Maivo po vimova gase centa veluri. | ✓ |  |  |
| 68 | R55 1.0:G10 |  | Maivo desida oro miru oro nami. | ✓ |  |  |
| 69 | R55 1.0:G10 |  | Maivo lirala doli si taivo lirala. | ✓ |  |  |
| 70 | R56 1.0:G11 | Despite the resistance, I sing. | Nevi li zeldo, maivo lirala. | ✓ |  | ✓ nevi li zeldo maivo lirala. |
| 71 | R56 1.0:G11 | Although she is cold, she sings. | Nevi saivo ke silisan, saivo lirala. | ✓ |  | ✓ nevi saivo ke silisan saivo lirala. |
| 72 | R57 1.0:G12 | I sing for you. | Maivo lirala vobi taivo. | ✓ |  | ✓ maivo lirala vobi taivo. |
| 73 | R58 1.0:G13 | I also sing. | Tu maivo lirala. | ✓ | ✓ Maivo ata lirala. | ✓ tu maivo lirala. |
| 74 | R59 1.0:G14 |  | Maivo vaku li nela daigoda. | ✓ | ✓ Maivo amora saivo pagopa. |  |
| 75 | R60 1.0:G15 | I didn't manage to sing. | Maivo po ne vazdi lirala. | ✓ |  | ✓ maivo po ne vazdi lirala. |
| 76 | R60 1.0:G15 | I managed not to sing. | Maivo po vazdi ne lirala. | ✓ |  | ✓ maivo po vazdi ne lirala. |
| 77 | R62 1.0:G17 | He came unexpectedly. | Saivo po venreva la vuzinasan. | ✓ |  | ✓ saivo po venreva la vuzinasan. |
| 78 | R63 1.0:G18 |  | Li bumre hozi, vinto Kipo po bumreba ito. | ✓ | ✓ Vinto li bumre hozi, Kipo po bumreba ito. |  |
| 79 | R64 1.0:G19 | The sun shines. | Li sola lumila. | ✓ | ✓ Li sulba lumila. | ✓ li sola lumila. |
| 80 | R64 1.0:G19 |  | Li zarku po venreva. | ✓ | ✓ Li lenra po venreva. |  |
| 81 | R65 1.0:G20 | The rebel left. | Li zeldoyo po pagopa. | ✓ |  | ✗ li zeldoyo po [left]. |
| 82 | R66 1.0:G21 |  | Li sabeyo raho vismava eli, ne yehu vimova li vordu. | ✓ | ✓ Li nela raho lirala ka benasan. |  |
| 83 | R67 1.0:G22 |  | Maivo lirala mufe. | ✓ | ✓ Seye maivo lirala. |  |
| 84 | R68 1.0:G23 |  | Li dapadonu po venreva kroti li foji. | ✓ |  |  |
| 85 | R69 1.2:G24 | Now I sing. | Eli-krono, maivo lirala. | ✓ |  | ✓ eli-krono maivo lirala. |
| 86 | R69 1.2:G24 |  | Saivo po venreva pendi eli-krono. | ✓ |  |  |
| 87 | R70 1.2:G25 | Do you want water or food? | Taivo desida miru oro nami ki? | ✓ |  | ✓ taivo desida miru oro nami ki? |
| 88 | R70 1.2:G25 |  | Oro maivo ke li suma ki? | ✓ |  |  |
| 89 | R71 1.2:G26 | I give the bread to the child. | Maivo donuda li bumre ala li linu. | ✓ | ✓ Maivo donuda li linu li bumre. | ✓ maivo donuda li bumre ala li linu. |
| 90 | R71 1.2:G26 | You owe me two coins. | Taivo guraga maivo dossa cono. | ✓ |  | ✓ taivo guraga maivo dossa conori. |
| 91 | R72 1.2:G27 | Your song is beautiful. | Taivo de lira ka vanisan. | ✓ |  | ✓ taivo de lira ke vanisan. |
| 92 | R72 1.2:G27 | The bread of the city is different from this bread. | Li bumre de li cilni ka sambanasan da eli bumre. | ✓ |  | ✓ li bumre de li cilni ke sambanasan da eli bumre. |
| 93 | R73 1.2:G28 | The two stars shine. | Li dossa veluri lumila. | ✓ |  | ✓ li dossa veluri lumila. |
| 94 | R73 1.2:G28 | The stars shine. | Li veluri lumila. | ✓ | ✗ Li velu lumila. | ✓ li veluri lumila. |
| 95 | R74 1.2:G29 | The brave one sings. | Li corvisan lirala. | ✓ | ✓ Corvisan lirala. | ✓ li corvisan lirala. |
| 96 | R75 1.2:G30 | The stars wrote songs about love. | Li veluri po sarbisia lirari de amor. | ✓ | ✓ Li veluri po sarbisia su amor. | ✓ li veluri po sarbisia lirari de amor. |
| 97 | R76 1.2:G31 |  | Taivo viki pagopa ligo maivo ki, maivo de amor? | ✓ |  |  |
| 98 | R77 1.2:G32 | My father sang. | Pilo de maivo po lirala. | ✓ |  | ✓ maivo de pilo po lirala. |
| 99 | R78 1.2:G33 | I open the door with the key. | Maivo lallela li dorbi yuta li kemye. | ✓ | ✓ Maivo lallela li dorbi ko li kemye. | ✓ maivo lallela li dorbi yuta li kemye. |
| 100 | R78 1.2:G33 | I sing with him. | Maivo lirala ko saivo. | ✓ |  | ✓ maivo lirala ko saivo. |
| 101 | R78 1.2:G33 | The singer healed him with music. | Li lirayo po yugemeyiya saivo yuta melo. | ✓ | ✓ Li lirayo po yugemeyiya saivo ko melo. | ✓ li lirayo po yugemeyiya saivo ko melo. |
| 102 | R79 1.2:G34 | I sing often. | Maivo lirala muya-krono. | ✓ |  | ✓ maivo lirala muya-krono. |
| 103 | R80 1.2:G35 | I recognize you. | Maivo revo-sabesia taivo. | ✓ |  | ✓ maivo revo-sabesia taivo. |
| 104 | R81 1.2:G36 | My daughter sings. | Maivo de minvalinu lirala. | ✓ |  | ✓ maivo de minvalinu lirala. |
| 105 | R83 2.0:G38 |  | Li vanajuba ka vanisan. | ✓ |  |  |
| 106 | R85 2.0:G40 |  | Li amorlumi ka vanisan. | ✓ |  |  |
| 107 | R85 2.0:G40 |  | Li amorlira ka vanisan. | ✓ |  |  |
| 108 | R86 2.0:G41 |  | Li lunoyo lirala. | ✓ |  |  |
| 109 | R87 2.0:G42 |  | Li larbopagosafa ka benasan. | ✓ |  |  |
| 110 | R93 2.1:G48 | May the light hold you. | Li lumi tivrota taivo pifu. | ✓ |  | ✓ li lumi tivrota taivo pifu. |
| 111 | R93 2.1:G48 | If only you had stayed. | Taivo po noma lisrola pifu. | ✓ |  | ✓ taivo po noma lisrola pifu. |
| 112 | R94 2.1:G49 | I sang once. | Maivo po lirala una-krono. | ✓ |  | ✓ maivo po lirala una-krono. |
| 113 | R94 2.1:G49 | How many times did you sing? | Taivo po lirala ki-muya-krono ki? | ✓ |  | ✓ ki-muya-krono taivo po lirala ki? |
| 114 | R95 2.1:G50 | I want you to stay. | Maivo desida fime taivo lisrola. | ✓ | ✓ Maivo desida taivo sidu lisrola. | ✓ maivo desida fime taivo lisrola. |
| 115 | R96 2.1:G51 |  | Saivo buyu lirala. | ✓ | ✓ Saivo buyu vuda lirala. |  |
| 116 | R97 2.1:G52 |  | Li nimu raho maivo po lirala en ito, ka vanisan. | ✓ |  |  |
| 117 | R98 2.1:G53 | One of us will return. | Una de maivori futu relnura. | ✓ |  | ✓ una de maivori futu relnura. |
| 118 | R100 2.1:G55 | I came two days ago. | Maivo po venreva kroti dossa deya. | ✓ |  | ✓ maivo po venreva kroti dossa deya. |
| 119 | R100 2.1:G55 | I will come in three days. | Maivo futu venreva krotiapo tressa deya. | ✓ |  | ✓ maivo futu venreva krotiapo tressa deya. |
| 120 | R101 2.1:G56 | Do not go! | Ne pagopa! | ✓ |  | ✓ ne pagopa! |
| 121 | R101 2.1:G56 | Let us not sing. | Yava ne lirala. | ✓ |  | ✓ yava ne lirala. |
| 122 | R99 2.1:G54 (spec gap) |  | Taivo ke tonsi vanisan fime li veluri lasola. | ✓ | ✗ Taivo ke ola-modo vanisan fime li veluri lasola. |  |
| 123 | R105 2.2:G60 | Where are you going? | Ki-pago taivo pagopa ki? | ✓ |  | ✓ ki-pago taivo roni pagopa ki? |
| 124 | R105 2.2:G60 |  | Ki-kasa taivo po amora maivo? | ✓ |  |  |
| 125 | R105 2.2:G60 | Do you sing? | Taivo lirala ki? | ✓ | ✓ Taivo lirala? | ✓ taivo lirala ki? |
| 126 | R105 2.2:G60 | We do not know what we remember. | Maivori ne sabesia ki-coda maivori ramura. | ✓ | ✓ Maivori ne sabesia ki-coda maivori ramura ki. | ✓ maivori ne sabesia ki-coda maivori ramura. |
| 127 | R106 2.2:G61 | How beautiful the night is! | Li nullo ka ki-modo vanisan! | ✓ | ✓ Li nullo ka ki-modo vanisan? | ✓ li nullo ke ki-modo vanisan! |
| 128 | R106 2.2:G61 | What a night! | Ki-eli nullo! | ✓ | ✓ Ki-pago taivo pagopa! | ✓ ki-eli nullo! |
| 129 | R107 2.2:G62 |  | Si maivo ke tonsi lukasan, maivo futu ne salrusia. | ✓ |  |  |
| 130 | R107 2.2:G62 | Therefore I sing. | Tonsi, maivo lirala. | ✓ |  | ✓ tonsi maivo lirala. |
| 131 | R108 2.2:G63 |  | Maivo futu donuda ito biti de lalfo, fime taivo nosi semnesia ko maivo en moluvaye. | ✓ |  |  |
| 132 | R109 2.2:G64 | I sing what you love. | Maivo lirala raho taivo amora. | ✓ | ✓ Raho lirala? | ✓ maivo lirala raho taivo amora. |
| 133 | R110 2.2:G65 | It is very easy to resist change. | Ito ke ruli levasan sidu zeldoza trana. | ✓ | ✓ Ito ke sidu levasan. | ✓ ito ke ruli levasan sidu zeldoza trana. |
| 134 | R111 2.2:G66 |  | Kroti maivo lesvu taivo ke li sevusan ruhe. | ✓ |  |  |
| 135 | R112 2.2:G67 | The bird sits behind the home. | Li lavra semnesia nazru li nimu. | ✓ |  | ✓ li lavra semnesia nazru li nimu. |
| 136 | R112 2.2:G67 | He sings beside the river. | Saivo lirala silda li mirunulu. | ✓ |  | ✓ saivo lirala silda li mirunulu. |
| 137 | R114 2.3:G69 | The enemy came. | Li zarku po venreva. | ✓ |  | ✓ li zarku po venreva. |
| 138 | R115 2.3:G70 | The frog croaks. | Li kerku kerkuka. | ✓ |  | ✓ li kerku kerkuka. |
| 139 | R115 2.3:G70 | The bear sleeps. | Li bumbo somusia. | ✓ |  | ✓ li bumbo somusia. |
| 140 | R116 2.3:G71 | The wolf hunts in a pack. | Li farvibudi farvibudifa. | ✓ | ✓ Li larbopagobudi larbopagobudila. | ✓ li farvibudi farvibudifa. |
| 141 | R117 2.3:G72 |  | Ata maivo lemula saivo de sizosan lumi. | ✓ |  |  |
| 142 | R118 2.3:G73 | She spoke in a musical voice. | Saivo po senosia en baba melosan valla. | ✓ |  | ✓ saivo po senosia en baba melosan valla. |
| 143 | R119 2.3:G74 | Who can know a more powerful peace? | Raho povi sabesia baba kasi polvasan sove ki? | ✓ | ✓ Raho povi sabesia baba kasi polvasan sove? | ✓ ki-nela povi sabesia baba kasi polvasan sove ki? |
| 144 | R120 2.3:G75 |  | Taivo ne taro-pagopa. | ✓ | ✓ Maivo taro-lirala. |  |
| 145 | R121 2.3:G76 | Which song do you love? | Taivo amora ki-eli lira ki? | ✓ | ✓ Ki-eli lira taivo amora? | ✓ ki-eli lira taivo amora ki? |

## Phase 3: lexicon integrity

**Words in shipped Liraasa text the editor cannot read** (lexicon examples, ruling, function-word and particle examples, the corpus, the author's song, the album read today, the editor's sample songbook):

- `yo` (unknown, ×1): lexicon examples[203]
- `vu` (unknown, ×1): lexicon examples[204]
- `bumrena` (unused, ×4): data/corpus/bumrepago_2_3/bumrepago.txt:54, data/corpus/bumrepago_2_3/bumrepago.txt:162, data/corpus/bumrepago_2_3/bumrepago.txt:164, data/corpus/bumrepago_2_3/bumrepago.txt:377
- `tabuasa` (unused, ×1): data/corpus/bumrepago_2_3/bumrepago.txt:113
- `bumreasa` (unused, ×2): data/corpus/bumrepago_2_3/bumrepago.txt:113, data/corpus/bumrepago_2_3/bumrepago.txt:457
- `bumreasasan` (unused, ×2): data/corpus/bumrepago_2_3/bumrepago.txt:118, data/corpus/bumrepago_2_3/bumrepago.txt:455

**Shared senses:** birth: kronobio, linuvenre; spring: faji, mirufonte; source: fonte, sernafonte

**Near-homophones (roots one edit apart):** sora/sola (close sounds), buza/cuza, devo/devi, maivo/mavo, malo/mavo, malo/melo, haza/hata, mera/vera, fojo/foji, foji/faji, foji/boji, doza/goza, solma/sola, solo/sola, sovla/sola, desi/devi

**Retired spellings in code and documents.** Only where they are not history by design: the guide's 'Reading older texts' list (K15), the protected-exception list (K16), the mislabelled corpus lines (L01), daigozayu's note (L04). The other 67 files that name a retired spelling are changelogs, ADRs, the album as recorded, and tests of the legacy readers: their old spellings are deliberate.

**Did auto-correct migrate them?** No migration runs on stored writings when an edition changes (K13). The checker flags each old spelling (1.0:G19) with its current spelling as an automatic fix, now including an old spelling with -ri/-ti; the editor corrects every writing only after a rename in Learn's roots tool.

**Ascended forms** (93 whose gloss reads nothing sacred by a keyword test; 23 sacred concepts with no ascended form): see G03. Sacred concepts without -asa: volme (ghost; spirit of the dead; phantom; apparition), luminela (priest; a person of light), larbonela (dryad; tree spirit), zayulazu (familiar; a spirit-animal companion), lavbulira (hymn; psalm), lavbuseno (mantra; a sacred word chanted), nullolavbu (vigil; night prayer), jubaseno (benediction; a blessing spoken aloud), belfiseno (creed; confession of faith), lumitelne (gospel; sacred story), lumimiru (holy water), ralnolansi (fallen angel; devil), sasvalansi (guardian angel), lavburinba (prayer beads; rosary), lansinalfa (angel’s wing), mernolavbu (morning prayer; matins), sevuvolme (a sea-spirit; the ghost of the drowned), vesnolavbu (evening prayer; vespers), lavbusolo (idol; a stone carved for worship), zefronela (sylph; an air spirit), lardadevi (a Muse; the goddess of an art), mavolumitali (pouring one's soul into one's work), lardayalmu (the fire in art; soul-stirring intensity).

**Compounds whose parts are not headwords:** none (headwords, attested image compounds, listed derivations).

## Phase 6: the album against the 2.3 spec

Each line read today (its current spelling), through the checker. Not judged: each is a place where the album and the current grammar differ.

| Line | Reading | Rule | Finding | Text |
| --- | --- | --- | --- | --- |
| 08:15 | AR-10 | sidu | sidu never follows a copula: “ke sidu” is not grammar (whether it can mean “destined to” is an open question). Use a modal (musi) or an adjective + sidu (2.2:G6 | si maivo ke sidu daigoda, maivo kopi daigoda en saivo de varori. |

