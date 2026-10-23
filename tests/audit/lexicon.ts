/* eslint-disable no-console -- a CLI, like scripts/: its output is the report */
/**
 * The grammar audit's lexicon integrity checks (Phase 3), rerunnable.
 *
 *   npx tsx tests/audit/lexicon.ts       # writes review/audit-lexicon.json
 *
 * 1. Every Liraasa text the project ships is read word by word with the
 *    editor's checker: a word it cannot read is a word missing from the
 *    lexicon (or invented). Texts: the lexicon's examples, ruling, function-word
 *    and particle examples, the corpus, the author's song, the album (read
 *    today), and the editor's sample songbook.
 * 2. Duplicate roots, duplicate meanings (two headwords whose first sense is
 *    the same), and near-homophones (roots one edit apart, the closest pairs
 *    first: a voicing swap such as p/b is the easiest to mishear in song).
 * 3. Retired spellings (legacy.migration_forms) in code and documents, with the
 *    places where they are history by design left out.
 * 4. Ascended (-asa) forms whose gloss reads nothing sacred or exalted, and
 *    roots whose meaning is sacred but whose ascended slot is empty.
 * 5. Compounds, attested image compounds and listed derivations whose parts
 *    are not headwords.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadChecker } from '../checker/loadChecker';

const LEXICON = 'data/lexicon/liraasa_2_3.json';
const lex = JSON.parse(readFileSync(LEXICON, 'utf8')) as Record<string, unknown> & {
  headwords: Head[];
  image_compounds: { attested: Head[] };
  examples: { liraasa: string; status?: string }[];
  function_words: { form: string; example?: string | null }[];
  discourse_particles: { examples: { liraasa: string }[] }[];
  morphology: { lexicalised_derivations: Record<string, string> };
  legacy: { migration_forms: Record<string, { to: string; via: string; kind: string }> };
  colors: Record<string, string>[];
};
interface Head {
  id: string;
  root: string;
  type: string;
  components: string[] | null;
  suffix?: string;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}
const UNUSED = '(unused)';
const { checker } = loadChecker();

/* 1. words the editor cannot read --------------------------------------- */
const texts: { source: string; text: string }[] = [];
lex.examples
  .filter((e) => e.status !== 'HISTORICAL')
  .forEach((e, i) => texts.push({ source: `lexicon examples[${String(i)}]`, text: e.liraasa }));
for (const [k, v] of Object.entries(lex))
  if (k.startsWith('rulings_') && Array.isArray(v))
    for (const r of v as { id: string; examples?: [string, string][]; superseded_by?: string }[])
      for (const [l] of r.examples ?? [])
        texts.push({
          source: `${k.replace('rulings_', '').replace('_', '.')}:${r.id} example`,
          text: l,
        });
for (const f of lex.function_words)
  if (f.example) texts.push({ source: `function word ${f.form}`, text: f.example });
for (const d of lex.discourse_particles)
  for (const e of d.examples) texts.push({ source: 'discourse particle example', text: e.liraasa });
const corpusDirs = ['data/corpus/songs_2_3', 'data/corpus/bumrepago_2_3'];
for (const dir of corpusDirs)
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.txt')))
    readFileSync(join(dir, f), 'utf8')
      .split('\n')
      .forEach((l, i) => {
        if (l.trim() !== '' && !l.trimStart().startsWith('#'))
          texts.push({ source: `${dir}/${f}:${String(i + 1)}`, text: l });
      });
readFileSync('data/songs/Nemelira de devi.txt', 'utf8')
  .split('\n')
  .forEach((l, i) => {
    // the English stands under each line, indented; the title is the first line
    if (l.trim() !== '' && !/^\s/.test(l) && i > 0)
      texts.push({ source: `data/songs/Nemelira de devi.txt:${String(i + 1)}`, text: l });
  });
const album = JSON.parse(readFileSync('data/corpus/album_2_0/album_current.json', 'utf8')) as {
  songs: { track: string; lines: { n: number; recorded: string; current: string | null }[] }[];
};
for (const s of album.songs)
  for (const l of s.lines)
    texts.push({
      source: `album ${s.track}:${String(l.n)} (read today)`,
      text: l.current ?? l.recorded,
    });
