# Liraasa 1.0 → 1.1 — Vocabulary Changelog

Vocabulary-only supplement. **No grammar changed**: `phonology`, `morphology`,
`motion_prefixes`, `grammar`, `function_words`, `pronouns`, `correlatives`,
`numbers`, `time_and_dates`, `colors`, `discourse_particles`, `rulings_1_0`,
`rulings_0_8_carried` and all 452 existing examples are byte-identical to 1.0,
verified by check 25.

## 1. Counts

| Measure | 1.0 | 1.1 | Δ |
|---|---|---|---|
| Headwords | 1099 | 1418 | +319 |
| Primal roots | 386 | 407 | +21 |
| Compounds | 713 | 1011 | +298 |
| Form strings | 7693 | 9926 | +2233 |
| Function words | 149 | 149 | 0 |
| Examples | 452 | 586 | +134 |

All 319 proposals were integrated: 21 primal roots and 298 compounds.
No candidate was rejected, and no replacement root had to be coined.

## 2. The 21 new primal roots

| Root | Verb | Gloss | Domain |
|---|---|---|---|
| `lazu` | `lazula` | animal; living member of the animal kingdom | Ecology & biology |
| `jemla` | `jemlaja` | insect; six-legged arthropod in ordinary usage | Ecology & biology |
| `pavma` | `pavmapa` | matter; physical substance; material | Materials & physics |
| `germa` | `germaga` | metal; metallic material | Materials & physics |
| `yalmu` | `yalmuya` | energy; capacity to produce physical change | Materials & physics |
| `serna` | `sernasia` | information; encoded or communicable content | Information & technology |
| `lermi` | `lermila` | language; structured human/animal/artificial system of meaningful signs | Information & technology |
| `nurmi` | `nurminia` | consciousness; subjective awareness or experience | Mind & philosophy |
| `ravmi` | `ravmira` | intelligence; capacity to learn, reason, generalize and solve problems | Mind & philosophy |
| `divma` | `divmada` | system; organized arrangement of interacting parts | Systems & relations |
| `favro` | `favrofa` | signal; sign conveying information | Systems & relations |
| `vamri` | `vamriva` | space; spatial extent, independent of location | Space & orientation |
| `demro` | `demroda` | motion; change of spatial position | Space & orientation |
| `purma` | `purmapa` | parent; parenthood independent of sex | Family & society |
| `hunra` | `hunraha` | maturity; being fully developed or adult | Family & society |
| `lizma` | `lizmala` | leftward orientation; left side | Space & orientation |
| `rizno` | `riznora` | rightward orientation; right side | Space & orientation |
| `zavme` | `zavmeza` | front; forward-facing side | Space & orientation |
| `nazru` | `nazrunia` | rear; back; posterior side | Space & orientation |
| `tilnu` | `tilnuta` | waste; refuse; discarded output | Everyday objects & health |
| `zarmo` | `zarmoza` | strike; impact; physical blow/contact with force | Actions & physical processes |

Every one fits the 1.0 new-root template (two syllables, consonant-initial,
vowel-final, no prohibited cluster) and sits at least two edit operations from
all 10,625 active and reserved spellings. Checks 5, 6 and 18 verify this, and
because each new entry carries `status_1_0: "NEW"` the unmodified `validate.py`
tests them rather than skipping them.

## 3. New compounds by domain

### Ecology & biology (21)

| Compound | Components | Gloss |
|---|---|---|
| `nimulazu` | nimu + lazu | pet |
| `farvilazu` | farvi + lazu | wild animal |
| `talilazu` | tali + lazu | working animal |
| `sevulazu` | sevu + lazu | marine animal |
| `jemlatino` | jemla + tino | insect kind |
| `jemlayano` | jemla + yano | insect swarm |
| `lazunimu` | lazu + nimu | animal den |
| `lazupago` | lazu + pago | habitat |
| `biodivma` | bio + divma | ecosystem |
| `biotino` | bio + tino | species |
| `bioyuge` | bio + yuge | organism |
| `lazuyano` | lazu + yano | herd or pack |
| `loterobiotino` | lotero + biotino | biological diversity |
| `lazujomru` | lazu + jomru | animal migration |
| `biotinosolma` | biotino + solma | extinction of a species; the dying out of a kind of life |
| `biodonu` | bio + donu | reproduction |
| `linuvenre` | linu + venre | birth |
| `biovamri` | bio + vamri | biosphere |
| `lazuralka` | lazu + ralka | animal aggression; struggle between animals |
| `folnitino` | folni + tino | flowering-plant species |
| `larbobiodivma` | larbo + biodivma | forest ecosystem |

