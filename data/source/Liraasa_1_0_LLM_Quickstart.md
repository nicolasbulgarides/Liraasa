# Liraasa 1.0 — LLM Quickstart

Liraasa is a constructed language built for singing: pure vowels, soft consonants, open-vowel endings. Edition 1.0 adds a precise grammar for causation, permission, possibility, intention, event structure and logic. This kit is enough to translate and generate correct Liraasa 1.0.

**Files:** `liraasa_1_0.json` (the only source of truth for vocabulary: 1099 headwords, 386 primal roots, 713 compounds, 149 function words) · `liraasa_1_0_quickstart.json` (these rules in machine form) · `validate.py` (checks words *and* clause order) · `gloss.py` (literal back-translation, use it to check your own output).

## 1. Seven rules that matter most

1. **Never invent a root.** Use the lexicon, or build a transparent MODIFIER+HEAD compound from existing headwords and flag it as noncanonical. Many concepts need no word at all: *kill* = `vaku X daigoda` (make X die); *mortal* = `raho povi daigoda` (who can die); *ignore* = `ne vismava la dorvasan`.
2. **SVO.** *Maivo amora taivo.* I love you.
3. **Verbs never change.** *lirala* = sing / sang / will sing.
4. **One fixed order before the verb; left scopes over right:**
   `SUBJ [po|futu|pressa] [noma] [ne] [povi|nosi|dagi|musi|suvi|viki|kopi] [tavki|fututi] [hiro|teki] [telvo|vazdi|fesmo] [roni|tefa|sahi] [bodu|reve|loki] [yehu|gesu|bisu|vuda|buyu|tosu] VERB`
5. **After the predicate:** `[fuyi] [hoyo|yasmo] [seye|mufe|poye|pifu|zoke] [ki]`. These are never sentence-initial.
6. **Scope words go right before their target:** ne (not), doli (only), tu (also), yesta (even), pendi (exactly), vinto (focus).
7. **make / let / prevent:** `CAUSER [tense…] vaku|lesvu|tekvu ACTOR [ne] [phase] [effort] VERB`.

## 2. Sounds and words

Vowels are pure; adjacent vowels are separate syllables; stress is penultimate. Seven forms per root (from *dorva*, intention):

| Form | Build | Example |
|---|---|---|
| noun | ROOT | dorva, intention |
| sacred | +asa | dorvaasa, divine will |
| absence/opposite | +na | dorvana, accident |
| verb | verb rule | dorvada, to intend |
| negative adj. | +nasan | dorvanasan, accidental |
| adjective | +san | dorvasan, deliberate |
| sacred adj. | +asasan | — (unused) |

Forms glossed "— (unused)" have no meaning; never give them one. **Verb rule:** opi→opioa; n…→+nia; s…→+sia; vowel…→+a; else + first consonant + a (*vordu → vorduva*, *semvi → semvisia*, *nerpo → nerponia*). Suffix order: ROOT + (one form or one of -yo/-vu/-pago) + -ti + -ri. Adverbs: *la* + adjective.

## 3. Meaning distinctions you must keep

| English | Liraasa |
|---|---|
| can (ability) / might / may (allowed) / must (duty) | povi / nosi / dagi / musi |
| must have (inference) | `tosu … seye` |
| should have / could have (but didn't) | `po noma suvi V` / `po noma povi V` |
| if I had …, I would have … | `Si maivo po noma V, … po viki V` |
| almost / about to | tavki / fututi |
| began / stopped / tried / managed / tried and failed | hiro / teki / telvo / vazdi / fesmo |
| on purpose / by accident | la dorvasan / la dorvanasan |
| intend to | dorvada sidu V (kopi = hope to) |
| made / let / prevented X do Y | vaku / lesvu / tekvu X Y |
| whether | ki-oro (si = if only) |
| unless / only if / even if / iff | sina / doli si / yesta si / si …, ata doli si … |
| except / instead (of) / therefore / nevertheless | sabri / korsi / tonsi / narli |
| either…or / neither…nor | oro … oro … / ne … ne … |
| at least / at most / about / exactly N | lusu N / mosa N / gase N / pendi N |
| as for X (topic) / it was X who (focus) | X hozi, … / vinto X |
| (surprise!) / as we know | clause + hoyo / clause + yasmo |
| suddenly / finally / eventually / at once / unexpectedly | zafra / finra / lanto / kenvi / la nerponasan |
| happen, take place | event + venreva |

Copulas: *ke* is (now), *ka* is (by nature), *kapoki* used to be, *loya* becomes, *miyo* there is. Pronouns: maivo, taivo, saivo (he/she/they), ito (it); plural -ri; possession OWNER de THING.

## 4. Common mistakes

1. *Maivo ne po lirala* ✗ → *Maivo po ne lirala* ✓ (tense first).
2. *Poye, taivo lirala* ✗ → *Taivo lirala poye* ✓ (attitude is clause-final).
3. *Li nela raho maivo amora ke eli-pago* is ambiguous → close a non-final relative clause with a comma: *Li nela raho maivo amora, ke eli-pago.*
4. Using *si* for "whether" (use *ki-oro*), *ata* for "also" (use *tu*), *nosi* for "allowed" (use *dagi*), *musi* for "must have" (use *tosu … seye*).
5. *hiro/teki* with *roni/tefa*; two words from one slot; two evidentials.
6. Adjective forms of the wrong sense: check the gloss. *daigosan* is "murderous", not "mortal".
7. Retired 0.8 words (e.g. *rivla, lalma, yoga, sabire*) — use *mirunulu, lumibiti, yomla, sasvapago*. `legacy.migration_forms` maps every one.

## 5. Twelve validated sentences

| Liraasa | English |
|---|---|
| *Maivo po tavki ralnora.* | I almost fell. |
| *Saivo po vazdi hirnaha.* | They managed to escape. |
| *Maivo po vaku ito farufa — nara la dorvanasan!* | I made it burn — but by accident! |
| *Maivo po tekvu saivo pagopa.* | I prevented them from leaving. |
| *Taivo ne dagi talita eli-pago.* | You are not allowed to work here. |
| *Si taivo po noma masuma, maivo po viki relsira.* | If you had asked, I would have answered. |
| *Li loteronela roni tosu vimova li domlu seye.* | The stranger must have been watching the house. |
| *Maivo masuma ki-oro taivo futu relnura.* | I'm asking whether you'll come back. |
| *Toda-nela po venreva sabri Dorin.* | Everyone came except Dorin. |
| *Yesta Dorin po resora.* | Even Dorin laughed. |
| *Li bumre hozi, Kipo po bumreba ito.* | As for the bread, Kipo baked it. |
| *Saivo milobema hoyo!* | She's smiling — who knew! |

## 6. Checking your work

```
python3 validate.py liraasa_1_0.json --corpus MY_TEXT_DIR
python3 gloss.py liraasa_1_0.json MY_TEXT_DIR/*.txt
```
Check 14 lists unknown words; check 21 lists clause-order errors. Lines starting with `#` are ignored, so English can sit in `# EN:` comments.
