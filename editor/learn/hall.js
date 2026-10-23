/* The Training Hall: Learn's hub and its shared settings (Hall Phase 2).
 *
 * Views, registered with the Learn shell (app.js) and routed by its go():
 *   hall          the hub: greeting, the three wings, what is due, gentle numbers
 *   (Ten Stars, The Loom, the Sandbox and the Observatory register their own
 *   views from stars.js, loom.js, sandbox.js and observatory.js.)
 *   hallSettings  settings shared by both wings
 *
 * Every word of English comes from strings.js (U.S); every word of Liraasa
 * from the data. The learner's Hall settings live on the profile through the
 * core (hallOf / updateHallSettings); display preferences live in A.ui.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S;
  const H = () => U.hallApi;
  const esc = (s) => U.esc(s);

  /* ----------------------------------------------------------- motifs */

  /** A small constellation, drawn from fixed points: decoration only. */
  function constellation(points, lines) {
    return (
      '<svg class="motif" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      lines
        .map(
          ([a, b]) =>
            '<line x1="' +
            points[a][0] +
            '" y1="' +
            points[a][1] +
            '" x2="' +
            points[b][0] +
            '" y2="' +
            points[b][1] +
            '"/>',
        )
        .join('') +
      points
        .map(
          ([x, y, r], i) =>
            '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 1.6) + '" style="--i:' + i + '"/>',
        )
        .join('') +
      '</svg>'
    );
  }

  const MOTIFS = {
    // ten points, loosely joined: a draw
    stars: constellation(
      [
        [10, 40],
        [24, 22, 2.4],
        [38, 34],
        [50, 14],
        [62, 30, 2.6],
        [74, 46],
        [84, 20],
        [96, 36, 2.2],
        [106, 12],
        [112, 48],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 4],
        [3, 4],
        [4, 5],
        [4, 6],
        [6, 7],
        [7, 8],
        [7, 9],
      ],
    ),
    // threads crossing: warp and weft
    loom: constellation(
      [
        [14, 12],
        [14, 48],
        [44, 12, 2.2],
        [44, 48],
        [76, 12],
        [76, 48, 2.2],
        [106, 12],
        [106, 48],
        [30, 30, 2.6],
        [90, 30, 2.6],
      ],
      [
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
        [0, 3],
        [2, 5],
        [4, 7],
        [8, 9],
      ],
    ),
    // a stair of points, each a step up: lessons that build
    course: constellation(
      [
        [10, 50],
        [26, 50, 2.2],
        [26, 40],
        [44, 40, 2.2],
        [44, 30],
        [62, 30, 2.4],
        [62, 20],
        [82, 20, 2.4],
        [82, 10],
        [108, 10, 2.8],
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9],
      ],
    ),
    // a wide field of faint points: the sky
    observatory: constellation(
      [
        [8, 18],
        [20, 44],
        [32, 10],
        [46, 30, 2.8],
        [58, 50],
        [66, 16],
        [80, 38, 2.2],
        [92, 8],
        [100, 52],
        [112, 26],
      ],
      [
        [3, 5],
        [3, 6],
        [6, 9],
      ],
    ),
  };

  /* ------------------------------------------------------------ views */

  const views = {};

  /** Wings register here: { view, onClick(b), onSubmit(f), onKey(e) }, each returning true when handled. */
  const wings = [];

  views.hall = function hall() {
    const h = H();
    const A = h.A;
    const s = S();
    const state = A.L.hallOf(h.profile());
    const sum = A.L.hallSummary(h.profile(), A.data, h.now());
    const wing = (key) =>
      '<li><button type="button" class="wing" data-go="' +
      key +
      '">' +
      MOTIFS[key] +
      '<span class="wing-title">' +
      esc(s.wings[key].title) +
      '</span><span class="wing-line">' +
      esc(s.wings[key].line) +
      '</span><span class="wing-cta">' +
      esc(s.wings[key].cta) +
      ' <span aria-hidden="true">→</span></span></button></li>';
    const stat = (n, label) =>
      '<div><dt>' + esc(label) + '</dt><dd>' + esc(String(n)) + '</dd></div>';
    return (
      '<section class="hall">' +
      '<header class="hall-head"><p class="kicker">' +
      esc(s.hubKicker) +
      ' · ' +
      esc(s.edition(A.data.edition)) +
      '</p><h2 tabindex="-1">' +
      esc(s.hall) +
      '</h2><p class="hall-greeting">' +
      esc(s.greeting[A.L.greeting(state)]) +
      '</p></header>' +
      '<ul class="wings" role="list">' +
      wing('stars') +
      wing('loom') +
      wing('course') +
      wing('observatory') +
      '</ul>' +
      '<div class="hall-due"><p>' +
      esc(s.due(sum.due)) +
      '</p>' +
      (sum.due > 0
        ? '<button type="button" class="btn btn-primary" data-go="review">' +
          esc(s.reviewNow) +
          '</button>'
        : '') +
      '</div>' +
      '<dl class="hall-stats">' +
      stat(sum.wordsMet, s.stats.wordsMet) +
      stat(sum.wordsSteady, s.stats.wordsSteady) +
      stat(sum.rulesPracticed, s.stats.rulesPracticed) +
      stat(sum.minutesThisWeek, s.stats.minutesThisWeek) +
      '</dl>' +
      (sum.daysThisWeek > 0
        ? '<p class="hall-quiet">' + esc(s.stats.daysThisWeek(sum.daysThisWeek)) + '</p>'
        : '') +
      '</section>'
    );
  };

  /* --------------------------------------------------------- settings */

  function select(name, label, current, options, note) {
    const id = 'hs-' + name;
    return (
      '<div class="hs-field"><label for="' +
      id +
      '">' +
      esc(label) +
      '</label><select id="' +
      id +
      '" name="' +
      name +
      '"' +
      (note ? ' aria-describedby="' + id + '-note"' : '') +
      '>' +
      options
        .map(
          ([value, text]) =>
            '<option value="' +
            esc(String(value)) +
            '"' +
            (String(value) === String(current) ? ' selected' : '') +
            '>' +
            esc(text) +
            '</option>',
        )
        .join('') +
      '</select>' +
      (note ? '<p class="hs-note" id="' + id + '-note">' + esc(note) + '</p>' : '') +
      '</div>'
    );
  }

  views.hallSettings = function hallSettings() {
    const h = H();
    const A = h.A;
    const t = S().set;
    const p = h.profile();
    const hs = A.L.hallOf(p).settings;
    const V = A.L.HALL_SETTING_VALUES;
    const ui = A.ui;
    const pairs = (obj) => Object.entries(obj);
    return (
      '<section class="hall hall-settings"><header class="hall-head"><h2 tabindex="-1">' +
      esc(t.title) +
      '</h2><p class="hall-greeting">' +
      esc(t.lede) +
      '</p></header>' +
      '<form id="hallSettings">' +
      '<fieldset class="lcard"><legend>' +
      esc(t.sessions) +
      '</legend><p class="hs-scope">' +
      esc(t.perLearner) +
      '</p>' +
      select(
        'stars',
        t.stars,
        hs.stars,
        V.stars.map((n) => [n, String(n)]),
      ) +
      select(
        'drill',
        t.drill,
        hs.drill,
        V.drill.map((n) => [n, String(n)]),
      ) +
      select('loom', t.loom, hs.loom, pairs(t.loomLengths)) +
      '<p class="hs-note">' +
      esc(t.rhythm) +
      '</p></fieldset>' +
      '<fieldset class="lcard"><legend>' +
      esc(t.answers) +
      '</legend><p class="hs-scope">' +
      esc(t.perLearner) +
      '</p>' +
      select('leniency', t.leniency, hs.leniency, pairs(t.leniencies)) +
      select('gloss', t.gloss, hs.gloss, pairs(t.glosses)) +
      select('hints', t.hints, hs.hints, pairs(t.hintModes)) +
      '<p class="hs-note">' +
      esc(t.answersNote) +
      '</p></fieldset>' +
      '<fieldset class="lcard"><legend>' +
      esc(t.display) +
      '</legend><p class="hs-scope">' +
      esc(t.perScreen) +
      '</p>' +
      select('sky', t.sky, ui.sky, pairs(t.skies)) +
      select(
        'scale',
        t.scale,
        ui.scale,
        [0.9, 1, 1.15, 1.3, 1.5].map((r) => [r, Math.round(r * 100) + '%']),
      ) +
      select('contrast', t.contrast, ui.contrast, pairs(t.contrasts)) +
      select('font', t.font, ui.font, pairs(t.fonts), t.fontNote) +
      select('motion', t.motion, ui.motion, pairs(t.motions)) +
      select('sound', t.sound, ui.sound, pairs(t.sounds)) +
      '</fieldset>' +
      '<p><button class="btn btn-primary" type="submit">' +
      esc(t.save) +
      '</button></p></form>' +
      '<section class="lcard" aria-labelledby="hs-keys"><h3 id="hs-keys">' +
      esc(t.keys) +
      '</h3>' +
      keyTable() +
      '</section>' +
      audioSection() +
      '<section class="lcard" aria-labelledby="hs-data"><h3 id="hs-data">' +
      esc(t.data) +
      '</h3><p>' +
      esc(t.dataLede) +
      '</p><div class="lrow">' +
      '<button type="button" class="btn" data-backup="progress">' +
      esc(t.exportProgress) +
      '</button><button type="button" class="btn" data-backup="import">' +
      esc(t.importProgress) +
      '</button><button type="button" class="btn" data-backup="full">' +
      esc(t.backup) +
      '</button><button type="button" class="btn" data-backup="restore">' +
      esc(t.restore) +
      '</button></div>' +
      '<h4>' +
      esc(t.reset) +
      '</h4><form id="wipe" class="lrow"><label for="wipeConfirm">' +
      esc(t.resetLede(p.name)) +
      '</label><input id="wipeConfirm" class="lsearch" style="width:8em" autocomplete="off"><button class="btn" type="submit">' +
      esc(t.resetButton) +
      '</button></form></section></section>'
    );
  };

  /** Coverage of the author's recordings, and the words still to record (D9). */
  function audioSection() {
    const t = S().set;
    const A = H().A;
    const c = A.L.audioCoverage(A.data, A.audio || new Set());
    const word = (id) => A.data.items.get(id);
    const next = c.missing
      .slice(0, 12)
      .map((id) => word(id))
      .filter(Boolean)
      .map(
        (i) =>
          '<li><span class="liraasa">' +
          esc(i.spelling) +
          '</span> <span class="en">' +
          esc(i.meaning) +
          '</span></li>',
      )
      .join('');
    const lines = c.missing
      .map((id) => {
        const i = word(id);
        return i ? '  "' + id + '": "words/' + i.spelling + '.mp3",' : '';
      })
      .join('\n');
    return (
      '<section class="lcard" aria-labelledby="hs-audio"><h3 id="hs-audio">' +
      esc(t.audio) +
      '</h3><p class="en">' +
      esc(t.audioLede) +
      '</p><ul class="hs-coverage">' +
      [
        [t.coverageRoots, c.roots],
        [t.coverageCompounds, c.compounds],
        [t.coverageSentences, c.sentences],
      ]
        .map(([label, n]) => '<li>' + esc(t.coverage(label, n.have, n.total)) + '</li>')
        .join('') +
      '</ul>' +
      (c.missing.length === 0
        ? '<p>' + esc(t.allRecorded) + '</p>'
        : '<h4>' +
          esc(t.nextToRecord) +
          '</h4><ul class="hs-next">' +
          next +
          '</ul><details><summary>' +
          esc(t.missingAll(c.missing.length)) +
          '</summary><p class="en">' +
          esc(t.missingNote) +
          '</p><textarea class="hs-lines" readonly rows="8" aria-label="' +
          esc(t.missingAll(c.missing.length)) +
          '">' +
          esc(lines) +
          '</textarea></details>') +
      '</section>'
    );
  }

  function keyTable() {
    return (
      '<table class="hall-keys"><tbody>' +
      S()
        .keys.list.map(
          ([k, what]) =>
            '<tr><th scope="row"><kbd>' + esc(k) + '</kbd></th><td>' + esc(what) + '</td></tr>',
        )
        .join('') +
      '</tbody></table>'
    );
  }

  /* ---------------------------------------------------------- events */

  /** A click the shell did not handle. Returns true when it was the Hall's. */
  function onClick(b) {
    const h = H();
    const d = b.dataset;
    for (const w of wings) if (w.onClick && w.onClick(b)) return true;
    if (d.hallClassic) {
      h.setMode('classic');
      h.go(d.hallClassic);
      return true;
    }
    if (d.mode) {
      h.setMode(d.mode);
      h.go(d.mode === 'hall' ? 'hall' : 'today');
      return true;
    }
    if (d.keys !== undefined) {
      showKeys();
      return true;
    }
    return false;
  }

  /** A form the shell did not handle. Returns true when it was the Hall's. */
  function onSubmit(f) {
    for (const w of wings) if (w.onSubmit && w.onSubmit(f)) return true;
    if (f.id !== 'hallSettings') return false;
    const h = H();
    const A = h.A;
    const fd = new FormData(f);
    A.L.updateHallSettings(h.profile(), {
      stars: Number(fd.get('stars')),
      drill: Number(fd.get('drill')),
      loom: fd.get('loom'),
      leniency: fd.get('leniency'),
      gloss: fd.get('gloss'),
      hints: fd.get('hints'),
    });
    A.ui = {
      ...A.ui,
      sky: fd.get('sky'),
      scale: Number(fd.get('scale')),
      contrast: fd.get('contrast'),
      font: fd.get('font'),
      motion: fd.get('motion'),
      sound: fd.get('sound'),
    };
    h.applyUi();
    h.save();
    h.flash(S().set.saved);
    return true;
  }

  /* -------------------------------------------------- the key overlay */

  let dialog = null;
  function showKeys() {
    const s = S().keys;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'hall-dialog';
      dialog.setAttribute('aria-labelledby', 'hallKeysTitle');
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
      });
      H().A.el.appendChild(dialog);
    }
    dialog.innerHTML =
      '<h2 id="hallKeysTitle">' +
      esc(s.title) +
      '</h2>' +
      keyTable() +
      '<p><button type="button" class="btn" data-close>' +
      esc(s.close) +
      '</button></p>';
    dialog.showModal();
    const close = dialog.querySelector('[data-close]');
    if (close) close.focus();
  }

  /** `?` opens the shortcut list anywhere in Learn, unless the learner is typing. */
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!document.body.classList.contains('learn-on')) return;
    if (dialog && dialog.open) return;
    if (e.key === '?') {
      e.preventDefault();
      showKeys();
      return;
    }
    const view = H() && H().A.view ? H().A.view.name : '';
    for (const w of wings) {
      if (w.view === view && w.onKey && w.onKey(e)) {
        e.preventDefault();
        return;
      }
    }
  }
  document.addEventListener('keydown', onKey);

  /* ----------------------------------------------------------- sound */

  /** A soft two-note chime for a right answer, when sound is on. Nothing for a wrong one. */
  let audio = null;
  function chime() {
    const A = H().A;
    if (!A.ui || A.ui.sound !== 'on') return;
    const Ctx = root.AudioContext || root.webkitAudioContext;
    if (!Ctx) return;
    try {
      audio = audio || new Ctx();
      const t = audio.currentTime;
      [880, 1318.5].forEach((hz, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0, t + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.06, t + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9);
        osc.connect(gain).connect(audio.destination);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 1);
      });
    } catch {
      /* sound is a nicety; never let it break a session */
    }
  }

  U.hall = { views, wings, onClick, onSubmit, showKeys, chime };
})(typeof window !== 'undefined' ? window : globalThis);
