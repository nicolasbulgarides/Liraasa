/* Learn: the shell and the learner's views (ADR-0015).
 *
 * Everything shown comes from the core (window.LiraasaLearn) over the data
 * (window.LIRAASA_LEARN): this file holds no Liraasa. Progress, the author's
 * draft overrides and pending root changes persist through store.js.
 *
 * Views: Today · Path · Unit · Review · Practice · Read · Card · Rule ·
 *        What changed · Progress · Author (author.js)
 *        and the Training Hall's: Hall · Ten Stars · The Loom · Observatory ·
 *        Settings (hall.js). The Hall is home unless the learner chose Classic.
 *
 * Events, shared with the songbook editor:
 *   liraasa:lexicon-changed  {mapping, record}   a root was renamed or retired
 *   liraasa:open-lexicon     {spelling}          show a word in the Lexicon tab
 *   liraasa:open-piece       {id}                open a writing in the songbook
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const esc = (s) => U.esc(s);
  const SONGBOOK = 'liraasa-songbook-v2';
  const DAY = 86400000;

  const A = (U.app = {
    ready: false,
    loading: null,
    view: { name: 'today', args: {} },
    lastChanges: null,
  });

  /* ------------------------------------------------------------- loading */

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('could not load ' + src));
      document.head.appendChild(s);
    });
  }

  /** Load the data and the progress once; later calls share the promise. */
  U.init = function init() {
    if (A.loading) return A.loading;
    A.loading = (async () => {
      if (!root.LIRAASA_LEARN) await loadScript('learn/learn-data.js');
      if (!root.LiraasaLearn) await loadScript('learn/learn-core.js');
      A.L = root.LiraasaLearn;
      A.P = root.LIRAASA_LEARN;
      const L = A.L;
      const now = Date.now();
      const saved = await U.store.get('progress');
      try {
        A.store = saved ? L.importStore(saved) : L.createStore(A.P.lexicon.version, now);
      } catch (e) {
        A.store = L.createStore(A.P.lexicon.version, now);
        A.loadError =
          'Saved progress could not be read (' +
          e.message +
          '); it was kept, untouched, under "progress-unreadable".';
        await U.store.set('progress-unreadable', saved);
      }
      A.changes = (await U.store.get('lexicon-changes')) || [];
      A.draft = (await U.store.get('overrides')) || null;
      // the author's files from data/audio/manifest.json, and recordings made here
      A.files = A.P.audioFiles || {};
      const keys = await U.store.audioKeys();
      A.audio = new Set([...Object.keys(A.files), ...keys.filter((k) => A.store.audio[k])]);
      applyLexiconChanges();
      rebuild();
      reconcileAll();
      A.ready = true;
      save();
      return A;
    })();
    return A.loading;
  };

  /** The author's pending root changes, replayed over the bundled lexicon. */
  function applyLexiconChanges() {
    const L = A.L;
    A.lex = A.P.lexicon;
    A.changeProblems = [];
    for (const c of A.changes) {
      const r =
        c.op === 'respell_root'
          ? L.respellRoot(A.lex, c.entry, c.to, c.reason)
          : L.retireRoot(A.lex, c.entry, c.to, c.reason);
      if (r.ok) A.lex = r.lexicon;
      else A.changeProblems.push({ change: c, problems: r.problems });
    }
  }

  function writings() {
    try {
      const book = JSON.parse(root.localStorage.getItem(SONGBOOK) || 'null');
      return (book && Array.isArray(book.pieces) ? book.pieces : []).filter(
        (p) => p.text && p.text.trim(),
      );
    } catch {
      return [];
    }
  }

  function overrides() {
    const L = A.L;
    try {
      return L.parseOverrides(A.draft || A.P.overrides);
    } catch (e) {
      A.overridesError = e.message;
      return L.parseOverrides(A.P.overrides);
    }
  }

  /** Rebuild everything derived from the data. Cheap enough to do on any change. */
  function rebuild() {
    const L = A.L;
    A.overrides = overrides();
    A.writingsKey = root.localStorage ? root.localStorage.getItem(SONGBOOK) : '';
    const corpus = A.P.corpus.concat(writings().map((p) => L.writingToCorpusFile(p)));
    A.src = L.buildLearnSource({
      lexicon: A.lex,
      corpus,
      names: A.P.names,
      overrides: A.overrides,
      pronounEnglish: A.P.pronounEnglish || {},
    });
    A.data = A.src.data;
    A.graph = L.buildSkillGraph(A.data, A.overrides);
    A.forms = L.createFormsEngine({
      data: A.data,
      morphology: A.lex.morphology,
      phonology: A.lex.phonology,
      overrides: A.overrides,
    });
    A.ctx = { data: A.data, graph: A.graph, audio: A.audio, known: knownSet() };
    A.gctx = { data: A.data, link: A.src.context };
    A.diff = A.P.previous
      ? L.diffSnapshots(A.P.previous, L.snapshotEdition(A.data), A.src.replacementFor)
      : null;
  }

  /** Headwords the active learner has met: the sentence exercises lean on them. */
  function knownSet() {
    const seen = A.store ? A.L.activeProfile(A.store).seen : {};
    const out = new Set();
    for (const n of Object.keys(seen)) if (n.startsWith('root:')) out.add(n.slice(5));
    return out;
  }
  U.refreshKnown = () => {
    if (A.ctx) A.ctx.known = knownSet();
  };

  function reconcileAll() {
    const now = Date.now();
    let out = null;
    for (const p of Object.values(A.store.profiles)) {
      const r = A.L.reconcile(p, A.data, A.graph, now, A.src.replacementFor);
      if (p.id === A.store.active) out = r;
    }
    if (out && out.renamed.length + out.reglossed.length + out.retired.length > 0)
      A.lastChanges = out;
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => U.store.set('progress', A.L.exportStore(A.store)), 250);
  }
  U.save = save;

  const profile = () => A.L.activeProfile(A.store);
  const now = () => Date.now();
  const rng = (seed) => A.L.createRng(seed + ':' + now());

  /* ------------------------------------------------------ shared helpers */

  const item = (id) => A.data.items.get(id);
  const concept = (id) => A.data.concepts.get(id);
  const lira = (s) => '<span class="lw" lang="x-liraasa">' + esc(s) + '</span>';
  const pct = (x) => Math.round(x * 100) + '%';
  const meter = (x, wide) =>
    '<span class="meter' +
    (wide ? ' wide' : '') +
    '" role="img" aria-label="' +
    pct(x) +
    ' mastered"><i style="width:' +
    pct(x) +
    '"></i></span>';
  const refBtn = (kind, id, label, cls) =>
    '<button type="button" class="' +
    (cls || 'linkish') +
    '" data-ref="' +
    esc(kind + ':' + id) +
    '">' +
    label +
    '</button>';
  const itemLink = (id) => {
    const it = item(id);
    return it
      ? refBtn('item', id, lira(it.spelling)) + ' <span class="en">' + esc(it.meaning) + '</span>'
      : esc(id);
  };
  const nodeMastery = (node) => A.L.nodeMastery(profile(), A.graph, node, now());
  const cardBadges = (target) => {
    const cards = Object.values(profile().cards).filter((c) => c.target === target);
    let out = '';
    const ch = cards.find((c) => c.changed);
    if (ch)
      out +=
        ' <span class="pill changed">changed: ' +
        esc(ch.changed.reason) +
        ' · was ' +
        esc(ch.changed.from) +
        '</span>';
    if (cards.some((c) => c.leech)) out += ' <span class="pill leech">needs attention</span>';
    return out;
  };

  /** Tiny Markdown for author notes and lessons: paragraphs, **bold**, *italic*, [[id]] links. */
  function md(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(
        (para) =>
          '<p>' +
          esc(para)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\[\[([^\]]+)\]\]/g, (_, id) => {
              const it = item(id.trim());
              if (it) return refBtn('item', it.id, lira(it.spelling));
              const c = concept(id.trim());
              if (c) return refBtn('concept', c.id, esc(c.title));
              return '<span class="gap-error">[[' + esc(id) + ']]</span>';
            })
            .replace(/\n/g, '<br>') +
          '</p>',
      )
      .join('');
  }
  U.md = md;

  const noteHtml = (note) =>
    note
      ? '<div class="lcard" style="background:var(--gold-soft)">' +
        (note.explanation ? md(note.explanation) : '') +
        (note.mnemonic ? '<p><strong>Mnemonic.</strong> ' + esc(note.mnemonic) + '</p>' : '') +
        '</div>'
      : '';

  function interlinearBlock(line) {
    return (
      '<div class="lcard">' +
      U.interlinear(line.tokens) +
      (line.english ? '<div class="en">' + esc(line.english) + '</div>' : '') +
      '<div class="src">' +
      esc(line.where || line.source) +
      '</div></div>'
    );
  }

  /* ---------------------------------------------------------- renderers */

  function cardHtml(card, opts) {
    const it = card.item;
    const o = opts || {};
    const node = 'root:' + it.id;
    const forms = it.forms.length
      ? '<table class="forms"><tbody>' +
        it.forms
          .map(
            (f) =>
              '<tr class="' +
              (f.meaningful ? '' : 'unused') +
              '"><td>' +
              esc(A.L.humanize(f.slot)) +
              '</td><td lang="x-liraasa">' +
              esc(f.form) +
              '</td><td>' +
              (f.meaningful ? esc(f.gloss) : '<span class="en">unused slot: no meaning</span>') +
              '</td></tr>',
          )
          .join('') +
        '</tbody></table>'
      : '';
    const parts = card.parts.length
      ? '<h3>Built from</h3><p>' +
        card.parts
          .map(
            (p) =>
              refBtn('item', p.id, lira(p.spelling)) +
              ' <span class="en">' +
              esc(p.meaning) +
              '</span>',
          )
          .join(' + ') +
        '</p>'
      : '';
    const compounds = card.compounds.length
      ? '<h3>Compounds built on it (' +
        card.compounds.length +
        ')</h3><ul class="cmp">' +
        card.compounds
          .slice(0, 40)
          .map(
            (c) =>
              '<li>' +
              refBtn('item', c.id, lira(c.spelling)) +
              ' <span class="en">' +
              esc(c.meaning) +
              '</span></li>',
          )
          .join('') +
        '</ul>' +
        (card.compounds.length > 40
          ? '<p class="en">… and ' + (card.compounds.length - 40) + ' more.</p>'
          : '')
      : '';
    const usages = card.usages.length
      ? '<h3>In use</h3>' + card.usages.map(interlinearBlock).join('')
      : '<p class="en">No sentence in the data or the corpus uses this word yet.</p>';
    const seen = profile().seen[node] !== undefined;
    return (
      '<div class="lcard">' +
      '<div class="lrow" style="justify-content:space-between;align-items:baseline">' +
      '<div><div class="lbig" lang="x-liraasa">' +
      esc(it.spelling) +
      '</div><div class="lmeaning">' +
      esc(it.meaning) +
      '</div></div>' +
      '<div class="lrow">' +
      (seen
        ? meter(nodeMastery(node)) + ' <span class="src">' + pct(nodeMastery(node)) + '</span>'
        : '') +
      '</div></div>' +
      '<p class="lrow" style="margin:8px 0 0">' +
      '<span class="pill">' +
      esc(it.kind) +
      '</span>' +
      '<span class="pill">' +
      esc(it.theme) +
      '</span>' +
      (it.register ? '<span class="pill">' + esc(it.register) + '</span>' : '') +
      (it.status
        ? '<span class="pill ok">' + esc(it.status) + ' in ' + esc(A.data.edition) + '</span>'
        : '') +
      cardBadges(it.id) +
      '</p>' +
      (o.compact ? '' : noteHtml(card.note) + forms + parts + compounds + usages) +
      '<p class="lrow" style="margin-top:12px">' +
      (o.compact ? refBtn('item', it.id, 'Open the card', 'btn') : '') +
      '<button type="button" class="btn" data-open-lex="' +
      esc(it.spelling) +
      '">Open in Lexicon</button>' +
      '<button type="button" class="btn" data-practise="' +
      esc(node) +
      '">Practise this word</button></p>' +
      '</div>'
    );
  }

  function explainerHtml(e) {
    const c = e.concept;
    const node = 'concept:' + c.id;
    return (
      '<div class="lcard">' +
      '<div class="lrow" style="justify-content:space-between"><h3 style="margin:0">' +
      esc(c.kind === 'ruling' ? 'Ruling' : 'Grammar') +
      '</h3>' +
      (profile().seen[node] !== undefined ? meter(nodeMastery(node)) : '') +
      '</div>' +
      '<div style="font-family:var(--lira);font-size:1.5em;margin:4px 0 8px">' +
      esc(c.title) +
      '</div>' +
      cardBadges(c.id) +
      '<blockquote style="margin:0;border-left:2px solid var(--margin);padding-left:12px">' +
      esc(c.description) +
      '</blockquote>' +
      '<p class="src">' +
      esc(c.source) +
      '</p>' +
      noteHtml(e.note) +
      (e.prereqs.length
        ? '<p class="en">Builds on: ' +
          e.prereqs.map((p) => refBtn('concept', p.id, esc(p.title))).join(', ') +
          '</p>'
        : '') +
      (e.words.length
        ? '<h3>Its words</h3><p>' + e.words.map((w) => itemLink(w.id)).join(' · ') + '</p>'
        : '') +
      (e.examples.length
        ? '<h3>Examples</h3>' +
          e.examples.map(interlinearBlock).join('') +
          '<p><button type="button" class="btn" data-build="' +
          esc(c.id) +
          '">Build it yourself</button></p>'
        : '<p class="gap-warn">No sentence in the data illustrates this yet, so it has no exercises.</p>') +
      '</div>'
    );
  }

  function patternHtml(b) {
    return (
      '<div class="lcard"><h3 style="margin-top:0">Compound lab</h3>' +
      '<p>Compounds built on ' +
      refBtn('item', b.root.id, lira(b.root.spelling)) +
      ' <span class="en">(' +
      esc(b.root.meaning) +
      ')</span>: modifier first, head last.</p>' +
      '<table class="tbl"><tbody>' +
      b.members
        .slice(0, 16)
        .map((m) => {
          const it = item(m.id);
          const parts =
            it && it.components ? it.components.map((p) => lira(item(p).spelling)).join(' + ') : '';
          return (
            '<tr><td>' +
            refBtn('item', m.id, lira(m.spelling)) +
            '</td><td>' +
            parts +
            '</td><td class="en">' +
            esc(m.meaning) +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table>' +
      '<p><button type="button" class="btn" data-lab="' +
      esc(b.node) +
      '">Try the lab</button></p></div>'
    );
  }

  /* ------------------------------------------------------------- views */

  const VIEWS = {};

  VIEWS.today = function today() {
    const p = profile();
    const q = A.L.dailyQueue(p, A.graph, now());
    const nextUnit = A.graph.units.find((u) => u.nodes.some((n) => p.seen[n] === undefined));
    const changed = Object.values(p.cards).filter((c) => c.changed && !c.retired);
    const retired = Object.values(p.cards).filter(
      (c) => c.retired && c.retired.at > now() - 30 * DAY,
    );
    const leeches = A.L.leeches(p);
    let html =
      '<h2 tabindex="-1">Today</h2><p class="lede">' +
      esc(p.name) +
      ' · Liraasa ' +
      esc(A.data.edition) +
      ' · ' +
      q.reviewedToday +
      ' reviewed today</p>';
    if (A.loadError) html += '<div class="lcard gap-error">' + esc(A.loadError) + '</div>';
    if (
      p.edition !== A.data.edition ||
      (A.diff && Object.keys(p.cards).length === 0 && A.diff.added.length)
    ) {
      html +=
        '<div class="lcard"><strong>Liraasa ' +
        esc(A.data.edition) +
        '.</strong> ' +
        (A.diff
          ? esc(
              A.diff.added.length +
                ' new words, ' +
                A.diff.reglossed.length +
                ' reglossed, ' +
                A.diff.rulesAdded.length +
                ' new rulings since ' +
                A.diff.from +
                '.',
            )
          : '') +
        ' <button type="button" class="btn" data-go="changes">What changed</button></div>';
    }
    if (changed.length || retired.length) {
      html +=
        '<div class="lcard"><strong>The language changed under you.</strong> ' +
        (changed.length
          ? changed.length + ' of your cards were renamed or reglossed and are back in review. '
          : '') +
        (retired.length
          ? retired.length + ' cards were retired; their replacements were added. '
          : '') +
        '<button type="button" class="btn" data-go="changes">See the changes</button></div>';
    }
    html +=
      '<div class="lgrid">' +
      '<div class="lcard"><h3 style="margin-top:0">Review</h3><div class="lbig">' +
      q.due.length +
      '</div><p class="en">cards due</p>' +
      '<button type="button" class="btn btn-primary" data-go="review"' +
      (q.due.length ? '' : ' disabled') +
      '>Start review</button></div>' +
      '<div class="lcard"><h3 style="margin-top:0">New</h3><div class="lbig">' +
      q.fresh.length +
      '</div><p class="en">to learn today (of ' +
      p.settings.newPerDay +
      ')</p>' +
      (nextUnit
        ? '<button type="button" class="btn btn-primary" data-unit="' +
          nextUnit.index +
          '">Unit ' +
          (nextUnit.index + 1) +
          ': ' +
          esc(nextUnit.theme || '') +
          '</button>'
        : '') +
      '</div>' +
      '<div class="lcard"><h3 style="margin-top:0">Practice</h3><p class="en">Pick themes, rules and exercise types.</p><button type="button" class="btn" data-go="practice">Custom drill</button></div>' +
      '<div class="lcard"><h3 style="margin-top:0">Read</h3><p class="en">Your songs and the corpus, word by word.</p><button type="button" class="btn" data-go="read">Open a text</button></div>' +
      '</div>';
    if (leeches.length) {
      html +=
        '<h3>Needs attention</h3><div class="lcard">' +
        leeches
          .slice(0, 8)
          .map((c) => cardLine(c))
          .join('<br>') +
        '<p><button type="button" class="btn" data-drill-leeches="1">Drill these</button></p></div>';
    }
    return html;
  };

  function cardLine(c) {
    const target = item(c.target)
      ? itemLink(c.target)
      : concept(c.target)
        ? refBtn('concept', c.target, esc(concept(c.target).title))
        : esc(c.snapshot.spelling);
    return (
      target +
      ' <span class="src">' +
      esc(c.skill + ' · ' + c.direction) +
      ' · ' +
      c.state.lapses +
      ' lapses</span>'
    );
  }

  VIEWS.path = function path() {
    const p = profile();
    const rows = A.graph.units
      .map((u) => {
        const open = A.L.unitOpen(p, u.index);
        const cp = p.checkpoints[String(u.index)];
        const chips = u.nodes
          .map((n) => {
            const node = A.graph.nodes.get(n);
            const label =
              node.kind === 'concept'
                ? esc(concept(node.ref).title)
                : node.kind === 'pattern'
                  ? 'compounds on ' + lira(item(node.ref).spelling)
                  : lira(item(node.ref).spelling);
            const m = p.seen[n] !== undefined ? meter(nodeMastery(n)) : '';
            return '<span class="lchip">' + label + m + '</span>';
          })
          .join('');
        return (
          '<div class="unit' +
          (open ? '' : ' locked') +
          '"><span class="n">' +
          (u.index + 1) +
          '</span>' +
          '<div><div><strong>' +
          esc(u.theme || '—') +
          '</strong>' +
          (cp && cp.passed ? ' <span class="pill ok">passed ' + pct(cp.score) + '</span>' : '') +
          (open ? '' : ' <span class="pill">locked</span>') +
          '</div><div class="nodes">' +
          chips +
          '</div></div>' +
          '<button type="button" class="btn" data-unit="' +
          u.index +
          '" aria-label="Open unit ' +
          (u.index + 1) +
          '">Open</button></div>'
        );
      })
      .join('');
    return (
      '<h2 tabindex="-1">The path</h2><p class="lede">' +
      A.graph.units.length +
      ' units. A unit opens when the one before it is passed; its grammar and words are taught together.</p><div class="lcard flush">' +
      rows +
      '</div>'
    );
  };

  VIEWS.unit = function unit(args) {
    const i = Number(args.index);
    const u = A.graph.units[i];
    if (!u) return '<p>No such unit.</p>';
    const p = profile();
    const open = A.L.unitOpen(p, i);
    const blocks = A.L.unitLesson(A.data, A.graph, A.overrides, i);
    const cp = p.checkpoints[String(i)];
    const allSeen = u.nodes.every((n) => p.seen[n] !== undefined);
    let html =
      '<p><button type="button" class="linkish" data-go="path">← The path</button></p>' +
      '<h2 tabindex="-1">Unit ' +
      (i + 1) +
      ' · ' +
      esc(u.theme || '') +
      '</h2>' +
      (open
        ? ''
        : '<p class="lcard">This unit opens when unit ' +
          i +
          '’s checkpoint is passed. You can read it now; practice waits.</p>') +
      '<p class="lrow">' +
      '<button type="button" class="btn btn-primary" data-practise-unit="' +
      i +
      '"' +
      (open ? '' : ' disabled') +
      '>Learn and practise</button>' +
      '<button type="button" class="btn" data-checkpoint="' +
      i +
      '"' +
      (open && allSeen ? '' : ' disabled') +
      '>Checkpoint</button>' +
      (cp
        ? '<span class="src">checkpoint: ' +
          pct(cp.score) +
          (cp.passed ? ' · passed' : ' · not yet passed') +
          '</span>'
        : '') +
      '</p>';
    if (cp && cp.weak.length) {
      html +=
        '<div class="lcard"><strong>Weak spots from the checkpoint:</strong> ' +
        cp.weak
          .map((t) =>
            item(t)
              ? itemLink(t)
              : concept(t)
                ? refBtn('concept', t, esc(concept(t).title))
                : esc(t),
          )
          .join(', ') +
        '</div>';
    }
    for (const b of blocks) {
      if (b.kind === 'explainer') html += explainerHtml(b.explainer);
      else if (b.kind === 'card') html += cardHtml(b.card);
      else if (b.kind === 'pattern') html += patternHtml(b);
      else
        html +=
          '<div class="lcard"><h3 style="margin-top:0">' +
          esc(b.title) +
          '</h3>' +
          md(b.body) +
          '</div>';
    }
    return html;
  };

  VIEWS.card = function card(args) {
    const c = A.L.rootCard(A.data, args.id, A.overrides);
    if (!c) {
      const retired = Object.values(profile().cards).find((x) => x.target === args.id && x.retired);
      return (
        '<h2 tabindex="-1">Not in ' +
        esc(A.data.edition) +
        '</h2><p>This entry no longer exists.' +
        (retired && retired.retired.replacement
          ? ' It was replaced by ' + itemLink(retired.retired.replacement) + '.'
          : '') +
        '</p>'
      );
    }
    return (
      '<p><button type="button" class="linkish" data-back="1">← Back</button></p><h2 tabindex="-1" class="sr-only">' +
      esc(c.item.spelling) +
      '</h2>' +
      cardHtml(c)
    );
  };

  VIEWS.concept = function conceptView(args) {
    const e = A.L.explainer(A.data, args.id, A.overrides);
    if (!e) return '<h2 tabindex="-1">Not in ' + esc(A.data.edition) + '</h2>';
    return (
      '<p><button type="button" class="linkish" data-back="1">← Back</button></p><h2 tabindex="-1" class="sr-only">' +
      esc(e.concept.title) +
      '</h2>' +
      explainerHtml(e)
    );
  };

  VIEWS.read = function read() {
    if (root.localStorage && root.localStorage.getItem(SONGBOOK) !== A.writingsKey) {
      rebuild();
    }
    const p = profile();
    const known = (t) => {
      const ids = new Set();
      for (const l of t.lines)
        for (const tok of l.tokens) if (tok.link.kind === 'entry') ids.add(tok.link.refs[0].id);
      if (!ids.size) return 0;
      let k = 0;
      for (const id of ids)
        if (p.seen['root:' + id] !== undefined || !A.graph.nodes.has('root:' + id)) k += 1;
      return k / ids.size;
    };
    const row = (t) =>
      '<tr><td>' +
      refBtn('text', t.id, esc(t.title)) +
      '</td><td class="src">' +
      t.lines.length +
      ' lines</td><td>' +
      meter(known(t)) +
      ' <span class="src">' +
      pct(known(t)) +
      ' known</span></td></tr>';
    const mine = A.data.texts.filter((t) => t.id.startsWith('writing:'));
    const corpus = A.data.texts.filter((t) => !t.id.startsWith('writing:'));
    return (
      '<h2 tabindex="-1">Read</h2><p class="lede">Tap any word for its card. “Known” counts words you have started.</p>' +
      '<h3>Your writings</h3>' +
      (mine.length
        ? '<table class="tbl"><tbody>' + mine.map(row).join('') + '</tbody></table>'
        : '<p class="en">Nothing in the songbook yet.</p>') +
      '<h3>The corpus</h3><table class="tbl"><tbody>' +
      corpus.map(row).join('') +
      '</tbody></table>'
    );
  };

  VIEWS.text = function text(args) {
    const r = A.L.reading(A.data, args.id);
    if (!r) return '<p>No such text.</p>';
    const gloss = args.gloss !== false;
    const english = args.english !== false;
    const translated = r.lines.filter((l) => l.english).length;
    const isWriting = args.id.startsWith('writing:');
    return (
      '<p><button type="button" class="linkish" data-go="read">← Read</button></p>' +
      '<h2 tabindex="-1">' +
      esc(r.text.title) +
      '</h2>' +
      '<p class="lrow">' +
      '<button type="button" class="btn" data-toggle="gloss" aria-pressed="' +
      gloss +
      '">Word-by-word gloss</button>' +
      '<button type="button" class="btn" data-toggle="english" aria-pressed="' +
      english +
      '">English</button>' +
      '<button type="button" class="btn btn-primary" data-learn-text="' +
      esc(args.id) +
      '">Learn from this text</button>' +
      '<button type="button" class="btn" data-comprehend="' +
      esc(args.id) +
      '"' +
      (translated ? '' : ' disabled title="No line has English yet"') +
      '>Comprehension (' +
      translated +
      ')</button>' +
      (isWriting
        ? '<button type="button" class="btn" data-open-piece="' +
          esc(args.id.slice(8)) +
          '">Open in songbook</button>'
        : '') +
      '</p>' +
      '<div class="' +
      (gloss ? '' : 'gloss-off') +
      '">' +
      r.lines
        .map(
          (l) =>
            '<div class="lcard">' +
            U.interlinear(l.tokens) +
            (english && l.english ? '<div class="en">' + esc(l.english) + '</div>' : '') +
            '</div>',
        )
        .join('') +
      '</div>'
    );
  };

  VIEWS.practice = function practice() {
    const p = profile();
    const themes = [
      ...new Set([...A.data.items.values()].filter((i) => i.forms.length).map((i) => i.theme)),
    ].sort();
    const seenConcepts = [...A.graph.nodes.values()].filter(
      (n) => n.kind === 'concept' && p.seen[n.id] !== undefined,
    );
    const types = A.L.EXERCISE_TYPES.filter((t) => t !== 'listen' || A.audio.size > 0);
    return (
      '<h2 tabindex="-1">Practice</h2><p class="lede">A custom drill. Leave a list empty to include everything you have started.</p>' +
      '<form id="drill" class="lcard"><div class="lform">' +
      '<label>Themes<select name="themes" multiple size="8">' +
      themes.map((t) => '<option>' + esc(t) + '</option>').join('') +
      '</select></label>' +
      '<label>Grammar<select name="concepts" multiple size="8">' +
      (seenConcepts.length
        ? seenConcepts
        : [...A.graph.nodes.values()].filter((n) => n.kind === 'concept').slice(0, 30)
      )
        .map((n) => '<option value="' + esc(n.id) + '">' + esc(concept(n.ref).title) + '</option>')
        .join('') +
      '</select></label>' +
      '<fieldset style="border:0;padding:0;margin:0"><legend class="label">Exercise types</legend>' +
      types
        .map(
          (t) =>
            '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="types" value="' +
            t +
            '" checked> ' +
            esc(A.L.humanize(t)) +
            '</label>',
        )
        .join('') +
      '</fieldset>' +
      '<div style="display:grid;gap:12px;align-content:start"><label>Length<select name="length"><option>10</option><option selected>20</option><option>30</option></select></label>' +
      '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="unseen"> include words not started yet</label></div>' +
      '</div><p><button class="btn btn-primary" type="submit">Start</button></p></form>'
    );
  };

  VIEWS.changes = function changes() {
    const p = profile();
    const d = A.diff;
    let html = '<h2 tabindex="-1">What changed</h2>';
    const mine = Object.values(p.cards).filter((c) => c.changed || c.retired);
    html += '<h3>In your progress</h3>';
    html += mine.length
      ? '<div class="lcard">' +
        mine
          .slice(0, 40)
          .map((c) =>
            c.retired
              ? '<span class="pill retired">retired</span> ' +
                lira(c.snapshot.spelling) +
                (c.retired.replacement ? ' → replaced by ' + itemLink(c.retired.replacement) : '') +
                ' <span class="src">' +
                esc(c.skill + ' · ' + c.direction) +
                '</span>'
              : '<span class="pill changed">' +
                esc(c.changed.reason) +
                '</span> ' +
                esc(c.changed.from) +
                ' → ' +
                (item(c.target) ? itemLink(c.target) : esc(c.changed.to)),
          )
          .join('<br>') +
        '<p><button type="button" class="btn btn-primary" data-go="review">Review the changed cards</button></p></div>'
      : '<p class="en">Nothing you have learned has changed.</p>';
    if (A.changes.length) {
      html +=
        '<h3>Root changes made here, not yet in a release</h3><div class="lcard">' +
        A.changes
          .map(
            (c) =>
              esc(
                c.op === 'respell_root'
                  ? 'renamed ' + c.from + ' → ' + c.to
                  : 'retired ' +
                      c.from +
                      ' (replaced by ' +
                      ((item(c.to) || {}).spelling || c.to) +
                      ')',
              ) +
              ' <span class="src">' +
              esc(c.reason) +
              '</span>',
          )
          .join('<br>') +
        '</div>';
    }
    if (d) {
      html += '<h3>Liraasa ' + esc(d.to) + ', since ' + esc(d.from) + '</h3>';
      const section = (title, rows) =>
        rows.length
          ? '<div class="lcard"><strong>' +
            title +
            ' (' +
            rows.length +
            ')</strong><br>' +
            rows.join('<br>') +
            '</div>'
          : '';
      html += section(
        'Renamed',
        d.renamed.map((r) => esc(r.from) + ' → ' + itemLink(r.id)),
      );
      html += section(
        'Removed',
        d.removed.map(
          (r) =>
            lira(r.spelling) +
            ' <span class="en">' +
            esc(r.meaning) +
            '</span>' +
            (r.replacement ? ' → ' + itemLink(r.replacement) : ''),
        ),
      );
      html += section(
        'Reglossed',
        d.reglossed.map(
          (r) =>
            itemLink(r.id) +
            ': ' +
            (r.from !== r.to
              ? esc('“' + r.from + '” → “' + r.to + '”') + (r.slots.length ? '; ' : '')
              : '') +
            r.slots
              .map((s) =>
                esc(
                  A.L.humanize(A.L.FORM_SLOTS[s.slot] || '') + ' “' + s.from + '” → “' + s.to + '”',
                ),
              )
              .join('; '),
        ),
      );
      html += section(
        'New rulings',
        d.rulesAdded.map((r) => refBtn('concept', r.id, esc(r.title))),
      );
      html += section(
        'New words',
        d.added
          .slice(0, 120)
          .map(
            (a) =>
              (item(a.id) ? itemLink(a.id) : esc(a.spelling)) +
              ' <span class="src">' +
              esc(a.kind) +
              '</span>',
          ),
      );
      html +=
        '<p><button type="button" class="btn btn-primary" data-drill-diff="1">Practise what changed</button></p>';
    }
    return html;
  };

  VIEWS.progress = function progressView() {
    const p = profile();
    const t = now();
    const themes = A.L.masteryByTheme(p, A.data, A.graph, t).filter((g) => g.started > 0);
    const concepts = A.L.masteryByConcept(p, A.data, A.graph, t).filter((g) => g.started > 0);
    const weak = A.L.weakest(p, t, 12);
    const fc = A.L.forecast(p, t, 14);
    const act = A.L.activity(p, t, 30);
    const maxF = Math.max(1, ...fc);
    const maxA = Math.max(1, ...act);
    const s = p.settings;
    return (
      '<h2 tabindex="-1">Progress</h2><p class="lede">' +
      Object.keys(p.cards).length +
      ' cards · ' +
      Object.keys(p.seen).length +
      ' of ' +
      A.graph.nodes.size +
      ' lessons started · ' +
      p.log.length +
      ' answers</p>' +
      '<div class="lgrid"><div class="lcard"><h3 style="margin-top:0">Due, next 14 days</h3><div class="bars" role="img" aria-label="Cards due per day: ' +
      fc.join(', ') +
      '">' +
      fc.map((n) => '<i style="height:' + Math.round((n / maxF) * 100) + '%"></i>').join('') +
      '</div></div>' +
      '<div class="lcard"><h3 style="margin-top:0">Answers, last 30 days</h3><div class="bars act" role="img" aria-label="Answers per day: ' +
      act.join(', ') +
      '">' +
      act.map((n) => '<i style="height:' + Math.round((n / maxA) * 100) + '%"></i>').join('') +
      '</div></div></div>' +
      '<h3>By theme</h3>' +
      (themes.length
        ? '<table class="tbl"><tbody>' +
          themes
            .map(
              (g) =>
                '<tr><td>' +
                esc(g.key) +
                '</td><td style="width:40%">' +
                meter(g.mastery, true) +
                '</td><td class="src">' +
                pct(g.mastery) +
                ' · ' +
                g.started +
                '/' +
                g.total +
                '</td></tr>',
            )
            .join('') +
          '</tbody></table>'
        : '<p class="en">Nothing started yet.</p>') +
      '<h3>By grammar concept</h3>' +
      (concepts.length
        ? '<table class="tbl"><tbody>' +
          concepts
            .map(
              (g) =>
                '<tr><td>' +
                refBtn('concept', g.key, esc(concept(g.key).title)) +
                '</td><td style="width:40%">' +
                meter(g.mastery, true) +
                '</td><td class="src">' +
                pct(g.mastery) +
                '</td></tr>',
            )
            .join('') +
          '</tbody></table>'
        : '<p class="en">Nothing started yet.</p>') +
      '<h3>Weakest</h3>' +
      (weak.length
        ? '<div class="lcard">' + weak.map(cardLine).join('<br>') + '</div>'
        : '<p class="en">Nothing reviewed yet.</p>') +
      '<h3>Learners</h3><div class="lcard">' +
      Object.values(A.store.profiles)
        .map(
          (x) =>
            '<div class="lrow"><strong>' +
            esc(x.name) +
            '</strong>' +
            (x.id === p.id
              ? ' <span class="pill ok">active</span>'
              : ' <button type="button" class="btn" data-profile="' +
                esc(x.id) +
                '">Switch</button>') +
            ' <span class="src">' +
            Object.keys(x.cards).length +
            ' cards</span></div>',
        )
        .join('') +
      '<form id="addProfile" class="lrow" style="margin-top:8px"><label class="sr-only" for="newProfile">New learner name</label><input id="newProfile" class="lsearch" style="width:auto" placeholder="New learner’s name" required><button class="btn" type="submit">Add learner</button></form></div>' +
      '<h3>Settings</h3><form id="settings" class="lcard"><div class="lform">' +
      '<label>New items per day<input type="number" name="newPerDay" min="0" max="100" value="' +
      s.newPerDay +
      '"></label>' +
      '<label>Reviews per day<input type="number" name="reviewsPerDay" min="10" max="2000" value="' +
      s.reviewsPerDay +
      '"></label>' +
      '<label>Scheduler<select name="scheduler"><option value="fsrs"' +
      (s.scheduler === 'fsrs' ? ' selected' : '') +
      '>FSRS</option><option value="sm2"' +
      (s.scheduler === 'sm2' ? ' selected' : '') +
      '>SM-2</option></select></label>' +
      '<label>Target recall<select name="retention">' +
      [0.8, 0.85, 0.9, 0.95]
        .map(
          (r) =>
            '<option value="' +
            r +
            '"' +
            (s.retention === r ? ' selected' : '') +
            '>' +
            pct(r) +
            '</option>',
        )
        .join('') +
      '</select></label>' +
      '<label>Text size<select name="scale">' +
      [0.9, 1, 1.15, 1.3, 1.5]
        .map(
          (r) =>
            '<option value="' +
            r +
            '"' +
            (A.ui.scale === r ? ' selected' : '') +
            '>' +
            pct(r) +
            '</option>',
        )
        .join('') +
      '</select></label>' +
      '<label>Contrast<select name="contrast"><option value="normal">normal</option><option value="high"' +
      (A.ui.contrast === 'high' ? ' selected' : '') +
      '>high</option></select></label>' +
      '<label>Motion<select name="motion"><option value="system">as the system</option><option value="reduce"' +
      (A.ui.motion === 'reduce' ? ' selected' : '') +
      '>reduced</option></select></label>' +
      '</div><p><button class="btn btn-primary" type="submit">Save settings</button></p></form>' +
      '<h3>Backup</h3><div class="lcard lrow">' +
      '<button type="button" class="btn" data-backup="progress">Export progress</button>' +
      '<button type="button" class="btn" data-backup="import">Import progress</button>' +
      '<button type="button" class="btn" data-backup="full">Full backup</button>' +
      '<button type="button" class="btn" data-backup="restore">Restore a full backup</button>' +
      '</div><form id="wipe" class="lcard lrow"><label for="wipeConfirm">Wipe this learner’s progress: type WIPE</label><input id="wipeConfirm" class="lsearch" style="width:8em" autocomplete="off"><button class="btn" type="submit">Wipe</button></form>'
    );
  };

  /* --------------------------------------------------------- sessions */

  function startSession(title, exercises, opts) {
    const o = opts || {};
    if (!exercises.length) {
      flash(o.empty || 'Nothing to practise here yet.');
      return;
    }
    A.view = { name: 'session', args: {} };
    renderNav();
    const host = A.main;
    U.runSession(host, {
      title,
      exercises,
      gctx: A.gctx,
      // a wing may grade, word and re-ask in its own way (Ten Stars does)
      ...(o.grade ? { grade: o.grade } : {}),
      ...(o.requeue ? { requeue: true } : {}),
      ...(o.verdictText ? { verdictText: o.verdictText } : {}),
      ...(o.diagnosisText ? { diagnosisText: o.diagnosisText } : {}),
      ...(o.glossOpen ? { glossOpen: true } : {}),
      badge: (ex) => {
        const c = profile().cards[ex.card];
        return c && c.changed
          ? '<span class="pill changed">changed · was ' + esc(c.changed.from) + '</span>'
          : '';
      },
      onAnswer: (ex, grade, ms) => {
        A.L.recordReview(profile(), A.data, ex.card, grade, ex.type, now(), ms);
        if (grade.verdict === 'correct' && U.hall) U.hall.chime();
        save();
      },
      onDone: (results) => {
        if (o.onFinish) return o.onFinish(results);
        const note = o.onDone ? o.onDone(results) : '';
        summary(title, results, o.back || home(), note || '');
      },
      onExit: () => go(o.back || home()),
      openRef: (ref) => openRef(ref),
      playAudio: (key) => play(key),
    });
  }

  function summary(title, results, back, note) {
    const right = results.filter((r) => r.grade.verdict === 'correct').length;
    const misses = results.filter((r) => r.grade.verdict !== 'correct');
    A.view = { name: 'summary', args: {} };
    renderNav();
    A.main.innerHTML =
      '<div class="inner"><h2 tabindex="-1">' +
      esc(title) +
      ': done</h2><p class="lede">' +
      right +
      ' of ' +
      results.length +
      ' right.</p>' +
      (note ? '<div class="lcard" role="status">' + esc(note) + '</div>' : '') +
      (misses.length
        ? '<h3>To look at again</h3><div class="lcard">' +
          misses
            .map(
              (r) =>
                esc(r.ex.instruction) +
                ' <span class="lw" lang="x-liraasa">' +
                esc(r.grade.expected) +
                '</span>' +
                (r.grade.diagnoses[0] && r.grade.diagnoses[0].link
                  ? ' ' +
                    refBtn(r.grade.diagnoses[0].link.kind, r.grade.diagnoses[0].link.id, 'see')
                  : ''),
            )
            .join('<br>') +
          '</div>'
        : '') +
      '<p><button type="button" class="btn btn-primary" data-go="' +
      esc(back) +
      '">Continue</button></p></div>';
    A.main.querySelector('h2').focus();
    announce(right + ' of ' + results.length + ' right. ' + (note || ''));
  }

  function practiseNodes(title, nodes, length, back, types) {
    const p = profile();
    for (const n of nodes) A.L.introduce(p, A.data, A.graph, n, now());
    U.refreshKnown();
    save();
    startSession(title, A.L.mixedSession(A.ctx, nodes, rng(title), length, types), { back });
  }

  function review() {
    const p = profile();
    const q = A.L.dailyQueue(p, A.graph, now());
    const r = rng('review');
    const exercises = [];
    for (const c of q.due) {
      const ex = A.L.exerciseForCard(A.ctx, c.id, r);
      if (ex) exercises.push(ex);
      if (exercises.length >= 40) break;
    }
    // changed cards first, then mixed so no format runs long
    const changed = exercises.filter((e) => p.cards[e.card] && p.cards[e.card].changed);
    const rest = r.shuffle(exercises.filter((e) => !changed.includes(e)));
    startSession('Review', changed.concat(rest), {
      empty: 'Nothing is due. Learn something new from the path.',
    });
  }

  function checkpoint(i) {
    const u = A.graph.units[i];
    const ex = A.L.mixedSession(A.ctx, u.nodes, rng('checkpoint' + i), 12);
    startSession('Checkpoint · unit ' + (i + 1), ex, {
      back: 'unit',
      onDone: (results) => {
        const cp = A.L.recordCheckpoint(
          profile(),
          i,
          results.map((r) => ({
            target: r.ex.target,
            score: r.grade.verdict === 'correct' ? 1 : r.grade.verdict === 'almost' ? 0.5 : 0,
          })),
          now(),
        );
        save();
        return cp.passed
          ? 'Unit ' + (i + 1) + ' passed with ' + pct(cp.score) + ': unit ' + (i + 2) + ' is open.'
          : 'Not passed yet: ' +
              pct(cp.score) +
              ', and ' +
              pct(profile().settings.passMark) +
              ' passes. The weak spots are listed on the unit.';
      },
    });
    A.unitBack = i;
  }

  function learnFromText(id) {
    const r = A.L.reading(A.data, id);
    if (!r) return;
    const concepts = new Set();
    for (const e of A.data.examples)
      if (e.where && e.where.startsWith(id + ':')) for (const c of e.concepts) concepts.add(c);
    const nodes = A.L.writingNodes(profile(), A.graph, r.vocabulary, [...concepts], now()).slice(
      0,
      12,
    );
    const rr = rng('text' + id);
    const lines = A.data.examples.filter((e) => e.where && e.where.startsWith(id + ':'));
    const cloze = rr
      .shuffle(lines)
      .slice(0, 6)
      .map((e) => A.L.cloze(A.ctx, e, rr))
      .filter(Boolean);
    const p = profile();
    for (const n of nodes) A.L.introduce(p, A.data, A.graph, n, now());
    U.refreshKnown();
    save();
    const mixed = rr.shuffle(A.L.mixedSession(A.ctx, nodes, rr, 14).concat(cloze));
    startSession('Learning: ' + r.text.title, mixed, {
      back: 'read',
      empty: 'Every word of this text is already well known.',
    });
  }

  function comprehension(id) {
    const rr = rng('comp' + id);
    const lines = A.data.examples.filter(
      (e) => e.where && e.where.startsWith(id + ':') && e.english,
    );
    startSession(
      'Comprehension',
      rr
        .shuffle(lines)
        .slice(0, 8)
        .map((e) => A.L.translateFrom(A.ctx, e))
        .filter(Boolean),
      { back: 'read' },
    );
  }

  function drillDiff() {
    const d = A.diff;
    if (!d) return;
    const ids = [...d.renamed, ...d.reglossed, ...d.added]
      .map((x) => x.id)
      .filter((id) => A.graph.nodes.has('root:' + id));
    const nodes = ids.slice(0, 12).map((id) => 'root:' + id);
    practiseNodes('What changed', nodes, 15, 'changes');
  }

  /* ---------------------------------------------------- the word popover */

  let pop = null;
  function closePop() {
    if (!pop) return;
    const back = pop.back;
    pop.el.remove();
    pop = null;
    if (back) back.focus();
  }

  function showPop(btn, id) {
    closePop();
    const c = A.L.rootCard(A.data, id, A.overrides);
    const it = item(id);
    if (!it) return;
    const el = document.createElement('div');
    el.className = 'lpop';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', it.spelling);
    el.innerHTML = c
      ? cardHtml(c, { compact: true })
      : '<div class="lbig">' + esc(it.spelling) + '</div><p>' + esc(it.meaning) + '</p>';
    document.body.appendChild(el);
    const r = btn.getBoundingClientRect();
    const top = Math.min(r.bottom + 6, innerHeight - el.offsetHeight - 8);
    el.style.top = Math.max(8, top) + 'px';
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - el.offsetWidth - 8)) + 'px';
    pop = { el, back: btn };
    const f = el.querySelector('button');
    if (f) f.focus();
  }

  /* ------------------------------------------------------------ routing */

  function openRef(ref) {
    closePop();
    // in the Hall, a rule opens its Loom lesson and a headword its study card
    const hall = home() === 'hall';
    const head = ref.kind === 'item' && ['root', 'compound'].includes((item(ref.id) || {}).kind);
    if (hall && head) go('word', { id: ref.id });
    else if (hall && ref.kind === 'concept' && A.data.concepts.has(ref.id))
      go('loom', { id: ref.id, step: 'see' });
    else if (ref.kind === 'item') go('card', { id: ref.id });
    else if (ref.kind === 'concept') go('concept', { id: ref.id });
    else if (ref.kind === 'text') go('text', { id: ref.id });
  }
  U.openRef = (ref) => {
    U.setLearn(true).then(() => openRef(ref));
  };

  /** Home: the Training Hall, or Classic Learn's Today for a learner who chose it. */
  const home = () => (A.ui && A.ui.mode === 'classic' ? 'today' : 'hall');

  function setMode(mode) {
    A.ui.mode = mode === 'classic' ? 'classic' : 'hall';
    applyUi();
  }

  function go(name, args) {
    if (A.view && A.view.name !== 'session') (A.history = A.history || []).push(A.view);
    A.view = { name, args: args || {} };
    render();
  }

  function back() {
    const prev = (A.history || []).pop();
    A.view = prev || { name: home(), args: {} };
    render();
  }

  function render() {
    if (!A.ready) return;
    renderNav();
    const v =
      A.view.name === 'unit' && A.view.args.index === undefined && A.unitBack !== undefined
        ? { name: 'unit', args: { index: A.unitBack } }
        : A.view.name === 'summary' || A.view.name === 'session'
          ? { name: home(), args: {} }
          : A.view;
    A.view = v;
    if (v.name === 'author') {
      A.main.innerHTML = '<div class="inner"></div>';
      U.renderAuthor(A.main.firstChild, U.authorApi);
    } else if (v.name === 'review') {
      return review();
    } else {
      const f = VIEWS[v.name] || VIEWS[home()];
      A.main.innerHTML = '<div class="inner">' + f(v.args) + '</div>';
    }
    A.main.scrollTop = 0;
    const h = A.main.querySelector('h2');
    if (h) h.focus();
  }
  U.render = render;

  function renderNav() {
    const p = profile();
    const due = A.L.dailyQueue(p, A.graph, now()).due.length;
    const S = U.S;
    const hall = home() === 'hall';
    const items = hall
      ? [
          ['hall', S.hall],
          ['stars', S.stars],
          ['loom', S.loom],
          ['course', S.course],
          ['observatory', S.observatory],
          ['review', S.review, due],
          ['hallSettings', S.settings],
          ['sep'],
          ['mode:classic', S.classic],
          ['author', S.author],
        ]
      : [
          ['mode:hall', S.backToHall],
          ['sep'],
          ['today', 'Today'],
          ['path', 'Path'],
          ['review', 'Review', due],
          ['practice', 'Practice'],
          ['read', 'Read'],
          ['progress', 'Progress'],
          ['changes', 'What changed'],
          ['sep'],
          ['author', 'Author'],
        ];
    const current =
      A.view.name === 'unit'
        ? 'path'
        : A.view.name === 'text'
          ? 'read'
          : A.view.name === 'sandbox'
            ? 'loom'
            : A.view.name;
    A.el.dataset.mode = hall ? 'hall' : 'classic';
    A.nav.innerHTML =
      items
        .map((x) =>
          x[0] === 'sep'
            ? '<div class="sep" role="separator"></div>'
            : x[0].startsWith('mode:')
              ? '<button type="button" class="mode" data-mode="' +
                x[0].slice(5) +
                '">' +
                esc(x[1]) +
                '</button>'
              : '<button type="button" data-go="' +
                x[0] +
                '"' +
                (current === x[0] ? ' aria-current="page"' : '') +
                '>' +
                x[1] +
                (x[2] ? '<span class="count">' + x[2] + '</span>' : '') +
                '</button>',
        )
        .join('') +
      '<button type="button" class="keys" data-keys aria-keyshortcuts="?">' +
      esc(S.keys.title) +
      ' <kbd>?</kbd></button>' +
      '<div class="who">' +
      esc(p.name) +
      ' · ' +
      esc(A.data.edition) +
      '</div>';
  }

  /* ------------------------------------------------------------- audio */

  /**
   * A recording made in Learn wins; otherwise the file the manifest lists,
   * which lives beside the editor in data/audio/. Never synthesised speech.
   */
  let playing = null;
  async function play(key) {
    const blob = await U.store.audioGet(key);
    const file = A.files && A.files[key];
    if (!blob && !file) return flash('That recording is missing.');
    if (playing) {
      playing.pause();
      if (playing.src.startsWith('blob:')) URL.revokeObjectURL(playing.src);
    }
    playing = new Audio(blob ? URL.createObjectURL(blob) : '../data/audio/' + file);
    playing.play().catch(() => flash('That recording could not be played.'));
  }
  U.play = play;

  /* ------------------------------------------------------------ actions */

  function announce(text) {
    const live = document.getElementById('learnLive');
    if (!live) return;
    live.textContent = '';
    setTimeout(() => (live.textContent = text), 30);
  }

  function flash(text) {
    announce(text);
    render();
    const box = document.createElement('div');
    box.className = 'lcard';
    box.setAttribute('role', 'status');
    box.style.borderColor = 'var(--accent)';
    box.textContent = text;
    // right under the view's heading (or its header, in the Hall)
    const h = A.main.querySelector('.inner h2');
    const anchor = h ? h.closest('header') || h : null;
    if (anchor) anchor.after(box);
  }
  U.flash = flash;

  async function backup(kind) {
    const L = A.L;
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'progress')
      return U.download('liraasa-progress-' + stamp + '.json', L.exportStore(A.store));
    if (kind === 'full') {
      const audio = {};
      for (const key of Object.keys(A.store.audio)) {
        const blob = await U.store.audioGet(key);
        if (blob) audio[key] = await U.blobToDataUrl(blob);
      }
      const full = {
        kind: 'liraasa-learn-backup',
        version: 1,
        progress: JSON.parse(L.exportStore(A.store)),
        overrides: A.draft,
        changes: A.changes,
        audio,
      };
      return U.download('liraasa-learn-backup-' + stamp + '.json', JSON.stringify(full));
    }
    const picked = await U.pickFile('application/json,.json', true);
    if (!picked) return;
    try {
      const raw = JSON.parse(picked.text);
      if (kind === 'restore') {
        if (raw.kind !== 'liraasa-learn-backup') throw new Error('not a full Learn backup');
        A.store = L.migrateStore(raw.progress);
        A.draft = raw.overrides || null;
        A.changes = raw.changes || [];
        for (const [key, url] of Object.entries(raw.audio || {}))
          await U.store.audioSet(key, await U.dataUrlToBlob(url));
        A.audio = new Set([...Object.keys(A.files), ...Object.keys(raw.audio || {})]);
        await U.store.set('overrides', A.draft);
        await U.store.set('lexicon-changes', A.changes);
        applyLexiconChanges();
      } else {
        A.store = L.importStore(picked.text);
      }
      rebuild();
      reconcileAll();
      await U.store.set('progress', L.exportStore(A.store));
      flash('Restored from ' + picked.file.name + '.');
    } catch (e) {
      flash('Could not read ' + picked.file.name + ': ' + e.message);
    }
  }

  function onClick(e) {
    const b = e.target.closest('button');
    if (pop && !e.target.closest('.lpop') && !(b && b.closest('.il'))) closePop();
    if (!b || !A.ready) return;
    if (A.view.name === 'session' && A.main.contains(b)) return; // the runner owns it
    const d = b.dataset;
    if (d.go)
      return d.go === 'review' ? ((A.view = { name: 'review', args: {} }), review()) : go(d.go);
    if (d.back) return back();
    if (U.hall && U.hall.onClick(b)) return;
    if (d.ref) {
      const [kind, ...rest] = d.ref.split(':');
      const id = rest.join(':');
      if (kind === 'item' && b.closest('.il') && !b.closest('.lpop')) return showPop(b, id);
      return openRef({ kind, id });
    }
    if (d.unit !== undefined) {
      A.unitBack = Number(d.unit);
      return go('unit', { index: Number(d.unit) });
    }
    if (d.practiseUnit !== undefined) {
      const u = A.graph.units[Number(d.practiseUnit)];
      A.unitBack = u.index;
      return practiseNodes('Unit ' + (u.index + 1), u.nodes, 14, 'unit');
    }
    if (d.checkpoint !== undefined) return checkpoint(Number(d.checkpoint));
    if (d.practise) return practiseNodes('Practice', [d.practise], 8, A.view.name);
    if (d.build) {
      const r = rng('build');
      const sentences = A.data.examples.filter((x) => x.concepts.includes(d.build));
      const ex = r
        .shuffle(sentences)
        .slice(0, 6)
        .map((s) => A.L.assemble(A.ctx, s, r, d.build))
        .filter(Boolean)
        .slice(0, 3);
      return startSession('Build it yourself', ex, { back: A.view.name });
    }
    if (d.lab) return practiseNodes('Compound lab', [d.lab], 6, A.view.name);
    if (d.toggle) {
      A.view.args[d.toggle] = A.view.args[d.toggle] === false;
      return render();
    }
    if (d.learnText) return learnFromText(d.learnText);
    if (d.comprehend) return comprehension(d.comprehend);
    if (d.openLex) {
      U.setLearn(false);
      return root.dispatchEvent(
        new CustomEvent('liraasa:open-lexicon', { detail: { spelling: d.openLex } }),
      );
    }
    if (d.openPiece) {
      U.setLearn(false);
      return root.dispatchEvent(
        new CustomEvent('liraasa:open-piece', { detail: { id: d.openPiece } }),
      );
    }
    if (d.drillDiff) return drillDiff();
    if (d.drillLeeches) {
      const r = rng('leech');
      return startSession(
        'Needs attention',
        A.L.leeches(profile())
          .map((c) => A.L.exerciseForCard(A.ctx, c.id, r))
          .filter(Boolean),
      );
    }
    if (d.profile) {
      A.store.active = d.profile;
      U.refreshKnown();
      save();
      return render();
    }
    if (d.backup) return backup(d.backup);
  }

  function onSubmit(e) {
    const f = e.target;
    if (!A.ready || !A.main.contains(f)) return;
    e.preventDefault();
    if (U.hall && U.hall.onSubmit(f)) return;
    const p = profile();
    if (f.id === 'drill') {
      const fd = new FormData(f);
      const themes = new Set(fd.getAll('themes'));
      const concepts = new Set(fd.getAll('concepts'));
      const types = new Set(fd.getAll('types'));
      const unseen = fd.get('unseen') === 'on';
      const nodes = [...A.graph.nodes.values()]
        .filter((n) => unseen || p.seen[n.id] !== undefined)
        .filter((n) => {
          if (n.kind === 'concept')
            return concepts.size === 0 ? themes.size === 0 : concepts.has(n.id);
          const it = item(n.ref);
          return themes.size === 0 ? concepts.size === 0 : it && themes.has(it.theme);
        })
        .map((n) => n.id);
      const pick = rng('drill').shuffle(nodes).slice(0, 40);
      return startSession(
        'Practice',
        A.L.mixedSession(A.ctx, pick, rng('drill2'), Number(fd.get('length')), types),
        {
          back: 'practice',
          empty: unseen
            ? 'Nothing matches that choice.'
            : 'Nothing you have started matches; tick “include words not started yet”.',
        },
      );
    }
    if (f.id === 'settings') {
      const fd = new FormData(f);
      p.settings.newPerDay = Number(fd.get('newPerDay'));
      p.settings.reviewsPerDay = Number(fd.get('reviewsPerDay'));
      p.settings.scheduler = fd.get('scheduler');
      p.settings.retention = Number(fd.get('retention'));
      A.ui = {
        ...A.ui,
        scale: Number(fd.get('scale')),
        contrast: fd.get('contrast'),
        motion: fd.get('motion'),
      };
      applyUi();
      save();
      return flash('Settings saved.');
    }
    if (f.id === 'addProfile') {
      const name = f.querySelector('input').value.trim();
      if (!name) return;
      const id = 'p' + Date.now().toString(36);
      A.store.profiles[id] = A.L.createProfile(id, name, A.data.edition, now());
      A.store.active = id;
      save();
      return flash(name + ' added and active.');
    }
    if (f.id === 'wipe') {
      if (f.querySelector('input').value.trim() !== 'WIPE') return flash('Type WIPE to confirm.');
      const fresh = A.L.createProfile(p.id, p.name, A.data.edition, now());
      fresh.settings = p.settings;
      A.store.profiles[p.id] = fresh;
      save();
      return flash(p.name + '’s progress was wiped. A backup taken before can restore it.');
    }
  }

  function applyUi() {
    try {
      root.localStorage.setItem('liraasa-learn-ui', JSON.stringify(A.ui));
    } catch {
      /* per-viewer convenience only */
    }
    A.el.style.setProperty('--ls', String(A.ui.scale || 1));
    A.el.dataset.contrast = A.ui.contrast || 'normal';
    A.el.dataset.motion = A.ui.motion || 'system';
    A.el.dataset.sky = A.ui.sky || 'night';
    A.el.dataset.font = A.ui.font || 'default';
  }

  /* -------------------------------------------- live change from outside */

  /** Apply a root change made here: replay it, rebuild, reconcile, correct the writings. */
  U.applyRootChange = function applyRootChange(change, result) {
    A.changes.push(change);
    U.store.set('lexicon-changes', A.changes);
    A.lex = result.lexicon;
    const detail = { mapping: result.impact.forms, record: change, corrected: 0 };
    root.dispatchEvent(new CustomEvent('liraasa:lexicon-changed', { detail }));
    rebuild();
    reconcileAll();
    save();
    return detail.corrected;
  };

  U.setDraftOverrides = async function setDraftOverrides(next) {
    A.draft = next;
    await U.store.set('overrides', next);
    rebuild();
    reconcileAll();
  };

  U.undoRootChanges = async function undoRootChanges() {
    A.changes = [];
    await U.store.set('lexicon-changes', []);
    applyLexiconChanges();
    rebuild();
    reconcileAll();
    save();
  };

  /* mastery, for the songbook's Lexicon tab and composer */
  U.masteryOf = function masteryOf(spelling) {
    if (!A.ready) return null;
    const link = A.L.linkWord(A.src.context, String(spelling));
    if (link.kind !== 'entry') return null;
    const ref = link.refs.find((r) => A.graph.nodes.has('root:' + r.id));
    if (!ref || profile().seen['root:' + ref.id] === undefined) return null;
    return nodeMastery('root:' + ref.id);
  };
  U.masteryBadge = function masteryBadge(spelling) {
    const m = U.masteryOf(spelling);
    return m === null
      ? ''
      : '<span class="mastery-badge" title="Learn: ' + pct(m) + ' mastered">' + pct(m) + '</span>';
  };

  /* ---------------------------------------------------------------- boot */

  U.setLearn = async function setLearn(on) {
    document.body.classList.toggle('learn-on', on);
    A.btn.setAttribute('aria-pressed', String(on));
    try {
      root.localStorage.setItem('liraasa-learn-on', on ? '1' : '0');
    } catch {
      /* per-viewer convenience only */
    }
    if (!on) return;
    if (!A.ready) {
      A.main.innerHTML =
        '<div class="inner"><h2 tabindex="-1">Learn</h2><p class="lede">Loading the language…</p></div>';
      try {
        await U.init();
      } catch (e) {
        A.main.innerHTML =
          '<div class="inner"><h2 tabindex="-1">Learn could not load</h2><p class="gap-error">' +
          esc(e.message) +
          '. Run <code>npm run build:learn</code>.</p></div>';
        return;
      }
    } else if (root.localStorage.getItem(SONGBOOK) !== A.writingsKey) {
      rebuild();
    }
    if (!A.visited) {
      // once per opening of the page: what the Hall's greeting compares with
      A.visited = true;
      A.L.recordVisit(profile(), now());
      save();
    }
    render();
  };

  function boot() {
    A.el = document.getElementById('learnView');
    A.btn = document.getElementById('learnBtn');
    if (!A.el || !A.btn) return;
    A.el.innerHTML =
      '<nav class="lnav" aria-label="Learn"></nav><div class="lmain" id="learnMain"></div>';
    A.nav = A.el.querySelector('.lnav');
    A.main = A.el.querySelector('.lmain');
    try {
      A.ui = JSON.parse(root.localStorage.getItem('liraasa-learn-ui') || '{}');
    } catch {
      A.ui = {};
    }
    A.ui = {
      scale: 1,
      contrast: 'normal',
      motion: 'system',
      sky: 'night',
      font: 'default',
      sound: 'off',
      mode: 'hall',
      ...A.ui,
    };
    if (U.hall) Object.assign(VIEWS, U.hall.views);
    A.view = { name: home(), args: {} };
    applyUi();
    A.btn.addEventListener('click', () =>
      U.setLearn(!document.body.classList.contains('learn-on')),
    );
    A.el.addEventListener('click', onClick);
    document.addEventListener('click', (e) => {
      if (pop && !A.el.contains(e.target) && !pop.el.contains(e.target)) closePop();
      if (pop && pop.el.contains(e.target)) onClick(e);
    });
    A.el.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pop) {
        e.preventDefault();
        closePop();
      }
    });
    // another module changed the lexicon: rebuild from what it hands over
    root.addEventListener('liraasa:lexicon-replaced', (e) => {
      if (!A.ready || !e.detail || !e.detail.lexicon) return;
      A.lex = e.detail.lexicon;
      rebuild();
      reconcileAll();
      save();
      render();
    });
    let open = false;
    try {
      open = root.localStorage.getItem('liraasa-learn-on') === '1';
    } catch {
      open = false;
    }
    if (open) U.setLearn(true);
    else {
      // load in the background once the songbook is idle, for the mastery badges
      const idle = root.requestIdleCallback || ((f) => setTimeout(f, 1500));
      idle(() =>
        U.init()
          .then(() => root.dispatchEvent(new CustomEvent('liraasa:learn-ready')))
          .catch(() => undefined),
      );
    }
  }

  U.hallApi = {
    get A() {
      return A;
    },
    profile,
    now,
    go,
    render,
    flash,
    save,
    applyUi,
    setMode,
    announce,
    md,
    practiseNodes,
    startSession,
    play: (key) => play(key),
    refreshKnown: () => U.refreshKnown(),
  };

  U.authorApi = {
    get A() {
      return A;
    },
    rebuild,
    reconcileAll,
    save,
    render,
    flash,
    go,
    esc,
    lira,
    itemLink,
    refBtn,
    md,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
