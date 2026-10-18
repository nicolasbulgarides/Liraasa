# Liraasa 1.1: Vocabulary-only proposal

**Status:** proposed, not yet integrated into the canonical lexicon.  
**Canonical source:** `liraasa_1_0.json` (SHA-256 `adc013cf99b79ec597c8cfcb9aee9f942e520010556ab6b072bcaa9a606608f3`).  
**Scope:** add vocabulary **only**. Preserve all existing morphology, particles, phonology, syntax, names, and protected 1.0 headwords.

## At a glance

| Measure | Before (1.0) | After, if all proposals accepted |
|---|---:|---:|
| Primal roots | 386 | 407 |
| Canonical compounds | 713 | 1011 |
| Headwords | 1,099 | 1,418 |
| New function words / grammatical changes | 0 | **0** |

**Requested vocabulary:** 21 new primal roots + 298 transparent or lexicalized compounds = 319 additions.

This edition is designed to fill gaps in directions, life sciences, material substances, human relationships, everyday objects, health, performance vocabulary, systematic inquiry, and information technology. It deliberately avoids replacing 1.0 roots or proliferating new grammar operators. Root spellings are **candidate canon** until Claude Code's full project validator approves them.

## Proposed high-leverage primal roots

| Candidate root | English semantic nucleus | Why this earns its own root |
|---|---|---|
| `lazu` | animal; living member of the animal kingdom | Animal life distinct from plants; humans remain biologically animals |
| `jemla` | insect; six-legged arthropod in ordinary usage | A productive base for insect anatomy, life cycles, and ecosystems |
| `pavma` | matter; physical substance; material | Generic physical substance, not interchangeable with idea, weight, or energy |
| `germa` | metal; metallic material | Shared base for wires, alloys, tools, infrastructure, magnetism |
| `yalmu` | energy; capacity to produce physical change | Physics meaning, NOT moral strength or political power |
| `serna` | information; encoded or communicable content | Distinguish information from knowledge sabe, word seno, or idea lideo |
| `lermi` | language; structured human/animal/artificial system of meaningful signs | Distinguish language from an individual word or voice |
| `nurmi` | consciousness; subjective awareness or experience | Do not make consciousness synonymous with intelligence, knowledge or mere alertness |
| `ravmi` | intelligence; capacity to learn, reason, generalize and solve problems | Distinguish capacity from fact-knowledge and consciousness |
| `divma` | system; organized arrangement of interacting parts | Applies to institutions, ecology, software, mechanism, biology |
| `favro` | signal; sign conveying information | Not limited to speech; sensory, mechanical, and electronic signals |
| `vamri` | space; spatial extent; extension independent of location | Distinguish physical extent from pago place, navu sky, and vemi world |
| `demro` | motion; change of spatial position | Generic physical movement versus change trana or walking valmi |
| `purma` | parent; parenthood independent of sex | Biological or social parent; complements mother mare and father pilo |
| `hunra` | maturity; being fully developed or adult | Applies to adult people, ripe fruit, fully developed ideas |
| `lizma` | leftward orientation; left side | Non-relative lexical direction used in navigation |
| `rizno` | rightward orientation; right side | Pairs with lizma; neither is moral rightness |
| `zavme` | front; forward-facing side | Spatial anterior, not future tense |
| `nazru` | rear; back; posterior side | Spatial posterior, not temporal past |
| `tilnu` | waste; refuse; discarded output | Material that is discarded, not moral worthlessness or loss momvi |
| `zarmo` | strike; impact; physical blow/contact with force | Physical striking, not harming inherently, combat ralka, or pushing pune |

**Root semantics to preserve:** `ravmi` (intelligence) ≠ `nurmi` (subjective consciousness) ≠ `mavo` (mind) ≠ `sabe` (knowing); `serna` (information) ≠ `lermi` (language) ≠ `seno` (word); `pavma` (matter) ≠ `yalmu` (energy) ≠ `pesbi` (weight); `lazu` (animal) includes humans *biologically* even though `nela` is the ordinary word for person. Spatial `rizno` (right) must not mean moral rightness (`bena`).

## Proposed compounds by domain

Every line below uses **exactly two active headword components**, modifier first and head last. A component may be a 1.0 headword, one of the new roots, or an earlier proposed 1.1 compound. The accompanying JSON contains the complete dependency-safe insertion order, candidate seven-form spellings, and gloss-policy metadata.

