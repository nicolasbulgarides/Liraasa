# Liraasa 1.1 — LLM Quickstart (vocabulary addendum)

**The 1.0 grammar is unchanged.** Use `Liraasa_1_0_LLM_Quickstart.md` for every
rule: the seven forms, the verb rule, the 20-slot clause, the particle
inventory, the rulings. Nothing in this file adds or alters a rule. 1.1 is
vocabulary only.

**Files:** `liraasa_1_1.json` — the only source of truth for vocabulary: 1418 headwords, 407 primal roots, 1011 compounds, and the same 149 function words as 1.0 · `validate_1_1.py` · `validation_1_1.json`.

## What 1.1 adds

319 headwords: 21 primal roots and 298 compounds. No new
particle, suffix, pronoun, tense, operator or clause slot.

## The 21 new fundamental concepts

These are the roots to learn, because compounds are built on them:

| Root | Verb | Means | Do not confuse with |
|---|---|---|---|
| `lazu` | `lazula` | animal; living member of the animal kingdom | folni (flower), bio (life) |
| `jemla` | `jemlaja` | insect; six-legged arthropod in ordinary usage | lazu (animal in general) |
| `pavma` | `pavmapa` | matter; physical substance; material | coda (thing/concept), yalmu (energy), pesbi (weight) |
| `germa` | `germaga` | metal; metallic material | solo (stone), pavma (matter in general) |
| `yalmu` | `yalmuya` | energy; capacity to produce physical change | pavma (matter), and never moral or political power |
| `serna` | `sernasia` | information; encoded or communicable content | sabe (knowledge), seno (word), lideo (idea) |
| `lermi` | `lermila` | language; structured human/animal/artificial system of meaningful signs | seno (a single word), valla (voice) |
| `nurmi` | `nurminia` | consciousness; subjective awareness or experience | ravmi (intelligence), sabe (knowledge), mere alertness |
| `ravmi` | `ravmira` | intelligence; capacity to learn, reason, generalize and solve problems | nurmi (consciousness), sabe (knowledge), ranfa (reason) |
| `divma` | `divmada` | system; organized arrangement of interacting parts | lordi (order), nulu (path) |
| `favro` | `favrofa` | signal; sign conveying information | seno (word) — a signal need not be speech |
| `vamri` | `vamriva` | space; spatial extent, independent of location | pago (place), navu (sky), vemi (world) |
| `demro` | `demroda` | motion; change of spatial position | trana (change), valmi (walking) |
| `purma` | `purmapa` | parent; parenthood independent of sex | mare (mother), pilo (father) — purma is either |
| `hunra` | `hunraha` | maturity; being fully developed or adult | yanba (old) — hunra is fully developed, not aged |
| `lizma` | `lizmala` | leftward orientation; left side | rizno (right); neither is moral |
| `rizno` | `riznora` | rightward orientation; right side | lizma (left); not moral rightness |
| `zavme` | `zavmeza` | front; forward-facing side | futu (future) — zavme is spatial only |
| `nazru` | `nazrunia` | rear; back; posterior side | po (past) — nazru is spatial only |
| `tilnu` | `tilnuta` | waste; refuse; discarded output | momvi (loss), and never moral worthlessness |
| `zarmo` | `zarmoza` | strike; impact; physical blow/contact with force | ralka (combat), pune (pushing) |

## Cautions: misleading lexical metaphors

23 new compounds are **lexicalised**: their meaning is conventional, not the sum
of their parts. Read the gloss, never the components, and do not extend the
metaphor to new coinages.

| Compound | Literally | Actually means | Caution |
|---|---|---|---|
| `farvilazu` | free + animal | wild animal | Wild or unconfined — not necessarily unowned. |
| `loterobiotino` | other + species | biological diversity | Conventional sense; read the gloss. |
| `lazuralka` | animal + fight | animal aggression; struggle between animals | Aggression between animals, not predation specifically. |
| `folnitino` | flower + kind | flowering-plant species | Flowering plants specifically, not all plants. |
| `ceresolo` | clear + stone | glass | Manufactured glass. Natural crystal needs specialist wording. |
| `farusolo` | fire + stone | ceramic | Conventional sense; read the gloss. |
| `germativro` | metal + pull | magnet | Conventional sense; read the gloss. |
| `germabiti` | metal + tool | metal tool; metal implement | A metal implement. It does not imply steel. |
| `mavoyuge` | mind + flesh | brain | A brain is not a mind and not a computer. |
| `sapukova` | eating + vessel | stomach | Conventional sense; read the gloss. |
| `talirivo` | work + companion | colleague | A colleague, not necessarily a friend. |
| `mavopagodapa` | society + price | income tax | Conventional sense; read the gloss. |
| `conokova` | coin + vessel | bank or vault | A bank. The vessel is metaphorical. |
| `lirasarbi` | song + writing | poem | Conventional sense; read the gloss. |
| `yanolira` | together + song | chorus; a group-sung section | A group-sung section. Not necessarily a repeated refrain — that is `ralelirapatu`. |
| `lideosovla` | idea + shape | metaphor | A metaphor. Lexicalised; do not build further figurative compounds on it. |
| `pavmatrana` | matter + change | chemistry | Conventional sense; read the gloss. |
| `pesbivordu` | weight + cause | gravity | Technical term. Do not read it as any cause of any weight. |
| `pavmapatu` | matter + part | material particle | A distinguishable piece of matter, **not** an atom. |
| `cunudivmabiti` | counting + machine | computer | A historical counting metaphor, exactly like English "computer". |
| `lordinulu` | order + path | algorithm | Conventional sense; read the gloss. |
| `farvisimvodivmabiti` | free-identity + machine | robot | The freedom is metaphorical. It implies no consciousness; `nurmi` is a separate claim. |
| `sernakova` | information + vessel | database | A database. The vessel is metaphorical. |

## Four spellings with two analyses

`zavmepago`, `nazrupago`, `lazupago`, `tilnupago` are compounds whose head is the root
`pago` ("place"), so each also reads as the productive derivation `X + -pago`.
Both readings give the same morphemes and the same meaning, so either is
acceptable. 1.0 already works this way for `larbopago`, `mavopago` and
`sasvapago`.

## Still true in 1.1

1. **Never invent a root.** 1418 headwords; build a transparent MODIFIER+HEAD
   compound from two of them and flag it noncanonical.
2. **Never give a meaning to a slot glossed `— (unused)`.** There are 6460 of
   them.
3. **`mavo + -pago` is still blocked.** `mavopago` is the fixed word "society".
4. Transitivity is usage-based: `gome` passivises any verb used with an object.
5. Pre-1.0 spellings resolve through `legacy.migration_forms` (ruling 1.0:G19).

## Checking your work

```sh
python validate_1_1.py liraasa_1_1.json --baseline-1-0 liraasa_1_0.json \
  --corpus MY_TEXT_DIR
```

Check 14 lists unknown words; check 21 lists clause-order errors; check 25
confirms 1.0 is carried verbatim.

