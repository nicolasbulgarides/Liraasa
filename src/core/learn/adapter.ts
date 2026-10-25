/**
 * The learning module's data adapter: a read-only view of one edition of the
 * lexicon plus the corpus, keyed by stable id (Learn Phase 1).
 *
 * It never writes to the lexicon. It reads the canonical JSON through the
 * core importer, so the same ids, form index and legacy forms the rest of the
 * workbench uses are what lessons are built on.
 */
import { SUFFIXES } from '../config/morphology';
import { FORM_SLOTS, isUnusedGloss } from '../config/slots';
import { buildIndexes, type LexiconIndexes } from '../model/indexes';
import type { IdMapFile } from '../model/ids';
import { importLexicon } from '../model/importLexicon';
import type { RawLexicon } from '../model/raw';
import { RAW, type EntryId, type Headword, type Lexicon } from '../model/types';
import {
  CLAUSE,
  COMPOUND,
  MOTION,
  NUMBERS,
  deriveConcepts,
  formConcept,
  rulingConcept,
  suffixConcept,
} from './concepts';
import { readCorpus } from './corpus';
import { idsOf, linkLine, textKey, type LinkContext } from './link';
import { EMPTY_OVERRIDES } from './overrides';
import type {
  Concept,
  ConceptId,
  CorpusFile,
  CorpusText,
  ExampleSource,
  Gap,
  LearnData,
  LearnExample,
  LearnItem,
  LinkedToken,
  Overrides,
} from './types';

export interface LearnInput {
  /** The canonical lexicon JSON of one edition. */
  lexicon: RawLexicon;
  /** Corpus files and stored writings. */
  corpus?: readonly CorpusFile[];
  /** Proper names attested in texts (data/checker/names.json). */
  names?: readonly string[];
  overrides?: Overrides;
  /** The id sidecar, for an edition that does not carry ids inline (1.0, 1.1). */
  ids?: IdMapFile;
  /**
   * English for each pronoun, by form: its subject form, from
   * data/checker/english.json. The lexicon records only person and number.
   */
  pronounEnglish?: Readonly<Record<string, string>>;
}

/** The full learning view, plus the core model it was read through. */
export interface LearnSource {
  data: LearnData;
  lexicon: Lexicon;
  indexes: LexiconIndexes;
  context: LinkContext;
  /** A retired or respelled spelling → the id that now stands for it (legacy records). */
  replacementFor: (spelling: string) => string | undefined;
}

function headwordItem(
  h: Headword,
  indexes: LexiconIndexes,
  edition: string,
  gaps: Gap[],
  colourIds: ReadonlyMap<string, EntryId> = new Map(),
  timeIds: ReadonlyMap<string, EntryId> = new Map(),
): LearnItem {
  const forms = FORM_SLOTS.map((slot) => ({
    slot,
    form: h.forms[slot],
    gloss: h.glosses[slot],
    meaningful: !isUnusedGloss(h.glosses[slot]),
  }));
  const meaning =
    forms.find((f) => f.slot === 'root' && f.meaningful)?.gloss ??
    forms.find((f) => f.meaningful)?.gloss ??
    '';
  if (meaning === '') {
    gaps.push({
      severity: 'error',
      code: 'item-no-meaning',
      ref: h.id,
      message: `${h.spelling} has no meaningful gloss in any of its seven forms.`,
    });
  }
  let components: [EntryId, EntryId] | null = null;
  if (h.components !== null) {
    // the modifier may be a colour base (2.0:G38) or a time noun (3.2:G142): it links to that entry
    const ids = h.components.map(
      // a time noun may also be the head (3.5): felra + deya
      (c, i) =>
        indexes.headwordBySpelling.get(c)?.id ?? (i === 0 ? colourIds.get(c) : timeIds.get(c)),
    );
    const [modifier, head] = ids;
    if (modifier !== undefined && head !== undefined) {
      components = [modifier, head];
    } else {
      gaps.push({
        severity: 'error',
        code: 'compound-component-missing',
        ref: h.id,
        message: `${h.spelling} is built from ${h.components.join(' + ')}, but not every part is a headword.`,
      });
    }
  }
  const raw = h[RAW] as unknown as Record<string, unknown>;
  const status = raw[`status_${edition.replace('.', '_')}`];
  return {
    id: h.id,
    kind: h.type === 'compound' ? 'compound' : 'root',
    spelling: h.spelling,
    meaning,
    theme: h.domain,
    register: h.register,
    forms,
    synonyms: h.englishSynonyms,
    components,
    usedIn: (indexes.byComponent.get(h.spelling) ?? []).map((u) => u.entryId),
    since: h.since,
    status: typeof status === 'string' ? status : null,
  };
}

