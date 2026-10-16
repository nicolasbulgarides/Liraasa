/**
 * New example sentences for 1.1.
 *
 * The integration prompt asks for at least 120 new sentences spread across
 * everyday, natural-world, social, philosophical and technological domains,
 * each round-tripping through the lexicon, with every one of the 21 new roots
 * used at least twice.
 *
 * Every sentence is built only from spellings that exist: 1.0 and 1.1 headword
 * forms, their `-yo`/`-vu`/`-pago` derivations, `-ti`/`-ri` suffixes, and the
 * unchanged closed classes. No word is invented, and no sentence uses a slot
 * whose gloss is `"— (unused)"`.
 *
 * Grammar is 1.0's, untouched: SVO, tense before negation before modal, `la` +
 * adjective for adverbs, attitude markers clause-final.
 *
 * `scripts/integrate.ts` verifies all of this before anything is written.
 */
import type { RawLexicon } from '../model/raw';
import type { Proposal } from './proposalTypes';

export type ExampleDomain =
  | 'everyday'
  | 'natural world'
  | 'social'
  | 'philosophical'
  | 'technological';

export interface NewExample {
  liraasa: string;
  english: string;
  feature: string;
  domain: ExampleDomain;
}

/* ------------------------------------------------------------------ everyday */

const EVERYDAY: NewExample[] = [
  {
    liraasa: 'Maivo vimova baba lazu en li ganre.',
    english: 'I see an animal in the garden.',
    feature: 'lazu (animal)',
    domain: 'everyday',
  },
  {
    liraasa: 'Li jemla ka baba lazu.',
    english: 'An insect is an animal.',
    feature: 'jemla, lazu; ka for an essential class',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo po vimova muya jemlari en li folni.',
    english: 'I saw many insects on the flower.',
    feature: 'jemla with -ri plural',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo de purma po talita en li domlu.',
    english: 'My parent worked in the house.',
    feature: 'purma (parent); OWNER de THING',
    domain: 'everyday',
  },
  {
    liraasa: 'Li purma linula li linu la benasan.',
    english: 'The parent nurtures the child well.',
    feature: 'purma; la + adjective adverb',
    domain: 'everyday',
  },
  {
    liraasa: 'Li hunranela po livnala li nulu.',
    english: 'The adult chose the path.',
    feature: 'hunranela (adult person)',
    domain: 'everyday',
  },
  {
    liraasa: 'Li linu futu hunraha.',
    english: 'The child will mature.',
    feature: 'hunra verb; futu',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo tovota baba germabiti.',
    english: 'I have a metal tool.',
    feature: 'germabiti (metal tool)',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo po bitiba li germabiti.',
    english: 'I used the metal tool.',
    feature: 'germabiti as object',
    domain: 'everyday',
  },
  {
    liraasa: 'Taivo tovota baba ceresolo ki?',
    english: 'Do you have a glass?',
    feature: 'ceresolo; clause-final ki',
    domain: 'everyday',
  },
  {
    liraasa: 'Li tilnu ke en li tilnupago.',
    english: 'The waste is in the rubbish dump.',
    feature: 'tilnu, tilnupago',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo futu tilnuta li tilnu.',
    english: 'I will discard the waste.',
    feature: 'tilnu verb',
    domain: 'everyday',
  },
  {
    liraasa: 'Li sumamelli po tranata.',
    english: 'The temperature changed.',
    feature: 'sumamelli (temperature)',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo po zarmoza li dorbi.',
    english: 'I struck the door.',
    feature: 'zarmo verb',
    domain: 'everyday',
  },
  {
    liraasa: 'Li zarmo po vorduva baba vulrasado.',
    english: 'The blow caused a bruise.',
    feature: 'zarmo as noun subject',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo vimova li lizmasilda de li domlu.',
    english: 'I see the left side of the house.',
    feature: 'lizmasilda',
    domain: 'everyday',
  },
  {
    liraasa: 'Taivo lizmala, ata maivo riznora.',
    english: 'You turn left, and I turn right.',
    feature: 'lizma and rizno verbs; ata coordination',
    domain: 'everyday',
  },
  {
    liraasa: 'Li riznosilda de li nulu ke narvosan.',
    english: 'The right side of the path is dark.',
    feature: 'riznosilda',
    domain: 'everyday',
  },
  {
    liraasa: 'Li zavme de li domlu ke lumisan.',
    english: 'The front of the house is bright.',
    feature: 'zavme as noun',
    domain: 'everyday',
  },
  {
    liraasa: 'Li nazru de li domlu ke narvosan.',
    english: 'The back of the house is dark.',
    feature: 'nazru as noun',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo po zavmeza ala li dorbi.',
    english: 'I moved forward to the door.',
    feature: 'zavme verb; ala goal',
    domain: 'everyday',
  },
  {
    liraasa: 'Saivo po nazrunia da li faru.',
    english: 'She moved back from the fire.',
    feature: 'nazru verb (n-initial -nia); da source',
    domain: 'everyday',
  },
  {
    liraasa: 'Li sapukova de li linu ke mudusan.',
    english: "The child's stomach is unwell.",
    feature: 'sapukova (stomach)',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo po helnaha li linu ko li helna.',
    english: 'I treated the child with the medicine.',
    feature: 'ko accompaniment',
    domain: 'everyday',
  },
  {
    liraasa: 'Li purmafamli de maivo po venreva.',
    english: 'My aunt arrived.',
    feature: 'purmafamli (aunt or uncle)',
    domain: 'everyday',
  },
  {
    liraasa: 'Li tibiteyo ke germasan.',
    english: 'The needle is metallic.',
    feature: 'tibiteyo; germa adjective',
    domain: 'everyday',
  },
  {
    liraasa: 'Maivo ne tovota baba germativro.',
    english: 'I do not have a magnet.',
    feature: 'germativro; ne before the verb',
    domain: 'everyday',
  },
  {
    liraasa: 'Li farusolo kovaka li miru.',
    english: 'The ceramic holds the water.',
    feature: 'farusolo (ceramic)',
    domain: 'everyday',
  },
];

