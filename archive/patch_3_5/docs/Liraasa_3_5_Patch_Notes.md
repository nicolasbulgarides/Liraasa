# Liraasa 3.5 — Essentials, archetypes and modular packs

*Proposed patch on top of 3.4, built from the 3.4 findings report (1,221 missing top-5,000 words). It adds **no new roots**: every word is built from headwords that already exist.*

## How it was built

Four principles, applied in this order:
1. **Alias before coining.** If Liraasa already has the word, give it its English name: *zirkisan* crazy, *kaldopago* jail, *dozapago* gym, *holbasan* entire.
2. **Recipe before word.** If grammar already says it, document the pattern: the senses of *get*, excellent = *ruli benasan*, half = *una de dossa*, daily = *rada deya*.
3. **Archetype before root.** Build on an existing head: *-yo*, *-lirbu*, *-pago*, *-zupa*, *-kova*, *-velma*, *-biti*, *-favro*, *-sonbu*, *-varde*.
4. **Modular.** Every entry belongs to a module. `core` is always applied; everything else is opt-in.

## Modules

| Module | What it covers | Compounds | Derivations | Diminutives | Restored | Aliases | Recipes | Rulings |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **core** | The 75 everyday essentials, get-recipes, shapes (G150) and copied names (G151) | 15 | 1 | 1 | 1 | 39 | 11 | 2 |
| **archetypes** | Compounds on existing heads: people, events, measures, tools, media, places, materials, animals, clothing, land, groups, ideas, body, food, verbs, ways, vehicles, plants | 109 | 13 | 9 | 0 | 45 | 2 | 0 |
| **qualities** | Quality adjectives and adverbs: worthy-of and heart compounds, aliases, recipes | 4 | 0 | 0 | 1 | 21 | 5 | 0 |
| **casual** | Casual register and discourse recipes | 0 | 0 | 0 | 0 | 2 | 3 | 0 |
| **derived-aliases** | English names for relational adjectives already formed by 3.3:G148 and for existing near-synonyms | 0 | 0 | 0 | 0 | 34 | 0 | 0 |
| **pack.tech** | Optional: internet and devices | 5 | 2 | 1 | 0 | 2 | 0 | 0 |
| **pack.sport** | Optional: sport and games | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| **pack.civic** | Optional: government, law, politics | 6 | 3 | 0 | 0 | 0 | 0 | 0 |
| **pack.business** | Optional: business and money | 7 | 0 | 0 | 0 | 6 | 0 | 0 |
| **pack.health** | Optional: health and medicine | 6 | 0 | 0 | 0 | 1 | 0 | 0 |
| **pack.science** | Optional: science and academia | 4 | 1 | 0 | 0 | 0 | 0 | 0 |
| **total** | | 164 | 20 | 11 | 2 | 150 | 21 | 2 |

**Totals.** With every module: **2,094 headwords, 4,951 meaningful forms, 0 new roots**.

**Dependencies.** Every module can be applied on its own with `core`; I tested each one separately. With `core` only: 1,945 headwords. With the general lexicon (`core`, `archetypes`, `qualities`, `casual`, `derived-aliases`): 2,058 headwords.

```
python3 apply_patch.py liraasa_3_4_llm.json liraasa_3_5_patch.json liraasa_3_5_llm.json                       # all modules
python3 apply_patch.py liraasa_3_4_llm.json liraasa_3_5_patch.json liraasa_3_5_llm.json --modules=archetypes,qualities
python3 validate_patch.py liraasa_3_5_llm.json liraasa_3_5_patch.json --modules=archetypes,qualities          # same selection
```

## Core: the 75 essentials

Every essential word from the findings report is now handled:
- **Already in Liraasa (39):** *mellisan* major, *dorvalordi* project, *holbasan* entire, *zirkisan* crazy, *nolsasan* recent, *resosan* funny, *telnepatu* episode, *kaldopago* jail, *dozapago* gym, *lordina* mess, *lisrosan* permanent, *ranfa* logic, *kersosan* natural ("grown, not made"), *cemnusan* main, *tikusan* specific …
- **New compounds (16):**
  - *salrupatu* level, *zarkuhata* attack, *regnacilni* capital;
  - *farlapuku* product, *deyafamapuku* weekend, *yalmudonu* influence;
  - *dozapeli* sport, *felradeya* holiday, *telnebulli* novel, *vilalirbu* mayor;
  - *namilordi* diet, *renlisafa* shower, *helvikaldo* trap, *folnitibi* cotton, *tibisevre* tie / knot.
