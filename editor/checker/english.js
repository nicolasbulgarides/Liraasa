/* Liraasa grammar checker: reading the paired English line (Phase 4).
 *
 * Everything English-specific is data in data/checker/english.json (loaded
 * as window.LIRAASA_ENGLISH): stopwords, irregular forms, the synonym map,
 * past forms and participles. This file only applies it.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  const list = (x) =>
    new Set(
      String((x && x.forms) || x || '')
        .split(/\s+/)
        .filter(Boolean),
    );
  const table = (x) =>
    Object.fromEntries(Object.entries(x || {}).filter(([k]) => !k.startsWith('_')));
  const BE = new Set(['is', 'are', 'am', 'was', 'were', 'be', 'been', 'being']);
  const HAVE = new Set(['have', 'has', 'had']);

  function buildEnglish(E) {
    E = E || {};
    const stop = list(E.stopwords);
    const lemmas = table(E.lemmas);
    const synonyms = table(E.synonyms);
    const past = list(E.past);
    const notPast = list(E.not_past);
    const participles = list(E.participles);
    const samePast = list(E.same_past);

    /** English words, without parenthetical comments: "You may stay (you are allowed to)". */
    const words = (text) =>
      String(text)
        .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
        .toLowerCase()
        .match(/[a-z]+/g) || [];

    /** A word's possible base forms: itself, its irregular lemma, regular stems. */
    function stems(w) {
      const out = new Set([w]);
      if (lemmas[w]) out.add(lemmas[w]);
      if (w.length > 3) {
        if (w.endsWith('ies')) out.add(w.slice(0, -3) + 'y');
        if (w.endsWith('ied')) out.add(w.slice(0, -3) + 'y');
        if (w.endsWith('es')) out.add(w.slice(0, -2));
        if (w.endsWith('s') && !w.endsWith('ss')) out.add(w.slice(0, -1));
        if (w.endsWith('ed')) {
          out.add(w.slice(0, -2));
          out.add(w.slice(0, -1));
        }
        if (w.endsWith('ing')) {
          out.add(w.slice(0, -3));
          out.add(w.slice(0, -3) + 'e');
        }
      }
      return out;
    }

    /** Stems plus their synonyms: what a gloss may say for this English word. */
    function candidates(w) {
      const out = new Set();
      for (const s of stems(w)) {
        out.add(s);
        for (const x of synonyms[s] || []) out.add(x);
      }
      return out;
    }

    /** Content words of an English line. */
    function content(text) {
      return words(text).filter((w) => w.length > 1 && !stop.has(w));
    }

    /** The tense an English line is in: past, future, present, or unknown. */
    function tense(text) {
      const ws = words(text);
      if (ws.includes('will') || ws.includes('shall') || /\bgoing to\b/.test(ws.join(' ')))
        return 'future';
      for (let i = 0; i < ws.length; i += 1) {
        const w = ws[i];
        const before = ws[i - 1];
        if (w === 'was' || w === 'were' || w === 'did' || w === 'had') return 'past';
        // couldn't, didn't, wasn't: the contraction leaves "couldn" + "t"
        if (/^(couldn|didn|wasn|weren|hadn|wouldn)$/.test(w)) return 'past';
        // should have sung, must have baked: a modal + have + participle is a past
        if (w === 'have' && /^(should|could|would|must|might|may)$/.test(before || ''))
          return 'past';
        if (past.has(w) && !BE.has(before) && !HAVE.has(before)) return 'past';
        if (
          w.endsWith('ed') &&
          w.length > 3 &&
          !notPast.has(w) &&
          !BE.has(before) &&
          !HAVE.has(before)
        )
          return 'past';
      }
      // let, put, cut …: past and present are spelled alike, so the tense is unknown
      if (ws.some((w) => samePast.has(w)) && !ws.some((w) => /^(is|are|am|do|does)$/.test(w)))
        return 'unknown';
      return 'present';
    }

    /** English passives: a form of be, optionally not, then a participle. */
    function passives(text) {
      const ws = words(text);
      const out = [];
      for (let i = 0; i < ws.length; i += 1) {
        if (!BE.has(ws[i])) continue;
        let j = i + 1;
        if (ws[j] === 'not') j += 1;
        const p = ws[j];
        if (p && ((p.endsWith('ed') && !notPast.has(p)) || participles.has(p)))
          out.push(ws.slice(i, j + 1).join(' '));
      }
      return out;
    }

    return {
      words,
      stems,
      candidates,
      content,
      tense,
      passives,
      markers: table(E.markers),
      suffixes: table(E.suffixes),
      owner: table(E.pronoun_owner),
      object: table(E.pronoun_object),
    };
  }

  C.buildEnglish = buildEnglish;
})(typeof window !== 'undefined' ? window : globalThis);
