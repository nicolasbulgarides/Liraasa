/**
 * Liraasa 2.5: The Grammar in Lessons. The content, one lesson per sitting,
 * each building on the ones before. `npm run build:lessons` renders it and
 * checks it: every example and answer must read clean under the 2.5 strict
 * checker, every "watch out" sentence must be rejected for the rule it cites,
 * and every Liraasa word in the prose must be a word of Liraasa.
 *
 * In the text: `liraasa` is Liraasa, **bold** is bold, *italic* is italic.
 */

export interface Lesson {
  title: string;
  /** One or two welcoming sentences: what this lesson gives you. */
  welcome: string;
  /** The idea, in short points. */
  points: string[];
  /** Liraasa, English. */
  examples: [string, string][];
  /** A sentence that breaks the lesson's rule, why, and the rule. */
  watch?: [string, string, string][];
  /** A prompt in English, and the Liraasa answer. */
  practice: [string, string][];
  /** The rulings behind the lesson. */
  rules: string[];
}

export interface Part {
  title: string;
  lessons: Lesson[];
}

export const INTRO = [
  'Liraasa is a language built for singing: every vowel rings, every word ends open, and the grammar keeps a fixed, calm order so the words can be sung without tripping.',
  'These twenty lessons take you through the whole grammar, one small idea at a time. Each takes about ten minutes. Read the idea, say the examples aloud, then try the practice lines before you open the answers. Each lesson uses only what came before it.',
  'Every Liraasa sentence here has been checked against the 2.5 grammar, so you can trust it as a model. The rule numbers at the foot of each lesson (2.5:G88 and so on) point into the Reference Grammar, if you ever want the full text.',
];