/* ------------------------------------------------------------ natural world */

const NATURAL: NewExample[] = [
  {
    liraasa: 'Li farvilazu ka demrosan.',
    english: 'The wild animal is moving.',
    feature: 'farvilazu, demro adjective',
    domain: 'natural world',
  },
  {
    liraasa: 'Li lazu po demroda ala li larbo.',
    english: 'The animal moved to the tree.',
    feature: 'lazu, demro verb',
    domain: 'natural world',
  },
  {
    liraasa: 'Li demro de li miru ke velbisan.',
    english: 'The motion of the water is quick.',
    feature: 'demro as noun',
    domain: 'natural world',
  },
  {
    liraasa: 'Muya folnitinori bioba en li monru.',
    english: 'Many flowering-plant species live on the mountain.',
    feature: 'folnitino with -ri',
    domain: 'natural world',
  },
  {
    liraasa: 'Li loterobiotino de li tamra ka benasan seye.',
    english: "The land's biological diversity is good, certainly.",
    feature: 'loterobiotino; clause-final seye',
    domain: 'natural world',
  },
  {
    liraasa: 'Maivo ne vurlova li biotinosolma de li lazu.',
    english: 'I do not want the extinction of the animal.',
    feature: 'biotinosolma (species extinction)',
    domain: 'natural world',
  },
  {
    liraasa: 'Li sornimodo de li tamra po tranata.',
    english: "The land's climate changed.",
    feature: 'sornimodo (climate)',
    domain: 'natural world',
  },
  {
    liraasa: 'Li navutrana po tranata en li sorni.',
    english: 'The weather changed in the season.',
    feature: 'navutrana (weather)',
    domain: 'natural world',
  },
  {
    liraasa: 'Li renli po venreva en li nullo.',
    english: 'The rain came in the night.',
    feature: 'existing vocabulary, new corpus line',
    domain: 'natural world',
  },
  {
    liraasa: 'Li lumi ke yalmusan.',
    english: 'Light is energy-bearing.',
    feature: 'yalmu adjective',
    domain: 'natural world',
  },
  {
    liraasa: 'Li velu yalmuya li vemi.',
    english: 'The star energizes the world.',
    feature: 'yalmu verb',
    domain: 'natural world',
  },
  {
    liraasa: 'Li pesbivordu po demroda li solo.',
    english: 'Gravity moved the stone.',
    feature: 'pesbivordu, demro verb',
    domain: 'natural world',
  },
  {
    liraasa: 'Li pavma de li monru ka germasan.',
    english: "The mountain's matter is metallic.",
    feature: 'pavma, germa',
    domain: 'natural world',
  },
  {
    liraasa: 'Li pavmapatu ne ka baba lazu.',
    english: 'A material particle is not an animal.',
    feature: 'pavmapatu; ne ka',
    domain: 'natural world',
  },
  {
    liraasa: 'Maivo po lenila li jemla en li nullo.',
    english: 'I heard the insect in the night.',
    feature: 'jemla',
    domain: 'natural world',
  },
  {
    liraasa: 'Li lazupago de li farvilazu ke en li monru.',
    english: "The wild animal's habitat is in the mountain.",
    feature: 'lazupago, farvilazu',
    domain: 'natural world',
  },
  {
    liraasa: 'Li vamri de li navu ke lalnisan.',
    english: 'The space of the sky is vast.',
    feature: 'vamri as noun',
    domain: 'natural world',
  },
  {
    liraasa: 'Li veluri ke en li vamri.',
    english: 'The stars are in space.',
    feature: 'vamri; -ri plural',
    domain: 'natural world',
  },
  {
    liraasa: 'Li sevu ka mirusan.',
    english: 'The sea is watery.',
    feature: 'ka for an essential property',
    domain: 'natural world',
  },
  {
    liraasa: 'Li nevlo po tranata ala li miru.',
    english: 'The snow changed into water.',
    feature: 'trana with ala',
    domain: 'natural world',
  },
  {
    liraasa: 'Li jemla po demroda ala li folni.',
    english: 'The insect moved to the flower.',
    feature: 'jemla, demro',
    domain: 'natural world',
  },
  {
    liraasa: 'Li germa ke en li tamra.',
    english: 'The metal is in the land.',
    feature: 'germa as noun',
    domain: 'natural world',
  },
  {
    liraasa: 'Li navutrana ne ka sovesan eli-krono.',
    english: 'The weather is not calm now.',
    feature: 'navutrana; eli-krono',
    domain: 'natural world',
  },
  {
    liraasa: 'Muya lazuri bioba en li sevu.',
    english: 'Many animals live in the sea.',
    feature: 'lazu with -ri',
    domain: 'natural world',
  },
  {
    liraasa: 'Li lazuralka po venreva en li nullo.',
    english: 'The animal struggle took place in the night.',
    feature: 'lazuralka; venreva for an event (1.0:G23)',
    domain: 'natural world',
  },
  {
    liraasa: 'Li yalmu de li faru po tranata.',
    english: "The fire's energy changed.",
    feature: 'yalmu as noun',
    domain: 'natural world',
  },
];

