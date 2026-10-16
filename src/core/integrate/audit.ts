/**
 * Independent verification of an integrated lexicon.
 *
 * Deliberately **not** a reuse of the integration code: it re-derives every
 * spelling from the output file and checks it against the 1.0 baseline, so a
 * bug in `integrate.ts` cannot hide behind a shared helper. The integration
 * prompt asks for exactly this, plus a confirmation that nothing in 1.0 moved.
 */
import { DECLARED_DISTANCE_1_PAIRS, editDistance, syllableCount } from '../config/phonology';
import { DERIVATION_KEYS, isBlockedDerivation } from '../config/morphology';
import { FORM_SLOTS, SLOT_RAW_KEY } from '../config/slots';
import { colorGrid } from '../generate/colors';
import { sevenForms } from '../morphology/sevenForms';
import type { RawHeadword, RawLexicon } from '../model/raw';

export interface AuditFinding {
  check: string;
  detail: string;
}

export interface AuditReport {
  passed: boolean;
  findings: AuditFinding[];
  counts: {
    headwords: number;
    primalRoots: number;
    compounds: number;
    newEntries: number;
    newPrimalRoots: number;
    newCompounds: number;
    forms: number;
    distinctForms: number;
  };
  /** Checks that ran and found nothing. Named so a pass is auditable. */
  clean: string[];
}

const CONSONANTS = new Set('lmnrsvybdptghzkcfj');
const VOWELS = new Set('aeiou');

function slotValues(block: unknown): Record<string, string> {
  return block as Record<string, string>;
}

/** Every spelling an entry occupies, across all seven slots. */
function formsOf(h: RawHeadword): string[] {
  const block = slotValues(h.forms);
  return FORM_SLOTS.map((s) => block[SLOT_RAW_KEY[s]] ?? '');
}

/** All closed-class spellings: function words, pronouns, correlatives, etc. */
function closedClassSpellings(lex: RawLexicon): Set<string> {
  const out = new Set<string>();
  for (const f of lex.function_words) {
    for (const part of f.form.split(' / ')) {
      const p = part.trim();
      if (p.length > 0 && !p.includes(' ')) out.add(p);
    }
  }
  for (const p of lex.pronouns) out.add(p.form);
  for (const c of lex.correlatives) out.add(c.form);
  for (const t of lex.time_and_dates) if (!t.form.includes(' ')) out.add(t.form);
  for (const r of lex.numbers.rules) {
    const s = String(r.Liraasa);
    if (!s.includes(' ')) out.add(s);
  }
  for (const d of lex.discourse_particles) out.add(d.form);
  for (const cell of colorGrid()) out.add(cell.form);
  return out;
}

/** Spellings reserved by the legacy record and the sound ledger. */
function reservedSpellings(lex: RawLexicon): Set<string> {
  const out = new Set<string>();
  for (const r of [...lex.legacy.retired_roots, ...lex.legacy.respelled_roots]) {
    for (const v of Object.values(slotValues(r.old_forms))) out.add(v);
  }
  for (const r of lex.legacy.retired_compounds) out.add(r.old);
  for (const s of lex.sound_ledger) out.add(s.spelling);
  return out;
}