const page = readFileSync('editor/index.html', 'utf8');
const sample = /const SAMPLE = \[([\s\S]*?)\]\.join/.exec(page)?.[1] ?? '';
for (const m of sample.matchAll(/'([^']*)'/g))
  if ((m[1] ?? '').trim() !== '')
    texts.push({ source: 'editor sample songbook', text: m[1] ?? '' });

const unread = new Map<string, { kind: string; sources: string[] }>();
for (const t of texts) {
  for (const tok of checker.readLine(t.text)) {
    if (tok.type !== 'word') continue;
    const r = tok.reading;
    const kind = r === null || r === undefined ? 'unknown' : r.kind;
    if (kind !== 'unknown' && kind !== 'unused' && kind !== 'legacy') continue;
    const key = `${(tok.lower ?? tok.text).toLowerCase()}|${kind}`;
    const e = unread.get(key) ?? { kind, sources: [] };
    e.sources.push(t.source);
    unread.set(key, e);
  }
}
const unreadable = [...unread].map(([k, v]) => ({
  word: k.split('|')[0],
  kind: v.kind,
  count: v.sources.length,
  sources: [...new Set(v.sources)].slice(0, 6),
}));

/* 2. duplicates and near-homophones --------------------------------------- */
const heads = lex.headwords;
const roots = heads.map((h) => h.root);
const dupRoots = roots.filter((r, i) => roots.indexOf(r) !== i);
const firstSense = (g: string): string =>
  (g.split(/[;,(]/)[0] ?? '')
    .trim()
    .toLowerCase()
    .replace(/^(a|an|the|to) /, '');
const bySense = new Map<string, string[]>();
for (const h of heads) {
  const s = firstSense(h.glosses.root ?? '');
  if (s === '' || s.includes('unused')) continue;
  bySense.set(s, [...(bySense.get(s) ?? []), h.root]);
}
const dupMeanings = [...bySense]
  .filter(([, v]) => v.length > 1)
  .map(([sense, words]) => ({ sense, words }));
const dist = (a: string, b: string): number => {
  const p = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = p[0] ?? 0;
    p[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const up = p[j] ?? 0;
      p[j] = Math.min(up + 1, (p[j - 1] ?? 0) + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return p[b.length] ?? 0;
};
const VOICING = new Set([
  'pb',
  'bp',
  'td',
  'dt',
  'kg',
  'gk',
  'fv',
  'vf',
  'sz',
  'zs',
  'cj',
  'jc',
  'mn',
  'nm',
  'lr',
  'rl',
]);
const primal = heads.filter((h) => h.type === 'Primal').map((h) => h.root);
const near: { a: string; b: string; kind: string }[] = [];
for (let i = 0; i < primal.length; i += 1)
  for (let j = i + 1; j < primal.length; j += 1) {
    const a = primal[i] ?? '';
    const b = primal[j] ?? '';
    if (Math.abs(a.length - b.length) > 1 || dist(a, b) !== 1) continue;
    let kind = 'one edit';
    if (a.length === b.length) {
      const k = [...a].findIndex((c, x) => c !== b[x]);
      if (VOICING.has(`${a[k] ?? ''}${b[k] ?? ''}`)) kind = 'close sounds (voicing, m/n or l/r)';
    }
    near.push({ a, b, kind });
  }
near.sort((x, y) => (x.kind === y.kind ? 0 : x.kind.startsWith('close') ? -1 : 1));

/* 3. retired spellings in code and documents -------------------------------- */
const RETIRED = new Set(Object.keys(lex.legacy.migration_forms));
const live = new Set(heads.flatMap((h) => Object.values(h.forms)));
const ENGLISH = new Set(['mine', 'desa', 'lame', 'zella', 'nolmu']); // English words, or noise in prose
const SKIP = [
  /^data\/(lexicon|changes|source|proposals|corpus\/(legacy_0_8|songs_1_0|bumrepago_1_0|album_2_0))\//,
  /^archive\//,
  /^review\//,
  /^handoff\/liraasa_.*\.json$/,
  /^LirasaCodexLatest\//,
  /^data\/editor\//,
  /^editor\/(checker\/data|learn\/learn-(data|core))\.?/,
  /^editor\/liraasa-data\.js$/,
  /^data\/export\//,
  /^tests\/audit\//,
  /node_modules|\.venv|\.git\//,
];
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n).replace(/\\/g, '/');
    if (SKIP.some((s) => s.test(`${p}/`) || s.test(p))) return [];
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|js|html|md|json|txt|py|css)$/.test(p) ? [p] : [];
  });