### Ethics & emotions (17)

| Compound | Components | Gloss |
|---|---|---|
| `farviyeba` | farvi + yeba | consent |
| `vordumusva` | vordu + musva | accountability |
| `kulpamera` | kulpa + mera | forgiveness |
| `verasimvo` | vera + simvo | honesty |
| `benasimvo` | bena + simvo | moral integrity |
| `surutilma` | suru + tilma | empathy |
| `nememera` | neme + mera | compassion |
| `amorharlu` | amor + harlu | romantic jealousy |
| `loterovorba` | lotero + vorba | social envy |
| `nelavarde` | nela + varde | human dignity |
| `devobena` | devo + bena | trustworthiness |
| `jusedivma` | juse + divma | justice system |
| `maivokaldo` | maivo + kaldo | self-restraint |
| `vulraranbe` | vulra + ranbe | resilience |
| `simvolivna` | simvo + livna | self-determination |
| `benamavopago` | bena + mavopago | ethical society |
| `benavulra` | bena + vulra | moral injury |

### Everyday objects & work (26)

| Compound | Components | Gloss |
|---|---|---|
| `namresomubiti` | namre + somubiti | pillow |
| `somuvelma` | somu + velma | blanket |
| `yugesomubiti` | yuge + somubiti | mattress |
| `yugetilnu` | yuge + tilnu | body waste |
| `yugetilnubiti` | yugetilnu + biti | toilet fixture |
| `tilnukova` | tilnu + kova | waste bin |
| `tilnupago` | tilnu + pago | rubbish dump |
| `safapavma` | safa + pavma | soap |
| `safavelma` | safa + velma | washcloth |
| `silikova` | sili + kova | refrigerator |
| `lumikemye` | lumi + kemye | light switch |
| `mirudorbi` | miru + dorbi | faucet |
| `domlubiti` | domlu + biti | furniture |
| `kelebiti` | kele + biti | ladder |
| `zarmobiti` | zarmo + biti | hammer |
| `tibiteyo` | tibi + teyo | needle |
| `valminulu` | valmi + nulu | road |
| `jomrubiti` | jomru + biti | vehicle |
| `kronobiti` | krono + biti | clock |
| `kronosarbisenru` | krono + sarbisenru | calendar |
| `dapasarbisenru` | dapa + sarbisenru | receipt |
| `mavopagodapa` | mavopago + dapa | income tax |
| `gurapari` | gura + pari | interest on debt |
| `rimadapa` | rima + dapa | rental fee for non-housing property |
| `harludapa` | harlu + dapa | insurance premium |
| `conokova` | cono + kova | bank or vault |

### Family & society (24)

| Compound | Components | Gloss |
|---|---|---|
| `purmafamli` | purma + famli | aunt or uncle |
| `purmafamlilinu` | purmafamli + linu | cousin |
| `purmapurma` | purma + purma | grandparent |
| `linulinu` | linu + linu | grandchild |
| `kronopurma` | krono + purma | ancestor |
| `kronolinu` | krono + linu | later descendant |
| `purmalinu` | purma + linu | offspring |
| `famanela` | fama + nela | family member |
| `hunranela` | hunra + nela | adult person |
| `hunralinu` | hunra + linu | adolescent |
| `talirivo` | tali + rivo | colleague |
| `talilirbu` | tali + lirbu | supervisor |
| `lemudonurivo` | lemudonu + rivo | mentor |
| `lemutali` | lemu + tali | apprenticeship |
| `nelayano` | nela + yano | community |
| `nelacunu` | nela + cunu | population |
| `cilninela` | cilni + nela | civic member |
| `gonbibena` | gonbi + bena | hospitality |
| `soratilma` | sora + tilma | friendship |
| `linurilli` | linu + rilli | adoption |
| `maretilma` | mare + tilma | motherhood |
| `pilotilma` | pilo + tilma | fatherhood |
| `purmatali` | purma + tali | parenting |
| `devotilma` | devo + tilma | mutual trust |