### Space & orientation (16 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `lizmasilda` | left side | `lizma` + `silda` | The side to the left of a reference point |
| `riznosilda` | right side | `rizno` + `silda` | The side to the right |
| `zavmesilda` | front side | `zavme` + `silda` | Anterior face of an object |
| `nazrusilda` | rear side | `nazru` + `silda` | Posterior face of an object |
| `zavmedemro` | forward motion | `zavme` + `demro` | Movement in the facing direction |
| `nazrudemro` | backward motion | `nazru` + `demro` | Movement toward the rear |
| `sildademro` | sideways motion | `silda` + `demro` | Movement laterally |
| `darnonulu` | route | `darno` + `nulu` | A directed or selected path |
| `nulutilma` | intersection | `nulu` + `tilma` | Meeting of paths or junction |
| `vamrilalni` | spatial distance | `vamri` + `lalni` | Length measured across space |
| `jomruvelbi` | travel speed | `jomru` + `velbi` | Speed during a journey |
| `lizmavopra` | left turn | `lizma` + `vopra` | Turning to the left |
| `riznovopra` | right turn | `rizno` + `vopra` | Turning to the right |
| `zavmepago` | front area | `zavme` + `pago` | Space in front |
| `nazrupago` | rear area | `nazru` + `pago` | Space behind |
| `darnobiti` | compass | `darno` + `biti` | Direction-finding instrument |

### Ecology & biology (21 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `nimulazu` | pet | `nimu` + `lazu` | Animal associated with the household |
| `farvilazu` | wild animal | `farvi` + `lazu` | Wild or unconfined animal, NOT necessarily free from ownership |
| `talilazu` | working animal | `tali` + `lazu` | Animal trained for work |
| `sevulazu` | marine animal | `sevu` + `lazu` | Animal living in the sea |
| `jemlatino` | insect kind | `jemla` + `tino` | Taxonomic category of insect |
| `jemlayano` | insect swarm | `jemla` + `yano` | Dense gathering of insects |
| `lazunimu` | animal den | `lazu` + `nimu` | Animal dwelling or den |
| `lazupago` | habitat | `lazu` + `pago` | Place associated with animal life |
| `biodivma` | ecosystem | `bio` + `divma` | Interacting system of living things and their environment |
| `biotino` | species | `bio` + `tino` | A biological kind or species in ordinary usage |
| `bioyuge` | organism | `bio` + `yuge` | Living individual or organism |
| `lazuyano` | herd or pack | `lazu` + `yano` | Collective group of animals |
| `loterobiotino` | biological diversity | `lotero` + `biotino` | Variety of species; lexicalized |
| `lazujomru` | animal migration | `lazu` + `jomru` | Seasonal or long-distance animal journey |
| `biotinosolma` | extinction | `biotino` + `solma` | Disappearance of an entire species |
| `biodonu` | reproduction | `bio` + `donu` | Transmission/giving of new life; not childbirth exclusively |
| `linuvenre` | birth | `linu` + `venre` | Arrival into the world of a child |
| `biovamri` | biosphere | `bio` + `vamri` | Spatial realm in which life exists |
| `lazuralka` | predatory aggression | `lazu` + `ralka` | Animal-on-animal struggle; NOT always predation |
| `folnitino` | plant species | `folni` + `tino` | Flowering plant type specifically; not all plants |
| `larbobiodivma` | forest ecosystem | `larbo` + `biodivma` | System of life associated with trees |

### Materials & physics (22 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `ceresolo` | glass | `cere` + `solo` | Lexicalized transparent hard inorganic material; distinguish natural crystal in specialist language |
| `farusolo` | ceramic | `faru` + `solo` | Fired, stone-like material; lexicalized |
| `domlusolo` | brick | `domlu` + `solo` | Manufactured masonry building block |
| `mirutamra` | mud | `miru` + `tamra` | Water-saturated soil |
| `biotamra` | soil | `bio` + `tamra` | Earth supporting life, versus undifferentiated land |
| `mirunumo` | steam | `miru` + `numo` | Water vapor, especially visible steam plume |
| `tibipavma` | fabric | `tibi` + `pavma` | Thread-based textile material |
| `tibivelma` | textile garment | `tibi` + `velma` | Woven or knitted garment |
| `tiselarboyuge` | plank | `tise` + `larboyuge` | Cut wooden board |
| `germatibi` | wire | `germa` + `tibi` | Thin metallic strand |
| `germalavlo` | metal foil | `germa` + `lavlo` | Thin leaf-like sheet of metal |
| `colbilisi` | paint | `colbi` + `lisi` | Pigmented fluid used as paint; paints need not be oil-based |
| `yalmunami` | fuel | `yalmu` + `nami` | Matter used to feed an energy-producing process |
| `yalmukova` | battery | `yalmu` + `kova` | Device or container storing useful energy |
| `pusanumo` | cloud of dust | `pusa` + `numo` | Suspended mass of dust |
| `sumayalmu` | thermal energy | `suma` + `yalmu` | Heat-energy |
| `lumiyalmu` | radiant energy | `lumi` + `yalmu` | Energy associated with radiation/light |
| `demroyalmu` | kinetic energy | `demro` + `yalmu` | Energy of motion |
| `germativro` | magnet | `germa` + `tivro` | Object that attracts appropriate metal; lexicalized |
| `germabiti` | steel tool | `germa` + `biti` | Metal implement; does NOT always imply steel |
| `germabimne` | metallic structure | `germa` + `bimne` | Metal construction |
| `pavmasovla` | material property | `pavma` + `sovla` | Material form/physical property in a broad sense |