- **Fills:** *cemonasan* raw, *zirkiti* silliness, and *lorefaruyo* fan.
- **Recipes:**
  - ***get*, by sense:**
    - receive: *rillira*
    - become: *loya* + adjective
    - arrive: *venreva*
    - fetch: *navdinia*
  - **Degree and quantity:** excellent (*ruli* + adjective), half (*una de dossa*), main or primary (*li una-ne*).
  - **Time:** daily, weekly, yearly (*rada deya*, …); decade, century; temporary (G148).
  - **Other:** due / due to.
- **3.5:G150, shapes:** *tressa-gaki* triangle, *cuara-gaki* square, *rinba* circle.
- **3.5:G151, copied names of foreign things:** *pitsa*, *hamburga*. Use a native compound when one is transparent.

## Archetypes: the second-largest bucket

| Family | Examples |
|---|---|
| derivations & diminutives (22) | *sudeyo* actor, *melvayo* aide, *dentohelnayo* dentist, *buzadonuyo* bartender, *lavbulirbuvu* pope, *folluralkayo* terrorist, *vinyevu* guitar, *talvabitivu* spear, *melonuluvu* symphony … |
| events (15) | *nimuturna* immigration, *vemisasva* conservation, *relsiseno* feedback, *yanotali* cooperation, *migademro* interaction, *zarkuturna* invasion, *folluralka* terrorism, *dapalekta* auction, *conopalvi* deposit … |
| materials (11) | *farlapavma* plastic (made material), *rubigerma* copper (red metal), *ertagerma* bronze (brown metal), *sulmeherba* tobacco (smoke-plant), *limlitibi* wool (lamb-thread), *herbatibi* linen (plant-thread), *larbolamsa* charcoal, *rupumiru* sewage, *helnapatu* dose … |
| verbs (11) | *pegasevre* a seal, *yendosonbu* a clap, *dentotise* gnawing, *vizuduvla* a dodge, *pusabako* crumbling, *nemevalla* a whine, *halravalmi* a trot, *lavranevra* a swoop, *larnevalla* a snarl … |
| tools (10) | *sonbutabu* piano (sound-table), *linlekova* filter, *valmibiti* cane, *molupavma* cushion, *sulmenulu* chimney, *zilesemne* armchair (fine seat), *halratibi* harness, *kadukaldo* brake, *lumirinba* chandelier … |
| media (10) | *lektamambi* session, *sernasovla* chart, *veratelne* documentary, *fasbilarda* portrait, *cuzanamre* headline, *ramufavro* reminder, *nolefavro* badge, *jurevisonbu* applause, *telnelideo* scenario … |
| animals (6) | *nullolazu* bat (night-animal), *sevubudi* shark (sea-dog), *nulvalazu* elephant (nose-animal), *cilnilavra* pigeon (city-bird), *rubilavra* robin (red bird), *zilelavra* peacock (the fine bird) |
| clothing (6) | *dozayelmi* diamond (strong sparkle), *cemovelma* apron, *nullovelma* pajamas, *rezasabaye* mustache, *rezacolbi* lipstick, *pebutibi* sock |
| land (6) | *cilnicemnu* downtown, *kezupidi* cape, *monrutise* canyon, *cilnilelde* suburb, *vemipatu* hemisphere, *salrulenda* slope |
| measures (5) | *pegatibi* tape, *kezutise* ditch, *gudosemne* stool (common seat), *voprabiti* hinge, *vanipusa* makeup |
| places (5) | *lazuganre* zoo (animal-garden), *tovodomlu* warehouse, *lenizupa* auditorium, *namizupa* cafeteria, *herbatobra* hedge |
| ideas (4) | *lideokaldo* bias, *lideodevo* ideology (idea-faith), *livnaruhe* dilemma (a storm of choice), *gudorivla* the mainstream |
| body (4) | *damvazavme* shin, *lehesolo* cheekbone, *larbopidi* splinter, *bakopatu* fragment |
| people (3) | *dentohelna* dentistry, *buzadonu* serving drinks, *lemulirbu* dean |
| groups (3) | *zilelekta* elite, *yanolekta* collective, *yanoregna* federation |
| ways (3) | *kezunulu* tunnel, *bionulu* lifestyle, *zilevalminulu* boulevard (fine street) |
| food (2) | *gubupatu* ham, *molovugalsa* hay (withered grass) |
| vehicles (2) | *sevukadu* ferry, *sasvabote* lifeboat |
| plants (2) | *sililarbo* pine, *folnisamni* bud |
| containers (1) | *larbokova* crate |

