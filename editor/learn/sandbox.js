/* The Loom Sandbox (Hall Phase 6): free play with the clause.
 *
 * The learner picks pieces from menus the data provides (sandbox.ts); the
 * core puts each where its slot says; the live grammar checker reads the
 * result. Changing a menu rebuilds only the output, so focus stays put.
 *
 * Shown for every build: the sentence, each word with its parts and gloss,
 * the glosses read side by side (labelled: a reading, not a translation), the
 * checker's verdict in its own words, and every rule involved, each a link to
 * its card in The Loom.
 *
 * No Liraasa here: every word comes from the data. English from strings.js.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S.sb;
  const H = () => U.hallApi;
  const L = () => H().A.L;
  const esc = (s) => U.esc(s);
  const lira = (s) => '<span class="lw" lang="x-liraasa">' + esc(s) + '</span>';

  /* per screen, never saved: the pieces chosen */
  const ui = {
    subjectKind: 'pronoun',
    subject: {},
    verb: '',
    objectKind: 'none',
    object: {},
    ops: {},
    onlyKnown: false,
    copied: false,
  };

  const known = () => (H().A.ctx && H().A.ctx.known) || new Set();

  function menus() {
    const A = H().A;
    const all = L().sandboxMenus(A.data, A.forms, known());
    if (!ui.onlyKnown) return { menus: all, thin: [] };
    // only met words, unless there are none of a kind: then the whole list, and say so
    const thin = [];
    const only = (key) => {
      const mine = all[key].filter((w) => w.known);
      if (mine.length === 0) thin.push(key);
      return mine.length === 0 ? all[key] : mine;
    };
    return {
      menus: { ...all, nouns: only('nouns'), verbs: only('verbs'), adjectives: only('adjectives') },
      thin,
    };
  }

  /* ------------------------------------------------------------ the spec */

  function nounSpec(kind, np) {
    if (!np.id) return undefined;
    if (kind === 'pronoun') return { id: np.id };
    return {
      id: np.id,
      ...(np.determiner ? { determiner: np.determiner } : {}),
      ...(np.adjective ? { adjective: np.adjective } : {}),
      ...(np.plural ? { plural: true } : {}),
    };
  }

  function spec() {
    const subject = nounSpec(ui.subjectKind, ui.subject);
    const object = ui.objectKind === 'none' ? undefined : nounSpec('noun', ui.object);
    return {
      ...(subject ? { subject } : {}),
      ...(ui.verb ? { verb: ui.verb } : {}),
      ...(object ? { object } : {}),
      ops: Object.fromEntries(Object.entries(ui.ops).filter(([, v]) => v)),
    };
  }

  /* ------------------------------------------------------------ output */

  function outputHtml() {
    const s = S();
    const A = H().A;
    const r = L().buildSandbox(A.data, A.forms, spec());
    if (r.line === '') return '<p class="hs-note">' + esc(s.empty) + '</p>';
    const ck = root.LiraasaChecker && root.LiraasaChecker.default;
    const problems = ck
      ? L().seriousProblems(ck.checkLine(r.line, 1, undefined, { register: 'poetic' }))
      : null;
    const piece = (p) =>
      '<span class="w sb-piece sb-' +
      p.role +
      '"><span class="t" lang="x-liraasa">' +
      (p.parts.length > 1
        ? p.parts
            .map((m) =>
              m.role === 'marker'
                ? '<span class="ts-marker">' + esc(m.text) + '</span>'
                : esc(m.text),
            )
            .join('<span class="ts-boundary" aria-hidden="true">·</span>')
        : esc(p.text)) +
      esc(p.after || '') +
      '</span><span class="g">' +
      esc(p.gloss) +
      (p.tags.length ? ' <span class="tag">' + esc(p.tags.join(' · ')) + '</span>' : '') +
      '</span></span>';
    const reason = (rule) => {
      const t = s.reasons[rule.reason];
      return typeof t === 'function' ? t(rule.word || '') : t;
    };
    return (
      '<p class="sb-line">' +
      lira(r.line) +
      '</p><div class="il sb-il">' +
      r.pieces.map(piece).join('') +
      '</div><p class="sb-reading"><span class="hs-note">' +
      esc(s.reading) +
      ':</span> ' +
      esc(r.reading) +
      ' <span class="hs-note">(' +
      esc(s.readingNote) +
      ')</span></p>' +
      (r.incomplete
        ? '<p class="sb-verdict sb-quiet">' + esc(s.incomplete) + '</p>'
        : problems === null
          ? '<p class="sb-verdict sb-quiet">' + esc(s.noChecker) + '</p>'
          : problems.length === 0
            ? '<p class="sb-verdict sb-clean"><span aria-hidden="true">✦</span> ' +
              esc(s.clean) +
              '</p>'
            : '<div class="sb-verdict sb-notes"><p><strong>' +
              esc(s.notes) +
              '</strong></p><ul>' +
              problems.map((p) => '<li>' + esc(p.message) + '</li>').join('') +
              '</ul></div>') +
      '<details class="sb-why" open><summary>' +
      esc(s.why) +
      '</summary><ul>' +
      r.rules
        .map(
          (rule) =>
            '<li><button type="button" class="linkish" data-sb-rule="' +
            esc(rule.id) +
            '">' +
            esc(rule.title) +
            '</button> <span class="en">' +
            esc(reason(rule)) +
            '</span></li>',
        )
        .join('') +
      '</ul></details>'
    );
  }

  /* -------------------------------------------------------------- form */

  function select(name, label, list, current, empty, describe) {
    const id = 'sb-' + name;
    return (
      '<div class="hs-field"><label for="' +
      id +
      '">' +
      esc(label) +
      '</label><select id="' +
      id +
      '" name="' +
      esc(name) +
      '">' +
      (empty ? '<option value="">' + esc(empty) + '</option>' : '') +
      list
        .map(
          (w) =>
            '<option value="' +
            esc(w.id) +
            '"' +
            (w.id === current ? ' selected' : '') +
            '>' +
            esc(describe ? describe(w) : S().partOf(w.spelling, w.meaning)) +
            (w.known ? ' ✦' : '') +
            '</option>',
        )
        .join('') +
      '</select></div>'
    );
  }

  function nounFields(prefix, np, m) {
    const s = S();
    return (
      select(prefix + '-noun', s.noun, m.nouns, np.id, s.choose) +
      select(prefix + '-determiner', s.determiner, m.determiners, np.determiner, s.none) +
      select(prefix + '-adjective', s.adjective, m.adjectives, np.adjective, s.none) +
      (m.plural
        ? '<label class="sb-check"><input type="checkbox" name="' +
          prefix +
          '-plural"' +
          (np.plural ? ' checked' : '') +
          '> ' +
          esc(s.plural(m.plural.meaning.split(/[\s(]/)[0])) +
          '</label>'
        : '')
    );
  }

  function radio(name, value, label, current) {
    return (
      '<label class="sb-check"><input type="radio" name="' +
      name +
      '" value="' +
      value +
      '"' +
      (value === current ? ' checked' : '') +
      '> ' +
      esc(label) +
      '</label>'
    );
  }

  function formHtml() {
    const s = S();
    const { menus: m, thin } = menus();
    return (
      '<form id="sbForm" class="sb-form" autocomplete="off">' +
      '<label class="sb-check"><input type="checkbox" name="onlyKnown"' +
      (ui.onlyKnown ? ' checked' : '') +
      '> ' +
      esc(s.onlyKnown) +
      '</label>' +
      (thin.length ? '<p class="hs-note">' + esc(s.onlyKnownNone) + '</p>' : '') +
      '<fieldset class="lcard"><legend>' +
      esc(s.subject) +
      '</legend><div class="lrow">' +
      radio('subjectKind', 'pronoun', s.pronoun, ui.subjectKind) +
      radio('subjectKind', 'noun', s.noun, ui.subjectKind) +
      '</div>' +
      (ui.subjectKind === 'pronoun'
        ? select('subject-pronoun', s.pronoun, m.pronouns, ui.subject.id, s.choose)
        : nounFields('subject', ui.subject, m)) +
      '</fieldset><fieldset class="lcard"><legend>' +
      esc(s.verb) +
      '</legend>' +
      select('verb', s.verb, m.verbs, ui.verb, s.choose) +
      '</fieldset><fieldset class="lcard"><legend>' +
      esc(s.object) +
      '</legend><div class="lrow">' +
      radio('objectKind', 'none', s.objectNone, ui.objectKind) +
      radio('objectKind', 'noun', s.noun, ui.objectKind) +
      '</div>' +
      (ui.objectKind === 'noun' ? nounFields('object', ui.object, m) : '') +
      '</fieldset><fieldset class="lcard"><legend>' +
      esc(s.operators) +
      '</legend><p class="hs-note">' +
      esc(s.operatorsNote) +
      '</p>' +
      m.slots
        .map((slot) => select('op:' + slot.id, slot.title, slot.words, ui.ops[slot.id], s.none))
        .join('') +
      '</fieldset></form>'
    );
  }

  function view() {
    const s = S();
    if (!ui.subject.id && !ui.verb) defaults();
    return (
      '<section class="hall sandbox"><header class="hall-head"><p class="kicker">' +
      esc(U.S.loom) +
      '</p><h2 tabindex="-1">' +
      esc(s.title) +
      '</h2><p class="hall-greeting">' +
      esc(s.lede) +
      '</p></header><div class="sb-grid"><div class="sb-panel">' +
      '<div class="sb-out lcard" id="sbOut">' +
      outputHtml() +
      '</div><div class="lrow sb-actions"><button type="button" class="btn btn-primary" data-sb-surprise>' +
      esc(s.surprise) +
      '</button><button type="button" class="btn" data-sb-copy>' +
      esc(ui.copied ? s.copied : s.copy) +
      '</button><button type="button" class="btn" data-sb-clear>' +
      esc(s.clear) +
      '</button></div><p class="hs-note">' +
      esc(s.copyNote) +
      '</p></div>' +
      formHtml() +
      '</div></section>'
    );
  }

  /** A first sentence: the first pronoun and a verb the learner knows, or the commonest. */
  function defaults() {
    const { menus: m } = menus();
    const first = (list) => (list.find((w) => w.known) || list[0] || {}).id;
    ui.subjectKind = 'pronoun';
    ui.subject = { id: first(m.pronouns) };
    ui.verb = first(m.verbs) || '';
  }

  /* ----------------------------------------------------------- events */

  function readForm(f) {
    const fd = new FormData(f);
    ui.onlyKnown = fd.get('onlyKnown') === 'on';
    ui.subjectKind = String(fd.get('subjectKind') || 'pronoun');
    ui.subject =
      ui.subjectKind === 'pronoun'
        ? { id: String(fd.get('subject-pronoun') || '') }
        : {
            id: String(fd.get('subject-noun') || ''),
            determiner: String(fd.get('subject-determiner') || ''),
            adjective: String(fd.get('subject-adjective') || ''),
            plural: fd.get('subject-plural') === 'on',
          };
    ui.verb = String(fd.get('verb') || '');
    ui.objectKind = String(fd.get('objectKind') || 'none');
    ui.object = {
      id: String(fd.get('object-noun') || ''),
      determiner: String(fd.get('object-determiner') || ''),
      adjective: String(fd.get('object-adjective') || ''),
      plural: fd.get('object-plural') === 'on',
    };
    ui.ops = {};
    for (const [k, v] of fd.entries()) if (k.startsWith('op:') && v) ui.ops[k.slice(3)] = String(v);
  }

  let announceTimer = null;
  function refresh(full) {
    const h = H();
    ui.copied = false;
    if (full) {
      // the form's shape changed (a radio, the known-only switch): redraw, keep focus by name
      const active = document.activeElement;
      const key = active && active.name ? active.name + '=' + (active.value || '') : null;
      h.render();
      if (key) {
        const [name, value] = key.split('=');
        const el =
          h.A.main.querySelector('[name="' + name + '"][value="' + value + '"]') ||
          h.A.main.querySelector('[name="' + name + '"]');
        if (el) el.focus();
      }
    } else {
      const out = h.A.main.querySelector('#sbOut');
      if (out) out.innerHTML = outputHtml();
    }
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      const line = h.A.main.querySelector('.sb-line');
      const verdict = h.A.main.querySelector('.sb-verdict');
      h.announce((line ? line.textContent + ' ' : '') + (verdict ? verdict.textContent : ''));
    }, 600);
  }

  document.addEventListener('change', (e) => {
    const f = e.target && e.target.closest && e.target.closest('#sbForm');
    if (!f || !H() || H().A.view.name !== 'sandbox') return;
    const before = ui.subjectKind + ui.objectKind + ui.onlyKnown;
    readForm(f);
    refresh(before !== ui.subjectKind + ui.objectKind + ui.onlyKnown);
  });

  function surprise() {
    const { menus: m } = menus();
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const maybe = (p) => Math.random() < p;
    ui.subjectKind = maybe(0.6) ? 'pronoun' : 'noun';
    ui.subject =
      ui.subjectKind === 'pronoun'
        ? { id: (pick(m.pronouns) || {}).id }
        : { id: (pick(m.nouns) || {}).id, determiner: (pick(m.determiners) || {}).id };
    ui.verb = (pick(m.verbs) || {}).id || '';
    ui.objectKind = maybe(0.5) ? 'noun' : 'none';
    ui.object = {
      id: (pick(m.nouns) || {}).id,
      determiner: (pick(m.determiners) || {}).id,
      ...(maybe(0.3) ? { adjective: (pick(m.adjectives) || {}).id } : {}),
      plural: maybe(0.3),
    };
    ui.ops = {};
    for (const slot of m.slots) if (maybe(0.15)) ui.ops[slot.id] = (pick(slot.words) || {}).id;
  }

  function onClick(b) {
    const h = H();
    if (!h || h.A.view.name !== 'sandbox') return false;
    const d = b.dataset;
    if (d.sbRule) {
      h.go('loom', { id: d.sbRule, step: 'see' });
      return true;
    }
    if (d.sbSurprise !== undefined) {
      surprise();
      refresh(true);
      return true;
    }
    if (d.sbClear !== undefined) {
      ui.subject = {};
      ui.verb = '';
      ui.object = {};
      ui.objectKind = 'none';
      ui.ops = {};
      defaults();
      refresh(true);
      return true;
    }
    if (d.sbCopy !== undefined) {
      const line = h.A.main.querySelector('.sb-line');
      const text = line ? line.textContent : '';
      const done = () => {
        ui.copied = true;
        b.textContent = S().copied;
        h.announce(S().copied);
      };
      if (root.navigator && root.navigator.clipboard && text) {
        root.navigator.clipboard.writeText(text).then(done, () => undefined);
      }
      return true;
    }
    return false;
  }

  U.hall.views.sandbox = view;
  U.hall.wings.push({ view: 'sandbox', onClick });
})(typeof window !== 'undefined' ? window : globalThis);