export function auditIntegration(baseline: RawLexicon, next: RawLexicon): AuditReport {
  const findings: AuditFinding[] = [];
  const clean: string[] = [];
  const add = (check: string, details: string[]): void => {
    if (details.length === 0) clean.push(check);
    else for (const d of details.slice(0, 40)) findings.push({ check, detail: d });
  };

  const baseByRoot = new Map(baseline.headwords.map((h) => [h.root, h]));
  const nextByRoot = new Map(next.headwords.map((h) => [h.root, h]));
  const newEntries = next.headwords.filter((h) => !baseByRoot.has(h.root));

  /* ---------------------------------------- 1.0 is untouched */

  {
    const details: string[] = [];
    if (next.headwords.length < baseline.headwords.length) {
      details.push('the new lexicon has fewer headwords than the baseline');
    }
    for (let i = 0; i < baseline.headwords.length; i += 1) {
      const before = baseline.headwords[i];
      const after = next.headwords[i];
      if (before === undefined || after === undefined) continue;
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        details.push(`headword ${String(i)} (${before.root}) changed`);
      }
    }
    add('1.0 headwords unchanged, in order', details);
  }

  {
    // Grammar and every closed class must be identical, by deep comparison.
    const frozen = [
      'phonology',
      'morphology',
      'motion_prefixes',
      'grammar',
      'function_words',
      'pronouns',
      'correlatives',
      'numbers',
      'time_and_dates',
      'colors',
      'discourse_particles',
      'rulings_1_0',
      'rulings_0_8_carried',
      'legacy',
      'sound_ledger',
      'dispositions',
      'settled_open_questions_0_8',
      'snapshot_0_8',
      'changelog_1_0',
      'rhyme_families',
    ] as const;
    const details: string[] = [];
    for (const key of frozen) {
      const a = JSON.stringify((baseline as unknown as Record<string, unknown>)[key]);
      const b = JSON.stringify((next as unknown as Record<string, unknown>)[key]);
      if (a !== b) details.push(`${key} changed`);
    }
    add('grammar and closed classes unchanged', details);
  }

  {
    const details: string[] = [];
    const n = baseline.examples.length;
    for (let i = 0; i < n; i += 1) {
      if (JSON.stringify(baseline.examples[i]) !== JSON.stringify(next.examples[i])) {
        details.push(`example ${String(i)} changed`);
      }
    }
    add('existing examples unchanged (new ones appended only)', details);
  }

  {
    const details: string[] = [];
    const keysA = Object.keys(baseline);
    const keysB = Object.keys(next);
    if (keysA.join(',') !== keysB.join(',')) {
      details.push(`top-level keys differ: ${keysB.filter((k) => !keysA.includes(k)).join(',')}`);
    }
    add('top-level key set and order unchanged', details);
  }

  /* ---------------------------------------- new material is well formed */

  {
    const details: string[] = [];
    const counts = new Map<string, number>();
    for (const h of next.headwords) counts.set(h.root, (counts.get(h.root) ?? 0) + 1);
    for (const [root, n] of counts) if (n > 1) details.push(`${root} appears ${String(n)} times`);
    add('no duplicate headwords', details);
  }

  {
    // Every form regenerates from the 1.0 rule, re-derived here.
    const details: string[] = [];
    for (const h of newEntries) {
      const expected = sevenForms(h.root);
      const block = slotValues(h.forms);
      for (const slot of FORM_SLOTS) {
        const stored = block[SLOT_RAW_KEY[slot]];
        if (stored !== expected[slot]) {
          details.push(`${h.root}.${slot}: ${String(stored)} != ${expected[slot]}`);
        }
      }
    }
    add('new forms follow the 1.0 verb rule', details);
  }

  const allForms = new Map<string, string[]>();
  for (const h of next.headwords) {
    for (const [i, f] of formsOf(h).entries()) {
      const owners = allForms.get(f) ?? [];
      owners.push(`${h.root}.${FORM_SLOTS[i] ?? '?'}`);
      allForms.set(f, owners);
    }
  }

  {
    const details: string[] = [];
    for (const [form, owners] of allForms) {
      if (owners.length > 1) details.push(`${form}: ${owners.join(', ')}`);
    }
    add('no form collisions across the whole lexicon', details);
  }

  {
    // Derivation collisions, with the same exemption the 1.0 validator applies:
    // a compound declaring components [base, suffix] agrees on the morphemes.
    const lexicalised = new Set(Object.keys(next.morphology.lexicalised_derivations));
    const details: string[] = [];
    for (const h of next.headwords) {
      for (const d of DERIVATION_KEYS) {
        if (isBlockedDerivation(h.root, d)) continue;
        const derived = h.root + d;
        const owners = allForms.get(derived);
        if (owners === undefined) continue;
        if (lexicalised.has(derived)) continue;
        const owner = nextByRoot.get(derived);
        const agrees =
          owner?.components !== null &&
          owner?.components !== undefined &&
          owner.components.length === 2 &&
          owner.components[0] === h.root &&
          owner.components[1] === d;
        if (!agrees) details.push(`${h.root}+-${d} = ${derived}, owned by ${owners.join(', ')}`);
      }
    }
    add('no derivation collides with a form, except where the morphemes agree', details);
  }

  {
    const closed = closedClassSpellings(next);
    const details: string[] = [];
    for (const h of newEntries) {
      for (const f of formsOf(h)) {
        if (closed.has(f)) details.push(`${h.root}: ${f} is a closed-class spelling`);
      }
    }
    add('no new form collides with a closed-class word', details);
  }

  {
    const reserved = reservedSpellings(next);
    const details: string[] = [];
    for (const h of newEntries) {
      for (const f of formsOf(h)) {
        if (reserved.has(f)) details.push(`${h.root}: ${f} is a reserved spelling`);
      }
    }
    add('no new form reuses a reserved spelling', details);
  }

  {
    // New roots must fit the 1.0 new-root template.
    const details: string[] = [];
    for (const h of newEntries) {
      if (h.type !== 'Primal') continue;
      const w = h.root;
      if (syllableCount(w) !== 2) details.push(`${w}: ${String(syllableCount(w))} syllables`);
      if (!CONSONANTS.has(w[0] ?? '')) details.push(`${w}: not consonant-initial`);
      if (!VOWELS.has(w[w.length - 1] ?? '')) details.push(`${w}: not vowel-final`);
      const first2 = w.slice(0, 2);
      if (
        CONSONANTS.has(w[0] ?? '') &&
        CONSONANTS.has(w[1] ?? '') &&
        first2 !== 'kr' &&
        first2 !== 'tr'
      ) {
        details.push(`${w}: initial cluster ${first2}`);
      }
      for (let i = 0; i + 2 < w.length; i += 1) {
        const tri = w.slice(i, i + 3);
        if ([...tri].every((c) => CONSONANTS.has(c))) details.push(`${w}: cluster ${tri}`);
      }
      for (let i = 0; i + 1 < w.length; i += 1) {
        if (w[i] === w[i + 1]) details.push(`${w}: doubled letter ${w.slice(i, i + 2)}`);
      }
    }
    add('new roots fit the 1.0 phonotactic template', details);
  }

  {
    // Proximity: a new root must be at least two edits from every active
    // spelling, outside the declared exemptions.
    const declared = new Set(
      DECLARED_DISTANCE_1_PAIRS.map((p) =>
        [...p].sort((a, b) => a.localeCompare(b)).join('\u0000'),
      ),
    );
    const active = new Set<string>([...allForms.keys(), ...closedClassSpellings(next)]);
    const details: string[] = [];
    for (const h of newEntries) {
      if (h.type !== 'Primal') continue;
      for (const s of active) {
        if (s === h.root || s.includes('-')) continue;
        if (editDistance(h.root, s, 1) <= 1) {
          const key = [h.root, s].sort((a, b) => a.localeCompare(b)).join('\u0000');
          if (!declared.has(key)) details.push(`${h.root} ~ ${s}`);
        }
      }
    }
    add('new roots are at least two edits from every active spelling', details);
  }

  {
    // Compounds: exactly two active headword components, spelling exact.
    const details: string[] = [];
    for (const h of newEntries) {
      if (h.type !== 'Compound') {
        if (h.components !== null) details.push(`${h.root}: primal with components`);
        continue;
      }
      const c = h.components;
      if (c === null || c.length !== 2) {
        details.push(`${h.root}: components ${JSON.stringify(c)}`);
        continue;
      }
      if (c.join('') !== h.root) details.push(`${h.root}: spelling != ${c.join('+')}`);
      for (const part of c) {
        if (!nextByRoot.has(part)) details.push(`${h.root}: component ${part} is not a headword`);
      }
    }
    add('new compounds join exactly two active headwords', details);
  }

  {
    // Dependency order: a component must appear before its compound.
    const index = new Map(next.headwords.map((h, i) => [h.root, i]));
    const details: string[] = [];
    for (const h of newEntries) {
      if (h.components === null) continue;
      const here = index.get(h.root) ?? -1;
      for (const part of h.components) {
        const there = index.get(part) ?? -1;
        if (there > here) details.push(`${h.root} precedes its component ${part}`);
      }
    }
    add('every component appears before the compound that uses it', details);
  }

  {
    // Cycles.
    const details: string[] = [];
    const walk = (root: string, path: string[]): void => {
      if (path.includes(root)) {
        details.push([...path, root].join(' -> '));
        return;
      }
      const h = nextByRoot.get(root);
      if (h?.components === null || h?.components === undefined) return;
      for (const part of h.components) walk(part, [...path, root]);
    };
    for (const h of next.headwords) if (h.components !== null) walk(h.root, []);
    add('no compound dependency cycles', [...new Set(details)]);
  }

  {
    // Segmentation ambiguity: more than one valid two-headword split.
    const heads = new Set(next.headwords.map((h) => h.root));
    const details: string[] = [];
    for (const h of newEntries) {
      if (h.components === null) continue;
      const w = h.root;
      const splits: string[] = [];
      for (let i = 2; i < w.length - 1; i += 1) {
        if (heads.has(w.slice(0, i)) && heads.has(w.slice(i))) {
          splits.push(`${w.slice(0, i)}+${w.slice(i)}`);
        }
      }
      if (splits.length > 1) {
        details.push(
          `${w}: declared ${h.components.join('+')}, also splits as ${splits.join(', ')}`,
        );
      }
    }
    add('no new compound has more than one valid two-headword split', details);
  }

  {
    // Required metadata on every new entry.
    const details: string[] = [];
    for (const h of newEntries) {
      const rec = h as unknown as Record<string, unknown>;
      for (const field of ['root', 'type', 'forms', 'glosses', 'register', 'domain', 'notes']) {
        if (rec[field] === undefined || rec[field] === '')
          details.push(`${h.root}: missing ${field}`);
      }
      if (rec.since !== '1.1') details.push(`${h.root}: since is ${String(rec.since)}`);
      if (rec.status_1_1 !== 'NEW')
        details.push(`${h.root}: status_1_1 is ${String(rec.status_1_1)}`);
      if (rec.protected !== true) details.push(`${h.root}: not protected`);
      if (h.register !== 'everyday' && h.register !== 'poetic') {
        details.push(`${h.root}: register ${h.register}`);
      }
      const synonyms = h.english_synonyms;
      if (!Array.isArray(synonyms) || synonyms.length === 0) {
        details.push(`${h.root}: no synonyms`);
      }
      const rootGloss = slotValues(h.glosses)[SLOT_RAW_KEY.root];
      if (rootGloss === undefined || rootGloss.startsWith('—')) {
        details.push(`${h.root}: root gloss is unused`);
      }
    }
    add('new entries carry complete metadata', details);
  }

  const primalRoots = next.headwords.filter((h) => h.type === 'Primal').length;

  return {
    passed: findings.length === 0,
    findings,
    counts: {
      headwords: next.headwords.length,
      primalRoots,
      compounds: next.headwords.length - primalRoots,
      newEntries: newEntries.length,
      newPrimalRoots: newEntries.filter((h) => h.type === 'Primal').length,
      newCompounds: newEntries.filter((h) => h.type === 'Compound').length,
      forms: next.headwords.length * FORM_SLOTS.length,
      distinctForms: allForms.size,
    },
    clean,
  };
}
