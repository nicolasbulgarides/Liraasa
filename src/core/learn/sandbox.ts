/**
 * The Loom Sandbox (Hall Phase 6): pick the pieces of a clause and see it put
 * together, with every rule involved.
 *
 * What can be picked, and where it goes, is read from the data:
 *
 *   the pieces    pronouns; headwords with a meaningful root, verb or
 *                 adjective form; the noun phrase's determiners (the
 *                 alternatives in `grammar.noun_phrase`, e.g. [li|eli|ola|…]);
 *                 one menu per clause slot that has words of its own
 *   the order     each piece at its slot number (`grammar.slots`): subject,
 *                 operators, verb, object, the clause-final words
 *   noun phrase   determiner · adjective · noun · plural suffix, as the template
 *                 orders them; the plural suffix is the one `morphology.suffixes`
 *                 glosses as plural
 *
 * The sandbox builds; it does not judge. The page runs the result through the
 * grammar checker and shows what it says. The English line is the words'
 * glosses side by side, offered as a reading, never as a translation.
 */
import type { EntryId } from '../model/types';
import { CLAUSE, NOUN_PHRASE, formConcept, slotConcept, suffixConcept } from './concepts';
import type { FormsEngine, Morph } from './forms';
import type { ConceptId, LearnData, LearnItem } from './types';

export interface NounSpec {
  id: EntryId;
  /** A determiner from the noun-phrase template (functionWord id). */
  determiner?: EntryId;
  /** A headword whose adjective form describes the noun. */
  adjective?: EntryId;
  plural?: boolean;
}

export interface SandboxSpec {
  subject?: NounSpec;
  verb?: EntryId;
  object?: NounSpec;
  /** Slot concept id → the word chosen for it. */
  ops: Readonly<Record<ConceptId, EntryId>>;
}

export type PieceRole = 'subject' | 'verb' | 'object' | 'operator';

export interface SandboxPiece {
  text: string;
  /** Punctuation written right after the word: the pause after a frame word. */
  after?: string;
  gloss: string;
  /** Grammatical tags shown under the gloss: the form, PL. */
  tags: readonly string[];
  role: PieceRole;
  /** The entry this word is, for a link to its card. */
  id: EntryId;
  /** The word split at its morpheme boundaries, when it was built by a rule. */
  parts: readonly Morph[];
}

/** Why a rule is listed: what in the sentence it governs. */
export type RuleReason =
  | 'template'
  | 'subject'
  | 'verb'
  | 'object'
  | 'slot'
  | 'form'
  | 'noun-phrase'
  | 'plural';

export interface SandboxRule {
  id: ConceptId;
  title: string;
  reason: RuleReason;
  /** The word the rule is about, when it is one word. */
  word?: string;
}

export interface SandboxResult {
  pieces: readonly SandboxPiece[];
  /** The sentence, capitalised, with a full stop or a question mark. */
  line: string;
  /** The glosses side by side: a reading, not a translation. */
  reading: string;
  rules: readonly SandboxRule[];
  /** True when there is no verb: the line is not a clause yet. */
  incomplete: boolean;
}

/* ----------------------------------------------------------- the choices */

export interface SlotMenu {
  id: ConceptId;
  title: string;
  slot: number;
  words: readonly { id: EntryId; spelling: string; meaning: string }[];
}

export interface WordChoice {
  id: EntryId;
  spelling: string;
  meaning: string;
  known: boolean;
}

export interface SandboxMenus {
  pronouns: readonly WordChoice[];
  nouns: readonly WordChoice[];
  verbs: readonly WordChoice[];
  adjectives: readonly WordChoice[];
  determiners: readonly WordChoice[];
  /** Operator slots, in template order. */
  slots: readonly SlotMenu[];
  /** The plural suffix, when the data glosses one as plural: shown as a switch. */
  plural: { spelling: string; meaning: string } | null;
}

/** Slots that are filled by phrases, not by a word from a list. */
const PHRASE_SLOTS = new Set(['SUBJECT', 'VERB', 'OBJECT', 'ADJUNCTS', 'TOPIC']);

/** A slot whose note in the data says its word is followed by a pause takes a comma. */
const PAUSE = /followed by a pause/i;

const formGloss = (item: LearnItem, slot: string): string | null => {
  const f = item.forms.find((x) => x.slot === slot);
  return f?.meaningful === true ? f.gloss : null;
};