### Health & anatomy (18)

| Compound | Components | Gloss |
|---|---|---|
| `mavoyuge` | mavo + yuge | brain |
| `surutibi` | suru + tibi | nerve |
| `ranbeyuge` | ranbe + yuge | muscle |
| `sapukova` | sapu + kova | stomach |
| `linukova` | linu + kova | womb |
| `linufule` | linu + fule | pregnancy |
| `senrulalle` | senru + lalle | skin pore |
| `mudubio` | mudu + bio | pathogen |
| `nulvazogu` | nulva + zogu | sneeze |
| `senrunuravu` | senru + nuravu | itch |
| `yugefule` | yuge + fule | swelling |
| `mavovulra` | mavo + vulra | psychological trauma |
| `barnirale` | barni + rale | pulse |
| `yugetali` | yuge + tali | exercise |
| `namitrana` | nami + trana | physical digestion |
| `yugehelna` | yuge + helna | physical therapy |
| `helnabiti` | helna + biti | medical instrument |
| `senrumudubio` | senru + mudubio | skin infection |

### Materials & physics (22)

| Compound | Components | Gloss |
|---|---|---|
| `ceresolo` | cere + solo | glass |
| `farusolo` | faru + solo | ceramic |
| `domlusolo` | domlu + solo | brick |
| `mirutamra` | miru + tamra | mud |
| `biotamra` | bio + tamra | soil |
| `mirunumo` | miru + numo | steam |
| `tibipavma` | tibi + pavma | fabric |
| `tibivelma` | tibi + velma | textile garment |
| `tiselarboyuge` | tise + larboyuge | plank |
| `germatibi` | germa + tibi | wire |
| `germalavlo` | germa + lavlo | metal foil |
| `colbilisi` | colbi + lisi | paint |
| `yalmunami` | yalmu + nami | fuel |
| `yalmukova` | yalmu + kova | battery |
| `pusanumo` | pusa + numo | cloud of dust |
| `sumayalmu` | suma + yalmu | thermal energy |
| `lumiyalmu` | lumi + yalmu | radiant energy |
| `demroyalmu` | demro + yalmu | kinetic energy |
| `germativro` | germa + tivro | magnet |
| `germabiti` | germa + biti | metal tool; metal implement |
| `germabimne` | germa + bimne | metallic structure |
| `pavmasovla` | pavma + sovla | material property |

### Music & storytelling (24)

| Compound | Components | Gloss |
|---|---|---|
| `lirasarbi` | lira + sarbi | poem |
| `liralarda` | lira + larda | poetry |
| `lirapatu` | lira + patu | verse |
| `sarbilirapatu` | sarbi + lirapatu | stanza |
| `yanolira` | yano + lira | chorus; a group-sung section |
| `ralelirapatu` | rale + lirapatu | refrain |
| `sonbusamba` | sonbu + samba | rhyme |
| `kronosonbu` | krono + sonbu | rhythm |
| `melonulu` | melo + nulu | melody |
| `yanosonbu` | yano + sonbu | harmony |
| `ralkasonbu` | ralka + sonbu | dissonance |
| `melobiti` | melo + biti | musical instrument |
| `leninela` | leni + nela | listener or audience member |
| `lardayano` | larda + yano | ensemble |
| `telnepatu` | telne + patu | scene |
| `telnenulu` | telne + nulu | plot of a story; narrative line |
| `senotilma` | seno + tilma | spoken dialogue |
| `lideosovla` | lideo + sovla | metaphor |
| `nafetelne` | nafe + telne | fiction |
| `nelatelne` | nela + telne | biography |
| `kronoramu` | krono + ramu | history |
| `ramutelne` | ramu + telne | legend |
| `liratelne` | lira + telne | opera |
| `melolordi` | melo + lordi | musical arrangement |

### Nature & geography (20)

