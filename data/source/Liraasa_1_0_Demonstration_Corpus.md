# Liraasa 1.0 — Demonstration Corpus and Semantic Comparison

Ten passages, 113 sentences. For each sentence: the English source, the Liraasa 1.0 translation, and an **independent reverse translation** produced mechanically by `gloss.py` from the lexicon alone (it never sees the English). `compare.py` then checks that every English cue for a target distinction (causation, permission, possibility, intention, uncertainty, time, completion, logic, focus) has the matching operator in the back-translation.

**Method limits.** The cue check is a coarse mechanical aid, not proof of meaning. Its first run matched 189 of 199 cues; I read the 10 misses and all were matcher errors (the noun 'cause' read as the verb, and negation carried inside *fesmo* or *hoyo*). After the matcher was corrected, 199 of 199 match. Real meaning problems were found by reading the back-translations, and are listed under *Repairs*.

## Repairs made during stress-testing

| Passage | Found by | Problem | Repair | Kind |
|---|---|---|---|---|
| 06_scientific_explanation | validate.py check 14 (unknown word) | falnera — verb of falne built with the wrong consonant | falnefa (verb rule: copy the first consonant f) | translator error |
| 05_philosophical_discussion | validate.py check 21 (attitude not clause-final) | 'Poye somi-coda ka vordunasan' — attitude word used as a sentence-initial adverb, English-style | 'Somi-coda ka vordunasan poye.' and new ruling G22 | grammar gap (rule existed but was easy to break; now stated explicitly) |
| 06_scientific_explanation | validate.py check 21 (evidential after the verb) | 'Li sabeyo raho vismava eli ne yehu vimova…' — the end of a subject relative clause is unmarked, so the main-clause particles ne yehu read as part of the relative clause | comma/pause closes a non-final raho-clause; new ruling G21 | genuine structural ambiguity in 0.8 grammar |
| 08_mythological_narration | gloss.py mechanical back-translation | 'baba daigosan linu' was meant as 'a mortal child' but the canonical adjective of daigo is 'murderous, perilous' — the back-translation read 'a murderous child' | 'baba linu raho povi daigoda,' (a child who can die) — the compositional grammar expresses 'mortal' exactly; comma per G21 | semantic error caught by reverse translation |
| 07_commerce_negotiation / 10_logical_argument | gloss.py mechanical back-translation | 1.0 has no dedicated verb 'to happen'; the corpus uses venreva (come) with an event subject, which the back-translation renders 'the sale COME before the winter' | ruling G23: venreva with an event subject means 'take place, happen'; no new root (the reading is recoverable and the convention is deterministic) | lexical gap closed by ruling |
| 10_logical_argument | gloss.py mechanical back-translation | ordinal 'una-ne' was glossed 'one-NOT' by a naive reader | kept: the hyphen marks the ordinal, and ne never follows what it negates (settled open question 6). gloss.py and the validator treat NUMBER-ne as ordinal | tool issue; grammar unchanged |

