# Liraasa 0.8 → 1.0 — Final Editorial Report

All figures below are computed from the finished artifacts (`liraasa_1_0.json`, `validation_1_0.json`, `stats_1_0.json`, `comparison_1_0.json`) by `build_docs.py`.

## 1. Counts

| Measure | 0.8 | 1.0 |
|---|---|---|
| Primal roots | 421 | 386 |
| Compounds | 548 | 713 |
| Headwords | 969 | 1099 |
| Function words (excluding pronouns, correlatives, numbers, time words) | 123 | 149 |

- Primal roots **retired**: 63 (62 replaced by new two-root compounds, 1 merged into an existing compound).
- Primal roots **respelled** (same meaning, defective spelling): 7 — burla→sirla, yoga→yomla, mine→milve, lame→lenyo, deyu→feyu, desa→lesma, molta→molfa.
- **New** primal roots: 28 — dorva, duvla, gulma, harlu, hirna, kaldo, kende, lumra, mufra, musva, nenga, nerpo, nevra, nosvo, pavru, semvi, simvo, tavre, tekla, tilma, turna, vazra, visma, vopra, vordu, yordo, zeldo, zonra.
- Final active primal roots: 386 = 421 − 63 + 28 (respellings are one-for-one).
- **Reclaimed spellings**: 63 retired roots leave the active inventory, plus 7 respelled forms. **Reassigned spellings: 0.** All are reserved (version gating, G19); retired roots may be reused from 2.0, respelled ones never. The freed space was reinvested through new coinages in released neighbourhoods: *feyu* sits one edit from the retired *deyu*, *molfa* from *molta*, and 0.8's proximity rule would have blocked both.
- **New grammatical words**: 27 (tu, yesta, pendi, vinto, hozi, sabri, korsi, tonsi, narli, ki-oro, dagi, noma, tosu, tavki, hiro, teki, telvo, vazdi, fesmo, lesvu, tekvu, hoyo, yasmo, zafra, finra, lanto, kenvi); **redefined**: 5 (kopi, nosi, musi, ata, si); retired: *grasia* (historical only) and the motion prefixes lu-, nu-, mi-, so-.
- **New compounds**: 170 — 62 replacing retired roots, 96 from the 0.9 storytelling list, 12 closing 0.8 vocabulary gaps (milk, egg, meat, wood, throat, bruise, interest, border, hypothesis, conclusion, kinship, licence).
- **Existing compounds rewritten**: 2 (mudubede→mudusomubiti, nehohavli→moluhavli); **archived** with a replacement phrase: 5; **redefined**: 3 (nevlosolo, kronobelda, marelirbu); **merged**: ruhesonbu absorbs tulru.
- **Broken references corrected**: 0 active compounds depend on a retired root (check 24); 509 legacy spellings map to an active 1.0 form (check 23); 14 examples migrated, 5 marked historical.

## 2. Dispositions (no open items)

| Source | Total | Result |
|---|---|---|
| Retirement audit | 182 | {'KEEP': 115, 'RETIRE': 62, 'REPLACE': 4, 'MERGE': 1} |
| Storytelling proposals | 150 | {'ARCHIVE': 1, 'ADD': 107, 'REPLACE': 11, 'REJECT': 9, 'MERGE': 5, 'REDEFINE': 2, 'KEEP': 15} |
| 0.8 Root Review queue | 40 | {'KEEP': 23, 'RETIRED': 10, 'REPLACE': 7} |
| Unresolved 0.5 compounds | 3 | {'REDEFINE': 3} |

The eight 0.8 open questions are closed in `settled_open_questions_0_8`: ordinals and fractions are canon; motion prefixes are a closed list; derivations never combine with forms; transitivity is usage-based; every headword carries `protected: true`.

Against the 50–100 target: 63 retirements. Tier A yielded 39 of 61 retirements; of the other 22, *yoga* was respelled and 21 were kept because they fail on fidelity (*damvabalbu* "broken leg" for knee, *vimomomvi* "blindness" for vanishing, *masuseno* "question-word" for answer), frequency (morning, evening, hear, fall), or song attestation. Tier B gave 1 (forest) and Tier C gave 23 (22 retired, 1 merged) where the compound is genuinely transparent. Several audit compounds were corrected rather than accepted: the head must be the category (*rivorelnu* not *relnurivo*; *renlimomvi* not *momvimiru*; *buvokova* not *kovamiru*; *bitifarla* not *farlabiti*).

