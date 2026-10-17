/* Liraasa grammar checker: the English cross-check (Phase 4).
 * Runs only when the line has its English beside it.
 *
 *   gloss drift   warn  an English content word no Liraasa word's gloss
 *                       carries, with a likely culprit: a word of the same
 *                       headword whose form says something else (the fix is
 *                       the form that does mean it). With no culprit it is a
 *                       note: English is freer than a gloss.
 *   tense         warn  English present with a past tense word, or future
 *                       English with no future word
 *   1.2:G31       note  English past with no past tense word: verse may
 *                       narrate in the present once the time is set
 *   passive       warn  passive English with no gome, unless the Liraasa
 *                       says it with a copula + adjective (self_check)
 *   calque        warn/note  the English shapes in data/checker/calques.json
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  const CONTENT_KINDS = new Set(['lexical', 'derivation', 'unused', 'motion']);

  /** All English words a gloss text gives, each with its stems. */
  function senseWords(en, texts) {
    const out = new Set();
    for (const t of texts) for (const w of en.words(t)) for (const s of en.stems(w)) out.add(s);
    return out;
  }

  const close = (a, b) =>
    a === b || (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a)));
  const meets = (cands, senses) => {
    for (const c of cands) for (const s of senses) if (close(c, s)) return true;
    return false;
  };

  function drift(ctx) {
    const { en, ix } = ctx;
    const english = en.content(ctx.english);
    if (!english.length) return [];
    const toks = ctx.words.map((w) => ({ w, senses: senseWords(en, C.glossTexts(ix, w)) }));
    const cands = english.map((e) => ({ e, cands: en.candidates(e) }));
    const unmatchedEnglish = cands.filter((c) => !toks.some((t) => meets(c.cands, t.senses)));
    const allCands = new Set(cands.flatMap((c) => [...c.cands]));
    const unmatchedLiraasa = toks.filter(
      (t) => t.w.reading && CONTENT_KINDS.has(t.w.reading.kind) && !meets(allCands, t.senses),
    );
    const out = [];
    for (const { e, cands: ec } of unmatchedEnglish) {
      // a culprit: a word whose own headword has a form that does mean e
      let culprit = null;
      let better = null;
      for (const t of unmatchedLiraasa) {
        const roots = (t.w.reading.readings || []).map((x) => x.entry).filter(Boolean);
        for (const entry of roots) {
          const forms = Object.values(entry.forms).filter((f) =>
            meets(ec, senseWords(en, [f.gloss])),
          );
          if (forms.length) {
            const mine = (t.w.reading.readings || []).find((x) => x.entry === entry);
            const family = (role) => (/^(a|na|aa)$/.test(role) ? 'adj' : role === 'v' ? 'v' : 'n');
            better = forms.find((f) => family(f.role) === family(mine.role)) || forms[0];
            culprit = t.w;
            break;
          }
        }
        if (culprit) break;
      }
      const family = (role) => (/^(a|na|aa)$/.test(role) ? 'adj' : role === 'v' ? 'v' : 'n');
      const sameKind = culprit && family(better.role) === family(culprit.reading.readings[0].role);
      if (culprit && !sameKind) {
        // the right word, said as another part of speech ("afraid" by a verb "to fear"): a note
        out.push(
          C.diagnostic({
            ...C.at(ctx, culprit),
            severity: 'note',
            rule: 'gloss drift',
            message:
              'The English has “' +
              e +
              '”; “' +
              culprit.text +
              '” says it as a ' +
              culprit.reading.readings[0].roleName +
              ' (“' +
              culprit.reading.readings[0].gloss +
              '”). ' +
              better.form +
              ' is the ' +
              better.roleName +
              '.',
          }),
        );
      } else if (culprit) {
        const r = culprit.reading.readings[0];
        out.push(
          C.diagnostic({
            ...C.at(ctx, culprit),
            severity: 'warn',
            rule: 'gloss drift',
            message:
              'The English has “' +
              e +
              '”, but “' +
              culprit.text +
              '” is the ' +
              r.roleName +
              ' of ' +
              r.root +
              ', “' +
              r.gloss +
              '”. ' +
              'The form that means “' +
              e +
              '” is ' +
              better.form +
              ' (' +
              better.roleName +
              ', “' +
              better.gloss +
              '”).',
            fix: better.form,
            autoFix: false,
          }),
        );
      } else {
        // no culprit: English is freer than a gloss (idiom, paraphrase), so only a note
        const suspects = unmatchedLiraasa.map((t) => t.w.text);
        out.push(
          C.diagnostic({
            line: ctx.no,
            start: 0,
            end: ctx.line.length,
            token: null,
            severity: 'note',
            rule: 'gloss drift',
            message:
              'The English has “' +
              e +
              '”, and no word in the line means it.' +
              (suspects.length
                ? ' Words whose gloss the English does not mention: ' + suspects.join(', ') + '.'
                : ''),
          }),
        );
      }
    }
    return out;
  }

  function tenseOf(ctx) {
    const fw = ctx.ref.small_words.function_words;
    const form = fw.columns.indexOf('form');
    const meaning = fw.columns.indexOf('meaning');
    const tenseWords = ctx.words.filter((w) => {
      const s = ctx.cls.slotOf.get(w.lower);
      return s && s.name === 'TENSE';
    });
    const kind = (w) => {
      const row = fw.rows.find((r) => r[form] === w.lower);
      const m = row ? row[meaning] : '';
      return /^past/.test(m) ? 'past' : /^future/.test(m) ? 'future' : 'present';
    };
    return tenseWords.map((w) => ({ w, kind: kind(w) }));
  }

  function tense(ctx) {
    const english = ctx.en.tense(ctx.english);
    const marks = tenseOf(ctx);
    const out = [];
    const past = marks.filter((m) => m.kind === 'past');
    // a future may also be said by a time word (futupago, deyafutu, fututi)
    const futureWord = ctx.words.some(
      (w) =>
        w.roles.has('time') && C.glossTexts(ctx.ix, w).some((g) => /future|tomorrow|soon/i.test(g)),
    );
    const future = marks
      .filter((m) => m.kind === 'future')
      .concat(futureWord ? [{ kind: 'future' }] : []);
    if (english === 'present' && past.length) {
      for (const m of past) {
        const after = ctx.line.slice(m.w.end).match(/^\s*/)[0].length;
        out.push(
          C.diagnostic({
            ...C.at(ctx, m.w),
            severity: 'warn',
            rule: 'tense',
            message:
              'The English is in the present, but “' +
              m.w.text +
              '” marks the past. Drop it, or make the English past.',
            fix: '',
            fixEnd: m.w.end + after,
            autoFix: false,
          }),
        );
      }
    } else if (english === 'past' && !past.length) {
      out.push(
        C.diagnostic({
          line: ctx.no,
          start: 0,
          end: ctx.line.length,
          token: null,
          severity: 'note',
          rule: '1.2:G31',
          message:
            'The English is in the past and the line has no past marker. Verse may narrate in the present once the time is set; otherwise add the past tense word before the verb.',
        }),
      );
    } else if (english === 'future' && !future.length) {
      out.push(
        C.diagnostic({
          line: ctx.no,
          start: 0,
          end: ctx.line.length,
          token: null,
          severity: 'warn',
          rule: 'tense',
          message:
            'The English is in the future (will, shall), but the line has no future tense word before the verb.',
        }),
      );
    }
    return out;
  }

  function passive(ctx) {
    const found = ctx.en.passives(ctx.english);
    if (!found.length) return [];
    const hasGome = ctx.words.some((w) => w.roles.has('gome'));
    const copulaAdjective = ctx.parsed.some(
      ({ s }) =>
        s.verbs.some((v) => v.type === 'copula') &&
        (s.predicateAdj.length > 0 ||
          s.complements.some(
            (c) =>
              c.head !== undefined && ctx.words.length && s.clause.words[c.head].roles.has('adj'),
          )),
    );
    // a verb glossed "to be …" carries the passive itself
    const passiveVerb = ctx.words.some((w) =>
      ((w.reading && w.reading.readings) || []).some(
        (x) => x.role === 'v' && /(^|; )to be /i.test(x.gloss),
      ),
    );
    if (hasGome || copulaAdjective || passiveVerb) return [];
    return [
      C.diagnostic({
        line: ctx.no,
        start: 0,
        end: ctx.line.length,
        token: null,
        severity: 'warn',
        rule: 'passive',
        message:
          'The English is passive (' +
          found.map((p) => '“' + p + '”').join(', ') +
          '); Liraasa marks it with gome + verb, or a copula + the adjective.',
      }),
    ];
  }

  /** The Liraasa word a calque entry needs, found by meaning. */
  function resolveNeed(ctx, spec) {
    const [kind, what] = String(spec).split(':');
    if (kind === 'valency') {
      const e = Object.entries(ctx.ref.clause.valency_operators).find(([, v]) =>
        new RegExp(what).test(v),
      );
      return e ? e[0] : null;
    }
    if (kind === 'correlative') {
      for (const [form, entries] of ctx.ix.closed)
        if (entries.some((x) => x.cls === 'correlative' && x.gloss === what)) return form;
      return null;
    }
    if (kind === 'function') {
      const fw = ctx.ref.small_words.function_words;
      const row = fw.rows.find((r) => new RegExp(what).test(r[fw.columns.indexOf('meaning')]));
      return row ? row[fw.columns.indexOf('form')] : null;
    }
    if (kind === 'preposition') {
      const sense = (ctx.ix.flags && ctx.ix.flags.preposition_sense) || {};
      return Object.keys(sense).find((p) => sense[p] === what) || null;
    }
    return null;
  }

  function calques(ctx) {
    const out = [];
    const present = new Set(ctx.words.map((w) => w.lower));
    for (const c of ctx.calques) {
      if (!new RegExp(c.english, 'i').test(ctx.english)) continue;
      const need = resolveNeed(ctx, c.needs);
      if (!need || present.has(need)) continue;
      if (c.unless && present.has(resolveNeed(ctx, c.unless))) continue;
      out.push(
        C.diagnostic({
          line: ctx.no,
          start: 0,
          end: ctx.line.length,
          token: null,
          severity: c.severity,
          rule: 'calque',
          message: c.message.replace('{word}', need) + ' (' + c.ruling + ')',
        }),
      );
    }
    return out;
  }

  C.rules.english = function englishRules(ctx) {
    if (!ctx.english || !ctx.en) return [];
    return [...drift(ctx), ...tense(ctx), ...passive(ctx), ...calques(ctx)];
  };
})(typeof window !== 'undefined' ? window : globalThis);