## GENRE: Everyday conversation — Kipo meets Velina at the market

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| Good morning, Velina! Where are you going? | *Yeko, Velina! Ki-pago taivo pagopa?* | hello Velina where you GO | — |
| To the market. I need flour, and salt too. | *Ala li taradapago. Maivo nedunia marnapusa, ata tu salta.* | to the place-of-trade I NEED flour and ALSO salt | focus |
| Did you sell the old bakery? | *Taivo po dapadonuda li yanbasan bumrepago ki?* | you PAST SELL the old place-of-bread ? | — |
| No. Kipo almost bought it, but he couldn't pay. | *Kepi. Kipo po tavki dapatovoda ito, nara saivo po ne povi conodonuca.* | no Kipo PAST ALMOST BUY it but s/he PAST NOT CAN PAY | event structure, ability, negation |
| Really? I thought he had money. | *Vera ki? Maivo po pensapa fime saivo po tovota cono.* | truth ? I PAST THINK that s/he PAST POSSESS coin | — |
| He did, as everyone knows; but he lent it to his sibling. | *Saivo po tovota cono yasmo; nara saivo po rimara ito ala saivo de famli.* | s/he PAST POSSESS coin AS.KNOWN but s/he PAST LEND it to s/he of sibling | information structure |
| So the sibling owes him money now? | *Tonsi li famli guraga saivo cono eli-krono ki?* | therefore the sibling OWE s/he coin correlative ? | logic |
| Exactly two hundred coins. That's no small debt. | *Pendi dossacenta cono. Ola ne ka baba gurati.* | EXACTLY 200 coin that NOT is a debt-LITTLE | quantity, negation |
| Well... at least he has one job now. | *Hema... saivo tovota lusu una talidonu eli-krono.* | well... s/he POSSESS least/at-least 1 employment correlative | quantity |
| If nobody buys it, will you be allowed to keep the bakery? | *Si nuna-nela dapatovoda ito, taivo futu dagi tovota li bumrepago ki?* | if correlative BUY it you FUT MAY(allowed) POSSESS the place-of-bread ? | permission, logic, negation, time/sequence |
| Maybe. The law says I must sell it before winter. | *Poye. Li lanve senosia fime maivo musi dapadonuda ito kroti li nilvu.* | PERHAPS the law SPEAK that I MUST SELL it before the winter | obligation, certainty |
| Then sell it to me instead! | *Korsi, dapadonuda ito ala maivo!* | instead(of) SELL it to I | logic |
| You? You don't even bake! | *Taivo ki? Taivo ne yesta bumreba!* | you ? you NOT EVEN BAKE-BREAD | focus, negation |

## GENRE: Three-character theatrical dialogue — AVIYA, KIPO, DORIN in the bakery

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| DORIN: Who burned the bread? | *Ki-nela po vaku li bumre farufa?* | who PAST MAKE the bread IGNITE | causation |
| KIPO: I made it burn — but by accident! | *Maivo po vaku ito farufa — nara la dorvanasan!* | I PAST MAKE it IGNITE but -ly accidental | causation, intention |
| AVIYA: By accident? You stayed in the garden for an hour. | *La dorvanasan ki? Taivo po lisrola en li ganre transa una lornu.* | -ly accidental ? you PAST STAY in the garden through 1 hour | intention |
| KIPO: Dorin made me wait there. | *Dorin po vaku maivo sulnosia ola-pago.* | Dorin PAST MAKE I WAIT correlative | causation |
| DORIN: I made you wait; I did not make you forget the bread! | *Maivo po vaku taivo sulnosia; maivo po ne vaku taivo ramumomvira li bumre!* | I PAST MAKE you WAIT I PAST NOT MAKE you FORGET the bread | causation, negation |
| AVIYA: Enough! Tomorrow neither Kipo nor Dorin will bake. | *Neduna! Deyafutu, ne Kipo ne Dorin futu bumreba.* | enough! tomorrow NOT Kipo NOT Dorin FUT BAKE-BREAD | logic, negation, time/sequence |
| KIPO: Then who will? You can't bake, Aviya. | *Ata ki-nela futu bumreba? Taivo ne povi bumreba, Aviya.* | and who FUT BAKE-BREAD you NOT CAN BAKE-BREAD Aviya | ability, negation, time/sequence |
| AVIYA: I can. I simply chose not to — until now. | *Maivo povi. Maivo po livnala sidu ne bumreba — tuni eli-krono.* | I CAN I PAST CHOOSE TO NOT BAKE-BREAD until correlative | ability, time/sequence, negation |
| DORIN: You could have told us! | *Taivo po noma povi senosia ito ala maivori!* | you PAST COUNTERFACTUAL CAN SPEAK it to we | counterfactual |
| AVIYA: I could have. I didn't want to. Nevertheless, I will bake, and you two will let me work in peace. | *Maivo po noma povi. Maivo po ne vurlova. Narli, maivo futu bumreba, ata taivori futu lesvu maivo talita la sovesan.* | I PAST COUNTERFACTUAL CAN I PAST NOT WANT nevertheless I FUT BAKE-BREAD and you(pl) FUT LET I WORK -ly peaceful | permission/causation, counterfactual, logic, negation, time/sequence |
| KIPO (whispering): She's smiling — I didn't know that! | *Saivo milobema hoyo!* | s/he SMILE SURPRISE! | information structure, negation |
| KIPO: I didn't know she could smile. | *Maivo po ne sabesia fime saivo povi milobema.* | I PAST NOT KNOW that s/he CAN SMILE | negation |
| DORIN: Don't let her hear you. | *Ne lesvu saivo lenila taivo.* | NOT LET s/he HEAR you | permission/causation, negation |