/* -------------------------------------------------------------------- social */

const SOCIAL: NewExample[] = [
  {
    liraasa: 'Maivo de talirivo po venreva ala li tali.',
    english: 'My colleague came to work.',
    feature: 'talirivo (colleague)',
    domain: 'social',
  },
  {
    liraasa: 'Li talirivo po senosia ko maivo.',
    english: 'The colleague spoke with me.',
    feature: 'talirivo; ko',
    domain: 'social',
  },
  {
    liraasa: 'Li conokova tovota maivo de cono.',
    english: 'The bank holds my coin.',
    feature: 'conokova (bank or vault)',
    domain: 'social',
  },
  {
    liraasa: 'Maivo po senosia fime li mavopagodapa ka lanvesan.',
    english: 'I said that the income tax is lawful.',
    feature: 'mavopagodapa; fime complement clause',
    domain: 'social',
  },
  {
    liraasa: 'Li lanve po tranata, tonsi maivo po lemula ito.',
    english: 'The law changed, therefore I studied it.',
    feature: 'tonsi (1.0:G1 connector)',
    domain: 'social',
  },
  {
    liraasa: 'Li purma de maivo ka benasan.',
    english: 'My parent is good.',
    feature: 'purma',
    domain: 'social',
  },
  {
    liraasa: 'Li purmafamli de maivo lemudonula li linuri.',
    english: 'My uncle teaches the children.',
    feature: 'purmafamli; lemudonula',
    domain: 'social',
  },
  {
    liraasa: 'Li hunranela musi talita.',
    english: 'The adult must work.',
    feature: 'hunranela; musi obligation',
    domain: 'social',
  },
  {
    liraasa: 'Li tali po yordoya baba fulepari.',
    english: 'The work resulted in a surplus.',
    feature: 'fulepari (surplus)',
    domain: 'social',
  },
  {
    liraasa: 'Maivo po vimova li lirasarbi en li bulli.',
    english: 'I saw the poem in the book.',
    feature: 'lirasarbi (poem)',
    domain: 'social',
  },
  {
    liraasa: 'Saivori po lirala li yanolira.',
    english: 'They sang the chorus.',
    feature: 'yanolira (chorus)',
    domain: 'social',
  },
  {
    liraasa: 'Li ralelirapatu de li lira ka melosan.',
    english: "The song's refrain is musical.",
    feature: 'ralelirapatu (refrain)',
    domain: 'social',
  },
  {
    liraasa: 'Li melonulu ka benasan seye.',
    english: 'The melody is good, certainly.',
    feature: 'melonulu; seye',
    domain: 'social',
  },
  {
    liraasa: 'Maivo po lenila li melonulu.',
    english: 'I heard the melody.',
    feature: 'melonulu as object',
    domain: 'social',
  },
  {
    liraasa: 'Li telnenulu de li telne ka verasan.',
    english: "The story's plot is truthful.",
    feature: 'telnenulu (narrative plot)',
    domain: 'social',
  },
  {
    liraasa: 'Toda-nela lermila.',
    english: 'Everyone uses language.',
    feature: 'lermi verb; toda-nela correlative',
    domain: 'social',
  },
  {
    liraasa: 'Maivo po lemula baba lotero lermi.',
    english: 'I learned another language.',
    feature: 'lermi as noun',
    domain: 'social',
  },
  {
    liraasa: 'Li linu po lermila ko li purma.',
    english: 'The child spoke with the parent.',
    feature: 'lermi verb, purma',
    domain: 'social',
  },
  {
    liraasa: 'Li tilma de li purma ata li linu ka benasan.',
    english: 'The bond of parent and child is good.',
    feature: 'purma; ata joining constituents',
    domain: 'social',
  },
  {
    liraasa: 'Li lermi de li tamra po tranata.',
    english: "The land's language changed.",
    feature: 'lermi',
    domain: 'social',
  },
  {
    liraasa: 'Maivo ne sabesia li lermi de li talirivo.',
    english: "I do not know my colleague's language.",
    feature: 'lermi, talirivo; ne',
    domain: 'social',
  },
  {
    liraasa: 'Li hunra de li nela ka benasan.',
    english: 'The maturity of the person is good.',
    feature: 'hunra as noun',
    domain: 'social',
  },
  {
    liraasa: 'Li purma po sudesia li vera ala li linu.',
    english: 'The parent showed the truth to the child.',
    feature: 'purma; ala recipient',
    domain: 'social',
  },
  {
    liraasa: 'Maivo po masuma li talirivo ki-kasa.',
    english: 'I asked my colleague why.',
    feature: 'ki-kasa correlative',
    domain: 'social',
  },
  {
    liraasa: 'Li conokova ne dagi tovota li cono de maivo.',
    english: 'The bank may not hold my coin.',
    feature: 'conokova; ne dagi (forbidden)',
    domain: 'social',
  },
  {
    liraasa: 'Li mavopagodapa po tranata en li montafama.',
    english: 'The income tax changed in the year.',
    feature: 'mavopagodapa',
    domain: 'social',
  },
];