function closedItems(
  lexicon: Lexicon,
  pronounEnglish: Readonly<Record<string, string>>,
  indexes: LexiconIndexes,
): LearnItem[] {
  const base = {
    register: null,
    forms: [],
    synonyms: [],
    components: null,
    usedIn: [],
    status: null,
  } as const;
  return [
    ...lexicon.functionWords.map((w) => ({
      ...base,
      id: w.id,
      kind: 'functionWord' as const,
      spelling: w.form,
      meaning: w.meaning,
      theme: 'Function words',
      since: w.since,
    })),
    ...lexicon.pronouns.map((p) => ({
      ...base,
      id: p.id,
      kind: 'pronoun' as const,
      spelling: p.form,
      meaning: (pronounEnglish[p.form] !== undefined
        ? `${pronounEnglish[p.form] ?? ''} (${p.person}, ${p.number})`
        : `${p.person}, ${p.number}`
      ).toLowerCase(),
      theme: 'Pronouns',
      since: '',
    })),
    ...lexicon.correlatives.map((c) => ({
      ...base,
      id: c.id,
      kind: 'correlative' as const,
      spelling: c.form,
      meaning: c.gloss,
      theme: 'Correlatives',
      since: '',
    })),
    ...lexicon.timeWords.map((t) => ({
      ...base,
      id: t.id,
      kind: 'timeWord' as const,
      spelling: t.form,
      meaning: t.english,
      theme: 'Time words',
      since: '',
      // a time noun may be a compound's modifier (3.2:G142): deya + nole
      usedIn: (indexes.byComponent.get(t.form) ?? []).map((u) => u.entryId),
    })),
    ...lexicon.colors.map((c) => ({
      ...base,
      id: c.id,
      kind: 'color' as const,
      spelling: c.base,
      meaning: c.family.toLowerCase(),
      theme: 'Colours',
      since: '',
      // a colour base may be a compound's modifier (2.0:G38)
      usedIn: (indexes.byComponent.get(c.base) ?? []).map((u) => u.entryId),
    })),
    ...lexicon.discourseParticles.map((d) => ({
      ...base,
      id: d.id,
      kind: 'particle' as const,
      spelling: d.form,
      meaning: d.pragmaticFunction,
      theme: 'Discourse particles',
      since: '',
    })),
  ];
}

/** The concepts a linked sentence exercises. */
function conceptsOf(
  tokens: readonly LinkedToken[],
  items: ReadonlyMap<EntryId, LearnItem>,
  wordToSlot: ReadonlyMap<EntryId, ConceptId>,
  concepts: ReadonlyMap<ConceptId, Concept>,
  structural: readonly ConceptId[],
): ConceptId[] {
  const out = new Set<ConceptId>();
  let verb = false;
  for (const t of tokens) {
    if (t.link.kind === 'number') out.add(NUMBERS);
    if (t.link.kind !== 'entry') continue;
    if (t.link.via === 'motion') out.add(MOTION);
    if (t.link.via === 'plural') out.add(suffixConcept(SUFFIXES.ri.spelling));
    if (t.link.via === 'diminutive') out.add(suffixConcept(SUFFIXES.ti.spelling));
    for (const r of t.link.refs) {
      if (r.slot !== undefined) {
        out.add(formConcept(r.slot));
        if (r.slot === 'verb') verb = true;
      }
      if (r.derivation !== undefined) out.add(suffixConcept(r.derivation));
      const k = items.get(r.id)?.kind;
      if (k === 'compound' || k === 'imageCompound' || r.namespace === 'imageCompound')
        out.add(COMPOUND);
      const slot = wordToSlot.get(r.id);
      if (slot !== undefined) out.add(slot);
    }
  }
  if (verb || [...out].some((c) => c.startsWith('slot:'))) {
    out.add(CLAUSE);
    for (const c of structural) out.add(c);
  }
  return [...out].filter((c) => concepts.has(c));
}