| Compound | Components | Gloss |
|---|---|---|
| `tamramiru` | tamra + miru | lake |
| `sevupusa` | sevu + pusa | beach |
| `sevulelde` | sevu + lelde | coast |
| `tamralelde` | tamra + lelde | cliff |
| `farumonru` | faru + monru | volcano |
| `lesmamiru` | lesma + miru | oasis |
| `mirugalsa` | miru + galsa | marsh |
| `miruralno` | miru + ralno | waterfall |
| `mirunululombi` | mirunulu + lombi | source of a river |
| `teruzego` | teru + zego | earthquake |
| `ruhevabeve` | ruhe + vabeve | storm surge |
| `renlicolbi` | renli + colbi | rainbow |
| `veluralno` | velu + ralno | meteor |
| `sulbasado` | sulba + sado | solar eclipse |
| `lunosado` | luno + sado | lunar eclipse |
| `veluvemi` | velu + vemi | planet |
| `veluyano` | velu + yano | galaxy |
| `vopranulu` | vopra + nulu | orbit |
| `tamrasovla` | tamra + sovla | landscape |
| `mirulombi` | miru + lombi | water source |

### Science & philosophical inquiry (32)

| Compound | Components | Gloss |
|---|---|---|
| `veraserbu` | vera + serbu | science |
| `sabeserbu` | sabe + serbu | research |
| `sabetelba` | sabe + telba | experiment |
| `vismatali` | visma + tali | observation |
| `mellicunu` | melli + cunu | measurement |
| `sambaseno` | samba + seno | mathematical equation |
| `cunuranfa` | cunu + ranfa | mathematics |
| `sovlaranfa` | sovla + ranfa | geometry |
| `pavmasabe` | pavma + sabe | physics |
| `pavmatrana` | pavma + trana | chemistry |
| `biosabe` | bio + sabe | biology |
| `biotilma` | bio + tilma | ecological relations |
| `mavosabe` | mavo + sabe | psychology |
| `navusabe` | navu + sabe | astronomy |
| `lideoserbu` | lideo + serbu | philosophy |
| `benaranfa` | bena + ranfa | ethics |
| `ranfalideo` | ranfa + lideo | theory |
| `sovlalideo` | sovla + lideo | conceptual model |
| `vorduyordo` | vordu + yordo | causal outcome |
| `pesbivordu` | pesbi + vordu | gravity |
| `demrovordu` | demro + vordu | physical force |
| `pavmapatu` | pavma + patu | material particle |
| `navuvamri` | navu + vamri | outer space |
| `vamridarno` | vamri + darno | spatial dimension |
| `navutrana` | navu + trana | weather |
| `sornimodo` | sorni + modo | climate |
| `sumamelli` | suma + melli | temperature |
| `demrovelbi` | demro + velbi | speed of movement |
| `vamrimelli` | vamri + melli | volume |
| `veralanve` | vera + lanve | scientific law |
| `ranfasude` | ranfa + sude | mathematical proof |
| `veraserbubiti` | veraserbu + biti | scientific instrument |

### Society & governance (18)

| Compound | Components | Gloss |
|---|---|---|
| `mavopagodivma` | mavopago + divma | government |
| `lanvedivma` | lanve + divma | public institution |
| `tahayano` | taha + yano | nation |
| `mavopagolivna` | mavopago + livna | election |
| `livnaseno` | livna + seno | vote |
| `lanvefarvi` | lanve + farvi | legal rights |
| `cilnitilma` | cilni + tilma | citizenship |
| `tahatilma` | taha + tilma | international relations |
| `tahalelde` | taha + lelde | a national border |
| `nelajomru` | nela + jomru | human migration |
| `taradadivma` | tarada + divma | economic system |
| `volrudonu` | volru + donu | wealth transfer |
| `mavopagomelva` | mavopago + melva | social welfare |
| `jusenulu` | juse + nulu | justice process |
| `mavopagolemudonu` | mavopago + lemudonu | public education |
| `mavopagosenotilma` | mavopago + senotilma | civic debate |
| `mavopagovalla` | mavopago + valla | political representation |
| `nelalanve` | nela + lanve | civil law |

### Space & orientation (16)

| Compound | Components | Gloss |
|---|---|---|
| `lizmasilda` | lizma + silda | left side |
| `riznosilda` | rizno + silda | right side |
| `zavmesilda` | zavme + silda | front side |
| `nazrusilda` | nazru + silda | rear side |
| `zavmedemro` | zavme + demro | forward motion |
| `nazrudemro` | nazru + demro | backward motion |
| `sildademro` | silda + demro | sideways motion |
| `darnonulu` | darno + nulu | route |
| `nulutilma` | nulu + tilma | intersection |
| `vamrilalni` | vamri + lalni | spatial distance |
| `jomruvelbi` | jomru + velbi | travel speed |
| `lizmavopra` | lizma + vopra | left turn |
| `riznovopra` | rizno + vopra | right turn |
| `zavmepago` | zavme + pago | front area |
| `nazrupago` | nazru + pago | rear area |
| `darnobiti` | darno + biti | compass |