/* ------------------------------------------------------------- philosophical */

const PHILOSOPHICAL: NewExample[] = [
  {
    liraasa: 'Li nurmi ne ka li ravmi.',
    english: 'Consciousness is not intelligence.',
    feature: 'nurmi, ravmi; ne ka',
    domain: 'philosophical',
  },
  {
    liraasa: 'Maivo nurminia.',
    english: 'I am conscious.',
    feature: 'nurmi verb (n-initial -nia)',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li lazu nurminia poye.',
    english: 'The animal is conscious, perhaps.',
    feature: 'lazu, nurmi; clause-final poye',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li ravmi ne ka li sabe.',
    english: 'Intelligence is not knowledge.',
    feature: 'ravmi',
    domain: 'philosophical',
  },
  {
    liraasa: 'Saivo po ravmira li masu.',
    english: 'She reasoned out the question.',
    feature: 'ravmi verb',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li serna ne ka li sabe.',
    english: 'Information is not knowledge.',
    feature: 'serna; the scope distinction the root was coined for',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li seno sernasia li pensa.',
    english: 'The word conveys the thought.',
    feature: 'serna verb (s-initial -sia)',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li vera ka sernasan poye.',
    english: 'Truth is informational, perhaps.',
    feature: 'serna adjective; poye',
    domain: 'philosophical',
  },
  {
    liraasa: 'Toda demro tovota baba vordu.',
    english: 'Every motion has a cause.',
    feature: 'demro; toda quantifier',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li pesbivordu ka baba vordu de li demro.',
    english: 'Gravity is a cause of motion.',
    feature: 'pesbivordu, demro',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li vemi ka baba divma.',
    english: 'The world is a system.',
    feature: 'divma as noun',
    domain: 'philosophical',
  },
  {
    liraasa: 'Maivo po divmada li serna.',
    english: 'I systematized the information.',
    feature: 'divma verb, serna',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li lideosovla sudesia li vera.',
    english: 'The metaphor shows the truth.',
    feature: 'lideosovla (metaphor)',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li pavma ata li yalmu ka tilmasan.',
    english: 'Matter and energy are related.',
    feature: 'pavma, yalmu',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li yalmu ne ka li pavma.',
    english: 'Energy is not matter.',
    feature: 'yalmu, pavma',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li vamri ata li krono ka tilmasan seye.',
    english: 'Space and time are related, certainly.',
    feature: 'vamri; seye',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li hunra de li pensa ka benasan.',
    english: 'The maturity of thought is good.',
    feature: 'hunra',
    domain: 'philosophical',
  },
  {
    liraasa: 'Maivo pensapa fime li nurmi ka nosvosan.',
    english: 'I think that consciousness is possible.',
    feature: 'nurmi; fime clause',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li ravmi de li nela po hunraha.',
    english: "The person's intelligence matured.",
    feature: 'ravmi, hunra',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li nurmina ne ka li mudu.',
    english: 'Unconsciousness is not sickness.',
    feature: 'nurmi negative slot',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li pavmana ka lideosan.',
    english: 'Immateriality is conceptual.',
    feature: 'pavma negative slot',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li lermi nosvonia li pensa.',
    english: 'Language makes thought possible.',
    feature: 'lermi, nosvonia',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li divma de li lermi ka ravmisan.',
    english: 'The system of language is intelligent.',
    feature: 'divma, lermi, ravmi',
    domain: 'philosophical',
  },
  {
    liraasa: 'Maivo ne sabesia fime li lazu nurminia.',
    english: 'I do not know whether the animal is conscious.',
    feature: 'lazu, nurmi; ne with fime',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li vamri ka pavmanasan.',
    english: 'Space is immaterial.',
    feature: 'vamri, pavma negative adjective',
    domain: 'philosophical',
  },
  {
    liraasa: 'Li vemi tovota muya serna.',
    english: 'The world holds much information.',
    feature: 'serna; muya as a pre-nominal quantifier, which takes no -san',
    domain: 'philosophical',
  },
];

