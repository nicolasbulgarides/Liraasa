# How much fiction English can Liraasa 3.1 say?

*Measured on 25 October 2026 against Liraasa 2.5 + the 3.0 patch + the 3.1 patch (1,664 headwords).*

## Headline numbers

| | 2.5 | 3.0 | 3.1 |
|---|---:|---:|---:|
| Content words in fiction (best estimate) | 73.2% | 73.6% | **74.3%** |
| — lower bound (exact gloss match) | 67.4% | 67.7% | 68.7% |
| — upper bound (any WordNet synonym) | 80.3% | 80.7% | 81.4% |
| All running text, function words included | 85.7% | 85.8% | **86.1%** |
| Top 500 fiction content words (types) | 87.4% | 87.6% | 87.8% |
| Top 1,000 | 81.8% | 81.9% | 82.4% |
| Top 2,000 | 73.1% | 73.8% | 75.1% |
| Top 5,000 | 58.3% | 59.3% | 60.8% |

**Dialogue check.** On the 5,000 most frequent words of film and TV subtitles (OpenSubtitles 2018), the 3.1 estimate is **77.9%** of content tokens, and **91.3%** of all running dialogue.

## What the numbers mean

- **About 86% of the words on a page of fiction have a Liraasa equivalent** once function words are counted. Function words are handled by the grammar and cover 94% of their tokens.
- **The gap is entirely in content words.** About one content word in four still has no Liraasa word.
- **Coverage falls fast down the frequency list.**
  - Of the 500 most common fiction content words, about 88% are covered.
  - Of the 5,000 most common, about 61% are covered.
  - Liraasa covers the core of a story well and its long tail poorly.
- **3.1 moved the total by under one point.** This is expected, not a failure. Its words (chew, squint, spill …) are frequent in *description* but individually rare in running text. The big remaining gaps are in other categories entirely.

## Where the gaps are

Estimated coverage of each WordNet category in Brown fiction. Categories are sorted by how many uncovered tokens they leave; the examples are the most frequent missing words.

| Category | Share of fiction content | 3.1 coverage | Most frequent missing words |
|---|---:|---:|---|
| Everyday adjectives | 12.5% | 71% | nice, best, fine, early, busy, drunk, stupid, comfortable, special |
| Objects, buildings, vehicles, weapons | 8.2% | 56% | gun, building, hotel, rifle, wagon, ball, truck, desk, porch |
| People, jobs, ranks, family address | 6.0% | 65% | baby, sir, driver, clerk, cop, pa, president, secretary, slave |
| Adverbs | 5.2% | 67% | ago, indeed, slightly, closer, yeah, o'clock, asleep, upstairs, especially |
| Media and communication | 3.0% | 68% | record, performance, radio, term, humor, address, comedy, magazine, ticket |
| Contact verbs | 3.9% | 77% | park, press, clutch, slam, sprawl, attach, fling, slash, jerk |
| Motion verbs | 6.7% | 87% | drive, straighten, shove, stagger, duck, huddle, pace, crash, poise |
| Acts and activities | 2.6% | 67% | shot, action, activity, favor, drive, sex, ride, lesson, expedition |
| Speech verbs | 5.3% | 87% | discuss, avoid, grunt, recommend, proclaim, heave, dismiss, consult, urge |
| Groups and institutions | 2.2% | 72% | college, mission, navy, team, traffic, column, patrol, outfit, rank |
| Food and drink | 0.8% | 31% | coffee, breakfast, chicken, supper, beer, whisky, lunch, liquor, whiskey |
| Ideas and knowledge | 2.3% | 80% | fact, feature, method, aspect, logic, average, technique, compound, obstacle |
| Change verbs | 2.4% | 81% | curl, emerge, shatter, stain, upset, replace, swinge, explode, tighten |
| Qualities | 2.0% | 78% | control, importance, advantage, personality, vice, decency, succession, plumpness, luxury |
| Body parts | 3.3% | 88% | fist, lap, toe, elbow, hip, corpse, ankle, nail, thigh |
| States and conditions | 1.9% | 78% | circumstance, condition, gas, tension, romance, depression, bitch, overcast, annoyance |
| Possession verbs | 2.2% | 82% | locate, substitute, secure, graduate, shower, finance, thieve, strand, supplement |
| Places | 1.8% | 79% | state, bottom, jungle, neighborhood, county, post, lawn, ghetto, port |
| Nationalities and "relating to" adjectives | 0.5% | 28% | american, japanese, english, french, british, spanish, christian, indian, roman |
| Social verbs | 3.0% | 88% | occupy, register, entertain, preside, assign, trap, administer, interfere, patrol |
| Measures and money | 0.6% | 36% | bit, dollar, yard, quarter, dozen, inch, pint, cent, acre |
| Thinking verbs | 3.1% | 89% | check, remind, compare, scheme, survey, misjudge, refresh, review, reread |
| Animals | 0.8% | 61% | hen, mare, pony, hoof, ox, calf, kitten, buckskin, pig |
| Perception and sound verbs | 3.1% | 90% | screech, scan, creak, rattle, blast, leer, clatter, chatter, tingle |
| Materials | 1.1% | 71% | leather, straw, log, brass, wax, charcoal, slack, cotton, plaster |
| Time | 2.2% | 86% | afternoon, date, century, interval, rate, weekend, vacation, inning, half-hour |
| Events | 1.4% | 80% | occasion, incident, race, instance, ceremony, beep, contest, catastrophe, tragedy |
| Emotion verbs | 1.6% | 83% | enjoy, frighten, appreciate, admire, dislike, alarm, loathe, depress, panic |
| Natural objects and landforms | 1.2% | 79% | sheet, bubble, bay, trail, main, cape, bluff, web, highland |
| States (verbs) | 1.8% | 88% | resemble, include, bristle, precede, suit, falter, reside, flank, stink |
| Feelings | 0.8% | 74% | satisfaction, horror, appetite, alarm, distaste, amazement, optimism, indignation, suspense |
| Plants | 0.4% | 54% | blade, trunk, bush, pine, nut, oak, corn, beech, bulb |
| Bodily verbs | 1.0% | 83% | relax, choke, bathe, doze, twitch, drug, belch, snore, grimace |
| Money and property | 0.5% | 71% | check, cash, diamond, bet, dime, bequest, mortgage, checkbook, capital |
| Weather and phenomena | 0.6% | 79% | pressure, fog, strain, response, drizzle, exchange, radiation, electricity, hurricane |
| Making verbs | 0.5% | 79% | print, rehearse, sketch, scrawl, rebuild, improvise, knit, invent, manufacture |
| Eating verbs | 0.4% | 81% | suck, dine, mine, avail, mess, gulp, munch, digest, wallow |
| Fighting verbs | 0.4% | 84% | level, assail, gang, invade, foul, outweigh, vie, compete, disarm |