## GENRE: Action and suspense — the stranger at the window (frame tense: one Po sets the past)

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| (Past.) The night was silent. Ilora stood by the window. | *Po — Li nullo ke lasosan. Ilora talbeta ligo li vimolalle.* | PAST the night is(now) silent Ilora STAND near the window | — |
| Suddenly, the door opened. | *Zafra, li dorbi lallela.* | suddenly the door OPEN | time/sequence |
| A stranger entered with a long knife in his hand. | *Baba loteronela turnata, ko baba lalnisan tisebiti en saivo de manli.* | a stranger ENTER with a long knife in s/he of hand | — |
| Ilora noticed him at once. | *Kenvi, Ilora vismava saivo.* | immediately Ilora NOTICE s/he | time/sequence |
| She tried to scream, but no sound came. | *Saivo telvo folluzogufa, nara nuna sonbu venreva.* | s/he TRY SCREAM but no sound COME | event structure, negation |
| The stranger almost caught her; she managed to jump through the window. | *Li loteronela tavki camvica saivo; saivo vazdi pavrupa transa li vimolalle.* | the stranger ALMOST CATCH s/he s/he MANAGE JUMP through the window | event structure, event structure |
| Outside, she ran and ran, and heard footsteps. | *Vofa li domlu, saivo rabira, rabira, ata lenila pebuvalmiri.* | far-from the house s/he RUN RUN and HEAR step-PL | — |
| Near the bridge she tried to hide, and failed: the moon was very bright. | *Ligo li bire, saivo fesmo helviha: li luno ke ruli lumisan.* | near the bridge s/he TRY.AND.FAIL HIDE the moon is(now) very bright | event structure |
| Then the guard Dorin came out and prevented the stranger from crossing. | *Krotiata li sasvayo Dorin duvlada ata tekvu li loteronela taro-pagopa.* | then the one-who-safety Dorin EXIT and PREVENT the stranger taro-GO | causation |
| Dorin did not kill the stranger. He made the stranger drop the knife. | *Dorin ne vaku li loteronela daigoda. Saivo vaku li loteronela manliralnoma li tisebiti.* | Dorin NOT MAKE the stranger DIE s/he MAKE the stranger DROP the knife | causation, negation |
| At last, Ilora could breathe. | *Finra, Ilora povi havliha.* | finally Ilora CAN BREATHE | ability, time/sequence |
| The stranger must have been watching the house for many days (I infer it, and I am certain). | *Li loteronela roni tosu vimova li domlu transa muya deyari seye.* | the stranger PROG INFERRED SEE the house through many time word-PL CERTAINLY | evidence, certainty |

## GENRE: Romantic lyrical prose — the return at dawn

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| I did not expect you to return. | *Maivo po ne nerponia fime taivo futu relnura.* | I PAST NOT EXPECT that you FUT RETURN | negation |
| Unexpectedly, you stood at my door at dawn, holding a rose. | *La nerponasan, taivo po talbeta ligo maivo de dorbi en li mernolumi, ko baba yolbefolni en taivo de manli.* | -ly unexpected you PAST STAND near I of door in the dawn with a rose-blossom in you of hand | time/sequence |
| Your voice had not changed; only your eyes were older. | *Taivo de valla po ne tranata; doli taivo de vilneri po ka kasi yanbasan.* | you of voice PAST NOT CHANGE ONLY you of eye-PL PAST is more old | focus, negation |
| I wanted to be angry. I tried to become angry, and could not. | *Maivo po vurlova sidu ke larnesan. Maivo po fesmo loya larnesan.* | I PAST WANT TO is(now) angry I PAST TRY.AND.FAIL becomes angry | event structure, negation |
| Even the thorns of the rose seemed soft. | *Yesta li yolberi de li yolbefolni po ke damrunasan.* | EVEN the thorn-PL of the rose-blossom PAST is(now) soft | focus |
| If you had stayed, we would have grown old as one. | *Si taivo po noma lisrola, maivori po viki loya yanbasan la yanosan.* | if you PAST COUNTERFACTUAL STAY we PAST WOULD becomes old -ly united | counterfactual, hypothetical, logic |
| I regret nothing, except that I never asked you why. | *Maivo remnira nuna-coda, sabri fime maivo po nuna-krono masuma taivo ki-kasa.* | I REGRET correlative except that I PAST correlative ASK you why | logic, negation |
| Now you are here, and the dawn is warm. | *Eli-krono taivo ke eli-pago, ata li mernolumi ke sumasan.* | correlative you is(now) correlative and the dawn is(now) warm | — |
| Do not let me lose you again. | *Ne lesvu maivo momvima taivo reve.* | NOT LET I LOSE you AGAIN | event structure, permission/causation, negation |