### Health & anatomy (18 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `mavoyuge` | brain | `mavo` + `yuge` | Anatomical organ materially underlying mental activity; conventional anatomical compound |
| `surutibi` | nerve | `suru` + `tibi` | Thread-like structure carrying sensation |
| `ranbeyuge` | muscle | `ranbe` + `yuge` | Force-producing body tissue |
| `sapukova` | stomach | `sapu` + `kova` | Digestive sac; eating-container metaphor |
| `linukova` | womb | `linu` + `kova` | Organ capable of gestating a fetus |
| `linufule` | pregnancy | `linu` + `fule` | Condition of carrying a developing child |
| `senrulalle` | skin pore | `senru` + `lalle` | Opening in skin |
| `mudubio` | pathogen | `mudu` + `bio` | Disease-causing life or microorganism in ordinary usage |
| `nulvazogu` | sneeze | `nulva` + `zogu` | Abrupt expulsion of air through nose/mouth |
| `senrunuravu` | itch | `senru` + `nuravu` | Prickling or irritation of skin |
| `yugefule` | swelling | `yuge` + `fule` | Local bodily enlargement |
| `mavovulra` | psychological trauma | `mavo` + `vulra` | Persisting mental or emotional wound |
| `barnirale` | pulse | `barni` + `rale` | Regular palpable blood-flow beat |
| `yugetali` | exercise | `yuge` + `tali` | Intentional exertion for conditioning |
| `namitrana` | physical digestion | `nami` + `trana` | Transformation of food in digestion |
| `yugehelna` | physical therapy | `yuge` + `helna` | Body-focused therapeutic intervention |
| `helnabiti` | medical instrument | `helna` + `biti` | Device used in treatment |
| `senrumudubio` | skin infection | `senru` + `mudubio` | Illness of the skin due to an organism |

### Family & society (24 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `purmafamli` | aunt or uncle | `purma` + `famli` | Sibling of a parent without sex distinction |
| `purmafamlilinu` | cousin | `purmafamli` + `linu` | Child of a parent's sibling |
| `purmapurma` | grandparent | `purma` + `purma` | A parent's parent; spelling does not imply gender |
| `linulinu` | grandchild | `linu` + `linu` | A child's child |
| `kronopurma` | ancestor | `krono` + `purma` | Earlier genealogical parent |
| `kronolinu` | later descendant | `krono` + `linu` | Later-generation descendant |
| `purmalinu` | offspring | `purma` + `linu` | Child in relation to parent |
| `famanela` | family member | `fama` + `nela` | Individual member of a family |
| `hunranela` | adult person | `hunra` + `nela` | Fully developed person |
| `hunralinu` | adolescent | `hunra` + `linu` | Child in transition toward maturity |
| `talirivo` | colleague | `tali` + `rivo` | Companion in work, not necessarily a personal friend |
| `talilirbu` | supervisor | `tali` + `lirbu` | Leader in a work setting |
| `lemudonurivo` | mentor | `lemudonu` + `rivo` | Supportive companion who teaches |
| `lemutali` | apprenticeship | `lemu` + `tali` | Learning by doing practical work |
| `nelayano` | community | `nela` + `yano` | Association of people |
| `nelacunu` | population | `nela` + `cunu` | Counted collective of people |
| `cilninela` | civic member | `cilni` + `nela` | Resident or member of a city |
| `gonbibena` | hospitality | `gonbi` + `bena` | Care and generosity extended to a guest |
| `soratilma` | friendship | `sora` + `tilma` | The bond between friends |
| `linurilli` | adoption | `linu` + `rilli` | Receiving a child into the role of family, not merely giving temporary custody |
| `maretilma` | motherhood | `mare` + `tilma` | Role and relationship of being a mother |
| `pilotilma` | fatherhood | `pilo` + `tilma` | Role and relationship of being a father |
| `purmatali` | parenting | `purma` + `tali` | Labor and care of raising children |
| `devotilma` | mutual trust | `devo` + `tilma` | Existing trust bond, ALSO a possible interpretation of marriage compound; avoid semantic collision |

