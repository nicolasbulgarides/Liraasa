/* The Training Hall's words: every display name and line of microcopy, in one
 * place, so a wing can be renamed or a line rewritten without touching code.
 *
 * English only. Nothing here is Liraasa: words of the language come from the
 * data, always (a test scans this file).
 *
 * Tone: warm, brief, a little poetic, never cutesy. A break is only ever a
 * welcome back; a wrong answer is a gentle explanation, never a scolding.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});

  U.S = {
    /* names */
    hall: 'Training Hall',
    stars: 'Ten Stars',
    loom: 'The Loom',
    observatory: 'Observatory',
    settings: 'Settings',
    review: 'Review',
    classic: 'Classic Learn',
    backToHall: 'Training Hall',
    author: 'Author',

    /* the hub */
    hubKicker: 'Liraasa',
    greeting: {
      first: 'Welcome. The sky is clear tonight.',
      again: 'Good to see you.',
      back: 'Welcome back. Your sky kept its light.',
    },
    wings: {
      stars: {
        title: 'Ten Stars',
        line: 'Draw ten words, study every form of each, then practise them.',
        cta: 'Ten stars are waiting',
      },
      loom: {
        title: 'The Loom',
        line: 'Weave the grammar: one rule at a time, with words you already know.',
        cta: 'Take up a thread',
      },
      observatory: {
        title: 'Observatory',
        line: 'Your sky: every word you have met, every rule you have practised.',
        cta: 'Look up',
      },
    },
    due: (n) =>
      n === 0
        ? 'Nothing is waiting for review.'
        : n === 1
          ? 'One card is ready for review.'
          : n + ' cards are ready for review.',
    reviewNow: 'Review now',
    stats: {
      wordsMet: 'words met',
      wordsSteady: 'words steady',
      rulesPracticed: 'rules practised',
      minutesThisWeek: 'minutes this week',
      daysThisWeek: (n) => (n === 1 ? 'one evening this week' : n + ' evenings this week'),
    },
    edition: (e) => 'Edition ' + e,

    /* settings */
    set: {
      title: 'Settings',
      lede: 'Sensible defaults throughout: change only what you want to.',
      sessions: 'Sessions',
      stars: 'Words in a Ten Stars draw',
      drill: 'Prompts in a Ten Stars drill',
      loom: 'Length of a Loom session',
      loomLengths: { quick: 'Quick (5)', standard: 'Standard (10)', deep: 'Deep (25)' },
      answers: 'Answers',
      leniency: 'Answer checking',
      leniencies: {
        exact: 'Exact spelling',
        lenient: 'Forgive a doubled or single vowel',
      },
      gloss: 'Gloss line',
      glosses: { always: 'Always visible', onRequest: 'On request', hidden: 'Hidden (challenge)' },
      hints: 'Hints',
      hintModes: { off: 'Off', onRequest: 'On request', always: 'Always' },
      answersNote: 'Used by Ten Stars and The Loom; Classic Learn keeps its own checking.',
      display: 'Display',
      sky: 'Sky',
      skies: { night: 'Night', dawn: 'Dawn', follow: 'Follow the songbook' },
      scale: 'Text size',
      contrast: 'Contrast',
      contrasts: { normal: 'Normal', high: 'High' },
      font: 'Typeface',
      fonts: { default: 'Default', readable: 'Reading-friendly' },
      fontNote:
        'Reading-friendly uses a dyslexia-friendly typeface if one is installed (OpenDyslexic, Atkinson Hyperlegible, Lexend), with wider spacing.',
      motion: 'Motion',
      motions: { system: 'Follow the system', reduce: 'Reduced' },
      sound: 'Sound',
      sounds: { off: 'Off', on: 'Soft chimes for right answers' },
      save: 'Save settings',
      saved: 'Settings saved.',
      perLearner: 'Kept with this learner’s progress.',
      perScreen: 'Kept on this screen only.',
      rhythm: 'Daily rhythm and the scheduler are set in Classic Learn → Progress.',
      keys: 'Keyboard',
      audio: 'Audio',
      audioLede:
        'Recordings come from data/audio/manifest.json and from the Author view. A word or sentence shows a play button only when it has one; Learn never synthesises speech.',
      coverage: (label, have, total) =>
        label +
        ': ' +
        have +
        ' of ' +
        total +
        (total > 0 ? ' (' + Math.round((100 * have) / total) + '%)' : ''),
      coverageRoots: 'Roots',
      coverageCompounds: 'Compounds',
      coverageSentences: 'Sentences',
      nextToRecord: 'Next to record, most used first',
      missingAll: (n) => 'All ' + n + ' still to record, as manifest lines',
      missingNote:
        'Each line is ready to paste into the manifest’s "files"; rename the file to whatever you record.',
      allRecorded: 'Every word has a recording.',
      data: 'Your progress',
      dataLede:
        'Progress is kept in this browser. Export it to keep a copy, or to move it to another machine.',
      exportProgress: 'Export progress',
      importProgress: 'Import progress',
      backup: 'Full backup (with recordings)',
      restore: 'Restore a backup',
      reset: 'Start over',
      resetLede: (name) =>
        'This clears ' +
        name +
        '’s progress. Take an export first if you might want it back. Type WIPE to confirm.',
      resetButton: 'Clear progress',
    },

    /* keyboard */
    keys: {
      title: 'Keyboard shortcuts',
      close: 'Close',
      list: [
        ['← →', 'Previous / next card'],
        ['Space', 'Flip or reveal'],
        ['1 – 4', 'Choose an option'],
        ['Enter', 'Submit, then continue'],
        ['R', 'Show the rule'],
        ['G', 'Show or hide the gloss line'],
        ['A', 'Play the recording'],
        ['?', 'This list'],
        ['Esc', 'Back, or close a panel'],
      ],
    },

    /* the seven forms, by slot, in the grammar's order */
    slotNames: {
      root: 'Root',
      ascended: 'Ascended',
      negative: 'Negative',
      verb: 'Verb',
      negativeAdjective: 'Negative adjective',
      adjective: 'Adjective',
      ascendedAdjective: 'Ascended adjective',
    },

    /* Ten Stars */
    ts: {
      waiting: 'Ten stars are waiting.',
      waitingN: (n) => (n === 10 ? 'Ten stars are waiting.' : n + ' stars are waiting.'),
      previewLede:
        'Choose a star to draw another in its place or to pin it. When the sky looks right, begin.',
      short: (n, want) =>
        'Only ' +
        n +
        ' of the ' +
        want +
        ' words you asked for ' +
        (n === 1 ? 'matches' : 'match') +
        ' these choices.',
      empty: 'No word matches these choices. Widen the draw and try again.',
      retired: (n) =>
        n === 1
          ? 'One word in your saved draw was retired in this edition, so it has left your sky.'
          : n +
            ' words in your saved draw were retired in this edition, so they have left your sky.',
      pinned: 'pinned',
      selected: 'Selected',
      another: 'Draw another',
      pin: 'Pin',
      unpin: 'Unpin',
      rerollAll: 'Draw all again',
      rerollAllNote: 'Pinned stars stay.',
      begin: 'Begin',
      resume: (i, n) => 'Resume at card ' + i + ' of ' + n,
      seed: 'Seed',
      seedNote: 'The same seed and choices give the same draw.',
      shape: 'Shape the draw',
      draw: 'Draw',
      count: 'How many words',
      only: 'Draw from',
      onlies: {
        all: 'All words',
        irregular: 'Only words with irregular forms',
        surprising: 'Words that go their own way',
        missed: 'Only words I have missed before',
        unseen: 'Only words I have not met',
      },
      weighting: 'Weighting',
      weightings: {
        random: 'Purely random',
        weak: 'Shaky words first',
        new: 'New words first',
        due: 'Words due for review first',
      },
      kind: 'Kind of word',
      kinds: { any: 'Any', primal: 'Primal roots', compound: 'Compounds' },
      senses: 'Must have a meaning as',
      themes: 'Themes',
      themesNote: 'None chosen means every theme.',
      since: 'Arrived in edition',
      sinceNote: 'None chosen means any edition.',

      /* the study card */
      cardOf: (i, n) => 'Card ' + i + ' of ' + n,
      backToSky: 'Back to the constellation',
      back: 'Back',
      gone: 'This word is not in the current edition.',
      kindNames: { root: 'primal root', compound: 'compound', imageCompound: 'image compound' },
      sinceTag: (v) => 'since ' + v,
      alsoMeans: 'Also',
      listen: 'Listen',
      forms: 'Forms',
      formsCaption: 'Every form with a meaning, in the order the grammar lists them.',
      showRule: 'Show the rule',
      hideRule: 'Hide the rule',
      colForm: 'Form',
      colLabel: 'Kind',
      colSense: 'English',
      colRule: 'Pattern',
      unused: (n) =>
        n === 1
          ? 'One more form exists with no meaning of its own.'
          : n + ' more forms exist with no meaning of their own.',
      irregular: 'goes its own way',
      irregularSr: 'Irregular form.',
      ruleWouldMake: (pattern, regular, form) =>
        'The rule (' + pattern + ') would make ' + regular + '; this word’s form is ' + form + '.',
      unexplained:
        'The data records this form without saying why it differs from the rule. It is listed for the author to look at.',
      authorNote: 'The author’s note',
      fromModifier: (cls) =>
        'A compound takes its verb class from its first letter, so from its first part: the second part alone would take the ' +
        cls +
        ' class.',
      verbClasses: {
        'n-initial': 'n-initial',
        's-initial': 's-initial',
        'vowel-initial': 'vowel-initial',
        otherwise: 'consonant',
        listed: 'its own',
      },
      verbClassNote: (cls) => 'Verb class: ' + cls + '.',
      glossWas: (g) => 'Changed in this edition: it was “' + g + '”.',
      spellingWas: (sp) => 'Respelled in this edition: it was ' + sp + '.',
      parts: 'Built from',
      compounds: 'In compounds',
      moreCompounds: (n) => 'and ' + n + ' more',
      derivations: 'Fixed derived words',
      derivationNote: 'Their meanings are set by the language, not built from the parts.',
      openCard: 'Open its card',
      inSentence: 'In a sentence',
      fromSong: 'From your songs',
      showGloss: 'Show the word-by-word gloss',
      hideGloss: 'Hide the gloss',
      noSentence: 'No sentence in the data or your writings uses this word yet.',
      links: 'More',
      openLexicon: 'Open in the Lexicon',
      openRoots: 'Open in the Roots tool',
      seeGrammar: 'See the grammar behind this',
      prev: 'Previous',
      next: 'Next',
      finish: 'Finish',
      known: 'I already know this one',
      knownDone: 'Moved to your review queue.',
      dots: 'Cards in this draw',
      dotLabel: (i, sp, studied) => 'Card ' + i + ': ' + sp + (studied ? ', studied' : ''),

      /* the end of a study */
      doneTitle: 'Ten more stars in your sky.',
      doneTitleN: (n) => (n === 1 ? 'One more star in your sky.' : n + ' more stars in your sky.'),
      doneLede:
        'They are in your review schedule now. Practise them while they are fresh, or draw again.',
      drawAgain: 'Draw ten more',
      backToHall: 'Back to the Hall',

      /* practice */
      practiceLegend: 'What to practise',
      practiceNote: 'All of them together is a mixed drill. Misses come back once, later on.',
      modes: {
        recognize: ['Recognize', 'See a word or one of its forms; choose what it means.'],
        recall: ['Recall', 'See the meaning; write the word.'],
        forge: ['Form Forge', 'Build a named form from the root.'],
        pattern: ['Spot the Pattern', 'Find every verb built one particular way.'],
        match: ['Form Match', 'Pair forms with their names, and words with their meanings.'],
        listen: ['Listen', 'Hear a recording; choose what it means.'],
        slot: ['Sentence Slot', 'Fill the gap in a real sentence.'],
      },
      noAudio: 'Appears once you record these words (Author → Audio).',
      prompts: 'Prompts',
      beginPractice: 'Begin practice',
      noModes: 'Choose at least one kind of practice.',
      nothing: 'These words give nothing to practise in the kinds chosen. Try adding another kind.',
      sessionTitle: 'Ten Stars practice',
      shakyTitle: 'The shaky ones',
      verdicts: { almost: 'Nearly.', wrong: 'Not yet.' },
      nearMiss: (form) =>
        'That’s what the rule would make, and this word goes its own way: ' + form + '.',
      forgiven: (exact) => 'Forgiven. The exact spelling is ' + exact + '.',

      /* reflect */
      reflectTitle: (n) =>
        n === 10
          ? 'Ten more stars in your sky.'
          : n === 1
            ? 'One more star in your sky.'
            : n + ' more stars in your sky.',
      reflectLede:
        'The brighter the star, the better it went. They will all come back for review when they are due.',
      how: { bright: 'bright', steady: 'steady', faint: 'faint', unasked: 'not asked' },
      howSr: (word, how, right, asked) =>
        word + ': ' + how + (asked ? ', ' + right + ' of ' + asked + ' right' : ''),
      drillShaky: 'Drill the shaky ones',
      noneShaky: 'Every star came through bright.',
    },

    /* The Loom */
    loomS: {
      lede: 'Grammar, one thread at a time. Every exercise is built from a real sentence and checked by the grammar checker.',
      noChecker:
        'The grammar checker did not load, and The Loom needs it to check what it builds. Reload the page; if it persists, run npm run build:checker.',
      groups: {
        forms: 'Forms and word-building',
        clause: 'The clause and its slots',
        phrase: 'The noun phrase',
        rulings: (v) => 'Rulings of ' + v,
      },
      states: {
        woven: 'woven',
        practised: 'practised',
        open: 'open',
        waiting: 'builds on others',
        quiet: 'no sentences yet',
      },
      stateSr: (title, state, pct) => title + ': ' + state + (pct ? ', ' + pct + ' mastered' : ''),
      mapNote:
        'Nothing is locked. Threads lower down build on the ones above; you can open any of them.',
      session: 'Weave a session',
      sessionShape: 'Shape the session',
      focus: 'Focus',
      focuses: {
        open: 'Rules that are open to me',
        weakest: 'My weakest rules',
        all: 'Every rule with sentences',
      },
      length: 'Length',
      types: 'Kinds of exercise',
      typeNames: {
        weave: ['Weave', 'Put a sentence’s words in order.'],
        transform: [
          'Transform',
          'Add a slot’s word (a tense, a negation, a question…) where it belongs.',
        ],
        mend: ['Mend', 'One thing is wrong: mend it.'],
        unravel: ['Unravel', 'Gloss each word of a sentence.'],
        choose: ['Choose', 'Pick the grammatical sentence of three.'],
        translate: ['Translate', 'English into Liraasa.'],
        reverse: ['Reverse', 'Liraasa into English, from three.'],
      },
      begin: 'Begin',
      nothing:
        'Nothing to practise with these choices yet: the rules chosen have no sentences the checker passes. Try another focus.',
      sessionTitle: 'The Loom',

      /* the lesson */
      backToMap: 'Back to the map',
      steps: { see: 'See it', watch: 'Watch it', try: 'Try it', use: 'Use it' },
      version: (v) => 'edition ' + v,
      pattern: 'Pattern',
      words: 'Its words',
      buildsOn: 'Builds on',
      leadsTo: 'Leads to',
      examples: 'Examples',
      noExamples:
        'No sentence in the data or your writings that the checker passes uses this rule yet, so there is nothing to practise it with. The author can link sentences to a ruling under Author → Overrides.',
      authorNote: 'The author’s note',
      watchLede: 'Watch the sentence come together, word by word, with what each part means.',
      watchAgain: 'Watch again',
      watchForm: (form) => 'How ' + form + ' is built',
      noWatch: 'There is no sentence to build for this rule yet.',
      tryLede: (n) =>
        'A short session on this rule: ' + n + ' exercises, each checked by the grammar checker.',
      tryThis: 'Practise this rule',
      tryWith: 'Practise it with what it builds on',
      tryDone: (right, n) =>
        right + ' of ' + n + ' right. The rule is in your review schedule now.',
      useLede:
        'Write a sentence of your own that uses this rule. The checker reads it for grammar; whether it says what you mean is for you to judge.',
      useLabel: 'Your sentence',
      check: 'Check it',
      clean: 'The checker finds nothing wrong.',
      cannotJudge: 'It cannot tell whether the sentence means what you intend.',
      problems: 'The checker’s notes',
      verdicts: { almost: 'Nearly.', wrong: 'Not yet.' },
    },

    /* The Loom Sandbox */
    sb: {
      title: 'The Sandbox',
      lede: 'Choose the pieces and watch the sentence put itself together. Every word goes where the grammar puts it; the checker reads the result.',
      open: 'Open the Sandbox',
      openFromLesson: 'Build one in the Sandbox',
      empty: 'Choose a subject and a verb to begin.',
      incomplete: 'A clause needs a verb.',
      reading: 'Word by word',
      readingNote: 'A reading of the glosses side by side, not a translation.',
      clean: 'The checker finds nothing wrong.',
      notes: 'The checker’s notes',
      noChecker: 'The grammar checker did not load, so this sentence is not checked.',
      why: 'Why it is built this way',
      reasons: {
        template: 'The words follow the clause template.',
        subject: 'The subject comes before everything but the frame.',
        verb: (w) => w + ' is the verb form, in the verb slot.',
        object: 'The object follows the verb.',
        slot: (w) => w + ' sits in its own slot.',
        form: (w) => w + ' is built by this form’s rule.',
        'noun-phrase': (w) => w + ' takes its place in the noun phrase.',
        plural: (w) => w + ' carries the plural ending, always last.',
      },
      openRule: 'Open the rule',
      subject: 'Subject',
      object: 'Object',
      objectNone: 'No object',
      pronoun: 'A pronoun',
      noun: 'A noun',
      verb: 'Verb',
      choose: '— choose —',
      none: '— none —',
      determiner: 'Determiner',
      adjective: 'Describing word',
      plural: (meaning) => 'Plural (' + meaning + ')',
      operators: 'Around the verb',
      operatorsNote: 'One word per slot, at most. Leave a slot empty for its default.',
      onlyKnown: 'Only words I have met',
      onlyKnownNone: 'You have not met any words of this kind yet, so the whole list is shown.',
      surprise: 'Surprise me',
      clear: 'Start again',
      copy: 'Copy the sentence',
      copied: 'Copied.',
      copyNote:
        'The songbook’s Check tab reads any line you paste into a writing; Learn does not change your writings itself.',
      partOf: (sp, m) => sp + ': ' + m,
    },

    /* The Observatory */
    obs: {
      lede: 'Your sky: every word you have met, every rule you have practised, and what the language changed while you were away.',
      run: (n) => n + ' days in a row.',
      sky: 'Your sky',
      skyLede:
        'Each star is a word you have met. The brighter it shines, the better you know it; a four-pointed star goes its own way.',
      skyEmpty: 'Your sky is still dark. Draw ten stars to light it.',
      drawStars: 'Draw ten stars',
      starSr: (sp, m, pct, irregular) =>
        sp + ': ' + m + ', ' + pct + ' known' + (irregular ? ', goes its own way' : ''),
      asList: 'Show the sky as a list',
      colWord: 'Word',
      colMeaning: 'Meaning',
      colKnown: 'Known',
      colOwnWay: 'Own way',
      yes: 'yes',
      loom: 'Your threads',
      loomLede: 'Every rule you have practised, best known first.',
      loomEmpty: 'No threads yet. Take one up in The Loom.',
      openLoom: 'Open The Loom',
      states: { woven: 'woven', practised: 'practised' },
      changes: 'What changed while you were away',
      changesLede: 'The language moves on. What it changed under words you know:',
      noChanges: 'Nothing you have learned has changed.',
      renamed: (was, now) => was + ' is now spelled ' + now + '.',
      reglossed: (word, from, to) => word + ' now means “' + to + '” (it meant “' + from + '”).',
      rewritten: (word, from, to) => word + ' was rewritten: “' + to + '” (it was “' + from + '”).',
      retired: (word, edition) => word + ' was retired in edition ' + edition + '.',
      replacedBy: (word) => 'In its place: ' + word + '.',
      removed: 'Nothing takes its place; your progress on it is kept, set aside.',
      edition: (e) => 'edition ' + e,
      review: (n) =>
        n === 1 ? 'Review the one card that changed' : 'Review the ' + n + ' cards that changed',
      reviewTitle: 'What changed',
      understood: 'Understood',
      wholeEdition: (e) => 'Everything new in edition ' + e,
      progress: 'Your progress',
    },

    /* feedback, for the wings */
    right: ['Bright.', 'Exactly.', 'That one’s yours now.'],
    nearMissIrregular: 'That’s what the rule would make, and this word goes its own way.',
    sessionEnd: (n) => (n === 1 ? 'One more star in your sky.' : n + ' more stars in your sky.'),
  };
})(typeof window !== 'undefined' ? window : globalThis);