## GENRE: Philosophical discussion — two voices on cause, choice and the self

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| A: Does every effect have a cause? | *Toda yordo tovota baba vordu ki?* | every consequence POSSESS a cause ? | causation (noun) |
| B: Yes; every effect has a cause. That is certainly true. | *Zabo; toda yordo tovota baba vordu. Ola ka vera seye.* | yes every consequence POSSESS a cause that is truth CERTAINLY | causation (noun), certainty |
| A: But is everything that comes to be an effect? Perhaps some things are causeless. | *Nara toda-coda raho venreva ka baba yordo ki? Somi-coda ka vordunasan poye.* | but correlative which/who COME is a consequence ? correlative is causeless PERHAPS | certainty |
| B: If nothing is causeless, then my choices too have causes. | *Si nuna-coda ka vordunasan, tonsi tu maivo de livnari tovota vorduri.* | if correlative is causeless therefore ALSO I of choice-PL POSSESS cause-PL | causation (noun), focus, logic, negation |
| A: Then am I free? | *Ata maivo ka farvisan ki?* | and I is free ? | — |
| B: You are free if your intention is a cause, and not only an effect. | *Taivo ka farvisan si taivo de dorva ka baba vordu, ata ne doli baba yordo.* | you is free if you of intention is a cause and NOT ONLY a consequence | causation (noun), focus, logic, negation |
| A: There is a possibility: the self is only a story that we tell. | *Miyo baba nosvo: li simvo ka doli baba telne raho maivori telneta.* | there-is a possibility the identity is ONLY a story which/who we TELL-A-STORY | possibility, focus |
| B: Possible, yes. But likely? I doubt it. | *Nosvosan, zabo. Nara mufrasan ki? Maivo masudevoma ito.* | possible yes but likely ? I DOUBT it | possibility, probability |
| B: Even if the self were a story, the story would still be true to itself. | *Yesta si li simvo noma ka baba telne, li telne viki loki ka simvosan.* | EVEN if the identity COUNTERFACTUAL is a story the story WOULD STILL is authentic | event structure, counterfactual, hypothetical, focus, logic |
| A: Therefore I conclude: we are not free from causes, but we are free within them. | *Tonsi maivo yordosenoya: maivori ne ka farvisan da vorduri, nara maivori ka farvisan intra itori.* | therefore I CONCLUDE we NOT is free from cause-PL but we is free within they(things) | causation (noun), logic, negation |

