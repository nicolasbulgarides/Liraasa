/**
 * Synonym derivation for new 1.1 entries.
 *
 * The proposal supplies no synonym lists, only a policy: "Generate only
 * accurate English synonyms; do not pad with invented or nonspecific terms."
 *
 * So synonyms are derived **from the entry's own glosses** — the author's own
 * words, split on the separators the glosses already use. Nothing is invented
 * and nothing is padded, which matters because 1.0's own padded synonym lists
 * are what produced most of the false overlap reports during the audit
 * (`folninevlo`, a snow image, lists "weather" and "climate").
 */
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss } from '../config/slots';
import type { RawSlots } from '../model/raw';

/** Phrases too generic to carry meaning on their own. */
const NON_SPECIFIC = new Set([
  'a',
  'an',
  'the',
  'to',
  'of',
  'not',
  'etc',
  'thing',
  'stuff',
  'something',
]);

function clean(phrase: string): string {
  return phrase
    .replace(/—/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,;.\s]+|[,;.\s]+$/g, '');
}

/**
 * Split a gloss into its candidate senses.
 *
 * Semicolons separate distinct senses and are always split. Commas are split
 * only when the gloss has no semicolon, because 1.0 uses commas inside a single
 * sense ("Self, I, Myself, Me, My") as often as between senses.
 */
export function senses(gloss: string): string[] {
  const parts = gloss.includes(';') ? gloss.split(';') : gloss.split(',');
  return parts.map(clean).filter((p) => p.length > 2 && !NON_SPECIFIC.has(p.toLowerCase()));
}

/**
 * Derive the synonym list for an entry from its glossed slots.
 *
 * Order is slot order, then order within the gloss, so the output is
 * deterministic. Duplicates are dropped case-insensitively, keeping the first
 * spelling seen.
 */
export function deriveSynonyms(glosses: RawSlots): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const slot of FORM_SLOTS) {
    const gloss = (glosses as unknown as Record<string, string>)[SLOT_RAW_KEY[slot]];
    if (gloss === undefined || isUnusedGloss(gloss)) continue;

    for (const sense of senses(gloss)) {
      const key = sense.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(sense);
    }
  }

  return out;
}