## Significant weaknesses

1. **The modern made world (objects 56%).** There is no car, truck, train, plane, bus, telephone, radio, TV, ticket, gun, rifle, pistol or bullet. There is no hotel, office, apartment, building, porch, yard, garage, desk or cigarette. This is the largest gap by volume, and the most decisive for contemporary or historical-modern fiction. If Liraasa fiction will stay mythic and pre-industrial, much of this is a deliberate design choice, but it should be a decision rather than an accident.
2. **Food and drink (31%).** This is the worst-covered large category. There is no coffee, beer, whisky, chicken; and no breakfast, lunch or supper. Meals are scene-setting in almost all fiction, and *mealtimes* are also time words.
3. **Measures and money (36%).** There is no dollar or coin unit, no mile, inch, yard, dozen or quarter, and no "bit" (a little). The 3.0 patch built the *grammar* of measure (unit, quantity, proportion) but not the everyday units.
4. **People by role (65%).** There is no police or officer, detective, lawyer, clerk, secretary, driver, reporter, manager or president; no military ranks; and no family address words (dad, mom, ma, pa, sir, baby, honey).
5. **Everyday evaluative adjectives (71%, and 12.5% of all content).** The language can say *beautiful* and *good*, but not *nice, fine, busy, stupid, comfortable, special, normal, serious, tough, weird, lovely, ugly, obvious, modern*. These are dialogue workhorses.
6. **Dialogue particles.** These are *yeah, okay, alright, wow, hey, whatever, just kidding, cheers*. The subtitle check puts several of them among the most frequent missing words. *zabo* covers "yes", but there is no casual register.
7. **Body detail (88%, but conspicuous).** There is no fist, lap, toe, elbow, hip, ankle, thigh, thumb, knuckle, eyelid or nail. The joint-word gap flagged in 3.1 is confirmed.
8. **Smaller clusters:**
   - nationality adjectives (*American, English, French*), which need a ruling for deriving them from copied names;
   - farm animals (*hen, pony, ox, calf, pig, rabbit, bull*);
   - common trees (*pine, oak, bush*);
   - afternoon and weekend.

Already well covered (85–90%): motion, perception, thinking, speech, social, bodily and emotion verbs. Liraasa's verb core is strong.

## How the numbers were made, and their limits

- **Fiction corpus.** The six fiction sections of the Brown Corpus (general fiction, mystery, science fiction, adventure, romance, humor): 243,305 word tokens, with proper nouns excluded. The text was lemmatized with WordNet using Brown's part-of-speech tags.
  - Brown is 1961 American English, so westerns and war stories inflate *gun, rifle, wagon, sergeant*, and modern technology is under-represented.
  - The subtitle list is a second, contemporary check.
- **Lexicon side.** Every English gloss in the merged 3.1 JSON was turned into a set of English lemmas. This covers dictionary lines, derivations, diminutives, function words, correlatives, time words, colours and discourse particles.
- **Lower bound.** The English lemma appears in a Liraasa gloss. A spot check of the top 260 such matches found very few wrong-sense matches; I assume 95% are true.
- **Upper bound.** A WordNet synonym of the lemma appears in a gloss. I hand-judged the 110 most frequent of these matches, which make up 36% of their token mass. **71%** were genuine (for example *kid → child*, *slowly → slow*). The rest were false (*car → machine*, *police → law*).
- **Best estimate.** 0.95 × lower bound + 0.71 × (upper − lower).
- **Grammar-covered words count as covered:** *let's* (yava), *ago* (kroti + measure), *twice* (dossa-krono), *best/worse/closer* (mosa/kasi), *yeah* (zabo).
- **What "covered" means.** A word counts as covered when Liraasa has a word with that meaning. A phrase-level paraphrase does not count, so the figures understate what a skilled translator can say.
- **These are estimates, not exact measurements.** Expect about ±3 points of error, mainly from the synonym precision.

The 1,500 most frequent uncovered fiction lemmas, with their categories, are in **Liraasa_3_1_Fiction_Missing_Words.csv**. That is a ready worklist for a 3.2 audit.
