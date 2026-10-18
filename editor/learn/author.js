/* Learn: the author's tools (Learn Phase 6, ADR-0015).
 *
 *   Gaps        the curriculum validator, with candidate examples to confirm
 *   Curriculum  core/advanced, pins, hand-written explanations and mnemonics
 *   Rulings     which concepts a ruling belongs to; rulings left out
 *   Lessons     custom lessons that sit after any node of the path
 *   Audio       recordings attached to a word or a sentence, by id or key
 *   Roots       rename or retire a root: impact preview, then a change record
 *
 * Overrides are edited as a draft (kept in the browser) and downloaded as
 * data/lessons/overrides.json for the repository. Root changes are kept as
 * change records, replayed at every load until they are exported as a
 * changeset and built into a release. Nothing here writes the lexicon file.
 */
(function (root) {
  'use strict';
  const U = (root.LiraasaLearnUI = root.LiraasaLearnUI || {});
  let tab = 'gaps';
  let rootsState = { query: '', id: null, preview: null, mode: 'rename' };
  let curQuery = '';
  let audioQuery = '';
  let editing = null;

  const clone = (x) => JSON.parse(JSON.stringify(x));

  /** Open the Roots tool on one root (from a study card). */
  U.openAuthorRoots = function openAuthorRoots(id) {
    tab = 'roots';
    rootsState = { ...rootsState, id, preview: null };
  };

  U.renderAuthor = function renderAuthor(host, api) {
    const A = api.A;
    const L = A.L;
    const { esc, lira, itemLink, refBtn } = api;
    const draft = () => clone(A.draft || A.overrides);

    async function commit(next, message) {
      await U.setDraftOverrides(next);
      api.save();
      draw();
      if (message) announce(message);
    }

    function announce(text) {
      const live = document.getElementById('learnLive');
      if (live) {
        live.textContent = '';
        setTimeout(() => (live.textContent = text), 30);
      }
    }

    function search(q, filter, limit) {
      const s = q.trim().toLowerCase();
      if (s.length < 2) return [];
      const out = [];
      for (const it of A.data.items.values()) {
        if (filter && !filter(it)) continue;
        const sp = it.spelling.toLowerCase();
        const score =
          sp === s ? 0 : sp.startsWith(s) ? 1 : it.meaning.toLowerCase().includes(s) ? 2 : -1;
        if (score >= 0) out.push({ it, score });
      }
      return out
        .sort((a, b) => a.score - b.score || a.it.spelling.localeCompare(b.it.spelling))
        .slice(0, limit || 20)
        .map((x) => x.it);
    }

    /* ----------------------------------------------------------- tabs */

    const TABS = [
      ['gaps', 'Gaps'],
      ['curriculum', 'Curriculum'],
      ['rulings', 'Rulings'],
      ['lessons', 'Lessons'],
      ['audio', 'Audio'],
      ['roots', 'Roots'],
    ];

    function head() {
      return (
        '<h2 tabindex="-1">Author</h2><p class="lede">Your curriculum, kept apart from the lexicon and keyed by id. ' +
        (A.draft
          ? '<strong>Draft in this browser.</strong> <button type="button" class="btn" data-a="download-overrides">Download overrides.json</button> <button type="button" class="btn btn-quiet" data-a="discard">Discard draft</button>'
          : 'Using data/lessons/overrides.json as built.') +
        '</p><div class="tabs" role="tablist">' +
        TABS.map(
          (t) =>
            '<button type="button" role="tab" aria-selected="' +
            (tab === t[0]) +
            '" data-tab="' +
            t[0] +
            '">' +
            t[1] +
            '</button>',
        ).join('') +
        '</div>'
      );
    }

    /* ----------------------------------------------------------- gaps */

    function gapsTab() {
      const gaps = L.validateCurriculum(A.data, A.graph, A.overrides);
      const groups = new Map();
      for (const g of gaps) {
        const k = g.severity + '|' + g.code;
        groups.set(k, (groups.get(k) || []).concat(g));
      }
      const order = ['error', 'warn', 'note'];
      const keys = [...groups.keys()].sort(
        (a, b) => order.indexOf(a.split('|')[0]) - order.indexOf(b.split('|')[0]),
      );
      let html =
        '<p>' +
        gaps.filter((g) => g.severity === 'error').length +
        ' errors · ' +
        gaps.filter((g) => g.severity === 'warn').length +
        ' warnings · ' +
        gaps.filter((g) => g.severity === 'note').length +
        ' notes</p>';
      for (const k of keys) {
        const [sev, code] = k.split('|');
        const list = groups.get(k);
        const shown = code === 'root-no-examples' ? list.slice(0, 25) : list;
        html +=
          '<details class="lcard"' +
          (sev === 'note' ? '' : ' open') +
          '><summary><strong class="gap-' +
          sev +
          '">' +
          esc(sev) +
          '</strong> ' +
          esc(code) +
          ' (' +
          list.length +
          ')</summary>';
        for (const g of shown) {
          html +=
            '<div style="margin:8px 0"><span class="src">' +
            esc(g.ref) +
            '</span> ' +
            esc(g.message);
          if (code === 'concept-no-examples' && g.ref.startsWith('rule:')) {
            const ref = g.ref.slice(5);
            const cands = L.candidateExamples(A.data, A.src.context, ref);
            if (cands.length) {
              html +=
                '<div style="margin:6px 0 0 1em">' +
                cands
                  .map(
                    (c) =>
                      '<div>' +
                      lira(c.example.liraasa) +
                      ' <span class="en">' +
                      esc(c.example.english || '') +
                      '</span> <button type="button" class="btn" data-a="confirm-example" data-ref="' +
                      esc(ref) +
                      '" data-key="' +
                      esc(c.example.key) +
                      '">Illustrates it</button></div>',
                  )
                  .join('') +
                '</div>';
            }
          }
          html += '</div>';
        }
        if (shown.length < list.length)
          html +=
            '<p class="en">… and ' +
            (list.length - shown.length) +
            ' more (npm run learn:report lists all).</p>';
        html += '</details>';
      }
      return html;
    }

    /* ----------------------------------------------------- curriculum */

    function curriculumTab() {
      const o = A.overrides;
      const pins = o.pins
        .map(
          (id, i) =>
            '<li>' +
            nodeLabel(id) +
            ' <button type="button" class="btn btn-quiet" data-a="pin-up" data-i="' +
            i +
            '" aria-label="Move up">↑</button><button type="button" class="btn btn-quiet" data-a="unpin" data-id="' +
            esc(id) +
            '">Unpin</button></li>',
        )
        .join('');
      const hits = search(curQuery, null, 15);
      const concepts =
        curQuery.trim().length >= 2
          ? [...A.data.concepts.values()]
              .filter((c) => c.title.toLowerCase().includes(curQuery.trim().toLowerCase()))
              .slice(0, 8)
          : [];
      const row = (id, label, nodeId) => {
        const level = o.levels[id] || '';
        const note = o.notes[id] || {};
        const pinned = o.pins.includes(nodeId);
        return (
          '<div class="lcard"><div class="lrow" style="justify-content:space-between"><div>' +
          label +
          '</div><div class="lrow">' +
          '<label>Level <select data-a="level" data-id="' +
          esc(id) +
          '"><option value="">derived</option><option value="core"' +
          (level === 'core' ? ' selected' : '') +
          '>core</option><option value="advanced"' +
          (level === 'advanced' ? ' selected' : '') +
          '>advanced</option></select></label>' +
          (A.graph.nodes.has(nodeId)
            ? '<button type="button" class="btn" data-a="' +
              (pinned ? 'unpin' : 'pin') +
              '" data-id="' +
              esc(nodeId) +
              '">' +
              (pinned ? 'Unpin' : 'Pin early') +
              '</button>'
            : '') +
          '</div></div>' +
          '<form class="lform" data-a="note" data-id="' +
          esc(id) +
          '" style="margin-top:8px">' +
          '<label>Explanation (Markdown, [[id]] links)<textarea name="explanation" rows="2">' +
          esc(note.explanation || '') +
          '</textarea></label>' +
          '<label>Mnemonic<input name="mnemonic" value="' +
          esc(note.mnemonic || '') +
          '"></label>' +
          '<div><button class="btn" type="submit">Save note</button></div></form></div>'
        );
      };
      return (
        '<h3>Pinned to the front of the path</h3>' +
        (pins ? '<ol>' + pins + '</ol>' : '<p class="en">Nothing pinned.</p>') +
        '<h3>Find a word or a concept</h3><input class="lsearch" data-a="cur-search" placeholder="Spelling, meaning or concept…" value="' +
        esc(curQuery) +
        '" aria-label="Find a word or a concept">' +
        hits
          .map((it) =>
            row(
              it.id,
              itemLink(it.id) + ' <span class="pill">' + esc(it.theme) + '</span>',
              'root:' + it.id,
            ),
          )
          .join('') +
        concepts
          .map((c) => row(c.id, refBtn('concept', c.id, esc(c.title)), 'concept:' + c.id))
          .join('')
      );
    }

    function nodeLabel(id) {
      const n = A.graph.nodes.get(id);
      if (!n) return '<span class="gap-error">' + esc(id) + ' (no longer exists)</span>';
      if (n.kind === 'concept')
        return refBtn('concept', n.ref, esc(A.data.concepts.get(n.ref).title));
      return itemLink(n.ref);
    }

    /* -------------------------------------------------------- rulings */

    function rulingsTab() {
      const o = A.overrides;
      const ids = [...A.data.concepts.keys()];
      const rows = [...A.data.concepts.values()]
        .filter((c) => c.kind === 'ruling')
        .map((c) => {
          const ex = o.exclude.includes(c.id);
          const linked = o.rulingLinks[c.ruleRef] !== undefined;
          return (
            '<tr><td>' +
            refBtn('concept', c.id, esc(c.title)) +
            '</td>' +
            '<td><form data-a="links" data-ref="' +
            esc(c.ruleRef) +
            '" class="lrow"><input name="links" class="lsearch" list="conceptIds" value="' +
            esc(c.prereqs.join(', ')) +
            '" aria-label="Concepts ' +
            esc(c.ruleRef) +
            ' belongs to"><button class="btn" type="submit">Save</button>' +
            (linked
              ? '<button type="button" class="btn btn-quiet" data-a="unlink" data-ref="' +
                esc(c.ruleRef) +
                '">Derive</button>'
              : '<span class="src">derived</span>') +
            '</form></td>' +
            '<td><label><input type="checkbox" data-a="exclude" data-id="' +
            esc(c.id) +
            '"' +
            (ex ? ' checked' : '') +
            '> leave out</label></td></tr>'
          );
        })
        .join('');
      return (
        '<p class="en">A ruling is taught after the concepts it belongs to. Comma-separated concept ids; “leave out” keeps project policy out of lessons.</p>' +
        '<datalist id="conceptIds">' +
        ids.map((id) => '<option value="' + esc(id) + '">').join('') +
        '</datalist>' +
        '<table class="tbl"><thead><tr><th>Ruling</th><th>Belongs to</th><th></th></tr></thead><tbody>' +
        rows +
        '</tbody></table>'
      );
    }

    /* -------------------------------------------------------- lessons */

    function lessonsTab() {
      const o = A.overrides;
      const list = o.lessons
        .map(
          (l) =>
            '<div class="lcard"><strong>' +
            esc(l.title) +
            '</strong> <span class="src">' +
            esc(l.id) +
            ' · after ' +
            (l.after ? nodeLabel(l.after) : 'nothing') +
            '</span>' +
            api.md(l.body) +
            '<p><button type="button" class="btn" data-a="edit-lesson" data-id="' +
            esc(l.id) +
            '">Edit</button> <button type="button" class="btn btn-quiet" data-a="delete-lesson" data-id="' +
            esc(l.id) +
            '">Delete</button></p></div>',
        )
        .join('');
      const l = editing
        ? o.lessons.find((x) => x.id === editing) || { id: editing, title: '', after: '', body: '' }
        : { id: '', title: '', after: '', body: '' };
      const units = A.graph.units;
      const afterUnit = l.after && A.graph.nodes.get(l.after) ? A.graph.nodes.get(l.after).unit : 0;
      return (
        list +
        '<h3>' +
        (editing ? 'Edit lesson' : 'New lesson') +
        '</h3><form class="lcard lform" data-a="lesson">' +
        '<label>Title<input name="title" required value="' +
        esc(l.title) +
        '"></label>' +
        '<label>After unit<select name="unit" data-a="lesson-unit">' +
        units
          .map(
            (u) =>
              '<option value="' +
              u.index +
              '"' +
              (u.index === afterUnit ? ' selected' : '') +
              '>' +
              (u.index + 1) +
              ' · ' +
              esc(u.theme || '') +
              '</option>',
          )
          .join('') +
        '</select></label>' +
        '<label>After<select name="after">' +
        (units[afterUnit] || units[0]).nodes
          .map(
            (n) =>
              '<option value="' +
              esc(n) +
              '"' +
              (n === l.after ? ' selected' : '') +
              '>' +
              esc(nodeText(n)) +
              '</option>',
          )
          .join('') +
        '</select></label>' +
        '<label style="grid-column:1/-1">Body (Markdown; write [[lx_…]] to reference a word by id, so it follows any respelling)<textarea name="body" rows="8">' +
        esc(l.body) +
        '</textarea></label>' +
        '<input type="hidden" name="id" value="' +
        esc(l.id) +
        '">' +
        '<div><button class="btn btn-primary" type="submit">Save lesson</button></div></form>'
      );
    }

    function nodeText(id) {
      const n = A.graph.nodes.get(id);
      if (!n) return id;
      if (n.kind === 'concept') return A.data.concepts.get(n.ref).title;
      const it = A.data.items.get(n.ref);
      return (n.kind === 'pattern' ? 'compounds on ' : '') + it.spelling + ' (' + it.meaning + ')';
    }

    /* ---------------------------------------------------------- audio */

    function audioTab() {
      const attached = Object.values(A.store.audio)
        .map((a) => {
          const it = A.data.items.get(a.key);
          const ex = it ? null : A.data.examples.find((e) => e.key === a.key);
          const label = it
            ? itemLink(it.id)
            : ex
              ? lira(ex.liraasa)
              : '<span class="gap-warn">' + esc(a.key) + ' (no longer in the data)</span>';
          return (
            '<tr><td>' +
            label +
            '</td><td class="src">' +
            esc(a.name) +
            '</td><td><button type="button" class="btn" data-a="play" data-key="' +
            esc(a.key) +
            '">▶ Play</button> <button type="button" class="btn btn-quiet" data-a="audio-remove" data-key="' +
            esc(a.key) +
            '">Remove</button></td></tr>'
          );
        })
        .join('');
      const s = audioQuery.trim().toLowerCase();
      const words = search(audioQuery, null, 10);
      const sentences =
        s.length >= 3
          ? A.data.examples
              .filter((e) => e.source !== 'corpus' && e.liraasa.toLowerCase().includes(s))
              .slice(0, 10)
          : [];
      const attach = (key, label) =>
        '<div class="lrow" style="margin:6px 0">' +
        label +
        ' <button type="button" class="btn" data-a="audio-attach" data-key="' +
        esc(key) +
        '">' +
        (A.store.audio[key] ? 'Replace' : 'Attach') +
        ' a recording</button></div>';
      return (
        '<p class="en">A recording is keyed by a word’s id or a sentence’s key. Listening exercises appear for an item as soon as it has one, and hide otherwise.</p>' +
        '<h3>Attached (' +
        Object.keys(A.store.audio).length +
        ')</h3>' +
        (attached
          ? '<table class="tbl"><tbody>' + attached + '</tbody></table>'
          : '<p class="en">None yet.</p>') +
        '<h3>Attach</h3><input class="lsearch" data-a="audio-search" placeholder="A word, or part of a sentence…" value="' +
        esc(audioQuery) +
        '" aria-label="Find a word or a sentence">' +
        words.map((it) => attach(it.id, itemLink(it.id))).join('') +
        sentences
          .map((e) =>
            attach(
              e.key,
              lira(e.liraasa) + ' <span class="en">' + esc(e.english || '') + '</span>',
            ),
          )
          .join('')
      );
    }

    /* ---------------------------------------------------------- roots */

    function rootsTab() {
      const st = rootsState;
      const hits = search(st.query, (it) => it.kind === 'root' || it.kind === 'compound', 12);
      let html =
        '<p class="en">Rename or retire a root. The tool checks the new spelling against the language’s own template and every existing word, shows what changes, and only then applies. Your writings are corrected, progress follows by id, and the change is kept as a record to export as a changeset.</p>' +
        '<input class="lsearch" data-a="root-search" placeholder="Find a root…" value="' +
        esc(st.query) +
        '" aria-label="Find a root">' +
        '<div style="margin:8px 0">' +
        hits
          .map(
            (it) =>
              '<button type="button" class="btn" style="margin:2px" data-a="root-pick" data-id="' +
              esc(it.id) +
              '">' +
              lira(it.spelling) +
              ' <span class="en">' +
              esc(it.meaning) +
              '</span></button>',
          )
          .join('') +
        '</div>';
      const it = st.id && A.data.items.get(st.id);
      if (it) {
        html +=
          '<div class="lcard"><div class="lbig">' +
          esc(it.spelling) +
          '</div><div class="lmeaning">' +
          esc(it.meaning) +
          '</div>' +
          '<p class="src">' +
          esc(it.id) +
          ' · ' +
          esc(it.kind) +
          ' · used in ' +
          it.usedIn.length +
          ' compounds</p>' +
          '<div class="tabs" role="tablist"><button type="button" role="tab" data-a="mode" data-mode="rename" aria-selected="' +
          (st.mode === 'rename') +
          '">Rename</button><button type="button" role="tab" data-a="mode" data-mode="retire" aria-selected="' +
          (st.mode === 'retire') +
          '">Retire</button></div>';
        if (st.mode === 'rename') {
          html +=
            (it.kind === 'compound'
              ? '<p class="gap-warn">A compound is spelled by its parts: rename a part instead.</p>'
              : '') +
            '<form class="lform" data-a="preview-rename"><label>New spelling<input name="spelling" lang="x-liraasa" autocomplete="off" required></label>' +
            '<label>Reason (required)<input name="reason" required></label><div><button class="btn" type="submit">Preview</button></div></form>';
        } else {
          const reps = search(st.repQuery || '', (x) => x.id !== it.id, 10);
          html +=
            '<p class="en">Retiring replaces this root everywhere with an existing word, usually the compound that now expresses it.</p>' +
            '<input class="lsearch" data-a="rep-search" placeholder="Find the replacement…" value="' +
            esc(st.repQuery || '') +
            '" aria-label="Find the replacement">' +
            '<div>' +
            reps
              .map(
                (x) =>
                  '<button type="button" class="btn" style="margin:2px" data-a="rep-pick" data-id="' +
                  esc(x.id) +
                  '" aria-pressed="' +
                  (st.rep === x.id) +
                  '">' +
                  lira(x.spelling) +
                  ' <span class="en">' +
                  esc(x.meaning) +
                  '</span></button>',
              )
              .join('') +
            '</div>' +
            '<form class="lform" data-a="preview-retire" style="margin-top:8px"><label>Reason (required)<input name="reason" required></label><div><button class="btn" type="submit"' +
            (st.rep ? '' : ' disabled') +
            '>Preview</button></div></form>';
        }
        html += '</div>';
      }
      const pv = st.preview;
      if (pv) {
        if (!pv.result.ok) {
          html +=
            '<div class="lcard" role="alert"><strong class="gap-error">Not applied.</strong><ul>' +
            pv.result.problems.map((p) => '<li>' + esc(p) + '</li>').join('') +
            '</ul></div>';
        } else {
          const im = pv.result.impact;
          const forms = Object.entries(im.forms);
          html +=
            '<div class="lcard"><h3 style="margin-top:0">Impact</h3>' +
            '<p>' +
            forms.length +
            ' forms change' +
            (im.compounds.length ? ', in ' + im.compounds.length + ' compounds too' : '') +
            '. ' +
            im.examples.length +
            ' sentences in the lexicon change. ' +
            pv.writings +
            ' words in your writings will be corrected. ' +
            pv.cards +
            ' of your cards follow by id.</p>' +
            (im.verbClass
              ? '<p class="gap-warn">The verb class changes: ' +
                esc(im.verbClass.from) +
                ' → ' +
                esc(im.verbClass.to) +
                '.</p>'
              : '') +
            '<table class="tbl"><tbody>' +
            forms
              .slice(0, 14)
              .map(
                ([a, b]) =>
                  '<tr><td lang="x-liraasa">' +
                  esc(a) +
                  '</td><td>→</td><td lang="x-liraasa">' +
                  esc(b) +
                  '</td></tr>',
              )
              .join('') +
            '</tbody></table>' +
            (forms.length > 14 ? '<p class="en">… and ' + (forms.length - 14) + ' more.</p>' : '') +
            (im.examples.length
              ? '<details><summary>Sentences</summary>' +
                im.examples
                  .slice(0, 20)
                  .map((x) => '<div>' + lira(x.from) + ' → ' + lira(x.to) + '</div>')
                  .join('') +
                '</details>'
              : '') +
            '<p><button type="button" class="btn btn-primary" data-a="apply-root">Apply</button> <button type="button" class="btn btn-quiet" data-a="cancel-root">Cancel</button></p></div>';
        }
      }
      if (A.changes.length) {
        html +=
          '<h3>Root changes not yet in a release (' +
          A.changes.length +
          ')</h3><div class="lcard">' +
          A.changes
            .map(
              (c) =>
                esc(
                  c.op === 'respell_root'
                    ? c.from + ' → ' + c.to
                    : c.from + ' retired → ' + ((A.data.items.get(c.to) || {}).spelling || c.to),
                ) +
                ' <span class="src">' +
                esc(c.reason) +
                '</span>',
            )
            .join('<br>') +
          '<p class="lrow"><button type="button" class="btn" data-a="export-changeset">Export changeset</button><button type="button" class="btn btn-quiet" data-a="undo-roots">Undo all</button></p>' +
          '<p class="en">To release: save the changeset into data/changes/, add it to scripts/integrate_1_2.ts, run npm run integrate:1.2, npm run validate:1.2, then npm run build:llm and npm run build:learn. Until then the songbook’s checker still knows the old spellings.</p></div>';
      }
      if (A.changeProblems && A.changeProblems.length) {
        html +=
          '<div class="lcard gap-error">' +
          A.changeProblems
            .map((p) => esc(p.change.op + ' ' + p.change.from + ': ' + p.problems.join('; ')))
            .join('<br>') +
          '</div>';
      }
      return html;
    }

    function writingsAffected(mapping) {
      try {
        const book = JSON.parse(root.localStorage.getItem('liraasa-songbook-v2') || 'null');
        return (book ? book.pieces : []).reduce(
          (n, p) => n + L.correctText(p.text || '', mapping).changed,
          0,
        );
      } catch {
        return 0;
      }
    }

    /* ----------------------------------------------------------- draw */

    function draw() {
      const body = {
        gaps: gapsTab,
        curriculum: curriculumTab,
        rulings: rulingsTab,
        lessons: lessonsTab,
        audio: audioTab,
        roots: rootsTab,
      }[tab]();
      host.innerHTML = head() + '<div role="tabpanel">' + body + '</div>';
    }

    /* -------------------------------------------------------- actions */

    host.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tab) {
        tab = b.dataset.tab;
        return draw();
      }
      const a = b.dataset.a;
      if (!a) return;
      e.stopPropagation();
      const next = draft();
      const id = b.dataset.id;
      if (a === 'download-overrides')
        return U.download('overrides.json', JSON.stringify(next, null, 1) + '\n');
      if (a === 'discard') return commit(null, 'Draft discarded.');
      if (a === 'confirm-example') {
        const ref = b.dataset.ref;
        next.rulingExamples[ref] = [
          ...new Set([...(next.rulingExamples[ref] || []), b.dataset.key]),
        ];
        return commit(next, 'Confirmed as an example of ' + ref + '.');
      }
      if (a === 'pin') {
        next.pins = [...next.pins.filter((x) => x !== id), id];
        return commit(next);
      }
      if (a === 'unpin') {
        next.pins = next.pins.filter((x) => x !== id);
        return commit(next);
      }
      if (a === 'pin-up') {
        const i = Number(b.dataset.i);
        if (i > 0) [next.pins[i - 1], next.pins[i]] = [next.pins[i], next.pins[i - 1]];
        return commit(next);
      }
      if (a === 'unlink') {
        delete next.rulingLinks[b.dataset.ref];
        return commit(next);
      }
      if (a === 'edit-lesson') {
        editing = id;
        return draw();
      }
      if (a === 'delete-lesson') {
        next.lessons = next.lessons.filter((l) => l.id !== id);
        return commit(next, 'Lesson deleted.');
      }
      if (a === 'play') return U.play(b.dataset.key);
      if (a === 'audio-attach') {
        const file = await U.pickFile('audio/*', false);
        if (!file) return;
        const key = b.dataset.key;
        await U.store.audioSet(key, file);
        A.store.audio[key] = {
          key,
          name: file.name,
          mime: file.type,
          size: file.size,
          added: Date.now(),
        };
        A.audio.add(key);
        api.save();
        draw();
        return announce('Recording attached.');
      }
      if (a === 'audio-remove') {
        const key = b.dataset.key;
        await U.store.audioDel(key);
        delete A.store.audio[key];
        // a file from the manifest still plays once the recording made here is gone
        if (!(A.files && A.files[key])) A.audio.delete(key);
        api.save();
        return draw();
      }
      if (a === 'root-pick') {
        rootsState = { query: rootsState.query, id, preview: null, mode: 'rename' };
        return draw();
      }
      if (a === 'mode') {
        rootsState.mode = b.dataset.mode;
        rootsState.preview = null;
        return draw();
      }
      if (a === 'rep-pick') {
        rootsState.rep = id;
        return draw();
      }
      if (a === 'cancel-root') {
        rootsState.preview = null;
        return draw();
      }
      if (a === 'apply-root') {
        const pv = rootsState.preview;
        if (!pv || !pv.result.ok) return;
        const corrected = U.applyRootChange(pv.change, pv.result);
        rootsState = { query: '', id: pv.change.entry, preview: null, mode: 'rename' };
        draw();
        const msg =
          pv.change.op === 'respell_root'
            ? 'Renamed ' +
              pv.change.from +
              ' → ' +
              pv.change.to +
              '. ' +
              corrected +
              ' words corrected in your writings; lessons and cards now show the new spelling.'
            : 'Retired ' + pv.change.from + '. ' + corrected + ' words corrected in your writings.';
        return announce(msg), U.flash(msg);
      }
      if (a === 'export-changeset') {
        const created = new Date().toISOString();
        const cs = {
          id: created.slice(0, 10) + '-root-changes',
          edition: A.data.edition,
          created: created.slice(0, 10),
          author: 'author',
          summary:
            'Root changes made with the Learn roots tool: ' +
            A.changes
              .map((c) => (c.op === 'respell_root' ? c.from + ' → ' + c.to : c.from + ' retired'))
              .join(', ') +
            '.',
          ops: A.changes,
        };
        return U.download(cs.id + '.json', JSON.stringify(cs, null, 1) + '\n');
      }
      if (a === 'undo-roots') {
        await U.undoRootChanges();
        return draw();
      }
    };

    host.onchange = async (e) => {
      const t = e.target;
      const a = t.dataset.a;
      if (!a) return;
      const next = draft();
      if (a === 'level') {
        if (t.value) next.levels[t.dataset.id] = t.value;
        else delete next.levels[t.dataset.id];
        return commit(next);
      }
      if (a === 'exclude') {
        next.exclude = t.checked
          ? [...new Set([...next.exclude, t.dataset.id])]
          : next.exclude.filter((x) => x !== t.dataset.id);
        return commit(next);
      }
      if (a === 'lesson-unit') {
        const form = t.closest('form');
        const u = A.graph.units[Number(t.value)];
        form.querySelector('[name="after"]').innerHTML = u.nodes
          .map((n) => '<option value="' + esc(n) + '">' + esc(nodeText(n)) + '</option>')
          .join('');
      }
    };

    host.oninput = (e) => {
      const t = e.target;
      const a = t.dataset.a;
      const keep = () => {
        draw();
        const el = host.querySelector('[data-a="' + a + '"]');
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      };
      if (a === 'cur-search') {
        curQuery = t.value;
        keep();
      } else if (a === 'audio-search') {
        audioQuery = t.value;
        keep();
      } else if (a === 'root-search') {
        rootsState.query = t.value;
        keep();
      } else if (a === 'rep-search') {
        rootsState.repQuery = t.value;
        keep();
      }
    };

    host.onsubmit = async (e) => {
      const f = e.target;
      const a = f.dataset.a;
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      const fd = new FormData(f);
      const next = draft();
      if (a === 'note') {
        const id = f.dataset.id;
        const note = {};
        if (String(fd.get('explanation')).trim())
          note.explanation = String(fd.get('explanation')).trim();
        if (String(fd.get('mnemonic')).trim()) note.mnemonic = String(fd.get('mnemonic')).trim();
        if (Object.keys(note).length) next.notes[id] = note;
        else delete next.notes[id];
        return commit(next, 'Note saved.');
      }
      if (a === 'links') {
        const ids = String(fd.get('links'))
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        next.rulingLinks[f.dataset.ref] = ids;
        return commit(next, 'Links saved.');
      }
      if (a === 'lesson') {
        const body = String(fd.get('body'));
        const refs = [...body.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
        const lesson = {
          id: String(fd.get('id')) || 'lesson-' + Date.now().toString(36),
          title: String(fd.get('title')),
          after: String(fd.get('after')),
          refs,
          body,
        };
        next.lessons = [...next.lessons.filter((l) => l.id !== lesson.id), lesson];
        editing = null;
        return commit(next, 'Lesson saved.');
      }
      if (a === 'preview-rename' || a === 'preview-retire') {
        const it = A.data.items.get(rootsState.id);
        const reason = String(fd.get('reason')).trim();
        let change;
        let result;
        if (a === 'preview-rename') {
          const spelling = String(fd.get('spelling')).trim().toLowerCase();
          result = L.respellRoot(A.lex, it.id, spelling, reason);
          change = {
            entry: it.id,
            op: 'respell_root',
            slot: 'root',
            from: it.spelling,
            to: spelling,
            addedIn: A.data.edition,
            reason,
            at: new Date().toISOString(),
            author: 'author',
          };
        } else {
          result = L.retireRoot(A.lex, it.id, rootsState.rep, reason);
          change = {
            entry: it.id,
            op: 'retire_and_replace',
            slot: 'root',
            from: it.spelling,
            to: rootsState.rep,
            addedIn: A.data.edition,
            reason,
            at: new Date().toISOString(),
            author: 'author',
          };
        }
        const cards = Object.values(L.activeProfile(A.store).cards).filter(
          (c) =>
            c.target === it.id ||
            (result.ok && result.impact.compounds.some((x) => x.id === c.target)),
        ).length;
        rootsState.preview = {
          change,
          result,
          writings: result.ok ? writingsAffected(result.impact.forms) : 0,
          cards,
        };
        draw();
        const first = host.querySelector('[data-a="apply-root"], [role="alert"]');
        if (first) first.focus();
      }
    };

    draw();
  };
})(typeof window !== 'undefined' ? window : globalThis);
