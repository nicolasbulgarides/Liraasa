/**
 * The core vocabulary chapter: a full breakdown of each featured word, then a
 * reference table covering more of the productive roots.
 *
 * Everything shown is read from the lexicon. The only words built here are
 * the regular `-ti` / `-ri` inflections of a used root noun, which the parser
 * accepts by rule; derivations are shown only where canon already uses them.
 */
import { FORM_SLOTS, SLOT_BUILD, type FormSlot } from '../../src/core/config/slots';
import { verbClassOf, verbOf } from '../../src/core/morphology/sevenForms';
import { markStress, syllabify } from '../../src/core/phonetics/g2p';
import { GUIDE, type CoreGroup } from './config';
import { formOf, glossOf, isUsed, type Headword, type Index } from './data';
import {
  callout,
  calloutHtml,
  cell,
  esc,
  example,
  h3,
  h4,
  lir,
  md,
  morph,
  part,
  table,
} from './html';

const SLOT_LABEL: Record<FormSlot, string> = {
  root: 'Root noun',
  ascended: 'Ascended (sacred)',
  negative: 'Negative',
  verb: 'Verb',
  negativeAdjective: 'Negative adjective',
  adjective: 'Adjective',
  ascendedAdjective: 'Ascended adjective',
};

const VERB_CLASS_TEXT = {
  irregular: 'the one irregular verb: memorise it',
  'n-initial': 'n-initial, so R + `-nia`',
  's-initial': 's-initial, so R + `-sia`',
  'vowel-initial': 'vowel-initial, so R + `-a`',
  consonant: 'consonant-initial, so R + its first consonant + a',
} as const;

/** `lu-MI-la`, then IPA with syllable dots and the stress mark, then the count. */
export function sound(word: string): string {
  const { syllables, stressIndex } = syllabify(word);
  const ipa = syllables
    .map((syl, i) => (i === stressIndex && syllables.length > 1 ? 'ˈ' : '') + syl.phones.join(''))
    .join('.');
  return `<span class="sound"><span class="stress">${esc(markStress(word))}</span> <span class="ipa">/${esc(
    ipa,
  )}/</span> <span class="syl">${String(syllables.length)} syl.</span></span>`;
}

export function resolveCore(index: Index, ids: Map<string, string>, groups: readonly CoreGroup[]) {
  return groups.map((g) => ({
    ...g,
    words: g.ids.map((id) => {
      const spelling = ids.get(id);
      const h = spelling === undefined ? undefined : index.byRoot.get(spelling);
      if (h === undefined) throw new Error(`config: ${id} is not a headword in this lexicon`);
      return { id, h };
    }),
  }));
}

function formsTable(h: Headword): string {
  const rows = FORM_SLOTS.map((slot, i) => {
    const form = formOf(h, slot);
    const used = isUsed(h, slot);
    return [
      cell(String(i + 1), 'num'),
      cell(`${esc(SLOT_LABEL[slot])}<span class="build">${morph(SLOT_BUILD[slot])}</span>`),
      cell(lir(form, used ? 'text' : 'unused-slot'), used ? 'form' : 'form unused'),
      cell(sound(form)),
      used
        ? cell(esc(glossOf(h, slot)))
        : cell('<span class="unused-note">— unused: this slot has no meaning</span>', 'unused'),
    ];
  });
  return table(['#', 'Slot', 'Form', 'Sound', 'Meaning'], rows, { cls: 'forms' });
}

function inflectionTable(h: Headword): string {
  if (!isUsed(h, 'root')) return '';
  const g = glossOf(h, 'root').split(';')[0]?.trim() ?? '';
  const rows = [
    [h.root + 'ti', '`-ti`', `little ${g.toLowerCase()} (diminutive)`],
    [h.root + 'ri', '`-ri`', `${g.toLowerCase()}, plural`],
    [h.root + 'tiri', '`-ti` + `-ri`', `little ${g.toLowerCase()}, plural`],
  ].map(([w, s, m]) => [cell(lir(w ?? '')), cell(md(s ?? '')), cell(esc(m ?? ''))]);
  return `${h4('Regular inflections of the noun')}${table(['Word', 'Suffix', 'Reads as'], rows, {
    cls: 'compact',
  })}`;
}