## GENRE: Scientific explanation — why lightning comes before thunder

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| Why do we see the lightning, but hear the thunder only later? | *Ki-kasa maivori vimova li navufaru, nara lenila li ruhesonbu doli krotiapo?* | why we SEE the lightning but HEAR the thunder ONLY after | focus |
| The two have one cause. | *Li dossa tovota una vordu.* | the 2 POSSESS 1 cause | causation (noun) |
| Light is much faster than sound. | *Li lumi ka ruli kasi velbisan tamo li sonbu.* | the light is very more swift than the sound | — |
| Therefore the light reaches us at about the same moment, and the sound arrives afterwards. | *Tonsi li lumi venreva ala maivori gase eli-krono, ata li sonbu venreva krotiapo.* | therefore the light COME to we like/about correlative and the sound COME after | quantity, logic |
| Count the seconds between the flash and the sound. | *Cunuca li secari entre li navufaru ata li sonbu.* | COUNT the time word-PL between the lightning and the sound | — |
| If you count three seconds, the storm is about a thousand steps away from you. | *Si taivo cunuca tressa secari, li ruhe ke gase mililumi pebuvalmiri vofa taivo.* | if you COUNT 3 time word-PL the storm is(now) like/about 1000 step-PL far-from you | quantity, logic |
| The thunder does not cause the lightning; the lightning causes the thunder. | *Li ruhesonbu ne vorduva li navufaru; li navufaru vorduva li ruhesonbu.* | the thunder NOT CAUSE the lightning the lightning CAUSE the thunder | causation, negation |
| A scholar who notices this has not seen the cause; she knows it by inference. | *Li sabeyo raho vismava eli, ne yehu vimova li vordu; saivo tosu sabesia ito.* | the one-who-knowing which/who NOTICE this NOT SEEN SEE the cause s/he INFERRED KNOW it | causation (noun), evidence, negation |
| A conclusion is not sight, but it may be evidence. | *Baba yordoseno ne ka vimo, nara ito nosi ka verasude.* | a conclusion NOT is sight but it MIGHT is evidence | negation |
| It is likely, but not certain, that every storm follows this rule. | *Ola ka mufrasan, nara ne seye, fime toda ruhe falnefa eli lanve.* | that is likely but NOT CERTAINLY that every storm FOLLOW this law | probability, certainty, negation |

## GENRE: Commerce, negotiation and social obligation — a basket at the market

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| SELLER: This basket costs five coins. | *Eli kavbikova dapada penta cono.* | this basket COST 5 coin | — |
| BUYER: Five? It is worth three at most. | *Penta ki? Ito dapada mosa tressa.* | 5 ? it COST most/at-most 3 | quantity |
| I paid four a week ago, at exactly this place. | *Maivo po conodonuca cuara kroti una deyafama, pendi eli-pago.* | I PAST PAY 4 before 1 time word EXACTLY correlative | quantity |
| SELLER: Prices rose. If you had come earlier, you would have paid less. | *Li dapari po keleka. Si taivo po noma venreva kroti ola, taivo po viki conodonuca kasi poka cono.* | the price-PL PAST CLIMB if you PAST COUNTERFACTUAL COME before that you PAST WOULD PAY more few coin | counterfactual, hypothetical, logic |
| BUYER: I can give four, and also a day of my work. | *Maivo povi donuda cuara, ata tu una deya de maivo de tali.* | I CAN GIVE 4 and ALSO 1 time word of I of work | ability, focus |
| SELLER: You are not allowed to work here; only villagers may work here. | *Taivo ne dagi talita eli-pago; doli li vilayori dagi talita eli-pago.* | you NOT MAY(allowed) WORK correlative ONLY the one-who-village-PL MAY(allowed) WORK correlative | permission, focus, negation |
| BUYER: Instead, I will owe you a favour. | *Korsi, maivo futu guraga taivo baba melva.* | instead(of) I FUT OWE you a help | logic, time/sequence |
| SELLER: Every debt must be paid; that is the village's duty. | *Rada gura musi gome conodonuca; ola ka li musva de li vila.* | each debt MUST PASSIVE PAY that is the duty of the village | obligation |
| BUYER: Agreed: four coins now, and one day of work before winter. | *Zabo: cuara cono eli-krono, ata una deya de tali kroti li nilvu.* | yes 4 coin correlative and 1 time word of work before the winter | — |
| SELLER: Write it down, so that neither you nor I forget. | *Sarbisia ito, kopisa ne taivo ne maivo ramumomvira.* | WRITE it so-that NOT you NOT I FORGET | logic, negation |