### Everyday objects & work (26 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `namresomubiti` | pillow | `namre` + `somubiti` | Headrest used during sleep |
| `somuvelma` | blanket | `somu` + `velma` | Covering worn or laid over someone asleep |
| `yugesomubiti` | mattress | `yuge` + `somubiti` | Padded support for sleeping body |
| `yugetilnu` | body waste | `yuge` + `tilnu` | Bodily excreted waste |
| `yugetilnubiti` | toilet fixture | `yugetilnu` + `biti` | Sanitary fixture used for disposal of bodily waste |
| `tilnukova` | waste bin | `tilnu` + `kova` | Container for rubbish |
| `tilnupago` | rubbish dump | `tilnu` + `pago` | Site for dumping discarded material |
| `safapavma` | soap | `safa` + `pavma` | Substance for washing |
| `safavelma` | washcloth | `safa` + `velma` | Textile used for washing or drying |
| `silikova` | refrigerator | `sili` + `kova` | Cold compartment that preserves food |
| `lumikemye` | light switch | `lumi` + `kemye` | Control that turns lighting on/off |
| `mirudorbi` | faucet | `miru` + `dorbi` | Opening controlling water flow |
| `domlubiti` | furniture | `domlu` + `biti` | Movable implements used within a dwelling |
| `kelebiti` | ladder | `kele` + `biti` | Device aiding climbing |
| `zarmobiti` | hammer | `zarmo` + `biti` | Tool for striking |
| `tibiteyo` | needle | `tibi` + `teyo` | Sharp implement associated with thread |
| `valminulu` | road | `valmi` + `nulu` | Ground route intended for travel; originally a walking path |
| `jomrubiti` | vehicle | `jomru` + `biti` | Travel device |
| `kronobiti` | clock | `krono` + `biti` | Device that measures/displays time |
| `kronosarbisenru` | calendar | `krono` + `sarbisenru` | Document organizing dates/time |
| `dapasarbisenru` | receipt | `dapa` + `sarbisenru` | Document recording a price/payment |
| `mavopagodapa` | income tax | `mavopago` + `dapa` | Price owed to the collective society; conventional sense |
| `gurapari` | interest on debt | `gura` + `pari` | Gain or charge on borrowed capital |
| `rimadapa` | rental fee for non-housing property | `rima` + `dapa` | Payment for temporary use of borrowed equipment or property, complementing domlucono for housing rent |
| `harludapa` | insurance premium | `harlu` + `dapa` | Money paid to insure against risk |
| `conokova` | bank or vault | `cono` + `kova` | Financial storage; bank is metaphorical extension |

### Music & storytelling (24 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `lirasarbi` | poem | `lira` + `sarbi` | Lyrical writing; not necessarily sung |
| `liralarda` | poetry | `lira` + `larda` | Art of verbal lyric composition |
| `lirapatu` | verse | `lira` + `patu` | A section of song or poem |
| `sarbilirapatu` | stanza | `sarbi` + `lirapatu` | Written grouping of lines/verse |
| `yanolira` | chorus | `yano` + `lira` | Group-sung section; NOT necessarily repeated refrain |
| `ralelirapatu` | refrain | `rale` + `lirapatu` | Song section repeated in recognizable form |
| `sonbusamba` | rhyme | `sonbu` + `samba` | Sound correspondence between different words |
| `kronosonbu` | rhythm | `krono` + `sonbu` | Organized pattern of sonic timing |
| `melonulu` | melody | `melo` + `nulu` | Path or contour of musical notes |
| `yanosonbu` | harmony | `yano` + `sonbu` | Simultaneous sounds in consonant relation |
| `ralkasonbu` | dissonance | `ralka` + `sonbu` | Clashing sounds |
| `melobiti` | musical instrument | `melo` + `biti` | Physical musical tool |
| `leninela` | listener or audience member | `leni` + `nela` | Person attentively hearing a performance |
| `lardayano` | ensemble | `larda` + `yano` | Collective artistic performers |
| `telnepatu` | scene | `telne` + `patu` | Part of a narrative or play |
| `telnenulu` | plot | `telne` + `nulu` | Path taken by a story |
| `senotilma` | spoken dialogue | `seno` + `tilma` | Connected exchange of words |
| `lideosovla` | metaphor | `lideo` + `sovla` | Conceptual shape; lexicalized figurative mapping |
| `nafetelne` | fiction | `nafe` + `telne` | Imagined narrative |
| `nelatelne` | biography | `nela` + `telne` | Story of a person's life |
| `kronoramu` | history | `krono` + `ramu` | Collective recollection of past events |
| `ramutelne` | legend | `ramu` + `telne` | Traditional remembered story |
| `liratelne` | opera | `lira` + `telne` | Drama substantially carried through singing |
| `melolordi` | musical arrangement | `melo` + `lordi` | Organization of music |