function derivationBlock(index: Index, h: Headword): string {
  const ds = index.attestedDerivations(h);
  if (ds.length === 0) return '';
  const rows = ds.map((d) => [
    cell(lir(d.word)),
    cell(morph(`-${d.suffix}`)),
    cell(md(d.meaning.replace(/“([^”]+)”/, '`$1`'))),
    cell(esc(d.source)),
  ]);
  return `${h4('Derivations found in canon')}${table(
    ['Word', 'Suffix', 'Meaning', 'Source'],
    rows,
    {
      cls: 'compact',
    },
  )}`;
}

function compoundList(list: readonly Headword[], max: number): string {
  if (list.length === 0) return '<p class="muted">None.</p>';
  const shown = list.slice(0, max);
  const more = list.length - shown.length;
  return `<ul class="compounds">${shown
    .map((c) => `<li>${lir(c.root)} <span class="gloss">${esc(glossOf(c, 'root'))}</span></li>`)
    .join('')}${more > 0 ? `<li class="more">and ${String(more)} more</li>` : ''}</ul>`;
}

function compoundsBlock(index: Index, h: Headword): string {
  const side = index.compoundsBy.get(h.root) ?? { asModifier: [], asHead: [] };
  const total = side.asModifier.length + side.asHead.length;
  if (total === 0) return '';
  const sort = (xs: Headword[]) => [...xs].sort((a, b) => a.root.localeCompare(b.root));
  return `${h4(`In compounds (${String(total)})`)}
<div class="two-col">
<div><p class="col-head">As the modifier (first)</p>${compoundList(sort(side.asModifier), GUIDE.compoundsPerSide)}</div>
<div><p class="col-head">As the head (last)</p>${compoundList(sort(side.asHead), GUIDE.compoundsPerSide)}</div>
</div>`;
}

function examplesBlock(index: Index, h: Headword): string {
  const all = index.examplesFor(h);
  if (all.length === 0) return '';
  // Prefer short lines, and spread the choice across different forms.
  const sorted = [...all].sort((a, b) => a.liraasa.length - b.liraasa.length);
  const chosen: typeof all = [];
  const seenForm = new Set<string>();
  for (const e of sorted) {
    const form = FORM_SLOTS.map((s) => formOf(h, s)).find((f) =>
      e.liraasa.toLowerCase().includes(f),
    );
    if (form !== undefined && !seenForm.has(form)) {
      chosen.push(e);
      seenForm.add(form);
    }
    if (chosen.length >= GUIDE.examplesPerWord) break;
  }
  for (const e of sorted) {
    if (chosen.length >= GUIDE.examplesPerWord) break;
    if (!chosen.includes(e)) chosen.push(e);
  }
  return `${h4(`In canon (${String(all.length)} example${all.length === 1 ? '' : 's'})`)}<div class="exs">${chosen
    .map((e) => example(e.liraasa, e.english))
    .join('')}</div>`;
}

function rhymeBlock(index: Index, h: Headword): string {
  const rhymes = index.rhymesOf(h);
  if (rhymes.length === 0) return '';
  const shown = rhymes.slice(0, GUIDE.rhymesPerWord);
  const more = rhymes.length - shown.length;
  return `${h4('Rhymes')}<p class="rhymes">${shown.map((r) => lir(r)).join(' · ')}${
    more > 0 ? ` <span class="muted">and ${String(more)} more</span>` : ''
  }</p>`;
}

