# Liraasa 1.0 — Particle Codex

Every grammatical operator added or redefined in 1.0: 27 new words and 5 redefined 0.8 words. Spellings, slots and examples come from `liraasa_1_0.json`; every example passes `validate.py` (unknown words, clause order, exclusions).

## How operators combine

**One order.** [FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]

**Scope.** Every preverbal operator scopes over everything to its right (G1). The pre-constituent words ne, doli, tu, yesta, pendi, vinto scope over the single constituent that follows them.

**One word per slot.** Never together: hiro + roni; hiro + tefa; teki + roni; teki + tefa; telvo + tefa; vazdi + tefa; fesmo + tefa; zoke + seye; zoke + mufe; zoke + poye; zoke + pifu; tavki + fututi; hoyo + yasmo.

**Negation.** ne before an operator negates the operator; ne after it negates the event (G15).

**Valency.** vaku, lesvu and tekvu fill the main verb slot; the actor follows with its own [ne] [phase] [effort] VERB. Tense, modal and evidential belong to the main clause (G14).

**Density.** Four preverbal operators is a practical ceiling; split longer clauses.

## Slot map

| # | Slot | Words |
|---|---|---|
| 1 | FRAME | time words, correlatives of time, zafra, finra, lanto, kenvi |
| 2 | TOPIC | NP + hozi |
| 3 | SUBJECT | noun phrase, pronoun |
| 4 | TENSE | po, futu, pressa |
| 5 | REALITY | noma |
| 6 | NEGATION | ne |
| 7 | MODAL | povi, nosi, dagi, musi, suvi, viki, kopi |
| 8 | APPROACH | tavki, fututi |
| 9 | PHASE | hiro, teki |
| 10 | EFFORT | telvo, vazdi, fesmo |
| 11 | ASPECT | roni, tefa, sahi |
| 12 | ITERATION | bodu, reve, loki |
| 13 | EVIDENTIAL | yehu, gesu, bisu, vuda, buyu, tosu |
| 14 | VERB | any verb form, copulas ke ka kapoki loya miyo, valency operators vaku lesvu tekvu (+ ACTOR + embedded verb), gome (+ verb) |
| 15 | OBJECT | noun phrase |
| 16 | ADJUNCTS | prepositional phrases, la + adjective, vobi NP, sabri NP, korsi NP |
| 17 | RECIPROCAL | fuyi |
| 18 | STATUS | hoyo, yasmo |
| 19 | ATTITUDE | seye, mufe, poye, pifu, zoke |
| 20 | QUESTION | ki |

## Scope and focus

### tu

**Meaning.** also; too (additive focus)  
**Class / position.** scope — before its constituent  
**Scope.** the single constituent that follows  
**With negation.** ne tu X = not X as well (rare); tu ne X = X is also not the case  
**With tense, aspect, mood.** independent of tense/aspect  
**Stacking and restrictions.** one scope word per constituent: not combined with doli or yesta on the same phrase  
**Existing alternative.** 0.8 used ata for 'also', which made 'Maivo ata lirala' ambiguous between 'and I sing' and 'I also sing'  
**New capability.** additive focus separated from coordination; ata is now only 'and'  
**Pronunciation.** single unstressed syllable, said lightly

| Liraasa | English |
|---|---|
| *Tu Kipo po bumreba.* | Kipo baked too. |
| *Kipo po bumreba tu li manlibumre.* | Kipo baked the dough too. |

### yesta

**Meaning.** even (scalar focus: the least expected member)  
**Class / position.** scope — before its constituent  
**Scope.** the constituent that follows: noun phrase, verb, adjective, or a si-clause (yesta si = even if)  
**With negation.** ne yesta V = not even V  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** one focus word per constituent; may co-occur with tu elsewhere in the clause  
**Existing alternative.** none in 0.8  
**New capability.** scalar focus; concessive conditional 'even if' by composition  
**Pronunciation.** yes-ta, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Yesta Dorin po resora.* | Even Dorin laughed. |
| *Yesta si taivo tavreta, maivo futu pagopa.* | Even if you refuse, I will go. |

### pendi

