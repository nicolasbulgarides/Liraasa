/**
 * Linking text to the lexicon: every word of a sentence to the entry ids it
 * can be, in the reader's order — exact spelling (with the 1.0:G19 legacy
 * forms), a number, a `-ri` plural or `-ti` diminutive of an entry, a proper
 * name, or unknown. Unknown is reported, never guessed.
 */
import { SUFFIXES } from '../config/morphology';
import { spellFraction, spellNumber, spellOrdinal } from '../generate/numbers';
import { resolveSpelling, type LexiconIndexes } from '../model/indexes';
import type { LinkedToken, TokenLink } from './types';

export interface LinkContext {
  indexes: LexiconIndexes;
  numbers: ReadonlyMap<string, number>;
  /** Proper names, lowercased. */
  names: ReadonlySet<string>;
  /** The canon motion prefixes, with their hyphen (motion_prefixes.canon). */
  motionPrefixes: readonly string[];
}

/** Namespaces a `-ri` / `-ti` ending may attach to: nouns, pronouns, time words. */
const NOMINAL = new Set(['headword', 'derivation', 'pronoun', 'timeWord']);

/** How the number rules join an ordinal and a fraction, read off the generator. */
const ORDINAL_MARK = spellOrdinal(1).slice(spellNumber(1).length);
const FRACTION_JOIN = spellFraction(1, 2).slice(spellNumber(1).length, -spellNumber(2).length);

const WORD = /[A-Za-z]+(?:-[A-Za-z]+)*/g;

/** Words of a line with their offsets; punctuation and (parenthetical notes) are dropped. */
export function words(text: string): { text: string; start: number; end: number }[] {
  const masked = text.replace(/\([^)]*\)|\[[^\]]*\]/g, (m) => ' '.repeat(m.length));
  return [...masked.matchAll(WORD)].map((m) => ({
    text: m[0],
    start: m.index,
    end: m.index + m[0].length,
  }));
}

function entry(ctx: LinkContext, spelling: string): TokenLink | null {
  const r = resolveSpelling(ctx.indexes, spelling);
  if (r.refs.length === 0) return null;
  const refs = r.refs.map((f) => ({
    id: f.entryId,
    namespace: f.namespace,
    ...(f.slot !== undefined ? { slot: f.slot } : {}),
    ...(f.derivation !== undefined ? { derivation: f.derivation } : {}),
  }));
  if (r.viaLegacy !== undefined) {
    return { kind: 'entry', refs, via: 'legacy', legacyFrom: r.viaLegacy.from };
  }
  return { kind: 'entry', refs };
}

/** An entry under a suffix: the stem must be nominal (suffix order: -ti, then -ri). */
function suffixed(ctx: LinkContext, lower: string): TokenLink | null {
  const plural = SUFFIXES.ri.spelling;
  const diminutive = SUFFIXES.ti.spelling;
  for (const [suffix, via] of [
    [plural, 'plural'],
    [diminutive, 'diminutive'],
  ] as const) {
    if (!lower.endsWith(suffix) || lower.length <= suffix.length + 2) continue;
    let stem = lower.slice(0, -suffix.length);
    let link = entry(ctx, stem);
    if (link === null && suffix === plural && stem.endsWith(diminutive)) {
      stem = stem.slice(0, -diminutive.length);
      link = entry(ctx, stem);
    }
    if (link === null || link.kind !== 'entry') continue;
    const refs = link.refs.filter((r) => NOMINAL.has(r.namespace));
    if (refs.length > 0) return { kind: 'entry', refs, via };
  }
  return null;
}

export function linkWord(ctx: LinkContext, text: string): TokenLink {
  const lower = text.toLowerCase();
  const exact = entry(ctx, lower);
  if (exact !== null) return exact;
  const value = ctx.numbers.get(lower);
  if (value !== undefined) return { kind: 'number', value };
  if (lower.endsWith(ORDINAL_MARK)) {
    const n = ctx.numbers.get(lower.slice(0, -ORDINAL_MARK.length));
    if (n !== undefined) return { kind: 'number', value: n, form: 'ordinal' };
  }
  // a fraction written as one hyphenated word: NUMERATOR-de-DENOMINATOR
  const joined = FRACTION_JOIN.trim().replace(/^/, '-') + '-';
  const cut = lower.indexOf(joined);
  if (cut > 0) {
    const top = ctx.numbers.get(lower.slice(0, cut));
    const bottom = ctx.numbers.get(lower.slice(cut + joined.length));
    if (top !== undefined && bottom !== undefined && bottom !== 0) {
      return { kind: 'number', value: top / bottom, form: 'fraction' };
    }
  }
  const viaSuffix = suffixed(ctx, lower);
  if (viaSuffix !== null) return viaSuffix;
  // a motion prefix on a verb: the verb is the entry, the prefix is reported with it
  for (const prefix of ctx.motionPrefixes) {
    if (!lower.startsWith(prefix)) continue;
    const verb = entry(ctx, lower.slice(prefix.length));
    if (verb !== null && verb.kind === 'entry') {
      const refs = verb.refs.filter((r) => r.slot === 'verb');
      if (refs.length > 0) return { kind: 'entry', refs, via: 'motion', prefix };
    }
  }
  const diminutive = SUFFIXES.ti.spelling;
  if (
    ctx.names.has(lower) ||
    (lower.endsWith(diminutive) && ctx.names.has(lower.slice(0, -diminutive.length)))
  ) {
    return { kind: 'name' };
  }
  return { kind: 'unknown' };
}

export function linkLine(ctx: LinkContext, text: string): LinkedToken[] {
  return words(text).map((w) => ({ ...w, link: linkWord(ctx, w.text) }));
}

/** Entry ids a linked line uses, each once, in order. */
export function idsOf(tokens: readonly LinkedToken[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    if (t.link.kind !== 'entry') continue;
    for (const r of t.link.refs) if (!out.includes(r.id)) out.push(r.id);
  }
  return out;
}

/** The share of a line's words that link to something: entry, number or name. */
export function linkedShare(tokens: readonly LinkedToken[]): number {
  if (tokens.length === 0) return 0;
  return tokens.filter((t) => t.link.kind !== 'unknown').length / tokens.length;
}

/** FNV-1a, 32 bits, hex: a stable key for a sentence that has no id. */
export function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text.normalize('NFC').trim()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'ex:' + h.toString(16).padStart(8, '0');
}