const retiredHits: { file: string; words: Record<string, number> }[] = [];
for (const f of [
  ...files('editor'),
  ...files('src'),
  ...files('scripts'),
  ...files('docs'),
  ...files('data'),
  ...files('handoff'),
  ...files('tests'),
  'README.md',
  'CLAUDE.md',
]) {
  const text = readFileSync(f, 'utf8');
  const words: Record<string, number> = {};
  for (const m of text.matchAll(/\b[a-z]{3,}\b/g)) {
    const w = m[0];
    if (RETIRED.has(w) && !live.has(w) && !ENGLISH.has(w)) words[w] = (words[w] ?? 0) + 1;
  }
  if (Object.keys(words).length > 0) retiredHits.push({ file: f, words });
}

/* 4. ascended forms ----------------------------------------------------------- */
const SACRED =
  /\b(god|gods|goddess|divin|holy|sacred|heaven|heavenly|soul|spirit|prayer|pray|blessed|bless|eternal|eternity|first|ultimate|creation|cosmic|primordial|afterlife|beyond|transcend|sublime|immortal|celestial|ancestral|of all|world|saint|sanctif|grace|reborn|redeem|miracle|angel|paradise|everlasting|forever|life|death|origin|source)/i;
const ascendedPlain = heads
  .filter(
    (h) =>
      !(h.glosses.ascended ?? UNUSED).includes(UNUSED) && !SACRED.test(h.glosses.ascended ?? ''),
  )
  .map((h) => ({ word: h.forms.ascended, gloss: h.glosses.ascended }));
const SACRED_ROOT =
  /\b(god|goddess|deity|holy|sacred|prayer|pray|worship|temple|angel|heaven|soul|spirit|divine|blessing|hymn|priest|faith|psalm)\b/i;
const sacredNoAscended = heads
  .filter(
    (h) =>
      SACRED_ROOT.test(h.glosses.root ?? '') && (h.glosses.ascended ?? UNUSED).includes(UNUSED),
  )
  .map((h) => ({ word: h.root, gloss: h.glosses.root }));

/* 5. parts that are not headwords --------------------------------------------- */
const rootSet = new Set(roots);
const colourBases = new Set(lex.colors.map((c) => c['Base color']));
const badParts = [...heads, ...lex.image_compounds.attested]
  .filter((h) => h.components !== null)
  .flatMap((h) =>
    (h.components ?? [])
      .filter((p, i) => !rootSet.has(p) && !(i === 0 && colourBases.has(p)))
      .map((p) => ({ word: h.root, part: p })),
  );
const derivBases = Object.entries(lex.morphology.lexicalised_derivations)
  .map(([w, g]) => ({ word: w, base: /: ([a-z]+) \+ -([a-z]+)$/.exec(g)?.[1] ?? '' }))
  .filter(
    (d) =>
      d.base === '' || !(rootSet.has(d.base) || d.base in lex.morphology.lexicalised_derivations),
  )
  .map((d) => ({ word: d.word, part: d.base || '(gloss gives no base)' }));

const out = {
  lexicon: LEXICON,
  texts_read: texts.length,
  unreadable,
  duplicate_roots: dupRoots,
  duplicate_meanings: dupMeanings,
  near_homophones: {
    count: near.length,
    close_sounds: near.filter((n) => n.kind.startsWith('close')).length,
    pairs: near,
  },
  retired_spellings_in_files: retiredHits,
  ascended_not_sacred: ascendedPlain,
  sacred_without_ascended: sacredNoAscended,
  parts_not_headwords: [...badParts, ...derivBases],
};
writeFileSync('review/audit-lexicon.json', `${JSON.stringify(out, null, 1)}\n`, 'utf8');
console.log(
  JSON.stringify({
    texts: texts.length,
    unreadable: unreadable.length,
    duplicate_roots: dupRoots.length,
    duplicate_meanings: dupMeanings.length,
    near_homophones: near.length,
    retired_in_files: retiredHits.length,
    ascended_not_sacred: ascendedPlain.length,
    sacred_without_ascended: sacredNoAscended.length,
    parts_not_headwords: out.parts_not_headwords.length,
  }),
);
