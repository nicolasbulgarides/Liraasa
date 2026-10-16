/**
 * Compounds: MODIFIER + HEAD, written together, head rightmost.
 *
 * Nesting is real, not hypothetical: `mudusomubiti` is `mudu` + `somubiti`,
 * and `somubiti` is itself `somu` + `biti`.
 */
import { COMPOUND_ARITY, FIXED_WORDS, INFERRED_COMPONENTS } from '../config/morphology';
import { verbClassOf, type VerbClass } from './sevenForms';

export interface CompoundParts {
  modifier: string;
  head: string;
}

export function spellCompound(parts: CompoundParts): string {
  return parts.modifier + parts.head;
}

export function partsOf(components: readonly string[]): CompoundParts {
  if (components.length !== COMPOUND_ARITY) {
    throw new Error(
      `a compound has ${String(COMPOUND_ARITY)} components, got ${String(components.length)}`,
    );
  }
  const [modifier, head] = components as readonly [string, string];
  return { modifier, head };
}

/**
 * A compound's verb class follows the first letter of the whole word, which is
 * its modifier's first letter. This is why changing a modifier's initial
 * consonant cascades into every compound built on it.
 */
export function compoundVerbClass(parts: CompoundParts): VerbClass {
  return verbClassOf(spellCompound(parts));
}

/** Whether the 1.0 build inferred this compound's split from its spelling (Q5). */
export function hasInferredComponents(spelling: string): boolean {
  return INFERRED_COMPONENTS.includes(spelling);
}

/** The note to badge a fixed word with, if it is one. */
export function fixedWordNote(spelling: string): string | undefined {
  return FIXED_WORDS[spelling];
}

/**
 * Expand a compound to its primal roots, following nesting.
 *
 * @param lookup components of a spelling, or `null`/`undefined` if it is primal.
 */
export function primalRootsOf(
  spelling: string,
  lookup: (s: string) => readonly string[] | null | undefined,
  seen: ReadonlySet<string> = new Set(),
): string[] {
  if (seen.has(spelling)) throw new Error(`component cycle at ${spelling}`);
  const components = lookup(spelling);
  if (components === null || components === undefined || components.length === 0) {
    return [spelling];
  }
  const nextSeen = new Set(seen).add(spelling);
  return components.flatMap((c) => primalRootsOf(c, lookup, nextSeen));
}

/** Depth of nesting. A primal is 0; `somubiti` is 1; `mudusomubiti` is 2. */
export function nestingDepth(
  spelling: string,
  lookup: (s: string) => readonly string[] | null | undefined,
  seen: ReadonlySet<string> = new Set(),
): number {
  if (seen.has(spelling)) throw new Error(`component cycle at ${spelling}`);
  const components = lookup(spelling);
  if (components === null || components === undefined || components.length === 0) return 0;
  const nextSeen = new Set(seen).add(spelling);
  return 1 + Math.max(...components.map((c) => nestingDepth(c, lookup, nextSeen)));
}
