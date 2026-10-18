/* The Loom: the grammar wing of the Training Hall (Hall Phase 5).
 *
 *   map       every rule as a knot on its thread: forms, the clause and its
 *             slots, the noun phrase, the rulings by edition. Foundations sit
 *             first; nothing is locked; each knot says its state in words.
 *   lesson    one rule: See it (the card) · Watch it (the example builds) ·
 *             Try it (a checked session) · Use it (your own sentence, read by
 *             the checker)
 *
 * The core builds and grades everything (loom.ts) against the live grammar
 * checker (LiraasaChecker.default). Without the checker The Loom says so and
 * offers no exercises: it never shows what it cannot check.
 *
 * No Liraasa here: every word comes from the data. English from strings.js.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S.loomS;
  const H = () => U.hallApi;
  const L = () => H().A.L;
  const esc = (s) => U.esc(s);
  const lira = (s) => '<span class="lw" lang="x-liraasa">' + esc(s) + '</span>';

  const STEPS = ['see', 'watch', 'try', 'use'];
  /* per screen, never saved */
  const ui = {
    types: null,
    focus: 'open',
    last: null,
    useResult: null,
    note: null,
    shapeOpen: false,
  };

  /* -------------------------------------------------------- the engine */

  /** The Loom's context: the live checker, or null when it did not load. */
  function lctx() {
    const A = H().A;
    const ck = root.LiraasaChecker && root.LiraasaChecker.default;
    if (!ck) return null;
    if (!A.loomCtx || A.loomCtx.exercise !== A.ctx) {
      A.loomCtx = {
        exercise: A.ctx,
        link: A.src.context,
        check: (line) => ck.checkLine(line, 1, undefined, { register: 'poetic' }),
      };
      A.loomMap = null;
    }
    return A.loomCtx;
  }

  function map() {
    const A = H().A;
    const c = lctx();
    if (!c) return [];
    if (!A.loomMap) A.loomMap = L().ruleMap(c, A.overrides);
    return A.loomMap;
  }

  const mastery = (id) => {
    const h = H();
    return h.A.graph.nodes.has('concept:' + id)
      ? L().nodeMastery(h.profile(), h.A.graph, 'concept:' + id, h.now())
      : 0;
  };
  const practised = (id) =>
    Object.values(H().profile().cards).some((c) => c.target === id && c.state.reps > 0);

  function stateOf(entry) {
    const t = H().profile().settings.threshold;
    if (entry.sentences === 0) return 'quiet';
    const m = mastery(entry.id);
    if (m >= t) return 'woven';
    if (practised(entry.id)) return 'practised';
    return entry.prereqs.every((p) => mastery(p) >= t) ? 'open' : 'waiting';
  }

  /* --------------------------------------------------------------- map */

  function mapView() {
    const s = S();
    const entries = map();
    const groups = [
      ['forms', s.groups.forms],
      ['clause', s.groups.clause],
      ['phrase', s.groups.phrase],
    ];
    const editions = [
      ...new Set(entries.filter((e) => e.group === 'rulings').map((e) => e.version)),
    ]
      .sort()
      .reverse();
    const knot = (e) => {
      const st = stateOf(e);
      const m = mastery(e.id);
      const pct = m > 0 ? Math.round(m * 100) + '%' : '';
      return (
        '<li><button type="button" class="knot knot-' +
        st +
        '" data-loom-rule="' +
        esc(e.id) +
        '" aria-label="' +
        esc(s.stateSr(e.title, s.states[st], pct)) +
        '" style="--m:' +
        m.toFixed(2) +
        '"><span class="knot-dot" aria-hidden="true"></span><span class="knot-title">' +
        esc(e.title) +
        '</span><span class="knot-state" aria-hidden="true">' +
        esc(s.states[st]) +
        '</span></button></li>'
      );
    };
    const thread = (list) => {
      const depths = [...new Set(list.map((e) => e.depth))].sort((a, b) => a - b);
      return depths
        .map(
          (d) =>
            '<ul class="thread" role="list">' +
            list
              .filter((e) => e.depth === d)
              .map(knot)
              .join('') +
            '</ul>',
        )
        .join('');
    };
    const section = (key, title, list) =>
      list.length === 0
        ? ''
        : '<section class="loom-group" aria-labelledby="lg-' +
          key +
          '"><h3 id="lg-' +
          key +
          '">' +
          esc(title) +
          '</h3>' +
          thread(list) +
          '</section>';
    return (
      '<section class="hall loom"><header class="hall-head"><p class="kicker">' +
      esc(U.S.loom) +
      '</p><h2 tabindex="-1">' +
      esc(U.S.wings.loom.title) +
      '</h2><p class="hall-greeting">' +
      esc(s.lede) +
      '</p></header>' +
      (lctx() ? '' : '<p class="lcard ts-note" role="status">' + esc(s.noChecker) + '</p>') +
      notice() +
      sessionPanel() +
      '<p class="hs-note">' +
      esc(s.mapNote) +
      '</p>' +
      groups
        .map(([k, t]) =>
          section(
            k,
            t,
            entries.filter((e) => e.group === k),
          ),
        )
        .join('') +
      editions
        .map((v) =>
          section(
            'r' + v.replace('.', '-'),
            s.groups.rulings(v),
            entries.filter((e) => e.group === 'rulings' && e.version === v),
          ),
        )
        .join('') +
      '</section>'
    );
  }

  function notice() {
    if (!ui.note) return '';
    const n = ui.note;
    ui.note = null;
    return '<p class="lcard ts-note" role="status">' + esc(n) + '</p>';
  }

  function typeChecks() {
    const s = S();
    const chosen = ui.types || L().LOOM_TYPES;
    return (
      '<fieldset class="ts-modes"><legend>' +
      esc(s.types) +
      '</legend>' +
      L()
        .LOOM_TYPES.map((t) => {
          const [name, line] = s.typeNames[t];
          return (
            '<label><input type="checkbox" name="type" value="' +
            t +
            '"' +
            (chosen.includes(t) ? ' checked' : '') +
            '><span>' +
            esc(name) +
            '</span><span>' +
            esc(line) +
            '</span></label>'
          );
        })
        .join('') +
      '</fieldset>'
    );
  }

  function lengthSelect(id) {
    const hs = L().hallOf(H().profile()).settings;
    const t = U.S.set.loomLengths;
    return (
      '<label for="' +
      id +
      '">' +
      esc(S().length) +
      '</label><select id="' +
      id +
      '" name="length">' +
      Object.keys(L().LOOM_LENGTHS)
        .map(
          (k) =>
            '<option value="' +
            k +
            '"' +
            (k === hs.loom ? ' selected' : '') +
            '>' +
            esc(t[k]) +
            '</option>',
        )
        .join('') +
      '</select>'
    );
  }

  function sessionPanel() {
    const s = S();
    return (
      '<details class="lcard ts-shape"' +
      (ui.shapeOpen ? ' open' : '') +
      '><summary>' +
      esc(s.sessionShape) +
      '</summary><form id="loomSession"><div class="hs-field"><label for="lm-focus">' +
      esc(s.focus) +
      '</label><select id="lm-focus" name="focus">' +
      Object.entries(s.focuses)
        .map(
          ([k, v]) =>
            '<option value="' +
            k +
            '"' +
            (k === ui.focus ? ' selected' : '') +
            '>' +
            esc(v) +
            '</option>',
        )
        .join('') +
      '</select></div><div class="hs-field">' +
      lengthSelect('lm-length') +
      '</div>' +
      typeChecks() +
      '<p><button class="btn btn-primary" type="submit"' +
      (lctx() ? '' : ' disabled') +
      '>' +
      esc(s.begin) +
      '</button></p></form></details>' +
      '<p class="ts-go"><button type="button" class="btn btn-primary" data-loom-quick' +
      (lctx() ? '' : ' disabled') +
      '>' +
      esc(s.session) +
      '</button><button type="button" class="btn" data-go="sandbox">' +
      esc(U.S.sb.open) +
      '</button></p>'
    );
  }

  /* ------------------------------------------------------------ lesson */

  function lessonView(id, step) {
    const s = S();
    const h = H();
    const c = lctx();
    const card = c ? L().ruleCard(c, id, h.A.overrides) : null;
    const concept = h.A.data.concepts.get(id);
    if (!concept) return mapView();
    const st = STEPS.includes(step) ? step : 'see';
    const tabs = STEPS.map(
      (k, i) =>
        '<li><button type="button" data-loom-step="' +
        k +
        '"' +
        (k === st ? ' aria-current="step"' : '') +
        '><span class="step-n" aria-hidden="true">' +
        (i + 1) +
        '</span> ' +
        esc(s.steps[k]) +
        '</button></li>',
    ).join('');
    const body =
      st === 'see'
        ? seeIt(card, concept)
        : st === 'watch'
          ? watchIt(card, concept)
          : st === 'try'
            ? tryIt(card, concept)
            : useIt(card, concept);
    return (
      '<section class="hall loom loom-lesson"><header class="ts-bar"><button type="button" class="linkish" data-loom-map>← ' +
      esc(s.backToMap) +
      '</button><span class="pill">' +
      esc(s.version(card ? card.version : h.A.data.edition)) +
      '</span></header><h2 tabindex="-1">' +
      esc(concept.title) +
      '</h2><nav aria-label="' +
      esc(concept.title) +
      '"><ol class="loom-steps">' +
      tabs +
      '</ol></nav>' +
      notice() +
      '<div class="loom-body">' +
      body +
      '</div></section>'
    );
  }

  function examplesHtml(card) {
    const s = S();
    if (!card || card.examples.length === 0)
      return '<p class="hs-note">' + esc(s.noExamples) + '</p>';
    return card.examples
      .map(
        (e) =>
          '<div class="lcard">' +
          U.interlinear(e.gloss) +
          (e.english ? '<p class="en">' + esc(e.english) + '</p>' : '') +
          '</div>',
      )
      .join('');
  }

  function seeIt(card, concept) {
    const s = S();
    const h = H();
    const ref = (r) =>
      '<button type="button" class="linkish" data-loom-rule="' +
      esc(r.id) +
      '">' +
      esc(r.title) +
      '</button>';
    const explanation = card ? card.explanation : concept.description;
    return (
      (card && card.pattern
        ? '<p class="loom-pattern"><span class="hs-note">' +
          esc(s.pattern) +
          '</span> <code>' +
          esc(card.pattern) +
          '</code></p>'
        : '') +
      (explanation ? '<p class="loom-explain">' + esc(explanation) + '</p>' : '') +
      (card && card.note && card.note.explanation
        ? '<p class="ts-author"><strong>' +
          esc(s.authorNote) +
          ':</strong> ' +
          h.md(card.note.explanation) +
          '</p>'
        : '') +
      (card && card.words.length
        ? '<h3>' +
          esc(s.words) +
          '</h3><ul class="loom-words">' +
          card.words
            .map(
              (w) =>
                '<li><button type="button" class="linkish" data-ref="item:' +
                esc(w.id) +
                '">' +
                lira(w.spelling) +
                '</button> <span class="en">' +
                esc(w.meaning) +
                '</span></li>',
            )
            .join('') +
          '</ul>'
        : '') +
      '<h3>' +
      esc(s.examples) +
      '</h3>' +
      examplesHtml(card) +
      (card && card.prereqs.length
        ? '<p class="loom-links"><span>' +
          esc(s.buildsOn) +
          ':</span> ' +
          card.prereqs.map(ref).join(', ') +
          '</p>'
        : '') +
      (card && card.leadsTo.length
        ? '<p class="loom-links"><span>' +
          esc(s.leadsTo) +
          ':</span> ' +
          card.leadsTo.slice(0, 12).map(ref).join(', ') +
          '</p>'
        : '') +
      nextStep('watch')
    );
  }

  /** The first example, built word by word; a form rule also shows root + marker. */
  function watchIt(card, concept) {
    const s = S();
    const A = H().A;
    const e = card && card.examples[0];
    if (!e) return '<p class="hs-note">' + esc(s.noWatch) + '</p>' + nextStep('try');
    let formBuild = '';
    if (concept.kind === 'form' && concept.formSlot) {
      // the word in the example that takes this form, from its linked tokens
      const ex = A.data.examples.find((x) => x.key === e.key);
      let wordId = null;
      for (const t of ex ? ex.tokens : []) {
        if (t.link.kind !== 'entry') continue;
        const r = t.link.refs.find((x) => x.slot === concept.formSlot);
        if (r) {
          wordId = r.id;
          break;
        }
      }
      const w = wordId ? A.forms.getForms(wordId, { includeUnused: true, examples: 0 }) : null;
      const f = w && w.forms.find((x) => x.category === concept.formSlot);
      if (f) {
        formBuild =
          '<div class="loom-morph" aria-label="' +
          esc(s.watchForm(f.form)) +
          '">' +
          f.parts
            .map(
              (m, i) =>
                '<span class="morph morph-' +
                m.role +
                '" style="--i:' +
                i +
                '" lang="x-liraasa">' +
                esc(m.text) +
                '</span>',
            )
            .join('<span class="morph-plus" aria-hidden="true">+</span>') +
          '<span class="morph-eq" aria-hidden="true">=</span><span class="morph morph-whole" style="--i:' +
          f.parts.length +
          '" lang="x-liraasa">' +
          esc(f.form) +
          '</span></div>';
      }
    }
    return (
      '<p class="hall-greeting">' +
      esc(s.watchLede) +
      '</p>' +
      formBuild +
      '<div class="lcard loom-build">' +
      '<div class="il">' +
      e.gloss
        .map(
          (t, i) =>
            '<span class="w build" style="--i:' +
            i +
            '"><span class="t" lang="x-liraasa">' +
            esc(t.text) +
            '</span><span class="g">' +
            esc(t.gloss) +
            (t.tags.length ? ' <span class="tag">' + esc(t.tags.join(' · ')) + '</span>' : '') +
            '</span></span>',
        )
        .join('') +
      '</div>' +
      (e.english
        ? '<p class="en build" style="--i:' + e.gloss.length + '">' + esc(e.english) + '</p>'
        : '') +
      '</div><p class="lrow"><button type="button" class="btn" data-loom-replay>' +
      esc(s.watchAgain) +
      '</button></p>' +
      nextStep('try')
    );
  }

  function tryIt(card, concept) {
    const s = S();
    const hs = L().hallOf(H().profile()).settings;
    const n = Math.min(10, Math.max(6, L().LOOM_LENGTHS[hs.loom]));
    const can = lctx() && card && card.examples.length > 0;
    return (
      (ui.last && ui.last.id === concept.id
        ? '<p class="lcard ts-note" role="status">' +
          esc(s.tryDone(ui.last.right, ui.last.n)) +
          '</p>'
        : '') +
      (can
        ? '<p class="hall-greeting">' +
          esc(s.tryLede(n)) +
          '</p><p class="lrow"><button type="button" class="btn btn-primary" data-loom-try="' +
          esc(concept.id) +
          '">' +
          esc(s.tryThis) +
          '</button>' +
          (concept.prereqs.length
            ? '<button type="button" class="btn" data-loom-trywith="' +
              esc(concept.id) +
              '">' +
              esc(s.tryWith) +
              '</button>'
            : '') +
          '</p>'
        : '<p class="hs-note">' + esc(lctx() ? s.noExamples : s.noChecker) + '</p>') +
      nextStep('use')
    );
  }

  function useIt(card, concept) {
    const s = S();
    const r = ui.useResult && ui.useResult.id === concept.id ? ui.useResult : null;
    return (
      '<p class="hall-greeting">' +
      esc(s.useLede) +
      '</p>' +
      (card && card.examples[0]
        ? '<p class="hs-note">' + lira(card.examples[0].liraasa) + '</p>'
        : '') +
      '<form id="loomUse" class="lcard"><label for="loomUseText">' +
      esc(s.useLabel) +
      '</label><textarea id="loomUseText" name="text" rows="2" lang="x-liraasa" class="lw loom-use">' +
      esc(r ? r.text : '') +
      '</textarea><p class="lrow"><button class="btn btn-primary" type="submit"' +
      (lctx() ? '' : ' disabled') +
      '>' +
      esc(s.check) +
      '</button><button type="button" class="btn" data-go="sandbox">' +
      esc(U.S.sb.openFromLesson) +
      '</button></p></form>' +
      (r
        ? '<div class="lcard" role="status">' +
          (r.problems.length === 0
            ? '<p><strong>' + esc(s.clean) + '</strong> ' + esc(s.cannotJudge) + '</p>'
            : '<p><strong>' +
              esc(s.problems) +
              '</strong></p><ul>' +
              r.problems.map((p) => '<li>' + esc(p.message) + '</li>').join('') +
              '</ul><p class="hs-note">' +
              esc(s.cannotJudge) +
              '</p>') +
          '</div>'
        : '')
    );
  }

  function nextStep(step) {
    return (
      '<p class="loom-next"><button type="button" class="btn" data-loom-step="' +
      step +
      '">' +
      esc(S().steps[step]) +
      ' →</button></p>'
    );
  }

  /* --------------------------------------------------------- sessions */

  function startLoom(rules, length, types, title, back, lessonId) {
    const h = H();
    const A = h.A;
    const s = S();
    const c = lctx();
    if (!c) return;
    const hs = L().hallOf(h.profile()).settings;
    const rng = L().createRng('loom:' + rules.join(',') + ':' + h.now());
    let exercises = L().loomSession(c, rules, rng, { length, types });
    if (exercises.length === 0) {
      ui.note = s.nothing;
      h.render();
      return;
    }
    // hints off, or the gloss line hidden: no word-by-word help before answering
    if (hs.hints === 'off' || hs.gloss === 'hidden')
      exercises = exercises.map((ex) => ({ ...ex, prompt: { ...ex.prompt, tokens: undefined } }));
    for (const r of rules) {
      const node = 'concept:' + r;
      if (A.graph.nodes.has(node)) L().introduce(h.profile(), A.data, A.graph, node, h.now());
    }
    h.startSession(title, exercises, {
      back,
      requeue: true,
      glossOpen: hs.gloss === 'always' || hs.hints === 'always',
      grade: (ex, r, ms) => L().gradeLoom(c, ex, r, ms),
      verdictText: (v, n) =>
        v === 'correct' ? U.S.right[n % U.S.right.length] : s.verdicts[v] || v,
      onFinish: (results) => {
        const right = results.filter((x) => x.grade.verdict === 'correct').length;
        ui.last = { id: lessonId, right, n: results.length };
        A.loomMap = null;
        if (lessonId) h.go('loom', { id: lessonId, step: 'try' });
        else h.go('loom');
      },
    });
  }

  function focusRules(focus) {
    const t = H().profile().settings.threshold;
    const entries = map().filter((e) => e.sentences > 0);
    if (focus === 'weakest') {
      const met = entries.filter((e) => practised(e.id));
      return (met.length ? met : entries)
        .sort((a, b) => mastery(a.id) - mastery(b.id))
        .slice(0, 6)
        .map((e) => e.id);
    }
    if (focus === 'all') return entries.map((e) => e.id);
    const open = entries.filter(
      (e) =>
        mastery(e.id) < t &&
        e.prereqs.every((p) => mastery(p) >= t || !entries.some((x) => x.id === p)),
    );
    return (open.length ? open : entries).slice(0, 8).map((e) => e.id);
  }

  /* ----------------------------------------------------------- events */

  function view(args) {
    const a = args || {};
    return a.id ? lessonView(a.id, a.step) : mapView();
  }

  function onClick(b) {
    const h = H();
    if (!h || h.A.view.name !== 'loom') return false;
    const d = b.dataset;
    const args = h.A.view.args || {};
    if (d.loomRule) {
      h.go('loom', { id: d.loomRule, step: 'see' });
      return true;
    }
    if (d.loomMap !== undefined) {
      h.go('loom');
      return true;
    }
    if (d.loomStep) {
      h.A.view = { name: 'loom', args: { ...args, step: d.loomStep } };
      h.render();
      return true;
    }
    if (d.loomReplay !== undefined) {
      h.render();
      return true;
    }
    if (d.loomTry || d.loomTrywith) {
      const id = d.loomTry || d.loomTrywith;
      const hs = L().hallOf(h.profile()).settings;
      const n = Math.min(10, Math.max(6, L().LOOM_LENGTHS[hs.loom]));
      const rules = d.loomTry ? [id] : L().withPrereqs(h.A.data, id);
      startLoom(rules, n, ui.types || L().LOOM_TYPES, h.A.data.concepts.get(id).title, 'loom', id);
      return true;
    }
    if (d.loomQuick !== undefined) {
      const hs = L().hallOf(h.profile()).settings;
      startLoom(
        focusRules(ui.focus),
        L().LOOM_LENGTHS[hs.loom],
        ui.types || L().LOOM_TYPES,
        S().sessionTitle,
        'loom',
        null,
      );
      return true;
    }
    return false;
  }

  function onSubmit(f) {
    const h = H();
    if (f.id === 'loomSession') {
      const fd = new FormData(f);
      ui.focus = String(fd.get('focus'));
      ui.types = fd.getAll('type');
      ui.shapeOpen = true;
      if (ui.types.length === 0) {
        ui.note = U.S.ts.noModes;
        h.render();
        return true;
      }
      startLoom(
        focusRules(ui.focus),
        L().LOOM_LENGTHS[fd.get('length')] || 10,
        ui.types,
        S().sessionTitle,
        'loom',
        null,
      );
      return true;
    }
    if (f.id === 'loomUse') {
      const c = lctx();
      const text = String(new FormData(f).get('text') || '').trim();
      const id = (h.A.view.args || {}).id;
      if (!c || !text || !id) return true;
      ui.useResult = { id, text, problems: L().seriousProblems(c.check(text)) };
      h.render();
      const out = h.A.main.querySelector('[role="status"]');
      if (out) h.announce(out.textContent);
      return true;
    }
    return false;
  }

  function onKey(e) {
    const h = H();
    const args = h.A.view.args || {};
    if (!args.id) return false;
    if (e.key === 'Escape') {
      h.go('loom');
      return true;
    }
    return false;
  }

  U.hall.views.loom = view;
  U.hall.wings.push({ view: 'loom', onClick, onSubmit, onKey });
})(typeof window !== 'undefined' ? window : globalThis);