**Meaning.** exactly; precisely  
**Class / position.** scope — before its constituent  
**Scope.** the number, quantity or time/place word that follows  
**With negation.** ne pendi dossa = not exactly two  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** excludes lusu, mosa, gase on the same number  
**Existing alternative.** none; 0.8 could only say doli (only)  
**New capability.** precise quantities and times; with lusu/mosa/gase (G9) completes 'at least / at most / about / exactly'  
**Pronunciation.** pen-di, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Taivo guraga maivo pendi dossa cono.* | You owe me exactly two coins. |
| *Saivo po venreva pendi eli-krono.* | They arrived exactly now. |

### vinto

**Meaning.** narrow focus: it is X (and not something else) that…  
**Class / position.** scope — before its constituent  
**Scope.** the constituent that follows  
**With negation.** ne vinto X, nara Y = it is not X but Y (corrective with focus)  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** one per clause; never on the same constituent as hozi (G18)  
**Existing alternative.** 0.8 corrective cleft 'Ne X, nara Y' only works with a contrast stated  
**New capability.** narrow and contrastive focus without restating the alternative  
**Pronunciation.** vin-to, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Vinto Kipo po bumreba li bumre.* | It was KIPO who baked the bread. |
| *Kipo po bumreba vinto li bumre.* | Kipo baked the BREAD. |

## Topic

### hozi

**Meaning.** topic: as for X; two parallel hozi-phrases mark contrastive topics  
**Class / position.** topic — after a clause-initial noun phrase, followed by a pause  
**Scope.** the clause-initial noun phrase it follows; that phrase is then resumed by a pronoun or left implicit  
**With negation.** not negatable (a topic is not asserted)  
**With tense, aspect, mood.** none  
**Stacking and restrictions.** at most one per clause; two parallel clauses with hozi = contrastive topics  
**Existing alternative.** none  
**New capability.** topic and contrastive topic for dialogue and argument  
**Pronunciation.** ho-zi, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Li bumre hozi, Kipo po bumreba ito.* | As for the bread, Kipo baked it. |
| *Kipo hozi, saivo lirala; Dorin hozi, saivo resora.* | Kipo sings; Dorin, on the other hand, laughs. |

## Logic and linking

### sabri

**Meaning.** except; excluding; except that  
**Class / position.** preposition / conjunction — before a noun phrase or clause  
**Scope.** following noun phrase, or a fime-clause (sabri fime = except that)  
**With negation.** ne sabri X = including X (avoid; prefer ata tu X)  
**With tense, aspect, mood.** a sabri fime clause marks its own tense  
**Stacking and restrictions.** one per phrase  
**Existing alternative.** none  
**New capability.** exceptions in law, logic and everyday speech  
**Pronunciation.** sab-ri, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Toda-nela po venreva sabri Dorin.* | Everyone came except Dorin. |

### korsi

**Meaning.** instead of; rather than; instead  
**Class / position.** preposition / conjunction — before a noun phrase; or clause-initial  
**Scope.** as a preposition: the following noun phrase (instead of / rather than); clause-initial: the whole clause (instead)  
**With negation.** korsi ne X = instead of not doing X (avoid)  
**With tense, aspect, mood.** clause-initial korsi does not affect tense  
**Stacking and restrictions.** one per clause  
**Existing alternative.** none  
**New capability.** substitution: B in place of A  
**Pronunciation.** kor-si, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po sapusia bumre korsi yugenami.* | I ate bread instead of meat. |
| *Korsi, maivo po lisrola.* | Instead, I stayed. |

### tonsi

**Meaning.** therefore; so (logical consequence)  
**Class / position.** connector — clause-initial  
**Scope.** the whole clause it opens; links it to the preceding clause or sentence as a logical consequence  
**With negation.** tonsi … ne … = therefore not …  
**With tense, aspect, mood.** clause keeps its own tense  
**Stacking and restrictions.** does not combine with narli; may follow si in a then-clause  
**Existing alternative.** kasa (because) runs the other way; kopisa (so that) is purpose  
**New capability.** explicit inference marker for argument  
**Pronunciation.** ton-si, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Li bumre farufa; tonsi, li cemopago ke sumasan.* | The bread is burning; therefore the kitchen is hot. |

