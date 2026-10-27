/**
 * The rulings, out of the guide: the guide carries an index from each ruling
 * to the part that teaches it, and every ruling verbatim is written beside it
 * as Markdown (`<outName>_Rulings.md`), governance and legacy rules included.
 */
import { GOVERNANCE, LEGACY } from './chapters';
import type { Lexicon, Ruling } from './data';
import { badge, esc, h3, p } from './html';

/** Every ruling set the lexicon carries, newest first, with its edition. */
export function rulingSets(lex: Lexicon): [string, readonly Ruling[]][] {
  return [
    ['4.0', lex.rulings_4_0 ?? []],
    ['3.6', lex.rulings_3_6 ?? []],
    ['3.5', lex.rulings_3_5 ?? []],
    ['3.4', lex.rulings_3_4 ?? []],
    ['3.3', lex.rulings_3_3 ?? []],
    ['3.2', lex.rulings_3_2 ?? []],
    ['3.0', lex.rulings_3_0 ?? []],
    ['2.5', lex.rulings_2_5 ?? []],
    ['2.3', lex.rulings_2_3 ?? []],
    ['2.2', lex.rulings_2_2 ?? []],
    ['2.1', lex.rulings_2_1 ?? []],
    ['2.0', lex.rulings_2_0 ?? []],
    ['1.2', lex.rulings_1_2],
    ['1.0', lex.rulings_1_0],
    ['0.8', lex.rulings_0_8_carried],
  ];
}

export interface RenderedPart {
  /** "3. Words", as the contents list shows it. */
  title: string;
  html: string;
}

/**
 * Where each ruling is taught: the first part whose page shows its badge.
 * A ruling no part shows is listed as reference-only.
 */
export function rulingIndex(lex: Lexicon, parts: readonly RenderedPart[], file: string): string {
  const homes = new Map<string, string[]>();
  const elsewhere: string[] = [];
  const superseded: string[] = [];
  for (const [edition, rs] of rulingSets(lex)) {
    for (const r of rs) {
      const id = `${edition}:${r.id}`;
      if (GOVERNANCE.includes(id) || LEGACY.includes(id)) continue;
      // kept, never reworded, and not taught: the newer ruling is (2.2)
      if (r.superseded_by !== undefined) {
        superseded.push(`[[${id}]] by [[${r.superseded_by}]]`);
        continue;
      }
      for (const s of r.superseded_in_part ?? [])
        superseded.push(`[[${id}]] in part (“${s.clause}”) by [[${s.by}]]; the rest stands`);
      const home = parts.find((x) => x.html.includes(`title="Ruling ${id}"`));
      if (home === undefined) {
        elsewhere.push(id);
        continue;
      }
      homes.set(home.title, [...(homes.get(home.title) ?? []), id]);
    }
  }
  const rows = parts
    .filter((x) => homes.has(x.title))
    .map(
      (x) =>
        `<li><strong>${esc(x.title)}</strong> ${(homes.get(x.title) ?? []).map(badge).join(' ')}</li>`,
    )
    .join('');
  return `${h3('Where each ruling is taught')}
<ul class="ruling-index">${rows}</ul>
${superseded.length === 0 ? '' : p(`Superseded, kept as ruled and not followed: ${superseded.join('; ')}.`)}
${p(`Reference only: ${elsewhere.map((id) => `[[${id}]]`).join(' ')}. Every ruling, verbatim, with the project and legacy rulings, is in ${file}.`)}`;
}

/** Every ruling verbatim, as Markdown, newest edition first. */
export function rulingsMarkdown(
  lex: Lexicon,
  title: string,
  legacy: { old: string; replacement: string }[],
): string {
  const lines = [
    `# ${title}: every ruling`,
    '',
    `Verbatim from the Liraasa ${lex.version} lexicon, newest edition first. Ruling ids are edition-qualified: 0.8:G7 and 1.0:G7 are different rulings.`,
    '',
  ];
  const kind = (id: string): string =>
    GOVERNANCE.includes(id) ? ' (project)' : LEGACY.includes(id) ? ' (reading older texts)' : '';
  for (const [edition, rs] of rulingSets(lex)) {
    lines.push(`## Rulings ${edition}`, '');
    for (const r of rs) {
      const id = `${edition}:${r.id}`;
      lines.push(`### ${id}: ${r.topic}${kind(id)}`, '');
      if (r.superseded_by !== undefined) {
        lines.push(
          `**Superseded by ${r.superseded_by}.** Kept as it was ruled; follow ${r.superseded_by}.`,
          '',
        );
      }
      for (const s of r.superseded_in_part ?? []) {
        lines.push(
          `**In part superseded by ${s.by}:** its clause “${s.clause}” is replaced; the rest stands.`,
          '',
        );
      }
      lines.push(r.ruling, '');
      if (r.refines !== undefined && r.refines.length > 0) {
        lines.push(`Refines ${r.refines.join(', ')}.`, '');
      }
      if (r.supersedes !== undefined && r.supersedes.length > 0) {
        lines.push(`Supersedes ${r.supersedes.join(', ')}.`, '');
      }
      for (const [l, e] of r.examples ?? []) lines.push(e === '' ? `- *${l}*` : `- *${l}* — ${e}`);
      if ((r.examples ?? []).length > 0) lines.push('');
    }
  }
  lines.push(
    '## Reading older texts',
    '',
    'Retired and respelled roots, and what replaces them (1.0:G19). A pre-1.0 text is read with the 0.8 lexicon.',
    '',
    ...legacy.map((l) => `- ${l.old} → ${l.replacement}`),
    '',
  );
  return lines.join('\n');
}