export const PARTS: Part[] = [
  {
    title: 'Sounds and words',
    lessons: [
      {
        title: 'How Liraasa sounds',
        welcome:
          'Before any grammar, the music. Liraasa is spelled exactly as it sounds, so once you know the letters you can read anything aloud.',
        points: [
          'Five vowels, a e i o u, each always the same. **Every vowel is its own syllable**: `maivo` is ma-i-vo, three syllables.',
          'The stress falls on the **second-to-last syllable**: li-RA-la, ma-I-vo.',
          'Words end in a vowel, which is what makes them easy to sing. **c** is always the sound in *church*, **j** its voiced partner, **r** a light tap, **g** always hard.',
          'A spelling never changes. What you see is what you sing.',
        ],
        examples: [
          ['Maivo lirala.', 'I sing.'],
          ['Taivo lirala.', 'You sing.'],
        ],
        practice: [['Say aloud, with the stress in the right place: “I sing.”', 'Maivo lirala.']],
        rules: ['2.0:G43', '2.0:G44'],
      },
      {
        title: 'One root, seven forms',
        welcome:
          'Here is the engine of the vocabulary. Learn one root and you can often reach a whole family of words.',
        points: [
          'Every headword is a **root**, and the root itself is the noun: `lira`, song.',
          'Endings make its other forms. The verb: `lirala`, to sing. The adjective adds **-san**: `vanisan`, beautiful (from `vani`, beauty).',
          'The verb ending follows the root’s first letter: most roots add their first consonant + **a** (`lira` → `lirala`); roots in s- add **-sia** (`sabe` → `sabesia`), in n- add **-nia**, and roots starting with a vowel add **-a** (`amor` → `amora`).',
          'Two more pairs give the *ascended* (exalted) forms, **-asa** and **-asasan**, and the *negative* forms, **-na** and **-nasan** (the absence or opposite).',
          '**Only the forms the dictionary lists exist.** A form it does not list has no meaning, so look a word up before you build it.',
        ],
        examples: [
          ['Maivo amora taivo.', 'I love you.'],
          ['Taivo sabesia maivo.', 'You know me.'],
        ],
        practice: [['“You love me.”', 'Taivo amora maivo.']],
        rules: ['0.8:R2'],
      },
      {
        title: 'Building more words',
        welcome:
          'A few small endings and the art of putting two words together will multiply what you can say.',
        points: [
          '**-ri** makes a plural: `lirari`, songs. **-ti** makes a little or dear one: `lirati`, a little song. Both together: `liratiri`, little songs.',
          'Three endings make new nouns from any root: **-yo** one who does it (`lirayo`, singer), **-vu** a big or intense one (`liravu`, a grand song), **-pago** its place (`lemupago`, school).',
          '**Compounds** join two headwords, the describing one first: `lunolumi`, moonlight (moon + light).',
          '**A noun never describes a noun directly.** To say *songbird*, make the first noun its adjective: `lirasan lavra`.',
          '**Image compounds** join a listed modifier and head into one word, like `lunosavali`, a moonlit kiss, and they have all seven forms. Prefer the ones the dictionary already lists.',
        ],
        examples: [
          ['Maivo amora lirari.', 'I love songs.'],
          ['Li lavra lirala.', 'The bird sings.'],
        ],
        watch: [
          [
            'benasanri',
            'An adjective takes -ri only when it stands as a noun after an article (li benasanri, the good ones).',
            '2.5:G101',
          ],
        ],
        practice: [['“The bird sings songs.”', 'Li lavra lirala lirari.']],
        rules: ['2.0:G41', '2.5:G122', '2.5:G124', 'ADR-0011'],
      },
    ],
  },
  {
    title: 'The simple sentence',
    lessons: [
      {
        title: 'Who does what',
        welcome:
          'Liraasa word order is English word order: who, then what they do, then to what. You can already make real sentences.',
        points: [
          'The order is fixed: **SUBJECT, VERB, OBJECT**. The position tells you who does what; nothing else does.',
          'The pronouns: `maivo` I, `taivo` you, `saivo` he or she, `ito` it, and with **-ri** the plurals `maivori` we, `taivori` you all, `saivori` they, `itori` they (things). An animal is `ito`; a named animal is `saivo`.',
          '`li` is *the*, `baba` is *a*. Names stay as they are: `Kipo`, `Dorin`.',
          '`maivo` is also the noun *Self*; when you mean the Self, write `li maivo`.',
        ],
        examples: [
          ['Maivo lirala baba lira.', 'I sing a song.'],
          ['Li lavra lirala; ito amora li nimu.', 'The bird sings; it loves the home.'],
          ['Kipo amora Dorin.', 'Kipo loves Dorin.'],
        ],
        practice: [
          ['“You sing a song.”', 'Taivo lirala baba lira.'],
          ['“We love the song.”', 'Maivori amora li lira.'],
        ],
        rules: ['2.5:G128', '2.5:G100', '2.5:G102'],
      },
      {
        title: 'Describing things',
        welcome:
          'Adjectives come before the noun, just as in English, and a few small words point at things.',
        points: [
          'The adjective goes **before** its noun: `baba vanisan lira`, a beautiful song.',
          'A degree word goes right before its adjective: `ruli vanisan`, very beautiful.',
          '`eli` this, `ola` that, `eliri` these, `olari` those. `eli` and `ola` take a singular noun; with the plural pair, **-ri** on the noun is optional.',
          'An adjective can stand as a noun, but only after an article: `li benasanri`, the good ones.',
        ],
        examples: [
          ['Maivo lirala baba ruli vanisan lira.', 'I sing a very beautiful song.'],
          ['Maivo amora eliri lirari.', 'I love these songs.'],
        ],
        watch: [['eli lirari', 'eli is singular: these songs is eliri lirari.', '2.5:G101']],
        practice: [
          ['“I love this song.”', 'Maivo amora eli lira.'],
          ['“these songs”', 'eliri lirari'],
        ],
        rules: ['2.5:G98', '2.5:G101', '1.2:G29'],
      },
      {
        title: 'Two ways to say “is”',
        welcome:
          'English has one *is*; Liraasa has two, and choosing between them says something lovely about time.',
        points: [
          '`ke` is for what holds **now, or for a time**: a place, a mood, a passing state.',
          '`ka` is for what is **lasting, defining, by nature**: who someone is, what a thing is like.',
          'Both work with an adjective, a noun phrase or a place: `Li kavbikova ke su li tabu.` The basket is on the table (right now).',
          'In the present, with nothing else, an adjective may stand bare: `Nela vanisan.` The person is beautiful. Anything more needs `ke` or `ka`.',
          '`loya` is *become*; `miyo` is *there is*.',
        ],
        examples: [
          ['Li kavbikova ke su li tabu.', 'The basket is on the table (right now).'],
          ['Maivo ka lirayo.', 'I am a singer (it’s who I am).'],
          ['Li nela ke benasan.', 'The person is good at the moment.'],
          ['Li sora ka benasan.', 'The friend is good by nature.'],
          ['Miyo baba sora en li nimu.', 'There is a friend in the home.'],
        ],
        practice: [
          ['“The friend is in the home.” (right now)', 'Li sora ke en li nimu.'],
          ['“You are a singer.” (it’s who you are)', 'Taivo ka lirayo.'],
        ],
        rules: ['2.5:G93', '2.5:G128'],
      },
      {
        title: 'Past, future, and “not”',
        welcome:
          'Verbs never change their ending for time. Small words before the verb do that work, which keeps every verb easy to sing.',
        points: [
          '`po` before the verb makes the past, `futu` the future. With neither, it is now.',
          '`ne` before the verb makes it *not*. It comes after the tense: `po ne`.',
          'With a copula: `po ke`, was (at that time); `po ka`, was (no claim about now); `kapoki`, was, and no longer is.',
        ],
        examples: [
          ['Maivo po lirala.', 'I sang.'],
          ['Maivo po ne somusia.', 'I did not sleep.'],
          ['Taivo futu relnura.', 'You will come back.'],
          ['Li nela po ke vanisan.', 'The person was beautiful.'],
          ['Saivo kapoki benasan.', 'They were good, and no longer are.'],
        ],
        watch: [
          [
            'Li nela po vanisan.',
            'An adjective standing bare takes no tense: with po, use ke or ka.',
            '2.5:G128',
          ],
        ],
        practice: [
          ['“You sang a song.”', 'Taivo po lirala baba lira.'],
          ['“We will not sleep.”', 'Maivori futu ne somusia.'],
        ],
        rules: ['2.5:G94', '2.5:G128', '1.0:G1'],
      },
      {
        title: 'The little words before the verb',
        welcome:
          'Here is where Liraasa gets expressive: a row of small words before the verb, always in the same order, each adding a shade of meaning.',
        points: [
          '**Can, might, must**: `povi` can, `nosi` might, `dagi` may (allowed), `musi` must, `suvi` should, `viki` would, `kopi` hope to.',
          '**How it unfolds**: `roni` in progress, `tefa` completed, `sahi` habitually; `hiro` begin, `teki` stop; `telvo` try, `vazdi` manage, `fesmo` try and fail; `tavki` almost.',
          '**Again and still**: `reve` again, `loki` still, `bodu` already.',
          'They line up in this order: **tense, noma, ne, modal, almost, begin/stop, try, aspect, again, evidence**. Rarely more than two or three at once.',
          '`ne` negates what follows it: `ne povi lirala`, cannot sing; `povi ne lirala`, can not-sing.',
        ],
        examples: [
          ['Saivo povi lirala.', 'She can sing.'],
          ['Maivo po hiro lirala.', 'I began to sing.'],
          ['Maivo loki lirala.', 'I still sing.'],
        ],
        practice: [
          ['“You might sing.”', 'Taivo nosi lirala.'],
          ['“I almost sang.”', 'Maivo po tavki lirala.'],
        ],
        rules: ['1.0:G1', '1.0:G16', '1.0:G3'],
      },
    ],
  },
  {
    title: 'Noun phrases',
    lessons: [
      {
        title: 'Counting',
        welcome:
          'Numbers are regular and easy to build, and a few small words handle *some*, *many* and *about*.',
        points: [
          '`una` 1, `dossa` 2, `tressa` 3, `cuara` 4, `penta` 5. The number comes before the noun, and **-ri** after it is optional: `dossa cono`, two coins.',
          '**-ne** makes an order: `una-ne`, first. **antizi** makes a minus: `antizi dossa`, minus two.',
          'A fraction is NUMBER `de` NUMBER, with spaces: `tressa de cuara`, three quarters. For *one of the two*, add the article: `una de li dossa`.',
          '`toda` all, `somi` some, `nuna` none, `muya` many, `poka` few, `rada` each. `gase` before a number is *about*.',
        ],
        examples: [
          ['Taivo guraga maivo dossa cono.', 'You owe me two coins.'],
          ['Una de li dossa futu relnura.', 'One of the two will return.'],
          ['Maivo tovota gase dossa cono.', 'I have about two coins.'],
        ],
        practice: [
          ['“three quarters”', 'tressa de cuara'],
          ['“minus two”', 'antizi dossa'],
        ],
        rules: ['2.5:G97', '2.5:G101', '2.5:G125', '2.5:G107'],
      },
      {
        title: '“Of” and whose',
        welcome:
          'One little word, `de`, carries *of*, possession and *about*. Two simple rules tell you who owns what.',
        points: [
          '`X de Y` is **X of Y**: the noun after `de` owns. `li bumre de li cilni`, the bread of the city; `li bumre de pilo`, father’s bread.',
          'But a **pronoun** (or a personal name) before `de` is the owner: `maivo de lira`, my song; `taivo de lira`, your song.',
          '*Father*, *mother* and other family words are nouns, not names, so they follow the first rule.',
          '*About* is `de` too: `li lira de amor`, the song of (about) love.',
          'Chains read from the left; to say *the warmth of my body*, rephrase rather than stack three `de`s.',
        ],
        examples: [
          ['Taivo de lira ka vanisan.', 'Your song is beautiful.'],
          ['li bumre de pilo', 'father’s bread'],
          ['Li lira de li lavra ka vanisan.', 'The song of the bird is beautiful.'],
        ],
        practice: [
          ['“my song”', 'maivo de lira'],
          ['“The song of the city is beautiful.”', 'Li lira de li cilni ka vanisan.'],
        ],
        rules: ['2.5:G95', '2.5:G96', '1.2:G30'],
      },
      {
        title: 'In, on, with: where and how',
        welcome:
          'Prepositions come before their noun, as in English. The only real choice is which *with* you mean.',
        points: [
          '`en` in, `su` on, `ala` to, `da` from, `ligo` near, `hupi` above, `tula` below, `vobi` for.',
          '**Three withs**: `ko` is company, or a feeling that goes with the act; `yuta` is a tool or something used up; `en` is a medium you are in, like a voice.',
          'The *side nouns* (`nazru` behind, `zavme` in front of, `silda` beside) work as prepositions, and keep their `li`: `nazru li nimu`.',
          'A time noun as *when* takes `en`: `en merno`, in the morning. A bare noun after a verb is its object.',
        ],
        examples: [
          ['Maivo lallela li dorbi yuta li kemye.', 'I open the door with the key.'],
          ['Maivo lirala ko amor.', 'I sing with love.'],
          ['Saivo po senosia en baba melosan valla.', 'She spoke in a musical voice.'],
          ['Li lavra semnesia nazru li nimu.', 'The bird sits behind the home.'],
          ['Maivo vimova en merno.', 'I see in the morning.'],
        ],
        watch: [['Li lavra semnesia nazru nimu.', 'A side noun keeps its li.', '2.5:G99']],
        practice: [
          ['“I sing with you.”', 'Maivo lirala ko taivo.'],
          ['“I sing in the morning.”', 'Maivo lirala en merno.'],
        ],
        rules: ['2.5:G104', '2.5:G99', '2.5:G103'],
      },
    ],
  },
  {
    title: 'Shaping the sentence',
    lessons: [
      {
        title: 'How, and how much',
        welcome:
          'Liraasa has no adverb ending. Instead, one small word turns any adjective into *how* something is done.',
        points: [
          '`la` + adjective is an adverb: `la molusan`, gently. It goes **after the verb and object**.',
          'A degree word sits between them: `la ruli molusan`, very gently.',
          '**More and less**: `kasi` more, `menu` less, `mosa` most, `lusu` least, and `tamo` than: `kasi vanisan tamo`, more beautiful than.',
          'For amounts: `kasi lirari tamo taivo`, more songs than you. For manner: `la kasi molusan tamo taivo`.',
          '`gase` … `gase` is *as … as*; `gase` + a noun is *like*: `gase li lavra`, like the bird.',
        ],
        examples: [
          ['Maivo lirala la ruli molusan.', 'I sing very gently.'],
          ['Li lira ka kasi vanisan tamo li seno.', 'The song is more beautiful than the speech.'],
          ['Maivo tovota kasi lirari tamo taivo.', 'I have more songs than you.'],
          ['Maivo lirala la kasi molusan tamo taivo.', 'I sing more gently than you.'],
        ],
        watch: [['Maivo la molusan lirala.', 'la + adjective comes after the verb.', '2.5:G105']],
        practice: [
          ['“I sing gently.”', 'Maivo lirala la molusan.'],
          ['“You sing like the bird.”', 'Taivo lirala gase li lavra.'],
        ],
        rules: ['2.5:G105', '2.5:G106', '2.5:G107'],
      },
      {
        title: 'Asking',
        welcome: 'Questions are wonderfully simple: say the statement, then end with `ki`.',
        points: [
          'A **yes/no question** keeps statement order and ends in `ki`: `Taivo lirala ki?`',
          'The question words: `ki-coda` what, `ki-nela` who, `ki-pago` where, `ki-krono` when, `ki-kasa` why, `ki-modo` how, `ki-eli` which, `ki-muya` how many.',
          'Put the question word where the answer would go, and end in `ki`: `Taivo pagopa ki-pago ki?`',
          'Or put it **first**, and the final `ki` becomes optional: `Ki-kasa taivo po amora maivo?` (`ki-eli` and `ki-muya` with a noun always keep `ki`.)',
          'Even a one-word question ends in `ki`: `Ata ki?` And?',
          'Without `ki`, `Ki-eli nullo!` is an exclamation: What a night!',
        ],
        examples: [
          ['Taivo lirala ki?', 'Do you sing?'],
          ['Taivo pagopa ki-pago ki?', 'Where are you going?'],
          ['Ki-kasa taivo po amora maivo?', 'Why did you love me?'],
          ['Taivo amora ki-eli lira ki?', 'Which song do you love?'],
          ['Ki-eli nullo!', 'What a night!'],
        ],
        watch: [
          ['Taivo pagopa ki-pago?', 'A question word left in place needs the final ki.', '2.5:G88'],
        ],
        practice: [
          ['“Do you love me?”', 'Taivo amora maivo ki?'],
          ['“Who sings?”', 'Ki-nela lirala ki?'],
        ],
        rules: ['2.5:G88', '2.5:G91', '2.5:G92', '2.3:G76', '2.2:G61'],
      },
      {
        title: 'Asking someone to act, and wishing',
        welcome:
          'Commands, *let’s*, blessings and the little words of feeling at the end of a sentence.',
        points: [
          'A **command** has no subject and is marked: it ends in `!` or carries `fisa`, please: `Lirala!` Sing! `Fisa, lisrola.` Please stay.',
          '`Ne` + a command forbids: `Ne lirala!` Don’t sing!',
          '`Yava` is *let us*: `Yava lirala!`',
          'Words of attitude close the sentence: `seye` certainly, `mufe` probably, `poye` perhaps, `pifu` may it be (a wish or a blessing).',
          'A final `ki` or attitude word always belongs to the main clause and comes last.',
        ],
        examples: [
          ['Fisa, lisrola.', 'Please stay.'],
          ['Ne lirala!', 'Don’t sing!'],
          ['Yava lirala!', 'Let us sing!'],
          ['Maivo lirala poye.', 'Perhaps I sing.'],
          ['Li lumi tivrota taivo pifu.', 'May the Light hold you.'],
        ],
        practice: [
          ['“Sing!”', 'Lirala!'],
          ['“Let us sing!”', 'Yava lirala!'],
        ],
        rules: ['2.5:G90', '2.5:G89', '2.1:G48', '2.1:G56'],
      },
      {
        title: 'Opening and closing a sentence',
        welcome:
          'Around the core of every sentence there is room at the edges: a scene-setter at the front, a name at the end.',
        points: [
          '**Up front**, set off by a comma, you may set the scene with a time or a place: `Deyaapo, maivo po lirala.` `Eli-pago, maivo lirala.`',
          'Before that, a line may begin with `ata`, `oro` or `nara`, carrying on from the line before.',
          'A **topic** comes first with `hozi`: *as for …*. If the topic is the subject, pick it up with a pronoun: `Kipo hozi, saivo lirala.`',
          '**At the end** the sentence closes in a set order: adjuncts (time words included), then `fuyi` (each other), then the attitude word, then `ki`.',
          'A person you speak to comes last, after a comma: `…, maivo de amor?`',
        ],
        examples: [
          ['Deyaapo, maivo po lirala.', 'Yesterday, I sang.'],
          ['Kipo hozi, saivo lirala.', 'As for Kipo, they sing.'],
          ['Maivori lirala toda-krono fuyi pifu.', 'May we always sing to each other.'],
          ['Taivo viki pagopa ligo maivo ki, maivo de amor?', 'Would you come near me, my love?'],
        ],
        watch: [
          [
            'Maivori lirala fuyi toda-krono pifu.',
            'A closing time word comes before fuyi.',
            '2.5:G126',
          ],
          [
            'Kipo hozi, lirala.',
            'A topic that is the subject is picked up by a pronoun.',
            '2.5:G119',
          ],
        ],
        practice: [
          ['“Here, I sing.”', 'Eli-pago, maivo lirala.'],
          ['“I sing today.”', 'Maivo lirala deyapressa.'],
        ],
        rules: ['2.5:G126', '2.5:G127', '2.5:G119', '2.3:G72'],
      },
    ],
  },
  {
    title: 'Joining clauses',
    lessons: [
      {
        title: '“That”, “whether”, and questions inside sentences',
        welcome: 'Now one sentence can hold another. A single word opens the inner clause.',
        points: [
          '`fime` is *that*: `Maivo sabesia fime taivo lirala.` I know that you sing.',
          '`ki-oro` is *whether*: `Maivo po masuma ki-oro taivo relnura.`',
          'An inner question keeps its question word and **never** takes `ki`: `Maivo ne sabesia ki-pago taivo futu pagopa.`',
          'The inner clause borrows the main clause’s tense unless it says its own; a `sige` (*since*) clause always says its own.',
          '`ata` and, `nara` but, `oro` or join clauses of equal rank.',
        ],
        examples: [
          ['Maivo sabesia fime taivo lirala.', 'I know that you sing.'],
          ['Maivo po masuma ki-oro taivo relnura.', 'I asked whether you returned.'],
          ['Maivo ne sabesia ki-pago taivo futu pagopa.', 'I don’t know where you will go.'],
        ],
        practice: [
          ['“I know that you love me.”', 'Maivo sabesia fime taivo amora maivo.'],
          ['“Do you know that I sing?”', 'Taivo sabesia fime maivo lirala ki?'],
        ],
        rules: ['2.3:G77', '2.5:G118', '2.5:G89'],
      },
      {
        title: 'Who, which, where',
        welcome:
          'Relative clauses let you describe a noun with a whole sentence. One word, `raho`, does it all.',
        points: [
          '`raho` + a clause describes the noun before it, with a gap where the noun would be: `li nela raho lirala`, the person who sings.',
          'If the clause has its own object or extra words and the sentence goes on, **close it with a comma**.',
          'For a place, a time, a preposition or an owner, keep a small pronoun in the clause: `li pago raho maivo po venreva da ito`, the place I came from; `li lirayo raho maivo amora saivo de lira`, the singer whose song I love.',
          'With no noun before it, `raho` is *the one who, what*: `Maivo lirala raho taivo amora.` I sing what you love.',
        ],
        examples: [
          ['Li nela raho lirala ka benasan.', 'The person who sings is good.'],
          [
            'Li sabeyo raho vismava eli, ne yehu vimova li vordu.',
            'The sage who studies this did not witness the word.',
          ],
          ['li pago raho maivo po venreva da ito', 'the place I came from'],
          ['Maivo lirala raho taivo amora.', 'I sing what you love.'],
        ],
        watch: [
          [
            'Li sabeyo raho vismava eli ne yehu vimova li vordu.',
            'A raho clause with its own object closes with a comma when the sentence goes on.',
            '2.5:G115',
          ],
        ],
        practice: [['“the time when I sang”', 'li krono raho maivo po lirala en ito']],
        rules: ['2.5:G115', '2.5:G120', '2.1:G52', '2.2:G64'],
      },
      {
        title: 'To, so that, and wanting',
        welcome: 'Three small linkers cover all the ways English uses *to*.',
        points: [
          '`sidu` chains two verbs with one subject: `Maivo desida sidu lirala.` I want to sing.',
          'With a different subject, use `fime`: `Maivo desida fime taivo lisrola.` I want you to stay.',
          '**Purpose** is always `kopisa`: `… kopisa lirala`, to sing; `kopisa taivo rilura`, so that you dance. Add `nosi` for *so that perhaps*.',
          'An adjective + `sidu` + verb: the thing described is what the verb acts on: `Trana ke ruli levasan sidu zeldoza.` Change is very easy to resist.',
        ],
        examples: [
          ['Maivo desida sidu lirala.', 'I want to sing.'],
          ['Maivo po venreva eli-pago kopisa lirala.', 'I came here to sing.'],
          ['Maivo lirala, kopisa taivo nosi rilura.', 'I sing, so that perhaps you’ll dance.'],
          ['Trana ke ruli levasan sidu zeldoza.', 'Change is very easy to resist.'],
        ],
        watch: [
          [
            'Maivo po venreva eli-pago sidu lirala.',
            'sidu is for verb chains; purpose is kopisa.',
            '2.5:G113',
          ],
        ],
        practice: [
          ['“I want you to stay.”', 'Maivo desida fime taivo lisrola.'],
          ['“I sing so that you dance.”', 'Maivo lirala kopisa taivo rilura.'],
        ],
        rules: ['2.5:G113', '2.5:G116', '2.5:G111', '2.1:G50'],
      },
      {
        title: 'If, because, therefore',
        welcome: 'Reasons, conditions and what never happened: the logic of a story.',
        points: [
          '`si` if, `sina` unless, `kasa` because, `nevi` although, `kube` when, `nayo` while, `tuni` until, `kureli` as soon as.',
          'A clause that comes first is followed by a comma: `Si taivo lirala, maivo futu rilura.`',
          '`noma` marks what is contrary to fact. *Would have* is always `po noma viki`: `taivo po noma viki relsira`.',
          '`Tonsi,` with a comma, opens a clause: *therefore*. Before an adjective after `ke` or `ka`, `tonsi` is *so*: `ke tonsi corvisan fime …`, so brave that ….',
        ],
        examples: [
          [
            'Si maivo po noma masuma, taivo po noma viki relsira.',
            'If I had asked, you would have answered.',
          ],
          ['Kureli taivo venreva, maivo po lirala.', 'As soon as you came, I sang.'],
          ['Tonsi, maivo lirala.', 'Therefore, I sing.'],
        ],
        watch: [['Taivo po viki relsira.', '“Would have” needs noma: po noma viki.', '2.5:G114']],
        practice: [
          ['“If you sing, I will dance.”', 'Si taivo lirala, maivo futu rilura.'],
          ['“I sing because you dance.”', 'Maivo lirala kasa taivo rilura.'],
        ],
        rules: ['2.5:G114', '2.5:G117', '2.5:G118', '1.0:G6'],
      },
      {
        title: 'Being acted on, and making others act',
        welcome:
          'The last tools: turning a sentence around, giving to someone, and making someone do something.',
        points: [
          '`gome` + verb makes a passive, `gagu` the doer: `Li lira gome sarbisia gagu maivo.` The song is written by me.',
          '`vaku` make, `lesvu` let, `tekvu` prevent, then the one who acts, then their verb: `Taivo vaku maivo lirala.` You make me sing.',
          '**Giving**: the thing given first, then `ala` + the receiver: `donuda li bumre ala pilo`. A pronoun receiver may stand bare right after the verb: `Taivo guraga maivo dossa cono.`',
          '**Motion prefixes** add direction to any verb: `va-` toward me, `du-` away, `taro-` across, `yave-` together, `revo-` back or again: `revo-lirala`, sing again.',
        ],
        examples: [
          ['Li lira gome sarbisia gagu maivo.', 'The song is written by me.'],
          ['Maivo vaku saivo sapusia li nami.', 'I make him eat the food.'],
          ['Maivo po donuda li bumre ala pilo.', 'I gave the bread to father.'],
          ['Maivo revo-sabesia taivo.', 'I recognize you.'],
        ],
        practice: [
          ['“You make me sing.”', 'Taivo vaku maivo lirala.'],
          ['“I gave the bread to my father.”', 'Maivo po donuda li bumre ala maivo de pilo.'],
        ],
        rules: ['2.5:G110', '2.5:G109', '2.5:G112', '2.5:G121'],
      },
    ],
  },
];

/** The whole clause on one page, for review after the last lesson. */
export const MAP = {
  title: 'The whole sentence on one page',
  lines: [
    '[ata · oro · nara] [FRAME,] [TOPIC hozi,] [ki-word]',
    'SUBJECT  [po · futu] [noma] [ne] [povi · nosi · musi …] [tavki] [hiro · teki] [telvo …] [roni · tefa · sahi] [reve · loki · bodu]',
    'VERB  [OBJECT]  [adjuncts: en …, la …, tamo …, time words]  [fuyi]  [seye · mufe · poye · pifu]  [ki]  [, vocative]',
  ],
  np: '[toda · muya …] [li · baba · eli · OWNER de] [una-ne] [dossa] [ruli] [adjective] NOUN-ti-ri [de …] [raho …]',
};

export const OPEN = [
  'The order of two adjectives before one noun.',
  'Which operators a command may carry.',
  'How to say *for two days* (a duration).',
  'How to compare actions with no adjective (*I sing more than you*).',
];
