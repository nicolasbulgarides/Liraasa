/* Learn: the exercise runner (Learn Phases 3–4).
 *
 * Draws one exercise at a time from the core's exercise objects and grades
 * with the core's grader. Keyboard first:
 *   1–9      pick a choice
 *   Enter    check, then next
 *   Escape   leave the session
 *   P        play the recording, when there is one
 * Tiles move by click or Enter (no drag), so every exercise has a keyboard
 * path. Feedback is announced through the live region.
 *
 * Options a caller may add (Ten Stars uses them; Classic Learn does not):
 *   grade(ex, response, ms)   grade with something other than the core grader
 *   requeue                   ask a missed exercise once more, a few later
 *   verdictText(verdict, n)   the words for right / almost / not quite
 *   diagnosisText(d)          the words for one diagnosis
 *   glossOpen                 show the word-by-word gloss from the start (a
 *                             setting, so it does not count as a hint)
 * An exercise's `prefill` starts a typed answer (the sentence to change).
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});

  const esc = (s) =>
    String(s === null || s === undefined ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  U.esc = esc;

  const VERDICT = { correct: 'Right', almost: 'Almost', wrong: 'Not quite' };

  /** An interlinear line: each word a button that opens its card. */
  U.interlinear = function interlinear(tokens, opts) {
    const o = opts || {};
    return (
      '<div class="il">' +
      tokens
        .map((t) => {
          const tags =
            t.tags && t.tags.length
              ? ' <span class="tag">' + esc(t.tags.join(' · ')) + '</span>'
              : '';
          const cls = 'w' + (t.kind === 'unknown' ? ' unknown' : '');
          const attr = t.id ? ' data-ref="item:' + esc(t.id) + '"' : ' disabled';
          const label = t.id ? ' aria-label="' + esc(t.text + ': ' + t.gloss) + '"' : '';
          return (
            '<button type="button" class="' +
            cls +
            '"' +
            attr +
            label +
            '>' +
            '<span class="t" lang="x-liraasa">' +
            esc(t.text) +
            '</span>' +
            (o.gloss === false ? '' : '<span class="g">' + esc(t.gloss) + tags + '</span>') +
            '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  };

  U.runSession = function runSession(host, opts) {
    const L = root.LiraasaLearn;
    const exercises = opts.exercises.slice();
    const again = new Set();
    const results = [];
    let i = 0;
    let state = null;

    function fresh() {
      const ex = exercises[i];
      state = {
        ex,
        started: Date.now(),
        choice: null,
        typed: ex.prefill || '',
        order: [],
        pairs: {},
        multi: [],
        pick: null,
        hinted: false,
        choiceMode: false,
        grade: null,
      };
    }

    function announce(text) {
      const live = document.getElementById('learnLive');
      if (live) {
        live.textContent = '';
        setTimeout(() => (live.textContent = text), 30);
      }
    }

    function promptHtml(ex) {
      const p = ex.prompt;
      let out = '';
      if (ex.audio)
        out +=
          '<button type="button" class="btn" data-act="play" aria-label="Play the recording (P)">▶ Play</button> ';
      if (p.gap) {
        out +=
          '<div class="prompt-l" lang="x-liraasa">' +
          esc(p.gap.before) +
          '<span class="gap" aria-label="gap">' +
          (state.grade ? esc(answerText(ex)) : '&nbsp;') +
          '</span>' +
          esc(p.gap.after) +
          '</div>';
      } else if (p.liraasa) {
        out += '<div class="prompt-l" lang="x-liraasa">' + esc(p.liraasa) + '</div>';
      }
      if (p.tokens && (state.hinted || state.grade || opts.glossOpen))
        out += U.interlinear(p.tokens);
      if (p.english) out += '<div class="prompt-e">' + esc(p.english) + '</div>';
      if (p.tokens && !state.hinted && !state.grade && !opts.glossOpen) {
        out +=
          '<button type="button" class="linkish" data-act="hint">Show the word-by-word gloss</button>';
      }
      return out;
    }

    function answerText(ex) {
      const a = ex.answer;
      if (a.kind === 'typed') return a.accepted[0];
      if (a.kind === 'choice') return (ex.choices.find((c) => c.id === a.correct) || {}).text;
      return '';
    }

    const verdictText = (v) =>
      opts.verdictText ? opts.verdictText(v, results.length) : VERDICT[v];
    const diagnosisText = (d) => (opts.diagnosisText ? opts.diagnosisText(d) : d.message);

    function multiHtml(ex) {
      const a = ex.answer;
      const done = !!state.grade;
      return (
        '<div class="choices multi" role="group" aria-label="Choose every one that fits">' +
        ex.choices
          .map((c, k) => {
            const on = state.multi.includes(c.id);
            const right = a.correct.includes(c.id);
            let cls = c.liraasa ? 'lw' : '';
            if (done && right) cls += ' right';
            if (done && on && !right) cls += ' wrong';
            return (
              '<button type="button" class="' +
              cls +
              '" data-multi="' +
              esc(c.id) +
              '" aria-pressed="' +
              on +
              '"' +
              (done ? ' disabled' : '') +
              (c.liraasa ? ' lang="x-liraasa"' : '') +
              '><span class="key" aria-hidden="true">' +
              (k + 1) +
              '</span>' +
              esc(c.text) +
              (done && right ? '<span class="sr-only"> (fits)</span>' : '') +
              '</button>'
            );
          })
          .join('') +
        '</div>'
      );
    }

    function inputHtml(ex) {
      const a = ex.answer;
      const done = !!state.grade;
      const dis = done ? ' disabled' : '';
      if (a.kind === 'multi') return multiHtml(ex);
      if (a.kind === 'choice' || (a.kind === 'typed' && state.choiceMode && ex.choices)) {
        const correctId = a.kind === 'choice' ? a.correct : 'answer';
        return (
          '<div class="choices" role="group" aria-label="Choices">' +
          ex.choices
            .map((c, k) => {
              let cls = c.liraasa ? 'lw' : '';
              if (done && c.id === correctId) cls += ' right';
              if (done && c.id === state.choice && c.id !== correctId) cls += ' wrong';
              return (
                '<button type="button" class="' +
                cls +
                '" data-choice="' +
                esc(c.id) +
                '" aria-pressed="' +
                (state.choice === c.id) +
                '"' +
                dis +
                (c.liraasa ? ' lang="x-liraasa"' : '') +
                '>' +
                '<span class="key" aria-hidden="true">' +
                (k + 1) +
                '</span>' +
                esc(c.text) +
                '</button>'
              );
            })
            .join('') +
          '</div>'
        );
      }
      if (a.kind === 'typed') {
        const en = a.lang === 'english';
        return (
          '<input type="text" id="exInput" autocomplete="off" autocapitalize="off" spellcheck="false" ' +
          'aria-label="' +
          (en ? 'Your answer in English' : 'Your answer in Liraasa') +
          '" class="' +
          (en ? 'en-in' : '') +
          '"' +
          (en ? '' : ' lang="x-liraasa"') +
          ' value="' +
          esc(state.typed) +
          '"' +
          dis +
          ' />' +
          (ex.choices && !done
            ? '<p><button type="button" class="linkish" data-act="choices">Show choices instead</button></p>'
            : '')
        );
      }
      if (a.kind === 'order') {
        const used = new Set(state.order);
        const tile = (t) => a.tiles.find((x) => x.id === t);
        return (
          '<div class="tiles answer" role="group" aria-label="Your answer, in order">' +
          (state.order.length === 0
            ? '<span class="en">Choose tiles below, in order.</span>'
            : '') +
          state.order
            .map(
              (id, k) =>
                '<button type="button" lang="x-liraasa" data-unpick="' +
                k +
                '" aria-label="Remove ' +
                esc(tile(id).text) +
                '"' +
                dis +
                '>' +
                esc(tile(id).text) +
                '</button>',
            )
            .join('') +
          '</div><div class="tiles" role="group" aria-label="Tiles">' +
          a.tiles
            .map(
              (t) =>
                '<button type="button" lang="x-liraasa" data-tile="' +
                esc(t.id) +
                '"' +
                (used.has(t.id) || done ? ' disabled' : '') +
                '>' +
                esc(t.text) +
                '</button>',
            )
            .join('') +
          '</div>'
        );
      }
      // pairs
      const paired = new Set(Object.keys(state.pairs));
      const takenRight = new Set(Object.values(state.pairs));
      const num = (id) => Object.keys(state.pairs).indexOf(id) + 1;
      const right = (r) => {
        const l = Object.keys(state.pairs).find((k) => state.pairs[k] === r.id);
        let cls = '';
        if (done) cls = a.pairs[l] === r.id ? 'right' : l ? 'wrong' : '';
        return (
          '<button type="button" class="' +
          cls +
          (takenRight.has(r.id) ? ' done' : '') +
          '" data-right="' +
          esc(r.id) +
          '"' +
          dis +
          '>' +
          (l ? '<span class="key">' + num(l) + '</span>' : '') +
          esc(r.text) +
          '</button>'
        );
      };
      return (
        '<div class="pairs"><div class="col" role="group" aria-label="Words">' +
        a.left
          .map(
            (l) =>
              '<button type="button" class="lw' +
              (paired.has(l.id) ? ' done' : '') +
              '" lang="x-liraasa" data-left="' +
              esc(l.id) +
              '" aria-pressed="' +
              (state.pick === l.id) +
              '"' +
              dis +
              '>' +
              (paired.has(l.id) ? '<span class="key">' + num(l.id) + '</span>' : '') +
              esc(l.text) +
              '</button>',
          )
          .join('') +
        '</div><div class="col" role="group" aria-label="Meanings">' +
        a.right.map(right).join('') +
        '</div></div>'
      );
    }

    function feedbackHtml() {
      const g = state.grade;
      if (!g) return '';
      const items = g.diagnoses
        .map((d) => {
          const link = d.link
            ? ' <button type="button" class="linkish" data-ref="' +
              esc(d.link.kind + ':' + d.link.id) +
              '">' +
              (d.link.kind === 'concept' ? 'See the rule' : 'See the word') +
              '</button>'
            : '';
          return '<li>' + esc(diagnosisText(d)) + link + '</li>';
        })
        .join('');
      const show =
        g.verdict !== 'correct' && g.expected
          ? '<div>Answer: <span class="lw" lang="x-liraasa">' + esc(g.expected) + '</span></div>'
          : '';
      return (
        '<div class="feedback ' +
        g.verdict +
        '"><div class="verdict">' +
        esc(verdictText(g.verdict)) +
        '</div>' +
        show +
        (items ? '<ul>' + items + '</ul>' : '') +
        '</div>'
      );
    }

    function render() {
      const ex = state.ex;
      const done = !!state.grade;
      const pct = Math.round((i / exercises.length) * 100);
      host.innerHTML =
        '<div class="inner">' +
        '<div class="lrow" style="justify-content:space-between"><h2 tabindex="-1">' +
        esc(opts.title) +
        '</h2>' +
        '<span class="src">' +
        (i + 1) +
        ' / ' +
        exercises.length +
        '</span></div>' +
        '<div class="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
        pct +
        '"><i style="width:' +
        pct +
        '%"></i></div>' +
        '<div class="ex" data-type="' +
        ex.type +
        '">' +
        '<div class="instr">' +
        esc(ex.instruction) +
        (opts.badge ? ' ' + opts.badge(ex) : '') +
        '</div>' +
        promptHtml(ex) +
        inputHtml(ex) +
        feedbackHtml() +
        '<div class="ex-foot">' +
        (done
          ? '<button type="button" class="btn btn-primary" data-act="next">' +
            (i + 1 < exercises.length ? 'Next' : 'Finish') +
            ' <span class="kbd">Enter</span></button>'
          : '<button type="button" class="btn btn-primary" data-act="check">Check <span class="kbd">Enter</span></button>' +
            '<button type="button" class="btn btn-quiet" data-act="skip">I don’t know</button>') +
        '<span class="spacer"></span><button type="button" class="btn btn-quiet" data-act="exit">Leave <span class="kbd">Esc</span></button>' +
        '</div></div></div>';
      const input = host.querySelector('#exInput');
      if (input && !done) {
        input.addEventListener('input', () => (state.typed = input.value));
        input.focus();
      } else if (done) {
        const next = host.querySelector('[data-act="next"]');
        if (next) next.focus();
      } else {
        const first = host.querySelector(
          '.choices button, .tiles button:not([disabled]), .pairs button',
        );
        if (
          first &&
          state.order.length === 0 &&
          Object.keys(state.pairs).length === 0 &&
          !state.choice
        )
          first.focus();
      }
    }

    function response() {
      const a = state.ex.answer;
      if (a.kind === 'choice') return state.choice ? { kind: 'choice', id: state.choice } : null;
      if (a.kind === 'typed') {
        if (state.choiceMode) {
          const c = state.ex.choices.find((x) => x.id === state.choice);
          return c ? { kind: 'typed', text: c.text } : null;
        }
        return state.typed.trim() ? { kind: 'typed', text: state.typed } : null;
      }
      if (a.kind === 'order')
        return state.order.length ? { kind: 'order', ids: state.order.slice() } : null;
      if (a.kind === 'multi')
        return state.multi.length ? { kind: 'multi', ids: state.multi.slice() } : null;
      return Object.keys(state.pairs).length === a.left.length
        ? { kind: 'pairs', pairs: { ...state.pairs } }
        : null;
    }

    function check(giveUp) {
      if (state.grade) return;
      let r = response();
      if (!r && !giveUp) {
        announce('Answer first, or choose “I don’t know”.');
        return;
      }
      const ms = Date.now() - state.started;
      let g;
      if (!r) {
        g = {
          verdict: 'wrong',
          score: 0,
          expected: L.gradeExercise(opts.gctx, state.ex, emptyFor(state.ex)).expected,
          diagnoses: [],
          rating: 1,
        };
      } else {
        g = opts.grade ? opts.grade(state.ex, r, ms) : L.gradeExercise(opts.gctx, state.ex, r, ms);
      }
      // help lowers the rating: a hint or the easier choice mode is not full recall
      if ((state.hinted || state.choiceMode) && g.rating > 2) g = { ...g, rating: 2 };
      state.grade = g;
      results.push({ ex: state.ex, grade: g, ms });
      // a miss comes back once, a few exercises later
      if (opts.requeue && g.verdict !== 'correct' && !again.has(state.ex.id)) {
        again.add(state.ex.id);
        exercises.splice(Math.min(i + 4, exercises.length), 0, state.ex);
      }
      if (opts.onAnswer) opts.onAnswer(state.ex, g, ms);
      render();
      announce(
        verdictText(g.verdict) +
          ' ' +
          (g.verdict !== 'correct' ? 'Answer: ' + g.expected + '. ' : '') +
          g.diagnoses.map(diagnosisText).join(' '),
      );
    }

    function emptyFor(ex) {
      const a = ex.answer;
      if (a.kind === 'choice') return { kind: 'choice', id: '' };
      if (a.kind === 'typed') return { kind: 'typed', text: '' };
      if (a.kind === 'order') return { kind: 'order', ids: [] };
      if (a.kind === 'multi') return { kind: 'multi', ids: [] };
      return { kind: 'pairs', pairs: {} };
    }

    function next() {
      i += 1;
      if (i >= exercises.length) {
        teardown();
        opts.onDone(results);
        return;
      }
      fresh();
      render();
      const h = host.querySelector('h2');
      if (h && opts.focusTitle) h.focus();
    }

    async function play() {
      if (!state.ex.audio || !opts.playAudio) return;
      opts.playAudio(state.ex.audio);
    }

    function onClick(e) {
      const b = e.target.closest('button');
      if (!b || !host.contains(b)) return;
      const act = b.dataset.act;
      if (b.dataset.ref && opts.openRef) {
        const [kind, ...rest] = b.dataset.ref.split(':');
        opts.openRef({ kind, id: rest.join(':') });
        return;
      }
      if (act === 'check') return check(false);
      if (act === 'skip') return check(true);
      if (act === 'next') return next();
      if (act === 'exit') {
        teardown();
        return opts.onExit(results);
      }
      if (act === 'hint') {
        state.hinted = true;
        return render();
      }
      if (act === 'choices') {
        state.choiceMode = true;
        return render();
      }
      if (act === 'play') return play();
      if (state.grade) return;
      if (b.dataset.choice !== undefined) {
        state.choice = b.dataset.choice;
        return render();
      }
      if (b.dataset.multi !== undefined) {
        toggleMulti(b.dataset.multi);
        return;
      }
      if (b.dataset.tile !== undefined) {
        state.order.push(b.dataset.tile);
        render();
        const nextTile = host.querySelector('.tiles:not(.answer) button:not([disabled])');
        (nextTile || host.querySelector('[data-act="check"]')).focus();
        return;
      }
      if (b.dataset.unpick !== undefined) {
        state.order.splice(Number(b.dataset.unpick), 1);
        return render();
      }
      if (b.dataset.left !== undefined) {
        delete state.pairs[b.dataset.left];
        state.pick = b.dataset.left;
        render();
        const r = host.querySelector('.pairs [data-right]:not(.done)');
        if (r) r.focus();
        return;
      }
      if (b.dataset.right !== undefined && state.pick) {
        for (const k of Object.keys(state.pairs))
          if (state.pairs[k] === b.dataset.right) delete state.pairs[k];
        state.pairs[state.pick] = b.dataset.right;
        state.pick = null;
        render();
        const l = host.querySelector('.pairs [data-left]:not(.done)');
        (l || host.querySelector('[data-act="check"]')).focus();
      }
    }

    function onKey(e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const typing = e.target && e.target.id === 'exInput';
      if (e.key === 'Escape') {
        e.preventDefault();
        teardown();
        opts.onExit(results);
        return;
      }
      if (e.key === 'Enter') {
        const btn = e.target.closest ? e.target.closest('button') : null;
        // Enter on a tile, pair or unselected choice acts on it; on the selected choice it checks
        if (
          btn &&
          !btn.dataset.act &&
          !(btn.dataset.choice !== undefined && btn.dataset.choice === state.choice)
        )
          return;
        e.preventDefault();
        if (state.grade) next();
        else check(false);
        return;
      }
      if (typing) return;
      const a = state.ex.answer;
      if (/^[1-9]$/.test(e.key) && !state.grade && a.kind === 'multi') {
        const c = state.ex.choices[Number(e.key) - 1];
        if (c) toggleMulti(c.id);
        return;
      }
      if (/^[1-9]$/.test(e.key) && !state.grade && (a.kind === 'choice' || state.choiceMode)) {
        const c = state.ex.choices[Number(e.key) - 1];
        if (c) {
          state.choice = c.id;
          render();
          host.querySelector('[data-choice="' + CSS.escape(c.id) + '"]').focus();
        }
        return;
      }
      if ((e.key === 'p' || e.key === 'P') && state.ex.audio) play();
      if (e.key === 'Backspace' && a.kind === 'order' && !state.grade && state.order.length) {
        state.order.pop();
        render();
      }
    }

    function toggleMulti(id) {
      state.multi = state.multi.includes(id)
        ? state.multi.filter((x) => x !== id)
        : [...state.multi, id];
      render();
      const el = host.querySelector('[data-multi="' + CSS.escape(id) + '"]');
      if (el) el.focus();
    }

    function teardown() {
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    }

    host.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    fresh();
    render();
    const h = host.querySelector('h2');
    if (h && !host.querySelector('#exInput')) h.focus();
    return { stop: teardown };
  };
})(typeof window !== 'undefined' ? window : globalThis);
