/**
 * Form generation: the verb rule and the seven forms.
 *
 * Concatenation is literal. There is no elision, so `dorva + asa` is
 * `dorvaasa` with a double `a`, and `amor + asa` is `amorasa`.
 */
import { VERB_RULE, isVowel } from '../config/morphology';
import { FORM_SLOTS, SLOT_SUFFIX, type FormSlot } from '../config/slots';

export type Forms = Record<FormSlot, string>;

/**
 * Build the verb form of a spelling.
 *
 * Checked in order: the `opi` irregular, then `n`-initial, `s`-initial,
 * vowel-initial, otherwise first consonant + `a`. Only the first letter of the
 * whole word counts, so a compound takes the class of its modifier.
 */
export function verbOf(spelling: string): string {
  const irregular = VERB_RULE.irregular[spelling];
  if (irregular !== undefined) return irregular;

  const first = spelling[0];
  if (first === undefined) throw new Error('verbOf: empty spelling');

  if (first === 'n') return spelling + VERB_RULE.nInitial;
  if (first === 's') return spelling + VERB_RULE.sInitial;
  if (isVowel(first)) return spelling + VERB_RULE.vowelInitial;
  return spelling + first + 'a';
}

/** Which branch of the verb rule a spelling takes. Used by the impact preview. */
export type VerbClass = 'irregular' | 'n-initial' | 's-initial' | 'vowel-initial' | 'consonant';

export function verbClassOf(spelling: string): VerbClass {
  if (VERB_RULE.irregular[spelling] !== undefined) return 'irregular';
  const first = spelling[0];
  if (first === undefined) throw new Error('verbClassOf: empty spelling');
  if (first === 'n') return 'n-initial';
  if (first === 's') return 's-initial';
  if (isVowel(first)) return 'vowel-initial';
  return 'consonant';
}

/** Build one slot from a spelling. */
export function formOf(spelling: string, slot: FormSlot): string {
  const suffix = SLOT_SUFFIX[slot];
  return suffix === null ? verbOf(spelling) : spelling + suffix;
}

/** Build all seven forms from a spelling. */
export function sevenForms(spelling: string): Forms {
  const out = {} as Forms;
  for (const slot of FORM_SLOTS) out[slot] = formOf(spelling, slot);
  return out;
}

/**
 * Compare generated forms with stored ones.
 *
 * Every 1.0 headword carries `protected: true`, so a stored spelling is canon
 * and a disagreement is a finding, never something to correct (SPEC §5.1).
 */
export interface FormMismatch {
  spelling: string;
  slot: FormSlot;
  stored: string;
  generated: string;
}

export function diffForms(spelling: string, stored: Forms): FormMismatch[] {
  const generated = sevenForms(spelling);
  const out: FormMismatch[] = [];
  for (const slot of FORM_SLOTS) {
    if (stored[slot] !== generated[slot]) {
      out.push({ spelling, slot, stored: stored[slot], generated: generated[slot] });
    }
  }
  return out;
}
