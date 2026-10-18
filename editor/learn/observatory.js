/* The Observatory: the learner's progress, gently (Hall Phase 7).
 *
 *   numbers    words met and steady, rules practised, time this week, and a
 *              run of days only when there is one (a break is never counted)
 *   changes    what the language changed under words the learner knows, from
 *              their own cards (observatory.ts): renamed, reglossed, rewritten,
 *              retired. A retirement is said once, until "Understood".
 *   sky        every word met as a star on a golden-angle spiral, the first met
 *              at the centre; brightness is mastery; a word that goes its own
 *              way is a four-pointed star. Each opens its study card. The same
 *              sky as a table, for reading rather than looking.
 *   threads    every rule practised, by mastery, each opening its Loom lesson
 *   progress   export, import, full backup, restore
 *
 * No Liraasa here: every word comes from the data. English from strings.js.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S.obs;
  const H = () => U.hallApi;
  const L = () => H().A.L;
  const esc = (s) => U.esc(s);
  const lira = (s) => '<span class="lw" lang="x-liraasa">' + esc(s) + '</span>';
  const pct = (x) => Math.round(x * 100) + '%';

  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  /* ------------------------------------------------------------ numbers */

  function numbers() {
    const h = H();
    const s = U.S;
    const sum = L().hallSummary(h.profile(), h.A.data, h.now());
    const run = L().streakOf(h.profile(), h.now());
    const stat = (n, label) =>
      '<div><dt>' + esc(label) + '</dt><dd>' + esc(String(n)) + '</dd></div>';
    return (
      '<dl class="hall-stats">' +
      stat(sum.wordsMet, s.stats.wordsMet) +
      stat(sum.wordsSteady, s.stats.wordsSteady) +
      stat(sum.rulesPracticed, s.stats.rulesPracticed) +
      stat(sum.minutesThisWeek, s.stats.minutesThisWeek) +
      '</dl>' +
      (run >= 2 ? '<p class="hall-quiet">' + esc(S().run(run)) + '</p>' : '')
    );
  }

  /* ------------------------------------------------------------ changes */

  function changes() {
    const s = S();
    const h = H();
    const A = h.A;
    const notes = L().changesFor(h.profile(), A.data);
    const cards = L().changedCards(h.profile());
    const word = (id, fallback) => {
      const it = A.data.items.get(id);
      return it
        ? '<button type="button" class="linkish" data-ref="item:' +
            esc(id) +
            '">' +
            lira(it.spelling) +
            '</button>'
        : lira(fallback);
    };
    const line = (n) => {
      if (n.kind === 'renamed') return s.renamed(lira(n.from), word(n.target, n.to));
      if (n.kind === 'reglossed') return s.reglossed(word(n.target, n.was), esc(n.from), esc(n.to));
      if (n.kind === 'rewritten') return s.rewritten(word(n.target, n.was), esc(n.from), esc(n.to));
      return (
        s.retired(lira(n.was), esc(n.edition)) +
        ' ' +
        (n.replacement ? s.replacedBy(word(n.replacement, '')) : esc(s.removed))
      );
    };
    const retired = notes.filter((n) => n.kind === 'retired').map((n) => n.target);
    const whole =
      A.diff && A.diff.renamed.length + A.diff.reglossed.length + A.diff.added.length > 0;
    return (
      '<section class="obs-changes" aria-labelledby="obsChanges"><h3 id="obsChanges">' +
      esc(s.changes) +
      '</h3>' +
      (notes.length === 0
        ? '<p class="hs-note">' + esc(s.noChanges) + '</p>'
        : '<p class="hs-note">' +
          esc(s.changesLede) +
          '</p><ul class="obs-notes">' +
          notes
            .map(
              (n) =>
                '<li class="lcard obs-' +
                n.kind +
                '"><span class="pill">' +
                esc(s.edition(n.edition)) +
                '</span> ' +
                // the line holds escaped text and buttons built above
                line(n) +
                '</li>',
            )
            .join('') +
          '</ul>') +
      '<div class="lrow">' +
      (cards.length
        ? '<button type="button" class="btn btn-primary" data-obs-review>' +
          esc(s.review(cards.length)) +
          '</button>'
        : '') +
      (retired.length
        ? '<button type="button" class="btn" data-obs-understood="' +
          esc(retired.join(' ')) +
          '">' +
          esc(s.understood) +
          '</button>'
        : '') +
      (whole
        ? '<button type="button" class="btn" data-hall-classic="changes">' +
          esc(s.wholeEdition(A.data.edition)) +
          '</button>'
        : '') +
      '</div></section>'
    );
  }

  /* ---------------------------------------------------------------- sky */

  function sky() {
    const s = S();
    const h = H();
    const stars = L().skyOf(h.profile(), h.A.data, h.A.forms, h.now());
    if (stars.length === 0) {
      return (
        '<section aria-labelledby="obsSky"><h3 id="obsSky">' +
        esc(s.sky) +
        '</h3><p class="hs-note">' +
        esc(s.skyEmpty) +
        '</p><p><button type="button" class="btn btn-primary" data-go="stars">' +
        esc(s.drawStars) +
        '</button></p></section>'
      );
    }
    const n = stars.length;
    const points = stars
      .map((st, i) => {
        const r = Math.sqrt((i + 0.5) / n) * 46;
        const t = i * GOLDEN;
        const x = 50 + r * Math.cos(t);
        const y = 50 + r * Math.sin(t);
        return (
          '<li class="obs-star' +
          (st.irregular ? ' irregular' : '') +
          '" style="left:' +
          x.toFixed(2) +
          '%;top:' +
          y.toFixed(2) +
          '%;--m:' +
          st.mastery.toFixed(2) +
          '"><button type="button" data-ref="item:' +
          esc(st.id) +
          '" aria-label="' +
          esc(s.starSr(st.spelling, st.meaning, pct(st.mastery), st.irregular)) +
          '"><span class="obs-dot" aria-hidden="true"></span><span class="obs-label" aria-hidden="true">' +
          lira(st.spelling) +
          '</span></button></li>'
        );
      })
      .join('');
    const rows = stars
      .slice()
      .sort((a, b) => b.mastery - a.mastery || (a.spelling < b.spelling ? -1 : 1))
      .map(
        (st) =>
          '<tr><th scope="row"><button type="button" class="linkish" data-ref="item:' +
          esc(st.id) +
          '">' +
          lira(st.spelling) +
          '</button></th><td>' +
          esc(st.meaning) +
          '</td><td>' +
          pct(st.mastery) +
          '</td><td>' +
          (st.irregular ? esc(s.yes) : '') +
          '</td></tr>',
      )
      .join('');
    return (
      '<section aria-labelledby="obsSky"><h3 id="obsSky">' +
      esc(s.sky) +
      '</h3><p class="hs-note">' +
      esc(s.skyLede) +
      '</p><ul class="obs-sky" role="list">' +
      points +
      '</ul><details class="obs-list"><summary>' +
      esc(s.asList) +
      '</summary><table class="ts-forms"><thead><tr><th scope="col">' +
      esc(s.colWord) +
      '</th><th scope="col">' +
      esc(s.colMeaning) +
      '</th><th scope="col">' +
      esc(s.colKnown) +
      '</th><th scope="col">' +
      esc(s.colOwnWay) +
      '</th></tr></thead><tbody>' +
      rows +
      '</tbody></table></details></section>'
    );
  }

  /* ------------------------------------------------------------ threads */

  function threads() {
    const s = S();
    const h = H();
    const lit = L().rulesLit(h.profile(), h.A.data, h.now());
    const t = h.profile().settings.threshold;
    return (
      '<section aria-labelledby="obsLoom"><h3 id="obsLoom">' +
      esc(s.loom) +
      '</h3>' +
      (lit.length === 0
        ? '<p class="hs-note">' +
          esc(s.loomEmpty) +
          '</p><p><button type="button" class="btn" data-go="loom">' +
          esc(s.openLoom) +
          '</button></p>'
        : '<p class="hs-note">' +
          esc(s.loomLede) +
          '</p><ul class="thread" role="list">' +
          lit
            .map((r) => {
              const st = r.mastery >= t ? 'woven' : 'practised';
              return (
                '<li><button type="button" class="knot knot-' +
                st +
                '" data-ref="concept:' +
                esc(r.id) +
                '" style="--m:' +
                r.mastery.toFixed(2) +
                '"><span class="knot-dot" aria-hidden="true"></span><span class="knot-title">' +
                esc(r.title) +
                '</span><span class="knot-state">' +
                esc(s.states[st]) +
                ' · ' +
                pct(r.mastery) +
                '</span></button></li>'
              );
            })
            .join('') +
          '</ul>') +
      '</section>'
    );
  }

  /* ----------------------------------------------------------- progress */

  function progress() {
    const t = U.S.set;
    return (
      '<section class="lcard" aria-labelledby="obsProgress"><h3 id="obsProgress">' +
      esc(S().progress) +
      '</h3><p>' +
      esc(t.dataLede) +
      '</p><div class="lrow"><button type="button" class="btn" data-backup="progress">' +
      esc(t.exportProgress) +
      '</button><button type="button" class="btn" data-backup="import">' +
      esc(t.importProgress) +
      '</button><button type="button" class="btn" data-backup="full">' +
      esc(t.backup) +
      '</button><button type="button" class="btn" data-backup="restore">' +
      esc(t.restore) +
      '</button></div></section>'
    );
  }

  function view() {
    return (
      '<section class="hall obs"><header class="hall-head"><p class="kicker">' +
      esc(U.S.observatory) +
      '</p><h2 tabindex="-1">' +
      esc(U.S.wings.observatory.title) +
      '</h2><p class="hall-greeting">' +
      esc(S().lede) +
      '</p></header>' +
      numbers() +
      changes() +
      sky() +
      threads() +
      progress() +
      '</section>'
    );
  }

  /* ------------------------------------------------------------- events */

  function onClick(b) {
    const h = H();
    if (!h || h.A.view.name !== 'observatory') return false;
    const d = b.dataset;
    if (d.obsUnderstood) {
      L().acknowledgeRetired(h.profile(), d.obsUnderstood.split(' '));
      h.save();
      h.render();
      return true;
    }
    if (d.obsReview !== undefined) {
      const rng = L().createRng('changed:' + h.now());
      const ex = L()
        .changedCards(h.profile())
        .map((c) => L().exerciseForCard(h.A.ctx, c, rng))
        .filter(Boolean);
      h.startSession(S().reviewTitle, ex, { back: 'observatory' });
      return true;
    }
    return false;
  }

  U.hall.views.observatory = view;
  U.hall.wings.push({ view: 'observatory', onClick });
})(typeof window !== 'undefined' ? window : globalThis);