### Technology & AI (42)

| Compound | Components | Gloss |
|---|---|---|
| `sabebiti` | sabe + biti | technology |
| `divmabiti` | divma + biti | machine |
| `cunudivmabiti` | cunu + divmabiti | computer |
| `lordinulu` | lordi + nulu | algorithm |
| `sernadivma` | serna + divma | software |
| `pavmadivmabiti` | pavma + divmabiti | hardware |
| `farlaravmi` | farla + ravmi | artificial intelligence |
| `farvisimvo` | farvi + simvo | autonomy |
| `farvisimvodivmabiti` | farvisimvo + divmabiti | robot |
| `divmatali` | divma + tali | automation |
| `tilmadivma` | tilma + divma | network |
| `sernakova` | serna + kova | database |
| `sernaramu` | serna + ramu | data storage |
| `silbeseno` | silbe + seno | message |
| `favrosilbe` | favro + silbe | signal transmission |
| `favrotilma` | favro + tilma | communication |
| `yalmunulu` | yalmu + nulu | energy conduit |
| `germayalmunulu` | germa + yalmunulu | electrical wire |
| `vismabiti` | visma + biti | sensor |
| `vimobiti` | vimo + biti | camera |
| `lenibiti` | leni + biti | microphone |
| `vallabiti` | valla + biti | loudspeaker |
| `vimolavlo` | vimo + lavlo | display screen |
| `senobiti` | seno + biti | text input device |
| `kemyeseno` | kemye + seno | password |
| `silrodivma` | silro + divma | cryptographic system |
| `tilmadivmapatu` | tilmadivma + patu | network node |
| `sernarilli` | serna + rilli | information download |
| `sernasilbe` | serna + silbe | information upload |
| `sernasamba` | serna + samba | information copying |
| `divmaperemo` | divma + peremo | system error |
| `divmaperemomeyi` | divmaperemo + meyi | software debugging |
| `lideodivma` | lideo + divma | simulation |
| `nafevemi` | nafe + vemi | virtual world |
| `sernasimvo` | serna + simvo | digital identity |
| `farlamavo` | farla + mavo | artificial mind |
| `divmabitinurmi` | divmabiti + nurmi | machine consciousness |
| `divmabitilemu` | divmabiti + lemu | machine learning |
| `lemulordinulu` | lemu + lordinulu | learning algorithm |
| `sernasilro` | serna + silro | data privacy |
| `sernadivmasasva` | sernadivma + sasva | computer security |
| `nelasimvo` | nela + simvo | personhood |

### Time, quantity & work (18)

| Compound | Components | Gloss |
|---|---|---|
| `fulepari` | fule + pari | surplus; quantity beyond what is needed |
| `kronocunu` | krono + cunu | frequency |
| `kronolalni` | krono + lalni | duration |
| `kronopatu` | krono + patu | period or era |
| `talikrono` | tali + krono | work shift |
| `kronotrana` | krono + trana | progress |
| `kronosulno` | krono + sulno | delay |
| `kronoharlu` | krono + harlu | urgency |
| `talilordi` | tali + lordi | work schedule |
| `kendepatu` | kende + patu | milestone |
| `kendelordi` | kende + lordi | priority |
| `divmaranbe` | divma + ranbe | operational capacity |
| `yusopavma` | yuso + pavma | resource |
| `codacunu` | coda + cunu | inventory |
| `talibena` | tali + bena | quality of work |
| `talipesbi` | tali + pesbi | workload |
| `conolordi` | cono + lordi | budget |
| `parimelli` | pari + melli | profit margin |

## 4. Glosses narrowed on integration

Eight candidates were accepted with a narrowed gloss rather than as proposed.
Four had an `english_gloss` that contradicted their own `meaning_scope`; four
would otherwise have shadowed a 1.0 sense. Nothing was invented: a narrowing
either follows the candidate's own scope note or adds the qualifier that keeps
the existing sense intact.

