/* Ten Stars: the vocabulary wing of the Training Hall (Hall Phase 3).
 *
 *   draw        the core draws by id (stars.ts); the options live in "Shape the draw"
 *   preview     the constellation: choose a star to draw another or to pin it
 *   study       one card per word: every form from the forms engine, the rule
 *               behind each, compounds, fixed derivations, a sentence, links
 *   done        the words join the review schedule; choose what to practise
 *   practice    the drill (drill.ts): modes mixed, misses asked once more,
 *               graded with the forms engine's near-miss check
 *   reflect     each star brighter or dimmer by how it went, said in words too
 *
 * Keys in a study:  ← →  card · R  the rule · G  the gloss · A  listen · Esc  the sky
 * Swipe left or right on a touch screen to move between cards.
 *
 * No Liraasa here: every word comes from the data through the core. English
 * comes from strings.js.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S.ts;
  const H = () => U.hallApi;
  const esc = (s) => U.esc(s);
  const lira = (s, cls) =>
    '<span class="lw' + (cls ? ' ' + cls : '') + '" lang="x-liraasa">' + esc(s) + '</span>';

  /* view state that is not progress: per screen, never saved */
  const ui = {
    selected: null,
    rule: false,
    gloss: null,
    done: null,
    note: null,
    /** The practice modes last chosen on this screen; all of them is a mixed drill. */
    modes: null,
    /** After a drill: { ids, words } from drillResults. */
    reflect: null,
  };

  /* ---------------------------------------------------------- the state */

  const L = () => H().A.L;
  const ctx = () => ({
    data: H().A.data,
    forms: H().A.forms,
    profile: H().profile(),
    now: H().now(),
  });

  /** The saved state, checked against the data; a retired word is reported once. */
  function load() {
    const h = H();
    const hs = L().hallOf(h.profile()).settings;
    const r = L().starsOf(h.profile(), h.A.data, { count: hs.stars });
    if (r.retired.length > 0) {
      ui.note = S().retired(r.retired.length);
      L().setStars(h.profile(), r.state);
      h.save();
    }
    return r.state;
  }

  function store(state) {
    L().setStars(H().profile(), state);
    H().save();
  }

  const newSeed = () => H().now().toString(36);

  function draw(options, seed) {
    const state = load();
    const d = L().drawStars(ctx(), options, seed || newSeed());
    ui.selected = null;
    ui.done = null;
    store({ ...state, options, draw: d, phase: 'preview', index: 0, studied: [] });
  }

  /* ------------------------------------------------------------- views */

  function view() {
    const state = load();
    if (ui.reflect) return reflectView();
    if (ui.done) return doneView();
    if (state.draw === null) {
      draw(state.options);
      return view();
    }
    return state.phase === 'study' ? studyView(state) : previewView(state);
  }

  function notice() {
    if (!ui.note) return '';
    const n = ui.note;
    ui.note = null;
    return '<p class="lcard ts-note" role="status">' + esc(n) + '</p>';
  }

  /** Small offsets from the id, so the constellation is irregular but stable. */
  function jitter(id) {
    let h = 0;
    for (let i = 0; i < id.length; i += 1) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
    const dx = ((h & 0xff) / 255 - 0.5) * 28;
    const dy = (((h >> 8) & 0xff) / 255 - 0.5) * 28;
    return '--dx:' + dx.toFixed(1) + 'px;--dy:' + dy.toFixed(1) + 'px';
  }

  function previewView(state) {
    const s = S();
    const A = H().A;
    const d = state.draw;
    const sel = ui.selected && d.ids.includes(ui.selected) ? ui.selected : null;
    const stars = d.ids
      .map((id) => {
        const it = A.data.items.get(id);
        if (!it) return '';
        const pinned = d.pinned.includes(id);
        const irregular = A.forms.isIrregular(id);
        return (
          '<li class="ts-star' +
          (pinned ? ' pinned' : '') +
          (irregular ? ' irregular' : '') +
          '" style="' +
          jitter(id) +
          '"><button type="button" class="ts-point" data-star-select="' +
          esc(id) +
          '" aria-pressed="' +
          String(sel === id) +
          '"><span class="ts-dot" aria-hidden="true"></span>' +
          lira(it.spelling) +
          '<span class="ts-gloss">' +
          esc(it.meaning) +
          '</span>' +
          (pinned ? '<span class="ts-pin">' + esc(s.pinned) + '</span>' : '') +
          (irregular ? '<span class="sr-only">' + esc(s.irregularSr) + '</span>' : '') +
          '</button></li>'
        );
      })
      .join('');
    const it = sel ? A.data.items.get(sel) : null;
    const actions = it
      ? '<div class="ts-actions" role="group" aria-label="' +
        esc(s.selected + ': ' + it.spelling) +
        '"><span>' +
        esc(s.selected) +
        ': ' +
        lira(it.spelling) +
        '</span><button type="button" class="btn" data-star-reroll="' +
        esc(sel) +
        '"' +
        (d.pinned.includes(sel) ? ' disabled' : '') +
        '>' +
        esc(s.another) +
        '</button><button type="button" class="btn" data-star-pin="' +
        esc(sel) +
        '" aria-pressed="' +
        String(d.pinned.includes(sel)) +
        '">' +
        esc(d.pinned.includes(sel) ? s.unpin : s.pin) +
        '</button></div>'
      : '';
    const want = d.options.count;
    const shortNote =
      d.ids.length === 0
        ? '<p class="ts-short">' + esc(s.empty) + '</p>'
        : d.ids.length < want
          ? '<p class="ts-short">' + esc(s.short(d.ids.length, want)) + '</p>'
          : '';
    const resume =
      state.studied.length > 0
        ? '<button type="button" class="btn" data-star-resume>' +
          esc(s.resume(state.index + 1, d.ids.length)) +
          '</button>'
        : '';
    return (
      '<section class="hall ts"><header class="hall-head"><p class="kicker">' +
      esc(U.S.stars) +
      '</p><h2 tabindex="-1">' +
      esc(s.waitingN(d.ids.length)) +
      '</h2><p class="hall-greeting">' +
      esc(s.previewLede) +
      '</p></header>' +
      notice() +
      shortNote +
      '<ul class="ts-sky" role="list">' +
      stars +
      '</ul>' +
      actions +
      '<div class="ts-go">' +
      '<button type="button" class="btn btn-primary" data-star-begin' +
      (d.ids.length === 0 ? ' disabled' : '') +
      '>' +
      esc(s.begin) +
      '</button>' +
      resume +
      '<button type="button" class="btn" data-star-all aria-describedby="tsAllNote">' +
      esc(s.rerollAll) +
      '</button><span class="hs-note" id="tsAllNote">' +
      esc(s.rerollAllNote) +
      '</span></div>' +
      shapePanel(state, d) +
      '</section>'
    );
  }

  /* ----------------------------------------------- shape the draw panel */

  function shapePanel(state, d) {
    const s = S();
    const A = H().A;
    const o = state.options;
    const themes = [...new Set([...A.data.items.values()].filter(head).map((i) => i.theme))].sort();
    const editions = [
      ...new Set([...A.data.items.values()].filter(head).map((i) => i.since)),
    ].sort();
    const opt = (v, text, cur) =>
      '<option value="' +
      esc(String(v)) +
      '"' +
      (String(v) === String(cur) ? ' selected' : '') +
      '>' +
      esc(text) +
      '</option>';
    const field = (id, label, control, note) =>
      '<div class="hs-field"><label for="' +
      id +
      '">' +
      esc(label) +
      '</label>' +
      control +
      (note ? '<p class="hs-note">' + esc(note) + '</p>' : '') +
      '</div>';
    const checks = (name, legend, values, chosen, labelOf, note) =>
      '<fieldset class="ts-checks"><legend>' +
      esc(legend) +
      '</legend>' +
      values
        .map(
          (v) =>
            '<label><input type="checkbox" name="' +
            name +
            '" value="' +
            esc(v) +
            '"' +
            (chosen.includes(v) ? ' checked' : '') +
            '> ' +
            esc(labelOf(v)) +
            '</label>',
        )
        .join('') +
      (note ? '<p class="hs-note">' + esc(note) + '</p>' : '') +
      '</fieldset>';
    const slotName = (slot) => U.S.slotNames[slot] || slot;
    return (
      '<details class="lcard ts-shape"' +
      (ui.shapeOpen ? ' open' : '') +
      '><summary>' +
      esc(s.shape) +
      '</summary><form id="starsDraw">' +
      field(
        'ts-count',
        s.count,
        '<select id="ts-count" name="count">' +
          [5, 10, 15, 20].map((n) => opt(n, String(n), o.count)).join('') +
          '</select>',
      ) +
      field(
        'ts-only',
        s.only,
        '<select id="ts-only" name="only">' +
          Object.entries(s.onlies)
            .map(([v, t]) => opt(v, t, o.only))
            .join('') +
          '</select>',
      ) +
      field(
        'ts-weighting',
        s.weighting,
        '<select id="ts-weighting" name="weighting">' +
          Object.entries(s.weightings)
            .map(([v, t]) => opt(v, t, o.weighting))
            .join('') +
          '</select>',
      ) +
      field(
        'ts-kind',
        s.kind,
        '<select id="ts-kind" name="shape">' +
          Object.entries(s.kinds)
            .map(([v, t]) => opt(v, t, o.shape))
            .join('') +
          '</select>',
      ) +
      checks(
        'senses',
        s.senses,
        ['verb', 'adjective', 'negative', 'ascended'],
        o.senses,
        slotName,
      ) +
      field(
        'ts-themes',
        s.themes,
        '<select id="ts-themes" name="themes" multiple size="6">' +
          themes
            .map(
              (t) =>
                '<option' + (o.themes.includes(t) ? ' selected' : '') + '>' + esc(t) + '</option>',
            )
            .join('') +
          '</select>',
        s.themesNote,
      ) +
      checks('since', s.since, editions, o.since, (v) => v, s.sinceNote) +
      field(
        'ts-seed',
        s.seed,
        '<input id="ts-seed" name="seed" class="lsearch" autocomplete="off" value="' +
          esc(d ? d.seed : '') +
          '">',
        s.seedNote,
      ) +
      '<p><button class="btn btn-primary" type="submit">' +
      esc(s.draw) +
      '</button></p></form></details>'
    );
  }

  const head = (i) => i.kind === 'root' || i.kind === 'compound';

  /* ------------------------------------------------------ the study card */

  /**
   * One study card. In a draw, with its place and its way on; with `single`,
   * the card of one word on its own (the Observatory opens these), with Back.
   */
  function studyView(state, single) {
    const s = S();
    const h = H();
    const A = h.A;
    const d = single ? { ids: [single] } : state.draw;
    const index = single ? 0 : Math.min(state.index, d.ids.length - 1);
    const id = d.ids[index];
    if (!single && !state.studied.includes(id)) {
      store({ ...state, studied: [...state.studied, id] });
      state = load();
    }
    const p = h.profile();
    const met = Object.values(p.cards).some((c) => c.target === id);
    const w = A.forms.getForms(id, {
      examples: 2,
      ...(met && A.P.previous ? { previous: A.P.previous } : {}),
    });
    if (!w) return single ? '<p class="hs-note">' + esc(s.gone) + '</p>' : previewView(state);
    const hs = A.L.hallOf(p).settings;
    const glossOpen = ui.gloss === null ? hs.gloss === 'always' : ui.gloss;
    const r = w.root;

    const tags = [
      s.kindNames[r.kind] || r.kind,
      r.theme,
      r.register,
      s.sinceTag(r.version),
      r.status,
    ]
      .filter(Boolean)
      .map((t) => '<span class="pill">' + esc(t) + '</span>')
      .join(' ');

    const changed =
      (r.spellingWas ? '<p class="ts-changed">' + esc(s.spellingWas(r.spellingWas)) + '</p>' : '') +
      '';

    const audio = A.audio && A.audio.has(id);

    const rows = w.forms
      .map((f) => {
        const parts = ui.rule
          ? f.parts
              .map((m) =>
                m.role === 'marker'
                  ? '<span class="ts-marker">' + esc(m.text) + '</span>'
                  : esc(m.text),
              )
              .join('<span class="ts-boundary" aria-hidden="true">·</span>')
          : esc(f.form);
        const why = f.irregular
          ? '<details class="ts-why"><summary><span class="ts-irr" aria-hidden="true">✦</span> ' +
            esc(s.irregular) +
            '</summary><p>' +
            (f.irregularReason === 'unexplained'
              ? esc(s.unexplained)
              : esc(s.ruleWouldMake(f.pattern, f.regularWouldBe, f.form))) +
            '</p>' +
            (f.irregularNote
              ? '<p class="ts-author"><strong>' +
                esc(s.authorNote) +
                ':</strong> ' +
                h.md(f.irregularNote) +
                '</p>'
              : '') +
            '</details>'
          : '';
        const ruleNotes = ui.rule
          ? '<div class="ts-rulenote"><code>' +
            esc(f.pattern) +
            '</code>' +
            (f.verbClass
              ? ' · ' + esc(s.verbClassNote(s.verbClasses[f.verbClass] || f.verbClass))
              : '') +
            (f.classFromModifier
              ? '<p>' +
                esc(
                  s.fromModifier(
                    s.verbClasses[f.classFromModifier.headClass] || f.classFromModifier.headClass,
                  ),
                ) +
                '</p>'
              : '') +
            '</div>'
          : '';
        return (
          '<tr class="' +
          (f.irregular ? 'irregular' : '') +
          '"><th scope="row"><button type="button" class="linkish" data-ref="concept:' +
          esc(f.ruleId) +
          '">' +
          esc(U.S.slotNames[f.category] || f.category) +
          '</button></th><td class="ts-form">' +
          '<span class="lw" lang="x-liraasa">' +
          parts +
          '</span>' +
          (f.irregular ? '<span class="sr-only"> ' + esc(s.irregularSr) + '</span>' : '') +
          why +
          ruleNotes +
          '</td><td class="en">' +
          esc(f.gloss) +
          (f.glossWas ? '<p class="ts-changed">' + esc(s.glossWas(f.glossWas)) + '</p>' : '') +
          '</td></tr>'
        );
      })
      .join('');

    const peek = (ref) => {
      const it = A.data.items.get(ref.id);
      return (
        '<details class="ts-peek"><summary>' +
        lira(ref.spelling) +
        ' <span class="en">' +
        esc(ref.meaning) +
        '</span></summary>' +
        (it && it.components
          ? '<p class="en">' +
            it.components
              .map((c) => {
                const ci = A.data.items.get(c);
                return ci ? lira(ci.spelling) + ' ' + esc(ci.meaning) : '';
              })
              .join(' + ') +
            '</p>'
          : '') +
        '<button type="button" class="linkish" data-ref="item:' +
        esc(ref.id) +
        '">' +
        esc(s.openCard) +
        '</button></details>'
      );
    };

    const parts = r.parts
      ? '<section aria-labelledby="tsParts"><h3 id="tsParts">' +
        esc(s.parts) +
        '</h3><div class="ts-peeks">' +
        r.parts.map(peek).join('') +
        '</div></section>'
      : '';
    const shown = w.compounds.slice(0, 12);
    const compounds = w.compounds.length
      ? '<section aria-labelledby="tsComp"><h3 id="tsComp">' +
        esc(s.compounds) +
        '</h3><div class="ts-peeks">' +
        shown.map(peek).join('') +
        '</div>' +
        (w.compounds.length > shown.length
          ? '<p class="hs-note">' + esc(s.moreCompounds(w.compounds.length - shown.length)) + '</p>'
          : '') +
        '</section>'
      : '';
    const derivations = w.derivations.length
      ? '<section aria-labelledby="tsDer"><h3 id="tsDer">' +
        esc(s.derivations) +
        '</h3><p class="hs-note">' +
        esc(s.derivationNote) +
        '</p><ul class="ts-derivs">' +
        w.derivations
          .map(
            (dv) =>
              '<li>' +
              lira(dv.spelling) +
              ' <span class="en">' +
              esc(dv.gloss) +
              '</span> <button type="button" class="linkish" data-ref="concept:' +
              esc(dv.ruleId) +
              '">' +
              lira('-' + dv.suffix) +
              '</button></li>',
          )
          .join('') +
        '</ul></section>'
      : '';

    const sentences = w.examples.length
      ? w.examples
          .map(
            (e) =>
              '<div class="lcard ts-ex">' +
              (glossOpen
                ? U.interlinear(e.gloss)
                : '<p class="ts-line">' + lira(e.liraasa) + '</p>') +
              (e.english ? '<p class="en">' + esc(e.english) + '</p>' : '') +
              (e.source === 'corpus' ? '<p class="src">' + esc(s.fromSong) + '</p>' : '') +
              '</div>',
          )
          .join('') +
        (hs.gloss === 'hidden' && !glossOpen
          ? ''
          : '<button type="button" class="linkish" data-star-gloss aria-pressed="' +
            String(glossOpen) +
            '" aria-keyshortcuts="G">' +
            esc(glossOpen ? s.hideGloss : s.showGloss) +
            '</button>')
      : '<p class="hs-note">' + esc(s.noSentence) + '</p>';

    const dots = d.ids
      .map((did, i) => {
        const it = A.data.items.get(did);
        const studied = state.studied.includes(did);
        return (
          '<button type="button" class="ts-dotnav' +
          (studied ? ' studied' : '') +
          '" data-star-go="' +
          i +
          '"' +
          (i === index ? ' aria-current="step"' : '') +
          ' aria-label="' +
          esc(s.dotLabel(i + 1, it ? it.spelling : did, studied)) +
          '"></button>'
        );
      })
      .join('');

    const last = index === d.ids.length - 1;
    return (
      '<section class="hall ts ts-study"><header class="ts-bar">' +
      (single
        ? '<button type="button" class="linkish" data-back="1" aria-keyshortcuts="Escape">← ' +
          esc(s.back) +
          '</button>'
        : '<button type="button" class="linkish" data-star-sky aria-keyshortcuts="Escape">← ' +
          esc(s.backToSky) +
          '</button><span class="hs-note">' +
          esc(s.cardOf(index + 1, d.ids.length)) +
          '</span>') +
      '</header>' +
      notice() +
      '<article class="ts-card" aria-labelledby="tsWord">' +
      '<header class="ts-head"><h2 tabindex="-1" id="tsWord">' +
      lira(r.spelling, 'ts-word') +
      '</h2>' +
      (audio
        ? '<button type="button" class="btn ts-listen" data-star-listen="' +
          esc(id) +
          '" aria-keyshortcuts="A">' +
          esc(s.listen) +
          '</button>'
        : '') +
      '<p class="ts-meaning">' +
      esc(r.sense) +
      '</p>' +
      (r.altMeanings.length
        ? '<p class="ts-alt"><span>' +
          esc(s.alsoMeans) +
          ':</span> ' +
          r.altMeanings.map(esc).join('; ') +
          '</p>'
        : '') +
      '<p class="ts-tags">' +
      tags +
      '</p>' +
      changed +
      '</header>' +
      '<section aria-labelledby="tsForms"><div class="ts-formhead"><h3 id="tsForms">' +
      esc(s.forms) +
      '</h3><button type="button" class="linkish" data-star-rule aria-pressed="' +
      String(ui.rule) +
      '" aria-keyshortcuts="R">' +
      esc(ui.rule ? s.hideRule : s.showRule) +
      '</button></div>' +
      '<table class="ts-forms"><caption class="sr-only">' +
      esc(s.formsCaption) +
      '</caption><thead><tr><th scope="col">' +
      esc(s.colLabel) +
      '</th><th scope="col">' +
      esc(s.colForm) +
      '</th><th scope="col">' +
      esc(s.colSense) +
      '</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      (w.unused.length ? '<p class="hs-note">' + esc(s.unused(w.unused.length)) + '</p>' : '') +
      '</section>' +
      parts +
      compounds +
      derivations +
      '<section aria-labelledby="tsEx"><h3 id="tsEx">' +
      esc(s.inSentence) +
      '</h3>' +
      sentences +
      '</section>' +
      '<section aria-labelledby="tsLinks"><h3 id="tsLinks">' +
      esc(s.links) +
      '</h3><div class="lrow">' +
      '<button type="button" class="btn" data-open-lex="' +
      esc(r.spelling) +
      '">' +
      esc(s.openLexicon) +
      '</button><button type="button" class="btn" data-star-roots="' +
      esc(id) +
      '">' +
      esc(s.openRoots) +
      '</button><button type="button" class="btn" data-ref="concept:' +
      esc(
        r.kind === 'compound' || r.kind === 'imageCompound'
          ? 'compound'
          : (w.forms[0] && w.forms[0].ruleId) || 'form:root',
      ) +
      '">' +
      esc(s.seeGrammar) +
      '</button></div></section>' +
      '</article>' +
      (single ? '</section>' : '') +
      (single
        ? ''
        : '<nav class="ts-nav" aria-label="' +
          esc(s.dots) +
          '"><button type="button" class="btn" data-star-prev' +
          (index === 0 ? ' disabled' : '') +
          ' aria-keyshortcuts="ArrowLeft">← ' +
          esc(s.prev) +
          '</button><div class="ts-dots">' +
          dots +
          '</div><button type="button" class="btn btn-primary" data-star-next aria-keyshortcuts="ArrowRight">' +
          esc(last ? s.finish : s.next) +
          ' →</button></nav>' +
          '<p class="ts-known"><button type="button" class="linkish" data-star-known="' +
          esc(id) +
          '">' +
          esc(s.known) +
          '</button></p>' +
          '</section>')
    );
  }

  /* --------------------------------------------------------- the end */

  function doneView() {
    const s = S();
    const n = ui.done.ids.length;
    return (
      '<section class="hall ts ts-done"><header class="hall-head"><p class="kicker">' +
      esc(U.S.stars) +
      '</p><h2 tabindex="-1">' +
      esc(n === 10 ? s.doneTitle : s.doneTitleN(n)) +
      '</h2><p class="hall-greeting">' +
      esc(s.doneLede) +
      '</p></header><ul class="ts-sky ts-sky-done" role="list">' +
      ui.done.ids
        .map((id) => {
          const it = H().A.data.items.get(id);
          return it
            ? '<li class="ts-star" style="' +
                jitter(id) +
                '"><span class="ts-point"><span class="ts-dot" aria-hidden="true"></span>' +
                lira(it.spelling) +
                '<span class="ts-gloss">' +
                esc(it.meaning) +
                '</span></span></li>'
            : '';
        })
        .join('') +
      '</ul>' +
      notice() +
      practiceForm(ui.done.ids) +
      '<div class="ts-go"><button type="button" class="btn" data-star-again>' +
      esc(s.drawAgain) +
      '</button><button type="button" class="btn" data-go="hall">' +
      esc(s.backToHall) +
      '</button></div></section>'
    );
  }

  /** Which kinds of practice, and how long: all kinds together is a mixed drill. */
  function practiceForm(ids) {
    const s = S();
    const h = H();
    const hs = L().hallOf(h.profile()).settings;
    const audio = ids.some((id) => h.A.audio && h.A.audio.has(id));
    const chosen = ui.modes || L().DRILL_MODES;
    return (
      '<form id="starsPractice" class="lcard"><fieldset class="ts-modes"><legend>' +
      esc(s.practiceLegend) +
      '</legend>' +
      L()
        .DRILL_MODES.map((m) => {
          const off = m === 'listen' && !audio;
          const [name, line] = s.modes[m];
          return (
            '<label' +
            (off ? ' class="off"' : '') +
            '><input type="checkbox" name="mode" value="' +
            m +
            '"' +
            (chosen.includes(m) && !off ? ' checked' : '') +
            (off ? ' disabled' : '') +
            '><span>' +
            esc(name) +
            '</span><span>' +
            esc(off ? s.noAudio : line) +
            '</span></label>'
          );
        })
        .join('') +
      '</fieldset><p class="hs-note">' +
      esc(s.practiceNote) +
      '</p><div class="lrow"><label for="ts-length">' +
      esc(s.prompts) +
      '</label><select id="ts-length" name="length">' +
      L()
        .HALL_SETTING_VALUES.drill.map(
          (n) => '<option' + (n === hs.drill ? ' selected' : '') + '>' + n + '</option>',
        )
        .join('') +
      '</select><button class="btn btn-primary" type="submit">' +
      esc(s.beginPractice) +
      '</button></div></form>'
    );
  }

  /* ------------------------------------------------------- the drill */

  function startDrill(ids, modes, length, title) {
    const h = H();
    const A = h.A;
    const s = S();
    const hs = L().hallOf(h.profile()).settings;
    const rng = L().createRng('stars:' + ids.join(',') + ':' + h.now());
    const exercises = L().starsDrill({ exercise: A.ctx, forms: A.forms }, ids, rng, {
      length,
      modes,
    });
    if (exercises.length === 0) {
      ui.note = s.nothing;
      h.render();
      return;
    }
    ui.modes = modes;
    h.startSession(title, exercises, {
      back: 'stars',
      requeue: true,
      grade: (ex, r, ms) => L().gradeStars(A.gctx, A.forms, ex, r, ms, hs.leniency),
      verdictText: (v, n) =>
        v === 'correct' ? U.S.right[n % U.S.right.length] : s.verdicts[v] || v,
      diagnosisText: (d) =>
        d.kind === 'rule-for-irregular'
          ? s.nearMiss(d.expected)
          : d.kind === 'vowel-length'
            ? s.forgiven(d.expected)
            : d.message,
      onFinish: (results) => {
        ui.reflect = { ids, words: L().drillResults(ids, results) };
        ui.done = null;
        h.go('stars');
      },
    });
  }

  /* ---------------------------------------------------------- reflect */

  const shakyOf = (words) => words.filter((w) => w.asked > 0 && w.score < 0.85);

  function reflectView() {
    const s = S();
    const A = H().A;
    const words = ui.reflect.words;
    const how = (w) =>
      w.asked === 0 ? 'unasked' : w.score >= 0.85 ? 'bright' : w.score >= 0.5 ? 'steady' : 'faint';
    const shaky = shakyOf(words);
    return (
      '<section class="hall ts ts-reflect"><header class="hall-head"><p class="kicker">' +
      esc(U.S.stars) +
      '</p><h2 tabindex="-1">' +
      esc(s.reflectTitle(words.length)) +
      '</h2><p class="hall-greeting">' +
      esc(s.reflectLede) +
      '</p></header><ul class="ts-sky" role="list">' +
      words
        .map((w) => {
          const it = A.data.items.get(w.id);
          if (!it) return '';
          const h = how(w);
          return (
            '<li class="ts-star glow-' +
            h +
            '" style="' +
            jitter(w.id) +
            '"><span class="ts-point" role="img" aria-label="' +
            esc(s.howSr(it.spelling, s.how[h], w.right, w.asked)) +
            '"><span class="ts-dot" aria-hidden="true"></span>' +
            '<span class="ts-label" aria-hidden="true">' +
            lira(it.spelling) +
            '<span class="ts-gloss">' +
            esc(it.meaning) +
            '</span><span class="ts-how">' +
            esc(s.how[h]) +
            '</span></span></span></li>'
          );
        })
        .join('') +
      '</ul><div class="ts-go">' +
      (shaky.length > 0
        ? '<button type="button" class="btn btn-primary" data-star-shaky>' +
          esc(s.drillShaky) +
          '</button>'
        : '<p class="hs-note">' + esc(s.noneShaky) + '</p>') +
      '<button type="button" class="btn' +
      (shaky.length > 0 ? '' : ' btn-primary') +
      '" data-star-again>' +
      esc(s.drawAgain) +
      '</button><button type="button" class="btn" data-go="hall">' +
      esc(s.backToHall) +
      '</button></div></section>'
    );
  }

  /* ----------------------------------------------------------- actions */

  function go(index) {
    const state = load();
    if (!state.draw) return;
    const i = Math.max(0, Math.min(index, state.draw.ids.length - 1));
    store({ ...state, phase: 'study', index: i });
    ui.gloss = null;
    H().render();
  }

  function finish() {
    const h = H();
    const state = load();
    const ids = state.draw ? [...state.draw.ids] : [];
    L().introduceStudied(h.profile(), h.A.data, h.A.graph, ids, h.now());
    h.refreshKnown();
    ui.done = { ids };
    store({ ...state, draw: null, phase: 'preview', index: 0, studied: [] });
    h.announce(S().doneTitleN(ids.length));
    h.render();
  }

  function onClick(b) {
    const h = H();
    if (!h || (h.A.view.name !== 'stars' && h.A.view.name !== 'word')) return false;
    const d = b.dataset;
    const state = () => load();
    if (d.starSelect) {
      ui.selected = ui.selected === d.starSelect ? null : d.starSelect;
      h.render();
      focus('[data-star-select="' + cssEsc(d.starSelect) + '"]');
      return true;
    }
    if (d.starReroll) {
      const st = state();
      const next = L().rerollOne(ctx(), st.draw, d.starReroll);
      const replaced = next.ids.find((id) => !st.draw.ids.includes(id));
      store({ ...st, draw: next, studied: [] });
      ui.selected = replaced || ui.selected;
      h.render();
      if (replaced) focus('[data-star-select="' + cssEsc(replaced) + '"]');
      return true;
    }
    if (d.starPin) {
      const st = state();
      store({ ...st, draw: L().togglePin(st.draw, d.starPin) });
      h.render();
      focus('[data-star-pin="' + cssEsc(d.starPin) + '"]');
      return true;
    }
    if (d.starAll !== undefined) {
      const st = state();
      store({ ...st, draw: L().rerollAll(ctx(), st.draw), studied: [], index: 0 });
      ui.selected = null;
      h.render();
      return true;
    }
    if (d.starBegin !== undefined) {
      go(0);
      return true;
    }
    if (d.starResume !== undefined) {
      go(state().index);
      return true;
    }
    if (d.starSky !== undefined) {
      store({ ...state(), phase: 'preview' });
      h.render();
      return true;
    }
    if (d.starGo !== undefined) {
      go(Number(d.starGo));
      return true;
    }
    if (d.starPrev !== undefined) {
      go(state().index - 1);
      return true;
    }
    if (d.starNext !== undefined) {
      const st = state();
      if (st.index >= st.draw.ids.length - 1) finish();
      else go(st.index + 1);
      return true;
    }
    if (d.starRule !== undefined) {
      ui.rule = !ui.rule;
      h.render();
      focus('[data-star-rule]');
      return true;
    }
    if (d.starGloss !== undefined) {
      const hs = L().hallOf(h.profile()).settings;
      ui.gloss = !(ui.gloss === null ? hs.gloss === 'always' : ui.gloss);
      h.render();
      focus('[data-star-gloss]');
      return true;
    }
    if (d.starListen) {
      h.play(d.starListen);
      return true;
    }
    if (d.starKnown) {
      L().markKnown(h.profile(), h.A.data, h.A.graph, d.starKnown, h.now());
      h.refreshKnown();
      h.save();
      h.announce(S().knownDone);
      ui.note = S().knownDone;
      const st = state();
      if (st.index >= st.draw.ids.length - 1) finish();
      else go(st.index + 1);
      return true;
    }
    if (d.starRoots) {
      U.openAuthorRoots(d.starRoots);
      h.go('author');
      return true;
    }
    if (d.starShaky !== undefined && ui.reflect) {
      const shaky = shakyOf(ui.reflect.words).map((w) => w.id);
      const hs = L().hallOf(h.profile()).settings;
      ui.reflect = null;
      ui.done = { ids: shaky };
      startDrill(
        shaky,
        ui.modes || L().DRILL_MODES,
        Math.min(hs.drill, shaky.length * 3),
        S().shakyTitle,
      );
      return true;
    }
    if (d.starAgain !== undefined) {
      ui.done = null;
      ui.reflect = null;
      draw(load().options);
      h.render();
      return true;
    }
    return false;
  }

  function onSubmit(f) {
    if (f.id === 'starsPractice') {
      const fd = new FormData(f);
      const modes = fd.getAll('mode');
      if (modes.length === 0) {
        ui.note = S().noModes;
        H().render();
        return true;
      }
      startDrill(ui.done ? ui.done.ids : [], modes, Number(fd.get('length')), S().sessionTitle);
      return true;
    }
    if (f.id !== 'starsDraw') return false;
    const fd = new FormData(f);
    const options = L().readDrawOptions({
      count: Number(fd.get('count')),
      only: fd.get('only'),
      weighting: fd.get('weighting'),
      shape: fd.get('shape'),
      senses: fd.getAll('senses'),
      themes: fd.getAll('themes'),
      since: fd.getAll('since'),
    });
    const seed = String(fd.get('seed') || '').trim();
    const prev = load().draw;
    // a new draw unless the learner kept the seed of the draw on screen with the same choices
    const same =
      prev && seed === prev.seed && JSON.stringify(prev.options) === JSON.stringify(options);
    ui.shapeOpen = true;
    draw(options, same ? newSeed() : seed || newSeed());
    H().render();
    return true;
  }

  function onKey(e) {
    const state = load();
    if (!state.draw || state.phase !== 'study' || ui.done) return false;
    const k = e.key;
    if (k === 'ArrowLeft') return clickIt('[data-star-prev]');
    if (k === 'ArrowRight') return clickIt('[data-star-next]');
    if (k === 'r' || k === 'R') return clickIt('[data-star-rule]');
    if (k === 'g' || k === 'G') return clickIt('[data-star-gloss]');
    if (k === 'a' || k === 'A') return clickIt('[data-star-listen]');
    if (k === 'Escape') return clickIt('[data-star-sky]');
    return false;
  }

  /* ----------------------------------------------------------- helpers */

  const cssEsc = (s) => (root.CSS && root.CSS.escape ? root.CSS.escape(s) : s);

  function focus(sel) {
    const el = H().A.main.querySelector(sel);
    if (el) el.focus();
  }

  function clickIt(sel) {
    const el = H().A.main.querySelector(sel);
    if (!el || el.disabled) return false;
    el.click();
    return true;
  }

  /* swipe between cards on a touch screen */
  let touch = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      if (!e.target.closest || !e.target.closest('.ts-card')) return;
      const t = e.changedTouches[0];
      touch = { x: t.clientX, y: t.clientY };
    },
    { passive: true },
  );
  document.addEventListener(
    'touchend',
    (e) => {
      if (!touch) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      clickIt(dx < 0 ? '[data-star-next]' : '[data-star-prev]');
    },
    { passive: true },
  );

  U.hall.views.stars = view;
  /** Keys on a single word's card: the rule, the gloss, the recording, and back. */
  function onWordKey(e) {
    const k = e.key;
    if (k === 'r' || k === 'R') return clickIt('[data-star-rule]');
    if (k === 'g' || k === 'G') return clickIt('[data-star-gloss]');
    if (k === 'a' || k === 'A') return clickIt('[data-star-listen]');
    if (k === 'Escape') return clickIt('[data-back]');
    return false;
  }

  U.hall.views.word = (args) => studyView(load(), (args && args.id) || '');
  U.hall.wings.push({ view: 'stars', onClick, onSubmit, onKey });
  U.hall.wings.push({ view: 'word', onClick, onKey: onWordKey });
})(typeof window !== 'undefined' ? window : globalThis);