function card(index: Index, id: string, h: Headword): string {
  const verb = formOf(h, 'verb');
  const vclass = verbClassOf(h.root);
  const generated = verbOf(h.root);
  const verbNote =
    generated === verb
      ? `${lir(h.root)} is ${md(VERB_CLASS_TEXT[vclass])}: ${lir(verb)}.`
      : `${lir(h.root)} is ${md(VERB_CLASS_TEXT[vclass])}; the stored verb ${lir(verb)} is canon.`;
  const usedCount = FORM_SLOTS.filter((s) => isUsed(h, s)).length;
  const adjective = isUsed(h, 'adjective') ? formOf(h, 'adjective') : undefined;

  return `<article class="word-card" aria-labelledby="w-${h.root}">
<header class="word-head">
<h3 id="w-${h.root}"><span class="big">${lir(h.root)}</span><span class="word-gloss">${esc(glossOf(h, 'root'))}</span></h3>
<p class="chips"><span class="chip">${esc(h.type)}</span><span class="chip">${esc(h.domain)}</span><span class="chip">${esc(h.register)}</span><span class="chip">since ${esc(h.since)}</span><span class="chip">${String(usedCount)} of 7 slots used</span><span class="chip id">${esc(id)}</span></p>
<p class="word-sound">${sound(h.root)}</p>
</header>
${formsTable(h)}
<p class="verb-note">${verbNote}</p>
${
  adjective === undefined
    ? ''
    : calloutHtml(
        'parsing',
        `<p>Before another noun, ${lir(h.root)} does not stand bare: use its adjective ${lir(adjective)} (ADR-0011).</p>`,
      )
}
${inflectionTable(h)}
${derivationBlock(index, h)}
${compoundsBlock(index, h)}
${rhymeBlock(index, h)}
${examplesBlock(index, h)}
<p class="synonyms"><span class="col-head">English that finds it:</span> ${esc(h.english_synonyms.join(', '))}</p>
</article>`;
}

function referenceTable(index: Index, featured: Set<string>): string {
  const ranked = index.lex.headwords
    .filter((h) => h.type === 'Primal' && !featured.has(h.root))
    .map((h) => {
      const side = index.compoundsBy.get(h.root);
      return { h, n: (side?.asModifier.length ?? 0) + (side?.asHead.length ?? 0) };
    })
    .sort((a, b) => b.n - a.n || a.h.root.localeCompare(b.h.root))
    .slice(0, GUIDE.referenceCount)
    .sort((a, b) => a.h.root.localeCompare(b.h.root));

  const formCell = (h: Headword, slot: FormSlot) =>
    isUsed(h, slot)
      ? cell(`${lir(formOf(h, slot))}<span class="gloss">${esc(glossOf(h, slot))}</span>`)
      : cell(
          `<span class="unused-dash" aria-hidden="true">—</span><span class="visually-hidden">unused</span>`,
          'unused',
        );

  const rows = ranked.map(({ h, n }) => [
    cell(lir(h.root), 'form'),
    cell(esc(glossOf(h, 'root'))),
    formCell(h, 'verb'),
    formCell(h, 'adjective'),
    formCell(h, 'negative'),
    formCell(h, 'ascended'),
    cell(String(n), 'num'),
  ]);
  return table(
    ['Root', 'Meaning', 'Verb', 'Adjective', 'Negative', 'Ascended', 'Compounds'],
    rows,
    {
      cls: 'reference',
    },
  );
}

export function coreWordsPart(index: Index, ids: Map<string, string>): string {
  const groups = resolveCore(index, ids, GUIDE.coreGroups);
  const featured = new Set(groups.flatMap((g) => g.words.map((w) => w.h.root)));
  const count = featured.size;

  const body = groups
    .map(
      (g) => `<div class="core-group">${h3(g.title)}<p class="group-blurb">${md(g.blurb)}</p>
${g.words.map((w) => card(index, w.id, w.h)).join('\n')}</div>`,
    )
    .join('\n');

  const reference = `<div class="core-group">${h3('Reference: more core roots')}
<p>${md(
    `The ${String(GUIDE.referenceCount)} primal roots below are the most productive after the featured ones, ranked by how many compounds use them and listed alphabetically. Four of the seven forms are shown; the other three follow by rule (\`-asasan\`, \`-nasan\` and the root itself), and a dash marks a slot that is unused and has **no meaning**. The full forms of every headword are in the lexicon.`,
  )}</p>
${referenceTable(index, featured)}</div>`;

  return part(
    '4',
    'The core vocabulary',
    `${String(count)} words a songwriter reaches for most, each broken down completely: all seven forms with their sound, the verb rule it follows, its inflections, the compounds built on it, its rhymes and how canon uses it.`,
    `${callout(
      'caution',
      'A slot glossed “— (unused)” is shown struck through and greyed. It has **no meaning**, so never give it one and never use it in a line (0.8:R2).',
    )}${body}${reference}`,
  );
}