| Headword | Proposed | Integrated as | Why |
|---|---|---|---|
| `germabiti` | steel tool | metal tool; metal implement | Proposed gloss said "steel tool" while its own scope says it "does NOT always imply steel". Narrowed to the material the components actually name (germa, metal). |
| `lazuralka` | predatory aggression | animal aggression; struggle between animals | Proposed gloss said "predatory aggression" while its own scope says it is "NOT always predation". Narrowed; predation proper needs no new word. |
| `folnitino` | plant species | flowering-plant species | Proposed gloss said "plant species" while its own scope restricts it to "Flowering plant type specifically; not all plants". Narrowed to match the folni component. |
| `yanolira` | chorus | chorus; a group-sung section | Proposed gloss said "chorus" while its own scope says it is "NOT necessarily repeated refrain". Narrowed so it does not shadow ralelirapatu. |
| `biotinosolma` | extinction | extinction of a species; the dying out of a kind of life | Bare "extinction" is already the gloss of faruna (faru.negative), which is a fire going out. Qualified so the two senses stay apart. |
| `telnenulu` | plot | plot of a story; narrative line | Bare "plot" is a synonym of silrolordi, "conspiracy; secret plan". Qualified to the narrative sense. |
| `fulepari` | surplus | surplus; quantity beyond what is needed | pari already means gain/profit and lists "surplus" among its synonyms. Qualified to quantity-in-excess, which profit does not cover. |
| `vamri` | space; spatial extent; extension independent of location | space; spatial extent, independent of location | pago lists "space" among its synonyms in the sense of a location. Qualified to extent, as the candidate's own scope directs ("Distinguish physical extent from pago place"). |

## 5. Overlaps checked and accepted

The audit flagged 13 candidates whose gloss text matched an existing 1.0 gloss
or synonym. Four were narrowed (§4). The other nine are English homographs or
1.0 synonym padding, not competing Liraasa senses, so they stand as proposed:

| Headword | Overlaps | On | Why it is not a duplicate |
|---|---|---|---|
| `pavma` | coda | "material" | codasan is "material; conceptual" in the sense of pertaining to a thing or concept. pavma is physical substance. Different senses of one English word. |
| `ravmi` | ranfa | "reason" | ranfa is reason, the faculty and the act. ravmi is intelligence, the capacity. The word "reason" appears only inside ravmi's descriptive gloss, not as its sense. |
| `tilnu` | tavre | "refuse" | English homograph: tavre is to refuse (decline), tilnu is refuse (discarded matter). No Liraasa overlap. |
| `tibiteyo` | pelisupo | "needle" | English homograph: pelisupo lists "needle" meaning to tease. tibiteyo is the sewing implement. |
| `ralelirapatu` | lira | "refrain" | 1.0 synonym padding on lira (song). No 1.0 headword means a repeated song section. |
| `melonulu` | lira | "melody" | 1.0 synonym padding on lira (song). melonulu is the melodic contour, melo + nulu. |
| `navutrana` | folninevlo, fulemiru, galsarenli | "weather" | 1.0 synonym padding on three 0.6-era poetic weather images. No 1.0 headword means weather. |
| `sornimodo` | folninevlo, fulemiru, galsarenli | "climate" | Same padding. No 1.0 headword means climate. |
| `sumamelli` | yugefaru | "temperature" | English idiom: yugefaru is fever, which lists "temperature" as in running a temperature. sumamelli is the physical measure. |

The padding is worth noting on its own: `folninevlo` is "flower-soft snow" and
lists "weather", "climate" and "atmospheric phenomenon" among its synonyms. No
1.0 headword actually means weather, which is why `navutrana` is a real gap
being filled rather than a synonym being added.

## 6. Denied duplicates (from the proposal preflight)

The proposal had already removed 46 candidates before submission. They are
recorded here because "why is there no word for X" is a question that recurs.

### Already an active 1.0 compound (6)

| Proposed | Gloss | Existing |
|---|---|---|
| `vimolalle` | window | window |
| `solopusa` | stone dust | sand |
| `verasude` | empirical evidence | evidence; proof offered |
| `opimomvi` | disappointment | disappointment |
| `sovepomli` | peace agreement | peaceful promise; a vow entrusted to peace |
| `sevutamra` | island | island |

### Sense already carried by another 1.0 word (27)