export function buildLearnSource(input: LearnInput): LearnSource {
  const overrides = input.overrides ?? EMPTY_OVERRIDES;
  const { lexicon } = importLexicon(
    input.lexicon,
    input.ids !== undefined ? { ids: input.ids } : {},
  );
  const indexes = buildIndexes(lexicon);
  const edition = lexicon.version;
  const gaps: Gap[] = [];

  const numbers = new Map<string, number>();
  for (const [value, word] of Object.entries(input.lexicon.numbers.lookup_0_999)) {
    numbers.set(word.toLowerCase(), Number(value));
  }
  const names = new Set((input.names ?? []).map((n) => n.toLowerCase()));
  const motionPrefixes = Object.keys(
    (input.lexicon.motion_prefixes as { canon?: Record<string, string> } | undefined)?.canon ?? {},
  );
  const context: LinkContext = { indexes, numbers, names, motionPrefixes };

  /* items */
  const items = new Map<EntryId, LearnItem>();
  // a compound's modifier that is not a headword: a colour base (2.0:G38) or a time noun (3.2:G142)
  const timeIds = new Map(lexicon.timeWords.map((t) => [t.form, t.id] as const));
  const colourIds = new Map([
    ...lexicon.timeWords.map((t) => [t.form, t.id] as const),
    ...lexicon.colors.map((c) => [c.base, c.id] as const),
  ]);
  for (const h of lexicon.headwords)
    items.set(h.id, headwordItem(h, indexes, edition, gaps, colourIds, timeIds));
  // attested image compounds keep their ids: a learner's cards on them stay live (2.0:G40)
  for (const h of lexicon.imageCompounds?.attested ?? []) {
    items.set(h.id, {
      ...headwordItem(h, indexes, edition, gaps, colourIds, timeIds),
      kind: 'imageCompound',
    });
  }
  const patternReadings = new Map<EntryId, string>();
  for (const pair of indexes.patternPairs.values()) {
    if (pair.attested === null) patternReadings.set(pair.id, pair.reading);
  }
  for (const item of closedItems(lexicon, input.pronounEnglish ?? {}, indexes))
    items.set(item.id, item);

  /* concepts */
  const derived = deriveConcepts(lexicon, input.lexicon, indexes, overrides);
  gaps.push(...derived.gaps);
  const concepts = derived.concepts;
  const wordToSlot = new Map<EntryId, ConceptId>();
  for (const c of concepts.values()) {
    if (c.kind === 'slot' || c.kind === 'nounPhrase') {
      for (const id of c.words) if (!wordToSlot.has(id)) wordToSlot.set(id, c.id);
    }
  }
  // a slot that names no closed word (SUBJECT, OBJECT) is structure: any clause exercises it
  const structural = [...concepts.values()]
    .filter((c) => c.kind === 'slot' && c.words.length === 0)
    .map((c) => c.id);

  /* examples, from every place the data keeps sentences */
  const examples: LearnExample[] = [];
  const seen = new Map<string, LearnExample>();
  const unknown = new Map<string, number>();
  const addExample = (
    liraasa: string,
    english: string | null,
    source: ExampleSource,
    extra: { ruleRef?: string; where?: string; tokens?: readonly LinkedToken[] } = {},
  ): void => {
    const text = liraasa.trim();
    const key = textKey(text);
    if (text === '') return;
    const earlier = seen.get(key);
    if (earlier !== undefined && source !== 'corpus') {
      // one sentence may illustrate two rulings: it exercises both
      const rule = extra.ruleRef !== undefined ? rulingConcept(extra.ruleRef) : undefined;
      if (rule !== undefined && !earlier.concepts.includes(rule)) {
        (earlier.concepts as ConceptId[]).push(rule);
      }
      return;
    }
    const tokens = extra.tokens ?? linkLine(context, text);
    for (const t of tokens) {
      if (t.link.kind === 'unknown') unknown.set(t.text, (unknown.get(t.text) ?? 0) + 1);
    }
    const linked = conceptsOf(tokens, items, wordToSlot, concepts, structural);
    if (extra.ruleRef !== undefined) linked.unshift(rulingConcept(extra.ruleRef));
    const example: LearnExample = {
      key,
      liraasa: text,
      english: english === null || english.trim() === '' ? null : english.trim(),
      source,
      ...(extra.ruleRef !== undefined ? { ruleRef: extra.ruleRef } : {}),
      ...(extra.where !== undefined ? { where: extra.where } : {}),
      tokens,
      ids: idsOf(tokens),
      concepts: linked,
    };
    examples.push(example);
    if (earlier === undefined) seen.set(key, example);
  };

  for (const r of lexicon.rulings) {
    for (const e of r.examples) addExample(e.liraasa, e.english, 'ruling', { ruleRef: r.ref });
  }
  for (const e of lexicon.examples) {
    if (e.isLive && e.status !== 'formula') addExample(e.liraasa, e.english, 'examples');
  }
  for (const w of lexicon.functionWords) {
    if (w.example) addExample(w.example, w.exampleGloss ?? null, 'functionWord');
    // stored as [liraasa, english] pairs, whatever the model's type says
    for (const e of (w.examples ?? []) as unknown[]) {
      const [liraasa, english] = Array.isArray(e)
        ? (e as unknown[])
        : [(e as { liraasa?: unknown }).liraasa, (e as { english?: unknown }).english];
      if (typeof liraasa === 'string') {
        addExample(liraasa, typeof english === 'string' ? english : null, 'functionWord');
      }
    }
  }
  for (const d of lexicon.discourseParticles) {
    for (const e of d.examples) addExample(e.liraasa, e.english, 'particle');
  }

  /* the corpus */
  const texts: CorpusText[] = [];
  for (const file of input.corpus ?? []) {
    const read = readCorpus(context, file);
    texts.push(read.text);
    gaps.push(...read.gaps);
    for (const line of read.text.lines) {
      addExample(line.liraasa, line.english, 'corpus', {
        where: `${file.id}:${String(line.n)}`,
        tokens: line.tokens,
      });
    }
  }

  /* frequency: how often each entry occurs, and each compound credits its parts */
  const frequency = new Map<EntryId, { corpus: number; examples: number }>();
  const bump = (id: EntryId, corpus: boolean): void => {
    const f = frequency.get(id) ?? { corpus: 0, examples: 0 };
    if (corpus) f.corpus += 1;
    else f.examples += 1;
    frequency.set(id, f);
  };
  for (const e of examples) {
    for (const id of e.ids) {
      bump(id, e.source === 'corpus');
      for (const part of items.get(id)?.components ?? []) bump(part, e.source === 'corpus');
    }
  }

  /* sentences the author confirmed for a ruling the data gives no examples */
  const byKey = new Map(examples.map((e) => [e.key, e]));
  for (const [ref, keys] of Object.entries(overrides.rulingExamples)) {
    const concept = rulingConcept(ref);
    for (const key of keys) {
      const e = byKey.get(key);
      if (e === undefined || !concepts.has(concept)) {
        gaps.push({
          severity: 'error',
          code: 'override-unknown-example',
          ref,
          message: `rulingExamples for ${ref} names ${key}, which is no sentence${concepts.has(concept) ? '' : ' (and no such ruling)'} in ${edition}. The sentence may have changed.`,
        });
        continue;
      }
      if (!e.concepts.includes(concept)) (e.concepts as ConceptId[]).push(concept);
    }
  }

  if (unknown.size > 0) {
    const list = [...unknown].sort((a, b) => b[1] - a[1]);
    gaps.push({
      severity: 'note',
      code: 'unknown-words',
      ref: 'corpus',
      message: `${String(list.length)} spellings in examples and texts link to no entry, number or name, so lessons skip them: ${list
        .slice(0, 30)
        .map(([w, n]) => `${w}×${String(n)}`)
        .join(', ')}${list.length > 30 ? ', …' : ''}`,
    });
  }

  const data: LearnData = {
    edition,
    items,
    concepts,
    examples,
    texts,
    frequency,
    numbers,
    names,
    patternReadings,
    gaps,
  };
  const replacementFor = (spelling: string): string | undefined => {
    const m = indexes.legacyForms.get(spelling);
    if (m === undefined || m.isPhrase) return undefined;
    return indexes.headwordBySpelling.get(m.to)?.id;
  };
  return { data, lexicon, indexes, context, replacementFor };
}

export function buildLearnData(input: LearnInput): LearnData {
  return buildLearnSource(input).data;
}