**Already in the lexicon.** Seven of my proposed compounds turned out to exist, with the same or very close meanings: *kronocunu* frequency, *nelacunu* population, *farudomlu* oven, *lideolordi* plan, *talilirbu* supervisor, *conolordi* budget, *narvolavra* crow. They became aliases instead (rate, census, furnace, executive, finance), more evidence that the archetype logic matches how you build words.

## Qualities and casual register

- **Two new archetypes:**
  - **worthy of (X + *varde*):** *milnovarde* remarkable, *rillivarde* acceptable. This joins *resovarde* (ridiculous) from 3.4.
  - **heart (*lore* + X):** *lorefollu* shy, *zeldolore* stubborn.
- **Restored form:** *sabayenasan* bald.
- **Aliases (21):** cheerful, rude, stunning, talented, inevitable, primitive, upright, smug, childish, and others.
- **Recipes:** every "-ly" adverb is *la* + the adjective; also extra, internal, presumably, invisible, anymore, otherwise, alright.

## Domain packs (optional)

| Pack | Examples |
|---|---|
| pack.tech | *vemifavro* internet, *favrocuza* email, *divmaseno* code, *pidisonbu* click, *sernamomvi* deletion, *favropago* website, *bitiyo* user, *vallafavroti* mobile phone |
| pack.sport | *pebupeli* football, *kovapeli* basketball, *hatapeli* baseball, *vazralekta* tournament, *lukadapa* bet, *cuzapeli* card game, *pelilirbu* coach, *vazracunu* score |
| pack.civic | *kezupatulirbu* governor, *lanvefarla* legislation, *juselekta* jury, *livnaserbu* candidacy, *jusemasu* lawsuit, *lanvetrana* amendment, *lanvelektayo* senator, *livnaserbuyo* candidate, *yebasenoyo* ambassador |
| pack.business | *farladivma* industry, *conosamni* investment, *conorelnu* revenue, *domlugura* mortgage, *dapanevra* discount, *talijuba* bonus, *talimiga* partnership |
| pack.health | *mudukerso* cancer, *mudusamni* virus (sickness-seed), *mudusabe* diagnosis, *mudufavro* symptom, *biocuza* gene (life-letter), *helnamervi* healthcare |
| pack.science | *patuserbu* analysis, *cunusabe* statistics, *navufaruyalmu* electricity, *conosabe* economics, *veraserbupago* laboratory |

## Effect

| | 3.4 | 3.5 general (no domain packs) | **3.5 all modules** |
|---|---:|---:|---:|
| Fiction content words (best estimate) | 80.9% | 82.6% | **82.7%** |
| Fiction running text | 88.8% | 89.5% | **89.6%** |
| Dialogue running text | 93.3% | 93.8% | **93.9%** |
| Top 2,000 fiction words | 88.3% | 89.1% | **89.1%** |
| Top 5,000 fiction words | 71.0% | 76.1% | **76.5%** |
| The 1,221 missing words from the 3.4 report, still missing | 1,221 | 879 | **820** |
| Essentials still missing | 75 | **0** | **0** |

The 75 essentials are now all handled. The last 21 appear in the "still missing" count only because these figures don't credit recipes or rulings.

The 820 that remain are mostly the long tail of the report: period words, rare objects, and narrow adverbs. All of them are listed, with patterns, in Liraasa_3_4_Missing_Top5000_Categorized.csv.

## Decisions for you

- **Metaphorical choices to confirm:**
  - *kersosan* (growing) as natural;
  - *sevubudi* (sea-dog) for shark;
  - *nulvalazu* (nose-animal) for elephant;
  - *sonbutabu* (sound-table) for piano;
  - *dozayelmi* (strong sparkle) for diamond;
  - *vemifavro* (world-signal) for internet.
- **Copied names (G151):** confirm the respelling policy for *pitsa* and *hamburga*, or forbid copied names for food entirely.
- **Which domain packs belong in canon,** and which stay optional supplements.

## Test sentences

| Liraasa | English | Module |
|---|---|---|
| Li vilalirbu po zarkuhata li regnacilni en li deyafamapuku. | The mayor attacked the capital on the weekend. | core |
| Maivo po rillira baba telnebulli, ata li deya po loya narvosan. | I got a novel, and it got dark. | core |
| Li tabu ka cuara-gakisan, nara li zilebumre ka rinba. | The table is square, but the cake is a circle. | core |
| Li cibuti po vizuduvla li sevubudi. | The kitten dodged the shark. | archetypes |
| Li lorefollusan linu ka milnovardesan. | The shy child is remarkable. | qualities |
| Saivo po yendosonbuya nayo li sudeyo po lirala en li lenizupa. | She clapped while the actor sang in the auditorium. | archetypes |