| Proposed | Gloss | Existing |
|---|---|---|
| `leldetamra` | boundary | pagolelde |
| `pagosovla` | map | pagosarbi |
| `sarbilisi` | ink | sarbimiru |
| `moldiseldi` | throat | havlinulu |
| `mudusuma` | fever | yugefaru |
| `barnisenru` | bruise | vulrasado |
| `havlizogu` | cough | havlibalbu |
| `bioholba` | health | muduna |
| `vulrameyi` | healing | yugemeyi |
| `yanbahunra` | elder | yanbanela |
| `devotilma` | marriage | devoasa |
| `farukova` | oven | farudomlu |
| `cemobiti` | stove | cemofaru |
| `safabiti` | broom | senbabiti |
| `kemyedivma` | lock | kemyesevre |
| `talidapa` | wages | talicono |
| `lanvesarbisenru` | contract | pomlileto |
| `nosvolideo` | hypothesis | nosvopensa |
| `devomomvi` | betrayal | devobalbu |
| `veramaska` | deception | maskavera |
| `larneperemo` | frustration | peremolarne |
| `nedufule` | sufficiency | neduna |
| `kronolelde` | deadline | kronovabale |
| `volrumomvi` | poverty | volruna |
| `solorumne` | cave | monrurumne |
| `mirufule` | flood | fulemiru |
| `vayeruhe` | cyclone | ruherilu |

### Already generable as a productive derivation (13)

| Proposed | Gloss | Existing |
|---|---|---|
| `turnapago` | entrance | Already generable from 1.0 turna + -pago; do not add as a new headword |
| `duvlapago` | exit opening | Already generable from 1.0 duvla + -pago; do not add as a new headword |
| `bemyapago` | beehive | Already generable from 1.0 bemya + -pago; do not add as a new headword |
| `lavrapago` | bird nest | Already generable from 1.0 lavra + -pago; do not add as a new headword |
| `safapago` | bathroom | Already generable from 1.0 safa + -pago; do not add as a new headword |
| `cemopago` | kitchen | Already generable from 1.0 cemo + -pago; do not add as a new headword |
| `lemupago` | school | Already generable from 1.0 lemu + -pago; do not add as a new headword |
| `helnapago` | hospital | Already generable from 1.0 helna + -pago; do not add as a new headword |
| `bullipago` | library | Already generable from 1.0 bulli + -pago; do not add as a new headword |
| `taradapago` | market | Already generable from 1.0 tarada + -pago; do not add as a new headword |
| `lirapago` | stage | Already generable from 1.0 lira + -pago; do not add as a new headword |
| `telnepago` | theater | Already generable from 1.0 telne + -pago; do not add as a new headword |
| `lardapago` | performance space | Already generable from 1.0 larda + -pago; do not add as a new headword |

## 7. Technical edge cases

### Four compounds that also read as a `-pago` derivation

`zavmepago`, `nazrupago`, `lazupago`, `tilnupago` each end in `pago`, which is both a 1.0
headword ("Place") and a productive derivational suffix. Their spellings
therefore carry two analyses: a MODIFIER+HEAD compound, and `X + -pago`.

This is **not** new and not an error. 1.0 already contains three of the same
shape — `larbopago`, `mavopago`, `sasvapago` — and check 3 of the validator
explicitly excuses the case when the compound declares `components:
[base, "pago"]`, because both readings then agree on the morphemes. All four
new entries declare exactly that, and check 3 passes.

### Nesting became ordinary

1.0 had exactly one compound built on another compound (`mudusomubiti`). 1.1
adds 37 more, and `farvisimvodivmabiti` (robot) is the first whose **both**
components are compounds — `farvisimvo` + `divmabiti`. No cycles, and every
component precedes its use (checks 7 and 8).

### 6460 unused gloss slots

Up from 4608. The proposal glossed only the slots that carry real meaning and left
the rest exactly `"— (unused)"`, as 1.0 does. No slot was filled to look tidy,
and no figurative opposite or sacralisation was invented.

### Two status fields on new entries

Each 1.1 entry carries `status_1_0: "NEW"` and `status_1_1: "NEW"`, with
`since: "1.1"`. The first is what the unmodified `validate.py` requires (check
9) and is what makes checks 5 and 18 actually test the new roots; the second is
the edition-specific record the proposal uses. See ADR-0009.

## 8. Validation