### Science & philosophical inquiry (32 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `veraserbu` | science | `vera` + `serbu` | Systematic inquiry into the physical/social world, not any search for truth |
| `sabeserbu` | research | `sabe` + `serbu` | Disciplined pursuit of knowledge |
| `sabetelba` | experiment | `sabe` + `telba` | Controlled empirical test, not any attempt to know |
| `vismatali` | observation | `visma` + `tali` | Deliberate work of attending to a phenomenon |
| `mellicunu` | measurement | `melli` + `cunu` | Assigning numerical magnitude to a property |
| `sambaseno` | mathematical equation | `samba` + `seno` | Formal statement of equality |
| `cunuranfa` | mathematics | `cunu` + `ranfa` | Reasoned mathematics, beyond mere counting |
| `sovlaranfa` | geometry | `sovla` + `ranfa` | Reasoning concerning shapes and spatial relations |
| `pavmasabe` | physics | `pavma` + `sabe` | Systematic study of matter and physical processes |
| `pavmatrana` | chemistry | `pavma` + `trana` | Study of material transformations; conventional |
| `biosabe` | biology | `bio` + `sabe` | Scientific inquiry concerning living systems |
| `biotilma` | ecological relations | `bio` + `tilma` | Relationships among living things and environments |
| `mavosabe` | psychology | `mavo` + `sabe` | Study of minds and behaviors |
| `navusabe` | astronomy | `navu` + `sabe` | Study of celestial bodies, not weather forecasting |
| `lideoserbu` | philosophy | `lideo` + `serbu` | Reasoned inquiry into fundamental concepts |
| `benaranfa` | ethics | `bena` + `ranfa` | Reasoning about morality and normativity |
| `ranfalideo` | theory | `ranfa` + `lideo` | Organized explanatory idea, not merely a guess |
| `sovlalideo` | conceptual model | `sovla` + `lideo` | Representation of a concept or phenomenon |
| `vorduyordo` | causal outcome | `vordu` + `yordo` | Result attributable to an antecedent cause |
| `pesbivordu` | gravity | `pesbi` + `vordu` | Cause of gravitational weight; technical meaning lexicalized |
| `demrovordu` | physical force | `demro` + `vordu` | Interaction capable of changing motion |
| `pavmapatu` | material particle | `pavma` + `patu` | Small distinguishable piece of matter; not necessarily an atom |
| `navuvamri` | outer space | `navu` + `vamri` | Cosmic extent beyond local atmosphere |
| `vamridarno` | spatial dimension | `vamri` + `darno` | Independent direction or coordinate of spatial extent |
| `navutrana` | weather | `navu` + `trana` | Changing atmospheric conditions |
| `sornimodo` | climate | `sorni` + `modo` | Long-term seasonal pattern |
| `sumamelli` | temperature | `suma` + `melli` | Physical degree of warmth, not exclusively hot weather |
| `demrovelbi` | speed of movement | `demro` + `velbi` | Rate of motion |
| `vamrimelli` | volume | `vamri` + `melli` | Magnitude of three-dimensional spatial extent |
| `veralanve` | scientific law | `vera` + `lanve` | General regularity of nature, not legislation |
| `ranfasude` | mathematical proof | `ranfa` + `sude` | Demonstration supported by reasoning |
| `veraserbubiti` | scientific instrument | `veraserbu` + `biti` | Device made for scientific investigation |

