/* Grammar Lessons: The Grammar in Lessons as a room of the Training Hall.
 *
 *   contents   the twenty lessons by part, each with its "studied" mark, the
 *              next lesson to take, and the whole-sentence map at the end
 *   lesson     the welcome, the idea, the examples, what to watch out for,
 *              practice lines to type and check (or just reveal), the rules
 *              behind it (each opening its Loom lesson), and "mark studied"
 *
 * The lessons are data: written and checked against the 2.5 grammar in
 * scripts/lessons/ (npm run build:lessons), carried here in learn-data.js as
 * `course`. Studied lessons live on the Hall state (course.ts), so they travel
 * with export and import. No Liraasa here. English from strings.js.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  const S = () => U.S.courseS;
  const H = () => U.hallApi;
  const L = () => H().A.L;
  const esc = (s) => U.esc(s);
  const lira = (s) => '<span class="lw" lang="x-liraasa">' + esc(s) + '</span>';
  const course = () => H().A.P.course;

  /** `liraasa`, **bold**, *italic*: the lessons' own markup. */
  function md(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<span class="lw" lang="x-liraasa">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function head(title, lede, kicker) {
    return (
      '<header class="hall-head"><p class="kicker">' +
      esc(kicker) +
      '</p><h2 tabindex="-1">' +
      esc(title) +
      '</h2>' +
      (lede ? '<p class="hall-greeting">' + esc(lede) + '</p>' : '') +
      '</header>'
    );
  }

  /* ----------------------------------------------------------- contents */

  function contents() {
    const h = H();
    const s = S();
    const c = course();
    const all = L().courseLessons(c);
    const done = new Set(L().courseStudied(h.profile()));
    const next = L().courseNext(c, h.profile());
    const nextLesson = all.find((l) => l.n === next);
    let html =
      '<section class="hall course">' +
      head(U.S.wings.course.title, s.lede, U.S.course + ' · ' + c.edition) +
      '<div class="lcard course-next"><p>' +
      esc(s.progress(done.size, all.length)) +
      '</p>' +
      (nextLesson
        ? '<button type="button" class="btn btn-primary" data-course-open="' +
          nextLesson.n +
          '">' +
          esc(s.continueAt(nextLesson.n, nextLesson.lesson.title)) +
          ' <span aria-hidden="true">→</span></button>'
        : '<p>' + esc(s.allDone) + '</p>') +
      '</div>' +
      '<details class="lcard course-intro"><summary>' +
      esc(s.intro) +
      '</summary>' +
      c.intro.map((p) => '<p>' + md(p) + '</p>').join('') +
      '</details>';
    c.parts.forEach((part, i) => {
      html +=
        '<h3 class="course-part"><span class="kicker">' +
        esc(s.part(i + 1)) +
        '</span> ' +
        esc(part.title) +
        '</h3><ol class="course-list" role="list">';
      for (const l of all.filter((x) => x.part === i + 1)) {
        const isDone = done.has(l.n);
        html +=
          '<li><button type="button" class="course-item' +
          (isDone ? ' is-done' : '') +
          '" data-course-open="' +
          l.n +
          '"><span class="course-n" aria-hidden="true">' +
          l.n +
          '</span><span class="course-title">' +
          esc(l.lesson.title) +
          '</span>' +
          (isDone
            ? '<span class="course-done"><span aria-hidden="true">✓</span> ' +
              esc(s.studied) +
              '</span>'
            : '') +
          '</button></li>';
      }
      html += '</ol>';
    });
    html +=
      '<div class="lcard course-map"><h3>' +
      esc(s.map) +
      '</h3><p>' +
      esc(s.mapLede) +
      '</p>' +
      c.map.lines.map((l) => '<code>' + esc(l) + '</code>').join('') +
      '<p>' +
      esc(s.npLede) +
      '</p><code>' +
      esc(c.map.np) +
      '</code></div>' +
      '<div class="course-open"><h3>' +
      esc(s.open) +
      '</h3><p class="en">' +
      esc(s.openLede) +
      '</p><ul>' +
      c.open.map((o) => '<li>' + md(o) + '</li>').join('') +
      '</ul></div></section>';
    return html;
  }

  /* ------------------------------------------------------------- lesson */

  function lessonView(n) {
    const h = H();
    const s = S();
    const all = L().courseLessons(course());
    const it = all.find((l) => l.n === n);
    if (!it) return contents();
    const l = it.lesson;
    const studied = L().courseStudied(h.profile()).includes(n);
    const concepts = h.A.data.concepts;
    const rule = (r) =>
      concepts.has('rule:' + r)
        ? '<button type="button" class="linkish" data-course-rule="rule:' +
          esc(r) +
          '" aria-label="' +
          esc(s.openRule(r)) +
          '">' +
          esc(r) +
          '</button>'
        : esc(r);
    const navBtn = (k, label, arrow) =>
      all.some((x) => x.n === k)
        ? '<button type="button" class="btn" data-course-open="' +
          k +
          '">' +
          (arrow === '←' ? '<span aria-hidden="true">←</span> ' : '') +
          esc(label) +
          (arrow === '→' ? ' <span aria-hidden="true">→</span>' : '') +
          '</button>'
        : '';
    return (
      '<section class="hall course course-lesson">' +
      '<p><button type="button" class="linkish" data-course-open="0">← ' +
      esc(s.contents) +
      '</button></p>' +
      head(l.title, '', s.lesson(n) + ' · ' + s.part(it.part) + ', ' + it.partTitle) +
      '<p class="course-welcome">' +
      md(l.welcome) +
      '</p><ul class="course-points">' +
      l.points.map((p) => '<li>' + md(p) + '</li>').join('') +
      '</ul><h3>' +
      esc(s.examples) +
      '</h3><div class="course-examples">' +
      l.examples
        .map(([li, en]) => '<p>' + lira(li) + '<span class="en">' + esc(en) + '</span></p>')
        .join('') +
      '</div>' +
      (l.watch || [])
        .map(
          ([bad, why]) =>
            '<p class="course-watch"><span class="course-tag">' +
            esc(s.watch) +
            '</span> <s class="lw" lang="x-liraasa">' +
            esc(bad) +
            '</s> <span>' +
            md(why) +
            '</span></p>',
        )
        .join('') +
      '<h3>' +
      esc(s.practice) +
      '</h3>' +
      l.practice
        .map(
          ([q, a], k) =>
            '<form class="lcard course-try" data-course-check="' +
            n +
            ':' +
            k +
            '"><p id="cq-' +
            n +
            '-' +
            k +
            '">' +
            md(q) +
            '</p><div class="lrow"><label class="sr-only" for="ca-' +
            n +
            '-' +
            k +
            '">' +
            esc(s.yourAnswer) +
            '</label><input type="text" id="ca-' +
            n +
            '-' +
            k +
            '" name="answer" class="liraasa" lang="x-liraasa" autocomplete="off" spellcheck="false" aria-describedby="cq-' +
            n +
            '-' +
            k +
            '"><button type="submit" class="btn">' +
            esc(s.check) +
            '</button></div><div class="course-result" role="status"></div><details><summary>' +
            esc(s.show) +
            '</summary><p>' +
            esc(s.answer) +
            ' ' +
            lira(a) +
            '</p></details></form>',
        )
        .join('') +
      '<p class="course-rules">' +
      esc(s.rules) +
      ': ' +
      l.rules.map(rule).join(' · ') +
      '</p><div class="lrow course-foot">' +
      (studied
        ? '<p role="status">' +
          esc(s.markedStudied) +
          '</p><button type="button" class="linkish" data-course-studied="' +
          n +
          '" data-on="0">' +
          esc(s.unmark) +
          '</button>'
        : '<button type="button" class="btn btn-primary" data-course-studied="' +
          n +
          '" data-on="1">' +
          esc(s.markStudied) +
          '</button>') +
      '</div><div class="lrow course-pager">' +
      navBtn(n - 1, s.prev, '←') +
      navBtn(n + 1, s.next, '→') +
      '</div></section>'
    );
  }

  function view(args) {
    const n = args && args.lesson ? Number(args.lesson) : 0;
    return n > 0 ? lessonView(n) : contents();
  }

  /* ------------------------------------------------------------- events */

  function onClick(b) {
    const h = H();
    if (!h || h.A.view.name !== 'course') return false;
    const d = b.dataset;
    if (d.courseOpen !== undefined) {
      const n = Number(d.courseOpen);
      h.go('course', n > 0 ? { lesson: n } : {});
      return true;
    }
    if (d.courseStudied !== undefined) {
      L().setCourseStudied(h.profile(), Number(d.courseStudied), d.on === '1');
      h.save();
      h.render();
      if (d.on === '1') h.announce(S().markedStudied);
      return true;
    }
    if (d.courseRule) {
      h.go('loom', { id: d.courseRule, step: 'see' });
      return true;
    }
    return false;
  }

  function onSubmit(f) {
    const h = H();
    if (!h || h.A.view.name !== 'course' || !f.dataset.courseCheck) return false;
    const [n, k] = f.dataset.courseCheck.split(':').map(Number);
    const it = L()
      .courseLessons(course())
      .find((l) => l.n === n);
    const item = it && it.lesson.practice[k];
    if (!item) return true;
    const s = S();
    const given = new FormData(f).get('answer') || '';
    const out = f.querySelector('.course-result');
    const det = f.querySelector('details');
    if (String(given).trim() === '') {
      if (det) det.open = true;
      return true;
    }
    const r = L().checkCourseAnswer(String(given), item[1]);
    let html =
      '<p class="course-verdict is-' + r.verdict + '">' + esc(s.verdicts[r.verdict]) + '</p>';
    if (r.verdict !== 'right') {
      if (r.missing.length)
        html += '<p>' + esc(s.missing('')) + r.missing.map(lira).join(', ') + '</p>';
      if (r.extra.length) html += '<p>' + esc(s.extra('')) + r.extra.map(lira).join(', ') + '</p>';
      html += '<p class="en">' + esc(s.oneOfMany) + '</p>';
      if (det) det.open = true;
    }
    if (out) out.innerHTML = html;
    return true;
  }

  U.hall.views.course = view;
  U.hall.wings.push({ view: 'course', onClick, onSubmit });
})(typeof window !== 'undefined' ? window : globalThis);