### narli

**Meaning.** nevertheless; even so  
**Class / position.** connector — clause-initial  
**Scope.** the whole clause it opens  
**With negation.** narli … ne … = nevertheless not …  
**With tense, aspect, mood.** clause keeps its own tense  
**Stacking and restrictions.** does not combine with tonsi  
**Existing alternative.** nevi (although) subordinates; nara (but) coordinates  
**New capability.** concession stated after the fact, between sentences  
**Pronunciation.** nar-li, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Saivo po tavreta. Narli, maivo po lisrola.* | They refused. Nevertheless, I stayed. |

### ki-oro

**Meaning.** whether (or not)  
**Class / position.** complementizer — introduces an embedded yes/no question  
**Scope.** introduces an embedded yes/no question; no final ki  
**With negation.** ki-oro taivo ne relnura = whether you won't return  
**With tense, aspect, mood.** the embedded clause marks its own tense  
**Stacking and restrictions.** like fime  
**Existing alternative.** 0.8 si meant both 'if' and 'whether'  
**New capability.** removes the if/whether ambiguity (G2)  
**Pronunciation.** ki-o-ro, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo masuma ki-oro taivo futu relnura.* | I'm asking whether you'll come back. |

## Modality and reality

### dagi

**Meaning.** be allowed to; may (permission)  
**Class / position.** modal — modal slot  
**Scope.** modal slot; the event that follows  
**With negation.** ne dagi = not allowed (forbidden); dagi ne V = allowed not to V (V is optional)  
**With tense, aspect, mood.** after tense and noma; before approach/phase/effort  
**Stacking and restrictions.** one modal per clause  
**Existing alternative.** nosi in 0.8 covered both 'might' and 'may'  
**New capability.** social permission distinct from possibility (nosi) and ability (povi) (G3)  
**Pronunciation.** da-gi, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Taivo dagi lisrola.* | You may stay (you are allowed to). |
| *Taivo ne dagi pagopa.* | You may not leave. |

### noma