### Technology & AI (42 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `sabebiti` | technology | `sabe` + `biti` | Applied knowledge manifested in devices |
| `divmabiti` | machine | `divma` + `biti` | Organized working mechanism or machine |
| `cunudivmabiti` | computer | `cunu` + `divmabiti` | Information-processing machine; historical counting metaphor |
| `lordinulu` | algorithm | `lordi` + `nulu` | Ordered procedural steps; lexicalized |
| `sernadivma` | software | `serna` + `divma` | Executable information-organized system |
| `pavmadivmabiti` | hardware | `pavma` + `divmabiti` | Physical machinery or computing components |
| `farlaravmi` | artificial intelligence | `farla` + `ravmi` | Artificially created intellectual capability; does NOT imply consciousness |
| `farvisimvo` | autonomy | `farvi` + `simvo` | Capacity for self-directed activity rather than merely personal liberty |
| `farvisimvodivmabiti` | robot | `farvisimvo` + `divmabiti` | Autonomous physical machine (literal freedom metaphor) |
| `divmatali` | automation | `divma` + `tali` | Work performed by an organized system |
| `tilmadivma` | network | `tilma` + `divma` | System of interconnected elements |
| `sernakova` | database | `serna` + `kova` | Organized information store, metaphorical information-container |
| `sernaramu` | data storage | `serna` + `ramu` | Information retained for later retrieval |
| `silbeseno` | message | `silbe` + `seno` | Words communicated from sender to receiver |
| `favrosilbe` | signal transmission | `favro` + `silbe` | Sending of an encoded or perceptible signal |
| `favrotilma` | communication | `favro` + `tilma` | Link made by exchanging signals |
| `yalmunulu` | energy conduit | `yalmu` + `nulu` | Path that channels energy |
| `germayalmunulu` | electrical wire | `germa` + `yalmunulu` | Metal conductor used as energy path |
| `vismabiti` | sensor | `visma` + `biti` | Device for detecting or measuring inputs |
| `vimobiti` | camera | `vimo` + `biti` | Device recording visual stimuli |
| `lenibiti` | microphone | `leni` + `biti` | Device receiving sound |
| `vallabiti` | loudspeaker | `valla` + `biti` | Device emitting amplified sound |
| `vimolavlo` | display screen | `vimo` + `lavlo` | Flat visible display surface |
| `senobiti` | text input device | `seno` + `biti` | Tool used to enter words, such as a keyboard |
| `kemyeseno` | password | `kemye` + `seno` | Word or phrase functioning as an access key |
| `silrodivma` | cryptographic system | `silro` + `divma` | System for protecting communication through secrecy |
| `tilmadivmapatu` | network node | `tilmadivma` + `patu` | Component of a network |
| `sernarilli` | information download | `serna` + `rilli` | Receiving information from another system |
| `sernasilbe` | information upload | `serna` + `silbe` | Sending information to another system |
| `sernasamba` | information copying | `serna` + `samba` | Reproducing an identical information pattern |
| `divmaperemo` | system error | `divma` + `peremo` | Fault in an organized system |
| `divmaperemomeyi` | software debugging | `divmaperemo` + `meyi` | Repairing identified system faults |
| `lideodivma` | simulation | `lideo` + `divma` | Executable model representing an idea or process |
| `nafevemi` | virtual world | `nafe` + `vemi` | Imagined or digitally simulated world |
| `sernasimvo` | digital identity | `serna` + `simvo` | Identity represented in data |
| `farlamavo` | artificial mind | `farla` + `mavo` | Mind fabricated by design; distinct from proven consciousness |
| `divmabitinurmi` | machine consciousness | `divmabiti` + `nurmi` | Subjective experience attributed to a machine |
| `divmabitilemu` | machine learning | `divmabiti` + `lemu` | Learning by computational machinery |
| `lemulordinulu` | learning algorithm | `lemu` + `lordinulu` | Procedure intended to learn or adapt |
| `sernasilro` | data privacy | `serna` + `silro` | Confidentiality of information |
| `sernadivmasasva` | computer security | `sernadivma` + `sasva` | Safety and security of information systems |
| `nelasimvo` | personhood | `nela` + `simvo` | Status or identity as a person |

