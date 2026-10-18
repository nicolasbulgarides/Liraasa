/**
 * The treasury: the words a songwriter reaches for, as compactly as the
 * lexicon allows.
 *
 * - the core roots, each with every form it uses on one line;
 * - chosen compounds by theme, each shown with its two parts;
 * - the image-compound pattern (2.0:G40) as the engine it is: its modifiers,
 *   its heads, and pairs read by rule.
 *
 * Which words appear is set by id in `config.ts`; what they mean is read from
 * the lexicon.
 */
import { FORM_SLOTS } from '../../src/core/config/slots';
import { GUIDE } from './config';
import { firstSense, formOf, glossOf, isUsed, normGloss, type Headword, type Index } from './data';
import { cell, esc, h3, lir, p, part, table } from './html';

function byId(index: Index, id: string): Headword {
  const h = index.byId.get(id) ?? index.lex.image_compounds?.attested.find((a) => a.id === id);
  if (h === undefined) throw new Error(`config: ${id} is not a word of this lexicon`);
  return h;
}

/** Every used form of a root after the root itself: `lumiasa` Divine Light · `lumisan` bright … */
function usedForms(h: Headword): string {
  return FORM_SLOTS.filter((s) => s !== 'root' && isUsed(h, s))
    .map(
      (s) =>
        `${lir(formOf(h, s))} <span class="gloss">${esc(normGloss(firstSense(glossOf(h, s))))}</span>`,
    )
    .join(' · ');
}

function partsOf(index: Index, h: Headword): string {
  const [a, b] = h.components ?? ['', ''];
  return `${esc(index.senseOf(a))} + ${esc(index.senseOf(b))}`;
}

export function treasuryPart(index: Index, n: string): string {
  const roots = table(
    ['Root', 'Meaning', 'Its other forms'],
    GUIDE.coreRoots.map((id) => {
      const h = byId(index, id);
      return [
        cell(lir(h.root), 'form'),
        cell(esc(normGloss(firstSense(glossOf(h, 'root'))))),
        cell(usedForms(h)),
      ];
    }),
    { cls: 'roots' },
  );

  const themes = GUIDE.treasury
    .map(
      (t) => `${h3(t.title)}
<ul class="treasure">${t.ids
        .map((id) => {
          const h = byId(index, id);
          return `<li>${lir(h.root)} <span class="parts">${partsOf(index, h)}</span> ${esc(normGloss(glossOf(h, 'root')))}</li>`;
        })
        .join('')}</ul>`,
    )
    .join('\n');

  const ic = index.lex.image_compounds;
  const engine =
    ic === undefined
      ? ''
      : `${h3('The image engine')}
${p(`Any modifier below plus any head is a word, read by rule as “modifier-adjective head; head-template modifier-sense”: ${String(Object.keys(ic.modifiers).length)} × ${String(Object.keys(ic.heads).length)} = ${String(ic.capacity)} words, ${String(ic.attested.length)} of them attested with their own gloss. A listed word wins over the rule [[2.0:G40]].`)}
<p class="chips"><strong>Modifiers</strong> ${Object.entries(ic.modifiers)
          .map(
            ([id, m]) =>
              `${lir(byId(index, id).root)} <span class="gloss">${esc(m.as_modifier)}</span>`,
          )
          .join(' · ')}</p>
<p class="chips"><strong>Heads</strong> ${Object.entries(ic.heads)
          .map(
            ([id, hd]) =>
              `${lir(byId(index, id).root)} <span class="gloss">${esc(hd.template)} …</span>`,
          )
          .join(' · ')}</p>
${table(
  ['Word', 'Reading', ''],
  GUIDE.patternSamples.map(([modId, headId]) => {
    const spelling = byId(index, modId).root + byId(index, headId).root;
    const pair = index.patterns.get(spelling);
    if (pair === undefined) throw new Error(`config: ${modId} + ${headId} is not a pattern pair`);
    const clash = (index.forms.get(spelling) ?? []).some(
      (hit) => !pair.attested || hit.headword.root !== spelling,
    );
    if (clash) throw new Error(`config: the pattern pair ${spelling} collides with another form`);
    return [
      cell(lir(spelling), 'form'),
      cell(esc(normGloss(pair.reading))),
      cell(pair.attested ? 'attested' : '<em>by rule</em>'),
    ];
  }),
  { cls: 'compact' },
)}`;

  return part(
    n,
    'A treasury of words',
    'The roots that carry the imagery of the songs, compounds chosen for their beauty, and the pattern that makes a thousand more. Every word and gloss is canon.',
    `${h3('Core roots, with every form they use')}
${roots}
${themes}
${engine}`,
  );
}