/* ------------------------------------------------------------- technological */

const TECHNOLOGICAL: NewExample[] = [
  {
    liraasa: 'Li cunudivmabiti sernasia li nela.',
    english: 'The computer informs the person.',
    feature: 'cunudivmabiti, serna verb',
    domain: 'technological',
  },
  {
    liraasa: 'Maivo po bitiba li cunudivmabiti.',
    english: 'I used the computer.',
    feature: 'cunudivmabiti',
    domain: 'technological',
  },
  {
    liraasa: 'Li divmabiti ka germasan.',
    english: 'The machine is metallic.',
    feature: 'divmabiti, germa',
    domain: 'technological',
  },
  {
    liraasa: 'Li farvisimvodivmabiti demroda la velbisan.',
    english: 'The robot moves quickly.',
    feature: 'farvisimvodivmabiti, demro',
    domain: 'technological',
  },
  {
    liraasa: 'Li lordinulu divmada li serna.',
    english: 'The algorithm organizes the information.',
    feature: 'lordinulu, divma, serna',
    domain: 'technological',
  },
  {
    liraasa: 'Li sernakova kovaka muya sernari.',
    english: 'The database holds much information.',
    feature: 'sernakova, serna with -ri',
    domain: 'technological',
  },
  {
    liraasa: 'Li favro po venreva da li divmabiti.',
    english: 'The signal came from the machine.',
    feature: 'favro as noun; da',
    domain: 'technological',
  },
  {
    liraasa: 'Li divmabiti favrofa ala li nela.',
    english: 'The machine signals to the person.',
    feature: 'favro verb',
    domain: 'technological',
  },
  {
    liraasa: 'Li favro ka yalmusan.',
    english: 'The signal is energy-bearing.',
    feature: 'favro, yalmu',
    domain: 'technological',
  },
  {
    liraasa: 'Li germativro po demroda li germa.',
    english: 'The magnet moved the metal.',
    feature: 'germativro, germa, demro',
    domain: 'technological',
  },
  {
    liraasa: 'Li ceresolo ne ka germasan.',
    english: 'Glass is not metallic.',
    feature: 'ceresolo, germa',
    domain: 'technological',
  },
  {
    liraasa: 'Li farusolo ka pavmasan.',
    english: 'Ceramic is material.',
    feature: 'farusolo, pavma',
    domain: 'technological',
  },
  {
    liraasa: 'Maivo po lemula li pavmatrana.',
    english: 'I studied chemistry.',
    feature: 'pavmatrana (chemistry)',
    domain: 'technological',
  },
  {
    liraasa: 'Li ravmi de li cunudivmabiti ke ravminasan poye.',
    english: "The computer's intelligence is lacking, perhaps.",
    feature: 'ravmi and its negative adjective',
    domain: 'technological',
  },
  {
    liraasa: 'Li farvisimvodivmabiti ne nurminia.',
    english: 'The robot is not conscious.',
    feature: 'nurmi; ne before the verb',
    domain: 'technological',
  },
  {
    liraasa: 'Li cunudivmabiti lermila ko li nela.',
    english: 'The computer uses language with the person.',
    feature: 'lermi verb',
    domain: 'technological',
  },
  {
    liraasa: 'Li lordinulu ka divmasan.',
    english: 'The algorithm is systematic.',
    feature: 'lordinulu, divma adjective',
    domain: 'technological',
  },
  {
    liraasa: 'Li sernakova ne tovota li serna de maivo.',
    english: 'The database does not hold my information.',
    feature: 'sernakova, serna',
    domain: 'technological',
  },
  {
    liraasa: 'Li divmabiti po zarmoza li germa.',
    english: 'The machine struck the metal.',
    feature: 'zarmo verb, germa',
    domain: 'technological',
  },
  {
    liraasa: 'Li yalmu de li divmabiti po momvima.',
    english: "The machine's energy was lost.",
    feature: 'yalmu',
    domain: 'technological',
  },
  {
    liraasa: 'Li mavoyuge de li nela ka ravmisan.',
    english: "The person's brain is intelligent.",
    feature: 'mavoyuge (brain), ravmi',
    domain: 'technological',
  },
  {
    liraasa: 'Li mavoyuge ne ka baba cunudivmabiti.',
    english: 'A brain is not a computer.',
    feature: 'mavoyuge; guards against the machine metaphor',
    domain: 'technological',
  },
  {
    liraasa: 'Li favro po nulunia da li zavme ala li nazru.',
    english: 'The signal travelled from the front to the rear.',
    feature: 'favro, zavme, nazru',
    domain: 'technological',
  },
  {
    liraasa: 'Li divmabiti demroda ala li lizmasilda.',
    english: 'The machine moves to the left side.',
    feature: 'lizmasilda, demro',
    domain: 'technological',
  },
  {
    liraasa: 'Li farvisimvodivmabiti po riznora.',
    english: 'The robot turned right.',
    feature: 'rizno verb',
    domain: 'technological',
  },
  {
    liraasa: 'Li tilnu de li divmabiti ke pavmasan.',
    english: "The machine's waste is material.",
    feature: 'tilnu, pavma',
    domain: 'technological',
  },
  {
    liraasa: 'Li pavmapatu de li germa ke patusan.',
    english: "The metal's particle is partial.",
    feature: 'pavmapatu, germa',
    domain: 'technological',
  },
  {
    liraasa: 'Li cunudivmabiti ne nurminia seye.',
    english: 'The computer is not conscious, certainly.',
    feature: 'nurmi; seye',
    domain: 'technological',
  },
];

export const NEW_EXAMPLES: readonly NewExample[] = [
  ...EVERYDAY,
  ...NATURAL,
  ...SOCIAL,
  ...PHILOSOPHICAL,
  ...TECHNOLOGICAL,
];

/**
 * Shape the new examples as `examples` rows, matching the 1.0 record exactly:
 * `{liraasa, english, feature, status, source}`, with no `changes` key, since
 * 40 of the 1.0 examples also lack one.
 */
export function buildNewExamples(
  _baseline: RawLexicon,
  _proposal: Proposal,
): Record<string, unknown>[] {
  return NEW_EXAMPLES.map((e) => ({
    liraasa: e.liraasa,
    english: e.english,
    feature: e.feature,
    status: 'NEW',
    source: `1.1 vocabulary examples (${e.domain})`,
  }));
}