/** The determiners the noun-phrase template offers: single words in its `[a|b|c]` group. */
function determinersOf(data: LearnData): LearnItem[] {
  const template = data.concepts.get(NOUN_PHRASE)?.description ?? '';
  const group = /\[([^\]]*\|[^\]]*)\]/.exec(template)?.[1] ?? '';
  const spellings = group
    .split('|')
    .map((s) => s.trim())
    .filter((s) => /^[a-z-]+$/.test(s));
  const out: LearnItem[] = [];
  for (const sp of spellings) {
    const it = [...data.items.values()].find((i) => i.kind === 'functionWord' && i.spelling === sp);
    if (it !== undefined) out.push(it);
  }
  return out;
}

/** The suffix the data glosses as plural. */
const pluralOf = (forms: FormsEngine): { spelling: string; meaning: string } | null =>
  forms.rules.suffixes.find((s) => /^plural\b/i.test(s.meaning)) ?? null;

/**
 * What the learner can pick. Words they have met come first and are marked;
 * then the most-used words of the data, so the menus stay short.
 */
export function sandboxMenus(
  data: LearnData,
  forms: FormsEngine,
  known: ReadonlySet<EntryId>,
  perList = 60,
): SandboxMenus {
  const heads = [...data.items.values()].filter((i) => i.kind === 'root' || i.kind === 'compound');
  const use = (id: EntryId): number => {
    const f = data.frequency.get(id);
    return f === undefined ? 0 : f.corpus * 2 + f.examples;
  };
  const choose = (pool: LearnItem[], gloss: (i: LearnItem) => string | null): WordChoice[] => {
    const withGloss = pool
      .map((i) => ({ i, g: gloss(i) }))
      .filter((x): x is { i: LearnItem; g: string } => x.g !== null && x.g !== '');
    const mine = withGloss.filter((x) => known.has(x.i.id));
    const rest = withGloss
      .filter((x) => !known.has(x.i.id))
      .sort((a, b) => use(b.i.id) - use(a.i.id) || (a.i.spelling < b.i.spelling ? -1 : 1))
      .slice(0, Math.max(0, perList - mine.length));
    return [...mine, ...rest]
      .map((x) => ({ id: x.i.id, spelling: x.i.spelling, meaning: x.g, known: known.has(x.i.id) }))
      .sort((a, b) => (a.spelling < b.spelling ? -1 : 1));
  };
  const slots: SlotMenu[] = [...data.concepts.values()]
    .filter((c) => c.kind === 'slot' && c.slot !== undefined && !PHRASE_SLOTS.has(c.id.slice(5)))
    .map((c) => ({
      id: c.id,
      title: c.title,
      slot: c.slot ?? 0,
      words: c.words
        .map((w) => data.items.get(w))
        .filter((w): w is LearnItem => w !== undefined && w.kind === 'functionWord')
        .filter((w, i, all) => all.findIndex((x) => x.spelling === w.spelling) === i)
        .map((w) => ({ id: w.id, spelling: w.spelling, meaning: w.meaning })),
    }))
    .filter((m) => m.words.length > 0)
    .sort((a, b) => a.slot - b.slot);
  return {
    pronouns: [...data.items.values()]
      .filter((i) => i.kind === 'pronoun')
      .map((i) => ({ id: i.id, spelling: i.spelling, meaning: i.meaning, known: true })),
    nouns: choose(heads, (i) => formGloss(i, 'root')),
    verbs: choose(heads, (i) => formGloss(i, 'verb')),
    adjectives: choose(heads, (i) => formGloss(i, 'adjective')),
    determiners: determinersOf(data).map((i) => ({
      id: i.id,
      spelling: i.spelling,
      meaning: i.meaning,
      known: true,
    })),
    slots,
    plural: pluralOf(forms),
  };
}

/* ------------------------------------------------------------- building */

const slotNumber = (data: LearnData, name: string): number =>
  data.concepts.get(slotConcept(name))?.slot ?? 0;