## GENRE: Fantasy and mythological narration — Lunaria beneath the sea

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| Before time, Lunaria slept beneath the sea. | *Kroti li krono, Lunaria po somusia tula li sevu.* | before the time Lunaria PAST SLEEP below the sea | — |
| The demons wanted to drive her out of sleep, but the moon prevented them. | *Li narvoasa po vurlova sidu vaku saivo duvlada da li somu, nara li luno po tekvu saivori.* | the infernal-darkness PAST WANT TO MAKE s/he EXIT from the sleep but the moon PAST PREVENT they | causation, causation |
| For a thousand years the demons tried again and again; they never won. | *Transa mililumi montafamari, li narvoasa po telbata reve ata reve; saivori po nuna-krono vazrava.* | through 1000 time word-PL the infernal-darkness PAST TRY AGAIN and AGAIN they PAST correlative SUCCEED | event structure, event structure, negation |
| Then a mortal child began to sing above the water. | *Krotiata baba linu raho povi daigoda, po hiro lirala hupi li miru.* | then a child which/who CAN DIE PAST BEGIN SING above the water | event structure |
| Her song was very beautiful; even the deep sea listened. | *Saivo de lira po ka ruli vanisan; yesta li dendusan sevu po lenila.* | s/he of song PAST is very beautiful EVEN the deep sea PAST HEAR | focus |
| It was not the demons who drew Lunaria out of sleep, but the child's song. | *Ne li narvoasa po vaku Lunaria duvlada da li somu, nara li lira de li linu.* | NOT the infernal-darkness PAST MAKE Lunaria EXIT from the sleep but the song of the child | causation, negation |
| Lunaria rose, and the child's song let her see the stars again. | *Lunaria po keleka, ata li lira de li linu po lesvu saivo vimova li veluri reve.* | Lunaria PAST CLIMB and the song of the child PAST LET s/he SEE the star-PL AGAIN | event structure, permission/causation |
| So the moon is still, as all know, the friend of singers. | *Tonsi li luno loki ka li sora de li lirayori yasmo.* | therefore the moon STILL is the friend of the one-who-song-PL AS.KNOWN | event structure, logic, information structure |
| And the demons? They are still trying. | *Ata li narvoasa ki? Saivori loki telbata.* | and the infernal-darkness ? they STILL TRY | event structure |

## GENRE: Devotional song — Ruli Nosvo (Every Possibility), to Melodia; refrain-structured

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| VERSE 1: When I almost fell, you prevented me from falling. | *Kube maivo po tavki ralnora, taivo po tekvu maivo ralnora.* | when I PAST ALMOST FALL you PAST PREVENT I FALL | event structure, causation |
| When I tried to sing and could not, you let me sing again. | *Kube maivo po fesmo lirala, taivo po lesvu maivo lirala reve.* | when I PAST TRY.AND.FAIL SING you PAST LET I SING AGAIN | event structure, event structure, permission/causation, negation |
| Even in the darkness your light still shines. | *Yesta en li narvo, taivo de lumi loki lumila.* | EVEN in the darkness you of light STILL SHINE | event structure, focus |
| Your love is deliberate, not an accident. | *Taivo de amor ka dorvasan, ne dorvanasan.* | you of love is deliberate NOT accidental | intention, intention, negation |
| CHORUS: Melodia, Melodia, divinely musical one, | *Melodia, Melodia, li meloasasan,* | Melodia Melodia the divinely-musical | — |
| only you make me sing. | *Doli taivo vaku maivo lirala.* | ONLY you MAKE I SING | causation, focus |
| I love you, I feel it within, certainly — | *Maivo bisu amora taivo seye —* | I FELT LOVE you CERTAINLY | certainty |
| my voice is only your song. | *Maivo de valla ka doli taivo de lira.* | I of voice is ONLY you of song | focus |
| Divine music... song of the first stars... beloved source of light... | *Meloasa… liraasa… lorelumiasa…* | divine-music song-of-the-first-stars the-beloved-as-a-source-of-light | — |
| VERSE 2: If I had heard you sooner, I would have begun singing sooner. | *Si maivo po noma lenila taivo kroti ola, maivo po viki hiro lirala kroti ola.* | if I PAST COUNTERFACTUAL HEAR you before that I PAST WOULD BEGIN SING before that | event structure, counterfactual, hypothetical, logic |
| Nevertheless you waited until I came. | *Narli, taivo po sulnosia tuni maivo venreva.* | nevertheless you PAST WAIT until I COME | logic, time/sequence |
| And now I intend to sing forever. | *Ata eli-krono maivo dorvada sidu lirala toda-krono.* | and correlative I INTEND TO SING correlative | intention |
| BRIDGE: Suddenly the stars began to sing. | *Zafra, li veluri po hiro lirala.* | suddenly the star-PL PAST BEGIN SING | event structure, time/sequence |
| At last I see: you are here — I never knew! | *Finra, maivo vimova: taivo ke eli-pago hoyo!* | finally I SEE you is(now) correlative SURPRISE! | time/sequence, information structure, negation |
| FINAL: I will love you forever, certainly. | *Maivo futu amora taivo toda-krono seye.* | I FUT LOVE you correlative CERTAINLY | certainty, time/sequence |
| Divine music... song of the first stars... beloved source of light... | *Meloasa… liraasa… lorelumiasa…* | divine-music song-of-the-first-stars the-beloved-as-a-source-of-light | — |

