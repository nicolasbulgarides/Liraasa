/**
 * Candidate examples for a ruling the data gives no sentences: existing
 * sentences that use the closed words the ruling names (`ata` … `tu` for
 * "ata is 'and' only; additive 'also' is tu"). Candidates are for the author
 * to confirm into `rulingExamples`; nothing is written, and nothing new.
 */
import { linkLine, type LinkContext } from './link';
import { unique } from './text';
import type { LearnData, LearnExample } from './types';

/** Namespaces a ruling's text can name as the word it is about. */
const NAMED = new Set(['functionWord', 'pronoun', 'correlative', 'discourseParticle', 'timeWord']);

export interface Candidate {
  example: LearnExample;
  /** The entry ids the ruling names that the sentence uses. */
  matched: readonly string[];
}

/** The entry ids a ruling's own text names: its closed words and derivations. */
export function idsNamedBy(context: LinkContext, text: string): string[] {
  const out: string[] = [];
  for (const t of linkLine(context, text)) {
    if (t.link.kind !== 'entry' || t.link.via !== undefined) continue;
    for (const r of t.link.refs) {
      const named = NAMED.has(r.namespace) || r.namespace === 'derivation';
      if (named && !out.includes(r.id)) out.push(r.id);
    }
  }
  return out;
}

export function candidateExamples(
  data: LearnData,
  context: LinkContext,
  ref: string,
  limit = 5,
): Candidate[] {
  const concept = data.concepts.get(`rule:${ref}`);
  if (concept === undefined) return [];
  const named = idsNamedBy(context, `${concept.title} ${concept.description}`);
  if (named.length === 0) return [];
  return unique(
    data.examples.filter((e) => e.english !== null),
    (e) => e.key,
  )
    .map((example) => ({ example, matched: named.filter((id) => example.ids.includes(id)) }))
    .filter((c) => c.matched.length > 0 && !c.example.concepts.includes(concept.id))
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        a.example.liraasa.length - b.example.liraasa.length ||
        (a.example.key < b.example.key ? -1 : 1),
    )
    .slice(0, limit);
}