### Ethics & emotions (17 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `farviyeba` | consent | `farvi` + `yeba` | Freely given agreement, not mere legal permission |
| `vordumusva` | accountability | `vordu` + `musva` | Responsibility for the consequences of one's actions |
| `kulpamera` | forgiveness | `kulpa` + `mera` | Mercy extended where blame would be possible |
| `verasimvo` | honesty | `vera` + `simvo` | Stable truthfulness of character |
| `benasimvo` | moral integrity | `bena` + `simvo` | Consistency of moral principles |
| `surutilma` | empathy | `suru` + `tilma` | Feeling-based connection with another person's experience |
| `nememera` | compassion | `neme` + `mera` | Mercy motivated by another's suffering |
| `amorharlu` | romantic jealousy | `amor` + `harlu` | Perceived threat to a valued romantic bond |
| `loterovorba` | social envy | `lotero` + `vorba` | Longing for what another possesses |
| `nelavarde` | human dignity | `nela` + `varde` | Worth deserved simply by being a person |
| `devobena` | trustworthiness | `devo` + `bena` | Reliability in commitments |
| `jusedivma` | justice system | `juse` + `divma` | Institutions and structures implementing justice |
| `maivokaldo` | self-restraint | `maivo` + `kaldo` | Conscious limitation of one's own behavior |
| `vulraranbe` | resilience | `vulra` + `ranbe` | Strength maintained or regained after injury |
| `simvolivna` | self-determination | `simvo` + `livna` | Ability to choose one's own direction |
| `benamavopago` | ethical society | `bena` + `mavopago` | Community structured around moral commitments |
| `benavulra` | moral injury | `bena` + `vulra` | Wound suffered through violation of moral belief |

### Time, quantity & work (18 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `fulepari` | surplus | `fule` + `pari` | Quantity in excess of need |
| `kronocunu` | frequency | `krono` + `cunu` | How many occurrences per unit time |
| `kronolalni` | duration | `krono` + `lalni` | Extent of time |
| `kronopatu` | period or era | `krono` + `patu` | Delimited span of time |
| `talikrono` | work shift | `tali` + `krono` | Period spent working |
| `kronotrana` | progress | `krono` + `trana` | Change achieved over time |
| `kronosulno` | delay | `krono` + `sulno` | Waiting that extends a schedule |
| `kronoharlu` | urgency | `krono` + `harlu` | Danger or pressure tied to time |
| `talilordi` | work schedule | `tali` + `lordi` | Ordered sequence of work activities |
| `kendepatu` | milestone | `kende` + `patu` | Intermediate part toward a goal |
| `kendelordi` | priority | `kende` + `lordi` | Ordering of goals or tasks |
| `divmaranbe` | operational capacity | `divma` + `ranbe` | Effective operating capacity of a system |
| `yusopavma` | resource | `yuso` + `pavma` | Material available for purposeful use |
| `codacunu` | inventory | `coda` + `cunu` | Counted register of things |
| `talibena` | quality of work | `tali` + `bena` | Goodness of workmanship, not moral goodness |
| `talipesbi` | workload | `tali` + `pesbi` | Burden/weight of work |
| `conolordi` | budget | `cono` + `lordi` | Planned organization of monetary means |
| `parimelli` | profit margin | `pari` + `melli` | Magnitude of profit |

### Society & governance (18 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `mavopagodivma` | government | `mavopago` + `divma` | Institutional operating system of society |
| `lanvedivma` | public institution | `lanve` + `divma` | Institution constituted under rules/law |
| `tahayano` | nation | `taha` + `yano` | Collective political identity associated with a country |
| `mavopagolivna` | election | `mavopago` + `livna` | Choice made collectively by society |
| `livnaseno` | vote | `livna` + `seno` | Expressed civic choice |
| `lanvefarvi` | legal rights | `lanve` + `farvi` | Freedoms secured by law |
| `cilnitilma` | citizenship | `cilni` + `tilma` | Relationship between a person and a civic community |
| `tahatilma` | international relations | `taha` + `tilma` | Connections between countries |
| `tahalelde` | a national border | `taha` + `lelde` | Boundary of a country |
| `nelajomru` | human migration | `nela` + `jomru` | Population travel or migration |
| `taradadivma` | economic system | `tarada` + `divma` | Organized circulation of trade |
| `volrudonu` | wealth transfer | `volru` + `donu` | Movement of wealth between holders |
| `mavopagomelva` | social welfare | `mavopago` + `melva` | Assistance organized by society |
| `jusenulu` | justice process | `juse` + `nulu` | Procedural route to justice |
| `mavopagolemudonu` | public education | `mavopago` + `lemudonu` | Collectively organized teaching or education |
| `mavopagosenotilma` | civic debate | `mavopago` + `senotilma` | Exchange of words about society |
| `mavopagovalla` | political representation | `mavopago` + `valla` | Voice of the populace; figurative representation |
| `nelalanve` | civil law | `nela` + `lanve` | Laws governing people and their civil relations |

### Nature & geography (20 candidates)