export function buildSandbox(
  data: LearnData,
  forms: FormsEngine,
  spec: SandboxSpec,
): SandboxResult {
  const placed: { at: number; sub: number; piece: SandboxPiece }[] = [];
  const rules: SandboxRule[] = [
    { id: CLAUSE, title: data.concepts.get(CLAUSE)?.title ?? CLAUSE, reason: 'template' },
  ];
  const rule = (id: ConceptId, reason: RuleReason, word?: string): void => {
    if (!data.concepts.has(id) || rules.some((r) => r.id === id && r.word === word)) return;
    rules.push({
      id,
      title: data.concepts.get(id)?.title ?? id,
      reason,
      ...(word !== undefined ? { word } : {}),
    });
  };
  const plural = pluralOf(forms);

  const formOf = (id: EntryId, slot: 'root' | 'verb' | 'adjective'): SandboxPiece | null => {
    const w = forms.getForms(id, { includeUnused: true, examples: 0 });
    const f = w?.forms.find((x) => x.category === slot);
    if (w === null || f === undefined) return null;
    return {
      text: f.form,
      gloss: f.meaningful ? f.gloss : w.root.gloss,
      tags: slot === 'root' ? [] : [slot],
      role: 'operator',
      id,
      parts: f.parts,
    };
  };

  const nounPhrase = (np: NounSpec, role: 'subject' | 'object', at: number): void => {
    const item = data.items.get(np.id);
    if (item === undefined) return;
    let sub = 0;
    const put = (piece: SandboxPiece): void => {
      placed.push({ at, sub, piece: { ...piece, role } });
      sub += 1;
    };
    if (item.kind === 'pronoun') {
      put({ text: item.spelling, gloss: item.meaning, tags: [], role, id: item.id, parts: [] });
      return;
    }
    const det = np.determiner === undefined ? undefined : data.items.get(np.determiner);
    if (det !== undefined) {
      put({ text: det.spelling, gloss: det.meaning, tags: [], role, id: det.id, parts: [] });
      rule(NOUN_PHRASE, 'noun-phrase', det.spelling);
    }
    if (np.adjective !== undefined) {
      const adj = formOf(np.adjective, 'adjective');
      if (adj !== null) {
        put(adj);
        rule(formConcept('adjective'), 'form', adj.text);
        rule(NOUN_PHRASE, 'noun-phrase', adj.text);
      }
    }
    const noun = formOf(np.id, 'root');
    if (noun === null) return;
    if (np.plural === true && plural !== null) {
      put({
        ...noun,
        text: noun.text + plural.spelling,
        tags: ['PL'],
        parts: [...noun.parts, { text: plural.spelling, role: 'marker' }],
      });
      rule(suffixConcept(plural.spelling), 'plural', noun.text + plural.spelling);
    } else {
      put(noun);
    }
  };

  if (spec.subject !== undefined) {
    nounPhrase(spec.subject, 'subject', slotNumber(data, 'SUBJECT'));
    rule(slotConcept('SUBJECT'), 'subject');
  }
  if (spec.verb !== undefined) {
    const v = formOf(spec.verb, 'verb');
    if (v !== null) {
      placed.push({ at: slotNumber(data, 'VERB'), sub: 0, piece: { ...v, role: 'verb' } });
      rule(slotConcept('VERB'), 'verb', v.text);
      rule(formConcept('verb'), 'form', v.text);
    }
  }
  if (spec.object !== undefined) {
    nounPhrase(spec.object, 'object', slotNumber(data, 'OBJECT'));
    rule(slotConcept('OBJECT'), 'object');
  }
  for (const [slot, id] of Object.entries(spec.ops)) {
    const c = data.concepts.get(slot);
    const w = data.items.get(id);
    if (c?.kind !== 'slot' || w === undefined || !c.words.includes(id)) continue;
    placed.push({
      at: c.slot ?? 0,
      sub: 0,
      piece: {
        text: w.spelling,
        gloss: w.meaning,
        tags: [],
        role: 'operator',
        id,
        parts: [],
        // grammar.slots says the frame is "followed by a pause" (and 1.2:G24 keeps its comma)
        ...(PAUSE.test(c.description) ? { after: ',' } : {}),
      },
    });
    rule(slot, 'slot', w.spelling);
  }

  const pieces = placed.sort((a, b) => a.at - b.at || a.sub - b.sub).map((p) => p.piece);
  const question = Object.keys(spec.ops).includes(slotConcept('QUESTION'));
  const words = pieces.map((p) => p.text + (p.after ?? '')).join(' ');
  const line =
    words === '' ? '' : words.charAt(0).toUpperCase() + words.slice(1) + (question ? '?' : '.');
  return {
    pieces,
    line,
    reading: pieces
      .map((p) =>
        p.tags.includes('PL') && plural !== null
          ? `${p.gloss} (${plural.meaning.split(/[\s(]/)[0] ?? ''})`
          : p.gloss,
      )
      .join(' · '),
    rules,
    incomplete: spec.verb === undefined,
  };
}