Run, not asserted:

```sh
cd data/source
python validate_1_1.py ../lexicon/liraasa_1_1.json \
  --baseline-1-0 liraasa_1_0.json --baseline ../../lexicon_0_8_rc2.json \
  --out ../lexicon/validation_1_1.json
```

| # | Check | Result | Executed against |
|---|---|---|---|
| 1 | Duplicate headwords | PASS | validate.py, unmodified |
| 2 | Root collisions (a root equals another headword's form) | PASS | validate.py, unmodified |
| 3 | Collisions among all seven-form derivatives and -yo/-vu/-pago derivations | PASS | validate.py, unmodified |
| 4 | Function-word, pronoun, correlative, number and time-word collisions with lexical forms | PASS | validate.py, unmodified |
| 5 | Phonotactics of new and respelled roots and new function words | PASS | entries with since == '1.1' (wrapper) |
| 6 | Syllable structure and stress (roots ≥2 syllables, vowel-final except protected amor/apok heads) | PASS | validate.py, unmodified |
| 7 | Compound well-formedness (two active components, MODIFIER+HEAD spelling) | PASS | validate.py, unmodified |
| 8 | Compound dependency cycles | PASS | validate.py, unmodified |
| 9 | Required metadata (and no unresolved glosses) | PASS | entries with since == '1.1' (wrapper) |
| 10 | Seven forms follow the rules (incl. verb rule) | PASS | validate.py, unmodified |
| 11 | Register labels | PASS | validate.py, unmodified |
| 12 | Every 0.8 headword is carried unchanged or has a recorded disposition | PASS | validate.py, unmodified |
| 13 | Reserved (retired/respelled) spellings are not reused by any active item | PASS | validate.py, unmodified |
| 14 | Examples and corpus contain no unknown words | PASS | validate.py, unmodified |
| 15 | No retired or respelled spellings in live examples and corpus | PASS | validate.py, unmodified |
| 16 | Duplicate root glosses (editorial review) | PASS | validate.py, unmodified |
| 17 | Compound segmentation ambiguity (more than one valid two-part split) | PASS | validate.py, unmodified |
| 18 | New roots and particles are at least two edits from every active spelling | PASS | entries with since == '1.1' (wrapper) |
| 19 | New monosyllabic particles: one-edit neighbours only where declared and positionally distinct | PASS | validate.py, unmodified |
| 20 | New particles cannot be read as a lexical form or a suffix | PASS | validate.py, unmodified |
| 21 | Clause grammar: operator order, one evidential, attitude/status/ki clause-final, exclusions | PASS | validate.py, unmodified |
| 22 | Every candidate has one final disposition (182 audit, 150 storytelling, 40 review, 3 unresolved); no TBD | PASS | validate.py, unmodified |
| 23 | Migration table maps every retired form to an active 1.0 form | PASS | validate.py, unmodified |
| 24 | No active compound depends on a retired or respelled primitive | PASS | validate.py, unmodified |
| 25 | Previous edition carried verbatim (headwords, grammar, closed classes, examples) | PASS | validate_1_1.py wrapper |

**25 PASS.**

`liraasa_core.py` and `liraasa_lexicon.py` were absent from the repository, so
`validate.py` could not run at all. Both were reconstructed from
`liraasa_1_0.json` and the Grammar Guide, then checked by parity: the
unmodified `validate.py` reproduces `validation_1_0.json` on the 1.0 lexicon —
all 24 statuses and all finding counts identical. The only differences are the
two notes counting corpus lines (0 against 493), because `corpus/` was not
supplied; the 447 example sentences match exactly.

### Not executed

- The corpus run over `corpus/demo_1_0`, `legacy_0_8`, `songs_1_0`,
  `guide_examples` and `quickstart`. Those files were not supplied, so checks 14,
  15 and 21 ran over the 581 example sentences only, not over the 493 corpus
  lines. **Re-run with `--corpus` when they are available.**
- Listening and singing tests: no audio was produced.

## 9. New example sentences

134 new sentences, all parsing with no unknown words (check 14) and
passing clause-order checking (check 21):

| Domain | Sentences |
|---|---|
| everyday | 28 |
| natural world | 26 |
| social | 26 |
| philosophical | 26 |
| technological | 28 |

Each of the 21 new roots appears in at least three of them (requirement: two).