## 3. Validation

24 of 24 checks pass, 0 fail, 0 warnings. The validator ran on the lexicon, 447 example sentences, the six migrated songs, the 113-sentence demonstration corpus and the 103 examples of the grammar guide.

| # | Check | Result |
|---|---|---|
| 1 | Duplicate headwords | PASS |
| 2 | Root collisions (a root equals another headword's form) | PASS |
| 3 | Collisions among all seven-form derivatives and -yo/-vu/-pago derivations | PASS |
| 4 | Function-word, pronoun, correlative, number and time-word collisions with lexical forms | PASS |
| 5 | Phonotactics of new and respelled roots and new function words | PASS |
| 6 | Syllable structure and stress (roots ≥2 syllables, vowel-final except protected amor/apok heads) | PASS |
| 7 | Compound well-formedness (two active components, MODIFIER+HEAD spelling) | PASS |
| 8 | Compound dependency cycles | PASS |
| 9 | Required metadata (and no unresolved glosses) | PASS |
| 10 | Seven forms follow the rules (incl. verb rule) | PASS |
| 11 | Register labels | PASS |
| 12 | Every 0.8 headword is carried unchanged or has a recorded disposition | PASS |
| 13 | Reserved (retired/respelled) spellings are not reused by any active item | PASS |
| 14 | Examples and corpus contain no unknown words | PASS |
| 15 | No retired or respelled spellings in live examples and corpus | PASS |
| 16 | Duplicate root glosses (editorial review) | PASS |
| 17 | Compound segmentation ambiguity (more than one valid two-part split) | PASS |
| 18 | New roots and particles are at least two edits from every active spelling | PASS |
| 19 | New monosyllabic particles: one-edit neighbours only where declared and positionally distinct | PASS |
| 20 | New particles cannot be read as a lexical form or a suffix | PASS |
| 21 | Clause grammar: operator order, one evidential, attitude/status/ki clause-final, exclusions | PASS |
| 22 | Every candidate has one final disposition (182 audit, 150 storytelling, 40 review, 3 unresolved); no TBD | PASS |
| 23 | Migration table maps every retired form to an active 1.0 form | PASS |
| 24 | No active compound depends on a retired or respelled primitive | PASS |

Not executed: listening or singing tests (no audio was produced), and a check of the 0.8 play *Bumrepago* and story *Narvolore*, whose texts were not supplied. Run `migrate_text.py` and `validate.py` on them when available.

## 4. Word length and particle frequency

| Metric | 0.8 | 1.0 |
|---|---|---|
| Mean syllables, primal root | 2.05 | 2.044 |
| Mean syllables, compound | 4.051 | 4.058 |
| Mean syllables, all headwords | 3.182 | 3.35 |
| Compound lengths (syllables: count) | {'4': 520, '5': 28} | {'4': 673, '5': 39, '6': 1} |
| Rhyme families (last four letters) | 420 | 387 |
| Families with ≥3 members | 53 | 82 |
| Headwords in a ≥3 family | 569 | 735 |
| Vowel share a/e/i/o/u % | 23.6/21.7/16.3/20.4/18.1 | 24.1/21.4/16.6/20.2/17.7 |
| Primal roots fitting the new-root template | 92.2% | 92.7% |

Each retirement replaces a 2.06-syllable root with a 4.05-syllable compound on average.

| Corpus metric | Songs 0.8 | Songs 1.0 | 0.8 examples | 1.0 demo corpus |
|---|---|---|---|---|
| Words | 1394 | 1355 | 1629 | 1107 |
| Syllables per word | 2.607 | 2.618 | 2.468 | 2.298 |
| Syllables per clause | 7.1 | 7.11 | 7.13 | 9.71 |
| Closed-class tokens per 100 words (incl. pronouns) | 56.7 | 57.9 | 58.7 | 67.8 |
| Preverbal operators per 100 words | 4.2 | 4.4 | 6.9 | 11.1 |
| po per 100 words | 1.8 | 1.8 | 4.1 | 5.1 |

Most frequent operator sequences in the 1.0 demo corpus: *po ne* (8), *po noma* (6), *ne ne* (3), *po viki* (3), *po reve* (3), *po tavki* (2).

## 5. Musicality trade-offs (measured vs judged)

*Measured.* The songs barely move: 2.607 → 2.618 syllables per word, because roots that carry sung lines were kept and only 11 lines changed. Across the lexicon, mean headword length rises from 3.182 to 3.35 syllables, the honest cost of retiring 63 short roots and adding 170 compounds. Rhyme families with three or more members rose from 53 to 82, because new compounds share heads (-biti, -kova, -velma, -seno, -valmi). The vowel balance is essentially unchanged.

*Measured.* The 1.0 demo corpus carries 11.1 preverbal operators per 100 words against 6.9 in the 0.8 examples. That corpus was written to stress-test the operators, so it is denser than ordinary prose will be; it is still the main musical risk of 1.0. The most common new pair is *po noma*: two light syllables before the modal. Keep it unstressed and quick, as 0.8 already advises for *po*.

*Judged, not measured.* The new particles were chosen to stay out of the rhythm's way: mostly two light syllables with the stress on the first (*TAV-ki*, *HI-ro*, *TEL-vo*, *VAZ-di*), so in *Maivo po tavki ralnora* the beats still fall on content words. The harder sounds (*tekvu*, *fesmo*, *zafra*, *kenvi*) sit in dramatic meanings: prevention, failure, suddenness.

## 6. Major gains in precision

Ability, possibility and permission are now three words (*povi*, *nosi*, *dagi*). Causing, letting and preventing are parallel operators. Deliberate and accidental come from one root (*dorva*). An open past condition is told apart from a counterfactual (*noma*). Inference is an evidential (*tosu*), and with *seye* gives logical 'must'. Beginning, stopping, trying, managing, failing and nearly-happening are single words. Topic, focus, surprise and shared knowledge are marked. Logic has explicit *except*, *instead*, *therefore*, *nevertheless*, *whether*, *only if*, *even if* and *iff*. Abstract roots for cause, effect, possibility, likelihood, permission, duty, resistance, relation, goal and identity give philosophy and argument their own vocabulary.

## 7. Deliberate breaking changes from 0.8

1. 63 primal roots and their 441 forms leave the active lexicon; 7 roots are respelled. Old text is read under 0.8 (G19) and `migrate_text.py` converts it.
2. *si* is only 'if'; 'whether' is *ki-oro*.
3. *ata* is only 'and'; 'also' is *tu*.
4. *nosi* is only 'might'; permission is *dagi*.
5. *kopi* is only 'hope to'; intention is *dorvada sidu*.
6. *musi* is not logical 'must'; use *tosu … seye*.
7. The 0.8 counterfactual pattern *si po … viki po* is replaced by *si … po noma …, … po viki …*.
8. Motion prefixes lu-, nu-, mi-, so- are retired.
9. Attitude words are strictly clause-final, and non-final relative clauses are closed by a pause.
10. Three 0.5 compounds receive new literal meanings; their old song senses are archived as unknown.

## 8. Files

| File | What it is |
|---|---|
| liraasa_1_0.json | single source of truth |
| Liraasa_1_0_Grammar_Guide.docx | complete, self-contained grammar |
| Liraasa_1_0_Lexicon.xlsx | lexicon workbook (generated) |
| Liraasa_0_8_to_1_0_Migration.xlsx | every retirement, respelling, disposition and form mapping |
| Liraasa_1_0_Particle_Codex.md | every operator: meaning, slot, scope, stacking, negation, examples |
| Liraasa_1_0_LLM_Quickstart.md, liraasa_1_0_quickstart.json | compact guide for other models |
| Liraasa_1_0_Demonstration_Corpus.md | ten passages, back-translations, comparison and repairs |
| validation_1_0.json, stats_1_0.json | raw results |
| tools/ | build, validate, migrate, gloss, compare, stats, workbook and document generators |
| corpus/ | demo passages, 0.8 songs and their 1.0 editions |

To rebuild everything, run `tools/rebuild_all.sh` (see `tools/README.md`).