**Meaning.** counterfactual: the clause is contrary to fact  
**Class / position.** reality — right after tense, before ne  
**Scope.** the whole clause: marks it as contrary to fact  
**With negation.** po noma ne V = had not V-ed (but did)  
**With tense, aspect, mood.** after tense; with po = past counterfactual; with a modal: po noma suvi (should have), po noma povi (could have)  
**Stacking and restrictions.** one per clause; usually in the si-clause and/or with viki in the consequence  
**Existing alternative.** 0.8 'si po … viki po' could not tell an open past condition ('if I asked — maybe I did') from a counterfactual  
**New capability.** counterfactuals, unrealised possibilities and regret (G6)  
**Pronunciation.** no-ma, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po noma suvi lirala.* | I should have sung (but I didn't). |
| *Si taivo po noma masuma, maivo po viki relsira.* | If you had asked, I would have answered. |

## Evidence

### tosu

**Meaning.** inferred from evidence  
**Class / position.** evidential — evidential slot  
**Scope.** evidential slot; the proposition  
**With negation.** ne tosu V = I do not infer that V (rare); tosu ne V = I infer that not V  
**With tense, aspect, mood.** after aspect, right before the verb  
**Stacking and restrictions.** one evidential per clause; with seye = 'must have' (G4); with mufe = 'probably, judging by'  
**Existing alternative.** none: 0.8 evidentials covered seen, heard, felt, dreamed and reported  
**New capability.** evidence-based inference, and epistemic 'must'  
**Pronunciation.** to-su, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Kipo po tosu bumreba seye.* | Kipo must have baked (I can tell from the evidence). |
| *Po tosu renlira.* | It rained (judging by what I see). |

## Event structure

### tavki

**Meaning.** almost; nearly (the event came close but did not happen)  
**Class / position.** approach — approach slot  
**Scope.** approach slot; the event that follows  
**With negation.** po ne tavki ralnora = did not almost fall (came nowhere near)  
**With tense, aspect, mood.** with po: almost did; with futu: will nearly  
**Stacking and restrictions.** excludes fututi (same slot); combines with tefa: tavki tefa = had almost finished  
**Existing alternative.** none  
**New capability.** near-realisation  
**Pronunciation.** tav-ki, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po tavki ralnora.* | I almost fell. |

### hiro

**Meaning.** begin to (inceptive)  
**Class / position.** phase — phase slot  
**Scope.** phase slot; the event that follows  
**With negation.** po ne hiro lirala = did not begin to sing; po hiro ne lirala = began not singing (fell silent)  
**With tense, aspect, mood.** excludes roni and tefa (G16); combines with reve (began again), bodu (already began), sahi (habitually begins)  
**Stacking and restrictions.** excludes teki  
**Existing alternative.** 0.8 'lombila sidu V' (still valid, longer)  
**New capability.** inceptive aspect in one word  
**Pronunciation.** hi-ro, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Li veluri po hiro lirala.* | The stars began to sing. |

### teki

**Meaning.** stop; cease doing (cessative)  
**Class / position.** phase — phase slot  
**Scope.** phase slot; the event that follows  
**With negation.** po ne teki resora = did not stop laughing  
**With tense, aspect, mood.** excludes roni and tefa  
**Stacking and restrictions.** excludes hiro; tekvu is the transitive 'prevent'  
**Existing alternative.** tekla (root) is physical halting: Teklata! Stop!  
**New capability.** cessative aspect  
**Pronunciation.** te-ki, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Kipo po teki resora.* | Kipo stopped laughing. |

### telvo

**Meaning.** try to (outcome open)  
**Class / position.** effort — effort slot  
**Scope.** effort slot; the event that follows; outcome left open  
**With negation.** po ne telvo = did not try  
**With tense, aspect, mood.** excludes tefa  
**Stacking and restrictions.** excludes vazdi and fesmo  
**Existing alternative.** telbata sidu V (verb chain, still valid)  
**New capability.** conative in one word  
**Pronunciation.** tel-vo, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po telvo lirala.* | I tried to sing. |

### vazdi

**Meaning.** manage to; succeed in  
**Class / position.** effort — effort slot  
**Scope.** effort slot; success after difficulty  
**With negation.** po ne vazdi V = did not manage to V; po vazdi ne V = managed not to V (G15)  
**With tense, aspect, mood.** excludes tefa  
**Stacking and restrictions.** excludes telvo and fesmo  
**Existing alternative.** none  
**New capability.** achievement distinct from completion (tefa)  
**Pronunciation.** vaz-di, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Saivo po vazdi hirnaha.* | They managed to escape. |

### fesmo

**Meaning.** try and fail to  
**Class / position.** effort — effort slot  
**Scope.** effort slot; attempt that failed  
**With negation.** po ne fesmo = did not fail to (avoid; use vazdi)  
**With tense, aspect, mood.** excludes tefa  
**Stacking and restrictions.** excludes telvo and vazdi  
**Existing alternative.** none  
**New capability.** failed attempt in one word  
**Pronunciation.** fes-mo, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po fesmo relsira.* | I tried to answer but couldn't. |

## Valency

### lesvu

**Meaning.** let; allow (permissive)  
**Class / position.** valency — verb slot: CAUSER lesvu ACTOR VERB  
**Scope.** verb slot of the main clause: CAUSER lesvu ACTOR [ne] [phase] [effort] VERB  
**With negation.** ne lesvu = did not let; lesvu X ne V = let X not V  
**With tense, aspect, mood.** tense, modal and evidential belong to the main clause only (G14)  
**Stacking and restrictions.** parallel to vaku and tekvu; one valency operator per clause (chains need sidu)  
**Existing alternative.** none  
**New capability.** permissive causation  
**Pronunciation.** les-vu, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po lesvu saivo pagopa.* | I let them leave. |

### tekvu

**Meaning.** prevent from; stop someone doing  
**Class / position.** valency — verb slot: CAUSER tekvu ACTOR VERB  
**Scope.** verb slot of the main clause: CAUSER tekvu ACTOR VERB  
**With negation.** ne tekvu = did not prevent  
**With tense, aspect, mood.** as lesvu  
**Stacking and restrictions.** as lesvu  
**Existing alternative.** vaku X ne V (made X not V) is weaker: it does not imply X was going to V  
**New capability.** preventive causation  
**Pronunciation.** tek-vu, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Maivo po tekvu saivo pagopa.* | I prevented them from leaving. |

## Discourse status

### hoyo

**Meaning.** mirative: newly discovered or surprising to the speaker  
**Class / position.** discourse status — after the predicate, before certainty  
**Scope.** the whole clause; speaker has just discovered it or finds it surprising  
**With negation.** not negatable; negate the clause itself  
**With tense, aspect, mood.** any tense  
**Stacking and restrictions.** before the attitude marker; excludes yasmo  
**Existing alternative.** none (0.8 could only add Vera ki?)  
**New capability.** mirative: newly discovered information  
**Pronunciation.** ho-yo, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Li dorbi ke lallesan hoyo!* | The door is open — I didn't know! |

### yasmo

**Meaning.** as is known; shared knowledge  
**Class / position.** discourse status — after the predicate, before certainty  
**Scope.** the whole clause; presented as already known to speaker and hearer  
**With negation.** not negatable  
**With tense, aspect, mood.** any tense  
**Stacking and restrictions.** before the attitude marker; excludes hoyo; combines with zoke for sarcasm  
**Existing alternative.** '…, taivo sabesia ki?' (you know?) asks; yasmo asserts  
**New capability.** shared-knowledge marking  
**Pronunciation.** yas-mo, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Kipo ne bumreba yasmo.* | Kipo doesn't bake, as we all know. |

## Narrative frame

### zafra

**Meaning.** suddenly (abrupt onset)  
**Class / position.** frame — clause-initial frame slot  
**Scope.** frame slot (clause-initial); the event of the clause  
**With negation.** Zafra, … ne … = suddenly … not …  
**With tense, aspect, mood.** independent; often with frame tense  
**Stacking and restrictions.** one frame adverb per clause  
**Existing alternative.** la velbisan (quickly) is speed, not abruptness  
**New capability.** abrupt onset  
**Pronunciation.** zaf-ra, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Zafra, li dorbi po lallela.* | Suddenly the door opened. |

### finra

**Meaning.** finally; at last (after delay or effort)  
**Class / position.** frame — clause-initial frame slot  
**Scope.** frame slot  
**With negation.** as zafra  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** one frame adverb per clause  
**Existing alternative.** tefa (completed) is aspect, not culmination  
**New capability.** 'at last' after delay or effort  
**Pronunciation.** fin-ra, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Finra, saivo po relnura.* | At last they came back. |

### lanto

**Meaning.** eventually (after time has passed)  
**Class / position.** frame — clause-initial frame slot  
**Scope.** frame slot  
**With negation.** as zafra  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** one frame adverb per clause  
**Existing alternative.** futupago (someday) points to an unknown future; lanto narrates a realised later event  
**New capability.** 'eventually' in narration  
**Pronunciation.** lan-to, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Lanto, li renli po teki renlira.* | Eventually the rain stopped. |

### kenvi

**Meaning.** immediately; at once  
**Class / position.** frame — clause-initial frame slot  
**Scope.** frame slot  
**With negation.** as zafra  
**With tense, aspect, mood.** independent  
**Stacking and restrictions.** one frame adverb per clause  
**Existing alternative.** 0.8 'Eli-krono, la velbisan!'  
**New capability.** 'at once' in one word  
**Pronunciation.** ken-vi, stress on the penultimate syllable

| Liraasa | English |
|---|---|
| *Kenvi, Kipo po duvlada.* | Kipo left at once. |

## 0.8 words redefined in 1.0

| Word | 1.0 meaning | Note |
|---|---|---|
| kopi | hope to | 1.0: intention moved to menvima sidu (ruling G5). |
| nosi | might (epistemic possibility) | 1.0: permission moved to dagi (ruling G3). |
| musi | must (obligation / circumstantial necessity) | 1.0: logical 'must' = tosu + seye (ruling G4). |
| ata | and | 1.0: ata is only 'and'; additive 'also' is tu (ruling G13). |
| si | if | 1.0: si is only 'if'; 'whether' is ki-oro (ruling G2). |

## Constructions that use existing words (no new spelling)

| Ruling | Topic | Rule |
|---|---|---|
| G1 | Scope by position | Every preverbal operator scopes over everything to its right. Pre-constituent operators (ne, doli, tu, yesta, pendi, vinto) scope over the single constituent that follows them. |
| G2 | si and whether | si means only 'if'. 'whether' is ki-oro. 0.8 texts that used si for 'whether' are read under 0.8 rules. |
| G3 | Permission vs possibility vs ability | povi = ability; nosi = epistemic possibility (might); dagi = permission (may, be allowed). 0.8's double use of nosi is split. |
| G4 | Epistemic necessity | 'must (logically)' = inferential evidential tosu + seye; musi is only obligation or circumstantial necessity. |
| G5 | Intention | Intent is the verb chain 'dorvada sidu VERB' (intend to); kopi is only 'hope to'. Deliberately = la dorvasan; accidentally = la dorvanasan. |
| G6 | Counterfactual | noma marks a clause as contrary to fact. 'should have' = po noma suvi; 'could have' = po noma povi; 'would have' = po viki (in a consequence clause) or po noma viki. |
| G7 | Imminence | fututi in the approach slot means 'about to': Maivo po fututi pagopa = I was about to leave. As a clause-initial time word it still means 'soon'. |
| G8 | Continuation | loki covers both 'still' and 'keep on'; no separate continuative is added. |
| G9 | Quantity limits | Before a number or quantity, lusu = at least, mosa = at most, gase = approximately; pendi = exactly. |
| G10 | Paired conjunctions | oro A oro B = either A or B; ne A ne B = neither A nor B; doli si = only if; yesta si = even if; 'si …, ata doli si …' = if and only if. |
| G11 | Despite | nevi + noun phrase = despite: nevi li zeldo, despite the resistance. nevi + clause = although. |
| G12 | Benefactive | vobi + noun phrase = for the benefit of / on behalf of (unchanged), and combines with any operator. |
| G13 | ata | ata is 'and' only; additive 'also' is tu. |
| G14 | Valency operators | vaku (make), lesvu (let) and tekvu (prevent) fill the verb slot of the main clause; the actor follows, then the actor's own [ne] [phase] [effort] verb. Tense, modal and evidential belong to the main clause only. |
| G15 | Negation and operators | ne before an operator negates the operator; ne after it negates the event: po ne vazdi lirala = didn't manage to sing; po vazdi ne lirala = managed not to sing. |
| G16 | Exclusions | At most one word per slot. hiro/teki do not combine with roni or tefa. tavki excludes fututi (same slot). The effort slot (telvo, vazdi, fesmo) excludes tefa. noma requires a tense, modal or si-clause context. |
| G17 | Unexpectedly / previously / simultaneously | la nerponasan = unexpectedly; kroti ola = previously; nayo ola = meanwhile/simultaneously; krotiapo = subsequently. No new words. |
| G18 | Topic and focus together | A hozi-topic opens the clause; vinto may then mark a focus inside it. hozi and vinto never mark the same constituent. |
| G19 | Version gating | Texts dated before 1.0 are interpreted with the 0.8 lexicon and rules. A 1.0 reader meeting a retired spelling looks it up in legacy.retired and reads the 1.0 replacement. |
| G20 | Lexicalised derivations | tisebitivu (sword), tibivu (rope), kaldopago (prison) and zeldoyo (rebel) are fixed meanings of regular derivations. |
| G21 | Closing a relative clause | A raho-clause that does not end the sentence is closed by a comma in writing and a pause in speech: Li sabeyo raho vismava eli, ne yehu vimova li vordu. (Found in stress-testing: without the pause the main verb is read inside the relative clause.) |
| G22 | Attitude words are clause-final only | seye, mufe, poye, pifu and zoke never open a clause. 'Perhaps, …' at the start of a sentence is written with the clause-final poye. (Found in stress-testing.) |
| G23 | Events taking place | venreva (come) with an event as subject means 'take place, happen': Li dapadonu po venreva kroti li nilvu, the sale took place before winter. |