| Proposed headword | Meaning | Components | Editorial scope |
|---|---|---|---|
| `tamramiru` | lake | `tamra` + `miru` | Standing inland body of water |
| `sevupusa` | beach | `sevu` + `pusa` | Sandy shore, especially a sea beach |
| `sevulelde` | coast | `sevu` + `lelde` | Boundary at the sea |
| `tamralelde` | cliff | `tamra` + `lelde` | Abrupt edge of land |
| `farumonru` | volcano | `faru` + `monru` | Fire mountain, volcanic feature |
| `lesmamiru` | oasis | `lesma` + `miru` | Water available within a desert |
| `mirugalsa` | marsh | `miru` + `galsa` | Waterlogged grassy ground |
| `miruralno` | waterfall | `miru` + `ralno` | Falling water |
| `mirunululombi` | source of a river | `mirunulu` + `lombi` | River's beginning |
| `teruzego` | earthquake | `teru` + `zego` | Shaking of the ground |
| `ruhevabeve` | storm surge | `ruhe` + `vabeve` | Storm-driven high water or wave |
| `renlicolbi` | rainbow | `renli` + `colbi` | Colors appearing with rain |
| `veluralno` | meteor | `velu` + `ralno` | Traditional 'falling star'; scientifically a meteor |
| `sulbasado` | solar eclipse | `sulba` + `sado` | Sun temporarily darkened by occlusion |
| `lunosado` | lunar eclipse | `luno` + `sado` | Moon darkened by occlusion |
| `veluvemi` | planet | `velu` + `vemi` | World orbiting a star, not itself a star |
| `veluyano` | galaxy | `velu` + `yano` | Gravitationally bound system of stars |
| `vopranulu` | orbit | `vopra` + `nulu` | Closed or repeating path around a body |
| `tamrasovla` | landscape | `tamra` + `sovla` | Physical shape and appearance of land |
| `mirulombi` | water source | `miru` + `lombi` | Origin of accessible water |

## What we found already present in 1.0

The seven-form lexicon and inherited compounds already cover a number of concepts that initially looked like gaps. **Do not duplicate** these when importing the proposal:

- `namina` = hunger; `buvona` = thirst; `devorivo` = spouse; `sarbisenru` = paper.
- `maremiru` = milk; `lavrasamni` = egg; `yugenami` = meat; `sevutamra` = island.
- `verasude` = evidence; `opimomvi` = disappointment; `fulemiru` = flood.
- `yugefaru` = fever; `vulrasado` = bruise; `havlibalbu` = cough; `havlinulu` = throat.
- `talicono` = wages; `pomlileto` = contract; `kemyesevre` = locking; `mudu` + `-na` = health.

### Standard derivations that don't need new headwords

The following spellings are already composable with **existing 1.0 `-pago` morphology**. They are useful translation practices, not new 1.1 headword proposals. Context may demand additional clarification.

| 1.0-derived spelling | Suggested usage |
|---|---|
| `turnapago` | entrance |
| `duvlapago` | exit opening |
| `bemyapago` | beehive |
| `lavrapago` | bird nest |
| `safapago` | bathroom |
| `cemopago` | kitchen |
| `lemupago` | school |
| `helnapago` | hospital |
| `bullipago` | library |
| `taradapago` | market |
| `lirapago` | stage |
| `telnepago` | theater |
| `lardapago` | performance space |

## Editorial constraints

1. **Do not revise grammar.** The 20-slot clause, case/tense/function-word inventory, seven-form rules, compounding order, stress, and all existing rulings remain verbatim.
2. **Do not replace or rename 1.0 forms.** All 1.0 entries remain protected, and retired/version-reserved spellings stay reserved.
3. **Do not lexicalize an accident.** Ordinary literal compounds are easy; semantic jumps marked elevated-risk require deliberate review. For technical concepts, distinguish precision from evocative imagery.
4. **Never add a duplicate concept solely to make the count larger.** The explicit excluded lists were found by checking 1.0 glosses and derivations.
5. **Use 1.0 morphology mechanically.** All seven surface forms are written into the JSON, but most compound slots other than the noun are deliberately marked `— (unused)` rather than burdened with invented idioms. Claude Code may give a derived slot a real gloss if its meaning is well-supported and productive.
6. **Validate after adding, not before claiming success.** The proposal passes an independent local spelling/segmentation preflight, but the canonical 1.0 project validation suite has not been run on an integrated 1.1 lexicon.

## Suggested next stress tests

Test everyday errands; directions and household needs; courtroom and moral-responsibility dialogue; scientific discussion comparing matter, energy, information, intelligence, and consciousness; a three-character scene containing misunderstandings and complex emotional implications; a piece of lyric writing using the new nature vocabulary. Include literal back-translation and a list of meanings still requiring awkward circumlocution.