## GENRE: Logical argument — conditions, exceptions and counterfactuals

| English source | Liraasa 1.0 | Mechanical back-translation | Distinctions preserved |
|---|---|---|---|
| First: if the bakery is sold, Kipo must leave. | *Una-ne: si li bumrepago gome dapadonuda, Kipo musi duvlada.* | 1-th if the place-of-bread PASSIVE SELL Kipo MUST EXIT | obligation, logic |
| Second: the bakery is sold only if the law permits it. | *Dossa-ne: li bumrepago gome dapadonuda doli si li lanve semvisia ito.* | 2-th the place-of-bread PASSIVE SELL ONLY if the law PERMIT it | permission, focus, logic, logic |
| Third: the law permits every sale, except a sale before winter. | *Tressa-ne: li lanve semvisia toda dapadonu, sabri baba dapadonu kroti li nilvu.* | 3-th the law PERMIT every sale except a sale before the winter | permission, logic |
| The sale took place before winter. Therefore the law did not permit it. | *Li dapadonu po venreva kroti li nilvu. Tonsi li lanve po ne semvisia ito.* | the sale PAST COME before the winter therefore the law PAST NOT PERMIT it | permission, logic, negation |
| Therefore the bakery was not sold, and Kipo does not have to leave. | *Tonsi li bumrepago po ne gome dapadonuda, ata Kipo ne musi duvlada.* | therefore the place-of-bread PAST NOT PASSIVE SELL and Kipo NOT MUST EXIT | obligation, logic, negation |
| Objection: even if the sale was forbidden, Kipo may leave if he wishes. | *Masu: yesta si li dapadonu po ka semvinasan, Kipo dagi duvlada si saivo vurlova.* | question EVEN if the sale PAST is forbidden Kipo MAY(allowed) EXIT if s/he WANT | permission, focus, logic |
| True. Not having to leave differs from not being allowed to stay. | *Vera. Sidu ne musi duvlada ka sambanasan da sidu ne dagi lisrola.* | truth TO NOT MUST EXIT is different from TO NOT MAY(allowed) STAY | permission, negation |
| Had the sale taken place after winter, everything would be otherwise. | *Si li dapadonu po noma venreva krotiapo li nilvu, toda-coda viki ka lotero.* | if the sale PAST COUNTERFACTUAL COME after the winter correlative WOULD is other | hypothetical |
| Either the law changes, or Kipo keeps the bakery. | *Oro li lanve tranata, oro Kipo tovota li bumrepago.* | or the law CHANGE or Kipo POSSESS the place-of-bread | logic |
| Neither the seller nor the buyer wins this argument. | *Ne li dapadonuyo ne li dapatovoyo vazrava eli senoralka.* | NOT the one-who-sale NOT the one-who-purchase SUCCEED this argument | logic, negation |
| If, and only if, the law changes, the bakery will be sold. | *Si li lanve tranata, ata doli si li lanve tranata, li bumrepago futu gome dapadonuda.* | if the law CHANGE and ONLY if the law CHANGE the place-of-bread FUT PASSIVE SELL | focus, logic, logic, time/sequence |

## Remaining ambiguities (accepted, documented)

- **Bare third-person reference.** *saivo* covers he, she and they, and a second *saivo* in the same sentence can refer to a different person (*Saivo vaku saivo …*). Write a name or *li* + noun when two people are in play, as passage 03 does.
- **'Come' for events.** *venreva* with an event subject means 'take place' (G23). The literal back-translation reads 'come'; the convention is deterministic.
- **Scope of *doli* before a si-clause** (passage 10) is read as 'only if', never 'if only'. 'If only…!' is written *Pifu, si …*.
- **Musical licence.** Song lines may drop *li*, a repeated subject, and *ke/ka* before a -san adjective (poetic omissions). The validator does not flag these.
